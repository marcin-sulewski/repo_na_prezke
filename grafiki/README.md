# Grafiki do prezentacji

Grafiki do prezentacji „Cyberbezpieczeństwo w erze AI”. **Nie są wstawione do pliku .pptx.** To biblioteka do wykorzystania. Wszystkie pochodzą z otwartych źródeł z licencją pozwalającą na użycie (szczegóły niżej).

Podglądy: [`podglad_tla.jpg`](podglad_tla.jpg) · [`podglad_elementy_3d.jpg`](podglad_elementy_3d.jpg) · [`podglad_ikony_cyber.jpg`](podglad_ikony_cyber.jpg)

## `tla/`: tła

| Plik | Co przedstawia | Pasuje do |
|---|---|---|
| `ziemia_noca_nasa_4096x2048.jpg` | Ziemia nocą (NASA Black Marble), cała mapa | slajd tytułowy, tło „globalnej sieci” |
| `ziemia_noca_europa_1920x1080.jpg` | to samo, kadr 16:9 na Europę | slajd 1 lub 12 |
| `ziemia_ciemna_2048x1024.jpg` | ciemna mapa świata | tło pod tekst |
| `ziemia_blue_marble_nasa_4096x2048.jpg` | Ziemia za dnia (NASA Blue Marble) | kontrast „jasna strona” / obrońcy |
| `gwiazdy_4096x2048.jpg` | rozgwieżdżone niebo (bardzo ciemne) | subtelne tło pod całą prezentację |
| `globus_polaczenia_siec.png` | globus z setkami łuków połączeń | atakujący / skala ataków |
| `globus_wiazki_kolce.png` | globus z czerwonymi wiązkami | „atak w tempie maszyny” (slajd 5) |
| `globus_luki_transmisji.png` | łuki transmisji danych | wstęp, przepływ danych |
| `globus_kable_podmorskie.png` | mapa kabli podmorskich | infrastruktura internetu |
| `globus_tarcza.png` | globus w siatce, jak pod kopułą ochronną | obrońcy (slajd 6–8) |
| `globus_satelity.png` | Ziemia otoczona satelitami | monitoring, SOC (slajd 7) |
| `globus_sciezki_ruchu.png` | ścieżki ruchu sieciowego | anomalie, ruch w sieci |
| `globus_fala_sygnalu.png` | rozchodzący się sygnał | wykrycie, alarm |
| `globus_w_kosmosie.png` | Ziemia na tle gwiazd | zakończenie (slajd 12) |
| `plytka_drukowana_{cyjan,czerwona,fiolet}_1920x1080.jpg` | wzór płytki drukowanej w kolorach sekcji | tła sekcji: obrońcy / atakujący / werdykt |
| `plytka_drukowana_kafelek.svg` | pojedynczy kafelek wzoru (biały, do pokolorowania) | własne tła i wypełnienia |

Pliki `globus_*.png` mają ok. 1030×550 px. Nadają się na tło połowy slajdu, na małe okno albo na pełny ekran z rozmyciem lub przyciemnieniem. Na ostre tło pełnoekranowe są za małe.

## `elementy_3d/`: elementy 3D bez tła (PNG z przezroczystością)

61 elementów w stylu 3D, m.in. `robot_ai`, `mozg`, `tarcza`, `klodka_*`, `klucz`, `ninja_haker`, `detektyw`, `czaszka`, `robak_bug`, `mikrob_wirus`, `wedka_phishing`, `maski_deepfake`, `mikrofon_glos`, `kamera_wideo`, `email`, `ostrzezenie`, `syrena_alarm`, `oko_monitoring`, `lupa`, `klucz_plaski`, `mur_firewall`, `waga_werdykt`, `stoper_tempo`, `worek_pieniedzy`, `pieniadze_odlatuja`, `analityk_przy_komputerze`, `uscisk_dloni`.

Propozycje:
- **Atakujący:** `wedka_phishing`, `maski_deepfake`, `mikrofon_glos`, `ninja_haker`, `pieniadze_odlatuja`, `stoper_tempo`
- **Obrońcy:** `tarcza`, `oko_monitoring`, `syrena_alarm`, `lupa`, `klucz_plaski`, `mur_firewall`, `robot_ai`
- **Werdykt:** `waga_werdykt`, `uscisk_dloni`, `zespol`, `puchar`

## `ikony_cyber/`: płaskie ikony „cyber” (SVG + PNG 512 px, bez tła)

46 ikon w trzech wariantach:
- `oryginalne/`: granat i błękit (do jasnych teł)
- `neon_cyjan/`: w kolorze obrońców (#00E0FF), do ciemnych teł prezentacji
- `neon_czerwone/`: w kolorze atakujących (#FF2D55)

Przykłady: `lock-shield`, `check-shield`, `shield-3`, `programming-bug-2`, `skull-1`, `masks`, `email-2`, `microphone-1`, `video-meeting-group`, `server`, `network`, `crosshair-1`, `view-2`, `business-scale-4`.

W PowerPoint 365 lepiej wstawiać pliki **SVG**: są ostre w każdym rozmiarze i można zmienić ich kolor (Format grafiki → Wypełnienie). PNG są dla starszych wersji.

## Źródła i licencje

| Grafiki | Źródło | Licencja |
|---|---|---|
| `ziemia_noca_*`, `ziemia_blue_marble_*` | NASA Earth Observatory (Black Marble, Blue Marble), pobrane z pakietu npm [`three-globe`](https://www.npmjs.com/package/three-globe) | domena publiczna (NASA) |
| `ziemia_ciemna_*`, `gwiazdy_*`, `globus_*` | przykłady z pakietów npm [`three-globe`](https://www.npmjs.com/package/three-globe) i [`globe.gl`](https://www.npmjs.com/package/globe.gl) (Vasco Asturiano) | MIT |
| `plytka_drukowana_*` | wzór „Circuit Board” z [Hero Patterns](https://heropatterns.com) (Steve Schoger), pakiet npm [`hero-patterns`](https://www.npmjs.com/package/hero-patterns); przekolorowany | CC BY 4.0, uznanie autorstwa: Steve Schoger / heropatterns.com |
| `elementy_3d/` | [Microsoft Fluent Emoji 3D](https://github.com/microsoft/fluentui-emoji), pakiet npm [`@lobehub/fluent-emoji-3d`](https://www.npmjs.com/package/@lobehub/fluent-emoji-3d); przekonwertowane z WebP do PNG | MIT |
| `ikony_cyber/` | [Streamline](https://www.streamlinehq.com) „Cyber Color”, pakiet npm [`@iconify-json/streamline-cyber-color`](https://www.npmjs.com/package/@iconify-json/streamline-cyber-color); warianty neon przekolorowane | CC BY 4.0, uznanie autorstwa: Streamline (streamlinehq.com) |

Przy licencji **CC BY 4.0** trzeba podać autora. Jeśli użyjecie płytki drukowanej lub ikon Streamline, dodajcie na ostatnim slajdzie lub w notatkach np.: *„Ikony: Streamline (CC BY 4.0), wzór: Hero Patterns (CC BY 4.0), zdjęcia Ziemi: NASA”*.
