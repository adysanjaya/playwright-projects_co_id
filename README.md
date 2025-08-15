# Projects.co.id Scraper with Telegram Notifications

A robust web scraper for [projects.co.id](https://www.projects.co.id) that extracts project listings, filters them based on keywords, and sends notifications via Telegram for new projects. The application uses Playwright for web scraping, SQLite for data persistence, and integrates with the Telegram Bot API for notifications.

## Features

- **Web Scraping**: Uses Playwright with stealth mode to bypass bot detection
- **Content Extraction**: Advanced content extraction with multiple fallback methods
- **Filtering**: Filters projects based on keywords and blacklisted terms
- **Persistence**: Stores projects in SQLite database to avoid duplicate notifications
- **Notifications**: Sends formatted messages to Telegram for new projects
- **Error Handling**: Comprehensive error handling with retries and screenshots
- **Logging**: Detailed logging for debugging and monitoring

## Prerequisites

- Node.js v16 or higher
- npm or yarn
- Telegram Bot Token and Chat ID for notifications

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/projects-scraper.git
   cd projects-scraper
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

   or with yarn:

   ```bash
   yarn
   ```

3. Install Playwright browsers:

   ```bash
   npx playwright install
   ```

4. Create a `.env` file based on the example:

   ```bash
   cp .env.example .env
   ```

5. Edit the `.env` file and add your Telegram Bot Token and Chat ID.

## Configuration

Edit the `.env` file to configure the application:

## Usage

### Development Mode

Run the scraper in development mode (with debug logging):

```bash
npm run dev
```

### Production Mode

Run the scraper in production mode (headless browser):

```bash
npm start
```

### Environment Variables

- `NODE_ENV`: Set to 'development' or 'production'
- `TELEGRAM_BOT_TOKEN`: Your Telegram Bot Token
- `TELEGRAM_CHAT_ID`: Your Telegram Chat ID
- `TELEGRAM_TOPIC_ID`: Your Telegram Topic ID
- `HEADLESS`: Set to 'true' to run browser in headless mode
- `MAX_PROJECTS`: Maximum number of projects to process per run
- `REQUEST_DELAY`: Delay between requests in milliseconds
- `ENABLE_FILE_LOGGING`: Set to 'true' to enable file logging
- `LOG_LEVEL`: Log level ('error', 'warn', 'info', 'debug')
- `SCREENSHOT_ON_ERROR`: Set to 'true' to take screenshots on errors

## Project Structure

```
.
├── config/                  # Configuration files
│   └── constants.js         # Application constants
├── services/                # Service modules
│   ├── dbService.js         # Database operations
│   ├── scraperService.js    # Web scraping logic
│   └── telegramService.js   # Telegram notifications
├── utils/                   # Utility functions
│   ├── contentExtractor.js  # Content extraction utilities
│   ├── filters.js           # Project filtering logic
│   └── logger.js            # Logging utilities
├── .env.example             # Example environment variables
├── .gitignore               # Git ignore file
├── app.js                   # Main application entry point
├── package.json             # Project dependencies
└── README.md                # This file
```

## Customization

### Changing Target Keywords

Edit the `TARGET_KEYWORDS` array in `config/constants.js` to change which projects are considered relevant.

### Modifying Blacklist

Edit the `BLACKLISTED_WORDS` array in `config/constants.js` to exclude projects containing specific terms.

### Adjusting Selectors

If the website structure changes, update the `SELECTORS` object in `config/constants.js` to match the new structure.

## Error Handling

The application includes comprehensive error handling:

- Automatic retries for failed requests
- Screenshots on errors (when enabled)
- Detailed logging for debugging

## Logs

Logs are stored in the following locations:

- Console output (always)
- File: `~/.projects-scraper/scraper.log` (when `ENABLE_FILE_LOGGING=true`)
- Screenshots: `~/.projects-scraper/screenshots/` (on errors when `SCREENSHOT_ON_ERROR=true`)

## Database

Projects are stored in a SQLite database at `~/.projects-scraper/projects.db`.

### Schema

```sql
CREATE TABLE projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  url TEXT UNIQUE NOT NULL,
  content TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notified BOOLEAN DEFAULT 0
);
```

## License

MIT

## Contributing

1. Fork the repository
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

For support, please open an issue in the GitHub repository.
