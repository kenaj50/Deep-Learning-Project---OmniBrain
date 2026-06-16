# OmniBrain — Intelligent Time Management Assistant

Jan Kolwicz

---

## Opis projektu

Pomysł na aplikację zrodził się analizując moje własne potrzeby (przeprowadziłem te prowizoryczne badanie rynku) w kontekście zarządzania moim czasem i zadaniami. Prowadząc 3 firmy mam wiele zadań o kompletnie rónym kontekście i chaotyczne niezorganizowane zarządzanie tym prowadzi do spadku wydajności i terminowości. Często podczas dnia "w locie" zapisuję w telefonie notatki, co mam zrobić później, natomiast nie jest to w zaden sposob ustrukturyzowane, te notatki często giną w tłumie innych zapisków itd. Wysokopoziomowe zadania często rozbijają się na wiele mniejszych zadań - a widząc bardzo złozone zadanie na liscie taskow niekiedy nawet go nie rozpoczniemy, bo nasz mozg autoamtycznie je zignoruje nie mając konkretnych bullet pointow, co musimy po kolei zrobić. Chcę dlatego stworzyć inteligentnego asystenta, który takie moje rozsynpane notatki/głosówki będzie przetwarzał znając kontekst moich działań, rozbijał je na subtaski, wrzucał w kalendarz, nadawał im termin, priorytet itd. Do tego w kadym momencie będę mógł rozmawiać z moją bazą danych językiem naturalnym poprzez chat z AI (zapytania w stylu "co mam dzisiaj do zrobienia, posortuj mi to wzgledem urgency i zacznijmy od firmy XYZ).

 Będzie to apka webowa (z moliwością szybkiego "eksportu" do wersji mobilnej), pełniąca rolę właśnie takiego osobistego asystenta optymalizującego nasz czas i zarządzającego naszymi zadaniami. Wrzucamy do systemu chaotyczne notatki (głosowe lub tekstowe), a system przetwarza je na ustrukturyzowane zadania i subtaski i pomaga zaplanować dzień równiez z uwzględnieniem aktualnej kondycji organizmu (jakość snu itp. - dane brane z zegarka).

## Główne założenia

Projekt opiera się na dwóch modułach Deep Learning:

**1. Lokalny model językowy (Ollama + Llama 3.2 lub QWEN 3.6)**
Model działa lokalnie i przetwarza surowe notatki (często nieustrukturyzowane, wrzucane losowo podczas dnia itd) na zadania w formacie JSON (tytuł, priorytet, termin, kategoria itd). Potem jeszcze fine-tuning przez QLoRA na własnym zbiorze przykładów.

**2. Sieć neuronowa do predykcji czasu (PyTorch)**
MLP wytrenowany na danych biometrycznych (sen, energia, pora dnia, typ zadania itd). Przewiduje, ile minut realnie zajmie dane zadanie i wynik wyświetlany jest w interfejsie (bierzmey to pod uwage podczas planowania kolejności zadań m.in.). 

Dane o śnie i energii pobierane z opaski Xiaomi Mi Band 10 przez Apple Health / Google Fit API lub mozna tez wprowadzać ręcznie.

---

## Plan prac

| Etap | Tydzień | Zakres |
|------|---------|--------|
| Setup, Ollama i Dataset | 1 | Uruchomienie lokalnego LLM, integracja z bazą/UI, przygotowanie i preprocessing zbioru danych |
| Model PyTorch | 2 | Implementacja, trening i ewaluacja sieci do predykcji czasu zadan |
| Integracja i Fine-tuning | 3 | FastAPI, połączenie z UI, fine-tuning lokalnego LLM przez QLoRA |
| Testy i finalizacja | 4 | Testy finalne systemu, przygotowanie raportu/prezentacji |
