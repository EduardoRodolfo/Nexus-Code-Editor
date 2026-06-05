// nexus/js/terminal.js - Terminal Linux para Nexus
// VERSIÓN CORREGIDA - SIN ERRORES DE SINTAXIS
document.addEventListener('DOMContentLoaded', function() {
  // Verificar si el elemento terminal existe
  const terminalElement = document.getElementById('terminal');
  if (!terminalElement) {
    console.error('Elemento #terminal no encontrado');
    return;
  }

  // =============================================
  // SISTEMA DE PAQUETES VIRTUALES
  // =============================================
  const packageState = {
    installed: new Set(),
    load() {
      const saved = localStorage.getItem('nexus_terminal_packages');
      if (saved) {
        try {
          const data = JSON.parse(saved);
          this.installed = new Set(data);
        } catch(e) {}
      }
    },
    save() {
      const data = JSON.stringify([...this.installed]);
      localStorage.setItem('nexus_terminal_packages', data);
    },
    has(pkg) {
      return this.installed.has(pkg);
    },
    install(pkg) {
      this.installed.add(pkg);
      this.save();
    },
    list() {
      return [...this.installed].sort();
    },
    clear() {
      this.installed.clear();
      this.save();
    }
  };

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

terminal.open(terminalElement);

 // Función auxiliar para traducción en terminal
  function termT(key) {
      if (typeof TRANSLATOR !== 'undefined' && TRANSLATOR.t) {
          return TRANSLATOR.t(key);
      }
      return key;
    }

// Mensaje de bienvenida - TRADUCIDO
terminal.writeln('\x1b[1;32m' + termT('terminal.welcome') + '\x1b[0m');
terminal.writeln('\x1b[1;36m' + termT('terminal.version') + '\x1b[0m');
terminal.writeln(termT('terminal.typeHelp'));
terminal.writeln('');
writePrompt();

  // Variables
  let currentLine = '';
  const commandHistory = [];
  let historyIndex = -1;
  let isProcessing = false;

  // =============================================
  // FUNCIONES AUXILIARES
  // =============================================
  function simulateInstall(packageName, manager, callback) {
    const messages = [
      'Leyendo lista de paquetes...',
      'Creando árbol de dependencias...',
      'Los siguientes paquetes se instalarán:',
      `  ${packageName}`,
      `Configurando ${packageName}...`,
      'Procesando disparadores...'
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

  function getExample(cmd) {
    const examples = {
      ls: 'ls -la',
      pwd: 'pwd',
      date: 'date',
      echo: 'echo "Hola Mundo"',
      cal: 'cal',
      cat: 'cat index.html',
      head: 'head index.html',
      wc: 'wc README.md',
      uname: 'uname -a',
      uptime: 'uptime',
      calc: 'calc 5 + 3 * 2',
      json: 'json \'{"name":"Nexus"}\'',
      random: 'random color',
      convert: 'convert 255 dec hex',
      learn: 'learn html',
      quiz: 'quiz',
      apt: 'apt install nginx',
      npm: 'npm install express',
      pip: 'pip install flask',
      docker: 'docker run nginx',
      git: 'git clone https://...',
      framework: 'framework new react miapp',
    };
    return examples[cmd] || `${cmd} --help`;
  }

  // =============================================
  // COMANDOS
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
          weekday: 'long', year: 'numeric', month: 'long',
          day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
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
      description: 'Abrir Linux completo en el navegador',
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
    uname: {
      description: 'Muestra información del sistema',
      execute: (args) => {
        if (args[0] === '-a') {
          terminal.writeln('Linux nexus 5.15.0-nexus #1 SMP x86_64 GNU/Linux');
        } else {
          terminal.writeln('Linux');
        }
      }
    },
    uptime: {
      description: 'Muestra el tiempo que lleva el sistema en funcionamiento',
      execute: () => {
        const hours = 2 + Math.floor(Math.random() * 48);
        const users = 1 + Math.floor(Math.random() * 3);
        terminal.writeln(` ${hours}:30  up ${hours} min,  ${users} users,  load average: 0.15, 0.10, 0.05`);
      }
    },
    man: {
      description: 'Muestra el manual de un comando',
      execute: (args) => {
        if (args[0] && commands[args[0]]) {
          terminal.writeln(`\x1b[1;36mNOMBRE\x1b[0m`);
          terminal.writeln(`       ${args[0]} - ${commands[args[0]].description}`);
          terminal.writeln('');
          terminal.writeln(`\x1b[1;36mDESCRIPCIÓN\x1b[0m`);
          terminal.writeln('       Comando educativo simulado en Nexus Terminal');
          terminal.writeln('');
          terminal.writeln(`\x1b[1;36mEJEMPLOS\x1b[0m`);
          terminal.writeln(`       ${getExample(args[0])}`);
        } else {
          terminal.writeln(`No hay entrada de manual para '${args[0]}'`);
        }
      }
    },
    cal: {
      description: 'Muestra un calendario',
      execute: () => {
        const now = new Date();
        const month = now.getMonth();
        const year = now.getFullYear();
        const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
        terminal.writeln(`\x1b[1;36m      ${months[month]} ${year}\x1b[0m`);
        terminal.writeln('Do Lu Ma Mi Ju Vi Sá');
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        let line = '   '.repeat(firstDay === 0 ? 6 : firstDay - 1);
        for (let d = 1; d <= daysInMonth; d++) {
          line += (d < 10 ? ' ' : '') + d + ' ';
          if ((d + firstDay) % 7 === 0) {
            terminal.writeln(line);
            line = '';
          }
        }
        if (line) terminal.writeln(line);
      }
    },
    cat: {
      description: 'Muestra el contenido de un archivo',
      execute: (args) => {
        if (args[0] === 'index.html') {
          terminal.writeln('<!DOCTYPE html>');
          terminal.writeln('<html><head><title>Nexus</title></head>');
          terminal.writeln('<body><h1>¡Hola Nexus!</h1></body></html>');
        } else if (args[0] === 'README.md') {
          terminal.writeln('# Nexus Code Editor');
          terminal.writeln('Editor de código web con terminal integrada');
        } else if (args[0]) {
          terminal.writeln(`cat: ${args[0]}: No existe el archivo`);
        } else {
          terminal.writeln('cat: uso: cat <nombre_archivo>');
        }
      }
    },
    head: {
      description: 'Muestra las primeras 5 líneas de un archivo',
      execute: (args) => {
        if (args[0] === 'index.html') {
          terminal.writeln('<!DOCTYPE html>');
          terminal.writeln('<html><head><title>Nexus</title></head>');
          terminal.writeln('<body>');
          terminal.writeln('<h1>¡Hola Nexus!</h1>');
        } else {
          terminal.writeln(`head: ${args[0] || 'archivo'}: No existe`);
        }
      }
    },
    wc: {
      description: 'Cuenta líneas, palabras y caracteres',
      execute: (args) => {
        if (args[0]) {
          const lines = 10 + Math.floor(Math.random() * 50);
          const words = lines * 8;
          const chars = words * 5;
          terminal.writeln(`  ${lines}  ${words}  ${chars}  ${args[0]}`);
        } else {
          terminal.writeln('wc: uso: wc <nombre_archivo>');
        }
      }
    },
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
            terminal.writeln('added 1 package and audited 2 packages in 0.5s');
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
            terminal.writeln('Writing lock file');
            terminal.writeln('Generating autoload files');
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
            terminal.writeln('remote: Enumerating objects: 42, done.');
            terminal.writeln('remote: Counting objects: 100% (42/42), done.');
            terminal.writeln('Receiving objects: 100% (42/42), 10.5 KiB | 2.1 MiB/s, done.');
            terminal.writeln(`\x1b[1;32m✅ Repositorio clonado (simulado).\x1b[0m`);
          }, 400);
        } else {
          terminal.writeln('Uso: git clone <repositorio>');
        }
      }
    },
    learn: {
      description: 'Tutorial interactivo de un tema',
      execute: (args) => {
        const topic = args[0] || 'help';
        const tutorials = {
          html: 'HTML usa etiquetas como <h1> y <p>',
          css: 'CSS da estilo con selectores como .clase y #id',
          js: 'JavaScript tiene variables (let), funciones y eventos',
          python: 'Python usa indentación en lugar de llaves',
          git: 'Git controla versiones: git init, add, commit, push'
        };
        if (tutorials[topic]) {
          terminal.writeln(`📚 Tutorial de ${topic.toUpperCase()}:`);
          terminal.writeln(`   ${tutorials[topic]}`);
        } else {
          terminal.writeln('Temas disponibles: html, css, js, python, git');
        }
      }
    },
    quiz: {
      description: 'Pregunta de opción múltiple',
      execute: () => {
        const questions = [
          { q: '¿Qué etiqueta HTML se usa para párrafos?', a: '<p>' },
          { q: '¿Qué propiedad CSS hace que un elemento sea flexible?', a: 'display: flex' },
          { q: '¿Cómo declaras una variable en JavaScript?', a: 'let, const o var' },
          { q: '¿Qué comando inicia un repositorio Git?', a: 'git init' }
        ];
        const random = questions[Math.floor(Math.random() * questions.length)];
        terminal.writeln(`❓ ${random.q}`);
        terminal.writeln(`💡 Respuesta: ${random.a}`);
      }
    },
    calc: {
      description: 'Calculadora simple',
      execute: (args) => {
        if (args.length > 0) {
          try {
            const result = eval(args.join(' '));
            terminal.writeln(`= ${result}`);
          } catch(e) {
            terminal.writeln('Error: Expresión inválida');
          }
        } else {
          terminal.writeln('Uso: calc 2 + 2');
        }
      }
    },
    json: {
      description: 'Formatea y valida JSON',
      execute: (args) => {
        if (args.length > 0) {
          try {
            const parsed = JSON.parse(args.join(' '));
            terminal.writeln(JSON.stringify(parsed, null, 2));
          } catch(e) {
            terminal.writeln('❌ JSON inválido');
          }
        } else {
          terminal.writeln('Uso: json \'{"clave": "valor"}\'');
        }
      }
    },
    random: {
      description: 'Genera datos aleatorios',
      execute: (args) => {
        const type = args[0] || 'number';
        switch(type) {
          case 'number':
            const min = parseInt(args[1]) || 0;
            const max = parseInt(args[2]) || 100;
            terminal.writeln(`🎲 ${Math.floor(Math.random() * (max - min + 1)) + min}`);
            break;
          case 'color':
            const r = Math.floor(Math.random() * 256);
            const g = Math.floor(Math.random() * 256);
            const b = Math.floor(Math.random() * 256);
            terminal.writeln(`🎨 #${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`);
            break;
          case 'word':
            const words = ['hola', 'mundo', 'código', 'terminal', 'linux', 'nexus'];
            terminal.writeln(`📝 ${words[Math.floor(Math.random() * words.length)]}`);
            break;
          default:
            terminal.writeln('Tipos: number, color, word');
        }
      }
    },
    convert: {
      description: 'Conversor de unidades (binario, hex, decimal)',
      execute: (args) => {
        if (args.length >= 2) {
          const value = args[0];
          const from = args[1].toLowerCase();
          const to = (args[2] || '').toLowerCase();
          const num = parseInt(value, from === 'hex' ? 16 : from === 'bin' ? 2 : 10);
          if (isNaN(num)) {
            terminal.writeln('❌ Valor inválido');
            return;
          }
          if (to === 'hex' || !to) terminal.writeln(`Hex: 0x${num.toString(16).toUpperCase()}`);
          if (to === 'bin' || !to) terminal.writeln(`Bin: 0b${num.toString(2)}`);
          if (to === 'dec' || !to) terminal.writeln(`Dec: ${num}`);
        } else {
          terminal.writeln('Uso: convert <valor> <origen> [destino]');
          terminal.writeln('Origen/Destino: dec, hex, bin');
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
    }
  };

  // =============================================
  // CAPTURA DE TECLADO
  // =============================================
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

  // =============================================
  // PROCESAR COMANDOS
  // =============================================
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

  // =============================================
  // MOSTRAR AYUDA
  // =============================================
  function showHelp() {
    terminal.writeln('\x1b[1;36mComandos disponibles:\x1b[0m');
    terminal.writeln('');

    const categories = {
      'Sistema': ['help', 'clear', 'date', 'neofetch', 'whoami', 'pwd', 'uname', 'uptime', 'man'],
      'Archivos': ['ls', 'echo', 'cat', 'head', 'wc', 'cal'],
      'Labs': ['linux', 'labs'],
      'Gestores de Paquetes': ['apt', 'npm', 'pip', 'composer'],
      'Desarrollo': ['framework', 'git', 'docker'],
      'Educación': ['learn', 'quiz'],
      'Utilidades': ['calc', 'json', 'random', 'convert', 'pkg']
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
    terminal.writeln('  • Comandos educativos y utilidades');
  }

  // =============================================
  // FUNCIONES AUXILIARES
  // =============================================
  function writePrompt() {
    const buffer = terminal.buffer.active;
    const line = buffer.getLine(buffer.cursorY);
    if (line && line.translateToString(true).trim() !== '') {
      terminal.write('\r\n');
    }
    terminal.write('\x1b[1;32muser@nexus\x1b[0m:\x1b[1;34m~\x1b[0m$ ');
  }

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
  terminal.writeln(`\x1b[1;36mOS\x1b[0m: Nexus Linux 3.0`);
  terminal.writeln(`\x1b[1;36mHost\x1b[0m: Nexus Code Editor`);
  terminal.writeln(`\x1b[1;36mKernel\x1b[0m: 5.15.0-nexus`);
  terminal.writeln(`\x1b[1;36mTerminal\x1b[0m: xterm.js`);
  terminal.writeln(`\x1b[1;36mShell\x1b[0m: bash 5.1.16`);
  terminal.writeln(`\x1b[1;36mCPU\x1b[0m: Virtual CPU @ 3.2GHz`);
  terminal.writeln(`\x1b[1;36mMemory\x1b[0m: 1024MiB / 2048MiB`);
  terminal.writeln(`\x1b[1;36mPaquetes instalados\x1b[0m: ${packageState.list().length}`);
}
  // Botones de control
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
}); // ← ESTE CIERRA EL DOMContentLoaded