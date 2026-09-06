require('dotenv').config();

const sqlite3 = require('sqlite3').verbose();
const { createClient } = require('@libsql/client');

const localPath = process.argv[2] || './aroha.db';
const preflightOnly = process.argv.includes('--preflight');
const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) throw new Error('TURSO_DATABASE_URL is required.');
if (!authToken) throw new Error('TURSO_AUTH_TOKEN is required.');

const sqlite = new sqlite3.Database(localPath, sqlite3.OPEN_READONLY);
const turso = createClient({ url, authToken });

function sourceAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    sqlite.all(sql, params, (error, rows) => error ? reject(error) : resolve(rows));
  });
}

function quoteIdentifier(value) {
  return `"${value.replace(/"/g, '""')}"`;
}

function normalizeSql(sql) {
  return sql.replace(/\s+/g, ' ').trim().toLowerCase();
}

async function sourceTables() {
  return sourceAll(
    "SELECT name, sql FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
  );
}

async function tableInfo(read, tableName) {
  return read(`PRAGMA table_info(${quoteIdentifier(tableName)})`);
}

async function tableIndexes(read, tableName) {
  const indexes = await read(`PRAGMA index_list(${quoteIdentifier(tableName)})`);
  const result = [];
  for (const index of indexes) {
    const columns = await read(`PRAGMA index_info(${quoteIdentifier(index.name)})`);
    result.push({
      name: index.name,
      unique: Number(index.unique),
      origin: index.origin,
      columns: columns.map(column => column.name)
    });
  }
  return result.sort((a, b) => a.name.localeCompare(b.name));
}

async function tableForeignKeys(read, tableName) {
  return read(`PRAGMA foreign_key_list(${quoteIdentifier(tableName)})`);
}

async function readSourceTableInfo(tableName) {
  return {
    columns: await tableInfo(sql => sourceAll(sql), tableName),
    indexes: await tableIndexes(sql => sourceAll(sql), tableName),
    foreignKeys: await tableForeignKeys(sql => sourceAll(sql), tableName)
  };
}

async function sourceIndexes(tableName) {
  return sourceAll(
    "SELECT sql FROM sqlite_master WHERE type = 'index' AND tbl_name = ? AND sql IS NOT NULL ORDER BY name",
    [tableName]
  );
}

async function readTargetTableNames() {
  const result = await turso.execute(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
  );
  return result.rows.map(row => row.name);
}

async function readTargetTableInfo(tableName) {
  return {
    columns: await tableInfo(sql => turso.execute(sql).then(result => result.rows), tableName),
    indexes: await tableIndexes(sql => turso.execute(sql).then(result => result.rows), tableName),
    foreignKeys: await tableForeignKeys(sql => turso.execute(sql).then(result => result.rows), tableName)
  };
}

function comparableInfo(info) {
  return JSON.stringify({
    columns: info.columns.map(column => ({
      name: column.name,
      type: column.type,
      notnull: Number(column.notnull),
      pk: Number(column.pk),
      dflt_value: column.dflt_value
    })),
    indexes: info.indexes.map(index => ({
      unique: index.unique,
      origin: index.origin,
      columns: index.columns
    })),
    foreignKeys: info.foreignKeys.map(key => ({
      table: key.table,
      from: key.from,
      to: key.to,
      on_update: key.on_update,
      on_delete: key.on_delete,
      match: key.match
    }))
  });
}

async function sourceRows(tableName) {
  return sourceAll(`SELECT * FROM ${quoteIdentifier(tableName)}`);
}

async function targetRows(tableName) {
  const result = await turso.execute(`SELECT * FROM ${quoteIdentifier(tableName)}`);
  return result.rows;
}

function primaryKeyColumn(info) {
  const keys = info.columns.filter(column => Number(column.pk) > 0);
  if (keys.length !== 1) {
    throw new Error(`Table "${info.tableName}" must have exactly one primary-key column; found ${keys.length}.`);
  }
  return keys[0].name;
}

function safeRowIdentifier(row, primaryKey) {
  return primaryKey ? `${primaryKey}=${String(row[primaryKey])}` : 'unknown primary key';
}

function valuesEqual(left, right) {
  return left === right || (left === null && right === undefined) || (left === undefined && right === null);
}

async function verifyTableData(tableName, sourceInfo) {
  const primaryKey = primaryKeyColumn({ ...sourceInfo, tableName });
  const source = await sourceRows(tableName);
  const target = await targetRows(tableName);
  const sourceById = new Map(source.map(row => [String(row[primaryKey]), row]));
  const targetById = new Map(target.map(row => [String(row[primaryKey]), row]));

  if (source.length !== target.length) {
    throw new Error(`Row count mismatch for "${tableName}": SQLite=${source.length}, Turso=${target.length}, difference=${target.length - source.length}.`);
  }

  for (const row of source) {
    const id = String(row[primaryKey]);
    const targetRow = targetById.get(id);
    if (!targetRow) {
      throw new Error(`Missing row in "${tableName}" (${safeRowIdentifier(row, primaryKey)}).`);
    }
    for (const column of sourceInfo.columns) {
      if (!valuesEqual(row[column.name], targetRow[column.name])) {
        throw new Error(`Data mismatch in "${tableName}" (${safeRowIdentifier(row, primaryKey)}), column "${column.name}".`);
      }
    }
  }

  if (sourceById.size !== targetById.size) {
    throw new Error(`Duplicate or invalid primary-key values detected in "${tableName}".`);
  }

  return { table: tableName, rows: source.length, primaryKey };
}

