from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from fastapi.middleware.cors import CORSMiddleware

from sqlalchemy.orm import Session

from jose import JWTError, jwt
import json

# DB
from database import engine, Base, SessionLocal

# Models
from models import user, technique, technique_step, target_angle

# Routers
from routers import auth
from routers import technique as technique_router

# Services
from services.angle_service import compare_angles

# Security
from utils.security import SECRET_KEY, ALGORITHM


# -----------------------------
# INIT APP
# -----------------------------
app = FastAPI(title="AI Martial Platform")

# Create DB tables
Base.metadata.create_all(bind=engine)


# -----------------------------
# CORS (Frontend Connection)
# -----------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -----------------------------
# ROUTERS
# -----------------------------
app.include_router(auth.router)
app.include_router(technique_router.router)


# -----------------------------
# AUTH
# -----------------------------
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# -----------------------------
# ROOT
# -----------------------------
@app.get("/")
def root():
    return {"message": "AI Martial Platform Running"}


# -----------------------------
# PROTECTED TEST
# -----------------------------
@app.get("/protected")
def protected_route(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        return {"message": f"Hello {email}"}
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


# -----------------------------
# WEBSOCKET (JWT PROTECTED)
# -----------------------------
@app.websocket("/ws/train")
async def train(websocket: WebSocket):
    token = websocket.query_params.get("token")

    # ❌ No token → reject
    if not token:
        await websocket.close()
        return

    # 🔐 Verify JWT
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
    except JWTError:
        await websocket.close()
        return

    await websocket.accept()

    db = SessionLocal()

    try:
        while True:
            data = await websocket.receive_text()
            parsed = json.loads(data)

            step_id = parsed.get("step_id")
            live_angles = parsed.get("angles", {})

            # 🧠 Compare angles
            result = compare_angles(db, step_id, live_angles)

            await websocket.send_text(json.dumps(result))

    except WebSocketDisconnect:
        print(f"{email} disconnected")
    finally:
        db.close()

from models.target_angle import TargetAngle

@app.get("/steps/{step_id}/angles")
def get_angles(step_id: int, db: Session = Depends(get_db)):
    angles = db.query(TargetAngle).filter(
        TargetAngle.step_id == step_id
    ).all()

    return [
        {
            "body_part": a.body_part,
            "min": a.min_angle,
            "max": a.max_angle
        }
        for a in angles
    ]