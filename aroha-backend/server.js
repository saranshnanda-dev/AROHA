const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = 'aroha_sih2026_secret_key';

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const db = new sqlite3.Database('./aroha.db', (err) => {
  if (err) console.error('Database connection error:', err);
  else console.log('Connected to SQLite database: aroha.db');
});

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
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
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS game_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    game_id TEXT,
    difficulty TEXT,
    score INTEGER,
    total INTEGER,
    moves INTEGER,
    completion_time INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    title TEXT,
    time TEXT,
    completed INTEGER DEFAULT 0
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS recommendations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    activity TEXT,
    reason TEXT,
    difficulty TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_id INTEGER,
    target_user_id INTEGER,
    action TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    type TEXT,
    title TEXT,
    message TEXT,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    related_id INTEGER
  )`);
  
  db.run(`CREATE TABLE IF NOT EXISTS caregiver_connections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    elderly_id INTEGER,
    caregiver_id INTEGER,
    status TEXT DEFAULT 'PENDING',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Safe migrations
  const safeMigrations = [
    // Users table migrations
    "ALTER TABLE users ADD COLUMN simple_mode INTEGER DEFAULT 0",
    "ALTER TABLE users ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP",
    "ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'ACTIVE'",
    "ALTER TABLE users ADD COLUMN avatar TEXT",
    "ALTER TABLE users ADD COLUMN voice_enabled INTEGER DEFAULT 1",
    "ALTER TABLE users ADD COLUMN notify_games INTEGER DEFAULT 1",
    "ALTER TABLE users ADD COLUMN notify_reminders INTEGER DEFAULT 1",
    "ALTER TABLE users ADD COLUMN notify_recs INTEGER DEFAULT 1",
    "ALTER TABLE users ADD COLUMN caregiver_code TEXT",
    
    // Activity Logs migrations
    "ALTER TABLE activity_logs ADD COLUMN admin_id INTEGER",
    "ALTER TABLE activity_logs ADD COLUMN target_user_id INTEGER",
    "ALTER TABLE activity_logs ADD COLUMN action TEXT",

    // Game Sessions migrations (FIXING THE GAME DATA ERROR)
    "ALTER TABLE game_sessions ADD COLUMN total INTEGER DEFAULT 1",
    "ALTER TABLE game_sessions ADD COLUMN moves INTEGER DEFAULT 0",
    "ALTER TABLE game_sessions ADD COLUMN completion_time INTEGER DEFAULT 0"
  ];

  safeMigrations.forEach(stmt => {
    db.run(stmt, () => {});
  });

  // Ensure demo accounts exist
  const hashPassword = bcrypt.hashSync('demo123', 8);
  const insertUser = db.prepare("INSERT OR IGNORE INTO users (id, name, email, password, role, status) VALUES (?, ?, ?, ?, ?, 'ACTIVE')");
  insertUser.run(1, 'Eleanor Vance', 'elder@aroha.demo', hashPassword, 'ELDERLY');
  insertUser.run(2, 'Sarah Vance', 'caregiver@aroha.demo', hashPassword, 'CAREGIVER');
  insertUser.run(3, 'Dr. Robert Thorne', 'professional@aroha.demo', hashPassword, 'PROFESSIONAL');
  insertUser.run(4, 'Admin System', 'admin@aroha.demo', hashPassword, 'ADMIN');
  insertUser.finalize();

  db.run(`INSERT OR IGNORE INTO caregiver_connections (id, elderly_id, caregiver_id, status) VALUES (1, 1, 2, 'CONNECTED')`);
});

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access Denied' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid Token' });
    req.user = user;
    next();
  });
};

const authorizeRole = (...roles) => {
  return (req, res, next) => {
    const userRole = (req.user.role || '').toUpperCase();
    if (!roles.includes(userRole)) return res.status(403).json({ message: 'Forbidden' });
    next();
  };
};

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;

function addNotification(user_id, type, title, message) {
  db.get(`SELECT notify_games, notify_reminders, notify_recs FROM users WHERE id = ?`, [user_id], (err, prefs) => {
    if (!prefs) return;
    if (type === 'GAME' && prefs.notify_games === 0) return;
    if (type === 'REMINDER' && prefs.notify_reminders === 0) return;
    if (type === 'RECOMMENDATION' && prefs.notify_recs === 0) return;
    db.run(`INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)`, [user_id, type, title, message]);
  });
}

