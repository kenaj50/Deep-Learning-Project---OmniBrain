-- ============================================================
-- OmniBrain — Seed: Taski (sparsowane z notatek, 2026-05-28)
-- Krok 2: uruchom PO schema.sql — tylko na świeżej bazie
-- ============================================================

-- ── AioSystems ───────────────────────────────────────────────
INSERT INTO tasks (company_id, title, priority, urgency, subtasks, due_date, source_note)
SELECT c.id, 'Value equation + Grand Slam Offer dla AioSystems', 'high', 'high',
'[{"id":"1","title":"Wywiad z Claude o moich skillsach i portfolio","done":false},
  {"id":"2","title":"Wrzucić roadmapy i materiały Hormoziego Acquisition","done":false},
  {"id":"3","title":"Stworzyć value equation dla ofert","done":false},
  {"id":"4","title":"Opracować Grand Slam Offer","done":false},
  {"id":"5","title":"Określić model: usługi / kursy / produkty","done":false}]'::jsonb,
'2026-06-04', 'Value equation dla ofert i wywiad z Claude odnośnie moich skillsow'
FROM companies c WHERE c.slug = 'aiosystems';

INSERT INTO tasks (company_id, title, priority, urgency, subtasks, due_date, source_note)
SELECT c.id, 'Super demo na meet z CEO InPost — 11 czerwca', 'urgent', 'critical',
'[{"id":"1","title":"Zdefiniować zakres i scenariusz demo","done":false},
  {"id":"2","title":"Zbudować działający prototyp end-to-end","done":false},
  {"id":"3","title":"Przygotować pitch deck (max 10 slajdów)","done":false},
  {"id":"4","title":"Przetestować wszystkie scenariusze","done":false},
  {"id":"5","title":"Dry run z teamem 2 dni przed meetingiem","done":false}]'::jsonb,
'2026-06-11', 'przygotować super demo na meet z InPost CEO 11 czerwca'
FROM companies c WHERE c.slug = 'aiosystems';

INSERT INTO tasks (company_id, title, priority, urgency, subtasks, source_note)
SELECT c.id, 'Odpowiedzieć Nikhilowi — status klientów Kanopy i Naim', 'urgent', 'critical',
'[{"id":"1","title":"Sprawdzić aktualny status projektu Kanopy","done":false},
  {"id":"2","title":"Sprawdzić aktualny status projektu Naim","done":false},
  {"id":"3","title":"Przygotować update dla Nikhila","done":false},
  {"id":"4","title":"Wysłać odpowiedź i ustalić next steps","done":false}]'::jsonb,
'Nikhilowi co z naszymi klientami Kanopy i Naim'
FROM companies c WHERE c.slug = 'aiosystems';

INSERT INTO tasks (company_id, title, priority, urgency, subtasks, source_note)
SELECT c.id, 'Odpalić outbound campaign dla Kanopy', 'high', 'high',
'[{"id":"1","title":"Zdefiniować ICP dla Kanopy","done":false},
  {"id":"2","title":"Przygotować sekwencję outbound (cold email/LinkedIn)","done":false},
  {"id":"3","title":"Skonfigurować narzędzie outbound","done":false},
  {"id":"4","title":"Uruchomić lub oddelegować Naimowi","done":false},
  {"id":"5","title":"Ustalić KPI i tracking","done":false}]'::jsonb,
'Naim odpalić outbound campaign dla Kanopy lub oddelegować'
FROM companies c WHERE c.slug = 'aiosystems';

INSERT INTO tasks (company_id, title, priority, urgency, subtasks, source_note)
SELECT c.id, 'Obgadać z Maćkiem i Wojtkiem — wynagrodzenie i zasady współpracy', 'high', 'high',
'[{"id":"1","title":"Przygotować propozycję modelu wynagrodzenia","done":false},
  {"id":"2","title":"Określić zakres odpowiedzialności","done":false},
  {"id":"3","title":"Umówić się na spotkanie/call","done":false},
  {"id":"4","title":"Omówić warunki i oczekiwania","done":false},
  {"id":"5","title":"Spisać ustalenia","done":false}]'::jsonb,
'Obgadać z Maćkiem i Wojtkiem wynagrodzenie i zasady współpracy'
FROM companies c WHERE c.slug = 'aiosystems';

