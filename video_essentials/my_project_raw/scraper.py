import requests
from bs4 import BeautifulSoup
import sqlite3
from datetime import datetime

class PriceTracker:
    def __init__(self, db_path="prices.db"):
        self.db_path = db_path
        self.conn = sqlite3.connect(db_path)
        self._init_db()

    def _init_db(self):
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS price_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_url TEXT NOT NULL,
                product_name TEXT,
                price REAL NOT NULL,
                currency TEXT DEFAULT 'INR',
                scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        self.conn.commit()

    def scrape_price(self, url):
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        response = requests.get(url, headers=headers, timeout=10)
        soup = BeautifulSoup(response.content, 'html.parser')

        # Amazon price selector
        price_element = soup.find('span', {'class': 'a-price-whole'})
        if price_element:
            price_text = price_element.get_text().replace(',', '').strip()
            return float(price_text)

        # Flipkart price selector
        price_element = soup.find('div', {'class': '_30jeq3'})
        if price_element:
            price_text = price_element.get_text().replace('₹', '').replace(',', '').strip()
            return float(price_text)

        return None

    def track(self, url, product_name, alert_threshold=None):
        price = self.scrape_price(url)
        if price is None:
            print(f"Could not scrape price for {product_name}")
            return

        self.conn.execute(
            "INSERT INTO price_history (product_url, product_name, price) VALUES (?, ?, ?)",
            (url, product_name, price)
        )
        self.conn.commit()
        print(f"Tracked: {product_name} = ₹{price}")

        if alert_threshold and price <= alert_threshold:
            self._send_alert(product_name, price, alert_threshold)

    def get_history(self, url):
        cursor = self.conn.execute(
            "SELECT price, scraped_at FROM price_history WHERE product_url = ? ORDER BY scraped_at",
            (url,)
        )
        return cursor.fetchall()

    def _send_alert(self, product_name, price, threshold):
        import smtplib
        from email.mime.text import MIMEText
        print(f"ALERT: {product_name} dropped to ₹{price} (threshold: ₹{threshold})")
