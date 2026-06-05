// ============================================================
// NEXUS CODE EDITOR - index.js (VERSIÓN LIMPIA Y FUNCIONAL)
// ============================================================

ace.require("ace/ext/language_tools");

// ===== VARIABLES GLOBALES =====
let currentFileName = null;
let fileHandle = null;
let currentDirectoryHandle = null;
let currentProjectHandle = null;
let openFiles = new Map();
let currentFileTab = null;
let projectFiles = [];
let isNewFile = true;
let editor = null;

// ===== DETECCIÓN AUTOMÁTICA DE LENGUAJES =====
const languageDetectionMap = {
    'html': 'html', 'htm': 'html', 'xhtml': 'html',
    'css': 'css', 'scss': 'scss', 'sass': 'sass', 'less': 'less', 'styl': 'stylus',
    'js': 'javascript', 'javascript': 'javascript', 'mjs': 'javascript',
    'jsx': 'jsx', 'ts': 'typescript', 'tsx': 'typescript',
    'vue': 'vue', 'svelte': 'html',
    'json': 'json', 'json5': 'json5',
    'xml': 'xml', 'svg': 'svg', 'rss': 'xml',
    'md': 'markdown', 'markdown': 'markdown', 'mdx': 'markdown',
    'py': 'python', 'python': 'python', 'pyw': 'python',
    'java': 'java', 'class': 'java', 'jar': 'java',
    'c': 'c_cpp', 'cpp': 'c_cpp', 'cc': 'c_cpp', 'cxx': 'c_cpp', 'h': 'c_cpp', 'hpp': 'c_cpp',
    'cs': 'csharp', 'csx': 'csharp',
    'php': 'php', 'phtml': 'php',
    'rb': 'ruby', 'erb': 'html_ruby', 'rake': 'ruby',
    'go': 'golang', 'rs': 'rust',
    'swift': 'swift', 'kt': 'kotlin', 'kts': 'kotlin',
    'scala': 'scala', 'sc': 'scala',
    'dart': 'dart',
    'elixir': 'elixir', 'ex': 'elixir', 'exs': 'elixir',
    'clj': 'clojure', 'cljs': 'clojure', 'cljc': 'clojure',
    'hs': 'haskell', 'lhs': 'haskell',
    'erl': 'erlang', 'hrl': 'erlang',
    'ml': 'ocaml', 'mli': 'ocaml',
    'fs': 'fsharp', 'fsx': 'fsharp', 'fsi': 'fsharp',
    'lua': 'lua',
    'r': 'r', 'rdata': 'r', 'rds': 'r', 'rda': 'r',
    'jl': 'julia',
    'pl': 'perl', 'pm': 'perl',
    'tcl': 'tcl',
    'ada': 'ada', 'adb': 'ada', 'ads': 'ada',
    'd': 'd',
    'f': 'fortran', 'for': 'fortran', 'f90': 'fortran', 'f95': 'fortran',
    'sh': 'sh', 'bash': 'sh', 'zsh': 'sh',
    'ps1': 'powershell', 'psm1': 'powershell', 'psd1': 'powershell',
    'bat': 'batchfile', 'cmd': 'batchfile',
    'sql': 'sql', 'ddl': 'sql', 'dml': 'sql',
    'mysql': 'mysql', 'pgsql': 'pgsql', 'plsql': 'plsql',
    'ini': 'ini', 'cfg': 'ini', 'conf': 'ini',
    'toml': 'toml', 'yaml': 'yaml', 'yml': 'yaml',
    'dockerfile': 'dockerfile', 'makefile': 'makefile', 'mk': 'makefile',
    'nginx': 'nginx', 'apache': 'apache_conf',
    'gitignore': 'gitignore', 'env': 'properties',
    'csv': 'csv', 'tsv': 'csv',
    'txt': 'plain_text', 'text': 'plain_text',
    'rtf': 'plain_text', 'log': 'plain_text',
    'diff': 'diff', 'patch': 'diff',
    'latex': 'latex', 'tex': 'latex', 'bib': 'bibtex',
    'asm': 'assembly_x86', 's': 'assembly_x86',
    'v': 'verilog', 'vh': 'verilog', 'vhd': 'vhdl', 'vhdl': 'vhdl',
    '': 'plain_text'
};

