// trigger Editor extensions
ace.require("ace/ext/language_tools");

// Variables globales
let currentFileName = null;
let fileHandle = null;
let currentDirectoryHandle = null;
let currentProjectHandle = null;
let openFiles = new Map(); // Map para archivos abiertos: {fileHandle, content, modified}
let currentFileTab = null;
let projectFiles = []; // Lista de archivos en el proyecto
let isNewFile = true;
let editor = null;

// ===== DETECCIÓN AUTOMÁTICA DE LENGUAJES =====
// Mapeo completo de extensiones a modos Ace
const languageDetectionMap = {
    // Web Development
    'html': 'html', 'htm': 'html', 'xhtml': 'html',
    'css': 'css', 'scss': 'scss', 'sass': 'sass', 'less': 'less', 'styl': 'stylus',
    'js': 'javascript', 'javascript': 'javascript', 'mjs': 'javascript',
    'jsx': 'jsx', 'ts': 'typescript', 'tsx': 'typescript',
    'vue': 'vue', 'svelte': 'html',
    'json': 'json', 'json5': 'json5',
    'xml': 'xml', 'svg': 'svg', 'rss': 'xml',
    'md': 'markdown', 'markdown': 'markdown', 'mdx': 'markdown',
    
    // Programming Languages
    'py': 'python', 'python': 'python', 'pyw': 'python',
    'java': 'java', 'class': 'java', 'jar': 'java',
    'c': 'c_cpp', 'cpp': 'c_cpp', 'cc': 'c_cpp', 'cxx': 'c_cpp', 'h': 'c_cpp', 'hpp': 'c_cpp',
    'cs': 'csharp', 'csx': 'csharp',
    'php': 'php', 'phtml': 'php',
    'rb': 'ruby', 'erb': 'html_ruby', 'rake': 'ruby',
    'go': 'golang',
    'rs': 'rust',
    'swift': 'swift',
    'kt': 'kotlin', 'kts': 'kotlin',
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
    
    // Scripting
    'sh': 'sh', 'bash': 'sh', 'zsh': 'sh',
    'ps1': 'powershell', 'psm1': 'powershell', 'psd1': 'powershell',
    'bat': 'batchfile', 'cmd': 'batchfile',
    
    // Databases
    'sql': 'sql', 'ddl': 'sql', 'dml': 'sql',
    'mysql': 'mysql',
    'pgsql': 'pgsql',
    'plsql': 'plsql',
    
    // Config Files
    'ini': 'ini', 'cfg': 'ini', 'conf': 'ini',
    'toml': 'toml',
    'yaml': 'yaml', 'yml': 'yaml',
    'dockerfile': 'dockerfile',
    'makefile': 'makefile', 'mk': 'makefile',
    'nginx': 'nginx',
    'apache': 'apache_conf', 'conf': 'apache_conf',
    'gitignore': 'gitignore',
    'env': 'properties',
    
    // Data Formats
    'csv': 'csv', 'tsv': 'csv',
    'xml': 'xml',
    'json': 'json',
    'yaml': 'yaml', 'yml': 'yaml',
    
    // Documentation
    'txt': 'plain_text', 'text': 'plain_text',
    'rtf': 'plain_text',
    'log': 'plain_text',
    
    // Special
    'diff': 'diff',
    'patch': 'diff',
    'latex': 'latex', 'tex': 'latex',
    'bib': 'bibtex',
    'asm': 'assembly_x86', 's': 'assembly_x86',
    'v': 'verilog', 'vh': 'verilog',
    'vhd': 'vhdl', 'vhdl': 'vhdl',
    
    // Default
    '': 'plain_text'
};

// Función para detectar lenguaje por extensión
function detectLanguageByExtension(filename) {
    if (!filename) return 'plain_text';
    
    const extension = filename.split('.').pop().toLowerCase();
    return languageDetectionMap[extension] || 'plain_text';
}

// Función para actualizar el selector de lenguaje
function updateLanguageSelector(mode) {
    const modeSelector = document.getElementById('modeSelector');
    if (modeSelector) {
        // Buscar si el modo existe en las opciones
        for (let i = 0; i < modeSelector.options.length; i++) {
            if (modeSelector.options[i].value === mode) {
                modeSelector.value = mode;
                return;
            }
        }
        // Si no existe, usar texto plano
        modeSelector.value = 'plain_text';
    }
}

// ===== PERSISTENCIA DE CONFIGURACIÓN =====
class ThemeManager {
    constructor() {
        this.defaultTheme = 'dreamweaver';
        this.defaultMode = 'html';
        this.defaultFontSize = 14;
        this.defaultLineNumbers = true;
        this.defaultWrapMode = true;
    }

    // Guardar configuración completa
    saveConfig(settings) {
        localStorage.setItem('editorConfig', JSON.stringify(settings));
    }

    // Cargar configuración guardada
    loadConfig() {
        const saved = localStorage.getItem('editorConfig');
        if (saved) {
            return JSON.parse(saved);
        }
        return this.getDefaultConfig();
    }

    // En la clase ThemeManager, modificar el método getDefaultConfig:
    getDefaultConfig() {
    return {
        theme: this.defaultTheme,
        mode: this.defaultMode,
        fontSize: this.defaultFontSize,
        lineNumbers: this.defaultLineNumbers,
        wrapMode: this.defaultWrapMode
    };
}


    // Aplicar configuración al editor
    applyConfig(editor, config) {
        if (!editor) return;

        // Aplicar tema
        editor.setTheme(`ace/theme/${config.theme}`);
        
        // Aplicar modo
        editor.session.setMode(`ace/mode/${config.mode}`);
        
        // Aplicar otras configuraciones
        editor.setFontSize(config.fontSize + 'px');
        editor.setOption('showLineNumbers', config.lineNumbers);
        editor.session.setUseWrapMode(config.wrapMode);

        return config;
    }

