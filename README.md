# Cyberbezpieczeństwo w erze AI

**Czy sztuczna inteligencja pomaga bardziej atakującym, czy obrońcom?**

Plik: [`Cyberbezpieczenstwo_w_erze_AI.pptx`](Cyberbezpieczenstwo_w_erze_AI.pptx) — 12 slajdów, ciemny „filmowy” styl, przejścia **Morph**.

## Podział na 3 osoby

| Sekcja w PowerPoincie | Slajdy | Kto mówi | Kolor |
|---|---|---|---|
| Osoba 1 — Wstęp i atakujący | 1–5 | Osoba 1 | czerwony |
| Osoba 2 — Obrońcy | 6–9 | Osoba 2 | błękitny |
| Osoba 3 — Werdykt | 10–12 | Osoba 3 | fioletowy |

Na każdym slajdzie w prawym górnym rogu jest napis **MÓWI: OSOBA X**, a slajdy 2, 6 i 10 to „rozdziały”, na których następuje zmiana osoby. Gotowy tekst dla każdego mówcy, razem z momentem przekazania głosu, jest w **notatkach prelegenta**.

## Zastosowane techniki „cinematic”

- **Morph z wymuszonym dopasowaniem (`!!nazwa`)**: wszystkie obiekty mają nazwy zaczynające się od `!!` (Okienko zaznaczenia, Alt+F10), więc PowerPoint łączy je między slajdami.
- **Wirtualna kamera i paralaksa**: duże tło przesuwa się i przybliża wolno, cząsteczki szybko, każda warstwa z inną prędkością. Tak powstaje głębia.
- **Obiekty spoza kadru**: treść każdego slajdu ma niewidoczne kopie poza krawędzią sąsiednich slajdów, więc wlatuje i wylatuje zamiast się przenikać. Różne odległości dają efekt rozłożenia w czasie.
- **Morph po znakach** (slajdy 2, 6, 10): litery tytułu rozsypują się i składają w nowe słowo (CYBERBEZPIECZEŃSTWO → ATAKUJĄCY → OBROŃCY → WERDYKT).
- **Obracające się pierścienie HUD** i zmiana koloru całej sceny w każdej sekcji.
- **Rdzenie AI**: dwie świecące kule (czerwona i błękitna). Na koniec stają się szalkami wagi, która przechyla się między slajdami 11 i 12.
- Pasek postępu, flara anamorficzna, winieta i linie skanowania.

## Jak prezentować

- Potrzebny jest **PowerPoint 2019, 2021 lub Microsoft 365** (Windows/Mac) albo PowerPoint w przeglądarce. Starsze wersje pokażą zwykłe przenikanie.
- Uruchom pokaz (F5) i klikaj. Animacja jest w przejściach, więc slajdy nie mają dodatkowych kliknięć.
- Edycja: przy zmianie pozycji obiektu **nie zmieniaj jego nazwy**, bo morph przestanie go łączyć. Niektóre elementy celowo leżą poza slajdem.

## Źródła danych użytych na slajdach

Arup / deepfake w Hongkongu (2024), Microsoft i OpenAI: raport o grupach państwowych (2024), Anthropic: przerwana kampania szpiegowska z agentem AI (2025), IBM Cost of a Data Breach (2024), Google Big Sleep (2024), DARPA AIxCC (2025), ISC2 Cybersecurity Workforce Study (2024).

## Generowanie od nowa

Folder `zrodla/` zawiera generator (pptxgenjs + post-processing XML dodający przejścia Morph i miękkie krawędzie):

```bash
cd zrodla && npm install && python3 assets.py
PPTX_SKILL=<katalog z apply_theme.js> node build.js ../Cyberbezpieczenstwo_w_erze_AI.pptx
```
