import { chromium } from 'playwright-extra';
import stealth from 'puppeteer-extra-plugin-stealth';
import {
  BROWSER_OPTIONS,
  NAVIGATION_OPTIONS,
  SELECTORS,
  REQUEST_HEADERS,
  CLEANING_PATTERNS,
  MAX_RETRIES,
  RETRY_DELAY,
  REPLACE_PATTERN,
} from '../config/constants.js';
import logger from '../utils/logger.js';
import { filterProject } from '../utils/filters.js';

// Apply stealth plugin
chromium.use(stealth);

class ScraperService {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
  }

  /**
   * Initialize the scraper
   * @returns {Promise<void>}
   */
  async init() {
    try {
      logger.info('Launching browser...');
      this.browser = await chromium.launch(BROWSER_OPTIONS);

      // Create a new browser context
      this.context = await this.browser.newContext({
        viewport: BROWSER_OPTIONS.defaultViewport,
        userAgent: REQUEST_HEADERS['User-Agent'],
        ignoreHTTPSErrors: true,
      });

      // Set default navigation timeout
      this.context.setDefaultNavigationTimeout(NAVIGATION_OPTIONS.timeout);

      // Create a new page
      this.page = await this.context.newPage();
      // Set request headers
      await this.page.setExtraHTTPHeaders(REQUEST_HEADERS);

      logger.info('Browser initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize scraper:', error);
      throw error;
    }
  }

  /**
   * Navigate to a URL with retries
   * @param {string} url - URL to navigate to
   * @param {Object} options - Navigation options
   * @param {number} attempt - Current attempt number
   * @returns {Promise<void>}
   */
  async navigateWithRetry(url, options = {}, attempt = 1) {
    try {
      logger.debug(`Navigating to ${url} (attempt ${attempt}/${MAX_RETRIES})`);
      await this.page.goto(url, { ...NAVIGATION_OPTIONS, ...options });

      // Check for Cloudflare challenge
      const isChallenge = await this.page.evaluate(
        () =>
          document.title.includes('Just a moment...') ||
          document.querySelector('#challenge-running') !== null
      );

      if (isChallenge) {
        logger.warn('Cloudflare challenge detected, waiting for resolution...');
        await this.page.waitForNavigation({
          waitUntil: 'networkidle',
          timeout: 30000,
        });
      }

      return true;
    } catch (error) {
      logger.error('Error navigating to URL:', error);
      if (attempt >= MAX_RETRIES) {
        await this.page.screenshot({
          path: `screenshot-${Date.now()}.png`,
        });
        throw new Error(
          `Failed to navigate to ${url} after ${MAX_RETRIES} attempts: ${error.message}`
        );
      }

      logger.warn(`Navigation attempt ${attempt} failed: ${error.message}. Retrying...`);
      await new Promise(resolve => {
        setTimeout(resolve, RETRY_DELAY * attempt);
      });
      return this.navigateWithRetry(this.page, url, options, attempt + 1);
    }
  }

  async navigateWithRetry2(page, url, options = {}, attempt = 1) {
    try {
      logger.debug(`Navigating to ${url} (attempt ${attempt}/${MAX_RETRIES})`);
      await page.goto(url, { ...NAVIGATION_OPTIONS, ...options });

      // Check for Cloudflare challenge
      const isChallenge = await page.evaluate(
        () =>
          document.title.includes('Just a moment...') ||
          document.querySelector('#challenge-running') !== null
      );

      if (isChallenge) {
        logger.warn('Cloudflare challenge detected, waiting for resolution...');
        await page.waitForNavigation({
          waitUntil: 'networkidle',
          timeout: 30000,
        });
      }

      return true;
    } catch (error) {
      logger.error('Error navigating to URL:', error);
      if (attempt >= MAX_RETRIES) {
        await page.screenshot({
          path: `screenshot-${Date.now()}.png`,
        });
        throw new Error(
          `Failed to navigate to ${url} after ${MAX_RETRIES} attempts: ${error.message}`
        );
      }

      logger.warn(`Navigation attempt ${attempt} failed: ${error.message}. Retrying...`);
      await new Promise(resolve => {
        setTimeout(resolve, RETRY_DELAY * attempt);
      });
      return this.navigateWithRetry2(page, url, options, attempt + 1);
    }
  }

  /**
   * Scrape project listings from the projects page
   * @param {string} url - URL of the projects page
   * @returns {Promise<Array>} - Array of project objects
   */
  async scrapeProjectListings(url) {
    try {
      logger.info(`Scraping project listings from: ${url}`);

      await this.navigateWithRetry(url);

      // Wait for the project list to load
      await this.page.waitForSelector(SELECTORS.PROJECT_LIST, { timeout: 10000 });

      // Extract project data using the same approach as scraper.js
      const projects = await this.page.evaluate(({ PROJECT_LIST }) => {
        const projectElements = Array.from(document.querySelectorAll(PROJECT_LIST));

        return projectElements
          .flatMap(element => {
            const h2Elements = element.querySelectorAll('h2');
            return Array.from(h2Elements).map(h2 => {
              const link = h2.querySelector('a');
              if (!link) return null;

              return {
                id: link.href.split('/').pop(),
                title: link.textContent.trim(),
                url: link.href,
                timestamp: new Date().toISOString(),
              };
            });
          })
          .filter(Boolean);
      }, SELECTORS);

      logger.info(`Found ${projects.length} projects`);
      return projects;
    } catch (error) {
      await this.page.screenshot({
        path: `screenshot-${Date.now()}.png`,
      });
      logger.error('Error scraping project listings:', error);
      throw error;
    }
  }

  /**
   * Scrape detailed content of a single project
   * @param {Object} project - Project object with URL
   * @returns {Promise<Object>} - Project object with content
   */
  async scrapeProjectContent(project) {
    if (!project?.url) {
      logger.warn('Invalid project URL');
      ``;
      return { ...project, content: null };
    }

    const page = await this.context.newPage();

    try {
      logger.debug(`Scraping project content: ${project.url}`);

      // Set headers for the new page
      await page.setExtraHTTPHeaders(REQUEST_HEADERS);

      // Navigate to the project page with a longer timeout
      await this.navigateWithRetry2(page, project.url, {
        waitUntil: 'domcontentloaded',
        timeout: 30000, // 30 seconds
      });

      await page.locator('.blog-content').waitFor();
      let content = await page.evaluate(() => {
        return document.querySelector('.blog-content').innerText;
      });

      logger.info(content);

      // Clean up the content
      if (content) {
        // Remove unwanted patterns
        content = CLEANING_PATTERNS.reduce(
          (text, pattern, index) => text.replace(pattern, REPLACE_PATTERN[index]),
          content
        );

        // Normalize whitespace
        content = content
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 10) // Minimum line length
          .join('\n') // Use single newline (not double)
          // .replace(/\n+/g, '\n') // Collapse multiple newlines
          .trim();
      }

      return { ...project, content };
    } catch (error) {
      await page.screenshot({
        path: `screenshot-${Date.now()}.png`,
      });
      logger.error(`Error scraping project content (${project.url}):`, error.message);
      return { ...project, content: null, error: error.message };
    } finally {
      await page.close();
    }
  }

  /**
   * Scrape projects with detailed content
   * @param {string} url - URL of the projects page
   * @param {number} limit - Maximum number of projects to scrape
   * @returns {Promise<Array>} - Array of project objects with content
   */
  async scrapeProjects(url, limit = 10) {
    try {
      // Get project listings
      const projects = await this.scrapeProjectListings(url);
      // Filter projects
      const filteredProjects = projects.filter(project => filterProject(project)).slice(0, limit);
      // Process projects sequentially with delay
      const results = [];
      // Use the existing _delay method instead of creating a new one
      const delay = ms => {
        return new Promise(resolve => {
          setTimeout(resolve, ms);
        });
      };

      // Process projects sequentially
      for (let i = 0; i < process.env.MAX_PROJECTS; i += 1) {
        // for (let i = 0; i < filteredProjects.length; i += 1) {
        const project = filteredProjects[i];
        try {
          // eslint-disable-next-line no-await-in-loop
          const projectWithContent = await this.scrapeProjectContent(project);
          if (projectWithContent?.content) {
            results.push(projectWithContent);
          }
        } catch (error) {
          logger.error(`Error processing project ${project?.url || 'unknown'}:`, error);
        }

        // Add a small delay between requests, except for the last one
        if (i < filteredProjects.length - 1) {
          // eslint-disable-next-line no-await-in-loop
          await delay(1000);
        }
      }

      return results;
    } catch (error) {
      logger.error('Error in scrapeProjects:', error);
      throw error;
    }
  }

  /**
   * Clean up resources
   * @returns {Promise<void>}
   */
  async close() {
    try {
      if (this.page) {
        await this.page.close();
      }

      if (this.context) {
        await this.context.close();
      }

      if (this.browser) {
        await this.browser.close();
      }

      logger.info('Browser closed successfully');
    } catch (error) {
      logger.error('Error closing browser:', error);
      throw error;
    }
  }
}

export default ScraperService;
