document.addEventListener('DOMContentLoaded', () => {
    const MODELS = {
        'gemini-pro': {
            name: 'Gemini Pro',
            provider: 'Google',
            apiUrl: 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent',
            apiKeyName: 'geminiApiKey',
            getApiKeyUrl: 'https://makersuite.google.com/app/apikey',
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
    };

    const state = {
        chats: [],
        activeChatId: null,
        theme: 'light',
        apiKeys: {
            geminiApiKey: null,
            openaiApiKey: null,
            anthropicApiKey: null,
        },
        model: 'gemini-pro',
        isLoading: false,
    };


    const dom = {
        newChatBtn: document.getElementById('newChatBtn'),
        chatHistory: document.getElementById('chatHistory'),
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
        newButton: document.getElementById("newButton")
    };


    const storage = {
        saveState() {
            const stateToSave = { ...state };
            localStorage.setItem('aiChatBotState', JSON.stringify(stateToSave));
        },
        loadState() {
            const savedState = localStorage.getItem('aiChatBotState');
            if (savedState) {
                const parsedState = JSON.parse(savedState);
                if (parsedState.apiKey && !parsedState.apiKeys) {
                    parsedState.apiKeys = { geminiApiKey: parsedState.apiKey, openaiApiKey: null, anthropicApiKey: null };
                    delete parsedState.apiKey;
                }
                Object.assign(state, parsedState);
            }
        },
    };

    const ui = {
        renderChatHistory() {
            dom.chatHistory.innerHTML = '';
            if (state.chats.length === 0) {
                dom.chatHistory.innerHTML = '<p class="text-center text-gray-500 text-sm">No chats yet.</p>';
                return;
            }
            state.chats.forEach(chat => {
                const chatElement = document.createElement('div');
                chatElement.className = `p-3 rounded-lg cursor-pointer transition-colors text-sm truncate flex justify-between items-center ${chat.id === state.activeChatId ? 'bg-gray-200 dark:bg-gray-700 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`;
                chatElement.dataset.chatId = chat.id;

                const titleSpan = document.createElement('span');
                titleSpan.innerHTML = `<i class="fas fa-comment mr-2 text-gray-400"></i> ${chat.title}`;
                chatElement.appendChild(titleSpan);

                const controlsDiv = document.createElement('div');
                const renameBtn = document.createElement('button');
                renameBtn.innerHTML = '<i class="fas fa-edit text-gray-500 hover:text-gray-700"></i>';
                renameBtn.onclick = (e) => { e.stopPropagation(); app.renameChat(chat.id); };

                const deleteBtn = document.createElement('button');
                deleteBtn.innerHTML = '<i class="fas fa-trash text-gray-500 hover:text-red-500 ml-2"></i>';
                deleteBtn.onclick = (e) => { e.stopPropagation(); app.deleteChat(chat.id); };

                controlsDiv.appendChild(renameBtn);
                controlsDiv.appendChild(deleteBtn);
                chatElement.appendChild(controlsDiv);

                chatElement.onclick = () => app.setActiveChat(chat.id);

                dom.chatHistory.appendChild(chatElement);
            });
        },
        renderMessages() {
            dom.messagesContainer.innerHTML = '';
            const activeChat = state.chats.find(c => c.id === state.activeChatId);

            if (!activeChat || activeChat.messages.length === 0) {
                this.showWelcomeMessage();
                return;
            }

            activeChat.messages.forEach(message => {
                this.addMessageToUI(message.role, message.content);
            });
            this.scrollToBottom();
        },
        addMessageToUI(role, content, isError = false) {
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
                messageBubble.innerHTML = DOMPurify.sanitize(marked.parse(content));
                messageBubble.querySelectorAll('pre code').forEach((block) => {
                    hljs.highlightElement(block);
                });
            } else {
                messageBubble.textContent = content;
            }

            messageDiv.appendChild(messageBubble);
            dom.messagesContainer.appendChild(messageDiv);
        },
        showWelcomeMessage() {
            dom.messagesContainer.innerHTML = `
                <div class="flex justify-center">
                    <div class="bg-blue-50 border border-blue-200 rounded-lg px-6 py-4 max-w-2xl text-center dark:bg-gray-800 dark:border-gray-700">
                        <i class="fas fa-robot text-blue-600 text-2xl mb-2"></i>
                        <h2 class="text-lg font-semibold text-blue-800 mb-2 dark:text-blue-400">Welcome to AI Chat!</h2>
                        <p class="text-blue-700 dark:text-gray-300">Start a new chat or select an existing one. Set your API key to begin.</p>
                    </div>
                </div>`;
        },
        updateCharCount() {
            dom.charCount.textContent = dom.messageInput.value.length;
        },
        updateSendButton() {
            const hasText = dom.messageInput.value.trim().length > 0;
            const currentModelConfig = MODELS[state.model];
            const hasApiKey = !!state.apiKeys[currentModelConfig.apiKeyName];
            dom.sendBtn.disabled = !hasText || !hasApiKey || state.isLoading;
        },
        scrollToBottom() {
            dom.messagesContainer.scrollTop = dom.messagesContainer.scrollHeight;
        },
        applyTheme() {
            if (state.theme === 'dark') {
                document.documentElement.classList.add('dark');
                if (dom.themeToggle) dom.themeToggle.innerHTML = '<i class="fas fa-sun"></i> Dark Mode';
            } else {
                document.documentElement.classList.remove('dark');
                if (dom.themeToggle) dom.themeToggle.innerHTML = '<i class="fas fa-moon"></i> Light Mode';
            }
        },
        createThemeToggle() {
            const themeToggleContainer = document.createElement('div');
            themeToggleContainer.className = 'p-4 border-t border-gray-200 dark:border-gray-700';
            const toggle = document.createElement('button');
            toggle.id = 'themeToggle';
            toggle.className = 'w-full text-gray-600 hover:text-gray-800 transition-colors text-sm flex items-center justify-center gap-2 dark:text-gray-300 dark:hover:text-white';
            toggle.onclick = app.toggleTheme;
            themeToggleContainer.appendChild(toggle);

            dom.chatHistory.parentNode.appendChild(themeToggleContainer);
            dom.themeToggle = toggle;
        },
        showApiKeyModal() {
            const currentModelConfig = MODELS[state.model];
            dom.apiKeyModelName.textContent = currentModelConfig.name;
            dom.apiKeyInstructions.innerHTML = `Get your ${currentModelConfig.provider} API key from <a href="${currentModelConfig.getApiKeyUrl}" target="_blank" class="text-blue-600 hover:underline">${currentModelConfig.provider}'s website</a>.`;
            dom.apiKeyModal.classList.remove('hidden');
            dom.apiKeyModal.classList.add('flex');
            dom.apiKeyInput.focus();
            dom.apiKeyInput.value = state.apiKeys[currentModelConfig.apiKeyName] || '';
        },
        hideApiKeyModal() {
            dom.apiKeyModal.classList.add('hidden');
            dom.apiKeyModal.classList.remove('flex');
        },
        updateApiKeyStatus() {
            const currentModelConfig = MODELS[state.model];
            const apiKey = state.apiKeys[currentModelConfig.apiKeyName];
            if (apiKey) {
                dom.apiKeyStatus.textContent = 'API Key Set ✓';
                dom.apiKeyStatus.classList.add('text-green-600');
            } else {
                dom.apiKeyStatus.textContent = 'Set API Key';
                dom.apiKeyStatus.classList.remove('text-green-600');
            }
        },
        showLoadingIndicator() {
            const loadingDiv = document.createElement('div');
            loadingDiv.className = 'flex justify-start';
            loadingDiv.id = 'loadingIndicator';

            loadingDiv.innerHTML = `
                <div class="bg-white border border-gray-200 px-4 py-3 rounded-lg dark:bg-gray-700 dark:border-gray-600">
                    <div class="flex items-center space-x-2">
                        <div class="flex space-x-1">
                            <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
                            <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                        </div>
                        <span class="text-gray-500 text-sm dark:text-gray-400">AI is thinking...</span>
                    </div>
                </div>
            `;
            dom.messagesContainer.appendChild(loadingDiv);
            this.scrollToBottom();
        },
        hideLoadingIndicator() {
            const indicator = document.getElementById('loadingIndicator');
            if (indicator) indicator.remove();
        },
        updateModelSelector() {
            dom.modelSelector.value = state.model;
            const modelConfig = MODELS[state.model];
            dom.modelDescription.textContent = `Powered by ${modelConfig.provider}`;
        }
    };

    const api = {
        async callApi(userMessage, chatHistory) {
            const modelConfig = MODELS[state.model];
            const apiKey = state.apiKeys[modelConfig.apiKeyName];

            if (!apiKey) {
                throw new Error('API key not set for the selected model.');
            }

            switch (modelConfig.provider) {
                case 'Google':
                    return this.callGemini(userMessage, chatHistory, apiKey);
                case 'OpenAI':
                    return this.callOpenAI(userMessage, chatHistory, apiKey);
                case 'Anthropic':
                    return this.callAnthropic(userMessage, chatHistory, apiKey);
                default:
                    throw new Error(`Unsupported model provider: ${modelConfig.provider}`);
            }
        },
        async callGemini(userMessage, chatHistory, apiKey) {
            const modelConfig = MODELS[state.model];
            const geminiHistory = chatHistory.map(msg => ({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.content }],
            }));

            const response = await fetch(`${modelConfig.apiUrl}?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [...geminiHistory, { role: 'user', parts: [{ text: userMessage }] }],
                    generationConfig: {
                        temperature: 0.7,
                        topK: 1,
                        topP: 1,
                        maxOutputTokens: 2048,
                    },
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error.message || 'Failed to get response from Gemini.');
            }

            const data = await response.json();
            return data.candidates[0].content.parts[0].text;
        },

        async callOpenAI(userMessage, chatHistory, apiKey) {
            const modelConfig = MODELS[state.model];
            const messages = chatHistory.map(msg => ({
                role: msg.role,
                content: msg.content,
            }));
            messages.push({ role: 'user', content: userMessage });

            const response = await fetch(modelConfig.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: state.model,
                    messages: messages,
                    temperature: 0.7,
                    max_tokens: 2048,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error.message || 'Failed to get response from OpenAI.');
            }

            const data = await response.json();
            return data.choices[0].message.content;
        },

        async callAnthropic(userMessage, chatHistory, apiKey) {
            const modelConfig = MODELS[state.model];
            const messages = chatHistory.map(msg => ({
                role: msg.role,
                content: msg.content,
            }));
            messages.push({ role: 'user', content: userMessage });

            const response = await fetch(modelConfig.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01',
                },
                body: JSON.stringify({
                    model: state.model,
                    messages: messages,
                    max_tokens: 2048,
                    temperature: 0.7,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error.message || 'Failed to get response from Anthropic.');
            }

            const data = await response.json();
            return data.content[0].text;
        }
    };

    const app = {
        init() {
            storage.loadState();
            ui.createThemeToggle();
            ui.applyTheme();
            ui.updateModelSelector();
            app.rerender();
            this.setupEventListeners();

            if (!state.apiKeys[MODELS[state.model].apiKeyName]) {
                setTimeout(() => ui.showApiKeyModal(), 500);
            }
        },
        setupEventListeners() {
            dom.newChatBtn.addEventListener('click', () => this.createNewChat());
            dom.sendBtn.addEventListener('click', () => this.sendMessage());
            dom.messageInput.addEventListener('input', () => {
                ui.updateCharCount();
                ui.updateSendButton();
            });
            dom.messageInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    dom.sendBtn.click();
                }
            });
            dom.apiKeyBtn.addEventListener('click', () => ui.showApiKeyModal());
            dom.saveApiKey.addEventListener('click', () => this.saveApiKey());
            dom.cancelApiKey.addEventListener('click', () => ui.hideApiKeyModal());
            dom.modelSelector.addEventListener('change', (e) => this.handleModelChange(e.target.value));
        },
        async sendMessage() {
            const userMessage = dom.messageInput.value.trim();
            if (!userMessage || state.isLoading) return;

            const activeChat = state.chats.find(c => c.id === state.activeChatId);
            if (!activeChat) return;

            state.isLoading = true;
            ui.updateSendButton();
            dom.messageInput.value = '';
            ui.updateCharCount();

            activeChat.messages.push({ role: 'user', content: userMessage });
            ui.addMessageToUI('user', userMessage);
            ui.scrollToBottom();
            ui.showLoadingIndicator();

            try {
                const chatHistory = activeChat.messages.slice(0, -1);
                const assistantResponse = await api.callApi(userMessage, chatHistory);

                activeChat.messages.push({ role: 'assistant', content: assistantResponse });
                if (activeChat.messages.length === 2 && !activeChat.title) {
                    this.generateChatTitle(userMessage);
                }
                ui.hideLoadingIndicator();
                ui.addMessageToUI('assistant', assistantResponse);
            } catch (error) {
                ui.hideLoadingIndicator();
                ui.addMessageToUI('assistant', `Error: ${error.message}`, true);
            } finally {
                state.isLoading = false;
                ui.updateSendButton();
                ui.scrollToBottom();
                storage.saveState();
            }
        },
        async generateChatTitle(userMessage) {
            const activeChat = state.chats.find(c => c.id === state.activeChatId);
            if (!activeChat) return;

            try {
                const prompt = `Based on the following user query, create a short, concise title (max 5 words) for this chat session. The user's first message was: "${userMessage}"`;
                const title = await api.callGemini(prompt, [], state.apiKeys.geminiApiKey);
                activeChat.title = title.replace(/"/g, '');
            } catch (error) {
                console.error("Failed to generate chat title:", error);
                activeChat.title = userMessage.split(' ').slice(0, 5).join(' ');
            } finally {
                app.rerenderChatHistory();
                storage.saveState();
            }
        },
        createNewChat() {
            const newChat = { id: Date.now().toString(), title: `Chat ${state.chats.length + 1}`, messages: [] };
            state.chats.unshift(newChat);
            this.setActiveChat(newChat.id);
        },
        setActiveChat(chatId) {
            state.activeChatId = chatId;
            app.rerender();
        },
        deleteChat(chatId) {
            if (!confirm('Are you sure you want to delete this chat?')) return;

            state.chats = state.chats.filter(c => c.id !== chatId);
            if (state.activeChatId === chatId) {
                state.activeChatId = state.chats.length > 0 ? state.chats[0].id : null;
            }

            if (state.chats.length === 0) this.createNewChat();
            else this.rerender();
        },
        renameChat(chatId) {
            const chat = state.chats.find(c => c.id === chatId);
            if (!chat) return;
            const newTitle = prompt('Enter a new title for the chat:', chat.title);
            if (newTitle) {
                chat.title = newTitle;
                this.rerender();
            }
        },
        toggleTheme() {
            state.theme = state.theme === 'light' ? 'dark' : 'light';
            ui.applyTheme();
            storage.saveState();
        },
        saveApiKey() {
            const newApiKey = dom.apiKeyInput.value.trim();
            if (newApiKey) {
                const currentModelConfig = MODELS[state.model];
                state.apiKeys[currentModelConfig.apiKeyName] = newApiKey;
                storage.saveState();
                ui.hideApiKeyModal();
                ui.updateApiKeyStatus();
                ui.updateSendButton();
            }
        },
        handleModelChange(newModel) {
            state.model = newModel;
            ui.updateModelSelector();
            ui.updateApiKeyStatus();
            ui.updateSendButton();
            storage.saveState();

            const currentModelConfig = MODELS[state.model];
            if (!state.apiKeys[currentModelConfig.apiKeyName]) {
                ui.showApiKeyModal();
            }
        },
        rerender() {
            ui.renderChatHistory();
            ui.renderMessages();
            ui.updateSendButton();
            ui.updateApiKeyStatus();
        },
        rerenderChatHistory() {
            ui.renderChatHistory();
        }
    };

    app.init();

    if (window.marked && window.hljs) {
        marked.setOptions({
            renderer: new marked.Renderer(),
            highlight: function (code, lang) {
                const language = hljs.getLanguage(lang) ? lang : 'plaintext';
                return hljs.highlight(code, { language }).value;
            },
            langPrefix: 'hljs language-',
            gfm: true,
            breaks: true,
        });
    }
});