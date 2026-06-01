# Price Tracker — E-Commerce Web Scraper

A Python web scraper that monitors product prices across Amazon and Flipkart,
stores historical data in SQLite, and sends email alerts when prices drop below a threshold.

## Features
- Scrapes product listings from multiple e-commerce sites
- Stores price history with timestamps
- Configurable price alert thresholds
- Email notification system
- REST API to query price history

## Tech Stack
- Python 3.10
- BeautifulSoup4 for HTML parsing
- SQLite for price history storage
- smtplib for email alerts
- Flask for REST API
