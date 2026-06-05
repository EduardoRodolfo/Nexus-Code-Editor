<?php
// ============================================================
// 📩 NEXUS WEBHOOK - Recibe confirmación de pagos desde QvaPay
// ============================================================

header('Content-Type: application/json');

// Leer datos que envía QvaPay
$input = file_get_contents('php://input');
$data = json_decode($input, true);

// Log para depuración
file_put_contents(__DIR__ . '/logs/webhook.log', 
    date('[Y-m-d H:i:s] ') . json_encode($data) . "\n", 
    FILE_APPEND
);

// Verificar que viene de QvaPay
$apiKey = $_POST['api_key'] ?? $data['api_key'] ?? '';
$externalId = $_POST['external_id'] ?? $data['external_id'] ?? '';
$status = $_POST['status'] ?? $data['status'] ?? '';
$email = $_POST['customer_email'] ?? $data['customer_email'] ?? '';

if ($status !== 'completed' && $status !== 'success') {
    echo json_encode(['success' => false, 'error' => 'Pago no completado']);
    exit;
}

// Determinar el plan desde external_id (ej: NEXUS-pro-12345)
$plan = 'pro';
if (strpos($externalId, 'premium') !== false) $plan = 'premium';

// Generar API Key y guardar licencia
function generarApiKey($plan) {
    $prefix = strtoupper($plan);
    $random = bin2hex(random_bytes(12));
    $checksum = strtoupper(substr(md5($random . time()), 0, 6));
    return "NEXUS-{$prefix}-{$random}-{$checksum}";
}

$apiKeyGenerada = generarApiKey($plan);
$licenciaId = 'NEXUS-' . strtoupper($plan) . '-' . time();

// Guardar en licencias.json
$archivo = __DIR__ . '/licencias.json';
$licencias = file_exists($archivo) ? json_decode(file_get_contents($archivo), true) ?? [] : [];
$licencias[] = [
    'licencia' => $licenciaId,
    'plan' => $plan,
    'email' => $email,
    'monto' => $plan === 'pro' ? 19.99 : 39.99,
    'moneda' => 'USD',
    'api_key' => $apiKeyGenerada,
    'fecha' => date('Y-m-d H:i:s'),
    'activa' => true,
    'origen' => 'qvapay_webhook'
];
file_put_contents($archivo, json_encode($licencias, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

// Enviar email al usuario
enviarEmailLicencia($email, 'Usuario', $apiKeyGenerada, $plan);

echo json_encode(['success' => true, 'message' => 'Licencia activada', 'api_key' => $apiKeyGenerada]);

function enviarEmailLicencia($email, $nombre, $apiKey, $plan) {
    $asunto = "🎉 ¡Bienvenido a Nexus " . ucfirst($plan) . "!";
    $mensaje = "<html><body style='font-family:Arial;background:#0a0e1a;color:#e2e8f0;padding:20px;'>
        <div style='max-width:600px;margin:0 auto;background:#111827;border-radius:12px;padding:30px;border:1px solid #2a3a5c;'>
        <h1 style='color:#00d4aa;text-align:center;'>🎉 ¡Pago confirmado, $nombre!</h1>
        <p style='text-align:center;'>Tu licencia <strong style='color:#00d4aa;'>Nexus " . ucfirst($plan) . "</strong> está activa.</p>
        <p style='text-align:center;'>🔑 <strong>Tu API Key:</strong></p>
        <div style='background:#0a0a1a;padding:15px;border-radius:8px;text-align:center;font-size:1.2em;letter-spacing:2px;color:#22c55e;border:1px dashed #22c55e;margin:20px 0;'>$apiKey</div>
        <p style='text-align:center;'><a href='http://localhost/nexus/index.html?apikey=$apiKey' style='display:inline-block;background:#00d4aa;color:#000;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;'>🚀 Activar Nexus</a></p>
        </div></body></html>";
    
    $headers = "MIME-Version: 1.0\r\nContent-type: text/html; charset=utf-8\r\nFrom: Nexus Code Editor <noreply@nexus-coder.com>\r\n";
    mail($email, $asunto, $mensaje, $headers);
}
?>