# OmniBrain — DeepScheduler
### Projekt zaliczeniowy · Deep Learning · Jan Kolwicz

---

## 1. Opis projektu (dla prowadzącego)

**Tytuł:** DeepScheduler — inteligentny asystent zarządzania zadaniami z modułem biohackingu

**Problem biznesowy:** Prowadzę 4 obszary działalności (agencja AI, e-commerce, edukacja, projekty osobiste). Codziennie mam kilkadziesiąt nieustrukturyzowanych notatek i zadań rozrzuconych w różnych miejscach. Projekt rozwiązuje ten problem przez:

1. **Lokalny model językowy** (Ollama + Llama 3) — zamiast płatnego API, przetwarza chaotyczne notatki głosowe/tekstowe na ustrukturyzowane zadania w formacie JSON i zapisuje je do bazy danych.

2. **Własna sieć neuronowa** (PyTorch) — model regresyjny, który na podstawie **danych biometrycznych** (sen, energia z opaski Xiaomi Mi Band 10 przez Apple Health / Google Fit) **przewiduje, ile czasu realnie zajmie dane zadanie** i w jakiej porze dnia najlepiej je zaplanować.

**Cechą wyróżniającą projekt od klasycznych tutoriali** jest połączenie prawdziwego środowiska produkcyjnego (Next.js + Supabase + Vercel) z modułem Deep Learning — można przełączyć się między trybem "Claude API" (produkcja) a "Lokalny AI" (Deep Learning) jednym przełącznikiem w UI aplikacji.

---

## 2. Architektura systemu

```
┌─────────────────────────────────────────────────────────────────┐
│  FRONTEND (Next.js 16 / React 19)                               │
│                                                                  │
│  ┌─────────────┐   [przełącznik]   ┌────────────────────────┐   │
│  │  ChatPanel  │ ───────────────►  │  Tryb: Claude API      │   │
│  │  (UI czatu) │                   │  Tryb: Lokalny AI 🦙   │   │
│  └─────────────┘                   └────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
         │                                    │
         ▼ (Tryb: Claude API)                 ▼ (Tryb: Lokalny AI)
┌──────────────────┐               ┌──────────────────────────────┐
│  Anthropic API   │               │  LOKALNY SERWER              │
│  Claude claude-sonnet-4-6         │                              │
│  (produkcja)     │               │  ┌──────────────────────┐    │
└──────────────────┘               │  │  Ollama              │    │
                                   │  │  model: llama3.2     │    │
                                   │  │  (text → JSON tasks) │    │
                                   │  └──────────────────────┘    │
                                   │                              │
                                   │  ┌──────────────────────┐    │
                                   │  │  FastAPI + PyTorch   │    │
                                   │  │  (sleep → czas taska)│    │
                                   │  └──────────────────────┘    │
                                   └──────────────────────────────┘
         │                                    │
         └──────────────┬─────────────────────┘
                        ▼
              ┌──────────────────┐
              │  Supabase DB     │
              │  (tasks, sleep,  │
              │   companies)     │
              └──────────────────┘
```

---

## 3. Elementy Deep Learning (co ocenia prowadzący)

### A. Lokalny LLM — Ollama + Llama 3 (NLP, klasyfikacja)

**Co robi:** Zamienia chaos notatek ("jutro na 10 mam spotkanie z Pawłem z AioSystems, potem trzeba wrzucić posta na IG i zadzwonić do ksigowej") na strukturę JSON, którą aplikacja wrzuca do bazy Supabase.

**Jak:** Zamiast Claude'a API (płatne), odpytujemy lokalny serwer Ollama na `http://localhost:11434`. Model: `llama3.2` lub `mistral`.

**Gdzie tu DL:** Llama 3 to Transformer (150M–8B parametrów, zależnie od wersji) — pełnoprawna sieć głęboka. Uruchamiamy ją lokalnie bez danych na serwery zewnętrzne.

**Rozszerzenie (QLoRA Fine-tuning):** Na Google Colab dotrenujemy adapter LoRA na ~150–200 własnych przykładach (moje notatki → JSON), tak żeby model rozumiał mój unikalny sposób pisania. Pokazujemy prowadzącemu: trening, loss curve, eval.

---

### B. Własna sieć neuronowa — PyTorch (regresja tablic)

**Cel:** Przewidywanie ile minut zajmie zadanie na podstawie:
- Rodzaj zadania (kategoria: programowanie / spotkanie / admin / kreacja)
- Pora dnia (rano / południe / wieczór)
- Dzień tygodnia
- Godziny snu poprzedniej nocy
- Energia (1–10, z opaski lub wpisana ręcznie)
- Długość opisu zadania (proxy złożoności)

