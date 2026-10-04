import os
import sys
import time
import socket
import threading
import subprocess
import webbrowser
from http.server import SimpleHTTPRequestHandler
from socketserver import TCPServer

def get_base_dir():
    # PyInstaller creates a temp folder and stores path in _MEIPASS
    if hasattr(sys, '_MEIPASS'):
        return sys._MEIPASS
    return os.path.dirname(os.path.abspath(__file__))

def get_free_port():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('', 0))
        return s.getsockname()[1]

class QuietHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=get_base_dir(), **kwargs)

    def log_message(self, format, *args):
        # Suppress logging in GUI mode
        pass

def find_browser():
    candidates = [
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        os.path.expandvars(r"%LocalAppData%\Google\Chrome\Application\chrome.exe"),
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
        os.path.expandvars(r"%LocalAppData%\Microsoft\Edge\Application\msedge.exe"),
    ]
    for path in candidates:
        if os.path.exists(path):
            return path
    return None

def main():
    port = get_free_port()
    TCPServer.allow_reuse_address = True
    httpd = TCPServer(("127.0.0.1", port), QuietHandler)
    
    server_thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    server_thread.start()

    url = f"http://127.0.0.1:{port}/index.html"
    browser = find_browser()

    if browser:
        # Launch browser in app mode (window without address bar/tabs)
        proc = subprocess.Popen([browser, f"--app={url}"])
        proc.wait()
    else:
        # Fallback to standard default browser
        webbrowser.open(url)
        # Keep running
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            pass

    httpd.shutdown()

if __name__ == '__main__':
    main()
