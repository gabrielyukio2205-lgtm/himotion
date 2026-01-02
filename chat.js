/**
 * Chat Module - ES6 Module Version
 * Com persistência de histórico e triggers de gestos
 */

const STORAGE_KEY = 'avatar_chat_history';
const MAX_STORED_MESSAGES = 100;

class ChatApp {
    constructor() {
        this.backendUrl = 'https://madras1-openada.hf.space';

        this.history = [];
        this.isProcessing = false;
        this.audioPlayer = null;
        this.visemeTimeline = [];

        this.init();
    }

    init() {
        this.chatMessages = document.getElementById('chat-messages');
        this.chatInput = document.getElementById('chat-input');
        this.sendBtn = document.getElementById('send-btn');
        this.statusText = document.getElementById('status-text');
        this.audioPlayer = document.getElementById('audio-player');

        // Carregar histórico salvo
        this.loadHistory();

        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        this.audioPlayer.addEventListener('play', () => this.onAudioPlay());
        this.audioPlayer.addEventListener('ended', () => this.onAudioEnded());
        this.audioPlayer.addEventListener('error', (e) => {
            console.error('Audio error:', e);
            this.setStatus('Erro no áudio');
        });

        this.startLipSyncLoop();
    }

    // =========================================================================
    // Persistência de Histórico
    // =========================================================================

    loadHistory() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const data = JSON.parse(saved);
                this.history = data.history || [];

                // Renderizar mensagens salvas
                for (const msg of this.history) {
                    this.addMessageToDOM(msg.content, msg.role === 'user');
                }

                console.log(`Histórico carregado: ${this.history.length} mensagens`);
            }
        } catch (e) {
            console.error('Erro ao carregar histórico:', e);
            this.history = [];
        }
    }

    saveHistory() {
        try {
            // Limitar quantidade de mensagens
            const toSave = this.history.slice(-MAX_STORED_MESSAGES);
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                history: toSave,
                savedAt: new Date().toISOString()
            }));
        } catch (e) {
            console.error('Erro ao salvar histórico:', e);
        }
    }

    clearHistory() {
        this.history = [];
        localStorage.removeItem(STORAGE_KEY);

        // Limpar DOM exceto mensagem inicial
        while (this.chatMessages.children.length > 1) {
            this.chatMessages.removeChild(this.chatMessages.lastChild);
        }

        console.log('Histórico limpo');
    }

    // =========================================================================
    // Triggers de Gestos
    // =========================================================================

    checkGestureTriggers(text) {
        const lowerText = text.toLowerCase();

        // Saudações - Avatar acena
        if (/\b(oi|olá|ola|hey|hello|hi|bom dia|boa tarde|boa noite)\b/.test(lowerText)) {
            this.triggerGesture('wave');
        }

        // Despedidas - Avatar se despede
        if (/\b(tchau|adeus|até|ate|bye|goodbye|xau)\b/.test(lowerText)) {
            this.triggerGesture('goodbye');
        }

        // Concordância - Avatar acena com cabeça
        if (/\b(sim|claro|certo|ok|entendi|entendido|combinado)\b/.test(lowerText)) {
            this.triggerGesture('nod');
        }
    }

    triggerGesture(gesture) {
        if (window.avatar && typeof window.avatar.playGesture === 'function') {
            window.avatar.playGesture(gesture);
        }
    }

    // =========================================================================
    // UI
    // =========================================================================

    startLipSyncLoop() {
        const syncLoop = () => {
            if (this.audioPlayer && !this.audioPlayer.paused && this.visemeTimeline.length > 0) {
                this.syncLipSync();
            }
            requestAnimationFrame(syncLoop);
        };
        syncLoop();
    }

    setStatus(text) {
        this.statusText.textContent = text;
    }

    addMessageToDOM(content, isUser = false) {
        if (!content || content.trim() === '') return null;

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user' : 'bot'}`;
        messageDiv.innerHTML = `<div class="message-content">${this.escapeHtml(content)}</div>`;
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
        return messageDiv;
    }

    addMessage(content, isUser = false) {
        return this.addMessageToDOM(content, isUser);
    }

    addTypingIndicator() {
        this.removeTypingIndicator();

        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot typing';
        messageDiv.id = 'typing-indicator';
        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        `;
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    removeTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) indicator.remove();
    }

    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // =========================================================================
    // Enviar Mensagem
    // =========================================================================

    async sendMessage() {
        const message = this.chatInput.value.trim();
        if (!message || this.isProcessing) return;

        this.isProcessing = true;
        this.sendBtn.disabled = true;
        this.chatInput.value = '';

        this.addMessage(message, true);
        this.history.push({ role: 'user', content: message });
        this.saveHistory();

        // Verificar triggers de gestos na mensagem do usuário
        this.checkGestureTriggers(message);

        this.addTypingIndicator();
        this.setStatus('Pensando...');

        try {
            const response = await fetch(`${this.backendUrl}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: message,
                    history: this.history.slice(-10)
                })
            });

            if (!response.ok) {
                let errorMsg = 'Erro na API';
                try {
                    const error = await response.json();
                    errorMsg = error.detail || errorMsg;
                } catch (e) {
                    errorMsg = `HTTP ${response.status}`;
                }
                throw new Error(errorMsg);
            }

            const data = await response.json();

            this.removeTypingIndicator();

            if (data.text && data.text.trim() !== '') {
                this.addMessage(data.text);
                this.history.push({ role: 'assistant', content: data.text });
                this.saveHistory();

                // Verificar triggers de gestos na resposta do bot
                this.checkGestureTriggers(data.text);

                this.visemeTimeline = data.visemes || [];

                if (data.audio_base64) {
                    this.setStatus('Falando...');
                    this.audioPlayer.src = `data:audio/mp3;base64,${data.audio_base64}`;

                    try {
                        await this.audioPlayer.play();
                    } catch (playError) {
                        console.error('Erro ao reproduzir áudio:', playError);
                        this.setStatus('Pronta para conversar');
                    }
                } else {
                    this.setStatus('Pronta para conversar');
                }
            } else {
                throw new Error('Resposta vazia do servidor');
            }

        } catch (error) {
            console.error('Chat error:', error);
            this.removeTypingIndicator();
            this.addMessage(`Desculpe, ocorreu um erro: ${error.message}`);
            this.setStatus('Erro - tente novamente');
        }

        this.isProcessing = false;
        this.sendBtn.disabled = false;
        this.chatInput.focus();
    }

    onAudioPlay() {
        // Audio started
    }

    onAudioEnded() {
        if (window.avatar) {
            window.avatar.setViseme('X');
        }
        this.visemeTimeline = [];
        this.setStatus('Pronta para conversar');
    }

    syncLipSync() {
        if (!this.visemeTimeline.length || !window.avatar) return;

        const currentTime = this.audioPlayer.currentTime;
        let currentViseme = 'X';

        for (let i = 0; i < this.visemeTimeline.length; i++) {
            const v = this.visemeTimeline[i];
            const endTime = v.time + v.duration;

            if (currentTime >= v.time && currentTime < endTime) {
                currentViseme = v.viseme;
                break;
            }
        }

        window.avatar.setViseme(currentViseme);
    }
}

// Expor função de limpar histórico globalmente
window.clearChatHistory = () => {
    if (window.chatApp) {
        window.chatApp.clearHistory();
    }
};

// Auto-inicializar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.chatApp = new ChatApp();
    });
} else {
    window.chatApp = new ChatApp();
}

export { ChatApp };
