<?php
header('Content-Type: text/plain');

echo "=== PRUEBA DE CONEXIÓN A OLLAMA ===\n\n";

// 1. Verificar si curl está disponible
if (!function_exists('curl_init')) {
    die("❌ curl NO está instalado en PHP\n");
}
echo "✅ curl está disponible\n";

// 2. Probar conexión básica
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'http://127.0.0.1:11434');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 5);
curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

echo "\n--- Conexión básica ---\n";
echo "HTTP Code: " . $httpCode . "\n";
echo "Error: " . ($error ? $error : "Ninguno") . "\n";

if ($httpCode > 0) {
    echo "✅ Ollama responde en 127.0.0.1:11434\n";
} else {
    echo "❌ No se puede conectar a 127.0.0.1:11434\n";
    echo "\nPrueba con localhost:\n";
    
    // Intentar con localhost
    $ch2 = curl_init();
    curl_setopt($ch2, CURLOPT_URL, 'http://localhost:11434');
    curl_setopt($ch2, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch2, CURLOPT_TIMEOUT, 5);
    curl_setopt($ch2, CURLOPT_CONNECTTIMEOUT, 5);
    
    $response2 = curl_exec($ch2);
    $httpCode2 = curl_getinfo($ch2, CURLINFO_HTTP_CODE);
    $error2 = curl_error($ch2);
    curl_close($ch2);
    
    echo "HTTP Code: " . $httpCode2 . "\n";
    echo "Error: " . ($error2 ? $error2 : "Ninguno") . "\n";
}

echo "\n--- Probar listar modelos ---\n";
$ch3 = curl_init();
curl_setopt($ch3, CURLOPT_URL, 'http://127.0.0.1:11434/api/tags');
curl_setopt($ch3, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch3, CURLOPT_TIMEOUT, 10);
curl_setopt($ch3, CURLOPT_CONNECTTIMEOUT, 5);

$response3 = curl_exec($ch3);
$httpCode3 = curl_getinfo($ch3, CURLINFO_HTTP_CODE);
$error3 = curl_error($ch3);
curl_close($ch3);

echo "HTTP Code: " . $httpCode3 . "\n";
if ($response3) {
    $data = json_decode($response3, true);
    if ($data && isset($data['models'])) {
        echo "✅ Modelos encontrados: " . count($data['models']) . "\n";
    }
}
if ($error3) {
    echo "Error: " . $error3 . "\n";
}

echo "\n=== FIN DE PRUEBA ===\n";
?>