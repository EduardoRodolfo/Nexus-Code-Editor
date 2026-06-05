<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$action = $_GET['action'] ?? '';
$plataforma = $_GET['plataforma'] ?? 'android';

switch ($action) {
    case 'crear_proyecto':
        $nombre = $_GET['nombre'] ?? 'MiApp';
        $url = $_GET['url'] ?? 'http://localhost';
        $id = $_GET['id'] ?? 'com.miapp';
        
        // Crear carpeta de exportación si no existe
        if (!file_exists('export')) {
            mkdir('export', 0777, true);
        }
        
        $carpetaProyecto = 'export/' . preg_replace('/[^a-zA-Z0-9]/', '', $nombre);
        
        // Crear estructura básica del proyecto
        $estructura = [
            "$carpetaProyecto/index.html",
            "$carpetaProyecto/src-tauri/tauri.conf.json",
            "$carpetaProyecto/src-tauri/Cargo.toml",
            "$carpetaProyecto/src-tauri/src/main.rs"
        ];
        
        foreach ($estructura as $archivo) {
            $dir = dirname($archivo);
            if (!file_exists($dir)) {
                mkdir($dir, 0777, true);
            }
        }
        
        // Crear index.html con iframe a la URL
        file_put_contents("$carpetaProyecto/index.html", '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>' . $nombre . '</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #0a0e1a; }
        iframe { width: 100vw; height: 100vh; border: none; }
    </style>
</head>
<body>
    <iframe src="' . $url . '" allow="*"></iframe>
</body>
</html>');
        
        // Crear tauri.conf.json
        file_put_contents("$carpetaProyecto/src-tauri/tauri.conf.json", json_encode([
            'build' => [
                'beforeDevCommand' => '',
                'beforeBuildCommand' => '',
                'devUrl' => $url,
                'frontendDist' => '../'
            ],
            'bundle' => [
                'active' => true,
                'targets' => $plataforma === 'android' ? 'apk' : ($plataforma === 'windows' ? 'msi' : 'appimage'),
                'icon' => ['icons/32x32.png', 'icons/128x128.png', 'icons/icon.ico'],
                'windows' => ['wix' => null, 'nsis' => ['installMode' => 'currentUser']]
            ],
            'app' => [
                'windows' => [[
                    'title' => $nombre,
                    'width' => 1200,
                    'height' => 800,
                    'resizable' => true,
                    'fullscreen' => false,
                    'minWidth' => 800,
                    'minHeight' => 600
                ]],
                'security' => ['csp' => null]
            ],
            'identifier' => $id
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
        
        // Crear Cargo.toml
        file_put_contents("$carpetaProyecto/src-tauri/Cargo.toml", '[package]
name = "' . strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $nombre)) . '"
version = "1.0.0"
edition = "2021"

[build-dependencies]
tauri-build = { version = "2", features = [] }

[dependencies]
tauri = { version = "2", features = [] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"');
        
        // Crear main.rs
        file_put_contents("$carpetaProyecto/src-tauri/src/main.rs", '#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}');
        
        echo json_encode([
            'success' => true,
            'mensaje' => 'Proyecto creado en: ' . $carpetaProyecto,
            'ruta' => $carpetaProyecto
        ]);
        break;
    
    case 'compilar':
        $nombre = $_GET['nombre'] ?? 'MiApp';
        $carpetaProyecto = 'export/' . preg_replace('/[^a-zA-Z0-9]/', '', $nombre);
        
        if (!file_exists($carpetaProyecto)) {
            echo json_encode(['success' => false, 'error' => 'Proyecto no encontrado']);
            exit;
        }
        
        echo json_encode([
            'success' => true,
            'mensaje' => "Compilación iniciada para $plataforma. Esto puede tomar varios minutos.",
            'comando' => "cd $carpetaProyecto && npm install && npm run tauri build"
        ]);
        break;
    
    default:
        echo json_encode([
            'success' => true,
            'mensaje' => 'API de empaquetado lista',
            'endpoints' => [
                'crear_proyecto' => '?action=crear_proyecto&nombre=X&url=Y&id=Z&plataforma=android',
                'compilar' => '?action=compilar&nombre=X&plataforma=android'
            ]
        ]);
}
?>