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
from models.target_angle import TargetAngle

# Routers
from routers import auth
from routers import technique as technique_router

# Agents 🔥
from agents.orchestrator import run_agents

# Security
from utils.security import SECRET_KEY, ALGORITHM


# -----------------------------
# INIT APP
# -----------------------------
app = FastAPI(title="AI Martial Platform")

Base.metadata.create_all(bind=engine)


# -----------------------------
# CORS
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
    return {"message": "AI Martial Platform Running 🚀"}


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
# GET ANGLES FOR STEP
# -----------------------------
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


# -----------------------------
# WEBSOCKET (AGENT ENABLED)
# -----------------------------
@app.websocket("/ws/train")
async def train(websocket: WebSocket):

    await websocket.accept()  # ✅ ALWAYS FIRST

    token = websocket.query_params.get("token")

    if not token:
        await websocket.close()
        return

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
    except Exception as e:
        print("JWT ERROR:", e)
        await websocket.close()
        return

    db = SessionLocal()

    try:
        while True:
            try:
                data = await websocket.receive_text()
            except:
                break  # 🔥 client disconnected safely

            parsed = json.loads(data)

            step_id = parsed.get("step_id")
            live_angles = parsed.get("angles", {})

            db_angles = db.query(TargetAngle).filter(
                TargetAngle.step_id == step_id
            ).all()

            targets = [
                {
                    "body_part": a.body_part,
                    "min": a.min_angle,
                    "max": a.max_angle
                }
                for a in db_angles
            ]

            agent_result = run_agents(live_angles, targets)

            correct = sum(
                1 for a in agent_result["analysis"] if a["status"] == "good"
            )
            total = len(agent_result["analysis"]) or 1
            accuracy = int((correct / total) * 100)

            try:
                await websocket.send_text(json.dumps({
                    "accuracy": accuracy,
                    "feedback": agent_result["feedback"],
                    "analysis": agent_result["analysis"],
                    "audio": agent_result["audio"]
                }))
            except:
                break  # 🔥 prevent crash

    finally:
        db.close()