    // Y en getCurrentConfig():
    getCurrentConfig() {
    return {
        theme: document.getElementById('themeSelector')?.value || this.defaultTheme,
        mode: document.getElementById('modeSelector')?.value || this.defaultMode,
        fontSize: parseInt(document.getElementById('fontSize')?.value) || this.defaultFontSize,
        lineNumbers: document.getElementById('lineNumbers')?.checked ?? this.defaultLineNumbers,
        wrapMode: document.getElementById('wrapMode')?.checked ?? this.defaultWrapMode
    };
}

    // Resetear a valores por defecto
    resetToDefault(editor) {
        const defaultConfig = this.getDefaultConfig();
        this.applyConfig(editor, defaultConfig);
        this.updateControls(defaultConfig);
        this.saveConfig(defaultConfig);
        this.showNotification('Configuración restablecida a valores por defecto', 'success');
    }

    // Actualizar controles de la UI
    updateControls(config) {
        const themeSelector = document.getElementById('themeSelector');
        const modeSelector = document.getElementById('modeSelector');
        const fontSizeInput = document.getElementById('fontSize');
        const lineNumbersCheckbox = document.getElementById('lineNumbers');
        const wrapModeCheckbox = document.getElementById('wrapMode');

        if (themeSelector) themeSelector.value = config.theme;
        if (modeSelector) modeSelector.value = config.mode;
        if (fontSizeInput) fontSizeInput.value = config.fontSize;
        if (lineNumbersCheckbox) lineNumbersCheckbox.checked = config.lineNumbers;
        if (wrapModeCheckbox) wrapModeCheckbox.checked = config.wrapMode;
    }