INSERT INTO tasks (company_id, title, priority, urgency, subtasks, source_note)
SELECT c.id, 'Angażować kontakty z Data Summit AI UAM na LinkedIn', 'medium', 'normal',
'[{"id":"1","title":"Wylistować wartościowe kontakty z Data Summit","done":false},
  {"id":"2","title":"Napisać personalizowane wiadomości (10/tydzień)","done":false},
  {"id":"3","title":"Śledzić oferty Google i firm AI","done":false}]'::jsonb,
'Angażować kontakty z data summit ai uam na LinkedIn, kariera w Google'
FROM companies c WHERE c.slug = 'aiosystems';

-- ── Kolmat Trade ─────────────────────────────────────────────
INSERT INTO tasks (company_id, title, priority, urgency, subtasks, due_date, source_note)
SELECT c.id, 'JPK — wysłać DZISIAJ', 'urgent', 'critical',
'[{"id":"1","title":"Przygotować i sprawdzić dane do JPK","done":false},
  {"id":"2","title":"Wygenerować plik JPK z systemu","done":false},
  {"id":"3","title":"Wysłać przez e-Deklaracje","done":false},
  {"id":"4","title":"Potwierdzić UPO (Urzędowe Potwierdzenie Odbioru)","done":false}]'::jsonb,
'2026-05-28', 'Jpk wysłać dzisiaj'
FROM companies c WHERE c.slug = 'kolmat';

INSERT INTO tasks (company_id, title, priority, urgency, subtasks, source_note)
SELECT c.id, 'Marka "Optymalizacja Snu" — sklep i produkty (kołdra, poduszka)', 'medium', 'normal',
'[{"id":"1","title":"Zdecydować nazwę i pozycjonowanie marki","done":false},
  {"id":"2","title":"Wybrać produkty core (kołdra obciążeniowa, poduszka)","done":false},
  {"id":"3","title":"Znaleźć dostawców i sprawdzić marże","done":false},
  {"id":"4","title":"Stworzyć brand story i sklep MVP","done":false},
  {"id":"5","title":"Zaplanować content marketing","done":false}]'::jsonb,
'Kolmat marka odnosnie spania: koldra obciazeniowa, poduszka, sklep'
FROM companies c WHERE c.slug = 'kolmat';

-- ── Hyper Human Club ─────────────────────────────────────────
INSERT INTO tasks (company_id, title, priority, urgency, subtasks, due_date, source_note)
SELECT c.id, 'Nagrać tutorial n8n od podstaw — film dla HH', 'high', 'high',
'[{"id":"1","title":"Napisać outline i skrypt tutorialu (max 20 min)","done":false},
  {"id":"2","title":"Przygotować środowisko n8n do nagrania","done":false},
  {"id":"3","title":"Nagrać film (ekran + komentarz)","done":false},
  {"id":"4","title":"Prosta edycja i cięcia","done":false},
  {"id":"5","title":"Opublikować na platformie HH z opisem","done":false}]'::jsonb,
'2026-05-28', 'Dzisiaj nagrać film na hyper human tutorial n8n od postaw'
FROM companies c WHERE c.slug = 'hyper-human';

INSERT INTO tasks (company_id, title, priority, urgency, subtasks, source_note)
SELECT c.id, 'Odpisać wszystkim zainteresowanym zleceniami z HH', 'urgent', 'critical',
'[{"id":"1","title":"Przejrzeć wiadomości na platformie HH Klub","done":false},
  {"id":"2","title":"Przejrzeć maile dotyczące zleceń","done":false},
  {"id":"3","title":"Przejrzeć DM na Instagram @hyperhuman","done":false},
  {"id":"4","title":"Odpisać każdemu z propozycją lub follow-up","done":false},
  {"id":"5","title":"Oznaczyć konwersacje i dodać do pipeline","done":false}]'::jsonb,
'Odpisać wszyskim na hyper human co pisali o zleceniach'
FROM companies c WHERE c.slug = 'hyper-human';

INSERT INTO tasks (company_id, title, priority, urgency, subtasks, source_note)
SELECT c.id, 'Wybrać projekty HH i wziąć pod skrzydła — zbudować zespół', 'high', 'normal',
'[{"id":"1","title":"Przejrzeć zgłoszenia projektów wdrożeniowych w HH","done":false},
  {"id":"2","title":"Ocenić potencjał każdego projektu","done":false},
  {"id":"3","title":"Wybrać 2-3 projekty do aktywnego wsparcia","done":false},
  {"id":"4","title":"Skontaktować się z teamami i ustalić warunki","done":false},
  {"id":"5","title":"Zaplanować pierwsze sprinty","done":false}]'::jsonb,
