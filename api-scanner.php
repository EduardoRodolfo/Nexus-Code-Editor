<?php
// ============================================================
// SCANNER DE MODELOS - Nexus Engine Bridge
// ============================================================
// Escanea la carpeta /modelos/ y devuelve los modelos disponibles
// ============================================================

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

$modelsDir = __DIR__ . '/modelos/';
$models = [];

// Verificar si la carpeta existe
if (!is_dir($modelsDir)) {
    echo json_encode([
        'success' => true,
        'models' => [],
        'count' => 0,
        'directory' => 'modelos/',
        'message' => 'La carpeta modelos/ no existe. Créala en: ' . $modelsDir
    ]);
    exit;
}

// Escanear archivos .gguf
$files = glob($modelsDir . '*.gguf');

// También escanear subcarpetas
$subdirs = glob($modelsDir . '*', GLOB_ONLYDIR);
foreach ($subdirs as $subdir) {
    $subFiles = glob($subdir . '/*.gguf');
    $files = array_merge($files, $subFiles);
}

// Si no hay .gguf, buscar cualquier archivo grande (posibles modelos)
if (empty($files)) {
    $allFiles = glob($modelsDir . '*');
    foreach ($allFiles as $file) {
        if (is_file($file) && filesize($file) > 50000000) { // Mayor a 50MB
            $files[] = $file;
        }
    }
}

// Procesar cada archivo encontrado
foreach ($files as $file) {
    $fileName = basename($file);
    $fileSize = filesize($file);
    $fileDate = date('Y-m-d H:i:s', filemtime($file));
    
    // Formatear tamaño
    if ($fileSize > 1073741824) {
        $sizeFormatted = round($fileSize / 1073741824, 2) . ' GB';
    } elseif ($fileSize > 1048576) {
        $sizeFormatted = round($fileSize / 1048576, 2) . ' MB';
    } else {
        $sizeFormatted = round($fileSize / 1024, 2) . ' KB';
    }
    
    // Nombre del modelo (sin extensión)
    $modelName = pathinfo($fileName, PATHINFO_FILENAME);
    
    // Detectar si es un modelo conocido por patrones en el nombre
    $knownModels = [
        'phi' => 'Phi',
        'qwen' => 'Qwen',
        'tinyllama' => 'TinyLlama',
        'llama' => 'Llama',
        'mistral' => 'Mistral',
        'gemma' => 'Gemma',
        'deepseek' => 'DeepSeek',
        'codellama' => 'CodeLlama',
        'falcon' => 'Falcon',
        'stable' => 'StableLM',
        'nexus' => 'Nexus'
    ];
    
    $detectedType = 'Desconocido';
    $detectedName = $modelName;
    foreach ($knownModels as $key => $label) {
        if (stripos($modelName, $key) !== false) {
            $detectedType = $label;
            $detectedName = $modelName;
            break;
        }
    }
    
    // Determinar si es recomendado para 12GB RAM
    $isRecommended = $fileSize < 2000000000; // Menor a 2GB
    
    $models[] = [
        'name' => $modelName,
        'file' => $fileName,
        'path' => str_replace(__DIR__ . '/', '', $file),
        'size' => $sizeFormatted,
        'size_bytes' => $fileSize,
        'modified_at' => $fileDate,
        'type' => $detectedType,
        'recommended' => $isRecommended,
        'source' => 'local'
    ];
}

// Ordenar por tamaño (más pequeños primero)
usort($models, function($a, $b) {
    return $a['size_bytes'] - $b['size_bytes'];
});

echo json_encode([
    'success' => true,
    'models' => $models,
    'count' => count($models),
    'directory' => 'modelos/',
    'message' => count($models) > 0 
        ? count($models) . ' modelo(s) encontrado(s) en modelos/'
        : 'No se encontraron modelos en modelos/. Coloca archivos .gguf allí.'
], JSON_PRETTY_PRINT);
?>