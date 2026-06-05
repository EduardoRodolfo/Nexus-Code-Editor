// ===== EXTENSIÓN PARA EL CANAL ALTERNO DE CONSOLA =====
// Este código es independiente y no modifica la consola principal

class AlternateConsole {
    constructor() {
        this.initializeElements();
        this.setupEventListeners();
        this.commandHistory = [];
        this.historyIndex = -1;
    }

    initializeElements() {
        // Elementos del canal alterno
        this.alternateInput = document.getElementById('alternateConsoleInput');
        this.alternateOutput = document.getElementById('alternateConsoleOutput');
        this.runButton = document.getElementById('runAlternateConsole');
        this.clearInputButton = document.getElementById('clearAlternateInput');
        this.clearOutputButton = document.getElementById('clearAlternateOutput');
    }

    setupEventListeners() {
        // Botón ejecutar
        this.runButton.addEventListener('click', () => {
            this.executeAlternateCode();
        });

        // Botón limpiar código
        this.clearInputButton.addEventListener('click', () => {
            this.clearAlternateInput();
        });

        // Botón limpiar respuesta
        this.clearOutputButton.addEventListener('click', () => {
            this.clearAlternateOutput();
        });

        // Atajos de teclado
        this.alternateInput.addEventListener('keydown', (e) => {
            // Ctrl+Enter para ejecutar
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                this.executeAlternateCode();
            }
            
            // Ctrl+L para limpiar código
            if (e.ctrlKey && e.key === 'l') {
                e.preventDefault();
                this.clearAlternateInput();
            }
            
            // Ctrl+K para limpiar respuesta
            if (e.ctrlKey && e.key === 'k') {
                e.preventDefault();
                this.clearAlternateOutput();
            }
        });
    }

    executeAlternateCode() {
        const code = this.alternateInput.value.trim();
        
        if (!code) {
            this.addToAlternateOutput('❌ No hay código para ejecutar', 'error');
            return;
        }

        // Agregar al historial si es diferente al último comando
        if (this.commandHistory.length === 0 || this.commandHistory[this.commandHistory.length - 1] !== code) {
            this.commandHistory.push(code);
            if (this.commandHistory.length > 20) {
                this.commandHistory.shift();
            }
        }
        this.historyIndex = -1;

        this.addToAlternateOutput('▶️ Ejecutando código...', 'info');
        this.addToAlternateOutput(code, 'code');

        try {
            // Capturar console.log y otros métodos
            const originalConsole = {
                log: console.log,
                error: console.error,
                warn: console.warn,
                info: console.info
            };

            // Redirigir console.log al output alterno
            console.log = (...args) => {
                const message = args.map(arg => 
                    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                ).join(' ');
                this.addToAlternateOutput(message, 'log');
                originalConsole.log.apply(console, args);
            };

            console.error = (...args) => {
                const message = args.map(arg => 
                    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                ).join(' ');
                this.addToAlternateOutput(`❌ ${message}`, 'error');
                originalConsole.error.apply(console, args);
            };

            console.warn = (...args) => {
                const message = args.map(arg => 
                    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                ).join(' ');
                this.addToAlternateOutput(`⚠️ ${message}`, 'warning');
                originalConsole.warn.apply(console, args);
            };

            // Ejecutar el código
            const result = new Function(code)();
            
            // Mostrar el resultado si no es undefined
            if (result !== undefined) {
                this.addToAlternateOutput(`✅ Resultado: ${String(result)}`, 'result');
            } else {
                this.addToAlternateOutput('✅ Código ejecutado correctamente', 'success');
            }

            // Restaurar console original
            console.log = originalConsole.log;
            console.error = originalConsole.error;
            console.warn = originalConsole.warn;
            console.info = originalConsole.info;

        } catch (error) {
            this.addToAlternateOutput(`❌ Error: ${error.message}`, 'error');
        }
    }

    addToAlternateOutput(text, type = 'normal') {
        const timestamp = new Date().toLocaleTimeString();
        let formattedText = '';

        switch (type) {
            case 'error':
                formattedText = `[${timestamp}] ❌ ${text}\n`;
                break;
            case 'warning':
                formattedText = `[${timestamp}] ⚠️ ${text}\n`;
                break;
            case 'info':
                formattedText = `[${timestamp}] ℹ️ ${text}\n`;
                break;
            case 'success':
                formattedText = `[${timestamp}] ✅ ${text}\n`;
                break;
            case 'code':
                formattedText = `[${timestamp}] 📝 Código:\n${text}\n${'-'.repeat(50)}\n`;
                break;
            case 'result':
                formattedText = `[${timestamp}] 💡 ${text}\n`;
                break;
            case 'log':
                formattedText = `[${timestamp}] ${text}\n`;
                break;
            default:
                formattedText = `[${timestamp}] ${text}\n`;
        }

        this.alternateOutput.value += formattedText;
        this.alternateOutput.scrollTop = this.alternateOutput.scrollHeight;
    }

    clearAlternateInput() {
        this.alternateInput.value = '';
        this.alternateInput.focus();
        this.addToAlternateOutput('🗑️ Área de código limpiada', 'info');
    }

    clearAlternateOutput() {
        this.alternateOutput.value = '';
        this.addToAlternateOutput('🧹 Respuesta de consola limpiada', 'info');
    }
}

// Inicializar el canal alterno cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new AlternateConsole();
});