'Wybrać projekty z hyper human i wziąć pod skrzydła, zbudować zespół'
FROM companies c WHERE c.slug = 'hyper-human';

INSERT INTO tasks (company_id, title, priority, urgency, subtasks, source_note)
SELECT c.id, 'Content plan HH — YT, IG, LinkedIn, X (cel: 90% zautomatyzowane)', 'medium', 'normal',
'[{"id":"1","title":"Stworzyć content calendar na czerwiec","done":false},
  {"id":"2","title":"Batch-create 10 postów/filmów w jednej sesji","done":false},
  {"id":"3","title":"Skonfigurować narzędzie do auto-postowania","done":false},
  {"id":"4","title":"Ustalić stały dzień produkcji contentu","done":false}]'::jsonb,
'Postować regularnie content na YT IG LinkedIn X (zautomatyzować 90%)'
FROM companies c WHERE c.slug = 'hyper-human';

-- ── Prywatne ─────────────────────────────────────────────────
INSERT INTO tasks (company_id, title, priority, urgency, subtasks, due_date, source_note)
SELECT c.id, 'Tata odbiera medal — Piątek 29 maja', 'urgent', 'critical',
'[{"id":"1","title":"Potwierdzić godzinę i miejsce ceremonii","done":false},
  {"id":"2","title":"Zaplanować transport","done":false},
  {"id":"3","title":"Przygotować życzenia lub upominek","done":false}]'::jsonb,
'2026-05-29', 'Piątek 29 maja tata odbiera medal'
FROM companies c WHERE c.slug = 'personal';

INSERT INTO tasks (company_id, title, priority, urgency, subtasks, due_date, source_note)
SELECT c.id, 'Egzamin z matematyki — przygotować się na jutro', 'urgent', 'critical',
'[{"id":"1","title":"Powtórzyć materiał z ostatnich wykładów","done":false},
  {"id":"2","title":"Zrobić zaległe zadania przygotowawcze","done":false},
  {"id":"3","title":"Przejrzeć stare kolokwia","done":false},
  {"id":"4","title":"Dobrze spać (przed 23:00)","done":false}]'::jsonb,
'2026-05-29', 'przygotować się na jutrzejszy egzamin z matmy'
FROM companies c WHERE c.slug = 'personal';

INSERT INTO tasks (company_id, title, priority, urgency, subtasks, due_date, source_note)
SELECT c.id, 'Overleaf — anulować subskrypcję DZISIAJ', 'urgent', 'critical',
'[{"id":"1","title":"Zalogować się na overleaf.com","done":false},
  {"id":"2","title":"Wejść w Account → Subscription","done":false},
  {"id":"3","title":"Kliknąć Cancel i potwierdzić","done":false}]'::jsonb,
'2026-05-28', 'Overleaf subka anulować dzis'
FROM companies c WHERE c.slug = 'personal';

INSERT INTO tasks (company_id, title, priority, urgency, subtasks, source_note)
SELECT c.id, 'Zaległe prace z uczelni — nadrobić', 'high', 'high',
'[{"id":"1","title":"Zebrać kompletną listę zaległych zadań","done":false},
  {"id":"2","title":"Uszeregować według terminów oddania","done":false},
  {"id":"3","title":"Zarezerwować bloki czasowe","done":false},
  {"id":"4","title":"Nadrobić kolejno wg priorytetów","done":false}]'::jsonb,
'porobić zadania zaległe z uczelni'
FROM companies c WHERE c.slug = 'personal';

INSERT INTO tasks (company_id, title, priority, urgency, subtasks, source_note)
SELECT c.id, 'Magisterka z Laniqo — plan i następne kroki', 'high', 'normal',
'[{"id":"1","title":"Porozmawiać z promotorem o stanie pracy","done":false},
  {"id":"2","title":"Zdefiniować kolejne rozdziały","done":false},
  {"id":"3","title":"Ustalić tygodniowy plan pracy (min 2h/tydzień)","done":false},
  {"id":"4","title":"Zebrać materiały źródłowe","done":false}]'::jsonb,