function detectLanguageByExtension(filename) {
    if (!filename) return 'plain_text';
    const extension = filename.split('.').pop().toLowerCase();
    return languageDetectionMap[extension] || 'plain_text';
}

function updateLanguageSelector(mode) {
    const modeSelector = document.getElementById('modeSelector');
    if (modeSelector) {
        for (let i = 0; i < modeSelector.options.length; i++) {
            if (modeSelector.options[i].value === mode) {
                modeSelector.value = mode;
                return;
            }
        }
        modeSelector.value = 'plain_text';
    }
}

// ===== THEME MANAGER =====
class ThemeManager {
    constructor() {
        this.defaultTheme = 'dreamweaver';
        this.defaultMode = 'html';
        this.defaultFontSize = 14;
        this.defaultLineNumbers = true;
        this.defaultWrapMode = true;
    }

    saveConfig(settings) {
        localStorage.setItem('editorConfig', JSON.stringify(settings));
    }

    loadConfig() {
        const saved = localStorage.getItem('editorConfig');
        if (saved) return JSON.parse(saved);
        return this.getDefaultConfig();
    }

    getDefaultConfig() {
        return {
            theme: this.defaultTheme,
            mode: this.defaultMode,
            fontSize: this.defaultFontSize,
            lineNumbers: this.defaultLineNumbers,
            wrapMode: this.defaultWrapMode
        };
    }

    applyConfig(editor, config) {
        if (!editor) return;
        editor.setTheme(`ace/theme/${config.theme}`);
        editor.session.setMode(`ace/mode/${config.mode}`);
        editor.setFontSize(config.fontSize + 'px');
        editor.setOption('showLineNumbers', config.lineNumbers);
        editor.session.setUseWrapMode(config.wrapMode);
        return config;
    }

    getCurrentConfig() {
        return {
            theme: document.getElementById('themeSelector')?.value || this.defaultTheme,
            mode: document.getElementById('modeSelector')?.value || this.defaultMode,
            fontSize: parseInt(document.getElementById('fontSize')?.value) || this.defaultFontSize,
            lineNumbers: document.getElementById('lineNumbers')?.checked ?? this.defaultLineNumbers,
            wrapMode: document.getElementById('wrapMode')?.checked ?? this.defaultWrapMode
        };
    }

    updateControls(config) {
        const themeS = document.getElementById('themeSelector');
        const modeS = document.getElementById('modeSelector');
        const fontSizeI = document.getElementById('fontSize');
        const lineC = document.getElementById('lineNumbers');
        const wrapC = document.getElementById('wrapMode');
        if (themeS) themeS.value = config.theme;
        if (modeS) modeS.value = config.mode;
        if (fontSizeI) fontSizeI.value = config.fontSize;
        if (lineC) lineC.checked = config.lineNumbers;
        if (wrapC) wrapC.checked = config.wrapMode;
    }
}

const themeManager = new ThemeManager();

const isFileSystemAccessSupported = () => {
    return 'showOpenFilePicker' in window && 'showSaveFilePicker' in window && 'showDirectoryPicker' in window;
};

function showNotification(message, isError = false) {
    const notification = document.createElement('div');
    notification.className = isError ? 'notification error' : 'notification success';
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => { notification.remove(); }, 3000);
}

