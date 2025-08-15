import fs from 'fs';
import path from 'path';
import { LOG_FILE } from '../config/constants.js';

// Note: __filename and __dirname are not used in this module
// They were removed to fix linting errors

// Ensure log directory exists
const logDir = path.dirname(LOG_FILE);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Create a write stream (in append mode)
const logStream = fs.createWriteStream(LOG_FILE, { flags: 'a' });

// Helper function to format log messages
function formatMessage(level, message, ...args) {
  const timestamp = new Date().toISOString();
  const formattedArgs = args.length > 0 
    ? ` ${args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ')}`
    : '';
  return `[${timestamp}] [${level}] ${message}${formattedArgs}\n`;
}

const logger = {
  /**
   * Log an info message
   * @param {string} message - Message to log
   * @param {...any} args - Additional arguments to log
   */
  info(message, ...args) {
    const logMessage = formatMessage('INFO', message, ...args);
    process.stdout.write(logMessage);
    logStream.write(logMessage);
  },

  /**
   * Log an error message
   * @param {string} message - Error message
   * @param {Error} [error] - Error object (optional)
   */
  error(message, error) {
    const errorMessage = error 
      ? `${message}: ${error.message}\n${error.stack || ''}` 
      : message;
    const logMessage = formatMessage('ERROR', errorMessage);
    process.stderr.write(logMessage);
    logStream.write(logMessage);
  },

  /**
   * Log a warning message
   * @param {string} message - Warning message
   * @param {...any} args - Additional arguments to log
   */
  warn(message, ...args) {
    const logMessage = formatMessage('WARN', message, ...args);
    process.stderr.write(logMessage);
    logStream.write(logMessage);
  },

  /**
   * Log a debug message (only in development)
   * @param {string} message - Debug message
   * @param {...any} args - Additional arguments to log
   */
  debug(message, ...args) {
    if (process.env.NODE_ENV === 'development') {
      const logMessage = formatMessage('DEBUG', message, ...args);
      process.stdout.write(logMessage);
      logStream.write(logMessage);
    }
  },

  /**
   * Close the log stream
   */
  close() {
    logStream.end();
  }
};

// Handle process termination
process.on('exit', () => {
  logger.close();
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  // Allow the process to exit naturally after logging
  process.exitCode = 1;
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

export default logger;
