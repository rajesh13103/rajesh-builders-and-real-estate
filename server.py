from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
from contextlib import asynccontextmanager


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic can go here if needed
    yield
    # Shutdown logic replacing deprecated on_event
    client.close()


app = FastAPI(title="Aurum Estates API", lifespan=lifespan)
api_router = APIRouter(prefix="/api")


# ---------- Models ----------
class ContactSubmissionCreate(BaseModel):
    name: str
    phone: str
    email: str
    service: Optional[str] = None
    message: str


class ContactSubmission(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    phone: str
    email: str
    service: Optional[str] = None
    message: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ---------- Routes ----------
@api_router.get("/")
async def root():
    return {"message": "Aurum Estates API", "status": "ok"}


@api_router.get("/health")
async def health():
    return {"status": "ok", "time": datetime.now(timezone.utc).isoformat()}


@api_router.post("/contact", response_model=ContactSubmission)
async def create_contact(payload: ContactSubmissionCreate):
    name = payload.name.strip()
    if len(name) < 2:
        raise HTTPException(status_code=400, detail="Name is too short")
    phone = ''.join(ch for ch in payload.phone if ch.isdigit() or ch == '+')
    if len(phone) < 7:
        raise HTTPException(status_code=400, detail="Invalid phone")
    if '@' not in payload.email or '.' not in payload.email:
        raise HTTPException(status_code=400, detail="Invalid email")
    if len(payload.message.strip()) < 5:
        raise HTTPException(status_code=400, detail="Message is too short")

    submission = ContactSubmission(
        name=name,
        phone=phone,
        email=payload.email.strip().lower(),
        service=payload.service,
        message=payload.message.strip(),
    )
    doc = submission.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.contact_submissions.insert_one(doc)
    return submission


@api_router.get("/contact", response_model=List[ContactSubmission])
async def list_contacts():
    rows = await db.contact_submissions.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    for r in rows:
        if isinstance(r.get('created_at'), str):
            r['created_at'] = datetime.fromisoformat(r['created_at'])
    return rows


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)