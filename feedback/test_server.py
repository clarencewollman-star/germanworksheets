"""Isolated integration tests; never touches the deployed inbox."""
import base64
import io
import json
import os
from pathlib import Path
import socket
import subprocess
import sys
import tempfile
import time
import urllib.request
import urllib.error
from PIL import Image

with tempfile.TemporaryDirectory() as directory:
    with socket.socket() as sock:
        sock.bind(('127.0.0.1', 0))
        port = sock.getsockname()[1]
    env = dict(os.environ, FEEDBACK_DATA=directory, FEEDBACK_PORT=str(port), FEEDBACK_ADMIN_PASSWORD='test-only-password', FEEDBACK_COOKIE_SECURE='false')
    base = f'http://127.0.0.1:{port}/api/feedback/'
    cookie = ''

    def call(path, data=None, headers=None, authorized=True):
        request_headers = {'Content-Type':'application/json', 'X-Feedback-Request':'1'}
        if authorized:
            request_headers['Cookie'] = cookie
        request_headers.update(headers or {})
        request = urllib.request.Request(base + path, data=None if data is None else json.dumps(data).encode(), headers=request_headers)
        try:
            response = urllib.request.urlopen(request)
        except urllib.error.HTTPError as error:
            response = error
        raw = response.read()
        value = json.loads(raw) if response.headers.get_content_type() == 'application/json' else raw
        return response.status, value, response.headers

    def start():
        process = subprocess.Popen([sys.executable, str(Path(__file__).with_name('server.py'))], env=env)
        for _ in range(100):
            try:
                call('messages')
                return process
            except OSError:
                time.sleep(.05)
        process.terminate(); process.wait()
        raise RuntimeError('Server failed to start')

    process = start()
    try:
        assert call('messages')[0] == 401
        assert call('submit', {'message':'hello'}, {'Origin':'https://elsewhere.invalid'})[0] == 403
        assert call('submit', {'message':'hello'}, {'X-Feedback-Request':'0'})[0] == 403
        assert call('submit', {'message':''})[0] == 400
        assert call('submit', {'message':'hello','screenshot':'invalid'})[0] == 400
        image = io.BytesIO()
        Image.new('RGB',(20,20),'white').save(image,'PNG')
        assert call('submit', {'message':'<script>alert(1)</script>', 'screenshot':base64.b64encode(image.getvalue()).decode(), 'page':'/index.html','version':'1.35.0'})[0] == 201
        assert call('login', {'username':'admin','password':'wrong'})[0] == 401
        status, _, headers = call('login', {'username':'admin','password':'test-only-password'})
        assert status == 200 and 'HttpOnly' in headers['Set-Cookie'] and 'SameSite=Strict' in headers['Set-Cookie']
        cookie = headers['Set-Cookie'].split(';')[0]
        status, inbox, _ = call('messages')
        assert status == 200 and inbox['unread'] == 1 and len(inbox['messages']) == 1
        identifier = inbox['messages'][0]['id']
        path = f'messages/{identifier}'
        assert call(path+'/screenshot', authorized=False)[0] == 401
        assert call(path+'/screenshot')[1][:2] == b'\xff\xd8'
        assert call('update', {'id':identifier,'status':'In progress','unread':False})[0] == 200
        assert call('messages')[1]['unread'] == 0
        assert call('update', {'id':identifier,'status':'Resolved','unread':True})[0] == 200
        assert call('messages')[1]['unread'] == 1
        process.terminate(); process.wait()
        process = start()
        assert call('messages')[0] == 401
        _, _, headers = call('login', {'username':'admin','password':'test-only-password'})
        cookie = headers['Set-Cookie'].split(';')[0]
        assert call(path)[1]['status'] == 'Resolved'
        assert call('delete', {'id':identifier})[0] == 200
        assert call(path+'/screenshot')[0] == 404
        assert call('logout', {})[0] == 200
        assert call('messages')[0] == 401
        for _ in range(12):
            status, _, _ = call('submit', {'message':'test'})
        assert status == 429
        print('PASS: submission, screenshot, authentication, CSRF, inbox actions, persistence, session revocation, rate limits')
    finally:
        process.terminate(); process.wait()
