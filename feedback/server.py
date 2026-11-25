"""Private feedback API. Nginx serves the website and proxies /api/feedback/."""
import base64
import hashlib
import hmac
import io
import json
import os
from pathlib import Path
import secrets
import sqlite3
import time
from contextlib import contextmanager
from functools import cache
from http.cookies import SimpleCookie
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse

from PIL import Image, UnidentifiedImageError

DATA = Path(os.environ.get('FEEDBACK_DATA', '/data'))
DATA.mkdir(parents=True, exist_ok=True)
DB = DATA / 'feedback.sqlite3'
USER = os.environ.get('FEEDBACK_ADMIN_USER', 'admin')
PASSWORD = os.environ.get('FEEDBACK_ADMIN_PASSWORD', '')
def password_hash(password, salt):
    return hashlib.scrypt(password.encode(), salt=salt, n=32768, r=8, p=1, maxmem=67108864)
SECURE = os.environ.get('FEEDBACK_COOKIE_SECURE', 'true').lower() != 'false'
PREFIX = '/api/feedback'
MAX_BODY = 7200000
Image.MAX_IMAGE_PIXELS = 16000000
ASSETS = Path(__file__).resolve().parents[1] / 'outputs' / 'assets'
if not ASSETS.is_dir():
    ASSETS = Path('/usr/share/nginx/html/assets')


@contextmanager
def database():
    connection = sqlite3.connect(DB, timeout=10)
    connection.row_factory = sqlite3.Row
    try:
        with connection:
            yield connection
    finally:
        connection.close()


with database() as db:
    db.executescript('''
    PRAGMA journal_mode=WAL;
    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY, created INTEGER NOT NULL,
        name TEXT NOT NULL, email TEXT NOT NULL, message TEXT NOT NULL,
        page TEXT NOT NULL, version TEXT NOT NULL, screenshot BLOB,
        status TEXT NOT NULL DEFAULT 'New', unread INTEGER NOT NULL DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS admin (id INTEGER PRIMARY KEY CHECK(id=1), username TEXT NOT NULL, salt BLOB NOT NULL, hash BLOB NOT NULL);
    CREATE TABLE IF NOT EXISTS setup (id INTEGER PRIMARY KEY CHECK(id=1), hash TEXT NOT NULL, expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS attempts (identity TEXT, kind TEXT, created INTEGER);
    CREATE TABLE IF NOT EXISTS daily_verses (id INTEGER PRIMARY KEY CHECK(id=1), verses TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS attempts_lookup ON attempts(identity, kind, created);
    ''')
    # Restarting the service revokes sessions, including after credential changes.
    db.execute('DELETE FROM sessions')
    db.execute('DELETE FROM setup')
    if not db.execute('SELECT 1 FROM admin').fetchone():
        if PASSWORD:
            salt = secrets.token_bytes(32)
            db.execute('INSERT INTO admin VALUES (1,?,?,?)', (USER, salt, password_hash(PASSWORD, salt)))
        else:
            code = secrets.token_urlsafe(32)
            db.execute('INSERT INTO setup VALUES (1,?,?)', (hashlib.sha256(code.encode()).hexdigest(), int(time.time())+86400))
            print('German Worksheets admin setup code: ' + code, flush=True)
            print('Open /admin to create your account. Code expires in 24 hours; restart to generate a new code.', flush=True)


class RequestError(Exception):
    def __init__(self, code, message):
        self.code, self.message = code, message


@cache
def new_testament_ids():
    catalog = (ASSETS / 'bible-catalog.js').read_text(encoding='utf-8').strip()
    books = json.loads(catalog.removeprefix('const luther1912Catalog=').removesuffix(';'))
    return {book['id'] for book in books if book['section'] == 'nt'}


@cache
def verse_numbers(book):
    data = (ASSETS / 'bible-1912' / f'{book}.js').read_text(encoding='utf-8').strip()
    chapters = json.loads(data.removeprefix(f'window.luther1912Books.set({book},').removesuffix(');'))
    return {(int(chapter), number) for chapter, verses in chapters.items() for number, _ in verses}


