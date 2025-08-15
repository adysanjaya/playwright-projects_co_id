import Database from 'better-sqlite3';
import { DB_PATH } from '../config/constants.js';
import logger from '../utils/logger.js';

class DatabaseService {
  constructor() {
    this.db = null;
  }

  /**
   * Initialize the database connection and create tables if they don't exist
   * @returns {DatabaseService} - The database service instance
   */
  init() {
    try {
      // Initialize database with WAL mode for better concurrency
      // Note: Don't use fileMustExist: true as it prevents auto-creation of the database file
      this.db = new Database('./projects.db');
      this.db.pragma('journal_mode = WAL');

      this.createTables();
      logger.info('Database initialized');
      return this;
    } catch (error) {
      logger.error('Error initializing database:', error);
      throw error;
    }
  }

  /**
   * Create necessary tables if they don't exist
   * @returns {void}
   */
  createTables() {
    try {
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS projects (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          url TEXT UNIQUE NOT NULL,
          content TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          notified BOOLEAN DEFAULT 0
        )
      `);

      logger.info('Database tables created/verified');
    } catch (error) {
      logger.error('Error creating tables:', error);
      throw error;
    }
  }

  /**
   * Check if a project exists by URL
   * @param {string} url - Project URL
   * @returns {boolean} - Whether the project exists
   */
  projectExists(url) {
    try {
      const stmt = this.db.prepare('SELECT id FROM projects WHERE url = ?');
      const result = stmt.get(url);
      return !!result;
    } catch (error) {
      logger.error('Error checking if project exists:', error);
      throw error;
    }
  }

  /**
   * Insert a new project
   * @param {Object} project - Project data
   * @returns {number|null} - Inserted project ID or null if project exists
   */
  insertProject(project) {
    try {
      const stmt = this.db.prepare('INSERT INTO projects (title, url, content) VALUES (?, ?, ?)');

      const info = stmt.run(project.title, project.url, project.content);

      if (info.changes > 0) {
        logger.info(`Project inserted with ID: ${info.lastInsertRowid}`);
        return info.lastInsertRowid;
      }

      return null;
    } catch (error) {
      if (error.message.includes('UNIQUE constraint failed')) {
        logger.info('Project already exists in the database');
        return null;
      }

      logger.error('Error inserting project:', error);
      throw error;
    }
  }

  /**
   * Mark a project as notified
   * @param {number} projectId - Project ID
   * @returns {boolean} - Whether the update was successful
   */
  markAsNotified(projectId) {
    try {
      const stmt = this.db.prepare('UPDATE projects SET notified = 1 WHERE id = ?');
      const result = stmt.run(projectId);

      if (result.changes > 0) {
        logger.info(`Marked project ${projectId} as notified`);
        return true;
      }

      logger.warn(`Project ${projectId} not found`);
      return false;
    } catch (error) {
      logger.error('Error marking project as notified:', error);
      throw error;
    }
  }

  /**
   * Get all projects that haven't been notified yet
   * @returns {Array} - Array of projects
   */
  getUnnotifiedProjects() {
    try {
      const stmt = this.db.prepare(
        'SELECT * FROM projects WHERE notified = 0 ORDER BY created_at DESC'
      );
      return stmt.all();
    } catch (error) {
      logger.error('Error getting unnotified projects:', error);
      throw error;
    }
  }

  /**
   * Close the database connection
   * @returns {void}
   */
  close() {
    try {
      if (this.db) {
        this.db.close();
        this.db = null;
        logger.info('Database connection closed');
      }
    } catch (error) {
      logger.error('Error closing database connection:', error);
      throw error;
    }
  }
}

// Create a singleton instance
const dbService = new DatabaseService();

// Handle process termination
process.on('SIGINT', async () => {
  await dbService.close();
  process.exit(0);
});

export default dbService;