function logActivity(adminId, targetId, actionStr) {
  db.run(`INSERT INTO activity_logs (admin_id, target_user_id, action) VALUES (?, ?, ?)`, [adminId, targetId, actionStr], () => {});
}

// ==========================================
// AUTH & PROFILE
// ==========================================
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, user) => {
    if (err || !user) return res.status(400).json({ message: 'User not found' });
    if (user.status === 'INACTIVE') return res.status(403).json({ message: 'Account deactivated. Please contact support.' });
    const passwordIsValid = bcrypt.compareSync(password, user.password);
    if (!passwordIsValid) return res.status(401).json({ message: 'Invalid Credentials' });
    
    const token = jwt.sign({ id: user.id, name: user.name, role: user.role.toUpperCase() }, JWT_SECRET, { expiresIn: '24h' });
    delete user.password;
    user.role = user.role.toUpperCase();
    user.status = user.status || 'ACTIVE';
    res.json({ token, user });
  });
});

app.post('/api/auth/signup', (req, res) => {
  const { name, email, password, role } = req.body;
  const safeRole = (role && role.toUpperCase() === 'CAREGIVER') ? 'CAREGIVER' : 'ELDERLY';
  if (!passwordRegex.test(password)) return res.status(400).json({ message: 'Password must be at least 8 chars long with upper, lower, number, and special character.' });
  
  db.get(`SELECT id FROM users WHERE email = ?`, [email], (err, row) => {
    if (row) return res.status(400).json({ message: 'An account with this email already exists.' });
    const hashPassword = bcrypt.hashSync(password, 8);
    db.run(`INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, ?, 'ACTIVE')`, [name, email, hashPassword, safeRole], function(err) {
      if (err) return res.status(500).json({ message: 'Database error' });
      res.json({ message: 'Account created successfully' });
    });
  });
});

app.get('/api/profile', authenticateToken, (req, res) => {
  db.get(`SELECT id, name, email, role, language, font_size, high_contrast, simple_mode, status, avatar, voice_enabled, notify_games, notify_reminders, notify_recs, created_at FROM users WHERE id = ?`, [req.user.id], (err, user) => {
    if (err || !user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  });
});

app.put('/api/profile', authenticateToken, (req, res) => {
  const { name, language } = req.body;
  db.run(`UPDATE users SET name = ?, language = ? WHERE id = ?`, [name, language, req.user.id], (err) => {
    if (err) return res.status(500).json({ message: 'Failed to update profile' });
    res.json({ message: 'Profile updated successfully' });
  });
});

app.put('/api/profile/avatar', authenticateToken, (req, res) => {
  const { avatar } = req.body;
  db.run(`UPDATE users SET avatar = ? WHERE id = ?`, [avatar, req.user.id], (err) => res.json({ message: 'Photo updated' }));
});

app.put('/api/profile/password', authenticateToken, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!passwordRegex.test(newPassword)) return res.status(400).json({ message: 'New password does not meet security requirements.' });
  db.get(`SELECT password FROM users WHERE id = ?`, [req.user.id], (err, user) => {
    if (!user || !bcrypt.compareSync(currentPassword, user.password)) return res.status(401).json({ message: 'Incorrect current password.' });
    const hashPassword = bcrypt.hashSync(newPassword, 8);
    db.run(`UPDATE users SET password = ? WHERE id = ?`, [hashPassword, req.user.id], (err) => res.json({ message: 'Password changed successfully.' }));
  });
});

app.put('/api/users/settings', authenticateToken, (req, res) => {
  const { language, font_size, high_contrast, simple_mode, voice_enabled, notify_games, notify_reminders, notify_recs } = req.body;
  db.run(`UPDATE users SET language=?, font_size=?, high_contrast=?, simple_mode=?, voice_enabled=?, notify_games=?, notify_reminders=?, notify_recs=? WHERE id=?`, 
    [language, font_size, high_contrast ? 1 : 0, simple_mode ? 1 : 0, voice_enabled ? 1 : 0, notify_games ? 1 : 0, notify_reminders ? 1 : 0, notify_recs ? 1 : 0, req.user.id], 
    (err) => res.json({ message: 'Settings updated' })
  );
});

