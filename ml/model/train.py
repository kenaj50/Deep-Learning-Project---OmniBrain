"""
Trening MLP (Multi-Layer Perceptron) do predykcji czasu zadań.
Architektura: Input(6) → FC(64) → ReLU → Dropout(0.2) → FC(32) → ReLU → FC(1)
"""
import os
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

import torch
import torch.nn as nn
import numpy as np
import pandas as pd
import joblib
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder

BASE = Path(__file__).parent
DATA = BASE.parent / "data" / "dataset.csv"

df = pd.read_csv(DATA)

le = LabelEncoder()
df["task_type_enc"] = le.fit_transform(df["task_type"])

FEATURES = ["task_type_enc", "sleep_hours", "energy_level", "day_of_week", "hour_of_day", "description_len"]
X = df[FEATURES].values.astype(np.float32)
y = df["minutes"].values.astype(np.float32).reshape(-1, 1)

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

scaler_X = StandardScaler()
scaler_y = StandardScaler()
X_train = scaler_X.fit_transform(X_train)
X_test  = scaler_X.transform(X_test)
y_train = scaler_y.fit_transform(y_train)
y_test  = scaler_y.transform(y_test)

X_train = torch.FloatTensor(X_train)
y_train = torch.FloatTensor(y_train)
X_test  = torch.FloatTensor(X_test)
y_test_np = scaler_y.inverse_transform(y_test)


class TaskDurationNet(nn.Module):
    def __init__(self):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(6, 64),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Linear(32, 1),
        )

    def forward(self, x):
        return self.net(x)


model = TaskDurationNet()
optimizer = torch.optim.Adam(model.parameters(), lr=0.001)
criterion = nn.MSELoss()

print("Trening MLP...")
for epoch in range(300):
    model.train()
    optimizer.zero_grad()
    loss = criterion(model(X_train), y_train)
    loss.backward()
    optimizer.step()

    if epoch % 50 == 0 or epoch == 299:
        model.eval()
        with torch.no_grad():
            pred_scaled = model(X_test).numpy()
            pred_min = scaler_y.inverse_transform(pred_scaled)
            mae = float(np.mean(np.abs(pred_min - y_test_np)))
        print(f"  Epoch {epoch:3d} | Loss: {loss.item():.4f} | MAE: {mae:.1f} min")

torch.save(model.state_dict(), BASE / "model.pt")
joblib.dump(scaler_X, BASE / "scaler_X.pkl")
joblib.dump(scaler_y, BASE / "scaler_y.pkl")
joblib.dump(le, BASE / "label_encoder.pkl")
print(f"\nModel zapisany → {BASE}/model.pt")
print(f"Końcowe MAE: {mae:.1f} min (błąd predykcji)")
