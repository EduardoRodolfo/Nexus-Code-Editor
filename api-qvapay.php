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
define('QVAPAY_API_URL', 'https://qvapay.com/api/v1');
define('SITE_URL', 'http://localhost/nexus');

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
        
        // Modo simulación (para pruebas)
        $licenciaId = 'NEXUS-' . strtoupper($plan) . '-' . time();
        $apiKey = generarApiKey($plan);
        
        guardarLicencia($licenciaId, $plan, $email, $planData['precio'], $apiKey);
        enviarEmailLicencia($email, 'Usuario', $apiKey, $plan);
        
        echo json_encode([
            'success' => true,
            'modo' => 'simulacion',
            'message' => '✅ Licencia generada. Revisa tu email.',
            'licencia' => $licenciaId,
            'api_key' => $apiKey,
            'plan' => $plan
        ]);
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
        echo json_encode(['success' => true, 'planes' => [
            'free' => ['nombre' => 'Nexus Free', 'precio' => 0, 'moneda' => 'USD'],
            'pro' => ['nombre' => 'Nexus Pro', 'precio' => 19.99, 'moneda' => 'USD'],
            'premium' => ['nombre' => 'Nexus Premium', 'precio' => 39.99, 'moneda' => 'USD']
        ]]);
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