def validate_daily_verses(entries):
    if not isinstance(entries, list) or len(entries) > 8000:
        raise RequestError(400, 'Enter a valid list of Bible verses.')
    unique = {}
    for entry in entries:
        if not isinstance(entry, list) or len(entry) != 3 or any(type(value) is not int for value in entry):
            raise RequestError(400, 'Use a book, chapter, and verse for each entry.')
        book, chapter, number = entry
        if book not in new_testament_ids() or (chapter, number) not in verse_numbers(book):
            raise RequestError(400, 'Choose verses from the New Testament in the Luther Bible 1912.')
        unique.setdefault((book, chapter, number), None)
    return list(unique)


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass  # Never log submission bodies, email addresses, or credentials.

    def reply(self, code, value, cookie=None):
        body = json.dumps(value).encode()
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Content-Length', str(len(body)))
        if cookie:
            self.send_header('Set-Cookie', cookie)
        self.end_headers()
        self.wfile.write(body)

    def cookie(self, token, age):
        return ('feedback_session=' + token + '; Path=/api/feedback; HttpOnly; SameSite=Strict; Max-Age='
                + str(age) + ('; Secure' if SECURE else ''))

    def token(self):
        cookies = SimpleCookie()
        try:
            cookies.load(self.headers.get('Cookie', ''))
            value = cookies['feedback_session'].value
        except (KeyError, ValueError):
            return ''
        return hashlib.sha256(value.encode()).hexdigest()

    def authenticated(self, db):
        if not db.execute('SELECT 1 FROM sessions WHERE token=? AND expires>?',
                          (self.token(), int(time.time()))).fetchone():
            raise RequestError(401, 'Please sign in.')

    def body(self):
        # JSON and a custom header prevent cross-origin form submissions.
        if self.headers.get('X-Feedback-Request') != '1' or self.headers.get_content_type() != 'application/json':
            raise RequestError(403, 'Reload this page and try again.')
        origin = self.headers.get('Origin')
        if origin and urlparse(origin).netloc != self.headers.get('Host'):
            raise RequestError(403, 'This request must come from the website.')
        try:
            length = int(self.headers.get('Content-Length', '0'))
            if length <= 0 or length > MAX_BODY:
                raise RequestError(413, 'Choose a screenshot smaller than 5 MB.')
            value = json.loads(self.rfile.read(length))
            if not isinstance(value, dict):
                raise ValueError()
            return value
        except (ValueError, UnicodeError):
            raise RequestError(400, 'The request could not be read.')

    def limit(self, db, kind, maximum, window):
        # Nginx supplies X-Real-IP and the API listens only on loopback.
        ip = self.headers.get('X-Real-IP', self.client_address[0])
        identity = hashlib.sha256(ip.encode()).hexdigest()
        now = int(time.time())
        db.execute('BEGIN IMMEDIATE')
        db.execute('DELETE FROM attempts WHERE created<?', (now-3600,))
        total = db.execute('SELECT COUNT(*) FROM attempts WHERE identity=? AND kind=? AND created>?',
                           (identity, kind, now-window)).fetchone()[0]
        if total >= maximum:
            db.commit()
            raise RequestError(429, 'Too many attempts. Please try again later.')
        db.execute('INSERT INTO attempts VALUES (?,?,?)', (identity, kind, now))
        db.commit()

    def text(self, data, key, limit, required=False):
        value = data.get(key, '')
        if not isinstance(value, str) or len(value) > limit:
            raise RequestError(400, 'Please shorten the ' + key + ' field.')
        value = value.strip()
        if required and not value:
            raise RequestError(400, 'Please write a message.')
        return value

    def credentials(self, data):
        username = self.text(data, 'username', 80)
        password = data.get('password', '')
        if not username:
            raise RequestError(400, 'Enter a username.')
        if not isinstance(password, str) or not 15 <= len(password) <= 1000:
            raise RequestError(400, 'Use a password between 15 and 1000 characters.')
        return username, password

    def screenshot(self, value):
        if not value:
            return None
        try:
            raw = base64.b64decode(value, validate=True)
            if len(raw) > 5*1024*1024:
                raise ValueError()
            with Image.open(io.BytesIO(raw)) as source:
                if source.format not in ('PNG', 'JPEG', 'WEBP') or source.width * source.height > 16000000:
                    raise ValueError()
                source.load()
                source.thumbnail((2000, 2000))
                cleaned = source.convert('RGB')
                target = io.BytesIO()
                cleaned.save(target, 'JPEG', quality=88)
                return target.getvalue()
        except (ValueError, TypeError, OSError, UnidentifiedImageError, Image.DecompressionBombError):
            raise RequestError(400, 'Use a PNG, JPG, or WebP screenshot under 5 MB and 16 megapixels.')

    def do_GET(self):
        self.handle_request('GET')

    def do_POST(self):
        self.handle_request('POST')

    def handle_request(self, method):
        try:
            self.route(method)
        except RequestError as error:
            self.reply(error.code, {'error': error.message})
        except Exception:
            self.reply(500, {'error': 'The message could not be processed. Please try again.'})

    def route(self, method):
        path = urlparse(self.path).path.removeprefix(PREFIX).strip('/')
        with database() as db:
            if method == 'GET' and path == 'daily-verses':
                row = db.execute('SELECT verses FROM daily_verses WHERE id=1').fetchone()
                self.reply(200, {'verses': json.loads(row['verses']) if row else []})
                return
            if method == 'GET' and path == 'setup-status':
                self.reply(200, {'needsSetup': not bool(db.execute('SELECT 1 FROM admin').fetchone())})
                return
            if method == 'POST' and path == 'setup':
                data = self.body()
                self.limit(db, 'setup', 10, 900)
                username, password = self.credentials(data)
                code = data.get('code', '')
                if not isinstance(code, str) or len(code) > 200:
                    raise RequestError(400, 'Invalid setup code.')
                db.execute('BEGIN IMMEDIATE')
                setup = db.execute('SELECT * FROM setup WHERE id=1').fetchone()
                if db.execute('SELECT 1 FROM admin').fetchone():
                    raise RequestError(409, 'Setup is already complete. Please sign in.')
                if not setup or setup['expires'] <= time.time() or not hmac.compare_digest(setup['hash'], hashlib.sha256(code.strip().encode()).hexdigest()):
                    raise RequestError(403, 'Invalid or expired setup code. Check the latest container logs.')
                salt = secrets.token_bytes(32)
                db.execute('INSERT INTO admin VALUES (1,?,?,?)', (username, salt, password_hash(password, salt)))
                db.execute('DELETE FROM setup')
                db.commit()
                self.reply(201, {'ok': True})
                return
            if method == 'POST' and path == 'submit':
                data = self.body()
                self.limit(db, 'submit', 12, 3600)
                if data.get('website'):
                    self.reply(200, {'ok': True})
                    return
                message = self.text(data, 'message', 10000, True)
                name = self.text(data, 'name', 120)
                email = self.text(data, 'email', 254)
                if email and ('@' not in email or any(c.isspace() for c in email)):
                    raise RequestError(400, 'Check the email address or leave it blank.')
                page = self.text(data, 'page', 500)
                version = self.text(data, 'version', 40)
                screenshot = self.screenshot(data.get('screenshot'))
                db.execute('INSERT INTO messages(created,name,email,message,page,version,screenshot) VALUES (?,?,?,?,?,?,?)',
                           (int(time.time()), name, email, message, page, version, screenshot))
                db.commit()
                self.reply(201, {'ok': True})
                return
            if method == 'POST' and path == 'login':
                data = self.body()
                self.limit(db, 'login', 10, 900)
                # Lock credential verification and session creation against password changes.
                db.execute('BEGIN IMMEDIATE')
                admin = db.execute('SELECT * FROM admin WHERE id=1').fetchone()
                supplied = data.get('password', '')
                if not admin or not isinstance(supplied, str) or len(supplied) > 1000:
                    raise RequestError(401, 'Incorrect username or password.')
                candidate = password_hash(supplied, admin['salt'])
                if not hmac.compare_digest(candidate, admin['hash']) or data.get('username') != admin['username']:
                    raise RequestError(401, 'Incorrect username or password.')
                token = secrets.token_urlsafe(32)
                db.execute('DELETE FROM sessions WHERE expires<?', (int(time.time()),))
                db.execute('INSERT INTO sessions VALUES (?,?)',
                           (hashlib.sha256(token.encode()).hexdigest(), int(time.time())+43200))
                db.commit()
                self.reply(200, {'ok': True}, self.cookie(token, 43200))
                return
            if method == 'POST' and path == 'change-password':
                data = self.body()
                self.authenticated(db)
                self.limit(db, 'password-change', 10, 900)
                username, password = self.credentials(data)
                current = data.get('currentPassword', '')
                db.execute('BEGIN IMMEDIATE')
                self.authenticated(db)
                admin = db.execute('SELECT * FROM admin WHERE id=1').fetchone()
                if not isinstance(current, str) or len(current) > 1000 or not hmac.compare_digest(password_hash(current, admin['salt']), admin['hash']):
                    raise RequestError(403, 'Current password is incorrect.')
                salt = secrets.token_bytes(32)
                db.execute('UPDATE admin SET username=?,salt=?,hash=? WHERE id=1', (username, salt, password_hash(password, salt)))
                db.execute('DELETE FROM sessions')
                db.commit()
                self.reply(200, {'ok': True}, self.cookie('', 0))
                return
            self.authenticated(db)
            if method == 'GET' and path == 'account':
                self.reply(200, {'username': db.execute('SELECT username FROM admin WHERE id=1').fetchone()[0]})
                return
            if method == 'GET' and path == 'messages':
                rows = db.execute('SELECT id,created,name,email,substr(message,1,160) AS message,page,version,status,unread, screenshot IS NOT NULL AS has_image FROM messages ORDER BY id DESC').fetchall()
                self.reply(200, {'messages': [dict(row) for row in rows],
                                 'unread': sum(row['unread'] for row in rows)})
                return
            parts = path.split('/')
            if method == 'GET' and len(parts) in (2,3) and parts[0] == 'messages' and parts[1].isdigit():
                row = db.execute('SELECT * FROM messages WHERE id=?', (int(parts[1]),)).fetchone()
                if not row:
                    raise RequestError(404, 'This message has been deleted.')
                if len(parts) == 3 and parts[2] == 'screenshot':
                    if not row['screenshot']:
                        raise RequestError(404, 'Screenshot not found.')
                    self.send_response(200)
                    self.send_header('Content-Type', 'image/jpeg')
                    self.send_header('Cache-Control', 'no-store')
                    self.send_header('X-Content-Type-Options', 'nosniff')
                    self.send_header('Content-Length', str(len(row['screenshot'])))
                    self.end_headers()
                    self.wfile.write(row['screenshot'])
                    return
                if len(parts) == 2:
                    result = dict(row)
                    result['has_image'] = bool(result.pop('screenshot'))
                    self.reply(200, result)
                    return
            if method == 'POST':
                data = self.body()
                if path == 'daily-verses':
                    verses = validate_daily_verses(data.get('verses'))
                    db.execute('BEGIN IMMEDIATE')
                    self.authenticated(db)
                    db.execute('INSERT INTO daily_verses VALUES (1,?) ON CONFLICT(id) DO UPDATE SET verses=excluded.verses',
                               (json.dumps(verses),))
                    db.commit()
                    self.reply(200, {'verses': verses})
                    return
                if path == 'logout':
                    db.execute('DELETE FROM sessions WHERE token=?', (self.token(),))
                    db.commit()
                    self.reply(200, {'ok': True}, self.cookie('',0))
                    return
                if path == 'update':
                    if data.get('status') not in ('New','In progress','Resolved') or type(data.get('unread')) is not bool:
                        raise RequestError(400, 'Choose a valid status.')
                    changed = db.execute('UPDATE messages SET status=?,unread=? WHERE id=?',
                                         (data['status'], int(data['unread']), data.get('id')))
                elif path == 'delete':
                    changed = db.execute('DELETE FROM messages WHERE id=?', (data.get('id'),))
                else:
                    raise RequestError(404, 'Not found.')
                if not changed.rowcount:
                    raise RequestError(404, 'This message has been deleted.')
                db.commit()
                self.reply(200, {'ok': True})
                return
            raise RequestError(404, 'Not found.')


if __name__ == '__main__':
    ThreadingHTTPServer(('127.0.0.1', int(os.environ.get('FEEDBACK_PORT', '8081'))), Handler).serve_forever()
