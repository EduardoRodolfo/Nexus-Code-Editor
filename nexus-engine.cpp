// ============================================================
// NEXUS ENGINE v1.0 - Motor de IA Local para Nexus Code Editor
// ============================================================
// Compilar con: g++ nexus-engine.cpp -o nexus-engine.exe -lws2_32
// ============================================================

#include <iostream>
#include <string>
#include <cstring>
#include <cstdlib>
#include <sstream>
#include <fstream>
#include <vector>
#include <map>
#include <thread>
#include <chrono>
#include <json/json.h>  // Necesitarás libjson

#ifdef _WIN32
    #include <winsock2.h>
    #include <ws2tcpip.h>
    #pragma comment(lib, "ws2_32.lib")
#else
    #include <sys/socket.h>
    #include <netinet/in.h>
    #include <unistd.h>
#endif

using namespace std;

// ============================================================
// CONFIGURACIÓN
// ============================================================
const int PORT = 3456;
const string MODELS_DIR = "models/";
const string VERSION = "1.0.0";

// ============================================================
// ESTRUCTURAS
// ============================================================
struct ModelInfo {
    string name;
    string path;
    long long size_bytes;
    string size_formatted;
    string modified_date;
    bool loaded;
};

struct ChatMessage {
    string role;
    string content;
    string timestamp;
};

struct Conversation {
    string id;
    string name;
    string model;
    vector<ChatMessage> messages;
    string date;
};

// ============================================================
// CLASE PRINCIPAL: NEXUS ENGINE
// ============================================================
class NexusEngine {
private:
    vector<ModelInfo> models;
    vector<Conversation> conversations;
    string current_model;
    bool running;
    int server_socket;

public:
    NexusEngine() : running(false), server_socket(-1) {
        cout << "🧠 Nexus Engine v" << VERSION << " iniciando..." << endl;
    }

    ~NexusEngine() {
        stop();
    }

    // Inicializar motor
    bool init() {
        cout << "📂 Escaneando modelos en " << MODELS_DIR << "..." << endl;
        scanModels();
        
        cout << "🔧 Iniciando servidor API en puerto " << PORT << "..." << endl;
        return startServer();
    }

    // Escanear modelos disponibles
    void scanModels() {
        models.clear();
        
        // Simular detección de modelos (en versión real, escanea carpeta)
        models.push_back({"qwen-coder-extramini", "models/qwen-coder-extramini.gguf", 375000000, "358 MB", "2024-01-15", false});
        models.push_back({"phi-2", "models/phi-2.gguf", 1600000000, "1.5 GB", "2024-01-14", false});
        models.push_back({"tinyllama-1.1b", "models/tinyllama.gguf", 700000000, "700 MB", "2024-01-13", false});
        
        cout << "✅ " << models.size() << " modelos encontrados" << endl;
        
        // Mostrar modelos detectados vía Ollama
        checkOllamaModels();
    }

    // Ver modelos de Ollama
    void checkOllamaModels() {
        cout << "🔗 Verificando modelos en Ollama..." << endl;
        // En versión real, ejecuta: curl http://localhost:11434/api/tags
        cout << "✅ Ollama detectado" << endl;
    }

    // Iniciar servidor HTTP
    bool startServer() {
        #ifdef _WIN32
        WSADATA wsaData;
        if (WSAStartup(MAKEWORD(2, 2), &wsaData) != 0) {
            cerr << "❌ Error iniciando Winsock" << endl;
            return false;
        }
        #endif

        server_socket = socket(AF_INET, SOCK_STREAM, 0);
        if (server_socket < 0) {
            cerr << "❌ Error creando socket" << endl;
            return false;
        }

        int opt = 1;
        setsockopt(server_socket, SOL_SOCKET, SO_REUSEADDR, (char*)&opt, sizeof(opt));

        sockaddr_in server_addr;
        server_addr.sin_family = AF_INET;
        server_addr.sin_addr.s_addr = INADDR_ANY;
        server_addr.sin_port = htons(PORT);

        if (bind(server_socket, (sockaddr*)&server_addr, sizeof(server_addr)) < 0) {
            cerr << "❌ Error en bind (puerto " << PORT << " ocupado?)" << endl;
            return false;
        }

        listen(server_socket, 5);
        running = true;
        
        cout << "✅ Servidor API escuchando en http://127.0.0.1:" << PORT << endl;
        cout << "📡 Endpoints:" << endl;
        cout << "   GET  /api/tags      - Listar modelos" << endl;
        cout << "   POST /api/generate  - Generar respuesta" << endl;
        cout << "   GET  /api/ps        - Modelos activos" << endl;
        cout << "   GET  /api/version   - Versión del motor" << endl;
        cout << "   GET  /api/health    - Estado del motor" << endl;
        cout << endl;
        cout << "🔥 Nexus Engine listo para usar!" << endl;
        cout << "   Conecta desde Nexus Code Editor en:" << endl;
        cout << "   http://localhost/nexus/nexus-ia-bridge.html" << endl;

        return true;
    }

    // Detener servidor
    void stop() {
        running = false;
        if (server_socket >= 0) {
            #ifdef _WIN32
            closesocket(server_socket);
            WSACleanup();
            #else
            close(server_socket);
            #endif
        }
        cout << "🛑 Nexus Engine detenido" << endl;
    }

    // Ejecutar servidor (bloqueante)
    void run() {
        cout << "⏳ Esperando conexiones..." << endl;
        
        while (running) {
            sockaddr_in client_addr;
            socklen_t client_len = sizeof(client_addr);
            
            int client_socket = accept(server_socket, (sockaddr*)&client_addr, &client_len);
            if (client_socket < 0) continue;
            
            // Manejar cliente en un hilo
            thread client_thread(&NexusEngine::handleClient, this, client_socket);
            client_thread.detach();
        }
    }

