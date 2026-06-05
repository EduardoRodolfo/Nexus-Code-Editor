<?php
// ============================================================
// API OLLAMA - Backend para Nexus Code Editor
// ============================================================
// Este archivo actúa como puente entre tu frontend y Ollama.
// 
// Endpoints:
//   POST /api-ollama.php?action=generate  - Generar respuesta
//   GET  /api-ollama.php?action=tags      - Listar modelos
//   GET  /api-ollama.php?action=ps        - Modelos en ejecución
//   POST /api-ollama.php?action=pull      - Descargar modelo
//   POST /api-ollama.php?action=delete    - Eliminar modelo
// ============================================================

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Configuración
define('OLLAMA_URL', 'http://localhost:11434');
define('LOG_FILE', __DIR__ . '/logs/ollama.log');

// Crear directorio de logs si no existe
if (!is_dir(__DIR__ . '/logs')) {
    mkdir(__DIR__ . '/logs', 0777, true);
}

// Función para loguear
function logMessage($message) {
    $timestamp = date('Y-m-d H:i:s');
    file_put_contents(LOG_FILE, "[$timestamp] $message\n", FILE_APPEND);
}

// Función para hacer peticiones a Ollama
function callOllama($endpoint, $method = 'GET', $data = null) {
    $url = OLLAMA_URL . $endpoint;
    
    logMessage("Llamando a Ollama: $method $url");
    if ($data) {
        logMessage("Datos: " . json_encode($data));
    }
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 300); // 5 minutos máximo
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10); // Timeout de conexión 10 segundos
    
    if ($method === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    }
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        logMessage("Error de conexión: $error");
        return [
            'success' => false,
            'error' => "Error de conexión con Ollama: $error",
            'code' => 500
        ];
    }
    
    logMessage("Respuesta HTTP $httpCode");
    
    return [
        'success' => $httpCode >= 200 && $httpCode < 300,
        'data' => json_decode($response, true),
        'raw' => $response,
        'code' => $httpCode
    ];
}

// Obtener la acción
$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

// Obtener datos del cuerpo si es POST
$inputData = null;
if ($method === 'POST') {
    $input = file_get_contents('php://input');
    $inputData = json_decode($input, true);
}

logMessage("Acción: $action, Método: $method");

try {
    switch ($action) {
        // ============================================
        // GENERAR RESPUESTA
        // ============================================
        case 'generate':
            if (!$inputData || !isset($inputData['model']) || !isset($inputData['prompt'])) {
                throw new Exception('Faltan parámetros: model y prompt son requeridos');
            }
            
            $result = callOllama('/api/generate', 'POST', [
                'model' => $inputData['model'],
                'prompt' => $inputData['prompt'],
                'stream' => false,
                'options' => [
                    'temperature' => $inputData['temperature'] ?? 0.7,
                    'top_p' => $inputData['top_p'] ?? 0.9,
                    'max_tokens' => $inputData['max_tokens'] ?? 2048
                ]
            ]);
            
            if ($result['success']) {
                echo json_encode([
                    'success' => true,
                    'response' => $result['data']['response'] ?? '',
                    'model' => $inputData['model'],
                    'timing' => [
                        'total_duration' => $result['data']['total_duration'] ?? 0,
                        'load_duration' => $result['data']['load_duration'] ?? 0,
                        'prompt_eval_count' => $result['data']['prompt_eval_count'] ?? 0,
                        'eval_count' => $result['data']['eval_count'] ?? 0
                    ]
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'error' => $result['error'] ?? 'Error desconocido al generar respuesta'
                ]);
            }
            break;
            
        // ============================================
        // LISTAR MODELOS DISPONIBLES
        // ============================================
        case 'tags':
            $result = callOllama('/api/tags');
            
            if ($result['success'] && isset($result['data']['models'])) {
                $models = array_map(function($m) {
                    $size = $m['size'] ?? 0;
                    $sizeFormatted = $size > 1073741824 
                        ? round($size / 1073741824, 2) . ' GB'
                        : round($size / 1048576, 2) . ' MB';
                    
                    return [
                        'name' => $m['name'],
                        'size' => $sizeFormatted,
                        'modified_at' => $m['modified_at'] ?? '',
                        'digest' => $m['digest'] ?? ''
                    ];
                }, $result['data']['models']);
                
                echo json_encode([
                    'success' => true,
                    'models' => $models,
                    'count' => count($models)
                ]);
            } else {
                echo json_encode([
                    'success' => true,
                    'models' => [],
                    'count' => 0,
                    'message' => 'No hay modelos descargados'
                ]);
            }
            break;
            
        // ============================================
        // MODELOS EN EJECUCIÓN
        // ============================================
        case 'ps':
            $result = callOllama('/api/ps');
            
            if ($result['success']) {
                echo json_encode([
                    'success' => true,
                    'models' => $result['data']['models'] ?? []
                ]);
            } else {
                echo json_encode([
                    'success' => true,
                    'models' => []
                ]);
            }
            break;
            
        // ============================================
        // DESCARGAR MODELO
        // ============================================
        case 'pull':
            if (!$inputData || !isset($inputData['model'])) {
                throw new Exception('Parámetro model requerido');
            }
            
            $result = callOllama('/api/pull', 'POST', [
                'model' => $inputData['model'],
                'stream' => false
            ]);
            
            if ($result['success']) {
                echo json_encode([
                    'success' => true,
                    'message' => "Modelo {$inputData['model']} descargado correctamente",
                    'status' => $result['data']['status'] ?? 'success'
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'error' => $result['error'] ?? 'Error al descargar modelo'
                ]);
            }
            break;
            
        // ============================================
        // ELIMINAR MODELO
        // ============================================
        case 'delete':
            if (!$inputData || !isset($inputData['model'])) {
                throw new Exception('Parámetro model requerido');
            }
            
            $result = callOllama('/api/delete', 'DELETE');
            
            if ($result['success']) {
                echo json_encode([
                    'success' => true,
                    'message' => "Modelo {$inputData['model']} eliminado"
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'error' => $result['error'] ?? 'Error al eliminar modelo'
                ]);
            }
            break;
            
        // ============================================
        // HEALTH CHECK
        // ============================================
        case 'health':
            $result = callOllama('/');
            
            echo json_encode([
                'success' => $result['success'],
                'ollama_running' => $result['success'],
                'message' => $result['success'] 
                    ? '✅ Ollama está funcionando' 
                    : '❌ Ollama no está funcionando. Ejecuta: ollama serve'
            ]);
            break;
            
        default:
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'error' => 'Acción no válida. Usa: generate, tags, ps, pull, delete, health'
            ]);
    }
    
} catch (Exception $e) {
    logMessage("Error: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

logMessage("--- Fin de solicitud ---");
?>