    // Mostrar notificación
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Instancia global del gestor de temas
const themeManager = new ThemeManager();

// Verificar si las APIs están disponibles
const isFileSystemAccessSupported = () => {
    return 'showOpenFilePicker' in window && 'showSaveFilePicker' in window && 'showDirectoryPicker' in window;
};

// Función para mostrar notificaciones
function showNotification(message, isError = false) {
    const notification = document.createElement('div');
    notification.className = isError ? 'notification error' : 'notification success';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Función para inicializar el editor
function initializeEditor() {
    if (!editor) {
        editor = ace.edit("editor");
        
        // Cargar configuración guardada
        const savedConfig = themeManager.loadConfig();
        
        // Aplicar configuración
        themeManager.applyConfig(editor, savedConfig);
        themeManager.updateControls(savedConfig);
        
        // Configuración adicional que no se persiste
        editor.setOptions({
            enableBasicAutocompletion: true,
            enableLiveAutocompletion: true,
            enableSnippets: true,
            showPrintMargin: false,
            useSoftTabs: true,
            tabSize: 2
        });
        
        // Función para actualizar la previsualización
        const updatePreview = () => {
            const preview = document.getElementById('preview');
            const code = editor.getValue();
            preview.srcdoc = code;
        };

        // Actualizar previsualización al cambiar el editor
        editor.session.on('change', () => {
            updatePreview();
        });

        return editor;
    }
    return editor;
}
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar Ace Editor
    editor = initializeEditor();
    
    // ===== CONFIGURACIÓN DEL EDITOR CON PERSISTENCIA =====
    const themeSelector = document.getElementById('themeSelector');
    const modeSelector = document.getElementById('modeSelector');
    const fontSizeInput = document.getElementById('fontSize');
    const lineNumbersCheckbox = document.getElementById('lineNumbers');
    const wrapModeCheckbox = document.getElementById('wrapMode');

    // Listener para cambio de tema
    if (themeSelector) {
        themeSelector.addEventListener('change', (e) => {
            const config = themeManager.getCurrentConfig();
            themeManager.applyConfig(editor, config);
            themeManager.saveConfig(config);
            themeManager.showNotification(`Tema cambiado a: ${e.target.value}`, 'success');
        });
    }

    // Listener para cambio de lenguaje
    if (modeSelector) {
        modeSelector.addEventListener('change', (e) => {
            const config = themeManager.getCurrentConfig();
            themeManager.applyConfig(editor, config);
            themeManager.saveConfig(config);
            themeManager.showNotification(`Modo cambiado a: ${e.target.value}`, 'info');
        });
    }

    // Listener para tamaño de fuente
    if (fontSizeInput) {
        fontSizeInput.addEventListener('change', (e) => {
            const config = themeManager.getCurrentConfig();
            themeManager.applyConfig(editor, config);
            themeManager.saveConfig(config);
        });
    }

    // Listeners para checkboxes
    [lineNumbersCheckbox, wrapModeCheckbox].forEach(checkbox => {
        if (checkbox) {
            checkbox.addEventListener('change', () => {
                const config = themeManager.getCurrentConfig();
                themeManager.applyConfig(editor, config);
                themeManager.saveConfig(config);
            });
        }
    });

    // ... el resto de tu código se mantiene igual ...

    // ===== CONFIGURACIÓN DEL EDITOR =====
    document.getElementById('themeSelector').addEventListener('change', (e) => {
        editor.setTheme(`ace/theme/${e.target.value}`);
    });

    document.getElementById('modeSelector').addEventListener('change', (e) => {
        editor.session.setMode(`ace/mode/${e.target.value}`);
    });

    document.getElementById('fontSize').addEventListener('change', (e) => {
        editor.setFontSize(parseInt(e.target.value));
    });

    document.getElementById('lineNumbers').addEventListener('change', (e) => {
        editor.setOption('showLineNumbers', e.target.checked);
    });

    document.getElementById('wrapMode').addEventListener('change', (e) => {
        editor.session.setUseWrapMode(e.target.checked);
    });


    // ===== EVENTOS DEL MENÚ =====
    document.getElementById('abrir-documento').addEventListener('click', openFile);
    document.getElementById('guardar').addEventListener('click', saveFile);
    document.getElementById('guardar-como').addEventListener('click', saveFileAs);
    document.getElementById('nuevo-documento').addEventListener('click', newDocument);
    document.getElementById('limpiar-editor').addEventListener('click', clearEditor);

    // Event listeners para proyectos
    document.getElementById('nuevo-proyecto').addEventListener('click', newProject);
    document.getElementById('abrir-proyecto').addEventListener('click', openProject);
    
    // Event listener para TinyFileManager
    document.getElementById('open-filemanager').addEventListener('click', openFileManager);

    // Event listeners para sidebar
    document.getElementById('toggle-sidebar').addEventListener('click', toggleProjectSidebar);
    document.getElementById('close-sidebar').addEventListener('click', closeProjectSidebar);

    // ===== SIDEBAR TOGGLE MEJORADO PARA MÓVIL/DESKTOP =====
// Este código maneja la visibilidad del sidebar en todos los tamaños de pantalla

// Función para alternar sidebar (compatible con el CSS que te di)
function toggleProjectSidebar() {
  const sidebar = document.getElementById('project-sidebar');
  
  // Si no hay sidebar, salir
  if (!sidebar) return;
  
  // Verificar si estamos en modo móvil (< 671px) o desktop (>= 671px)
  if (window.innerWidth < 671) {
    // En móvil: alternar clase 'hidden'
    sidebar.classList.toggle('hidden');
  } else {
    // En desktop: alternar clase 'open'
    sidebar.classList.toggle('open');
  }
}

// Función para cerrar sidebar (botón X)
function closeProjectSidebar() {
  const sidebar = document.getElementById('project-sidebar');
  if (!sidebar) return;
  
  // En cualquier tamaño, ocultar sidebar
  sidebar.classList.add('hidden');
  if (window.innerWidth >= 671) {
    sidebar.classList.remove('open');
  }
}

// Función para mostrar sidebar
function showProjectSidebar() {
  const sidebar = document.getElementById('project-sidebar');
  if (!sidebar) return;
  
  sidebar.classList.remove('hidden');
  if (window.innerWidth >= 671) {
    sidebar.classList.add('open');
  }
}

// Event listener para el botón de toggle (ojito 👁️ en el menú)
document.getElementById('toggle-sidebar').addEventListener('click', function(e) {
  e.preventDefault();
  toggleProjectSidebar();
});

// Event listener para el botón de cerrar (X en el sidebar)
document.getElementById('close-sidebar').addEventListener('click', function(e) {
  e.preventDefault();
  closeProjectSidebar();
});

// Escuchar cambios de tamaño de ventana para ajustar sidebar
window.addEventListener('resize', function() {
  const sidebar = document.getElementById('project-sidebar');
  if (!sidebar) return;
  
  // Cuando pasamos de móvil a desktop
  if (window.innerWidth >= 671 && sidebar.classList.contains('hidden')) {
    sidebar.classList.remove('hidden');
    sidebar.classList.add('open');
  }
  
  // Cuando pasamos de desktop a móvil
  if (window.innerWidth < 671 && !sidebar.classList.contains('hidden')) {
    sidebar.classList.add('hidden');
    sidebar.classList.remove('open');
  }
});

    // =====================================
    // Funciones para manejo de archivos
    // =====================================

    // Abrir archivo
    async function openFile() {
        if (!isFileSystemAccessSupported()) {
            showNotification('La API de acceso a archivos no está soportada en este navegador.', true);
            return;
        }

        try {
            const [handle] = await window.showOpenFilePicker({
                types: [{
                    description: 'Archivos de texto',
                    accept: {'text/plain': ['.txt', '.js', '.html', '.css', '.json']}
                }]
            });
            
            fileHandle = handle;
            const file = await fileHandle.getFile();
            const contents = await file.text();
            currentFileName = file.name;
            
            // Detectar lenguaje automáticamente por extensión
const detectedMode = detectLanguageByExtension(currentFileName);
editor.session.setMode(`ace/mode/${detectedMode}`);
updateLanguageSelector(detectedMode);
            
            editor.setValue(contents);
            showNotification(`Archivo abierto: ${currentFileName}`);
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Error abriendo archivo:', error);
                showNotification(`Error: ${error.message}`, true);
            }
        }
    }

    // Guardar archivo - FUNCIÓN CORREGIDA
async function saveFile() {
    console.log('💾 saveFile() llamado');
    
    if (!isFileSystemAccessSupported()) {
        showNotification('La API de acceso a archivos no está soportada en este navegador.', true);
        return false;
    }
    
    try {
        // DEBUG: Mostrar estado actual
        console.log('📊 Estado actual:');
        console.log('- fileHandle:', fileHandle ? fileHandle.name : 'null');
        console.log('- currentFileName:', currentFileName);
        console.log('- isNewFile:', isNewFile);
        console.log('- Contenido editor:', editor.getValue().length, 'caracteres');
        
        // Si no hay fileHandle o es un archivo nuevo, usar "Guardar como"
        if (!fileHandle || isNewFile) {
            console.log('📝 Usando saveFileAs() porque:', !fileHandle ? 'No hay fileHandle' : 'Es archivo nuevo');
            return await saveFileAs();
        }
        
        console.log('💾 Guardando en archivo existente:', fileHandle.name);
        
        // Crear stream de escritura
        const writable = await fileHandle.createWritable();
        console.log('✅ Stream de escritura creado');
        
        // Obtener contenido del editor
        const content = editor.getValue();
        console.log('📄 Contenido a guardar:', content.length, 'caracteres');
        
        // Escribir contenido
        await writable.write(content);
        console.log('✅ Contenido escrito');
        
        // Cerrar stream
        await writable.close();
        console.log('✅ Stream cerrado');
        
        // Actualizar estado - IMPORTANTE: Ya no es nuevo archivo
        isNewFile = false;
        const fileName = fileHandle.name || currentFileName;
        
        console.log('✅ Guardado exitoso:', fileName);
        showNotification(`✅ Archivo guardado: ${fileName}`);
        return true;
        
    } catch (error) {
        console.error('❌ Error en saveFile():', error);
        
        if (error.name === 'AbortError') {
            console.log('⚠️ Usuario canceló la operación');
            return false;
        }
        
        showNotification(`❌ Error al guardar: ${error.message}`, true);
        return false;
    }
}

