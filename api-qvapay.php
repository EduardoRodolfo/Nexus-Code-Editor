<?php
// ============================================================
// 💰 NEXUS CODE EDITOR - API QvaPay v2.0
// ============================================================

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);

// ===== CONFIGURACIÓN =====
// ⚠️ CAMBIA ESTOS VALORES POR TUS CLAVES REALES DE QVAPAY
define('QVAPAY_APP_ID', '47ccd302-22c0-4628-af99-729f85f42d0f');
define('QVAPAY_SECRET_KEY', 'ad4904620d20adf967c168a1db5ab9da8c8cc71a967ba34960');
define('QVAPAY_API_URL', 'https://api.qvapay.com/v2');
define('SITE_URL', 'https://EduardoRodolfo.github.io/Nexus-Code-Editor');

// ===== PLANES =====
$PLANES = [
    'full' => ['nombre' => 'Nexus Full', 'precio' => 18, 'moneda' => 'EUR'],
    'pro' => ['nombre' => 'Nexus Pro', 'precio' => 19.99, 'moneda' => 'USD'],
    'premium' => ['nombre' => 'Nexus Premium', 'precio' => 39.99, 'moneda' => 'USD']
];

// ===== FUNCIONES =====

function generarApiKey($plan) {
    $prefix = strtoupper($plan);
    $random = bin2hex(random_bytes(12));
    $checksum = strtoupper(substr(md5($random . time()), 0, 6));
    return "NEXUS-{$prefix}-{$random}-{$checksum}";
}

