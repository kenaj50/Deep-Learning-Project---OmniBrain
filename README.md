# OmniBrain — DeepScheduler

Osobisty asystent zarządzania zadaniami z modułem Deep Learning do predykcji czasu i lokalnym LLM do przetwarzania notatek.

## Problem

Prowadzenie kilku obszarów działalności jednocześnie generuje dziesiątki nieustrukturyzowanych notatek dziennie. Brakuje narzędzia, które przetworzy chaos na konkretne zadania i pomoże zaplanować dzień z uwzględnieniem aktualnej kondycji organizmu.

## Rozwiązanie

Aplikacja webowa (PWA) integrująca dwa moduły Deep Learning:

**1. Lokalny LLM (Ollama + Llama 3.2)**
Przetwarza surowe notatki głosowe i tekstowe na ustrukturyzowane zadania w JSON — tytuł, priorytet, termin, kategoria, subtaski. Działa lokalnie, zero danych na zewnątrz.

**2. Sieć neuronowa PyTorch — DeepScheduler**
MLP (Multi-Layer Perceptron) trenowany na danych biometrycznych: godziny snu, poziom energii, pora dnia, typ zadania. Przewiduje realny czas wykonania zadania i wyświetla szacunek bezpośrednio w interfejsie.

## Architektura

```
Next.js (UI) ←→ Supabase PostgreSQL
     ↓
/api/predict → FastAPI (Python) → model.pt (PyTorch MLP)
/api/chat    → Anthropic API / Ollama (lokalny LLM)
```

## Stack

| Warstwa | Technologia |
|---------|-------------|
| Frontend | Next.js 16, React 19, Tailwind CSS |
| Baza danych | Supabase (PostgreSQL + Realtime) |
| AI / LLM | Anthropic API, Ollama (lokalny) |
| Model DL | PyTorch MLP, FastAPI mikroserwis |
| Deployment | Vercel |

## Uruchomienie

```bash
# Zależności JS
npm install

# Uruchom aplikację
npx next dev

# Mikroserwis ML (osobny terminal)
cd ml/api
uvicorn main:app --port 8000
```

Wymagany plik `.env.local` z kluczami Supabase i Anthropic (patrz `.env.local.example`).

## Moduł ML — szczegóły

```
/ml
  /data
    generate_dataset.py   — generuje 5000 syntetycznych rekordów
    dataset.csv           — dane treningowe
  /model
    train.py              — trening MLP (PyTorch), MAE ~11 min
    model.pt              — wytrenowane wagi sieci
  /api
    main.py               — FastAPI /predict endpoint
```

Architektura sieci: `Input(6) → FC(64) → ReLU → Dropout(0.2) → FC(32) → ReLU → FC(1)`

## Autor

Jan Kolwicz — projekt zaliczeniowy, przedmiot: Deep Learning