async function findOrphanedRelationships(tableNames) {
  if (!tableNames.includes('users')) return [];
  const relationships = [];
  for (const tableName of tableNames) {
    const info = await readSourceTableInfo(tableName);
    for (const column of info.columns) {
      if (!['user_id', 'admin_id', 'target_user_id', 'professional_id', 'elderly_id', 'caregiver_id'].includes(column.name)) continue;
      const rows = await sourceAll(
        `SELECT ${quoteIdentifier(column.name)} AS reference_id FROM ${quoteIdentifier(tableName)} WHERE ${quoteIdentifier(column.name)} IS NOT NULL AND NOT EXISTS (SELECT 1 FROM users WHERE users.id = ${quoteIdentifier(tableName)}.${quoteIdentifier(column.name)})`
      );
      if (rows.length) relationships.push({ table: tableName, column: column.name, count: rows.length });
    }
  }
  return relationships;
}

async function inspectTargetState(tables) {
  const targetNames = await readTargetTableNames();
  if (targetNames.length === 0) return { state: 'empty', targetNames };

  const sourceNames = tables.map(table => table.name);
  if (JSON.stringify(targetNames) !== JSON.stringify(sourceNames)) {
    return { state: 'conflicting-or-unrelated', targetNames };
  }

  for (const table of tables) {
    const sourceInfo = await readSourceTableInfo(table.name);
    const targetInfo = await readTargetTableInfo(table.name);
    if (normalizeSql(table.sql) !== normalizeSql((await turso.execute(
      "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = ?",
      [table.name]
    )).rows[0].sql)) {
      return { state: 'schema-mismatch', targetNames, table: table.name };
    }
    if (comparableInfo(sourceInfo) !== comparableInfo(targetInfo)) {
      return { state: 'schema-mismatch', targetNames, table: table.name };
    }
  }

  return { state: 'matching-schema', targetNames };
}

async function executeMigration(tables) {
  const transaction = await turso.transaction('write');
  const progress = [];
  try {
    for (const table of tables) {
      await transaction.execute(table.sql);
      for (const index of await sourceIndexes(table.name)) {
        await transaction.execute(index.sql);
      }
      const info = await readSourceTableInfo(table.name);
      const columns = info.columns.map(column => column.name);
      const placeholders = columns.map(() => '?').join(', ');
      const quotedColumns = columns.map(quoteIdentifier).join(', ');
      const rows = await sourceRows(table.name);
      for (const row of rows) {
        try {
          await transaction.execute({
            sql: `INSERT INTO ${quoteIdentifier(table.name)} (${quotedColumns}) VALUES (${placeholders})`,
            args: columns.map(column => row[column])
          });
        } catch (error) {
          const primaryKey = primaryKeyColumn({ ...info, tableName: table.name });
          throw new Error(`Failed migrating "${table.name}" (${safeRowIdentifier(row, primaryKey)}): ${error.message}`);
        }
      }
      progress.push({ table: table.name, rows: rows.length });
    }
    await transaction.commit();
    return progress;
  } catch (error) {
    await transaction.rollback();
    error.message = `${error.message} No migration changes were committed.`;
    throw error;
  }
}

async function closeSource() {
  return new Promise((resolve, reject) => sqlite.close(error => error ? reject(error) : resolve()));
}

async function main() {
  const tables = await sourceTables();
  if (!tables.length) throw new Error('SQLite source contains no application tables.');

  await turso.execute('SELECT 1');
  const target = await inspectTargetState(tables);
  if (target.state === 'conflicting-or-unrelated' || target.state === 'schema-mismatch') {
    throw new Error(`Refusing to migrate: Turso target state is ${target.state}${target.table ? ` at table "${target.table}"` : ''}.`);
  }

  const orphaned = await findOrphanedRelationships(tables.map(table => table.name));
  if (orphaned.length) {
    throw new Error(`SQLite contains orphaned application relationships: ${orphaned.map(item => `${item.table}.${item.column}=${item.count}`).join(', ')}.`);
  }

  if (target.state === 'matching-schema') {
    const verification = [];
    for (const table of tables) verification.push(await verifyTableData(table.name, await readSourceTableInfo(table.name)));
    console.log('Migration already completed and verified.');
    console.table(verification);
    return;
  }

  if (preflightOnly) {
    console.log('Preflight passed: SQLite is readable, Turso is reachable, the target is empty, and the source schema is valid.');
    return;
  }

  const progress = await executeMigration(tables);
  const verification = [];
  for (const table of tables) verification.push(await verifyTableData(table.name, await readSourceTableInfo(table.name)));
  console.table(progress);
  console.table(verification);
  console.log('Migration completed and all table counts/data were verified.');
}

main()
  .catch(error => {
    console.error(`Turso migration failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(() => closeSource().catch(error => {
    console.error(`Failed to close SQLite source: ${error.message}`);
    process.exitCode = 1;
  }));
