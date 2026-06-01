"""
Module: Database Layer
Author: Priya Mehta
Role: Core Team

Database abstraction layer. Depends on auth_module for access control.
"""
from auth_module import auth
import sqlite3
import json

class Database:
    def __init__(self, db_path="app.db"):
        self.conn = sqlite3.connect(db_path, check_same_thread=False)
        self._init_schema()

    def _init_schema(self):
        self.conn.executescript("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY,
                username TEXT UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS records (
                id INTEGER PRIMARY KEY,
                user_id INTEGER,
                data TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            );
        """)
        self.conn.commit()

    def save_record(self, token, data):
        username = auth.verify_token(token)
        if not username:
            raise PermissionError("Invalid token")
        cursor = self.conn.execute(
            "SELECT id FROM users WHERE username = ?", (username,)
        )
        user = cursor.fetchone()
        if user:
            self.conn.execute(
                "INSERT INTO records (user_id, data) VALUES (?, ?)",
                (user[0], json.dumps(data))
            )
            self.conn.commit()

    def get_records(self, token):
        username = auth.verify_token(token)
        if not username:
            raise PermissionError("Invalid token")
        cursor = self.conn.execute(
            "SELECT r.data, r.created_at FROM records r "
            "JOIN users u ON r.user_id = u.id WHERE u.username = ?",
            (username,)
        )
        return cursor.fetchall()

db = Database()
