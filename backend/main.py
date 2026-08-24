from fastapi import FastAPI, Request, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from dotenv import load_dotenv
import os
import base64

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

@app.get("/")
def home():
    return {"message": "Backend is running!"}

@app.post("/chat")
async def chat(request: Request):
    data = await request.json()
    user_input = data.get("prompt", "")

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": user_input}]
    )

    return {"response": response.choices[0].message.content}

@app.post("/chat-with-image")
async def chat_with_image(prompt: str = Form(...), image: UploadFile = File(...)):
    # Read the uploaded image bytes and encode as base64
    image_bytes = await image.read()
    base64_image = base64.b64encode(image_bytes).decode("utf-8")

    # Build the data URL GPT-4o-mini expects
    data_url = f"data:{image.content_type};base64,{base64_image}"

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": data_url}},
                ],
            }
        ],
    )

    return {"response": response.choices[0].message.content}