    // Guardar como - FUNCIÓN CORREGIDA
async function saveFileAs() {
    if (!isFileSystemAccessSupported()) {
        showNotification('La API de acceso a archivos no está soportada en este navegador.', true);
        return false;
    }

    try {
        fileHandle = await window.showSaveFilePicker({
            types: [{
                description: 'Archivos de texto',
                accept: {'text/plain': ['.txt', '.js', '.html', '.css', '.json']}
            }],
            suggestedName: currentFileName || 'sin_titulo.txt'
        });
        
        const writable = await fileHandle.createWritable();
        await writable.write(editor.getValue());
        await writable.close();
        
        // CORRECIÓN: Actualizar nombre y mostrar notificación correcta
        currentFileName = fileHandle.name;
        showNotification(`Archivo guardado: ${currentFileName}`);
        return true;
        
    } catch (error) {
        if (error.name !== 'AbortError') {
            console.error('Error guardando archivo:', error);
            showNotification(`Error: ${error.message}`, true);
        }
        return false;
    }
}

    // FUNCIÓN NUEVO DOCUMENTO - COMPLETAMENTE REVISADA
async function newDocument() {
    // Verificar cambios sin guardar
    if (editor.getValue().trim() && !confirm('¿Crear nuevo documento? Se perderán los cambios no guardados.')) {
        return;
    }

    // Resetear estado
    editor.setValue('');
    fileHandle = null;
    currentFileName = 'nuevo_documento.html';
    isNewFile = true;
    
    // Configurar modo HTML por defecto
    editor.session.setMode("ace/mode/html");
    document.getElementById('modeSelector').value = 'html';
    
    // Actualizar persistencia
    const config = themeManager.getCurrentConfig();
    themeManager.saveConfig(config);
    
    showNotification('📄 Nuevo documento creado');
    
    // Si hay proyecto abierto, ofrecer guardar ahí
    if (currentProjectHandle) {
        setTimeout(() => {
            const saveInProject = confirm('¿Deseas guardar este nuevo documento en el proyecto actual?');
            if (saveInProject) {
                createNewFileInProject();
            }
        }, 500);
    }
}


    // FUNCIÓN NUEVO PROYECTO - COMPLETAMENTE REVISADA
async function newProject() {
    if (!isFileSystemAccessSupported()) {
        showNotification('API de archivos no soportada', true);
        return;
    }

    try {
        // Pedir directorio para el proyecto
        currentProjectHandle = await window.showDirectoryPicker();
        
        // Crear estructura básica del proyecto
        await createDefaultProjectStructure();
        
        // Cargar y mostrar estructura
        await loadProjectStructure();
        showProjectSidebar();
        
        // Cargar index.html en el editor
        await openIndexHtmlFromProject();
        
        showNotification('🚀 Nuevo proyecto creado y cargado');
        
    } catch (error) {
        if (error.name !== 'AbortError') {
            console.error('Error creando proyecto:', error);
            showNotification(`❌ Error: ${error.message}`, true);
        }
    }
}

// Función para abrir index.html automáticamente
async function openIndexHtmlFromProject() {
    try {
        const indexHandle = await currentProjectHandle.getFileHandle('index.html');
        await openFileFromProject(indexHandle, 'index.html');
    } catch (error) {
        console.log('index.html no encontrado, creando uno nuevo...');
    }
}


    // Limpiar editor
    function clearEditor() {
        if (!editor.getValue()) return;
        if (confirm('¿Limpiar editor? Se perderá todo el contenido.')) {
            editor.setValue('');
            showNotification('Editor limpiado');
        }
    }

    // Abrir TinyFileManager
    function openFileManager(e) {
        e.preventDefault();
        window.open('../tinyfilemanager/tinyfilemanager.php', '_blank');
        showNotification('Gestor de archivos abierto en nueva pestaña');
    }

    // Crear nueva carpeta
    async function createNewFolder() {
        if (!isFileSystemAccessSupported()) {
            showNotification('La API de acceso a archivos no está soportada en este navegador.', true);
            return;
        }

        try {
            if (!currentDirectoryHandle) {
                currentDirectoryHandle = await window.showDirectoryPicker();
            }
            
            const folderName = prompt('Nombre de la nueva carpeta:', 'Nueva Carpeta');
            if (!folderName) return;
            
            await currentDirectoryHandle.getDirectoryHandle(folderName, { create: true });
            showNotification(`Carpeta creada: ${folderName}`);
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Error creando carpeta:', error);
                showNotification(`Error: ${error.message}`, true);
            }
        }
    }

    // =====================================
    // Funciones para manejo de proyectos
    // =====================================

    async function newProject() {
        if (!isFileSystemAccessSupported()) {
            showNotification('La API de acceso a archivos no está soportada en este navegador.', true);
            return;
        }

        try {
            currentProjectHandle = await window.showDirectoryPicker();
            await loadProjectStructure();
            // Mostrar sidebar automáticamente al crear proyecto
            showProjectSidebar();
            showNotification('Nuevo proyecto creado');
            
            await createDefaultProjectStructure();
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Error creando proyecto:', error);
                showNotification(`Error: ${error.message}`, true);
            }
        }
    }

   // FUNCIÓN ABRIR PROYECTO - COMPLETAMENTE REVISADA
