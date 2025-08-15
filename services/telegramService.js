import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';

dotenv.config();

class TelegramService {
  constructor() {
    this.bot = null;
    this.chatId = process.env.TELEGRAM_CHAT_ID;
    this.initialize();
  }

  initialize() {
    try {
      const token = process.env.TELEGRAM_BOT_TOKEN;
      if (!token) {
        throw new Error('TELEGRAM_BOT_TOKEN is not defined in environment variables');
      }

      this.bot = new TelegramBot(token, { polling: false });
      logger.info('Telegram bot initialized');
    } catch (error) {
      logger.error('Error initializing Telegram bot:', error);
      this.bot = null;
    }
  }

  /**
   * Send a message to the configured chat
   * @param {string} message - Message to send
   * @returns {Promise<boolean>} - Whether the message was sent successfully
   */
  async sendMessage(message) {
    if (!this.bot || !this.chatId) {
      logger.error('Telegram bot is not properly initialized');
      return false;
    }

    try {
      const options = {
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      };

      // Add thread_id to options if provided
      options.message_thread_id = process.env.TELEGRAM_TOPIC_ID;

      await this.bot.sendMessage(this.chatId, message, options);
      // await this.bot.sendMessage(this.chatId, message, { parse_mode: 'HTML' });
      logger.info('Message sent to Telegram');
      return true;
    } catch (error) {
      logger.error('Error sending Telegram message:', error);
      return false;
    }
  }

  /**
   * Format project data into a message
   * @param {Object} project - Project data
   * @returns {string} - Formatted message
   */
  formatProjectMessage(project) {
    if (!project) return '';

    const { title, url, content } = project;
    const maxLength = 4000; // Telegram message length limit

    let message = `<b>${this.escapeHtml(title)}</b>\n`;
    message += `<a href="${url}">View Project</a>\n\n`;

    if (content) {
      const cleanContent = this.escapeHtml(content);
      const remainingLength = maxLength - message.length - 100; // Leave room for ellipsis

      if (cleanContent.length > remainingLength) {
        message += `${cleanContent.substring(0, remainingLength)}...`;
      } else {
        message += cleanContent;
      }
    }

    return message;
  }

  /**
   * Escape HTML special characters
   * @param {string} unsafe - Unsafe string
   * @returns {string} - Escaped string
   */
  escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Format and send project details to Telegram
   * @param {Array} projects - Array of project objects
   * @returns {Promise<Array>} - Results of send operations
   */
  async sendProjects(projects) {
    if (!Array.isArray(projects) || projects.length === 0) {
      return [];
    }

    const results = [];

    // Process projects sequentially with error handling
    for (let i = 0; i < projects.length; i += 1) {
      const project = projects[i];
      try {
        const message = this.formatProjectMessage(project);
        if (message) {
          // eslint-disable-next-line no-await-in-loop
          const result = await this.sendMessage(message);
          results.push({
            projectId: project.id,
            success: result,
            message: result ? 'Sent successfully' : 'Failed to send',
          });

          // Add a small delay between messages to avoid rate limiting
          if (i < projects.length - 1) {
            // eslint-disable-next-line no-await-in-loop
            await new Promise(resolve => {
              setTimeout(resolve, 500);
            });
          }
        }
      } catch (error) {
        logger.error(`Error sending project ${project?.id || 'unknown'}:`, error);
        results.push({
          projectId: project?.id || 'unknown',
          success: false,
          message: `Error: ${error.message}`,
        });
      }
    }

    return results;
  }
}

const telegramService = new TelegramService();
export default telegramService;
