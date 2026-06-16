"""
FastAPI mikroserwis — predykcja czasu zadania na podstawie danych biometrycznych.
Uruchom: uvicorn main:app --reload --port 8000
"""
import os
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import torch
import torch.nn as nn
import numpy as np
import joblib
from pathlib import Path

app = FastAPI(title="OmniBrain DeepScheduler", version="1.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

BASE  = Path(__file__).parent.parent / "model"

class TaskDurationNet(nn.Module):
    def __init__(self):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(6, 64), nn.ReLU(), nn.Dropout(0.2),
            nn.Linear(64, 32), nn.ReLU(), nn.Linear(32, 1),
        )
    def forward(self, x):
        return self.net(x)

model = TaskDurationNet()
model.load_state_dict(torch.load(BASE / "model.pt", map_location="cpu", weights_only=True))
model.eval()

scaler_X = joblib.load(BASE / "scaler_X.pkl")
scaler_y = joblib.load(BASE / "scaler_y.pkl")
le       = joblib.load(BASE / "label_encoder.pkl")

TASK_MAP = {
    "programming": "programming", "meeting": "meeting",
    "admin": "admin", "creative": "creative", "planning": "planning",
}


class PredictRequest(BaseModel):
    task_type: str = "admin"
    sleep_hours: float = 7.0
    energy_level: int = 7
    day_of_week: int = 0        # 0 = poniedziałek
    hour_of_day: int = 10
    description_len: int = 50


class PredictResponse(BaseModel):
    estimated_minutes: int
    estimated_hours: float
    task_type_used: str
    context: dict


@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    task = TASK_MAP.get(req.task_type, "admin")
    task_enc = int(le.transform([task])[0])

    X = np.array([[task_enc, req.sleep_hours, req.energy_level,
                   req.day_of_week, req.hour_of_day, req.description_len]], dtype=np.float32)
    X_scaled = scaler_X.transform(X)

    with torch.no_grad():
        pred = model(torch.FloatTensor(X_scaled))

    minutes = int(scaler_y.inverse_transform(pred.numpy())[0][0])
    minutes = max(5, min(480, minutes))

    return PredictResponse(
        estimated_minutes=minutes,
        estimated_hours=round(minutes / 60, 1),
        task_type_used=task,
        context={"sleep_hours": req.sleep_hours, "energy_level": req.energy_level},
    )


@app.get("/health")
def health():
    return {"status": "ok", "model": "TaskDurationNet MLP (PyTorch)"}
