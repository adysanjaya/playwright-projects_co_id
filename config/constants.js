import path from 'path';
import os from 'os';

// Application paths
const DATA_DIR = path.join(os.homedir(), '.projects-scraper');
const DB_PATH = path.join(DATA_DIR, 'projects.db');
const LOG_FILE = path.join(DATA_DIR, 'scraper.log');

// Target website configuration
const BASE_URL = 'https://projects.co.id';
const PROJECTS_URL = `${BASE_URL}/public/browse_projects`;

// Project filtering
const TARGET_KEYWORDS = [
  'web',
  'website',
  'aplikasi',
  'mobile',
  'scrap',
  'server',
  'bot',
  'api',
  'backend',
  'frontend',
  'fullstack',
  'laravel',
  'node',
  'react',
  'vue',
  'javascript',
  'typescript',
  'python',
  'django',
  'flask',
  'php',
  'codeigniter',
  'database',
  'mysql',
  'postgresql',
  'mongodb',
];

const BLACKLISTED_WORDS = ['godev'];

// Browser configuration
const BROWSER_OPTIONS = {
  headless: process.env.HEADLESS || false,
  defaultViewport: { width: 1366, height: 768 },
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--no-first-run',
    '--no-zygote',
    '--single-process',
    '--disable-gpu',
    '--disable-blink-features=AutomationControlled',
    '--disable-infobars',
    '--window-size=1366,768',
  ],
  ignoreHTTPSErrors: true,
  slowMo: process.env.NODE_ENV === 'development' ? 100 : 0,
};

// Navigation options
const NAVIGATION_OPTIONS = {
  waitUntil: 'domcontentloaded',
  timeout: 60000,
  referer: 'https://www.google.com/',
};

// Content extraction selectors
const SELECTORS = {
  // Project listing page
  PROJECT_LIST: '.form-body',
  PROJECT_ITEM: '.form-body', // Using form-body as the container
  PROJECT_TITLE: 'h2 a',
  PROJECT_LINK: 'h2 a', // The link is directly in the h2

  // Project detail page
  PROJECT_CONTENT: [
    '.project-detail',
    '.project-description',
    '.detail',
    '.project-content',
    '.content',
    'article',
    'main',
    'body',
  ],

  // Elements to remove before content extraction
  UNWANTED_ELEMS: [
    'script',
    'style',
    'iframe',
    'img',
    'button',
    'form',
    'nav',
    'header',
    'footer',
    '.ad',
    '.advertisement',
    '.social-share',
    '.comments',
    '.related-posts',
    '.admin-note',
    '.alert',
    '.hidden',
    '[style*="display:none"]',
    '[style*="display: none"]',
    '.d-none',
  ],
};

// Request headers to mimic a real browser
const REQUEST_HEADERS = {
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
  'Accept-Encoding': 'gzip, deflate, br',
  'Accept-Language': 'en-US,en;q=0.9',
  'Cache-Control': 'no-cache',
  Connection: 'keep-alive',
  Pragma: 'no-cache',
  Referer: 'https://www.google.com/',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'same-origin',
  'Upgrade-Insecure-Requests': '1',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
};

// Content cleaning patterns
const CLEANING_PATTERNS = [
  /\s*={3,}.*/g, // Lines with ====
  /\s*-{3,}.*/g, // Lines with ----
  /\*{3,}.*/g, // Lines with ****
  /\s*Admin Note:.*/gi, // Admin notes
  /\s*Dilarang mencantumkan.*/gi, // Common warning text
  /\s*Semua komunikasi.*/gi, // More warning text
  /\[.*?\]\(.*?\)/g, // Markdown links
  // /<[^>]*>/g,                // HTML tags
  /\s*\n{2,}/g, // Double newlines
  /\s\s/g, // Double spaces
];

const REPLACE_PATTERN = ['', '', '', '', '', '', '', '\n', ' '];

// Export all constants
export const CONTENT_MIN_LENGTH = 50; // Minimum content length to consider valid
export const MAX_RETRIES = 3; // Max retries for failed requests
export const RETRY_DELAY = 5000; // Delay between retries in ms
export const SCREENSHOT_ON_ERROR = true; // Whether to take screenshots on errors
export const SCREENSHOT_DIR = path.join(DATA_DIR, 'screenshots'); // Directory for screenshots

// Export all other constants
export {
  // Paths
  DATA_DIR,
  DB_PATH,
  LOG_FILE,

  // URLs
  BASE_URL,
  PROJECTS_URL,

  // Filtering
  TARGET_KEYWORDS,
  BLACKLISTED_WORDS,

  // Browser
  BROWSER_OPTIONS,
  NAVIGATION_OPTIONS,
  REQUEST_HEADERS,

  // Selectors
  SELECTORS,

  // Content cleaning
  CLEANING_PATTERNS,
  REPLACE_PATTERN,
};