// Notifications
app.get('/api/notifications', authenticateToken, (req, res) => {
  db.all(`SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`, [req.user.id], (err, rows) => res.json(rows || []));
});
app.put('/api/notifications/read-all', authenticateToken, (req, res) => { 
  db.run(`UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0`, [req.user.id], () => res.json({ success: true })); 
});
app.put('/api/notifications/:id/read', authenticateToken, (req, res) => { 
  db.run(`UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`, [req.params.id, req.user.id], () => res.json({ success: true })); 
});
app.delete('/api/notifications/:id', authenticateToken, (req, res) => { 
  db.run(`DELETE FROM notifications WHERE id = ? AND user_id = ?`, [req.params.id, req.user.id], () => res.json({ success: true })); 
});

// ==========================================
// CAREGIVER <-> ELDERLY CONNECTIONS
// ==========================================
function generateCaregiverCode(userId, cb) {
  const code = 'AROHA-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  db.run(`UPDATE users SET caregiver_code = ? WHERE id = ?`, [code, userId], (err) => {
    cb(code);
  });
}

app.get('/api/caregiver/connection-info', authenticateToken, authorizeRole('CAREGIVER'), (req, res) => {
  db.get(`SELECT caregiver_code FROM users WHERE id = ?`, [req.user.id], (err, user) => {
    const sendResponse = (c) => {
      db.all(`
        SELECT cc.id, u.name as elderly_name, u.avatar 
        FROM caregiver_connections cc
        JOIN users u ON cc.elderly_id = u.id
        WHERE cc.caregiver_id = ? AND cc.status = 'PENDING'
      `, [req.user.id], (err, requests) => {
        res.json({ code: c, requests: requests || [] });
      });
    };
    if (!user || !user.caregiver_code) { 
      generateCaregiverCode(req.user.id, sendResponse); 
    } else { 
      sendResponse(user.caregiver_code); 
    }
  });
});

app.post('/api/caregiver/code/regenerate', authenticateToken, authorizeRole('CAREGIVER'), (req, res) => {
  generateCaregiverCode(req.user.id, (code) => res.json({ code }));
});

app.put('/api/caregiver/requests/:id', authenticateToken, authorizeRole('CAREGIVER'), (req, res) => {
  const { action } = req.body; 
  const newStatus = action === 'ACCEPT' ? 'CONNECTED' : 'DECLINED';
  
  db.get(`SELECT elderly_id FROM caregiver_connections WHERE id = ? AND caregiver_id = ?`, [req.params.id, req.user.id], (err, conn) => {
    if (!conn) return res.status(404).json({ error: 'Request not found' });
    db.run(`UPDATE caregiver_connections SET status = ? WHERE id = ?`, [newStatus, req.params.id], (err) => {
      addNotification(conn.elderly_id, 'ACCOUNT', 'Connection Update', `Your caregiver request was ${action.toLowerCase()}ed.`);
      logActivity(req.user.id, conn.elderly_id, `Caregiver connection ${action.toLowerCase()}`);
      res.json({ success: true });
    });
  });
});

app.post('/api/elderly/connect', authenticateToken, authorizeRole('ELDERLY'), (req, res) => {
  let { code } = req.body;
  if (!code) return res.status(400).json({ message: 'Code is required' });
  code = code.trim().toUpperCase();
  
  db.get(`SELECT id, name FROM users WHERE caregiver_code = ? AND UPPER(role) = 'CAREGIVER'`, [code], (err, cg) => {
    if (!cg) return res.status(404).json({ message: 'Invalid caregiver code. Please check and try again.' });
    
    db.get(`SELECT id, status FROM caregiver_connections WHERE elderly_id = ?`, [req.user.id], (err, existing) => {
      if (existing) {
        if (existing.status === 'CONNECTED') return res.status(400).json({ message: 'You are already connected to a caregiver.' });
        if (existing.status === 'PENDING') return res.status(400).json({ message: 'You already have a pending connection request.' });
        db.run(`UPDATE caregiver_connections SET caregiver_id = ?, status = 'PENDING' WHERE id = ?`, [cg.id, existing.id]);
      } else {
        db.run(`INSERT INTO caregiver_connections (elderly_id, caregiver_id, status) VALUES (?, ?, 'PENDING')`, [req.user.id, cg.id]);
      }
      addNotification(cg.id, 'ACCOUNT', 'New Connection Request', `${req.user.name} has requested to connect with you.`);
      logActivity(req.user.id, cg.id, `Sent connection request to caregiver`);
      res.json({ message: 'Request sent successfully.' });
    });
  });
});