async function openProject() {
    if (!isFileSystemAccessSupported()) {
        showNotification('API de archivos no soportada', true);
        return;
    }

    try {
        currentProjectHandle = await window.showDirectoryPicker();
        
        // Cargar estructura del proyecto
        await loadProjectStructure();
        showProjectSidebar();
        
        // Intentar abrir index.html automáticamente
        await openIndexHtmlFromProject();
        
        showNotification('📂 Proyecto abierto correctamente');
        
    } catch (error) {
        if (error.name !== 'AbortError') {
            console.error('Error abriendo proyecto:', error);
            showNotification(`❌ Error: ${error.message}`, true);
        }
    }
}

    async function loadProjectStructure() {
        if (!currentProjectHandle) return;

        const fileExplorer = document.getElementById('file-explorer');
        fileExplorer.innerHTML = '<div class="loading">Cargando proyecto...</div>';

        projectFiles = [];
        await loadCollapsedProjectStructure();
    }

    

    function hideProjectSidebar() {
        const sidebar = document.getElementById('project-sidebar');
        const container = document.querySelector('.container');
        const toggleBtn = document.getElementById('toggle-sidebar');
        
        sidebar.classList.remove('open');
        container.classList.remove('with-sidebar');
        toggleBtn.classList.remove('active');
        
        showNotification('Explorador de proyecto cerrado');
    }

   // FUNCIÓN PARA OCULTAR SIDEBAR (solo con la X)
function closeProjectSidebar() {
    console.log('Ocultando sidebar con X...');
    
    const sidebar = document.getElementById('project-sidebar');
    const toggleBtn = document.getElementById('toggle-sidebar');
    const toggleIcon = toggleBtn.querySelector('.menu-icon');
    
    // Solo ocultar, sin cambiar el icono del toggle
    sidebar.classList.remove('open');
    document.querySelector('.container').classList.remove('with-sidebar');
    
    // En desktop, ocultar visualmente
    if (window.innerWidth >= 981) {
        sidebar.style.visibility = 'hidden';
        sidebar.style.opacity = '0';
        sidebar.style.pointerEvents = 'none';
    }
    
    showNotification('Explorador de proyecto ocultado');
}

// FUNCIÓN PARA MOSTRAR SIDEBAR (solo con el ojito)
function showProjectSidebar() {
    if (!currentProjectHandle) {
        showNotification('No hay proyecto abierto', true);
        return;
    }
    
    console.log('Mostrando sidebar con ojito...');
    
    const sidebar = document.getElementById('project-sidebar');
    const container = document.querySelector('.container');
    
    // Mostrar sidebar
    sidebar.classList.add('open');
    container.classList.add('with-sidebar');
    
    // En desktop, asegurar visibilidad
    if (window.innerWidth >= 981) {
        sidebar.style.visibility = 'visible';
        sidebar.style.opacity = '1';
        sidebar.style.pointerEvents = 'auto';
    }
    
    showNotification('Explorador de proyecto visible');
}

// FUNCIÓN TOGGLE SIMPLIFICADA - SOLO CAMBIA VISIBILIDAD
function toggleProjectSidebar() {
    console.log('Toggle sidebar...');
    
    const sidebar = document.getElementById('project-sidebar');
    
    if (currentProjectHandle) {
        if (sidebar.classList.contains('open')) {
            // Si está abierto, ocultarlo
            closeProjectSidebar();
        } else {
            // Si está oculto, mostrarlo
            showProjectSidebar();
        }
    } else {
        // No hay proyecto abierto
        if (confirm('No hay proyecto abierto. ¿Deseas abrir un proyecto?')) {
            openProject();
        }
    }
}

// ELIMINAR todas las funciones de cambiar iconos - ya no son necesarias


