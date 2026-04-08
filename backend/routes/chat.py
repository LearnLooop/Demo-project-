from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List
import os
import google.generativeai as genai

from utils.auth import get_current_user

router = APIRouter()

# Initialize Gemini SDK
api_key = os.environ.get("GEMINI_API_KEY")
if api_key and api_key != "your_api_key_here":
    genai.configure(api_key=api_key)

class ChatMessage(BaseModel):
    role: str
    content: str
    id: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]

@router.post("/assistant")
async def chat_assistant(
    request: ChatRequest,
    current_user = Depends(get_current_user)
):
    if not api_key or api_key == "your_api_key_here":
        # Mock response if API key is not configured, to let the application run smoothly
        return {"content": "Gemini API key is not configured. This is a mock response from the backend. The true adaptive engine awaits your configuration."}
        
    try:
        model = genai.GenerativeModel("gemini-2.5-flash")
        
        # Build prompt from History
        history_prompt = f"User is acting as a {current_user.role}. You are the CourseWeaver AI Assistant helping the {current_user.role}.\n\n"
        for msg in request.messages:
            history_prompt += f"{msg.role.upper()}: {msg.content}\n"
            
        history_prompt += "ASSISTANT: "
        
        response = model.generate_content(history_prompt)
        return {"content": response.text}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
