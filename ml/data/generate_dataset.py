"""
Generuje syntetyczny dataset do treningu modelu predykcji czasu zadań.
Symuluje realistyczne korelacje: mniej snu → wolniejsza praca, niska energia → dłuższy czas.
"""
import numpy as np
import pandas as pd
from pathlib import Path

np.random.seed(42)
N = 5000

TASK_TYPES = ["programming", "meeting", "admin", "creative", "planning"]
BASE_MINUTES = {"programming": 90, "meeting": 45, "admin": 20, "creative": 60, "planning": 30}

task_type = np.random.choice(TASK_TYPES, N, p=[0.35, 0.20, 0.20, 0.15, 0.10])
sleep_hours    = np.random.normal(7, 1.5, N).clip(3, 10)
energy_level   = np.random.randint(1, 11, N)
day_of_week    = np.random.randint(0, 7, N)   # 0 = poniedziałek
hour_of_day    = np.random.randint(7, 22, N)
description_len = np.random.randint(10, 200, N)

minutes = np.array([BASE_MINUTES[t] for t in task_type], dtype=float)

# Mniej snu → wolniej (każda brakująca godzina poniżej 8h daje +8%)
minutes *= 1 + (8 - sleep_hours).clip(0) * 0.08

# Niska energia → wolniej
minutes *= 1 + (5 - energy_level).clip(0) * 0.05

# Szczyt produktywności: 9-11, wieczór (po 20) spowalnia
hour_factor = np.where((hour_of_day >= 9) & (hour_of_day <= 11), 0.88,
              np.where(hour_of_day >= 20, 1.25, 1.0))
minutes *= hour_factor

# Dłuższy opis ≈ bardziej złożone zadanie
minutes += description_len * 0.18

minutes += np.random.normal(0, 8, N)
minutes = minutes.clip(5, 480).round().astype(int)

df = pd.DataFrame({
    "task_type":        task_type,
    "sleep_hours":      sleep_hours.round(1),
    "energy_level":     energy_level,
    "day_of_week":      day_of_week,
    "hour_of_day":      hour_of_day,
    "description_len":  description_len,
    "minutes":          minutes,
})

out = Path(__file__).parent / "dataset.csv"
df.to_csv(out, index=False)
print(f"Zapisano {N} rekordów → {out}")
print(df.groupby("task_type")["minutes"].mean().round(1).to_string())
