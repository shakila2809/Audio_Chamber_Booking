const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

// Create database connection
const db = new Database(path.join(__dirname, '../database.sqlite'));

// Initialize database tables and default data
const initializeDatabase = () => {
  console.log('📦 Initializing database...');

  // Create Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create Bookings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      booking_date DATE NOT NULL,
      time_slot TEXT NOT NULL CHECK(time_slot IN ('slot1', 'slot2', 'slot3')),
      purpose TEXT NOT NULL,
      additional_notes TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
      approved_by TEXT,
      approval_date DATETIME,
      rejection_reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Create default admin account if not exists
  const adminEmail = 'admin@meta.com';
  const adminExists = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);

  if (!adminExists) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    db.prepare(`
      INSERT INTO users (name, email, password, role)
      VALUES (?, ?, ?, ?)
    `).run('System Admin', adminEmail, hashedPassword, 'admin');
    console.log('✅ Default admin created: admin@meta.com / admin123');
  }

  // Create owner accounts (Praveen Kumar and Karthik)
  const owners = [
    { name: 'Praveen Kumar', email: 'kumpraveen@meta.com' },
    { name: 'Karthik', email: 'karthipai@meta.com' }
  ];

  owners.forEach(owner => {
    const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(owner.email.toLowerCase());
    if (!exists) {
      const hashedPassword = bcrypt.hashSync('owner123', 10);
      db.prepare(`
        INSERT INTO users (name, email, password, role)
        VALUES (?, ?, ?, ?)
      `).run(owner.name, owner.email.toLowerCase(), hashedPassword, 'admin');
      console.log(`✅ Owner account created: ${owner.email} / owner123`);
    }
  });

  console.log('✅ Database initialized successfully!');
};

module.exports = { db, initializeDatabase };
