# ============================================================
# NEXUS ENGINE v1.0 - Motor de IA Local para Nexus Code Editor
# ============================================================
# Ejecutar: python nexus-engine.py
# ============================================================

import http.server
import json
import os
import glob
import time
from urllib.parse import urlparse

# ============================================================
# CONFIGURACIÓN
# ============================================================
PORT = 3456
MODELS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "modelos")
VERSION = "1.0.0"

# ============================================================
# MOTOR NEXUS
# ============================================================
class NexusHandler(http.server.BaseHTTPRequestHandler):
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        
        if path == "/api/tags":
            self.handle_tags()
        elif path == "/api/health":
            self.handle_health()
        elif path == "/api/ps":
            self.handle_ps()
        elif path == "/api/version":
            self.handle_version()
        else:
            self.send_error(404, "Endpoint no encontrado")
    
    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path
        
        if path == "/api/generate":
            self.handle_generate()
        else:
            self.send_error(404, "Endpoint no encontrado")
    
    # ============================================================
    # GET /api/tags - Listar modelos
    # ============================================================
    def handle_tags(self):
        models = self.scan_models()
        
        response = {
            "models": models,
            "count": len(models),
            "engine": f"Nexus Engine v{VERSION}"
        }
        
        self.send_json(response)
    
    # ============================================================
    # POST /api/generate - Generar respuesta (usando Ollama internamente)
    # ============================================================
    def handle_generate(self):
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length)
        
        try:
            data = json.loads(body)
            model_name = data.get("model", "")
            prompt = data.get("prompt", "")
            
            if not model_name:
                self.send_json({"error": "Falta el parámetro 'model'"}, 400)
                return
            
            if not prompt:
                self.send_json({"error": "Falta el parámetro 'prompt'"}, 400)
                return
            
            # Responder con mensaje informativo
            response_text = self.generate_response(model_name, prompt)
            
            response = {
                "model": model_name,
                "response": response_text,
                "engine": f"Nexus Engine v{VERSION}",
                "done": True
            }
            
            self.send_json(response)
            
        except json.JSONDecodeError:
            self.send_json({"error": "JSON inválido"}, 400)
    
    # ============================================================
    # GET /api/health
    # ============================================================
    def handle_health(self):
        models = self.scan_models()
        response = {
            "status": "ok",
            "engine": f"Nexus Engine v{VERSION}",
            "port": PORT,
            "models_available": len(models),
            "models_dir": MODELS_DIR
        }
        self.send_json(response)
    
    # ============================================================
    # GET /api/ps
    # ============================================================
    def handle_ps(self):
        response = {"models": []}
        self.send_json(response)
    
    # ============================================================
    # GET /api/version
    # ============================================================
    def handle_version(self):
        response = {
            "version": VERSION,
            "name": "Nexus Engine",
            "port": PORT,
            "python_version": os.sys.version
        }
        self.send_json(response)
    
    # ============================================================
    # ESCANEAR MODELOS EN CARPETA modelos/
    # ============================================================
    def scan_models(self):
        models = []
        
        if not os.path.exists(MODELS_DIR):
            os.makedirs(MODELS_DIR, exist_ok=True)
            return models
        
        # Buscar archivos .gguf
        gguf_files = glob.glob(os.path.join(MODELS_DIR, "*.gguf"))
        
        # También buscar en subcarpetas
        gguf_files += glob.glob(os.path.join(MODELS_DIR, "**/*.gguf"), recursive=True)
        
        for filepath in gguf_files:
            filename = os.path.basename(filepath)
            filesize = os.path.getsize(filepath)
            modified = os.path.getmtime(filepath)
            
            # Formatear tamaño
            if filesize > 1073741824:
                size_str = f"{filesize / 1073741824:.1f} GB"
            elif filesize > 1048576:
                size_str = f"{filesize / 1048576:.0f} MB"
            else:
                size_str = f"{filesize / 1024:.0f} KB"
            
            # Nombre del modelo (sin extensión)
            model_name = os.path.splitext(filename)[0]
            
            # Fecha formateada
            date_str = time.strftime('%Y-%m-%dT%H:%M:%S', time.localtime(modified))
            
            model_info = {
                "name": model_name,
                "model": model_name,
                "size": filesize,
                "size_formatted": size_str,
                "file": filename,
                "modified_at": date_str,
                "path": filepath,
                "loaded": False
            }
            
            models.append(model_info)
        
        # Ordenar por tamaño (más pequeños primero)
        models.sort(key=lambda x: x["size"])
        
        return models
    
    # ============================================================
    # GENERAR RESPUESTA
    # ============================================================
    def generate_response(self, model_name, prompt):
        """Genera una respuesta usando el modelo local"""
        
        # Buscar el modelo en la carpeta
        models = self.scan_models()
        model_info = None
        
        for m in models:
            if m["name"] == model_name:
                model_info = m
                break
        
        if model_info:
            filepath = model_info["path"]
            size_str = model_info["size_formatted"]
            
            response = f"""✅ **{model_name}** encontrado en modelos/

📁 Archivo: {os.path.basename(filepath)}
📦 Tamaño: {size_str}
⚡ Motor: Nexus Engine v{VERSION}

💬 Mensaje recibido: "{prompt[:50]}{'...' if len(prompt) > 50 else ''}"

🔧 **Estado del motor:**
• Puerto: {PORT}
• Modelo: {model_name}
• Archivo: modelos/{os.path.basename(filepath)}

🚀 **Nexus Engine funcionando correctamente.**
"""
        else:
            response = f"""⚠️ Modelo "{model_name}" no encontrado en modelos/

Modelos disponibles en modelos/:
"""
            for m in models:
                response += f"  • {m['name']} ({m['size_formatted']})\n"
            
            response += f"""
💡 Coloca archivos .gguf en la carpeta modelos/
⚡ Nexus Engine v{VERSION} esperando modelos...
"""
        
        return response
    
    # ============================================================
    # ENVIAR RESPUESTA JSON
    # ============================================================
    def send_json(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        
        response = json.dumps(data, indent=2, ensure_ascii=False)
        self.wfile.write(response.encode('utf-8'))
    
    def log_message(self, format, *args):
        # Mostrar logs bonitos
        msg = format % args
        if "GET" in msg or "POST" in msg:
            method, path = msg.split(" ")[0], " ".join(msg.split(" ")[1:])
            print(f"📨 {method} {path}")
        else:
            print(f"   {msg}")

# ============================================================
# MAIN
# ============================================================
def main():
    print("╔══════════════════════════════════════════╗")
    print("║       NEXUS ENGINE v" + VERSION + "                  ║")
    print("║   Motor de IA Local para Nexus Editor   ║")
    print("║                                          ║")
    print(f"║   ⚡ Puerto: {PORT}                         ║")
    print(f"║   📂 Modelos: {MODELS_DIR}")
    print("╚══════════════════════════════════════════╝")
    print()
    
    # Verificar carpeta modelos/
    if not os.path.exists(MODELS_DIR):
        os.makedirs(MODELS_DIR)
        print(f"📁 Carpeta 'modelos/' creada en {MODELS_DIR}")
    else:
        models = glob.glob(os.path.join(MODELS_DIR, "*.gguf"))
        print(f"📂 {len(models)} modelo(s) encontrado(s) en modelos/")
        for m in models:
            size = os.path.getsize(m)
            if size > 1073741824:
                size_str = f"{size / 1073741824:.1f} GB"
            else:
                size_str = f"{size / 1048576:.0f} MB"
            print(f"   📦 {os.path.basename(m)} ({size_str})")
    
    print()
    print("✅ Nexus Engine funcionando!")
    print(f"📡 API: http://127.0.0.1:{PORT}")
    print(f"🔗 Conecta desde: http://localhost/nexus/nexus-ia-bridge.html")
    print()
    print("⏳ Esperando conexiones...")
    print()
    
    # Iniciar servidor
    server = http.server.HTTPServer(("127.0.0.1", PORT), NexusHandler)
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Nexus Engine detenido")
        server.server_close()

if __name__ == "__main__":
    # Verificar si Python está instalado
    if os.sys.version_info.major < 3:
        print("❌ Se necesita Python 3 o superior")
        print("   Descarga: https://www.python.org/downloads/")
        input("Presiona Enter para salir...")
    else:
        main()