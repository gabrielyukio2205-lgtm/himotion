"""
3D Avatar Chat Backend (v2 - Fixed)
FastAPI + OpenRouter + Edge TTS
Deploy: HuggingFace Spaces
"""

import os
import base64
import re
from io import BytesIO
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import edge_tts
import httpx

# ============================================================================
# Configuration
# ============================================================================

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "google/gemini-2.0-flash-001")
TTS_VOICE = "pt-BR-FranciscaNeural"
TTS_RATE = "+0%"

# System prompt for the chatbot
SYSTEM_PROMPT = """Você é Ada, uma assistente virtual amigável e prestativa. 
Responda de forma natural, concisa e conversacional em português brasileiro.
Mantenha respostas curtas (máximo 2-3 frases) para manter a conversa fluida.
Seja simpática e use tom casual."""

# ============================================================================
# Phoneme to Viseme Mapping
# ============================================================================

VISEME_MAP = {
    'a': 'A', 'á': 'A', 'à': 'A', 'ã': 'A', 'â': 'A',
    'e': 'E', 'é': 'E', 'ê': 'E',
    'i': 'I', 'í': 'I',
    'o': 'O', 'ó': 'O', 'ô': 'O', 'õ': 'O',
    'u': 'U', 'ú': 'U',
    'm': 'M', 'b': 'M', 'p': 'M',
    'f': 'F', 'v': 'F',
    'l': 'L', 'n': 'L', 't': 'L', 'd': 'L',
    's': 'S', 'z': 'S', 'c': 'S', 'ç': 'S',
    'r': 'R', 'x': 'S', 'j': 'S', 'g': 'L', 'q': 'L', 'k': 'L',
    'h': 'X', ' ': 'X',
}

CHAR_DURATION = 0.065


def text_to_visemes(text: str) -> list[dict]:
    """Convert text to a timeline of visemes."""
    visemes = []
    current_time = 0.0
    text_lower = text.lower()
    
    i = 0
    while i < len(text_lower):
        char = text_lower[i]
        
        if char in '.,!?;:':
            visemes.append({
                'time': current_time,
                'viseme': 'X',
                'duration': 0.15
            })
            current_time += 0.15
            i += 1
            continue
        
        viseme = VISEME_MAP.get(char, 'X')
        
        if visemes and visemes[-1]['viseme'] == viseme:
            visemes[-1]['duration'] += CHAR_DURATION
        else:
            visemes.append({
                'time': current_time,
                'viseme': viseme,
                'duration': CHAR_DURATION
            })
        
        current_time += CHAR_DURATION
        i += 1
    
    visemes.append({
        'time': current_time,
        'viseme': 'X',
        'duration': 0.2
    })
    
    return visemes


# ============================================================================
# FastAPI App
# ============================================================================

app = FastAPI(title="3D Avatar Chat API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str
    history: list[dict] = []


class ChatResponse(BaseModel):
    text: str
    audio_base64: str
    visemes: list[dict]
    duration: float


@app.get("/")
async def root():
    return {"status": "ok", "message": "3D Avatar Chat API v2"}


@app.get("/health")
async def health():
    has_key = bool(OPENROUTER_API_KEY)
    return {"status": "healthy", "has_api_key": has_key, "model": OPENROUTER_MODEL}


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Process chat message and return response with audio."""
    
    # Validar API key
    if not OPENROUTER_API_KEY:
        raise HTTPException(
            status_code=500, 
            detail="OPENROUTER_API_KEY não configurada. Configure nas secrets do Space."
        )
    
    # Validar mensagem
    if not request.message or not request.message.strip():
        raise HTTPException(status_code=400, detail="Mensagem vazia")
    
    # Build messages
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    
    for msg in request.history[-10:]:
        role = msg.get("role", "user")
        content = msg.get("content", "")
        if role in ["user", "assistant"] and content:
            messages.append({"role": role, "content": content})
    
    messages.append({"role": "user", "content": request.message})
    
    # Call OpenRouter
    bot_text = ""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://huggingface.co/spaces",
                    "X-Title": "OpenAda Avatar Chat"
                },
                json={
                    "model": OPENROUTER_MODEL,
                    "messages": messages,
                    "max_tokens": 200,
                    "temperature": 0.7,
                }
            )
            
            # Log para debug
            print(f"OpenRouter status: {response.status_code}")
            
            if response.status_code != 200:
                error_text = response.text
                print(f"OpenRouter error: {error_text}")
                raise HTTPException(
                    status_code=500, 
                    detail=f"OpenRouter retornou {response.status_code}: {error_text[:200]}"
                )
            
            data = response.json()
            print(f"OpenRouter response: {data}")
            
            # Extrair texto da resposta
            if "choices" in data and len(data["choices"]) > 0:
                choice = data["choices"][0]
                if "message" in choice and "content" in choice["message"]:
                    bot_text = choice["message"]["content"]
                elif "text" in choice:
                    bot_text = choice["text"]
            
            # Fallback se não encontrou texto
            if not bot_text:
                print(f"Não encontrou texto na resposta: {data}")
                bot_text = "Desculpe, não consegui processar sua mensagem."
                
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Timeout ao conectar com OpenRouter")
    except httpx.HTTPError as e:
        print(f"HTTP Error: {e}")
        raise HTTPException(status_code=500, detail=f"Erro de conexão: {str(e)}")
    except Exception as e:
        print(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail=f"Erro inesperado: {str(e)}")
    
    # Limpar texto
    bot_text = bot_text.strip()
    if not bot_text:
        bot_text = "Hmm, não entendi. Pode reformular?"
    
    # Limpar para TTS
    clean_text = re.sub(r'[*_`~#]', '', bot_text)
    clean_text = re.sub(r'\[.*?\]\(.*?\)', '', clean_text)
    clean_text = re.sub(r'<[^>]+>', '', clean_text)
    clean_text = clean_text.strip()
    
    if not clean_text:
        clean_text = bot_text
    
    # Generate audio
    audio_base64 = ""
    try:
        communicate = edge_tts.Communicate(clean_text, TTS_VOICE, rate=TTS_RATE)
        audio_buffer = BytesIO()
        
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_buffer.write(chunk["data"])
        
        audio_buffer.seek(0)
        audio_data = audio_buffer.read()
        
        if len(audio_data) > 0:
            audio_base64 = base64.b64encode(audio_data).decode('utf-8')
        else:
            print("TTS retornou áudio vazio")
            
    except Exception as e:
        print(f"TTS error: {e}")
        # Continua sem áudio
    
    # Generate visemes
    visemes = text_to_visemes(clean_text)
    duration = sum(v['duration'] for v in visemes)
    
    return ChatResponse(
        text=bot_text,
        audio_base64=audio_base64,
        visemes=visemes,
        duration=duration
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=7860)
