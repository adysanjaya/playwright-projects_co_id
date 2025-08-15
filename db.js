const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database file path
const DB_PATH = path.join(__dirname, 'projects.db');

// Initialize database
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to SQLite database');
    createTable();
  }
});

// Create projects table if not exists
function createTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      url TEXT UNIQUE NOT NULL,
      content TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  db.run(sql, (err) => {
    if (err) {
      console.error('Error creating table', err.message);
    } else {
      console.log('Projects table is ready');
    }
  });
}

// Check if project exists by URL
function projectExists(url) {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT id FROM projects WHERE url = ?';
    db.get(sql, [url], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(!!row);
      }
    });
  });
}

// Insert new project
function insertProject(project) {
  return new Promise((resolve, reject) => {
    const { title, url, content } = project;
    const sql = 'INSERT INTO projects (title, url, content) VALUES (?, ?, ?)';
    
    db.run(sql, [title, url, content], function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          // Project already exists, update it
          updateProject(project)
            .then(resolve)
            .catch(reject);
        } else {
          reject(err);
        }
      } else {
        console.log(`Project inserted with rowid ${this.lastID}`);
        resolve({ id: this.lastID, ...project });
      }
    });
  });
}

// Update existing project
function updateProject(project) {
  return new Promise((resolve, reject) => {
    const { title, url, content } = project;
    const sql = 'UPDATE projects SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE url = ?';
    
    db.run(sql, [title, content, url], function(err) {
      if (err) {
        reject(err);
      } else {
        console.log(`Project updated: ${url}`);
        resolve({ ...project, changes: this.changes });
      }
    });
  });
}

// Get all projects
function getAllProjects() {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM projects ORDER BY created_at DESC';
    db.all(sql, [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Close the database connection
function close() {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        reject(err);
      } else {
        console.log('Database connection closed');
        resolve();
      }
    });
  });
}

module.exports = {
  projectExists,
  insertProject,
  updateProject,
  getAllProjects,
  close
};
