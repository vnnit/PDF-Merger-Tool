import http.server
import socketserver
import os
import sys

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # Enable CORS and caching headers if needed
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

def run():
    # Allow address reuse
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("127.0.0.1", PORT), Handler) as httpd:
        print("=" * 60)
        print("🚀 TOOL GHEP FILE PDF (PDF MERGER PRO) DANG CHAY")
        print("=" * 60)
        print(f"👉 Link truy cap Local:     http://127.0.0.1:{PORT}")
        print(f"👉 Link Localhost:          http://localhost:{PORT}")
        print("=" * 60)
        sys.stdout.flush()
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer da dung.")

if __name__ == "__main__":
    run()