// Función para verificar cambios sin guardar
function checkUnsavedChanges() {
    // Implementar lógica para detectar cambios sin guardar
    // Por ahora retornamos false como placeholder
    return false;
}

    // Listar archivos recursivamente
    async function listFiles(directoryHandle, container, path = '') {
        for await (const [name, handle] of directoryHandle.entries()) {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.dataset.path = path ? `${path}/${name}` : name;
            
            const isDirectory = handle.kind === 'directory';
            const icon = isDirectory ? '📁' : getFileIcon(name);
            
            // Crear la estructura del elemento de archivo/carpeta
            fileItem.innerHTML = `
                <span class="folder-toggle">${isDirectory ? '▶' : ''}</span>
                <span class="file-icon">${icon}</span>
                <span class="file-name">${name}</span>
            `;

            if (isDirectory) {
                fileItem.classList.add('folder-item');
                
                // Crear contenedor para hijos
                const folderChildren = document.createElement('div');
                folderChildren.className = 'folder-children';
                fileItem.appendChild(folderChildren);
                
                // Agregar evento para expandir/colapsar
                const toggle = fileItem.querySelector('.folder-toggle');
                fileItem.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    
                    if (!fileItem.classList.contains('expanded')) {
                        // Expandir y cargar contenido
                        fileItem.classList.add('expanded');
                        toggle.textContent = '▼';
                        await listFiles(handle, folderChildren, path ? `${path}/${name}` : name);
                    } else {
                        // Colapsar
                        fileItem.classList.remove('expanded');
                        toggle.textContent = '▶';
                    }
                });
            } else {
                // Es un archivo, agregar evento para abrirlo
                fileItem.addEventListener('click', (e) => {
                    e.stopPropagation();
                    openFileFromProject(handle, name);
                    
                    // Remover active de todos y agregar al actual
                    document.querySelectorAll('.file-item').forEach(item => item.classList.remove('active'));
                    fileItem.classList.add('active');
                });
            }

            container.appendChild(fileItem);
            projectFiles.push({ name, handle, path, kind: handle.kind });
        }
    }

    // Función para cargar estructura colapsada (solo primer nivel)
    async function loadCollapsedProjectStructure() {
        if (!currentProjectHandle) return;

        const fileExplorer = document.getElementById('file-explorer');
        fileExplorer.innerHTML = '';

        projectFiles = [];
        
        // Cargar solo el primer nivel
        for await (const [name, handle] of currentProjectHandle.entries()) {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.dataset.path = name;
            
            const isDirectory = handle.kind === 'directory';
            const icon = isDirectory ? '📁' : getFileIcon(name);
            
            fileItem.innerHTML = `
                <span class="folder-toggle">${isDirectory ? '▶' : ''}</span>
                <span class="file-icon">${icon}</span>
                <span class="file-name">${name}</span>
            `;

            if (isDirectory) {
                fileItem.classList.add('folder-item');
                
                const folderChildren = document.createElement('div');
                folderChildren.className = 'folder-children';
                fileItem.appendChild(folderChildren);
                
                const toggle = fileItem.querySelector('.folder-toggle');
                fileItem.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    
                    if (!fileItem.classList.contains('expanded')) {
                        // Expandir y cargar contenido
                        fileItem.classList.add('expanded');
                        toggle.textContent = '▼';
                        await listFiles(handle, folderChildren, name);
                    } else {
                        // Colapsar
                        fileItem.classList.remove('expanded');
                        toggle.textContent = '▶';
                    }
                });
            } else {
                fileItem.addEventListener('click', (e) => {
                    e.stopPropagation();
                    openFileFromProject(handle, name);
                    document.querySelectorAll('.file-item').forEach(item => item.classList.remove('active'));
                    fileItem.classList.add('active');
                });
            }

            fileExplorer.appendChild(fileItem);
            projectFiles.push({ name, handle, path: '', kind: handle.kind });
        }
    }

    // Obtener icono según extensión del archivo
    function getFileIcon(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const icons = {
            'html': '🌐', 'htm': '🌐',
            'css': '🎨',
            'js': '📜', 'javascript': '📜',
            'json': '📋',
            'md': '📝', 'txt': '📝',
            'jpg': '🖼️', 'jpeg': '🖼️', 'png': '🖼️', 'gif': '🖼️', 'svg': '🖼️'
        };
        return icons[ext] || '📄';
    }

    // ===== GESTIÓN MEJORADA DE ARCHIVOS ABIERTOS =====
let openFiles = new Map();
let currentFileTab = null;

// REEMPLAZAR la función openFileFromProject con esta versión mejorada:
async function openFileFromProject(fileHandle, filename) {
    try {
        const file = await fileHandle.getFile();
        const content = await file.text();
        
        // Actualizar editor
        editor.setValue(content);
        currentFileName = filename;
        
       // Detectar lenguaje automáticamente por extensión
const detectedMode = detectLanguageByExtension(filename);
editor.session.setMode(`ace/mode/${detectedMode}`);
updateLanguageSelector(detectedMode);
        
        // Actualizar selección en sidebar
        updateSidebarSelection(filename);
        showNotification(`Archivo abierto: ${filename}`);
        
    } catch (error) {
        console.error('Error abriendo archivo del proyecto:', error);
        showNotification(`Error abriendo archivo: ${error.message}`, true);
    }
}

