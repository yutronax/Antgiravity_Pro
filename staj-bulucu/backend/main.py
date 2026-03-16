import asyncio
import sys

if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI(title="Staj Bulucu API")

# CORS ayarları - Frontend'in API'ye erişebilmesi için gerekli
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Internship(BaseModel):
    id: Optional[int] = None
    title: str
    company: str
    location: str
    link: str
    platform: str
    description: Optional[str] = None

@app.get("/")
def read_root():
    return {"message": "Staj Bulucu API is running"}

from scraper_engine import scrape_all

@app.get("/internships", response_model=List[Internship])
async def get_internships(keyword: str = "staj"):
    results = await scrape_all(keyword)
    return results

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
