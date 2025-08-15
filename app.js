#!/usr/bin/env node

import dotenv from 'dotenv';
import fs from 'fs-extra';
import logger from './utils/logger.js';
import ScraperService from './services/scraperService.js';
import db from './services/dbService.js';
import telegram from './services/telegramService.js';
import { PROJECTS_URL, DATA_DIR, SCREENSHOT_DIR } from './config/constants.js';

// Load environment variables
dotenv.config();

class App {
  constructor() {
    this.scraper = new ScraperService();
    this.setupDirectories();
  }

  /**
   * Create necessary directories if they don't exist
   */
  setupDirectories() {
    try {
      fs.ensureDirSync(DATA_DIR);
      fs.ensureDirSync(SCREENSHOT_DIR);
      logger.info(`Data directory: ${DATA_DIR}`);
    } catch (error) {
      logger.error('Failed to create directories:', error);
      process.exit(1);
    }
  }

  /**
   * Main application entry point
   */
  async run() {
    try {
      logger.info('Starting application...');

      // Initialize database
      await db.init();

      // Initialize scraper
      await this.scraper.init();

      // Start the scraping process
      await this.startScraping();

      logger.info('Application completed successfully');
    } catch (error) {
      logger.error('Application error:', error);
      process.exitCode = 1;
    } finally {
      // Cleanup resources
      await this.cleanup();
    }
  }

  /**
   * Start the scraping process
   */
  async startScraping() {
    try {
      logger.info('Starting scraping process...');

      const projects = await this.scraper.scrapeProjects(PROJECTS_URL);

      if (!projects || projects.length === 0) {
        logger.warn('No projects found');
        return;
      }

      // Process projects sequentially
      // for (let i = 0; i < projects.length; i += 1) {
      //   const project = projects[i];
      //   try {
      //     // Check if project exists
      //     const exists = await db.projectExists(project.url);
      //     if (!exists) {
      //       logger.info(`not exist: ${project.title}`);
      //       // Insert new project
      //       const projectId = await db.insertProject(project);
      //       if (projectId) {
      //         // Format and send message
      //         const message = telegram.formatProjectMessage(project);
      //         const sent = await telegram.sendMessage(message);

      //         // Mark as notified if message was sent
      //         if (sent) {
      //           await db.markAsNotified(projectId);
      //           logger.info(`Notification sent for project: ${project.title}`);
      //         }
      //       }
      //     } else {
      //       logger.info(`exist: ${project.title} ${exists}`);
      //     }
      //   } catch (error) {
      //     logger.error(`Error processing project: ${project?.url || 'unknown'}`, error);
      //   }

      //   // Add a small delay between processing projects
      //   if (i < projects.length - 1) {
      //     // eslint-disable-next-line no-await-in-loop
      //     await new Promise(resolve => {
      //       setTimeout(resolve, 500);
      //     });
      //   }
      // }

      logger.info('Scraping completed successfully');
    } catch (error) {
      logger.error('Error during scraping process:', error);
      throw error;
    }
  }

  /**
   * Clean up resources
   */
  async cleanup() {
    try {
      await this.scraper.close();
      await db.close();
      logger.info('Cleanup completed');
    } catch (error) {
      logger.error('Error during cleanup:', error);
    }
  }
}

// Run the application
const app = new App();
app.run().catch(error => {
  logger.error('Unhandled error:', error);
  process.exit(1);
});
