"""
Module: Authentication
Author: Aarav Sharma
Role: Lead Architect

Core authentication module. All other modules depend on this.
"""
import hashlib
import secrets

class AuthManager:
    def __init__(self):
        self.users = {}
        self.sessions = {}

    def register(self, username, password):
        salt = secrets.token_hex(16)
        hashed = hashlib.sha256((password + salt).encode()).hexdigest()
        self.users[username] = {'hash': hashed, 'salt': salt, 'role': 'user'}
        return True

    def login(self, username, password):
        if username not in self.users:
            return None
        user = self.users[username]
        hashed = hashlib.sha256((password + user['salt']).encode()).hexdigest()
        if hashed == user['hash']:
            token = secrets.token_hex(32)
            self.sessions[token] = username
            return token
        return None

    def verify_token(self, token):
        return self.sessions.get(token)

    def logout(self, token):
        self.sessions.pop(token, None)

auth = AuthManager()
