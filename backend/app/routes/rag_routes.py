from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import List
import os
from app.services.rag import extract_and_index

rag_router = APIRouter(prefix="/api/rag", tags=["rag"])

@rag_router.post("/index_files")
async def index_files(
    assistant_id: int = Form(...),
    user_id: int = Form(...),
    files: List[UploadFile] = File(...)
):
    """
    form-data:
      - assistant_id (int)
      - user_id      (int)
      - files        (one or more: pdf, txt, etc.)
    """
    # 1) Validate IDs
    if not assistant_id or not user_id:
        raise HTTPException(status_code=400, detail="assistant_id & user_id required")

    # 2) Gather uploaded docs
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded")

    docs: List[str | bytes] = []
    for file in files:
        if not file.filename:
            continue
            
        # Secure filename (basic implementation)
        filename = os.path.basename(file.filename)
        ext = filename.rsplit(".", 1)[-1].lower()
        raw = await file.read()
        
        if ext == "pdf":
            docs.append(raw)  # bytes → PDF extractor will be invoked
        elif ext in ("txt", "md", "text"):
            docs.append(raw.decode("utf-8", errors="ignore"))
        else:
            # skip unknown types (or add Word, HTML, etc. here)
            continue

    if not docs:
        raise HTTPException(status_code=400, detail="No supported files uploaded")

    # 3) Extract, chunk, embed & index
    result = extract_and_index(assistant_id, user_id, docs)
    return result
