// ============================================================
// 🚀 MULTI-API DE INTELIGENCIAS ARTIFICIALES
// ============================================================
// Creado por: DeepSeek 🤖
// 
// APIs incluidas:
//   - DeepSeek (gratis)
//   - OpenAI / ChatGPT
//   - Google Gemini
//   - Anthropic Claude
//   - Perplexity AI
//   - Mistral AI
//   - Grok (xAI)
// ============================================================

class MultiAI {
    constructor() {
        this.apis = {
            deepseek: {
                name: 'DeepSeek',
                url: 'https://api.deepseek.com/v1/chat/completions',
                docs: 'https://platform.deepseek.com/api-docs',
                keyPlace: 'header',
                headerName: 'Authorization',
                keyPrefix: 'Bearer ',
                model: 'deepseek-chat',
                free: true,
                description: 'Contexto 1M tokens, razonamiento profundo, GRATIS',
                color: '#4F46E5'
            },
            openai: {
                name: 'ChatGPT (OpenAI)',
                url: 'https://api.openai.com/v1/chat/completions',
                docs: 'https://platform.openai.com/api-keys',
                keyPlace: 'header',
                headerName: 'Authorization',
                keyPrefix: 'Bearer ',
                model: 'gpt-3.5-turbo',
                free: false,
                hasFreeTier: true,
                description: 'Requiere API Key (tiene crédito gratuito inicial)',
                color: '#10A37F'
            },
            gemini: {
                name: 'Google Gemini',
                url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
                docs: 'https://makersuite.google.com/app/apikey',
                keyPlace: 'query',
                paramName: 'key',
                keyPrefix: '',
                model: 'gemini-pro',
                free: true,
                description: 'API Key gratuita de Google, 60 solicitudes/minuto',
                color: '#4285F4'
            },
            claude: {
                name: 'Anthropic Claude',
                url: 'https://api.anthropic.com/v1/messages',
                docs: 'https://console.anthropic.com/',
                keyPlace: 'header',
                headerName: 'x-api-key',
                keyPrefix: '',
                model: 'claude-3-haiku-20240307',
                free: false,
                hasFreeTier: true,
                description: 'Requiere API Key (tiene crédito gratuito)',
                color: '#D97706'
            },
            perplexity: {
                name: 'Perplexity AI',
                url: 'https://api.perplexity.ai/chat/completions',
                docs: 'https://docs.perplexity.ai/docs/getting-started',
                keyPlace: 'header',
                headerName: 'Authorization',
                keyPrefix: 'Bearer ',
                model: 'sonar-small-chat',
                free: false,
                hasFreeTier: true,
                description: 'API con citas y búsqueda en tiempo real',
                color: '#1E3A5F'
            },
            mistral: {
                name: 'Mistral AI',
                url: 'https://api.mistral.ai/v1/chat/completions',
                docs: 'https://console.mistral.ai/api-keys/',
                keyPlace: 'header',
                headerName: 'Authorization',
                keyPrefix: 'Bearer ',
                model: 'mistral-tiny',
                free: true,
                description: 'API gratuita, modelo open-source potente',
                color: '#FF6B35'
            },
            grok: {
                name: 'Grok (xAI)',
                url: 'https://api.x.ai/v1/chat/completions',
                docs: 'https://x.ai/api',
                keyPlace: 'header',
                headerName: 'Authorization',
                keyPrefix: 'Bearer ',
                model: 'grok-1',
                free: false,
                hasFreeTier: false,
                description: 'Requiere suscripción X Premium+ o API Key paga',
                color: '#000000'
            }
        };
    }

    // Obtener lista de APIs disponibles
    getAvailableApis() {
        return this.apis;
    }

    // Obtener APIs gratuitas
    getFreeApis() {
        const free = {};
        for (const [key, api] of Object.entries(this.apis)) {
            if (api.free || api.hasFreeTier) {
                free[key] = api;
            }
        }
        return free;
    }

    // Hacer petición a una API
    async ask(apiName, message, apiKey = '', model = null) {
        const api = this.apis[apiName];
        if (!api) {
            throw new Error(`API "${apiName}" no encontrada`);
        }

        let url = api.url;
        const headers = {
            'Content-Type': 'application/json'
        };
        let body = {};

        // Configurar según el tipo de API
        switch (apiName) {
            case 'deepseek':
            case 'openai':
                if (apiKey) headers[api.headerName] = api.keyPrefix + apiKey;
                body = {
                    model: model || api.model,
                    messages: [{ role: 'user', content: message }],
                    max_tokens: 2000
                };
                break;

            case 'gemini':
                if (apiKey) url += `?key=${apiKey}`;
                body = {
                    contents: [{
                        parts: [{ text: message }]
                    }]
                };
                break;

            case 'claude':
                if (apiKey) headers[api.headerName] = api.keyPrefix + apiKey;
                headers['anthropic-version'] = '2023-06-01';
                body = {
                    model: model || api.model,
                    max_tokens: 2000,
                    messages: [{ role: 'user', content: message }]
                };
                break;

            case 'perplexity':
                if (apiKey) headers[api.headerName] = api.keyPrefix + apiKey;
                body = {
                    model: model || api.model,
                    messages: [{ role: 'user', content: message }]
                };
                break;

            case 'mistral':
                if (apiKey) headers[api.headerName] = api.keyPrefix + apiKey;
                body = {
                    model: model || api.model,
                    messages: [{ role: 'user', content: message }]
                };
                break;

            case 'grok':
                if (apiKey) headers[api.headerName] = api.keyPrefix + apiKey;
                body = {
                    model: model || api.model,
                    messages: [{ role: 'user', content: message }]
                };
                break;
        }

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Error ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            return this._parseResponse(apiName, data);

        } catch (error) {
            throw new Error(`Error al conectar con ${api.name}: ${error.message}`);
        }
    }

    // Parsear respuesta según cada API
    _parseResponse(apiName, data) {
        switch (apiName) {
            case 'deepseek':
            case 'openai':
            case 'perplexity':
            case 'mistral':
            case 'grok':
                return data.choices?.[0]?.message?.content || 'Sin respuesta';

            case 'gemini':
                return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sin respuesta';

            case 'claude':
                return data.content?.[0]?.text || 'Sin respuesta';

            default:
                return JSON.stringify(data);
        }
    }
}

// Exportar para usar en otros archivos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MultiAI;
}