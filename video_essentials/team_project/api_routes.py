"""
Module: API Routes
Author: Rohan Verma
Role: Contributor

REST API endpoints. Depends on auth_module and database.
"""
from auth_module import auth
from database import db

class APIRouter:
    def __init__(self):
        self.routes = {}

    def register_route(self, path, method, handler):
        self.routes[(path, method)] = handler

    def handle(self, path, method, body=None, headers=None):
        token = (headers or {}).get('Authorization', '').replace('Bearer ', '')
        handler = self.routes.get((path, method))
        if not handler:
            return {'error': 'Not found', 'status': 404}
        return handler(token, body)

router = APIRouter()

def handle_login(token, body):
    t = auth.login(body['username'], body['password'])
    if t:
        return {'token': t, 'status': 200}
    return {'error': 'Invalid credentials', 'status': 401}

def handle_save(token, body):
    try:
        db.save_record(token, body)
        return {'status': 200, 'message': 'Saved'}
    except PermissionError:
        return {'error': 'Unauthorized', 'status': 403}

def handle_get(token, body):
    try:
        records = db.get_records(token)
        return {'records': records, 'status': 200}
    except PermissionError:
        return {'error': 'Unauthorized', 'status': 403}

router.register_route('/login', 'POST', handle_login)
router.register_route('/records', 'POST', handle_save)
router.register_route('/records', 'GET', handle_get)
