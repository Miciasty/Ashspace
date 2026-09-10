# Ashspace — ISSUES

## Cel pliku

Ten plik powstał 2026-09-09 po przeglądzie wspólnych zasad Blackframe i przyjęciu [blackframe.md, rewizja 2.0](../blackframe.md). Służy do zaplanowania korekt tej biblioteki oraz przekazywania pracy między kolejnymi, niezależnymi sesjami. Nie trzeba znać historii rozmowy: poniżej są powód zadania, miejsca w kodzie, kryteria odbioru i powiązania z innymi projektami.

To lista prac i miejsce zapisu dowodów, a nie dokumentacja gotowych funkcji ani informacja, że błędy już naprawiono. Nie wszystkie pozycje są błędami wykonania: część wymaga doprecyzowania umowy z użytkownikiem lub sprawdzenia istniejących zabezpieczeń. Przegląd obejmował README, POM, workflow i wybrane źródła/testy; nie jest pełnym audytem całego kodu. Podczas przygotowania pliku nie zmieniano implementacji i nie uruchamiano testów bibliotek.

## Punkt odniesienia

- Rola projektu: Układy odniesienia, obroty/przesunięcia i przeliczanie położenia na indeksy siatki.
- Wersja zadeklarowana w lokalnym POM: **1.0.0**. To nie jest potwierdzenie publikacji.
- Stan źródeł podczas przygotowania: **3f1b910** na gałęzi docs/blackframe-contract-v2-20260909; commit zapisuje stan sprzed zmian dokumentacji.
- Zależności: Ashcore 1.0.1 i Ashgrid 1.2.0. Konwencje indeksowania uzgadniaj z Ashgrid; reguły normalizacji z Ashcore.
- Dokument nadrzędny: rewizja **2.0 z 2026-09-09**. Numery sekcji w zadaniach odnoszą się do tej rewizji.

## Jak rozpocząć nową sesję

1. Przeczytaj lokalne AGENTS.md/instrukcje użytkownika, [kontrakt Blackframe](../blackframe.md) i cały ten plik. Jeśli kontraktu brakuje w osobnym klonie, uzyskaj właściwą rewizję przed rozstrzyganiem wspólnych zasad.
2. Sprawdź aktualny Git i różnice względem powyższego punktu odniesienia. W tej pracy obowiązywała instrukcja użytkownika: przed zmianami utworzyć nową gałąź i zacommitować obecną wersję. Zachowaj cudze zmiany; nie resetuj repozytorium. Dla katalogu bez Git nie wymyślaj istniejącego commita.
3. Zacznij od wskazanego P1, odtwórz obserwację i sprawdź istniejące testy. Ustal kontrakt przed korektą zachowania. Wpis INSPEKCJA nie zastępuje reprodukcji.
4. Naprawiaj zadania w granicach tego projektu. Zmianę wspólnego kontraktu prowadź u właściciela niższej warstwy, a potrzebną pracę w innym repozytorium zapisz pod jego ID. Rutynowa poprawka nie wymaga edycji blackframe.md.
5. Po zmianach uruchom odpowiednie testy i końcowe clean verify. Aktualizuj statusy i dziennik poniżej: co zmieniono, rzeczywisty wynik kontroli, decyzje zgodności, pozostałe zależności i następny krok. Nie publikuj artefaktów tylko po to, aby sprawdzić kod.

Zalecana kolejność ustaleń wspólnych: Ashcore → Ashgrid → Ashspace, następnie Ashtrace i Ashnav zgodnie z ich zależnościami. Ashnav nie musi czekać na Ashtrace; niezależne zadania lokalne można podejmować wcześniej. Ashtemplate można poprawiać osobno. Ashmesh nie ma obecnie lokalnego katalogu, więc ten backlog nie zleca jego implementacji.

Maven używa zależności rozstrzygniętych z POM i repozytoriów artefaktów. Zmiana pliku w sąsiednim checkout nie podmienia ich automatycznie. Przy integracji zapisz konkretne wersje, commity i wynik rozstrzygnięcia zależności. Dla próbnego builda dolnej warstwy użyj odróżnialnej wersji roboczej lub izolowanego repozytorium testowego; nie nadpisuj istniejącego wydania inną zawartością.

## Oznaczenia