'temat z magisterką Laniqo ogarnąć'
FROM companies c WHERE c.slug = 'personal';

INSERT INTO tasks (company_id, title, priority, urgency, subtasks, source_note)
SELECT c.id, 'Odpisać Anterissowi z projektem (projekt prywatny)', 'high', 'normal',
'[{"id":"1","title":"Przejrzeć ostatnią korespondencję z Anterissem","done":false},
  {"id":"2","title":"Przygotować update o stanie projektu","done":false},
  {"id":"3","title":"Napisać i wysłać odpowiedź","done":false}]'::jsonb,
'Odpisać anterissowi z projektem'
FROM companies c WHERE c.slug = 'personal';

INSERT INTO tasks (company_id, title, priority, urgency, subtasks, due_date, source_note)
SELECT c.id, 'Juwenalia z ekipą — następna sobota 7 czerwca', 'low', 'normal',
'[{"id":"1","title":"Potwierdzić kto idzie","done":false},
  {"id":"2","title":"Sprawdzić program i kupić bilety","done":false},
  {"id":"3","title":"Ustalić miejsce i godzinę zbiórki","done":false}]'::jsonb,
'2026-06-07', 'W następną sobotę juwenalia z ekipą'
FROM companies c WHERE c.slug = 'personal';

INSERT INTO tasks (company_id, title, priority, urgency, subtasks, source_note)
SELECT c.id, 'Trading z Tomkiem — brokera i strategie ogarnąć', 'medium', 'normal',
'[{"id":"1","title":"Porozmawiać z Tomkiem o brokerze","done":false},
  {"id":"2","title":"Zrozumieć strategię (Hubert z Ecom)","done":false},
  {"id":"3","title":"Otworzyć konto u wybranego brokera","done":false},
  {"id":"4","title":"Zdecydować o alokacji kapitału","done":false}]'::jsonb,
'Trading z Tomkiem ogarnąć brokera i te ich strategie'
FROM companies c WHERE c.slug = 'personal';

INSERT INTO tasks (company_id, title, priority, urgency, subtasks, source_note)
SELECT c.id, 'Master plan: AioSystems + Kolmat + HH + Anteris — wizja na 12 mies.', 'medium', 'normal',
'[{"id":"1","title":"Napisać personal vision statement","done":false},
  {"id":"2","title":"Zmapować jak wszystkie projekty się uzupełniają","done":false},
  {"id":"3","title":"Stworzyć roadmapę na 12 miesięcy","done":false},
  {"id":"4","title":"Określić co delegować, co prowadzić osobiście","done":false},
  {"id":"5","title":"Ustrukturyzować dzienny rytm (deep work, admin, content)","done":false}]'::jsonb,
'Pomyśleć nad szkoleniem jak to wszystko aiosystems Kolmat anteris HH połączyć'
FROM companies c WHERE c.slug = 'personal';

INSERT INTO tasks (company_id, title, priority, urgency, subtasks, source_note)
SELECT c.id, 'Wellbeing dashboard — suplementy, sen, Mi Band 10', 'medium', 'normal',
'[{"id":"1","title":"Stworzyć listę suplementów z dawkami w OmniBrain","done":false},
  {"id":"2","title":"Sprawdzić dostępność API Xiaomi Mi Band 10","done":false},
  {"id":"3","title":"Ustawić alarm na sen przed 22:30","done":false},
  {"id":"4","title":"Logować sen i energię codziennie w OmniBrain","done":false}]'::jsonb,
'optimalizacja wellbeingu, suplementy, Mi Band 10, spanie przed 22'
FROM companies c WHERE c.slug = 'personal';

INSERT INTO tasks (company_id, title, priority, urgency, subtasks, source_note)
SELECT c.id, 'Wyjazd do Anastazji do Wrocławia — zaplanować termin', 'low', 'low',
'[{"id":"1","title":"Ustalić termin z Anastazją","done":false},
  {"id":"2","title":"Zarezerwować transport (PKP/BlaBlaCar)","done":false},
  {"id":"3","title":"Zaplanować co zrobić we Wrocławiu","done":false}]'::jsonb,
'zaplanować kiedy pojechać do Anastazji do wro'
FROM companies c WHERE c.slug = 'personal';
