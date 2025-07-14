document.addEventListener("DOMContentLoaded", () => {




    const MODELS = {
        'gemini-pro': {
            name: 'Gemini Pro',
            provider: 'Google',
            apiUrl: 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent',
            apiKeyName: 'geminiApiKey',
            getApiKeyUrl: "https://makersuite.google.com/app/apikey"
        },
        'gpt-3.5-turbo': {
            name: 'GPT-3.5 Turbo',
            provider: 'OpenAI',
            apiUrl: 'https://api.openai.com/v1/chat/completions',
            apiKeyName: 'openaiApiKey',
            getApiKeyUrl: 'https://platform.openai.com/account/api-keys',
        },
        'gpt-4': {
            name: 'GPT-4',
            provider: 'OpenAI',
            apiUrl: 'https://api.openai.com/v1/chat/completions',
            apiKeyName: 'openaiApiKey',
            getApiKeyUrl: 'https://platform.openai.com/account/api-keys',
        },
        'claude-2.1': {
            name: 'Claude 2.1',
            provider: 'Anthropic',
            apiUrl: 'https://api.anthropic.com/v1/messages',
            apiKeyName: 'anthropicApiKey',
            getApiKeyUrl: 'https://console.anthropic.com/settings/keys',
        },
        'claude-3-opus-20240229': {
            name: 'Claude 3 Opus',
            provider: 'Anthropic',
            apiUrl: 'https://api.anthropic.com/v1/messages',
            apiKeyName: 'anthropicApiKey',
            getApiKeyUrl: 'https://console.anthropic.com/settings/keys',
        },
    }

    const state = {
        chats: [],
        activeChatId: null,
        theme: 'light',
        apiKeys: {
            geminiApikey: null,
            openaiApiKey: null,
            anthropicApiKey: null,
        },
        model: 'gemini-pro',
        isLoading: false,
    }


    const dom = {
        newChatBtn: document.getElementById('newChatBtn'),
        chatHistory: document.getElementById("chatHistory"),
        messagesContainer: document.getElementById('messagesContainer'),
        messageInput: document.getElementById('messageInput'),
        sendBtn: document.getElementById('sendBtn'),
        charCount: document.getElementById('charCount'),
        apiKeyBtn: document.getElementById('apiKeyBtn'),
        apiKeyStatus: document.getElementById('apiKeyStatus'),
        apiKeyModal: document.getElementById('apiKeyModal'),
        apiKeyInput: document.getElementById('apiKeyInput'),
        saveApiKey: document.getElementById('saveApiKey'),
        cancelApiKey: document.getElementById('cancelApiKey'),
        themeToggle: null,
        modelSelector: document.getElementById('modelSelector'),
        modelDescription: document.getElementById('modelDescription'),
        apiKeyModelName: document.getElementById('apiKeyModelName'),
        apiKeyInstructions: document.getElementById('apiKeyInstructions'),
    }


    const storage = {
        saveState: () => {
            const stateToSave = { ...state }
            localStorage.setItem('aiChatBotState', JSON.stringify(stateToSave));
        },
        loadState: () => {
            const savedState = localStorage.getItem("aiChatBotState");

            if (savedState) {
                const parsedState = JSON.parse(savedState);
                // parsedState.apiKey is getting set from the UI
                if (parsedState.apiKey && !parsedState.apiKeys) {
                    parsedState.apiKeys = {
                        geminiApikey: parsedState.apiKey, openaiApiKey: null, anthropicApiKey: null
                    };
                    delete parsedState.apiKey; // This api key will be deleted from the state
                }
                Object.assign(state, parsedState)
            }
        }
    }
})