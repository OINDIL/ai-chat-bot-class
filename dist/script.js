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

    const ui = { // ui related code belongs here
        renderChatHistory: () => {
            dom.chatHistory.innerHTML = "";

            if (state.chats.length === 0) {
                dom.chatHistory.innerHTML = "<p class='text-center text-gray-500 text-sm'>No Chats Found</p>"
            }

            state.chats.forEach((chat) => {
                const chatDiv = document.createElement('div');

                chatDiv.className = `p-3 rounded-lg cursor-pointer transition-colors text-sm truncate flex justify-between items-center ${chat.id === state.activeChatId ? 'bg-gray-200 dark:bg-gray-700 text-white' : 'hover:bg-gray-100 dark:bg-gray-700 text-white'}`

                chatDiv.dataset.chatId = chat.id; // optional


                // title span tag inside div chatDiv
                const titleSpan = document.createElement('span');

                titleSpan.innerHTML = `<i class="fas fa-comment mr-2 text-gray-400"></i> ${chat.title}`;

                chatDiv.appendChild(titleSpan);


                const controlsDiv = document.createElement('div');
                const renameBtn = document.createElement('button');

                renameBtn.innerHTML = '<i class="fas fa-edit text-gray-500 hover:text-gray-700"></i>';
                renameBtn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    app.renameChat(chat.id);
                })

                const deleteBtn = document.createElement('button');
                deleteBtn.innerHTML = '<i class="fas fa-trash text-gray-500 hover:text-red-500 ml-2"></i>';
                deleteBtn.onclick = (e) => { e.stopPropagation(); app.deleteChat(chat.id); };


                controlsDiv.appendChild(renameBtn);
                controlsDiv.appendChild(deleteBtn);
                chatDiv.appendChild(controlsDiv);

                chatDiv.addEventListener("click", () => {
                    app.setActiveChat(chat.id);
                })


                dom.chatHistory.appendChild(chatDiv);
            })


        },

        renderMessages: () => {
            dom.messagesContainer.innerHTML = "";

            const activeChat = state.chats.find((chat) => chat.id === state.activeChatId);

            if (!activeChat || activeChat.messages.length === 0) {
                // Todo: WIP
            }

            activeChat.messages.forEach((message) => {

                this.addMessageToUI(message.role, message.content);
            })

            // TODO: WIP
        },

        addMessageToUI: (role, content, isError = false) => {
            const messageDiv = document.createElement('div');

            messageDiv.className = `flex ${role === 'user' ? 'justify-end' : 'justify-start'}`;

            const messageBubble = document.createElement('div');

            messageBubble.className = `max-w-[80%] lg:max-w-[70%] px-4 py-3 rounded-lg ${role === 'user'
                ? 'bg-blue-600 text-white'
                : isError
                    ? 'bg-red-100 text-red-800 border border-red-200'
                    : 'bg-white text-gray-800 border border-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600'
                }`;

            if (role === 'assistant' && window.marked) {
                messageBubble.innerHTML = DOMPurify.sanitize(marked.parse(content)); // NO XSS Attacks

                messageBubble.querySelectorAll('pre code').forEach((block) => {
                    hljs.highlightElement(block);
                })
            } else {
                messageBubble.textContent = "Can't display data!";
            }

            messageDiv.appendChild(messageBubble);
            dom.messagesContainer.appendChild(messageDiv);
        }

    }



})