---
title: OpenAda
emoji: 🤖
colorFrom: indigo
colorTo: purple
sdk: docker
app_file: app.py
pinned: false
---

# OpenAda - 3D Avatar Chat Backend

Backend para o sistema de chat com avatar 3D falante.

## Tech Stack
- **FastAPI** - API REST
- **OpenRouter** - LLM para respostas
- **Edge TTS** - Síntese de voz (pt-BR-FranciscaNeural)

## API Endpoints

### GET /
Health check básico.

### GET /health
Status de saúde da API.

### POST /chat
Processa mensagem e retorna resposta com áudio.

**Request:**
```json
{
  "message": "Olá, como você está?",
  "history": []
}
```

**Response:**
```json
{
  "text": "Olá! Estou muito bem, obrigada por perguntar!",
  "audio_base64": "//uQxAAAAAANIAAAAAExBTUUzLjEwMFVV...",
  "visemes": [
    {"time": 0.0, "viseme": "O", "duration": 0.065}
  ],
  "duration": 3.2
}
```

## Configuração

Configure o secret `OPENROUTER_API_KEY` nas configurações do Space.

Variáveis de ambiente opcionais:
- `OPENROUTER_MODEL` - Modelo a usar (default: `google/gemini-2.0-flash-001`)