**Architektura:** Multi-Layer Perceptron (MLP) — w pełni połączona sieć neuronowa:
```
Input (8 cech) → FC(64) → ReLU → Dropout(0.2) → FC(32) → ReLU → FC(1) → output (minuty)
```

**Trening:**
- Dataset: 5 000–10 000 syntetycznych rekordów wygenerowanych przez skrypt Python (zasymulowane korelacje sen→produktywność)
- Loss: MSE (Mean Squared Error)
- Optymalizator: Adam
- Metryki: MAE w minutach

**Mikroserwis:** Wytrenowany model eksportujemy i serwujemy przez FastAPI (Python):
```
POST /predict
{ "task_type": "programming", "sleep_hours": 6.5, "energy": 7, "day": "monday" }
→ { "estimated_minutes": 92 }
```

---

### C. Integracja danych biometrycznych — Xiaomi Mi Band 10

**Plan A (pełna integracja):**
- Opaska sync z telefonem (Zepp Life app)
- Zepp Life → Google Fit (Android) lub Apple Health (iOS)
- OmniBrain pyta Google Fit / Apple Health API przez OAuth2
- Pobiera: godziny snu, REM, HRV, kroki

**Plan B (MVP na zaliczenie):**
- Ręczny import: przycisk "Importuj CSV ze snu" w widoku Wellbeing
- Lub dane syntetyczne dla treningu modelu
- Ważne: **model i tak działa poprawnie**, źródło danych to szczegół implementacyjny

---

## 4. Harmonogram prac

| Tydzień | Zadanie | Co oddaję prowadzącemu |
|---------|---------|----------------------|
| **1–2** | Integracja Ollamy w aplikacji, UI przełącznik Claude↔Ollama | Screeny działającego przełącznika, logi Ollamy |
| **3** | Python: skrypt generujący dataset 5k rekordów (sen → czas taska) | Plik `dataset.csv`, opis generowania danych |
| **4** | PyTorch: architektura MLP, trening, loss curves | Jupyter Notebook z treningiem, wykres MAE |
| **5** | FastAPI: mikroserwis z predykcją, testy | Dokumentacja API, demo predykcji |
| **6** | Integracja: Next.js ↔ FastAPI (czas taska widoczny w UI) | Screeny z predykcją w UI aplikacji |
| **7** | QLoRA fine-tuning Llama 3 (Google Colab) | Notebook z treningiem, loss curve, eval |
| **8** | Dokumentacja, prezentacja, testy e2e | Sprawozdanie PDF, demo na żywo |

---

## 5. Struktura repozytorium

```
/app                    ← Next.js frontend (produkcja + DL tryb)
/components             ← React UI z przełącznikiem AI
/lib/ai                 ← Obsługa Claude API + Ollama API

/ml                     ← Python / Deep Learning (nowy folder)
  /data
    generate_dataset.py ← generuje dataset.csv
    dataset.csv
  /model
    train.ipynb         ← Jupyter Notebook z treningiem PyTorch
    model.pt            ← wagi wytrenowanego modelu
    model.onnx          ← opcjonalnie: ONNX dla produkcji
  /api
    main.py             ← FastAPI mikroserwis
    requirements.txt
  /lora
    finetune.ipynb      ← QLoRA fine-tuning na Google Colab
    training_data.jsonl ← przykłady: notatka → JSON
```

---

## 6. Technologie (dla prowadzącego)

| Komponent | Technologia | Rola |
|-----------|-------------|------|
| Frontend | Next.js 16, React 19 | Interfejs użytkownika |
| Baza danych | Supabase (PostgreSQL) | Przechowywanie zadań |
| LLM produkcja | Claude claude-sonnet-4-6 API | Przetwarzanie notatek (tryb produkcja) |
| LLM lokalny | Ollama + Llama 3.2 | Przetwarzanie notatek (tryb DL) |
| Fine-tuning | QLoRA (PEFT, Hugging Face) | Dotrenowanie Llamy na własnym datasecie |
| Model regresji | PyTorch, MLP | Predykcja czasu zadania |
| Mikroserwis ML | FastAPI (Python) | API dla modelu PyTorch |
| Dane biometryczne | Google Fit API / Apple Health / synthetic | Dane o śnie → wejście do modelu |
| Trening | Google Colab (GPU T4) | Trening modeli |

---

## 7. Co to nie jest

- **Nie jest** zwykłą nakładką na ChatGPT/Claude (mamy własną sieć w PyTorch i lokalny LLM)
- **Nie jest** projektem tylko na Kaggle dataset (dane zbieramy z rzeczywistego użytku apki)
- **Nie jest** tylko teorią — aplikacja działa produkcyjnie pod adresem Vercel

---

*Projekt realizowany jako połączenie osobistego narzędzia produktywności (OmniBrain) z modułem Deep Learning na potrzeby przedmiotu.*