// Función para actualizar selección en sidebar
function updateSidebarSelection(filename) {
    // Remover active de todos los elementos
    document.querySelectorAll('.file-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Agregar active al archivo actual
    const allFileItems = document.querySelectorAll('.file-item');
    for (let item of allFileItems) {
        const itemName = item.querySelector('.file-name').textContent;
        if (itemName === filename) {
            item.classList.add('active');
            // Scroll para hacer visible el elemento
            item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            break;
        }
    }
}


// Actualizar selección en sidebar
function updateSidebarSelection(filename) {
    // Remover active de todos los elementos
    document.querySelectorAll('.file-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Agregar active al archivo actual
    document.querySelectorAll('.file-item').forEach(item => {
        const itemName = item.querySelector('.file-name').textContent;
        if (itemName === filename) {
            item.classList.add('active');
        }
    });
}

// Modificar el event listener en loadCollapsedProjectStructure
function setupFileItemEvents(fileItem, handle, name) {
    fileItem.addEventListener('click', async (e) => {
        e.stopPropagation();
        
        // Si ya está activo, no hacer nada
        if (fileItem.classList.contains('active')) {
            return;
        }
        
        await openFileFromProject(handle, name);
    });
}

    // Crear estructura por defecto del proyecto
    async function createDefaultProjectStructure() {
        if (!currentProjectHandle) return;

        try {
            // Crear index.html
            const indexFileHandle = await currentProjectHandle.getFileHandle('index.html', { create: true });
            const writable = await indexFileHandle.createWritable();
            await writable.write(`<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nuevo Proyecto</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <h1>¡Bienvenido a tu nuevo proyecto!</h1>
    <script src="script.js"></script>
</body>
</html>`);
            await writable.close();

            // Crear archivos CSS y JS vacíos
            const cssFileHandle = await currentProjectHandle.getFileHandle('style.css', { create: true });
            const jsFileHandle = await currentProjectHandle.getFileHandle('script.js', { create: true });

            // Recargar estructura
            await loadProjectStructure();

        } catch (error) {
            console.error('Error creando estructura del proyecto:', error);
        }
    }

    // Guardar archivo actual del proyecto
    async function saveCurrentFile() {
        if (!currentFileTab || !openFiles.has(currentFileTab)) return false;

        try {
            const fileData = openFiles.get(currentFileTab);
            const writable = await fileData.handle.createWritable();
            await writable.write(editor.getValue());
            await writable.close();

            fileData.modified = false;
            showNotification(`Archivo guardado: ${currentFileTab}`);
            return true;
        } catch (error) {
            console.error('Error guardando archivo del proyecto:', error);
            showNotification(`Error al guardar: ${error.message}`, true);
            return false;
        }
    }

    // Modificar el evento de cambio del editor para marcar como modificado
    editor.session.on('change', () => {
        // Marcar archivo como modificado si está en un proyecto
        if (currentFileTab && openFiles.has(currentFileTab)) {
            const fileData = openFiles.get(currentFileTab);
            fileData.modified = true;
            // Puedes agregar un indicador visual (asterisco) en la pestaña
            const tab = document.querySelector(`.editor-tab[data-filename="${currentFileTab}"]`);
            if (tab && !tab.textContent.includes('*')) {
                tab.querySelector('span').textContent = currentFileTab + ' *';
            }
        }
    });

    // ===== PERSISTENCIA Y RESTAURACIÓN =====
    // 1. Persistencia al cerrar
    window.addEventListener('beforeunload', () => {
        sessionStorage.setItem('editorContent', editor.getValue());
        sessionStorage.setItem('editorMode', editor.session.getMode().split('/').pop());
        sessionStorage.setItem('scrollPosition', editor.session.getScrollTop());
    });

    // 2. Restaurar estado
    const savedContent = sessionStorage.getItem('editorContent');
    const savedMode = sessionStorage.getItem('editorMode');
    const savedPosition = sessionStorage.getItem('scrollPosition');
    const copiedCode = sessionStorage.getItem('copiedCode');
    
    // Prioridad de restauración
    if (copiedCode) {
        editor.setValue(copiedCode);
        sessionStorage.removeItem('copiedCode');
        editor.session.setMode("ace/mode/javascript");
        document.getElementById('modeSelector').value = 'javascript';
    } else if (savedContent) {
        editor.setValue(savedContent);
        if (savedMode) {
            editor.session.setMode(`ace/mode/${savedMode}`);
            document.getElementById('modeSelector').value = savedMode;
        }
    } else {
        // Contenido inicial
        editor.setValue(`<!DOCTYPE html>
<html>
<head>
  <title>Ejemplo</title>
  <script>
    console.log("Hola desde el editor");
  </script>
</head>
<body>
  <h1>¡Consola JavaScript Funcionando!</h1>
</body>
</html>`);
    }

    // 3. Restaurar posición (siempre)
    if (savedPosition) {
        setTimeout(() => {
            editor.session.setScrollTop(parseInt(savedPosition));
        }, 100);
    }
    
    // 4. Posicionamiento y foco (siempre)
    setTimeout(() => {
        editor.gotoLine(0, 0, true);
        editor.focus();
    }, 300);
    
    // 5. Previsualización (siempre)
    updatePreview();
    
   
    // ===== CONSOLA PRINCIPAL MEJORADA =====
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
            // Configurar event listeners
            this.setupConsoleEvents();
            
            // Mensaje de bienvenida
            this.addToConsole('🚀 Consola JavaScript lista. Escribe código o usa "Run" para ejecutar.', 'info');
        }

        setupConsoleEvents() {
            // Botón ejecutar
            document.getElementById('runButton').addEventListener('click', () => {
                this.executeEditorCode();
            });

            // Botón limpiar consola
            document.getElementById('clearConsole').addEventListener('click', () => {
                this.clearConsole();
            });

            // Input de consola (para comandos directos)
            if (this.consoleInput) {
                this.consoleInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        this.executeConsoleInput();
                    }
                    
                    // Navegación en historial
                    if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        this.navigateHistory(-1);
                    } else if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        this.navigateHistory(1);
                    }
                });
            }
        }

        executeEditorCode() {
            const language = document.getElementById('modeSelector').value;
            
            if (language !== "javascript") {
                this.addToConsole("❌ La consola solo ejecuta código JavaScript\nCambia el lenguaje a JavaScript para ejecutar código", "error");
                return;
            }

            const code = editor.getValue();
            if (!code.trim()) {
                this.addToConsole("❌ No hay código para ejecutar", "error");
                return;
            }

            this.executeJavaScriptCode(code);
        }

        executeConsoleInput() {
            const code = this.consoleInput.value.trim();
            if (!code) return;

            this.addToConsole(`> ${code}`, 'input');
            this.executeJavaScriptCode(code);
            
            // Agregar al historial
            if (this.commandHistory[this.commandHistory.length - 1] !== code) {
                this.commandHistory.push(code);
                if (this.commandHistory.length > 50) {
                    this.commandHistory.shift();
                }
            }
            this.historyIndex = -1;
            this.consoleInput.value = '';
        }

        navigateHistory(direction) {
            if (this.commandHistory.length === 0) return;

            this.historyIndex += direction;
            
            if (this.historyIndex < 0) {
                this.historyIndex = -1;
                this.consoleInput.value = '';
            } else if (this.historyIndex >= this.commandHistory.length) {
                this.historyIndex = this.commandHistory.length - 1;
            } else {
                this.consoleInput.value = this.commandHistory[this.historyIndex];
            }
        }

        async executeJavaScriptCode(code) {
            if (this.isExecuting) {
                this.addToConsole("⏳ Ya hay una ejecución en curso...", "warning");
                return;
            }

            this.isExecuting = true;
            
            try {
                // Crear un contexto aislado más robusto
                const sandbox = this.createSecureSandbox();
                
                // Ejecutar con timeout
                await this.executeWithTimeout(code, sandbox);
                
            } catch (error) {
                this.addToConsole(`❌ Error: ${error.message}`, "error");
            } finally {
                this.isExecuting = false;
            }
        }

        createSecureSandbox() {
            const sandbox = {
                // Console methods
                console: {
                    log: (...args) => this.consoleLog(args),
                    error: (...args) => this.consoleError(args),
                    warn: (...args) => this.consoleWarn(args),
                    info: (...args) => this.consoleInfo(args),
                    clear: () => this.clearConsole()
                },
                
                // Timers (limitados)
                setTimeout: (fn, delay, ...args) => {
                    if (delay > 5000) delay = 5000; // Max 5 segundos
                    return setTimeout(fn, delay, ...args);
                },
                setInterval: (fn, delay, ...args) => {
                    if (delay > 5000) delay = 5000;
                    const id = setInterval(fn, delay, ...args);
                    // Auto-clear después de 10 segundos máximo
                    setTimeout(() => clearInterval(id), 10000);
                    return id;
                },
                clearTimeout,
                clearInterval,
                
                // Objetos seguros
                Math: Math,
                Date: Date,
                JSON: JSON,
                Number: Number,
                String: String,
                Array: Array,
                Object: Object,
                Boolean: Boolean,
                
                // Promise limitado
                Promise: class SafePromise extends Promise {
                    constructor(executor) {
                        super((resolve, reject) => {
                            executor(
                                value => resolve(value),
                                reason => reject(reason)
                            );
                        });
                    }
                }
            };

            // Proxy para seguridad
            return new Proxy(sandbox, {
                has: () => true,
                get: (target, prop) => {
                    if (prop === 'window' || prop === 'document' || prop === 'globalThis') {
                        return undefined;
                    }
                    if (prop in target) {
                        return target[prop];
                    }
                    return undefined;
                },
                set: () => false
            });
        }

        async executeWithTimeout(code, sandbox) {
            return new Promise((resolve, reject) => {
                const timeoutId = setTimeout(() => {
                    reject(new Error("⏱️ Timeout: La ejecución tardó demasiado (10 segundos)"));
                }, 10000);

                try {
                    const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
                    const fn = new AsyncFunction('sandbox', `
                        with(sandbox) {
                            try {
                                ${code}
                            } catch(e) {
                                console.error('Execution Error:', e.message);
                            }
                        }
                    `);
                    
                    fn(sandbox).then(() => {
                        clearTimeout(timeoutId);
                        resolve();
                    }).catch(error => {
                        clearTimeout(timeoutId);
                        reject(error);
                    });
                    
                } catch (error) {
                    clearTimeout(timeoutId);
                    reject(error);
                }
            });
        }

        // Métodos para capturar console
        consoleLog(args) {
            const message = args.map(arg => this.formatOutput(arg)).join(' ');
            this.addToConsole(message, 'log');
        }

        consoleError(args) {
            const message = args.map(arg => this.formatOutput(arg)).join(' ');
            this.addToConsole(`❌ ${message}`, 'error');
        }

        consoleWarn(args) {
            const message = args.map(arg => this.formatOutput(arg)).join(' ');
            this.addToConsole(`⚠️ ${message}`, 'warning');
        }

        consoleInfo(args) {
            const message = args.map(arg => this.formatOutput(arg)).join(' ');
            this.addToConsole(`ℹ️ ${message}`, 'info');
        }

        formatOutput(arg) {
            if (arg === null) return 'null';
            if (arg === undefined) return 'undefined';
            
            if (typeof arg === 'object') {
                try {
                    if (arg instanceof Error) {
                        return `Error: ${arg.message}`;
                    }
                    return JSON.stringify(arg, null, 2);
                } catch {
                    return String(arg);
                }
            }
            
            return String(arg);
        }

        addToConsole(text, type = "normal") {
            if (!this.consoleOutput) return;
            
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
                case 'input':
                    formattedText = `[${timestamp}] > ${text}\n`;
                    break;
                case 'log':
                    formattedText = `[${timestamp}] ${text}\n`;
                    break;
                default:
                    formattedText = `[${timestamp}] ${text}\n`;
            }

            this.consoleOutput.value += formattedText;
            this.consoleOutput.scrollTop = this.consoleOutput.scrollHeight;
        }

        clearConsole() {
            if (this.consoleOutput) {
                this.consoleOutput.value = '';
                this.addToConsole('🧹 Consola limpiada', 'info');
            }
        }
    }

    // Inicializar consola principal MEJORADA
    const mainConsole = new MainConsole();

    // Función para actualizar la previsualización (MANTENER esta función)
    function updatePreview() {
        const preview = document.getElementById('preview');
        const code = editor.getValue();
        preview.srcdoc = code;
    }

    // Inicializar canal alterno de consola (MANTENER esta llamada)
    initializeAlternateConsole();
});