function guardarLicencia($licencia, $plan, $email, $monto, $apiKey) {
    $archivo = __DIR__ . '/licencias.json';
    $licencias = file_exists($archivo) ? json_decode(file_get_contents($archivo), true) ?? [] : [];
    
    $licencias[] = [
        'licencia' => $licencia,
        'plan' => $plan,
        'email' => $email,
        'monto' => $monto,
        'moneda' => 'USD',
        'api_key' => $apiKey,
        'fecha' => date('Y-m-d H:i:s'),
        'activa' => true,
        'ip' => $_SERVER['REMOTE_ADDR'] ?? 'desconocida'
    ];
    
    file_put_contents($archivo, json_encode($licencias, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    return end($licencias);
}

function enviarEmailLicencia($email, $nombre, $apiKey, $plan) {
    $asunto = "🎉 ¡Bienvenido a Nexus " . ucfirst($plan) . "! Tu licencia está lista";
    
    $mensaje = "
    <html><head><style>
        body { font-family: Arial, sans-serif; background: #0a0e1a; color: #e2e8f0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #111827; border: 1px solid #2a3a5c; border-radius: 12px; padding: 30px; }
        h1 { color: #00d4aa; text-align: center; }
        .api-key { background: #0a0a1a; padding: 15px; border-radius: 8px; text-align: center; font-size: 1.2em; letter-spacing: 2px; color: #22c55e; border: 1px dashed #22c55e; margin: 20px 0; }
        .btn { display: inline-block; background: #00d4aa; color: #000; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 700; }
        .footer { text-align: center; color: #4a5568; font-size: 0.85em; margin-top: 20px; }
    </style></head><body>
        <div class='container'>
            <h1>🎉 ¡Felicidades, $nombre!</h1>
            <p style='text-align:center;'>Tu licencia <strong style='color:#00d4aa;'>Nexus " . ucfirst($plan) . "</strong> está activa.</p>
            <p style='text-align:center;'>🔑 <strong>Tu API Key única:</strong></p>
            <div class='api-key'>$apiKey</div>
            <p style='text-align:center;'>
                <a href='" . SITE_URL . "/index.html?apikey=$apiKey' class='btn'>🚀 Activar Nexus Ahora</a>
            </p>
            <p style='color:#8892b0; text-align:center;'>
                💡 Ingresa esta API Key en Nexus → Ajustes → Activación
            </p>
            <hr style='border-color:#2a3a5c; margin:20px 0;'>
            <div class='footer'>
                <p>Nexus Code Editor &copy; " . date('Y') . "</p>
            </div>
        </div>
    </body></html>";
    
    $headers = "MIME-Version: 1.0\r\n";
    $headers .= "Content-type: text/html; charset=utf-8\r\n";
    $headers .= "From: Nexus Code Editor <noreply@nexus-coder.com>\r\n";
    
    return mail($email, $asunto, $mensaje, $headers);
}

// ===== PROCESAR SOLICITUD =====
$action = $_GET['action'] ?? '';

switch ($action) {
    
   case 'crear_factura':
    $plan = $_POST['plan'] ?? '';
    $email = $_POST['email'] ?? '';
    
    if (!isset($PLANES[$plan])) die(json_encode(['success' => false, 'error' => 'Plan no válido']));
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) die(json_encode(['success' => false, 'error' => 'Email no válido']));
    
    $planData = $PLANES[$plan];
    $remoteId = 'NEXUS-' . $plan . '-' . time();
    
    // ============================================
    // CREAR FACTURA EN QVAPAY v2 - ENDPOINT CORRECTO
    // ============================================
    $payload = json_encode([
        'amount' => $planData['precio'],
        'description' => 'Nexus ' . $planData['nombre'] . ' - Licencia de por vida',
        'remote_id' => $remoteId,
        'webhook' => 'https://nexus-api-b0ue.onrender.com/webhook-qvapay.php'
    ]);
    
    $ch = curl_init(QVAPAY_API_URL . '/create_invoice');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $payload,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'app-id: ' . QVAPAY_APP_ID,
            'app-secret: ' . QVAPAY_SECRET_KEY
        ],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_FOLLOWLOCATION => true
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    $result = json_decode($response, true);
    
    // Depuración en log
    file_put_contents(__DIR__ . '/logs/api-qvapay.log', 
        date('[Y-m-d H:i:s] ') . "HTTP $httpCode | " . json_encode($result) . "\n", 
        FILE_APPEND
    );
    
    // Buscar URL de pago en diferentes formatos
    $invoiceUrl = '';
    $invoiceUuid = '';
    
    if (isset($result['url'])) {
        $invoiceUrl = $result['url'];
    } elseif (isset($result['data']['url'])) {
        $invoiceUrl = $result['data']['url'];
    } elseif (isset($result['invoice_url'])) {
        $invoiceUrl = $result['invoice_url'];
    } elseif (isset($result['data']['invoice_url'])) {
        $invoiceUrl = $result['data']['invoice_url'];
    }
    
    if (isset($result['uuid'])) {
        $invoiceUuid = $result['uuid'];
    } elseif (isset($result['data']['uuid'])) {
        $invoiceUuid = $result['data']['uuid'];
    } elseif (isset($result['transaction_uuid'])) {
        $invoiceUuid = $result['transaction_uuid'];
    }
    
    if (!empty($invoiceUrl)) {
        // ✅ Redirigir a QvaPay
        echo json_encode([
            'success' => true,
            'url' => $invoiceUrl,
            'invoice_uuid' => $invoiceUuid,
            'remote_id' => $remoteId,
            'message' => 'Redirigiendo a QvaPay...'
        ]);
    } elseif (!empty($invoiceUuid)) {
        // Si no devuelve URL pero tiene UUID, construir URL manualmente
        $manualUrl = 'https://qvapay.com/pay/' . $invoiceUuid;
        echo json_encode([
            'success' => true,
            'url' => $manualUrl,
            'invoice_uuid' => $invoiceUuid,
            'remote_id' => $remoteId,
            'message' => 'Redirigiendo a QvaPay...'
        ]);
    } else {
        // ⚠️ Modo simulación
        $apiKey = generarApiKey($plan);
        $licenciaId = 'NEXUS-' . strtoupper($plan) . '-' . time();
        
        guardarLicencia($licenciaId, $plan, $email, $planData['precio'], $apiKey);
        enviarEmailLicencia($email, 'Usuario', $apiKey, $plan);
        
        echo json_encode([
            'success' => true,
            'modo' => 'simulacion',
            'message' => '✅ Licencia generada (modo simulación).',
            'api_key' => $apiKey,
            'plan' => $plan,
            'debug_http' => $httpCode,
            'debug_error' => $error,
            'debug_response' => $result
        ]);
    }
    break;
    
    case 'verificar':
        $apiKey = $_GET['apikey'] ?? $_POST['apikey'] ?? '';
        if (empty($apiKey)) die(json_encode(['success' => false, 'error' => 'API Key requerida']));
        
        $archivo = __DIR__ . '/licencias.json';
        if (!file_exists($archivo)) die(json_encode(['success' => true, 'valida' => false, 'error' => 'No hay licencias']));
        
        $licencias = json_decode(file_get_contents($archivo), true) ?? [];
        foreach ($licencias as $l) {
            if (($l['api_key'] ?? '') === $apiKey && ($l['activa'] ?? false)) {
                echo json_encode(['success' => true, 'valida' => true, 'plan' => $l['plan'], 'email' => $l['email'], 'fecha' => $l['fecha'], 'api_key' => $l['api_key']]);
                exit;
            }
        }
        echo json_encode(['success' => true, 'valida' => false, 'error' => 'API Key no válida']);
        break;
    
    case 'planes':
    echo json_encode(['success' => true, 'planes' => $PLANES]);
        break;

           case 'test_qvapay':
    // Probar conexión con QvaPay v2 - INFO
    $payload = json_encode([]);
    $ch = curl_init(QVAPAY_API_URL . '/info');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $payload,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'app-id: ' . QVAPAY_APP_ID,
            'app-secret: ' . QVAPAY_SECRET_KEY
        ],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 15,
        CURLOPT_FOLLOWLOCATION => true
    ]);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    echo json_encode([
        'success' => $httpCode === 200,
        'http_code' => $httpCode,
        'curl_error' => $error,
        'response_raw' => json_decode($response, true) ?? $response,
        'app_id' => QVAPAY_APP_ID,
        'api_url' => QVAPAY_API_URL
    ]);
    break;

    default:
        echo json_encode([
            'success' => true,
            'message' => '💰 Nexus Payment API v2.0',
            'endpoints' => [
                'crear_factura' => 'POST ?action=crear_factura (plan, email)',
                'verificar' => 'GET ?action=verificar&apikey=XXXX',
                'planes' => 'GET ?action=planes'
            ]
        ]);
}
?>