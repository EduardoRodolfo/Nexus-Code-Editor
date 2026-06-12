// ========================================
// 📚 TUTORIAL NEXUS - FUNCIONES COMUNES
// ========================================

// ===== CONTROLES DE ACCESIBILIDAD =====
let fontSizeLevel = 1;
const fontSizes = [14, 16, 20, 24];
const fontLabels = ['Pequeña', 'Normal', 'Grande', 'Muy grande'];

function cambiarFuente(delta) {
    const body = document.body;
    const container = document.querySelector('.tutorial-container');
    
    fontSizeLevel = Math.max(0, Math.min(fontSizes.length - 1, fontSizeLevel + delta));
    
    // Quitar todas las clases de fuente
    body.className = body.className.replace(/font-\w+/g, '');
    body.classList.add('font-' + fontLabels[fontSizeLevel].toLowerCase().replace(' ', '-'));
    
    // Actualizar indicador
    const indicator = document.getElementById('fontIndicator');
    if (indicator) {
        indicator.textContent = fontLabels[fontSizeLevel];
    }
    
    // Guardar preferencia
    localStorage.setItem('nexus_tutorial_font', fontSizeLevel);
}

function aumentarFuente() { cambiarFuente(1); }
function disminuirFuente() { cambiarFuente(-1); }

// ===== VERIFICAR LICENCIA =====
function verificarLicenciaTutorial() {
    const apiKey = localStorage.getItem('nexus_api_key');
    const plan = localStorage.getItem('nexus_plan');
    const badge = document.getElementById('badgeFull');
    
    if (badge) {
        if (apiKey && plan === 'full') {
            badge.classList.add('visible');
            badge.textContent = '👑 FULL';
            
            // Desbloquear todas las lecciones
            document.querySelectorAll('.leccion.bloqueada').forEach(el => {
                el.classList.remove('bloqueada');
            });
            
            // Actualizar TOC
            document.querySelectorAll('.toc ol li.bloqueado').forEach(el => {
                el.classList.remove('bloqueado');
            });
            
            // Ocultar mensaje FULL
            document.querySelectorAll('.full-message').forEach(el => {
                el.style.display = 'none';
            });
        } else {
            // Mostrar badge FREE
            badge.classList.add('visible');
            badge.textContent = '🆓 FREE';
            
            // Bloquear lecciones FULL (las que tengan data-plan="full")
            document.querySelectorAll('.leccion[data-plan="full"]').forEach(el => {
                el.classList.add('bloqueada');
            });
            
            // Marcar en TOC
            document.querySelectorAll('.toc ol li[data-plan="full"]').forEach(el => {
                el.classList.add('bloqueado');
            });
        }
    }
}

// ===== CARGAR TAMAÑO DE FUENTE GUARDADO =====
function cargarPreferencias() {
    const savedFont = localStorage.getItem('nexus_tutorial_font');
    if (savedFont !== null) {
        fontSizeLevel = parseInt(savedFont);
        const body = document.body;
        body.classList.add('font-' + fontLabels[fontSizeLevel].toLowerCase().replace(' ', '-'));
        
        const indicator = document.getElementById('fontIndicator');
        if (indicator) {
            indicator.textContent = fontLabels[fontSizeLevel];
        }
    }
}

// ===== TOAST NOTIFICATIONS =====
function mostrarToast(mensaje, tipo) {
    const contenedor = document.getElementById('toastContainer');
    if (!contenedor) return;
    
    const toast = document.createElement('div');
    toast.className = 'toast ' + (tipo || 'info');
    toast.textContent = mensaje;
    contenedor.appendChild(toast);
    
    setTimeout(() => {
        if (toast.parentNode) toast.remove();
    }, 4000);
}

// ===== INICIALIZAR =====
document.addEventListener('DOMContentLoaded', function() {
    cargarPreferencias();
    verificarLicenciaTutorial();
    
    // Crear contenedor de toasts si no existe
    if (!document.getElementById('toastContainer')) {
        const container = document.createElement('div');
        container.id = 'toastContainer';
        container.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:8px;';
        document.body.appendChild(container);
    }
    
    console.log('📚 Tutorial Nexus inicializado');
});