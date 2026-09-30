import http.server
import socketserver
import webbrowser
import os
import sys

PORT = 3000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # Enable CORS and disable cache during development
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()

def run():
    os.chdir(DIRECTORY)
    # Try finding an available port if 3000 is taken
    global PORT
    for port_candidate in [3000, 3001, 5000, 8000, 8080]:
        try:
            with socketserver.TCPServer(("", port_candidate), Handler) as httpd:
                PORT = port_candidate
                url = f"http://localhost:{PORT}/index.html"
                print(f"=====================================================")
                print(f" EcoClean Waste Management System is running!")
                print(f" Local URL: {url}")
                print(f" Serving directory: {DIRECTORY}")
                print(f" Press Ctrl+C in this terminal to stop the server.")
                print(f"=====================================================")
                webbrowser.open(url)
                httpd.serve_forever()
                break
        except OSError:
            print(f"Port {port_candidate} in use, trying next...")
            continue

if __name__ == "__main__":
    try:
        run()
    except KeyboardInterrupt:
        print("\nServer stopped gracefully.")
        sys.exit(0)
