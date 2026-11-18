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
    env = dict(os.environ, FEEDBACK_DATA=directory, FEEDBACK_PORT=str(port), FEEDBACK_ADMIN_PASSWORD='', FEEDBACK_COOKIE_SECURE='false')
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
        process = subprocess.Popen([sys.executable, str(Path(__file__).with_name('server.py'))], env=env, stdout=subprocess.PIPE, text=True)
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
        code = process.stdout.readline().strip().split(': ',1)[1]
        assert call('setup-status')[1] == {'needsSetup':True}
        assert call('change-password', {'username':'owner','password':'a-long-new-password'})[0] == 401
        credentials = {'username':'owner','password':'a-long-new-password','code':code}
        assert call('setup', dict(credentials,code='wrong'))[0] == 403
        assert call('setup', dict(credentials,password='short'))[0] == 400
        assert call('setup', credentials, {'Origin':'https://wrong.invalid'})[0] == 403
        assert call('setup', credentials)[0] == 201
        assert call('setup', credentials)[0] == 409
        assert call('setup-status')[1] == {'needsSetup':False}
        _, _, headers = call('login', credentials)
        cookie = headers['Set-Cookie'].split(';')[0]
        old_cookie = cookie
        assert call('account')[1]['username'] == 'owner'
        change = {'username':'new-owner','currentPassword':'a-long-new-password','password':'an-even-longer-new-password'}
        assert call('change-password', dict(change,currentPassword='wrong'))[0] == 403
        assert call('change-password', change)[0] == 200
        assert call('messages')[0] == 401
        assert call('login', credentials)[0] == 401
        new_credentials = {'username':'new-owner','password':'an-even-longer-new-password'}
        assert call('login', new_credentials)[0] == 200
        process.terminate(); process.wait()
        process = start()
        assert call('setup-status')[1] == {'needsSetup':False}
        assert call('login', new_credentials)[0] == 200
        assert call('setup', credentials)[0] == 409
        import sqlite3
        with sqlite3.connect(Path(directory)/'feedback.sqlite3') as db:
            row=db.execute('SELECT salt,hash FROM admin').fetchone()
            assert len(row[0]) == 32 and len(row[1]) == 64
            assert db.execute('SELECT COUNT(*) FROM setup').fetchone()[0] == 0
        db.close()
        print('PASS: no-env setup, code rejection/reuse, password policy, CSRF, password change, session revocation, persistent account')
    finally:
        process.terminate(); process.wait()