// ===== FUNCIONES GLOBALES (usadas desde onclick en HTML) =====
function scrollToSection(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
}
function abrirEnNavegador() {
    const editor = ace.edit("editor");
    const contenido = editor.getValue();
    const nuevaVentana = window.open("", "_blank");
    if (nuevaVentana) {
        nuevaVentana.document.open();
        nuevaVentana.document.write(contenido);
        nuevaVentana.document.close();
    } else {
        alert("No se pudo abrir una nueva ventana. Verifica que el navegador no esté bloqueando ventanas emergentes.");
    }
}
function openTinyManager() {
    window.open('../tinyfilemanager/tinyfilemanager.php', '_blank');
}
function openLabs() {
    window.open('labs.html', '_blank');
}
function insertarLibrerias(tipo) {
    var editor2 = ace.edit("editor");
    var codigo = '';
    if (tipo === 'cdn') {
        codigo = '<!-- Librerias via CDN -->\n';
        codigo += '<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">\n';
        codigo += '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">\n';
        codigo += '<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"><\/script>\n\n';
    } else if (tipo === 'local') {
        codigo = '<!-- Librerias locales -->\n';
        codigo += '<link rel="stylesheet" href="node_modules/bootstrap/dist/css/bootstrap.min.css">\n';
        codigo += '<link rel="stylesheet" href="fontawesome-free-7.2.0-web/css/all.css">\n';
        codigo += '<script src="node_modules/bootstrap/dist/js/bootstrap.bundle.min.js"><\/script>\n\n';
    }
    var contenidoActual = editor2.getValue();
    editor2.setValue(codigo + contenidoActual);
    editor2.gotoLine(1, 0);
    var notif = document.createElement('div');
    notif.className = 'notification success';
    notif.textContent = 'Enlaces ' + (tipo === 'cdn' ? 'CDN' : 'locales') + ' insertados al inicio';
    document.body.appendChild(notif);
    setTimeout(function() { notif.remove(); }, 3000);
}

// ===== INICIALIZAR EDITOR =====
function initializeEditor() {
    if (!editor) {
        editor = ace.edit("editor");
        const savedConfig = themeManager.loadConfig();
        themeManager.applyConfig(editor, savedConfig);
        themeManager.updateControls(savedConfig);

        editor.setOptions({
            enableBasicAutocompletion: true,
            enableLiveAutocompletion: true,
            enableSnippets: true,
            showPrintMargin: false,
            useSoftTabs: true,
            tabSize: 2
        });

        setTimeout(() => {
            try {
                const snippetManager = ace.require('ace/snippets').snippetManager;
                if (snippetManager) {
                    console.log('✅ Snippets inteligentes ACTIVADOS para todos los lenguajes');
                }
            } catch(e) {
                console.log('⚠️ Snippets: usa la extensión ext-language_tools');
            }
        }, 500);

        const updatePreview = () => {
            const preview = document.getElementById('preview');
            if (preview) preview.srcdoc = editor.getValue();
        };
        editor.session.on('change', updatePreview);
        return editor;
    }
    return editor;
}

// ===== CONSOLA PRINCIPAL =====
class MainConsole {
    constructor() {
        this.consoleOutput = document.getElementById('consoleOutput');
        this.consoleInput = document.getElementById('consoleInput');
        this.commandHistory = [];
        this.historyIndex = -1;
        this.isExecuting = false;
        this.initializeMainConsole();
    }

    initializeMainConsole() {
        this.setupConsoleEvents();
        this.addToConsole('🚀 Consola JavaScript lista. Escribe código o usa "Run" para ejecutar.', 'info');
    }

