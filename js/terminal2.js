// nexus/js/terminal.js - Terminal Linux para Nexus
// VERSIÓN MEJORADA CON GESTORES DE PAQUETES Y FRAMEWORKS
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si el elemento terminal existe
    const terminalElement = document.getElementById('terminal');
    if (!terminalElement) {
        console.error('Elemento #terminal no encontrado');
        return;
    }

    // =============================================
    // SISTEMA DE PAQUETES VIRTUALES (NUEVO)
    // =============================================
    const packageState = {
        installed: new Set(), // Paquetes instalados
        
        // Cargar desde localStorage
        load() {
            const saved = localStorage.getItem('nexus_terminal_packages');
            if (saved) {
                try {
                    const data = JSON.parse(saved);
                    this.installed = new Set(data);
                } catch(e) {}
            }
        },
        
        // Guardar en localStorage
        save() {
            const data = JSON.stringify([...this.installed]);
            localStorage.setItem('nexus_terminal_packages', data);
        },
        
        // Verificar si un paquete está instalado
        has(pkg) {
            return this.installed.has(pkg);
        },
        
        // Instalar paquete
        install(pkg) {
            this.installed.add(pkg);
            this.save();
        },
        
        // Listar paquetes
        list() {
            return [...this.installed].sort();
        },
        
        // Limpiar todo
        clear() {
            this.installed.clear();
            this.save();
        }
    };
    
    // Inicializar estado de paquetes
    packageState.load();

    // Inicializar terminal
    const terminal = new Terminal({
        cursorBlink: true,
        theme: {
            background: '#0f1724',
            foreground: '#e6eef8',
            cursor: '#0b3b66',
            selection: 'rgba(11, 59, 102, 0.5)'
        },
        fontSize: 14,
        fontFamily: 'Consolas, "Courier New", monospace',
        allowTransparency: true,
        convertEol: true
    });
    
    // Abrir terminal en el contenedor
    terminal.open(terminalElement);
    
    // Mensaje de bienvenida (actualizado)
    terminal.writeln('\x1b[1;32m🚀 Terminal Linux en Nexus\x1b[0m');
    terminal.writeln('\x1b[1;36mVersión 2.0 - Con Gestores de Paquetes y Frameworks\x1b[0m');
    terminal.writeln('Escribe \x1b[1;33m"help"\x1b[0m para ver comandos disponibles');
    terminal.writeln('');
    terminal.writeln('\x1b[1;33m💡 Nuevos comandos:\x1b[0m');
    terminal.writeln('  • \x1b[1;32mapt install <pkg>\x1b[0m - Instala apps Linux');
    terminal.writeln('  • \x1b[1;32mnpm install <lib>\x1b[0m - Instala librerías Node.js');
    terminal.writeln('  • \x1b[1;32mpip install <pkg>\x1b[0m - Instala paquetes Python');
    terminal.writeln('  • \x1b[1;32mframework new <name>\x1b[0m - Crea proyecto con framework');
    terminal.writeln('  • \x1b[1;32mpkg list\x1b[0m - Ver paquetes instalados');
    terminal.writeln('');
    writePrompt();
    
    // Variables
    let currentLine = '';
    const commandHistory = [];
    let historyIndex = -1;
    let isProcessing = false;
    
    // =============================================
    // FUNCIONES AUXILIARES PARA SIMULACIÓN
    // =============================================
    
    // Simular salida con delay progresivo
    function simulateInstall(packageName, manager, callback) {
        const messages = [
            `Leyendo lista de paquetes...`,
            `Creando árbol de dependencias...`,
            `Los siguientes paquetes se instalarán:`,
            `  ${packageName}`,
            `Configurando ${packageName}...`,
            `Procesando disparadores...`
        ];
        
        let i = 0;
        const interval = setInterval(() => {
            if (i < messages.length) {
                terminal.writeln(messages[i]);
                i++;
            } else {
                clearInterval(interval);
                callback();
            }
        }, 200);
    }
    
    // Obtener descripción de framework
    function getFrameworkInfo(framework) {
        const frameworks = {
            'react': { cmd: 'npx create-react-app', lang: 'JavaScript/React' },
            'vue': { cmd: 'npm create vue@latest', lang: 'JavaScript/Vue' },
            'angular': { cmd: 'ng new', lang: 'TypeScript/Angular' },
            'django': { cmd: 'django-admin startproject', lang: 'Python/Django' },
            'laravel': { cmd: 'composer create-project laravel/laravel', lang: 'PHP/Laravel' },
            'flask': { cmd: 'mkdir && python -m venv', lang: 'Python/Flask' },
            'next': { cmd: 'npx create-next-app', lang: 'React/Next.js' },
            'svelte': { cmd: 'npm create svelte@latest', lang: 'Svelte' }
        };
        return frameworks[framework] || { cmd: 'personalizado', lang: 'Desconocido' };
    }
    
    // =============================================
    // COMANDOS MEJORADOS
    // =============================================
    const commands = {
        help: {
            description: 'Muestra esta ayuda',
            execute: () => showHelp()
        },
        clear: {
            description: 'Limpia la terminal',
            execute: () => {
                terminal.clear();
                setTimeout(() => {
                    terminal.writeln('\x1b[1;33mTerminal limpiada\x1b[0m');
                    terminal.writeln('');
                    writePrompt();
                }, 10);
            }
        },
        ls: {
            description: 'Lista archivos y directorios',
            execute: () => {
                terminal.writeln('\x1b[1;34m.\x1b[0m/');
                terminal.writeln('\x1b[1;34m..\x1b[0m/');
                terminal.writeln('\x1b[1;32mindex.html\x1b[0m');
                terminal.writeln('\x1b[1;34mjs/\x1b[0m');
                terminal.writeln('\x1b[1;34mcss/\x1b[0m');
                terminal.writeln('\x1b[1;34mimagenes/\x1b[0m');
                terminal.writeln('\x1b[1;34mace/\x1b[0m');
                terminal.writeln('\x1b[1;36mtutorial-js.html\x1b[0m');
                // Mostrar proyectos creados con framework
                if (packageState.list().some(p => p.startsWith('proj:'))) {
                    terminal.writeln('\x1b[1;34mprojects/\x1b[0m');
                }
            }
        },
        pwd: {
            description: 'Muestra el directorio actual',
            execute: () => terminal.writeln('/home/user/nexus')
        },
        date: {
            description: 'Muestra fecha y hora actual',
            execute: () => {
                const now = new Date();
                terminal.writeln(now.toLocaleString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                }));
            }
        },
        echo: {
            description: 'Muestra texto en pantalla',
            execute: (args) => {
                terminal.writeln(args.length > 0 ? args.join(' ') : '');
            }
        },
        whoami: {
            description: 'Muestra el usuario actual',
            execute: () => terminal.writeln('user')
        },
        neofetch: {
            description: 'Muestra información del sistema',
            execute: () => showNeofetch()
        },
        linux: {
            description: 'Abrir Linux completo en el navegador (JS Linux)',
            execute: () => {
                terminal.writeln('\x1b[1;32m🚀 Iniciando JS Linux...\x1b[0m');
                setTimeout(() => {
                    window.open('https://bellard.org/jslinux/', '_blank');
                    terminal.writeln('\x1b[1;32m✅ JS Linux abierto en nueva pestaña\x1b[0m');
                }, 1500);
            }
        },
        labs: {
            description: 'Abrir panel de Laboratorios Virtuales',
            execute: () => {
                terminal.writeln('\x1b[1;32m🔬 Abriendo Laboratorios Virtuales...\x1b[0m');
                setTimeout(() => {
                    window.open('labs.html', '_blank');
                    terminal.writeln('\x1b[1;32m✅ Panel de laboratorios abierto\x1b[0m');
                }, 1000);
            }
        },
        // ========== NUEVOS COMANDOS ==========
        apt: {
            description: 'Gestor de paquetes Debian/Ubuntu (simulado)',
            execute: (args) => {
                const subCommand = args[0];
                const pkg = args[1];
                
                if (!subCommand) {
                    terminal.writeln('Uso: apt install <paquete>  o  apt list --installed');
                    return;
                }
                
                if (subCommand === 'install' && pkg) {
                    if (packageState.has(pkg)) {
                        terminal.writeln(`\x1b[1;33m${pkg} ya está instalado.\x1b[0m`);
                        return;
                    }
                    terminal.writeln(`\x1b[1;36mInstalando ${pkg}...\x1b[0m`);
                    simulateInstall(pkg, 'apt', () => {
                        packageState.install(pkg);
                        terminal.writeln(`\x1b[1;32m✅ ${pkg} instalado correctamente.\x1b[0m`);
                    });
                } else if (subCommand === 'list' && args[1] === '--installed') {
                    const pkgs = packageState.list().filter(p => !p.includes(':'));
                    if (pkgs.length === 0) {
                        terminal.writeln('No hay paquetes instalados.');
                    } else {
                        terminal.writeln('Paquetes instalados:');
                        pkgs.forEach(p => terminal.writeln(`  ${p}`));
                    }
                } else {
                    terminal.writeln('Comando no soportado. Prueba: apt install <paquete>');
                }
            }
        },
        npm: {
            description: 'Gestor de paquetes Node.js (simulado)',
            execute: (args) => {
                const subCommand = args[0];
                const pkg = args[1];
                
                if ((subCommand === 'install' || subCommand === 'i') && pkg) {
                    const npmPkg = `npm:${pkg}`;
                    if (packageState.has(npmPkg)) {
                        terminal.writeln(`\x1b[1;33m${pkg} ya está en node_modules.\x1b[0m`);
                        return;
                    }
                    terminal.writeln(`\x1b[1;36mnpm install ${pkg}\x1b[0m`);
                    setTimeout(() => {
                        packageState.install(npmPkg);
                        terminal.writeln(`+ ${pkg}@1.0.0`);
                        terminal.writeln(`added 1 package and audited 2 packages in 0.5s`);
                        terminal.writeln(`\x1b[1;32m✅ ${pkg} instalado.\x1b[0m`);
                    }, 500);
                } else if (subCommand === 'list') {
                    const npmPkgs = packageState.list().filter(p => p.startsWith('npm:'));
                    if (npmPkgs.length === 0) {
                        terminal.writeln('No hay paquetes npm instalados.');
                    } else {
                        terminal.writeln('Paquetes npm instalados:');
                        npmPkgs.forEach(p => terminal.writeln(`  ${p.replace('npm:', '')}`));
                    }
                } else {
                    terminal.writeln('Uso: npm install <paquete>  o  npm list');
                }
            }
        },
        pip: {
            description: 'Gestor de paquetes Python (simulado)',
            execute: (args) => {
                if (args[0] === 'install' && args[1]) {
                    const pkg = args[1];
                    const pipPkg = `pip:${pkg}`;
                    if (packageState.has(pipPkg)) {
                        terminal.writeln(`\x1b[1;33m${pkg} ya está instalado.\x1b[0m`);
                        return;
                    }
                    terminal.writeln(`Collecting ${pkg}`);
                    setTimeout(() => {
                        packageState.install(pipPkg);
                        terminal.writeln(`  Downloading ${pkg}-1.0.0.tar.gz`);
                        terminal.writeln(`Installing collected packages: ${pkg}`);
                        terminal.writeln(`\x1b[1;32m✅ Successfully installed ${pkg}\x1b[0m`);
                    }, 300);
                } else {
                    terminal.writeln('Uso: pip install <paquete>');
                }
            }
        },
        composer: {
            description: 'Gestor de dependencias PHP (simulado)',
            execute: (args) => {
                if (args[0] === 'require' && args[1]) {
                    const pkg = args[1];
                    const compPkg = `composer:${pkg}`;
                    if (packageState.has(compPkg)) {
                        terminal.writeln(`\x1b[1;33m${pkg} ya está instalado.\x1b[0m`);
                        return;
                    }
                    terminal.writeln(`Using version ^1.0 for ${pkg}`);
                    setTimeout(() => {
                        packageState.install(compPkg);
                        terminal.writeln(`  - Installing ${pkg} (1.0.0)`);
                        terminal.writeln(`Writing lock file`);
                        terminal.writeln(`Generating autoload files`);
                        terminal.writeln(`\x1b[1;32m✅ ${pkg} instalado.\x1b[0m`);
                    }, 400);
                } else {
                    terminal.writeln('Uso: composer require <paquete>');
                }
            }
        },
        framework: {
            description: 'Crea un nuevo proyecto con framework popular',
            execute: (args) => {
                if (args[0] === 'new' && args[1]) {
                    const frameworkName = args[1].toLowerCase();
                    const projectName = args[2] || 'mi-proyecto';
                    const projKey = `proj:${frameworkName}:${projectName}`;
                    
                    if (packageState.has(projKey)) {
                        terminal.writeln(`\x1b[1;33mEl proyecto '${projectName}' ya existe.\x1b[0m`);
                        return;
                    }
                    
                    const info = getFrameworkInfo(frameworkName);
                    terminal.writeln(`\x1b[1;36mCreando proyecto ${frameworkName}...\x1b[0m`);
                    terminal.writeln(`> ${info.cmd} ${projectName}`);
                    
                    setTimeout(() => {
                        packageState.install(projKey);
                        terminal.writeln(`✅ Proyecto '${projectName}' creado con ${frameworkName}`);
                        terminal.writeln(`📁 Estructura generada en /home/user/nexus/projects/${projectName}/`);
                        terminal.writeln(`💡 Para comenzar: cd projects/${projectName} && npm start`);
                    }, 600);
                } else {
                    terminal.writeln('Uso: framework new <framework> [nombre-proyecto]');
                    terminal.writeln('Frameworks disponibles: react, vue, angular, django, laravel, flask, next, svelte');
                }
            }
        },
        pkg: {
            description: 'Administra paquetes virtuales',
            execute: (args) => {
                if (args[0] === 'list') {
                    const all = packageState.list();
                    if (all.length === 0) {
                        terminal.writeln('No hay paquetes instalados.');
                    } else {
                        terminal.writeln('\x1b[1;36mPaquetes instalados:\x1b[0m');
                        all.forEach(p => {
                            let icon = '📦';
                            if (p.includes(':')) icon = '📚';
                            if (p.startsWith('proj:')) icon = '📁';
                            terminal.writeln(`  ${icon} ${p}`);
                        });
                    }
                } else if (args[0] === 'clear') {
                    packageState.clear();
                    terminal.writeln('\x1b[1;32m✅ Todos los paquetes han sido eliminados.\x1b[0m');
                } else {
                    terminal.writeln('Uso: pkg list  o  pkg clear');
                }
            }
        },
        docker: {
            description: 'Simula ejecución de contenedores',
            execute: (args) => {
                if (args[0] === 'run' && args[1]) {
                    const image = args[1];
                    terminal.writeln(`Unable to find image '${image}:latest' locally`);
                    terminal.writeln(`latest: Pulling from library/${image}`);
                    setTimeout(() => {
                        terminal.writeln(`Digest: sha256:${Math.random().toString(36)}`);
                        terminal.writeln(`Status: Downloaded newer image for ${image}:latest`);
                        terminal.writeln(`\x1b[1;32m✅ Contenedor ${image} iniciado (simulado)\x1b[0m`);
                    }, 500);
                } else {
                    terminal.writeln('Uso: docker run <imagen>');
                }
            }
        },
        git: {
            description: 'Simula control de versiones',
            execute: (args) => {
                if (args[0] === 'clone' && args[1]) {
                    const repo = args[1];
                    terminal.writeln(`Cloning into '${repo.split('/').pop()}'...`);
                    setTimeout(() => {
                        terminal.writeln(`remote: Enumerating objects: 42, done.`);
                        terminal.writeln(`remote: Counting objects: 100% (42/42), done.`);
                        terminal.writeln(`Receiving objects: 100% (42/42), 10.5 KiB | 2.1 MiB/s, done.`);
                        terminal.writeln(`\x1b[1;32m✅ Repositorio clonado (simulado).\x1b[0m`);
                    }, 400);
                } else {
                    terminal.writeln('Uso: git clone <repositorio>');
                }
            }
        }
    };
    
    // Capturar entrada del teclado (sin cambios)
    terminal.onData(data => {
        if (isProcessing) return;
        
        if (data === '\r') {
            processCommand(currentLine.trim());
            currentLine = '';
        } else if (data === '\u007F' || data === '\b') {
            if (currentLine.length > 0) {
                currentLine = currentLine.slice(0, -1);
                terminal.write('\b \b');
            }
        } else if (data === '\u001B[A') {
            if (commandHistory.length > 0) {
                if (historyIndex < 0) {
                    historyIndex = commandHistory.length - 1;
                } else if (historyIndex > 0) {
                    historyIndex--;
                }
                terminal.write('\r\x1b[K');
                writePrompt();
                currentLine = commandHistory[historyIndex] || '';
                terminal.write(currentLine);
            }
        } else if (data === '\u001B[B') {
            if (historyIndex >= 0 && historyIndex < commandHistory.length - 1) {
                historyIndex++;
                terminal.write('\r\x1b[K');
                writePrompt();
                currentLine = commandHistory[historyIndex] || '';
                terminal.write(currentLine);
            } else if (historyIndex === commandHistory.length - 1) {
                historyIndex = -1;
                terminal.write('\r\x1b[K');
                writePrompt();
                currentLine = '';
            }
        } else if (data === '\t') {
            const matches = Object.keys(commands).filter(cmd => 
                cmd.startsWith(currentLine.toLowerCase())
            );
            if (matches.length === 1) {
                const remaining = matches[0].slice(currentLine.length);
                currentLine = matches[0];
                terminal.write(remaining);
            } else if (matches.length > 1) {
                terminal.writeln('');
                matches.forEach(match => terminal.write(match + '  '));
                terminal.writeln('');
                writePrompt();
                terminal.write(currentLine);
            }
        } else if (data >= ' ' && data <= '~') {
            currentLine += data;
            terminal.write(data);
        }
    });
    
    // Procesar comandos (ligeramente adaptado para funciones asíncronas)
    function processCommand(cmd) {
        if (cmd === '') {
            terminal.write('\r\n');
            writePrompt();
            return;
        }
        
        if (commandHistory[commandHistory.length - 1] !== cmd) {
            commandHistory.push(cmd);
            if (commandHistory.length > 50) commandHistory.shift();
        }
        historyIndex = commandHistory.length;
        
        isProcessing = true;
        terminal.write('\r\n');
        
        const parts = cmd.split(' ');
        const commandName = parts[0].toLowerCase();
        const args = parts.slice(1);
        
        if (commands[commandName]) {
            try {
                commands[commandName].execute(args);
                // Si el comando no es asíncrono (no usa setTimeout interno), debemos resetear isProcessing y escribir prompt
                // Para simplificar, asumimos que comandos como 'clear' manejan su propio timing.
                // Pero para evitar bloqueos, usamos un pequeño retardo antes de escribir el prompt.
                setTimeout(() => {
                    isProcessing = false;
                    writePrompt();
                }, 50);
            } catch (error) {
                terminal.writeln(`\x1b[1;31mError ejecutando ${commandName}: ${error.message}\x1b[0m`);
                isProcessing = false;
                writePrompt();
            }
        } else {
            terminal.writeln(`\x1b[1;31mComando no encontrado: ${commandName}\x1b[0m`);
            terminal.writeln('Escribe \x1b[1;33m"help"\x1b[0m para ver comandos disponibles');
            isProcessing = false;
            writePrompt();
        }
    }
    
    // Mostrar ayuda (actualizada)
    function showHelp() {
        terminal.writeln('\x1b[1;36mComandos disponibles:\x1b[0m');
        terminal.writeln('');
        
        // Agrupar por categorías
        const categories = {
            'Sistema': ['help', 'clear', 'date', 'neofetch', 'whoami', 'pwd'],
            'Archivos': ['ls', 'echo'],
            'Labs': ['linux', 'labs'],
            'Gestores de Paquetes': ['apt', 'npm', 'pip', 'composer'],
            'Desarrollo': ['framework', 'git', 'docker'],
            'Utilidades': ['pkg']
        };
        
        Object.entries(categories).forEach(([cat, cmds]) => {
            terminal.writeln(`\x1b[1;33m${cat}:\x1b[0m`);
            cmds.forEach(cmdName => {
                if (commands[cmdName]) {
                    terminal.write(`  \x1b[1;32m${cmdName.padEnd(14)}\x1b[0m`);
                    terminal.writeln(commands[cmdName].description);
                }
            });
            terminal.writeln('');
        });
        
        terminal.writeln('\x1b[1;33mCaracterísticas:\x1b[0m');
        terminal.writeln('  • Historial de comandos (↑/↓)');
        terminal.writeln('  • Autocompletado con Tab');
        terminal.writeln('  • Simulación de instalación de paquetes');
        terminal.writeln('  • Persistencia con localStorage');
    }
    
    // Función para escribir el prompt (sin cambios)
    function writePrompt() {
        const buffer = terminal.buffer.active;
        const line = buffer.getLine(buffer.cursorY);
        if (line && line.translateToString(true).trim() !== '') {
            terminal.write('\r\n');
        }
        terminal.write('\x1b[1;32muser@nexus\x1b[0m:\x1b[1;34m~\x1b[0m$ ');
    }
    
    // Mostrar neofetch (sin cambios)
    function showNeofetch() {
        terminal.writeln('\x1b[1;36m                    ...\x1b[0m');
        terminal.writeln('\x1b[1;36m                   .::::.\x1b[0m');
        terminal.writeln('\x1b[1;36m                 .::::::::.\x1b[0m');
        terminal.writeln('\x1b[1;36m                :::::::::::\x1b[0m');
        terminal.writeln('\x1b[1;36m            ..:::::::::::\x1b[0m');
        terminal.writeln('\x1b[1;36m          .::::::::::::::\x1b[0m');
        terminal.writeln('\x1b[1;36m        .::::::::::::::::\x1b[0m');
        terminal.writeln('\x1b[1;36m       .:::::::::::::::::\x1b[0m');
        terminal.writeln('\x1b[1;36m      .::::::::::::::::::\x1b[0m');
        terminal.writeln('\x1b[1;36m     .:::::::::::::::::::\x1b[0m');
        terminal.writeln('\x1b[1;36m    .::::::::::::::::::::\x1b[0m');
        terminal.writeln('\x1b[1;36m   .:::::::::::::::::::::\x1b[0m');
        terminal.writeln('');
        terminal.writeln('\x1b[1;32m       SISTEMA NEXUS\x1b[0m');
        terminal.writeln('\x1b[1;33m══════════════════════════\x1b[0m');
        terminal.writeln(`\x1b[1;36mOS\x1b[0m: Nexus Linux 1.0`);
        terminal.writeln(`\x1b[1;36mHost\x1b[0m: Nexus Code Editor`);
        terminal.writeln(`\x1b[1;36mKernel\x1b[0m: 5.15.0-nexus`);
        terminal.writeln(`\x1b[1;36mTerminal\x1b[0m: xterm.js`);
        terminal.writeln(`\x1b[1;36mShell\x1b[0m: bash 5.1.16`);
        terminal.writeln(`\x1b[1;36mCPU\x1b[0m: Virtual CPU @ 3.2GHz`);
        terminal.writeln(`\x1b[1;36mMemory\x1b[0m: 1024MiB / 2048MiB`);
        terminal.writeln(`\x1b[1;36mPaquetes instalados\x1b[0m: ${packageState.list().length}`);
    }
    
    // Botones de control (sin cambios)
    const clearBtn = document.getElementById('clear-terminal');
    const helpBtn = document.getElementById('terminal-help');
    const exampleBtn = document.getElementById('terminal-example');
    
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            terminal.clear();
            terminal.writeln('\x1b[1;33mTerminal limpiada\x1b[0m');
            terminal.writeln('');
            writePrompt();
        });
    }
    
    if (helpBtn) {
        helpBtn.addEventListener('click', () => {
            showHelp();
            writePrompt();
        });
    }
    
    if (exampleBtn) {
        exampleBtn.addEventListener('click', () => {
            terminal.writeln('\x1b[1;33mEjemplos de uso:\x1b[0m');
            terminal.writeln('  $ apt install nginx        # Instala servidor web');
            terminal.writeln('  $ npm install express      # Instala framework Node.js');
            terminal.writeln('  $ framework new react miapp # Crea proyecto React');
            terminal.writeln('  $ pkg list                 # Ver paquetes instalados');
            writePrompt();
        });
    }
    
    console.log('Terminal Nexus mejorada inicializada correctamente');
});