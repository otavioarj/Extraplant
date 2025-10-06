#!/usr/bin/env python3
"""
Proxy simples para contornar problemas de CORS
"""
import http.server
import socketserver
import urllib.request
import urllib.parse
import json
from urllib.error import HTTPError, URLError

class CORSProxyHandler(http.server.SimpleHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def do_POST(self):
        if self.path == '/api-proxy':
            self.handle_api_proxy()
        else:
            super().do_POST()
    
    def handle_api_proxy(self):
        try:
            # Ler o corpo da requisição
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            # Fazer a requisição para a API real
            api_url = "https://wmjhsuoycqmjacablbpjyyzxwq0uohnz.lambda-url.us-east-1.on.aws/"
            
            req = urllib.request.Request(
                api_url,
                data=post_data,
                headers={'Content-Type': 'application/json'}
            )
            
            with urllib.request.urlopen(req, timeout=30) as response:
                data = response.read()
                
                # Enviar resposta com headers CORS
                self.send_response(200)
                self.send_header('Access-Control-Allow-Origin', '*')
                self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
                self.send_header('Access-Control-Allow-Headers', 'Content-Type')
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(data)
                
        except (HTTPError, URLError) as e:
            self.send_response(500)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            error_response = json.dumps({"error": str(e)})
            self.wfile.write(error_response.encode())
        except Exception as e:
            self.send_response(500)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            error_response = json.dumps({"error": f"Erro interno: {str(e)}"})
            self.wfile.write(error_response.encode())

if __name__ == "__main__":
    PORT = 8001
    with socketserver.TCPServer(("", PORT), CORSProxyHandler) as httpd:
        print(f"Proxy CORS rodando na porta {PORT}")
        print(f"Acesse: http://localhost:{PORT}")
        httpd.serve_forever()