        setupConsoleEvents() {
        const runBtn = document.getElementById('runButton');
        const clearBtn = document.getElementById('clearConsole');
        if (runBtn) runBtn.addEventListener('click', () => this.executeEditorCode());
        if (clearBtn) clearBtn.addEventListener('click', () => this.clearConsole());
        if (this.consoleInput) {
            this.consoleInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') { e.preventDefault(); this.executeConsoleInput(); }
                if (e.key === 'ArrowUp') { e.preventDefault(); this.navigateHistory(-1); }
                if (e.key === 'ArrowDown') { e.preventDefault(); this.navigateHistory(1); }
            });
        }
    }
    executeEditorCode() {
        const language = document.getElementById('modeSelector')?.value;
        if (language !== "javascript") {
            this.addToConsole("❌ Cambia el lenguaje a JavaScript para ejecutar código.", "error");
            return;
        }
        const code = editor?.getValue();
        if (!code || !code.trim()) {
            this.addToConsole("❌ No hay código para ejecutar", "error");
            return;
        }
        this.executeJavaScriptCode(code);
    }

    executeConsoleInput() {
        const code = this.consoleInput?.value.trim();
        if (!code) return;
        this.addToConsole(`> ${code}`, 'input');
        this.executeJavaScriptCode(code);
        if (this.commandHistory[this.commandHistory.length - 1] !== code) {
            this.commandHistory.push(code);
            if (this.commandHistory.length > 50) this.commandHistory.shift();
        }
        this.historyIndex = -1;
        this.consoleInput.value = '';
    }

    navigateHistory(direction) {
        if (this.commandHistory.length === 0) return;
        this.historyIndex += direction;
        if (this.historyIndex < 0) { this.historyIndex = -1; this.consoleInput.value = ''; }
        else if (this.historyIndex >= this.commandHistory.length) this.historyIndex = this.commandHistory.length - 1;
        else this.consoleInput.value = this.commandHistory[this.historyIndex];
    }

    async executeJavaScriptCode(code) {
        if (this.isExecuting) { this.addToConsole("⏳ Ejecución en curso...", "warning"); return; }
        this.isExecuting = true;
        try {
            const sandbox = this.createSecureSandbox();
            await this.executeWithTimeout(code, sandbox);
        } catch (error) {
            this.addToConsole(`❌ Error: ${error.message}`, "error");
        } finally { this.isExecuting = false; }
    }

    createSecureSandbox() {
        const self = this;
        const sandbox = {
            console: {
                log: (...args) => self.consoleLog(args),
                error: (...args) => self.consoleError(args),
                warn: (...args) => self.consoleWarn(args),
                info: (...args) => self.consoleInfo(args),
                clear: () => self.clearConsole()
            },
            setTimeout: (fn, delay, ...args) => {
                if (delay > 5000) delay = 5000;
                return setTimeout(fn, delay, ...args);
            },
            setInterval: (fn, delay, ...args) => {
                if (delay > 5000) delay = 5000;
                const id = setInterval(fn, delay, ...args);
                setTimeout(() => clearInterval(id), 10000);
                return id;
            },
            clearTimeout, clearInterval,
            Math, Date, JSON, Number, String, Array, Object, Boolean
        };
        return new Proxy(sandbox, {
            has: () => true,
            get: (target, prop) => {
                if (prop === 'window' || prop === 'document' || prop === 'globalThis') return undefined;
                if (prop in target) return target[prop];
                return undefined;
            },
            set: () => false
        });
    }

    async executeWithTimeout(code, sandbox) {
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => reject(new Error("⏱️ Timeout (10 segundos)")), 10000);
            try {
                const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
                const fn = new AsyncFunction('sandbox', `
                    with(sandbox) {
                        try { ${code} } catch(e) { console.error(e.message); }
                    }
                `);
                fn(sandbox).then(() => { clearTimeout(timeoutId); resolve(); })
                           .catch(error => { clearTimeout(timeoutId); reject(error); });
            } catch (error) { clearTimeout(timeoutId); reject(error); }
        });
    }

    consoleLog(args) {
        this.addToConsole(args.map(a => this.formatOutput(a)).join(' '), 'log');
    }
    consoleError(args) {
        this.addToConsole(`❌ ${args.map(a => this.formatOutput(a)).join(' ')}`, 'error');
    }
    consoleWarn(args) {
        this.addToConsole(`⚠️ ${args.map(a => this.formatOutput(a)).join(' ')}`, 'warning');
    }
    consoleInfo(args) {
        this.addToConsole(`ℹ️ ${args.map(a => this.formatOutput(a)).join(' ')}`, 'info');
    }

    formatOutput(arg) {
        if (arg === null) return 'null';
        if (arg === undefined) return 'undefined';
        if (typeof arg === 'object') {
            try {
                if (arg instanceof Error) return `Error: ${arg.message}`;
                return JSON.stringify(arg, null, 2);
            } catch { return String(arg); }
        }
        return String(arg);
    }

    addToConsole(text, type = "normal") {
        if (!this.consoleOutput) return;
        const timestamp = new Date().toLocaleTimeString();
        const prefix = {
            error: '❌', warning: '⚠️', info: 'ℹ️',
            success: '✅', input: '>', log: ''
        };
        const p = prefix[type] || '';
        this.consoleOutput.value += `[${timestamp}] ${p} ${text}\n`;
        this.consoleOutput.scrollTop = this.consoleOutput.scrollHeight;
    }

    clearConsole() {
        if (this.consoleOutput) {
            this.consoleOutput.value = '';
            this.addToConsole('🧹 Consola limpiada', 'info');
        }
    }
}