app.get('/api/elderly/caregiver', authenticateToken, authorizeRole('ELDERLY'), (req, res) => {
  db.get(`
    SELECT cc.id, cc.status, u.name as caregiver_name, u.avatar 
    FROM caregiver_connections cc
    JOIN users u ON cc.caregiver_id = u.id
    WHERE cc.elderly_id = ? AND cc.status IN ('PENDING', 'CONNECTED')
  `, [req.user.id], (err, row) => {
    res.json(row || null);
  });
});

app.delete('/api/connections/:id', authenticateToken, (req, res) => {
  db.get(`SELECT elderly_id, caregiver_id FROM caregiver_connections WHERE id = ?`, [req.params.id], (err, conn) => {
    if (!conn) return res.status(404).json({ error: 'Connection not found' });
    if (req.user.role === 'ELDERLY' && conn.elderly_id !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });
    if (req.user.role === 'CAREGIVER' && conn.caregiver_id !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });
    
    db.run(`DELETE FROM caregiver_connections WHERE id = ?`, [req.params.id], () => {
      const targetNotify = req.user.role === 'ELDERLY' ? conn.caregiver_id : conn.elderly_id;
      addNotification(targetNotify, 'ACCOUNT', 'Connection Removed', `${req.user.name} has disconnected.`);
      logActivity(req.user.id, targetNotify, `Connection revoked.`);
      res.json({ success: true });
    });
  });
});

// ==========================================
// ELDERLY & GAMES ROUTES
// ==========================================
app.get('/api/reminders', authenticateToken, (req, res) => {
  db.all(`SELECT * FROM reminders WHERE user_id = ? ORDER BY time ASC`, [req.user.id], (err, rows) => res.json(rows || []));
});
app.put('/api/reminders/:id/complete', authenticateToken, (req, res) => {
  db.run(`UPDATE reminders SET completed = 1 WHERE id = ? AND user_id = ?`, [req.params.id, req.user.id], () => res.json({ message: 'Done' }));
});

app.get('/api/elderly/progress', authenticateToken, (req, res) => {
  db.all(`SELECT score, total, DATE(created_at) as date FROM game_sessions WHERE user_id = ?`, [req.user.id], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }
    let bestScore = 0;
    const days = new Set();
    (rows || []).forEach(r => {
      const acc = Math.round((r.score / r.total) * 100);
      if (acc > bestScore) bestScore = acc;
      days.add(r.date);
    });
    res.json({ gamesCompleted: (rows || []).length, bestScore: `${bestScore}%`, activeDays: days.size });
  });
});

app.get('/api/elderly/history', authenticateToken, (req, res) => {
  db.all(`SELECT game_id, score, total, difficulty, created_at FROM game_sessions WHERE user_id = ? ORDER BY created_at DESC LIMIT 10`, [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(rows || []);
  });
});

app.post('/api/games/session', authenticateToken, (req, res) => {
  const { game_id, difficulty, score, total, moves, completion_time } = req.body;
  db.run(`INSERT INTO game_sessions (user_id, game_id, difficulty, score, total, moves, completion_time) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [req.user.id, game_id, difficulty, score, total, moves, completion_time],
    function(err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to save session' });
      }
      const acc = Math.round((score / total) * 100);
      addNotification(req.user.id, 'GAME', 'Activity Completed', `Great job! Your ${game_id.replace('_', ' ')} session completed with ${acc}% accuracy.`);
      
      db.all(`SELECT caregiver_id FROM caregiver_connections WHERE elderly_id = ? AND status = 'CONNECTED'`, [req.user.id], (err, cgs) => {
        if (cgs) cgs.forEach(cg => addNotification(cg.caregiver_id, 'GAME', 'Patient Activity', `${req.user.name} completed ${game_id.replace('_', ' ')}.`));
      });

      let nextActivity = game_id, nextDiff = difficulty, reason = "";
      if (acc >= 85) {
        nextDiff = difficulty === 'Easy' ? 'Medium' : 'Hard';
        if (difficulty === 'Hard') { nextActivity = game_id === 'Memory Match' ? 'Pattern Recognition' : 'Sequence Recall'; nextDiff = 'Medium'; }
        reason = `Great work! You scored ${acc}%. Stepping up difficulty.`;
      } else if (acc >= 60) {
        reason = `Nice consistent performance. Recommended to stay at current level.`;
      } else {
        nextDiff = difficulty === 'Hard' ? 'Medium' : 'Easy';
        reason = `Let's practice at a comfortable pace.`;
      }
      db.run(`INSERT INTO recommendations (user_id, activity, reason, difficulty) VALUES (?, ?, ?, ?)`, [req.user.id, nextActivity, reason, nextDiff], () => {
        addNotification(req.user.id, 'RECOMMENDATION', 'New Recommendation', `Try ${nextActivity.replace('_', ' ')} (${nextDiff}).`);
        res.json({ message: 'Session saved', nextRecommendation: { activity: nextActivity, difficulty: nextDiff, reason } });
      });
    }
  );
});