- **P1** — poprawność, publiczne gwarancje lub wymagana weryfikacja; rozstrzygnąć przed deklaracją zgodności z rewizją 2.0 i następnym wydaniem objętego zakresu.
- **P2** — porządkowanie lub pogłębiona kontrola po pilnych korektach; nie pomijać bez zapisanej decyzji.
- **INSPEKCJA** — potwierdzony zapis lub mechanizm w źródle; podany skutek może wymagać jeszcze testu wykonania.
- **AUDYT** — zakres do sprawdzenia, bez twierdzenia, że wszystkie wymienione miejsca są błędne.
- **DECYZJA** — trzeba wybrać i udokumentować wspierany kontrakt lub migrację.
- Statusy: **OTWARTE**, **W TOKU**, **ZABLOKOWANE** (z konkretną zależnością), **GOTOWE** (z dowodem spełnienia kryteriów), **NIE DOTYCZY** (z uzasadnieniem). Zachowuj identyfikatory po zamknięciu.

## Kolejka

| ID | Priorytet | Typ | Zadanie |
| --- | --- | --- | --- |
| [SPACE-001](#space-001) | P1 | INSPEKCJA | Uzgodnić GridSpaceMapper3 z VoxelSpace i ChunkScheme |
| [SPACE-002](#space-002) | P1 | INSPEKCJA | Zabezpieczyć kontrakt sztywnej transformacji |
| [SPACE-003](#space-003) | P1 | AUDYT | Opisać i sprawdzić granice dokładności mapowania |
| [SPACE-004](#space-004) | P1 | AUDYT | Doprecyzować mutację ramek i konserwatywne obwiednie |
| [SPACE-005](#space-005) | P1 | DECYZJA | Zachować zgodność publicznych typów i przykładów |
| [SPACE-006](#space-006) | P1 | INSPEKCJA | Dostosować CI, pakowanie i dowody wydania |

<a id="space-001"></a>

## SPACE-001 — Uzgodnić GridSpaceMapper3 z VoxelSpace i ChunkScheme

**Status:** OTWARTE  
**Priorytet:** P1  
**Dowód:** INSPEKCJA  
**Kontrakt:** sekcje 3.2, 3.3, 4.2, 4.3

**Gdzie:** [GridSpaceMapper3.java](src/main/java/nsk/nu/ashspace/api/grid/GridSpaceMapper3.java), [ChunkLocalIndexer.java](src/main/java/nsk/nu/ashspace/implementation/grid/ChunkLocalIndexer.java), [GridMappingIntegrationTest.java](src/test/java/nsk/nu/ashspace/integration/grid/GridMappingIntegrationTest.java).

**Stan podczas przeglądu:** worldToChunk deleguje do ChunkScheme, lecz cellToChunk i adresy chunk-local korzystają z ChunkLocalIndexer utworzonego wyłącznie z chunkSize. Mapper używa mnożenia przez 1/cellSize, a VoxelSpace w Ashgrid dzielenia przez scale. Równoważność matematyczna nie zastępuje sprawdzenia zaokrągleń przy granicach.

**Znaczenie:** Ten sam punkt powinien uzyskać zgodny adres komórki i chunka niezależnie od wybranej publicznej drogi konwersji.

**Praca do wykonania:** Sprawdź, czy kontrakt ChunkScheme wymaga dokładnie standardowego podziału XZ, czy dopuszcza inne schematy. Ujednolić delegację albo jawnie ograniczyć obsługiwane warianty zgodnie z rzeczywistym kontraktem. Uzgodnij jednostki i przypadki graniczne z [GRID-002](../Ashgrid/ISSUES.md#grid-002); nie rozbudowuj API o niepotrzebne warianty.

**Warunki zamknięcia:**

- [ ] Dla wspieranego schematu worldToChunk(p), cellToChunk(worldToCell(p)) i worldToChunkAddress(p).chunk() opisują ten sam chunk.
- [ ] Testy obejmują ujemne punkty, granice chunków, przesunięty początek, kilka cellSize oraz wartości tuż po obu stronach granicy.
- [ ] Udokumentowano wspierany zakres ChunkScheme i różnicę jednostek world/grid; zgodność z VoxelSpace sprawdzono dla wspólnego zakresu.

**Powiązania:** [GRID-002](../Ashgrid/ISSUES.md#grid-002) i [GRID-006](../Ashgrid/ISSUES.md#grid-006); wynik potrzebny [NAV-003](../Ashnav/ISSUES.md#nav-003). Ashgrid nie może zależeć produkcyjnie od Ashspace.

<a id="space-002"></a>

## SPACE-002 — Zabezpieczyć kontrakt sztywnej transformacji

**Status:** OTWARTE  
**Priorytet:** P1  
**Dowód:** INSPEKCJA  
**Kontrakt:** sekcje 3.3, 4.2, 4.3, 4.5

**Gdzie:** [RigidTransform3.java](src/main/java/nsk/nu/ashspace/api/transform/RigidTransform3.java), [RigidTransform3ApiTest.java](src/test/java/nsk/nu/ashspace/api/transform/RigidTransform3ApiTest.java), [FrameSpaceIntegrationTest.java](src/test/java/nsk/nu/ashspace/integration/space/FrameSpaceIntegrationTest.java).

**Stan podczas przeglądu:** Konstruktor sprawdza skończoność składowych, a następnie używa Quaternion.normalized z Ashcore. To nie dowodzi jednostkowej długości po normalizacji bardzo dużych składowych; zero w Ashcore jest zamieniane na identity. Dokumentacja then już jasno wskazuje kolejność i należy ją zachować.

**Znaczenie:** Sztywny obrót ma zachowywać długość. Przy wadliwej normalizacji może zgnieść wektor albo utracić odwracalność.

**Praca do wykonania:** Uzgodnij z [CORE-001](../Ashcore/ISSUES.md#core-001) zachowanie zero/skrajne wartości. Sprawdź postwarunek konstrukcji, inverse, then, rozróżnienie punktu i kierunku oraz założenia transformacji Ray. Nie wprowadzaj własnej, rozbieżnej biblioteki kwaternionów.

**Warunki zamknięcia:**

- [ ] Transformacja z dużymi skończonymi składowymi rotacji zachowuje kontrakt albo jest jawnie odrzucana; zero ma opisane zachowanie.
- [ ] Testy transform/inverse i złożenia sprawdzają zachowanie długości/kierunku w uzasadnionej tolerancji.
- [ ] Punkt podlega przesunięciu, kierunek nie; brak przypadkowej obsługi skali/shear w klasie rigid.

**Powiązania:** [CORE-001](../Ashcore/ISSUES.md#core-001) i [CORE-004](../Ashcore/ISSUES.md#core-004); po zmianie sprawdź [TRACE-002](../Ashtrace/ISSUES.md#trace-002).

<a id="space-003"></a>

## SPACE-003 — Opisać i sprawdzić granice dokładności mapowania

**Status:** OTWARTE  
**Priorytet:** P1  
**Dowód:** AUDYT  
**Kontrakt:** sekcje 4.1, 4.3, 4.5

**Gdzie:** [GridSpaceMapper3.java](src/main/java/nsk/nu/ashspace/api/grid/GridSpaceMapper3.java), [FrameGraph3.java](src/main/java/nsk/nu/ashspace/api/frame/FrameGraph3.java), [GridSpaceMapper3ApiTest.java](src/test/java/nsk/nu/ashspace/api/grid/GridSpaceMapper3ApiTest.java), [README.md](README.md).

**Stan podczas przeglądu:** Mapper ma walidację finite i zakresu int oraz używa nextDown dla końca zakresu. Te zabezpieczenia już istnieją. Nadal trzeba sprawdzić obliczenia pośrednie: odwrotność bardzo małego cellSize, odejmowanie dużych współrzędnych i mapowanie blisko granicy.

**Znaczenie:** Daleko od początku świata dwa bliskie punkty mogą po zaokrągleniu stać się nierozróżnialne. Powtarzalność obliczeń nie zwiększa liczby dostępnych cyfr.

**Praca do wykonania:** Określ obsługiwany zakres wartości i zachowanie poza nim. Sprawdź reprezentowalność półotwartego max przy granicy int. Udokumentuj utratę dokładności i tolerancje round-trip, bez obietnicy dowolnie dużego świata.

**Warunki zamknięcia:**

- [ ] Są testy cellCenter→worldToCell w deklarowanym zakresie oraz odrzucania skrajnych/niepoprawnych wartości bez cichego zawijania indeksów.
- [ ] Przypadki dokładnie na granicy i nextUp/nextDown rozstrzygają zgodnie z udokumentowanym modelem.
- [ ] README określa środowisko/stabilny stan wymagane dla determinizmu i ograniczenia dokładności.

**Powiązania:** [CORE-002](../Ashcore/ISSUES.md#core-002) oraz [CORE-004](../Ashcore/ISSUES.md#core-004) i [GRID-002](../Ashgrid/ISSUES.md#grid-002); testy integracyjne [NAV-003](../Ashnav/ISSUES.md#nav-003) powinny używać tych samych przykładów.

<a id="space-004"></a>

## SPACE-004 — Doprecyzować mutację ramek i konserwatywne obwiednie

**Status:** OTWARTE  
**Priorytet:** P1  
**Dowód:** AUDYT  
**Kontrakt:** sekcje 3.3, 4.1, 4.2

**Gdzie:** [FrameGraph3.java](src/main/java/nsk/nu/ashspace/api/frame/FrameGraph3.java), [GeometryTransforms3.java](src/main/java/nsk/nu/ashspace/api/geometry/GeometryTransforms3.java), [SpaceConverter3.java](src/main/java/nsk/nu/ashspace/api/space/SpaceConverter3.java), [GeometryTransforms3ApiTest.java](src/test/java/nsk/nu/ashspace/api/geometry/GeometryTransforms3ApiTest.java), [README.md](README.md).

**Stan podczas przeglądu:** README już informuje o mutable, not thread-safe FrameGraph3 i konserwatywnej obwiedni obróconego AABB. Te trafne ograniczenia powinny być spójne w API i używane przez konsumentów.

**Znaczenie:** Obrócone pudełko obejmuje się większym pudełkiem ustawionym według osi świata. Dodatkowo zmiana położenia pojazdu między dwiema częściami zapytania może rozłączyć ich wyniki.

**Praca do wykonania:** Uzupełnij zasady stabilności grafu podczas całego zapytania, aktualizacji relacji rodzic/dziecko i spójności transformacji. Sprawdź, że wszystkie narożniki mieszczą się w wynikowej obwiedni. Wyjaśnij koszt zależny od głębokości ramki.

**Warunki zamknięcia:**

- [ ] Testy obwiedni zawierają narożniki obróconego pudełka, a dokumentacja nie nazywa wyniku dokładnym kształtem ani minimalnym zbiorem komórek.
- [ ] Umowa mutacji i odpowiedzialność za stabilny stan w zapytaniu są jawne; nie obiecano thread-safety bez implementacji.
- [ ] Testy relacji ramek i złożenia obejmują brak ramki, cykl i aktualizację transformacji zgodnie z API.

**Powiązania:** [TRACE-002](../Ashtrace/ISSUES.md#trace-002) musi używać jednej spójnej konfiguracji ramek podczas obliczania obiektów i zasłaniania.

<a id="space-005"></a>

## SPACE-005 — Zachować zgodność publicznych typów i przykładów

**Status:** OTWARTE  
**Priorytet:** P1  
**Dowód:** DECYZJA  
**Kontrakt:** sekcje 5, 5.1, 8

**Gdzie:** [README.md](README.md), [GridSpaceMapper3.java](src/main/java/nsk/nu/ashspace/api/grid/GridSpaceMapper3.java), [RigidTransform3.java](src/main/java/nsk/nu/ashspace/api/transform/RigidTransform3.java).

**Stan podczas przeglądu:** Quick start importuje SquareXZChunkScheme z implementation Ashgrid. Publiczne API Ashspace eksponuje typy niższych bibliotek, więc jego zgodność zależy także od ich kontraktów.

**Znaczenie:** Aktualizacja samej zależności może zmienić mapowanie lub akceptowane dane, mimo niezmienionej sygnatury Ashspace.

**Praca do wykonania:** Opisz wspierane API i minimalne/sprawdzone zestawy zależności. Zachowaj prosty przykład pojazdu i wyjaśnij obrót+przesunięcie oraz rolę rozmiaru komórki. Nie przenoś klasy Ashgrid do Ashspace tylko z powodu nazwy pakietu.

**Warunki zamknięcia:**

- [ ] Quick start kompiluje się na docelowych wersjach zależności.
- [ ] Opis stabilności obejmuje zmiany walidacji i wyników mapowania; wybrano właściwą wersję biblioteki.
- [ ] Zapisano ewentualną migrację dla Ashtrace i Ashnav, bez nadpisywania opublikowanej wersji.

**Powiązania:** [GRID-006](../Ashgrid/ISSUES.md#grid-006) i [CORE-006](../Ashcore/ISSUES.md#core-006); konsumenci: [TRACE-005](../Ashtrace/ISSUES.md#trace-005) i [NAV-007](../Ashnav/ISSUES.md#nav-007).

<a id="space-006"></a>

## SPACE-006 — Dostosować CI, pakowanie i dowody wydania

**Status:** OTWARTE  
**Priorytet:** P1  
**Dowód:** INSPEKCJA  
**Kontrakt:** sekcje 2, 4.5, 6

**Gdzie:** [pom.xml](pom.xml), [.github/workflows/maven.yml](.github/workflows/maven.yml), [.github/workflows/publish.yml](.github/workflows/publish.yml), [README.md](README.md).

**Stan podczas przeglądu:** CI uruchamia mvn -B package, a kontrakt wymaga clean verify. POM ustawia source/target 21 bez jawnego przypięcia maven-compiler-plugin; Javadoc ma doclint=none i failOnError=false. Profil central istnieje, lecz pokazany workflow deploy nie aktywuje go i publikuje do GitHub Packages. Początkowa gałąź: main; CI filtruje master. To rozbieżność lokalnego stanu z konfiguracją: potwierdź faktyczną gałąź domyślną na serwerze przed zmianą filtrów.

**Znaczenie:** Zielony wynik obecnego CI nie jest dowodem wykonania całej bramki jakości ani obecności artefaktu w Maven Central. Brak automatyzacji Central nie dowodzi braku publikacji ręcznej.

**Praca do wykonania:** Ustaw rzeczywistą bramkę clean verify, dobierz przypięty compiler plugin i release 21, sprawdź generowanie dokumentacji oraz jednoznaczną identyfikację artefaktów. Potwierdź utrzymywane gałęzie, docelowe wersje zależności i sposób publikacji do każdej używanej destynacji. JUnit pozostaw w test scope; nie usuwaj go w imię niezależności produkcyjnej.

**Warunki zamknięcia:**

- [ ] Zapisano wynik mvn -B clean verify z wymaganymi testami oraz wersje JDK/Maven; CI obejmuje faktycznie utrzymywane gałęzie i PR-y.
- [ ] Główny JAR, sources, Javadoc i wymagane zasoby są sprawdzone. Błędny Javadoc nie jest po cichu uznawany za poprawny; nie trzeba przy tym mechanicznie włączać każdej reguły stylistycznej doclint.
- [ ] Wskazano używane cele publikacji, tag/wersję i dowody dostępności albo jawnie pozostawiono publikację jako niezweryfikowaną. Sam deploy nie służy jako test poprawek.
- [ ] Sprawdzono efektywne zależności i ich scope; test integracyjny korzysta z zamierzonej wersji dolnej warstwy, a nie przypadkowej starej kopii z lokalnego Maven.

**Powiązania:** Wspólny wzorzec: [TEMPLATE-001](../Ashtemplate/ISSUES.md#template-001) i [TEMPLATE-002](../Ashtemplate/ISSUES.md#template-002). Tę korektę można wykonać niezależnie od napraw algorytmów. Istniejącego numeru wydania nie nadpisuj innym artefaktem.

## Stan przekazania i dziennik sesji

**Na 2026-09-09:** wszystkie zadania pozostają OTWARTE. Utworzono dokumentację; nie wprowadzono korekt kodu, nie wykonano buildów bibliotek ani publikacji. Nie uznawaj samego dodania ISSUES.md za realizację żadnego zadania.

**Sugerowany start:** [SPACE-001](../Ashspace/ISSUES.md#space-001); następnie [SPACE-002](../Ashspace/ISSUES.md#space-002) i [SPACE-003](../Ashspace/ISSUES.md#space-003).

Po kolejnej sesji dopisz wiersz i uzupełnij statusy odpowiednich zadań. Zapisz także nieudane próby i ograniczenia środowiska; nie opisuj kontroli niewykonanej jako zaliczonej.

| Data / commit | ID i decyzja | Zmiana | Polecenie / test i rzeczywisty wynik | Pozostałe zależności / następny krok |
| --- | --- | --- | --- | --- |
| 2026-09-09 / punkt odniesienia powyżej | Wszystkie: OTWARTE | Utworzenie planu korekt | Inspekcja statyczna; testów bibliotek nie uruchomiono | Rozpocząć od wskazanego P1 |
