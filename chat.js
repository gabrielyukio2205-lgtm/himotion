/**
 * Chat Module - Handles communication with backend and lip sync
 */

class ChatApp {
    constructor() {
        // Backend URL - HuggingFace Space
        this.backendUrl = 'https://madras1-openada.hf.space';

        this.history = [];
        this.isProcessing = false;
        this.avatar = null;
        this.audioPlayer = null;
        this.visemeTimeline = [];
        this.visemeIndex = 0;
        this.audioStartTime = 0;

        this.init();
    }

    init() {
        // Initialize avatar
        const avatarContainer = document.getElementById('avatar-container');
        this.avatar = new Avatar3D(avatarContainer);

        // Get DOM elements
        this.chatMessages = document.getElementById('chat-messages');
        this.chatInput = document.getElementById('chat-input');
        this.sendBtn = document.getElementById('send-btn');
        this.statusText = document.getElementById('status-text');
        this.audioPlayer = document.getElementById('audio-player');

        // Event listeners
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Audio events
        this.audioPlayer.addEventListener('play', () => this.onAudioPlay());
        this.audioPlayer.addEventListener('ended', () => this.onAudioEnded());
        this.audioPlayer.addEventListener('timeupdate', () => this.syncLipSync());
    }

    setStatus(text) {
        this.statusText.textContent = text;
    }

    addMessage(content, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user' : 'bot'}`;
        messageDiv.innerHTML = `<div class="message-content">${this.escapeHtml(content)}</div>`;
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
        return messageDiv;
    }

    addTypingIndicator() {
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

        // Add user message
        this.addMessage(message, true);
        this.history.push({ role: 'user', content: message });

        // Show typing indicator
        this.addTypingIndicator();
        this.setStatus('Pensando...');

        try {
            const response = await fetch(`${this.backendUrl}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: message,
                    history: this.history.slice(-10)
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Erro na API');
            }

            const data = await response.json();

            // Remove typing indicator
            this.removeTypingIndicator();

            // Add bot message
            this.addMessage(data.text);
            this.history.push({ role: 'assistant', content: data.text });

            // Setup lip sync
            this.visemeTimeline = data.visemes;
            this.visemeIndex = 0;

            // Play audio
            this.setStatus('Falando...');
            this.audioPlayer.src = `data:audio/mp3;base64,${data.audio_base64}`;
            this.audioPlayer.play();

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
        this.audioStartTime = performance.now();
        this.visemeIndex = 0;
    }

    onAudioEnded() {
        this.avatar.setViseme('X');
        this.setStatus('Pronta para conversar');
    }

    syncLipSync() {
        if (!this.visemeTimeline.length) return;

        const currentTime = this.audioPlayer.currentTime;

        // Find current viseme based on audio time
        let currentViseme = 'X';

        for (let i = 0; i < this.visemeTimeline.length; i++) {
            const v = this.visemeTimeline[i];
            const endTime = v.time + v.duration;

            if (currentTime >= v.time && currentTime < endTime) {
                currentViseme = v.viseme;
                break;
            }
        }

        this.avatar.setViseme(currentViseme);
    }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    window.chatApp = new ChatApp();
});
