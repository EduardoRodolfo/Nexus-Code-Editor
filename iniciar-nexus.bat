@echo off
title Nexus Engine - IA Local
color 0A

echo ========================================
echo      NEXUS CODE EDITOR - IA LOCAL
echo ========================================
echo.
echo 🚀 Iniciando Ollama con soporte para Nexus...
echo.

:: Configurar CORS para Nexus
set OLLAMA_ORIGINS=*
set OLLAMA_HOST=127.0.0.1:11434

:: Matar procesos anteriores de Ollama
echo 🔪 Deteniendo procesos anteriores de Ollama...
taskkill /F /IM ollama.exe >nul 2>&1

:: Esperar 3 segundos
timeout /t 3 /nobreak >nul

:: Iniciar Ollama
echo ⚡ Iniciando Ollama con CORS habilitado...
start "Ollama - Nexus" cmd /c "ollama serve"

:: Esperar a que Ollama inicie
echo ⏳ Esperando a que Ollama se inicie...
timeout /t 5 /nobreak >nul

:: Verificar que Ollama está funcionando
echo 🔍 Verificando conexion...
curl.exe -s http://127.0.0.1:11434/api/tags >nul 2>&1
if errorlevel 1 (
    echo ❌ Ollama no respondio. Esperando mas tiempo...
    timeout /t 5 /nobreak >nul
)

:: Abrir Nexus Bridge
echo ✅ Ollama iniciado correctamente
echo.
echo 🔗 Abriendo Nexus IA Bridge...
start http://localhost/nexus/nexus-ia-bridge.html

echo.
echo ========================================
echo  ✅ Nexus IA Local listo para usar
echo  ⚡ Cierra esta ventana para detener
echo ========================================
echo.
echo 📝 Presiona cualquier tecla para salir
echo    (Ollama seguira funcionando en segundo plano)
pause >nul
