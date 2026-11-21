"""Local preview: set FEEDBACK_ADMIN_PASSWORD, then run python feedback/local.py."""
import os
from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

root = Path(__file__).resolve().parent.parent
os.environ.setdefault('FEEDBACK_DATA', str(root / 'tmp' / 'feedback-local'))
os.environ.setdefault('FEEDBACK_COOKIE_SECURE', 'false')
import server


class LocalHandler(server.Handler, SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(root / 'outputs'), **kwargs)

    def do_GET(self):
        if self.path.startswith('/api/feedback/'):
            return server.Handler.do_GET(self)
        if self.path == '/test/':
            self.send_response(302)
            self.send_header('Location', '/test')
            self.end_headers()
            return
        if self.path == '/test':
            self.path = '/test.html'
        if self.path in ('/admin', '/admin/'):
            self.path = '/admin.html'
        return SimpleHTTPRequestHandler.do_GET(self)


if __name__ == '__main__':
    ThreadingHTTPServer(('127.0.0.1', int(os.environ.get('LOCAL_PORT', '8080'))), LocalHandler).serve_forever()