app.get('/api/recommendations/latest', authenticateToken, (req, res) => {
  db.get(`SELECT * FROM recommendations WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`, [req.user.id], (err, row) => res.json(row || null));
});

// ==========================================
// CAREGIVER & PROFESSIONAL
// ==========================================
app.get('/api/caregiver/patients', authenticateToken, authorizeRole('CAREGIVER'), (req, res) => { 
  db.all(`
    SELECT u.id, u.name, u.email, u.avatar, cc.id as connection_id,
      (SELECT COUNT(*) FROM game_sessions g WHERE g.user_id = u.id) as games_played, 
      (SELECT ROUND(AVG(CAST(score AS FLOAT)/total)*100) FROM game_sessions g WHERE g.user_id = u.id) as avg_accuracy, 
      (SELECT created_at FROM game_sessions g WHERE g.user_id = u.id ORDER BY created_at DESC LIMIT 1) as last_active, 
      (SELECT COUNT(*) FROM reminders r WHERE r.user_id = u.id AND r.completed = 0) as pending_reminders 
    FROM users u 
    JOIN caregiver_connections cc ON u.id = cc.elderly_id
    WHERE cc.caregiver_id = ? AND cc.status = 'CONNECTED' AND UPPER(u.role) = 'ELDERLY'
  `, [req.user.id], (err, rows) => res.json(rows || [])); 
});

app.get('/api/shared/patient/:id', authenticateToken, authorizeRole('CAREGIVER', 'PROFESSIONAL', 'ADMIN'), (req, res) => {
  const patientId = req.params.id;
  const data = {};
  
  if (req.user.role.toUpperCase() === 'CAREGIVER') {
    db.get(`SELECT id FROM caregiver_connections WHERE elderly_id = ? AND caregiver_id = ? AND status = 'CONNECTED'`, [patientId, req.user.id], (err, conn) => {
      if (!conn) return res.status(403).json({ error: 'Unauthorized access to patient data.' });
      fetchPatientData();
    });
  } else {
    fetchPatientData();
  }

  function fetchPatientData() {
    db.get(`SELECT id, name, language, font_size, high_contrast, email, avatar FROM users WHERE id = ? AND UPPER(role) = 'ELDERLY'`, [patientId], (err, user) => {
      if (!user) return res.status(404).json({ error: 'Patient not found' });
      data.profile = user;
      db.all(`SELECT * FROM game_sessions WHERE user_id = ? ORDER BY created_at ASC`, [patientId], (err, sessions) => {
        data.sessions = sessions || [];
        db.all(`SELECT * FROM reminders WHERE user_id = ? ORDER BY time ASC`, [patientId], (err, reminders) => {
          data.reminders = reminders || [];
          db.get(`SELECT * FROM recommendations WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`, [patientId], (err, rec) => { 
            data.recommendation = rec || null; 
            res.json(data); 
          });
        });
      });
    });
  }
});

