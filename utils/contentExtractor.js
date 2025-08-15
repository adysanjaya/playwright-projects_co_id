import logger from './logger.js';

/**
 * Extract clean content from a project page
 * @param {Object} page - Playwright page object
 * @param {string} selector - CSS selector for the content container
 * @returns {Promise<string|null>} - Extracted and cleaned content
 */
async function extractContent(page, selector) {
  try {
    // Wait for the content to be available
    await page.waitForSelector(selector, { timeout: 10000 });
    
    // Extract and clean the content
    const content = await page.evaluate((contentSelector) => {
      const container = document.querySelector(contentSelector);
      if (!container) return null;
      
      // Clone to avoid modifying the original DOM
      const clone = container.cloneNode(true);
      
      // Remove unwanted elements
      const unwanted = [
        'script', 'style', 'iframe', 'img', 'button', 'form', 'nav', 'header', 'footer',
        '.ad', '.advertisement', '.social-share', '.comments', '.related-posts'
      ];
      
      unwanted.forEach(selector => {
        const elements = clone.querySelectorAll(selector);
        elements.forEach(el => el.remove());
      });
      
      // Get text content and clean it up
      let text = clone.textContent
        .replace(/\s+/g, ' ')      // Replace multiple spaces with one
        .replace(/\n+/g, '\n')     // Normalize newlines
        .trim();
      
      // Remove common unwanted patterns
      const patterns = [
        /\s*={3,}.*/g,             // Lines with ====
        /\s*-{3,}.*/g,             // Lines with ----
        /\*{3,}.*/g,               // Lines with ****
        /\s*Admin Note:.*/gi,      // Admin notes
        /\s*Dilarang mencantumkan.*/gi,  // Common warning text
        /\s*Semua komunikasi.*/gi,       // More warning text
        /\[.*?\]\(.*?\)/g,       // Markdown links
        /<[^>]*>/g,                // HTML tags
        /\s*\n\s*\n\s*\n+/g,  // Multiple newlines
        /\s*\n\s*\n/g,        // Double newlines
        /\s{2,}/g                  // Multiple spaces
      ];
      
      patterns.forEach(pattern => {
        text = text.replace(pattern, '\n').trim();
      });
      
      // Split by newline and filter out short lines
      return text
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 10)  // Minimum line length
        .join('\n\n')                    // Join with double newlines
        .trim();
      
    }, selector);
    
    return content || null;
    
  } catch (error) {
    logger.error('Error extracting content:', error.message);
    return null;
  }
}

export { extractContent };
export default { extractContent };
