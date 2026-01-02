/**
 * Chat Module - ES6 Module Version
 */

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

    addMessage(content, isUser = false) {
        if (!content || content.trim() === '') return null;

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user' : 'bot'}`;
        messageDiv.innerHTML = `<div class="message-content">${this.escapeHtml(content)}</div>`;
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
        return messageDiv;
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

    async sendMessage() {
        const message = this.chatInput.value.trim();
        if (!message || this.isProcessing) return;

        this.isProcessing = true;
        this.sendBtn.disabled = true;
        this.chatInput.value = '';

        this.addMessage(message, true);
        this.history.push({ role: 'user', content: message });

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

// Auto-inicializar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.chatApp = new ChatApp();
    });
} else {
    window.chatApp = new ChatApp();
}

export { ChatApp };
