from fastapi import APIRouter

router = APIRouter()

@router.post("/api/auth/login")
async def login():
    # Stub for JWT logic
    return {"access_token": "mock_token", "token_type": "bearer"}