app.post('/api/caregiver/reminders', authenticateToken, authorizeRole('CAREGIVER', 'ADMIN'), (req, res) => {
  const { user_id, title, time } = req.body;
  db.run(`INSERT INTO reminders (user_id, title, time, completed) VALUES (?, ?, ?, 0)`, [user_id, title, time], function(err) { 
    addNotification(user_id, 'REMINDER', 'New Reminder', `Reminder: "${title}" scheduled for ${time}.`);
    res.json({ id: this.lastID, user_id, title, time, completed: 0 }); 
  });
});
app.delete('/api/caregiver/reminders/:id', authenticateToken, authorizeRole('CAREGIVER', 'ADMIN'), (req, res) => {
  db.run(`DELETE FROM reminders WHERE id = ?`, [req.params.id], function(err) { res.json({ success: true }); });
});
app.put('/api/caregiver/reminders/:id', authenticateToken, authorizeRole('CAREGIVER', 'ADMIN'), (req, res) => {
  const { title, time, completed } = req.body;
  db.run(`UPDATE reminders SET title = ?, time = ?, completed = ? WHERE id = ?`, [title, time, completed ? 1 : 0, req.params.id], function(err) { res.json({ success: true }); });
});

app.get('/api/professional/overview', authenticateToken, authorizeRole('PROFESSIONAL', 'ADMIN'), (req, res) => {
  db.get(`SELECT 
    (SELECT COUNT(*) FROM users WHERE UPPER(role) = 'ELDERLY') as total_patients, 
    (SELECT COUNT(*) FROM game_sessions) as total_sessions, 
    (SELECT ROUND(AVG(CAST(score AS FLOAT)/total)*100) FROM game_sessions) as global_accuracy, 
    (SELECT ROUND(AVG(completion_time)) FROM game_sessions) as global_avg_time`, (err, stats) => {
    db.all(`SELECT u.id, u.name, u.email, u.avatar, 
      COUNT(g.id) as sessions_count, 
      ROUND(AVG(CAST(g.score AS FLOAT)/g.total)*100) as avg_accuracy, 
      ROUND(AVG(g.completion_time)) as avg_time, 
      MAX(g.created_at) as last_active, 
      (SELECT difficulty FROM game_sessions g2 WHERE g2.user_id = u.id ORDER BY created_at DESC LIMIT 1) as current_difficulty 
      FROM users u 
      LEFT JOIN game_sessions g ON u.id = g.user_id 
      WHERE UPPER(u.role) = 'ELDERLY' 
      GROUP BY u.id`, (err, patients) => { 
      res.json({ stats: stats || {}, patients: patients || [] }); 
    });
  });
});

// ==========================================
// ADMIN CONTROL & USER MANAGEMENT (WITH DELETE POWER)
// ==========================================
app.get('/api/admin/stats', authenticateToken, authorizeRole('ADMIN'), (req, res) => {
  db.get(`SELECT 
    (SELECT COUNT(*) FROM users) as total_users, 
    (SELECT COUNT(*) FROM users WHERE UPPER(role)='ELDERLY') as elderly_users, 
    (SELECT COUNT(*) FROM users WHERE UPPER(role)='CAREGIVER') as caregivers, 
    (SELECT COUNT(*) FROM users WHERE UPPER(role)='PROFESSIONAL') as professionals, 
    (SELECT COUNT(*) FROM users WHERE UPPER(role)='ADMIN') as admins, 
    (SELECT COUNT(*) FROM users WHERE status='ACTIVE' OR status IS NULL) as active_users, 
    (SELECT COUNT(*) FROM users WHERE status='INACTIVE') as inactive_users, 
    (SELECT COUNT(*) FROM game_sessions) as games_played, 
    (SELECT COUNT(*) FROM reminders) as reminders_created`, (err, row) => res.json(row || {}));
});

app.get('/api/admin/users', authenticateToken, authorizeRole('ADMIN'), (req, res) => {
  db.all(`SELECT * FROM users ORDER BY id DESC`, (err, rows) => {
    if (err) {
      console.error("Admin fetch users error:", err);
      return res.status(500).json({ message: "Failed to query users", error: err.message });
    }
    const cleanUsers = (rows || []).map(r => {
      const copy = { ...r };
      delete copy.password;
      copy.status = copy.status || 'ACTIVE';
      copy.role = (copy.role || 'ELDERLY').toUpperCase();
      return copy;
    });
    res.json(cleanUsers);
  });
});

