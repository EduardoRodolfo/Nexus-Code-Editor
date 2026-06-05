<?php
// ============================================================
// 🔑 Generar API Key para Nexus Code Editor
// ============================================================

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

function generarApiKey($plan = 'pro') {
    $prefix = strtoupper($plan);
    $random = bin2hex(random_bytes(12));
    $checksum = strtoupper(substr(md5($random . time()), 0, 6));
    return "NEXUS-{$prefix}-{$random}-{$checksum}";
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $plan = $_POST['plan'] ?? 'pro';
    $email = $_POST['email'] ?? '';
    
    if (!in_array($plan, ['pro', 'premium'])) {
        die(json_encode(['success' => false, 'error' => 'Plan no válido. Usa: pro o premium']));
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        die(json_encode(['success' => false, 'error' => 'Email no válido']));
    }
    
    $apiKey = generarApiKey($plan);
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
        'api_key' => $apiKey,
        'fecha' => date('Y-m-d H:i:s'),
        'activa' => true
    ];
    file_put_contents($archivo, json_encode($licencias, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    
    echo json_encode([
        'success' => true,
        'api_key' => $apiKey,
        'licencia' => $licenciaId,
        'plan' => $plan,
        'email' => $email,
        'message' => '✅ API Key generada exitosamente'
    ]);
} else {
    // GET: mostrar formulario simple
    echo "<!DOCTYPE html><html lang='es'><head><meta charset='UTF-8'><title>🔑 Generar API Key</title>
    <style>body{font-family:Arial;background:#0a0e1a;color:#e2e8f0;display:flex;justify-content:center;align-items:center;min-height:100vh;}
    .card{background:#111827;border:1px solid #2a3a5c;border-radius:12px;padding:30px;max-width:400px;width:90%;}
    h1{color:#00d4aa;text-align:center;}input,select{width:100%;padding:10px;margin:8px 0;background:#1a2235;border:1px solid #2a3a5c;border-radius:6px;color:#e2e8f0;}
    button{background:#00d4aa;color:#000;border:none;padding:12px;border-radius:6px;font-weight:700;cursor:pointer;width:100%;}
    .result{background:#0a0a1a;padding:15px;border-radius:8px;margin-top:15px;word-break:break-all;color:#22c55e;text-align:center;}</style></head><body>
    <div class='card'><h1>🔑 Generar API Key</h1>
    <form method='POST'><label>Plan:</label>
    <select name='plan'><option value='pro'>⭐ Pro - $19.99</option><option value='premium'>👑 Premium - $39.99</option></select>
    <label>Email:</label><input type='email' name='email' placeholder='usuario@email.com' required>
    <button type='submit'>🔑 Generar API Key</button></form>";
    
    if ($_GET['success'] ?? false) {
        echo "<div class='result'>✅ API Key generada. Revisa el archivo licencias.json</div>";
    }
    
    echo "</div></body></html>";
}
?>