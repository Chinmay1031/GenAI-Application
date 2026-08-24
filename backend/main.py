from fastapi import FastAPI, Request, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from openai import OpenAI
from dotenv import load_dotenv
import os
import base64
import json

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://gen-ai-application-sepia.vercel.app",
        "http://localhost:5173",],  # TEMPORARY — replace with real Vercel URL once deployed
    allow_methods=["*"],
    allow_headers=["*"],
)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

SYSTEM_PROMPT = (
    "You are GenAI App, a helpful assistant built as a student portfolio project. "
    "You can hold normal conversations and analyze images the user uploads. "
    "Be concise, clear, and honest — if you're unsure about something, say so rather than guessing."
)

@app.get("/")
def home():
    return {"message": "Backend is running!"}

def stream_completion(messages):
    stream = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,
        stream=True,
    )
    for chunk in stream:
        delta = chunk.choices[0].delta.content
        if delta:
            yield delta


@app.post("/chat")
async def chat(request: Request):
    data = await request.json()
    user_input = data.get("prompt", "")
    history = data.get("history", [])  # [{role, content}, ...] from the frontend

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    messages.extend(history)
    messages.append({"role": "user", "content": user_input})

    return StreamingResponse(stream_completion(messages), media_type="text/plain")

@app.post("/chat-with-image")
async def chat_with_image(
    prompt: str = Form(...),
    image: UploadFile = File(...),
    history: str = Form("[]"),  # JSON string, since multipart can't send raw JSON
):
    image_bytes = await image.read()
    base64_image = base64.b64encode(image_bytes).decode("utf-8")
    data_url = f"data:{image.content_type};base64,{base64_image}"

    try:
        parsed_history = json.loads(history)
    except json.JSONDecodeError:
        parsed_history = []

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    messages.extend(parsed_history)
    messages.append({
        "role": "user",
        "content": [
            {"type": "text", "text": prompt},
            {"type": "image_url", "image_url": {"url": data_url}},
        ],
    })

    return StreamingResponse(stream_completion(messages), media_type="text/plain")