app.get('/api/admin/logs', authenticateToken, authorizeRole('ADMIN'), (req, res) => {
  db.all(`
    SELECT id, 'system' as admin_id, user_id as target_user_id, 'Game played: ' || game_id as action, created_at FROM game_sessions 
    UNION ALL 
    SELECT id, admin_id, target_user_id, action, created_at FROM activity_logs 
    ORDER BY created_at DESC LIMIT 100
  `, (err, rows) => { 
    res.json(rows || []); 
  });
});

app.post('/api/admin/users', authenticateToken, authorizeRole('ADMIN'), (req, res) => {
  const { name, email, password, role, language } = req.body;
  if (role !== 'PROFESSIONAL' && role !== 'ADMIN') return res.status(400).json({ message: 'Admins can only create Professional or Administrator accounts.' });
  if (!passwordRegex.test(password)) return res.status(400).json({ message: 'Weak password. Min 8 chars with upper, lower, number, special char.' });
  
  db.get(`SELECT id FROM users WHERE email = ?`, [email], (err, row) => {
    if (row) return res.status(400).json({ message: 'Email already exists.' });
    const hashPassword = bcrypt.hashSync(password, 8);
    db.run(`INSERT INTO users (name, email, password, role, language, status) VALUES (?, ?, ?, ?, ?, 'ACTIVE')`, 
      [name, email, hashPassword, role, language || 'en'], 
      function(err) {
        if (err) return res.status(500).json({ message: 'Database error creating user' });
        const newUserId = this.lastID;
        logActivity(req.user.id, newUserId, `Admin created ${role} account (${email})`);
        res.json({ message: `${role === 'ADMIN' ? 'Administrator' : 'Professional'} account created successfully.` });
      }
    );
  });
});

app.put('/api/admin/users/:id/status', authenticateToken, authorizeRole('ADMIN'), (req, res) => {
  const targetId = req.params.id;
  const { status } = req.body;
  if (status !== 'ACTIVE' && status !== 'INACTIVE') return res.status(400).json({ message: 'Invalid status value.' });

  if (targetId == req.user.id && status === 'INACTIVE') {
    return res.status(400).json({ message: 'You cannot deactivate your own admin account.' });
  }

  db.run(`UPDATE users SET status = ? WHERE id = ?`, [status, targetId], function(err) {
    if (err) return res.status(500).json({ message: 'Database error updating status' });
    logActivity(req.user.id, targetId, `User status updated to ${status}`);
    res.json({ message: `Account status updated to ${status}.` });
  });
});

app.delete('/api/admin/users/:id', authenticateToken, authorizeRole('ADMIN'), (req, res) => {
  const targetId = req.params.id;

  if (targetId == req.user.id) {
    return res.status(400).json({ message: 'Self-deletion is prohibited. You cannot delete your own admin account.' });
  }

  db.get(`SELECT role, name, email FROM users WHERE id = ?`, [targetId], (err, targetUser) => {
    if (!targetUser) return res.status(404).json({ message: 'User not found.' });

    if (targetUser.role.toUpperCase() === 'ADMIN') {
      db.get(`SELECT COUNT(*) as count FROM users WHERE UPPER(role) = 'ADMIN'`, (err, r) => {
        if (r && r.count <= 1) {
          return res.status(400).json({ message: 'Cannot delete the only remaining Administrator account in the system.' });
        }
        executeDeletion();
      });
    } else {
      executeDeletion();
    }

    function executeDeletion() {
      db.run(`DELETE FROM game_sessions WHERE user_id = ?`, [targetId]);
      db.run(`DELETE FROM reminders WHERE user_id = ?`, [targetId]);
      db.run(`DELETE FROM recommendations WHERE user_id = ?`, [targetId]);
      db.run(`DELETE FROM notifications WHERE user_id = ?`, [targetId]);
      db.run(`DELETE FROM caregiver_connections WHERE elderly_id = ? OR caregiver_id = ?`, [targetId, targetId]);

      db.run(`DELETE FROM users WHERE id = ?`, [targetId], function(err) {
        if (err) return res.status(500).json({ message: 'Failed to delete user.' });
        logActivity(req.user.id, targetId, `Deleted user ${targetUser.name} (${targetUser.email})`);
        res.json({ message: `User ${targetUser.name} has been permanently deleted.` });
      });
    }
  });
});

app.use((req, res) => { res.status(404).json({ error: 'Not found' }); });
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