// Función para inicializar el canal alterno de consola
function initializeAlternateConsole() {
    const runButton = document.getElementById('runAlternateConsole');
    const clearInputButton = document.getElementById('clearAlternateInput');
    const clearOutputButton = document.getElementById('clearAlternateOutput');
    const inputTextarea = document.getElementById('alternateConsoleInput');
    const outputTextarea = document.getElementById('alternateConsoleOutput');

    if (runButton) {
        runButton.addEventListener('click', () => {
            const code = inputTextarea.value;
            if (!code.trim()) return;

            try {
                // Capturar console.log
                const originalLog = console.log;
                const originalError = console.error;
                let output = '';

                console.log = (...args) => {
                    output += args.map(arg => 
                        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                    ).join(' ') + '\n';
                };

                console.error = (...args) => {
                    output += 'ERROR: ' + args.join(' ') + '\n';
                };

                // Ejecutar el código
                const result = new Function(code)();
                
                // Restaurar console.log original
                console.log = originalLog;
                console.error = originalError;

                // Mostrar resultado
                if (result !== undefined) {
                    output += 'Resultado: ' + String(result) + '\n';
                }

                outputTextarea.value = output;
            } catch (error) {
                outputTextarea.value = 'Error: ' + error.message;
            }
        });
    }

    if (clearInputButton) {
        clearInputButton.addEventListener('click', () => {
            inputTextarea.value = '';
        });
    }

    if (clearOutputButton) {
        clearOutputButton.addEventListener('click', () => {
            outputTextarea.value = '';
        });
    }
}