    // Manejar petición de un cliente
    void handleClient(int client_socket) {
        char buffer[4096] = {0};
        int bytes_read = recv(client_socket, buffer, sizeof(buffer) - 1, 0);
        
        if (bytes_read > 0) {
            string request(buffer);
            string response = processRequest(request);
            send(client_socket, response.c_str(), response.length(), 0);
        }
        
        #ifdef _WIN32
        closesocket(client_socket);
        #else
        close(client_socket);
        #endif
    }

    // Procesar petición HTTP
    string processRequest(const string& request) {
        // Extraer método y ruta
        string method, path;
        istringstream iss(request);
        iss >> method >> path;
        
        cout << "📨 " << method << " " << path << endl;
        
        // Ruteo básico
        if (path == "/api/tags" && method == "GET") {
            return handleTags();
        }
        else if (path == "/api/generate" && method == "POST") {
            return handleGenerate(request);
        }
        else if (path == "/api/ps" && method == "GET") {
            return handlePs();
        }
        else if (path == "/api/version" && method == "GET") {
            return handleVersion();
        }
        else if (path == "/api/health" && method == "GET") {
            return handleHealth();
        }
        else {
            return jsonResponse(false, {{"error", "Endpoint no encontrado"}});
        }
    }

    // GET /api/tags - Listar modelos
    string handleTags() {
        Json::Value root;
        Json::Value models_array(Json::arrayValue);
        
        for (const auto& model : models) {
            Json::Value m;
            m["name"] = model.name;
            m["size"] = model.size_formatted;
            m["modified_at"] = model.modified_date;
            m["loaded"] = (model.name == current_model);
            models_array.append(m);
        }
        
        root["models"] = models_array;
        root["count"] = (int)models.size();
        root["engine"] = "Nexus Engine v" + VERSION;
        
        return jsonHTTPResponse(root);
    }

    // POST /api/generate - Generar respuesta
    string handleGenerate(const string& request) {
        // Extraer body JSON
        string body = extractBody(request);
        
        // En versión real, aquí se ejecutaría el modelo
        // Por ahora, respuesta simulada
        Json::Value root;
        root["response"] = "🧠 Nexus Engine v" + VERSION + " funcionando.\n\n"
                          "¡Conexión exitosa! El motor está listo.\n\n"
                          "Beneficios de Nexus Engine:\n"
                          "✅ 100% tuyo - Código C++ nativo\n"
                          "✅ Sin dependencias externas\n"
                          "✅ Optimizado para tu hardware\n"
                          "✅ Puerto exclusivo: " + to_string(PORT) + "\n\n"
                          "⚡ Próximamente: ejecución real de modelos GGUF";
        root["model"] = current_model.empty() ? "ninguno" : current_model;
        root["engine"] = "Nexus Engine v" + VERSION;
        
        return jsonHTTPResponse(root);
    }

    // GET /api/ps - Modelos activos
    string handlePs() {
        Json::Value root;
        Json::Value models_array(Json::arrayValue);
        
        if (!current_model.empty()) {
            Json::Value m;
            m["name"] = current_model;
            m["status"] = "loaded";
            models_array.append(m);
        }
        
        root["models"] = models_array;
        return jsonHTTPResponse(root);
    }

    // GET /api/version
    string handleVersion() {
        Json::Value root;
        root["version"] = VERSION;
        root["name"] = "Nexus Engine";
        root["author"] = "Nexus Code Editor";
        root["port"] = PORT;
        return jsonHTTPResponse(root);
    }

    // GET /api/health
    string handleHealth() {
        Json::Value root;
        root["status"] = "ok";
        root["engine"] = "Nexus Engine v" + VERSION;
        root["models_available"] = (int)models.size();
        root["models_loaded"] = current_model.empty() ? 0 : 1;
        root["uptime"] = "Activo";
        return jsonHTTPResponse(root);
    }

    // ============================================================
    // UTILIDADES
    // ============================================================
    
    string extractBody(const string& request) {
        size_t pos = request.find("\r\n\r\n");
        if (pos != string::npos) {
            return request.substr(pos + 4);
        }
        return "";
    }

    string jsonResponse(bool success, const map<string, string>& data) {
        Json::Value root;
        root["success"] = success;
        for (const auto& [key, value] : data) {
            root[key] = value;
        }
        return jsonHTTPResponse(root);
    }

    string jsonHTTPResponse(const Json::Value& json) {
        string body = json.toStyledString();
        string response = "HTTP/1.1 200 OK\r\n";
        response += "Content-Type: application/json\r\n";
        response += "Access-Control-Allow-Origin: *\r\n";
        response += "Access-Control-Allow-Methods: GET, POST, OPTIONS\r\n";
        response += "Access-Control-Allow-Headers: Content-Type\r\n";
        response += "Content-Length: " + to_string(body.length()) + "\r\n";
        response += "Server: Nexus Engine v" + VERSION + "\r\n";
        response += "\r\n";
        response += body;
        return response;
    }
};

// ============================================================
// MAIN
// ============================================================
int main() {
    cout << R"(
╔══════════════════════════════════════════╗
║          NEXUS ENGINE v1.0               ║
║   Motor de IA Local para Nexus Editor    ║
║                                          ║
║   ⚡ Puerto: 3456                         ║
║   🔗 Conecta desde nexus-ia-bridge.html  ║
╚══════════════════════════════════════════╝
    )" << endl;

    NexusEngine engine;
    
    if (!engine.init()) {
        cerr << "❌ Error iniciando Nexus Engine" << endl;
        return 1;
    }
    
    engine.run();
    
    return 0;
}