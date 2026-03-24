from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError, jwt
import json

from database import engine, Base, SessionLocal
from models import user, technique, technique_step, target_angle
from routers import auth
from services.angle_service import compare_angles
from utils.security import SECRET_KEY, ALGORITHM

from fastapi.middleware.cors import CORSMiddleware

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI Martial Platform")

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

# Include auth routes
app.include_router(auth.router)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")


# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/")
def root():
    return {"message": "AI Martial Platform Running"}


# Protected test route
@app.get("/protected")
def protected_route(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        return {"message": f"Hello {email}"}
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


# WebSocket training endpoint
from jose import JWTError, jwt
from utils.security import SECRET_KEY, ALGORITHM

@app.websocket("/ws/train")
async def train(websocket: WebSocket):
    token = websocket.query_params.get("token")

    if not token:
        await websocket.close()
        return

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

            step_id = parsed["step_id"]
            live_angles = parsed["angles"]

            result = compare_angles(db, step_id, live_angles)

            await websocket.send_text(json.dumps(result))

    except WebSocketDisconnect:
        print(f"{email} disconnected")
    finally:
        db.close()

        
from models.technique import Technique
from models.technique_step import TechniqueStep
from models.target_angle import TargetAngle
from database import SessionLocal


@app.post("/seed-techniques")
def seed_techniques():
    db = SessionLocal()

    # Clear existing (optional for dev)
    db.query(TargetAngle).delete()
    db.query(TechniqueStep).delete()
    db.query(Technique).delete()
    db.commit()

    # -------------------
    # FRONT KICK
    # -------------------
    front_kick = Technique(
        name="Front Kick",
        description="Basic forward kick"
    )
    db.add(front_kick)
    db.commit()
    db.refresh(front_kick)

    fk_step1 = TechniqueStep(
        technique_id=front_kick.id,
        step_number=1,
        step_name="Chamber"
    )
    db.add(fk_step1)
    db.commit()
    db.refresh(fk_step1)

    db.add(TargetAngle(
        step_id=fk_step1.id,
        body_part="knee_right",
        min_angle=60,
        max_angle=90
    ))

    fk_step2 = TechniqueStep(
        technique_id=front_kick.id,
        step_number=2,
        step_name="Extension"
    )
    db.add(fk_step2)
    db.commit()
    db.refresh(fk_step2)

    db.add(TargetAngle(
        step_id=fk_step2.id,
        body_part="knee_right",
        min_angle=160,
        max_angle=180
    ))

    # -------------------
    # JAB
    # -------------------
    jab = Technique(
        name="Jab",
        description="Basic straight punch"
    )
    db.add(jab)
    db.commit()
    db.refresh(jab)

    jab_step1 = TechniqueStep(
        technique_id=jab.id,
        step_number=1,
        step_name="Guard Position"
    )
    db.add(jab_step1)
    db.commit()
    db.refresh(jab_step1)

    db.add(TargetAngle(
        step_id=jab_step1.id,
        body_part="elbow_right",
        min_angle=70,
        max_angle=110
    ))

    jab_step2 = TechniqueStep(
        technique_id=jab.id,
        step_number=2,
        step_name="Full Extension"
    )
    db.add(jab_step2)
    db.commit()
    db.refresh(jab_step2)

    db.add(TargetAngle(
        step_id=jab_step2.id,
        body_part="elbow_right",
        min_angle=160,
        max_angle=180
    ))

    db.commit()
    db.close()

    return {"message": "Techniques seeded successfully"}


@app.get("/techniques")
def get_techniques():
    db = SessionLocal()
    techniques = db.query(Technique).all()

    result = []
    for t in techniques:
        result.append({
            "id": t.id,
            "name": t.name,
            "description": t.description
        })

    db.close()
    return result


@app.get("/techniques/{technique_id}/steps")
def get_steps(technique_id: int):
    db = SessionLocal()
    steps = db.query(TechniqueStep).filter(
        TechniqueStep.technique_id == technique_id
    ).order_by(TechniqueStep.step_number).all()

    result = []
    for s in steps:
        result.append({
            "id": s.id,
            "step_number": s.step_number,
            "step_name": s.step_name
        })

    db.close()
    return result