const { createClient } = require('@libsql/client');

const databaseUrl = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!databaseUrl) {
  throw new Error('TURSO_DATABASE_URL is required. Configure it in the backend environment.');
}

const client = createClient({
  url: databaseUrl,
  authToken
});

function callbackResult(callback, error, value, context) {
  if (typeof callback === 'function') {
    callback.call(context, error, value);
  }
}

function normalizeArgs(args, callback) {
  const values = Array.isArray(args) ? args : [];
  return { values, callback: typeof args === 'function' ? args : callback };
}

const db = {
  get(sql, args, callback) {
    const normalized = normalizeArgs(args, callback);
    client.execute({ sql, args: normalized.values })
      .then(result => callbackResult(normalized.callback, null, result.rows[0]))
      .catch(error => callbackResult(normalized.callback, error));
  },

  all(sql, args, callback) {
    const normalized = normalizeArgs(args, callback);
    client.execute({ sql, args: normalized.values })
      .then(result => callbackResult(normalized.callback, null, result.rows))
      .catch(error => callbackResult(normalized.callback, error));
  },

  run(sql, args, callback) {
    const normalized = normalizeArgs(args, callback);
    client.execute({ sql, args: normalized.values })
      .then(result => {
        const context = {
          lastID: result.lastInsertRowid === undefined ? undefined : Number(result.lastInsertRowid),
          changes: Number(result.rowsAffected || 0)
        };
        callbackResult(normalized.callback, null, undefined, context);
      })
      .catch(error => callbackResult(normalized.callback, error));
  },

  async execute(sql, args = []) {
    return client.execute({ sql, args });
  }
};

const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT UNIQUE,
    password TEXT,
    role TEXT,
    language TEXT DEFAULT 'en',
    font_size TEXT DEFAULT 'text-normal',
    high_contrast INTEGER DEFAULT 0,
    simple_mode INTEGER DEFAULT 0,
    status TEXT DEFAULT 'ACTIVE',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    avatar TEXT,
    voice_enabled INTEGER DEFAULT 1,
    notify_games INTEGER DEFAULT 1,
    notify_reminders INTEGER DEFAULT 1,
    notify_recs INTEGER DEFAULT 1,
    caregiver_code TEXT UNIQUE
  )`,
  `CREATE TABLE IF NOT EXISTS game_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    game_id TEXT,
    difficulty TEXT,
    score INTEGER,
    total INTEGER,
    moves INTEGER,
    completion_time INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    title TEXT,
    time TEXT,
    completed INTEGER DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS recommendations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    activity TEXT,
    reason TEXT,
    difficulty TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    admin_id INTEGER,
    target_user_id INTEGER,
    action TEXT,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    type TEXT,
    title TEXT,
    message TEXT,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    related_id INTEGER
  )`,
  `CREATE TABLE IF NOT EXISTS caregiver_connections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    elderly_id INTEGER,
    caregiver_id INTEGER,
    status TEXT DEFAULT 'PENDING',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`
];

const compatibilityMigrations = [
  'ALTER TABLE users ADD COLUMN simple_mode INTEGER DEFAULT 0',
  'ALTER TABLE users ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP',
  'ALTER TABLE users ADD COLUMN status TEXT DEFAULT \'ACTIVE\'',
  'ALTER TABLE users ADD COLUMN avatar TEXT',
  'ALTER TABLE users ADD COLUMN voice_enabled INTEGER DEFAULT 1',
  'ALTER TABLE users ADD COLUMN notify_games INTEGER DEFAULT 1',
  'ALTER TABLE users ADD COLUMN notify_reminders INTEGER DEFAULT 1',
  'ALTER TABLE users ADD COLUMN notify_recs INTEGER DEFAULT 1',
  'ALTER TABLE users ADD COLUMN caregiver_code TEXT',
  'ALTER TABLE activity_logs ADD COLUMN admin_id INTEGER',
  'ALTER TABLE activity_logs ADD COLUMN target_user_id INTEGER',
  'ALTER TABLE activity_logs ADD COLUMN action TEXT',
  'ALTER TABLE game_sessions ADD COLUMN total INTEGER DEFAULT 1',
  'ALTER TABLE game_sessions ADD COLUMN moves INTEGER DEFAULT 0',
  'ALTER TABLE game_sessions ADD COLUMN completion_time INTEGER DEFAULT 0'
];

async function initializeDatabase() {
  for (const statement of schemaStatements) {
    await client.execute(statement);
  }

  for (const statement of compatibilityMigrations) {
    try {
      await client.execute(statement);
    } catch (error) {
      if (!/duplicate column name/i.test(error.message)) {
        throw error;
      }
    }
  }
}

module.exports = { db, initializeDatabase };