// ===== INICIALIZACIÓN PRINCIPAL =====
document.addEventListener('DOMContentLoaded', () => {
    editor = initializeEditor();

    const themeSelector = document.getElementById('themeSelector');
    const modeSelector = document.getElementById('modeSelector');
    const fontSizeInput = document.getElementById('fontSize');
    const lineNumbersCheckbox = document.getElementById('lineNumbers');
    const wrapModeCheckbox = document.getElementById('wrapMode');

    if (themeSelector) {
        themeSelector.addEventListener('change', (e) => {
            const config = themeManager.getCurrentConfig();
            themeManager.applyConfig(editor, config);
            themeManager.saveConfig(config);
        });
    }
    if (modeSelector) {
        modeSelector.addEventListener('change', (e) => {
            const config = themeManager.getCurrentConfig();
            themeManager.applyConfig(editor, config);
            themeManager.saveConfig(config);
        });
    }
    if (fontSizeInput) {
        fontSizeInput.addEventListener('change', () => {
            const config = themeManager.getCurrentConfig();
            themeManager.applyConfig(editor, config);
            themeManager.saveConfig(config);
        });
    }
    [lineNumbersCheckbox, wrapModeCheckbox].forEach(cb => {
        if (cb) {
            cb.addEventListener('change', () => {
                const config = themeManager.getCurrentConfig();
                themeManager.applyConfig(editor, config);
                themeManager.saveConfig(config);
            });
        }
    });

    function addSafeEventListener(id, event, handler) {
        const el = document.getElementById(id);
        if (el) el.addEventListener(event, handler);
    }

    async function openFile() {
        if (!isFileSystemAccessSupported()) {
            showNotification('API de archivos no soportada.', true);
            return;
        }
        try {
            const [handle] = await window.showOpenFilePicker({
                types: [{ description: 'Archivos de texto', accept: {'text/plain': ['.txt', '.js', '.html', '.css', '.json']} }]
            });
            fileHandle = handle;
            const file = await fileHandle.getFile();
            const contents = await file.text();
            currentFileName = file.name;
            const detectedMode = detectLanguageByExtension(currentFileName);
            editor.session.setMode(`ace/mode/${detectedMode}`);
            updateLanguageSelector(detectedMode);
            editor.setValue(contents);
            showNotification(`Archivo abierto: ${currentFileName}`);
        } catch (error) {
            if (error.name !== 'AbortError') showNotification(`Error: ${error.message}`, true);
        }
    }

    async function saveFileAs() {
        if (!isFileSystemAccessSupported()) {
            showNotification('API de archivos no soportada.', true);
            return false;
        }
        try {
            fileHandle = await window.showSaveFilePicker({
                types: [{ description: 'Archivos de texto', accept: {'text/plain': ['.txt', '.js', '.html', '.css', '.json']} }],
                suggestedName: currentFileName || 'sin_titulo.txt'
            });
            const writable = await fileHandle.createWritable();
            await writable.write(editor.getValue());
            await writable.close();
            currentFileName = fileHandle.name;
            showNotification(`Archivo guardado: ${currentFileName}`);
            return true;
        } catch (error) {
            if (error.name !== 'AbortError') showNotification(`Error: ${error.message}`, true);
            return false;
        }
    }

    async function saveFile() {
        if (!isFileSystemAccessSupported()) {
            showNotification('API de archivos no soportada.', true);
            return false;
        }
        try {
            if (!fileHandle || isNewFile) return await saveFileAs();
            const writable = await fileHandle.createWritable();
            await writable.write(editor.getValue());
            await writable.close();
            isNewFile = false;
            showNotification(`✅ Archivo guardado: ${fileHandle.name || currentFileName}`);
            return true;
        } catch (error) {
            if (error.name !== 'AbortError') showNotification(`❌ Error: ${error.message}`, true);
            return false;
        }
    }

    function clearEditor() {
        if (!editor.getValue()) return;
        if (confirm('¿Limpiar editor?')) { editor.setValue(''); showNotification('Editor limpiado'); }
    }

    addSafeEventListener('abrir-documento', 'click', openFile);
    addSafeEventListener('guardar', 'click', saveFile);
    addSafeEventListener('guardar-como', 'click', saveFileAs);
    addSafeEventListener('limpiar-editor', 'click', clearEditor);

    const nuevaInstancia = document.getElementById('nueva-instancia');
    if (nuevaInstancia) {
        nuevaInstancia.addEventListener('click', () => {
            sessionStorage.setItem('copiedCode', editor.getValue());
            sessionStorage.setItem('copiedMode', document.getElementById('modeSelector')?.value || 'javascript');
            sessionStorage.setItem('copiedTheme', document.getElementById('themeSelector')?.value || 'dreamweaver');
            const ventana = window.open(window.location.href, '_blank');
            if (ventana) { ventana.focus(); showNotification('🪟 Nueva instancia abierta'); }
            else showNotification('❌ Permite ventanas emergentes.', true);
        });
    }

    const nuevoDoc = document.getElementById('nuevo-documento');
    if (nuevoDoc) {
        nuevoDoc.addEventListener('click', () => {
            if (editor.getValue().trim() && !confirm('¿Crear nuevo documento?')) return;
            editor.setValue(''); fileHandle = null;
            currentFileName = 'nuevo_documento.html'; isNewFile = true;
            editor.session.setMode("ace/mode/html");
            const sel = document.getElementById('modeSelector');
            if (sel) sel.value = 'html';
            showNotification('📄 Nuevo documento creado');
        });
    }

    // Restaurar estado
    const copiedCode = sessionStorage.getItem('copiedCode');
    const savedContent = sessionStorage.getItem('editorContent');
    if (copiedCode) {
        editor.setValue(copiedCode); sessionStorage.removeItem('copiedCode');
        const modeToUse = sessionStorage.getItem('copiedMode') || 'javascript';
        editor.session.setMode(`ace/mode/${modeToUse}`);
        const sel = document.getElementById('modeSelector');
        if (sel) sel.value = modeToUse;
        const copiedTheme = sessionStorage.getItem('copiedTheme');
        if (copiedTheme) {
            editor.setTheme(`ace/theme/${copiedTheme}`);
            const ts = document.getElementById('themeSelector');
            if (ts) ts.value = copiedTheme;
        }
        sessionStorage.removeItem('copiedMode'); sessionStorage.removeItem('copiedTheme');
    } else if (savedContent) {
        editor.setValue(savedContent);
        const savedMode = sessionStorage.getItem('editorMode');
        if (savedMode) {
            editor.session.setMode(`ace/mode/${savedMode}`);
            const sel = document.getElementById('modeSelector');
            if (sel) sel.value = savedMode;
        }
    }
    const savedPosition = sessionStorage.getItem('scrollPosition');
    if (savedPosition) setTimeout(() => editor.session.setScrollTop(parseInt(savedPosition)), 100);

    window.addEventListener('beforeunload', () => {
        sessionStorage.setItem('editorContent', editor.getValue());
        try {
    const modeStr = editor.session.getMode();
    const modeName = typeof modeStr === 'string' ? modeStr.split('/').pop() : 'html';
    sessionStorage.setItem('editorMode', modeName);
} catch(e) {
    sessionStorage.setItem('editorMode', 'html');
}
        sessionStorage.setItem('scrollPosition', editor.session.getScrollTop());
    });

    // ============================================================
// 🔐 SISTEMA DE LICENCIA Y API KEY
// ============================================================

// Leer API Key de la URL
const urlParams = new URLSearchParams(window.location.search);
const apiKeyFromUrl = urlParams.get('apikey');

if (apiKeyFromUrl) {
    localStorage.setItem('nexus_api_key', apiKeyFromUrl);
    
    setTimeout(() => {
        showNotification('🔑 ¡API Key registrada! Bienvenido a Nexus', false);
    }, 1000);
    
    if (history.replaceState) {
        const cleanUrl = window.location.pathname;
        history.replaceState({}, document.title, cleanUrl);
    }
}

function verificarLicencia() {
    const apiKey = localStorage.getItem('nexus_api_key');
    const planGuardado = localStorage.getItem('nexus_plan');
    
    if (!apiKey) {
        document.body.classList.add('modo-free');
        document.body.classList.remove('modo-pro', 'modo-premium');
        console.log('🆓 Nexus FREE - Sin API Key');
        return { modo: 'free', activo: false };
    }
    
    fetch(`api-qvapay.php?action=verificar&apikey=${encodeURIComponent(apiKey)}`)
        .then(res => res.json())
        .then(data => {
            if (data.valida) {
                const plan = data.plan;
                localStorage.setItem('nexus_plan', plan);
                localStorage.setItem('nexus_email', data.email);
                
                document.body.classList.remove('modo-free', 'modo-pro', 'modo-premium');
                document.body.classList.add(`modo-${plan}`);
                
                console.log(`👑 Nexus ${plan} - Licencia válida`);
            } else {
                localStorage.removeItem('nexus_api_key');
                localStorage.removeItem('nexus_plan');
                document.body.classList.add('modo-free');
                showNotification('⚠️ API Key no válida', true);
            }
        })
        .catch(error => {
    console.warn('⚠️ Modo offline:', error.message);
    const savedPlan = localStorage.getItem('nexus_plan');
    const savedKey = localStorage.getItem('nexus_api_key');
    if (savedPlan && savedKey) {
        document.body.classList.add(`modo-${savedPlan}`);
        console.log(`👑 Nexus ${savedPlan} - Licencia válida (offline)`);
    }
});
    
    return { modo: planGuardado || 'free', activo: !!planGuardado };
}

function abrirPagos() {
    window.open('pagos.html', '_blank');
}

function mostrarEstadoLicencia() {
    const apiKey = localStorage.getItem('nexus_api_key');
    const plan = localStorage.getItem('nexus_plan');
    const email = localStorage.getItem('nexus_email');
    return { activa: !!apiKey, plan: plan || 'free', apiKey: apiKey, email: email || null };
}

// Verificar licencia al cargar
setTimeout(verificarLicencia, 1500);

window.verificarLicencia = verificarLicencia;
window.abrirPagos = abrirPagos;
window.mostrarEstadoLicencia = mostrarEstadoLicencia;

    new MainConsole();
});