from fastapi import APIRouter

from app.api.endpoints import design, llm

api_router = APIRouter()

# Include endpoint modules
api_router.include_router(design.router, prefix="/design", tags=["Design Stages"])
api_router.include_router(llm.router, prefix="/llm", tags=["LLM Services"])
