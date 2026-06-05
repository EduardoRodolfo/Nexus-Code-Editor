// ============================================================
// 🌐 SISTEMA DE TRADUCCIÓN - Nexus Code Editor
// Soporta: Español (es), Inglés (en), Chino (zh)
// ============================================================

const TRANSLATOR = {
    currentLang: 'es',
    translations: {},
    elements: [],
    
    // Inicializar el traductor
    init: async function() {
        this.currentLang = localStorage.getItem('nexusLang') || 'es';
        await this.loadTranslations(this.currentLang);
        this.applyTranslations();
        console.log('🌐 Traductor inicializado - Idioma:', this.currentLang);
    },
    
    // Cargar archivo de traducciones con rutas alternativas de respaldo
    loadTranslations: async function(lang) {
        // Lista de posibles rutas para el archivo de traducciones
        const posiblesRutas = [
            'lang/' + lang + '.json',
            '/nexus/lang/' + lang + '.json',
            './lang/' + lang + '.json'
        ];
        
        for (const ruta of posiblesRutas) {
            try {
                const response = await fetch(ruta);
                if (!response.ok) {
                    console.warn('⚠️ Ruta ' + ruta + ' devolvió HTTP ' + response.status);
                    continue; // Intentar siguiente ruta
                }
                const text = await response.text();
                // Verificar que no sea HTML (error 404 disfrazado)
                if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
                    console.warn('⚠️ Ruta ' + ruta + ' devolvió HTML en lugar de JSON');
                    continue;
                }
                this.translations = JSON.parse(text);
                return true;
            } catch (error) {
                console.warn('⚠️ Error con ruta ' + ruta + ':', error.message);
                // Continuar con la siguiente ruta
            }
        }
        
        // Si fallaron todas las rutas y no es español, intentar cargar español como fallback
        console.error('❌ Error cargando traducciones para:', lang);
        if (lang !== 'es') {
            console.log('🔄 Intentando cargar español como fallback...');
            return await this.loadTranslations('es');
        }
        
        // Si todo falló, crear traducciones vacías para evitar errores
        console.error('❌ No se pudieron cargar las traducciones');
        this.translations = {};
        return false;
    },
    
    // Cambiar idioma
    setLanguage: async function(lang) {
        if (lang === this.currentLang) return;
        
        const success = await this.loadTranslations(lang);
        if (success) {
            this.currentLang = lang;
            localStorage.setItem('nexusLang', lang);
            this.applyTranslations();
            document.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: lang } }));
            console.log('🌐 Idioma cambiado a:', lang);
            return true;
        }
        return false;
    },
    
    // Obtener texto traducido
    t: function(key) {
        const keys = key.split('.');
        let value = this.translations;
        
        for (let k of keys) {
            if (value && value[k] !== undefined) {
                value = value[k];
            } else {
                return key;
            }
        }
        
        return value;
    },
    
    // Aplicar traducciones
    applyTranslations: function() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const text = this.t(key);
            if (text && text !== key) {
                el.textContent = text;
            }
        });
        
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            const text = this.t(key);
            if (text && text !== key) {
                el.placeholder = text;
            }
        });
        
        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            const key = el.getAttribute('data-i18n-title');
            const text = this.t(key);
            if (text && text !== key) {
                el.title = text;
            }
        });
        
        const selector = document.getElementById('langSelector');
        if (selector) {
            selector.value = this.currentLang;
        }
        
        document.documentElement.lang = this.currentLang;
    }
};

document.addEventListener('DOMContentLoaded', function() {
    TRANSLATOR.init();
});