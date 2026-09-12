# Ashspace — ISSUES

**Aktualne koordynaty wydania (2026-09-10): 2.0.0**, bez SNAPSHOT. Zależności uzgodniono dla całego zestawu bibliotek; 545 testów na Java 21 przeszło bez błędów. [Wersje, sumy artefaktów i dowody](../Ashnav/VERIFICATION.md#release-version-alignment). Bez operacji Git i publikacji. Wcześniejsze wpisy poniżej zachowują historyczne wersje i wyniki.

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
| [SPACE-007](#space-007) | P1 | ROZSZERZENIE | Usuwanie ramek i poddrzew |
| [SPACE-008](#space-008) | P1 | ROZSZERZENIE | Niezmienny graf do kompletnych zapytań |
| [SPACE-009](#space-009) | P1 | ROZSZERZENIE | Siatka związana z ruchomą ramką |
| [SPACE-010](#space-010) | P1 | KOREKTA | Transformacje względem wspólnego przodka |
| [SPACE-011](#space-011) | P1 | KOREKTA | Zachować stronę granicy, gdy iloraz współrzędnej zanika do zera |
| [SPACE-012](#space-012) | P2 | DECYZJA | Zachować kształt prymitywów przy konwersjach ramek |

<a id="space-001"></a>

## SPACE-001 — Uzgodnić GridSpaceMapper3 z VoxelSpace i ChunkScheme

**Status:** GOTOWE

**Priorytet:** P1

**Dowód:** testy i inspekcja — [weryfikacja 2026-09-10](VERIFICATION.md)

**Kontrakt:** sekcje 3.2, 3.3, 4.2, 4.3

**Gdzie:** [GridSpaceMapper3.java](src/main/java/nsk/nu/ashspace/api/grid/GridSpaceMapper3.java), [ChunkLocalIndexer.java](src/main/java/nsk/nu/ashspace/implementation/grid/ChunkLocalIndexer.java), [GridMappingIntegrationTest.java](src/test/java/nsk/nu/ashspace/integration/grid/GridMappingIntegrationTest.java).

**Stan podczas przeglądu:** worldToChunk deleguje do ChunkScheme, lecz cellToChunk i adresy chunk-local korzystają z ChunkLocalIndexer utworzonego wyłącznie z chunkSize. Mapper używa mnożenia przez 1/cellSize, a VoxelSpace w Ashgrid dzielenia przez scale. Równoważność matematyczna nie zastępuje sprawdzenia zaokrągleń przy granicach.

**Znaczenie:** Ten sam punkt powinien uzyskać zgodny adres komórki i chunka niezależnie od wybranej publicznej drogi konwersji.

**Praca do wykonania:** Sprawdź, czy kontrakt ChunkScheme wymaga dokładnie standardowego podziału XZ, czy dopuszcza inne schematy. Ujednolić delegację albo jawnie ograniczyć obsługiwane warianty zgodnie z rzeczywistym kontraktem. Uzgodnij jednostki i przypadki graniczne z [GRID-002](../Ashgrid/ISSUES.md#grid-002); nie rozbudowuj API o niepotrzebne warianty.

**Warunki zamknięcia:**

- [x] Dla wspieranego schematu worldToChunk(p), cellToChunk(worldToCell(p)) i worldToChunkAddress(p).chunk() opisują ten sam chunk.
- [x] Testy obejmują ujemne punkty, granice chunków, przesunięty początek, kilka cellSize oraz wartości tuż po obu stronach granicy.
- [x] Udokumentowano wspierany zakres ChunkScheme i różnicę jednostek world/grid; zgodność z VoxelSpace sprawdzono dla wspólnego zakresu.

**Powiązania:** [GRID-002](../Ashgrid/ISSUES.md#grid-002) i [GRID-006](../Ashgrid/ISSUES.md#grid-006); wynik potrzebny [NAV-003](../Ashnav/ISSUES.md#nav-003). Ashgrid nie może zależeć produkcyjnie od Ashspace.

<a id="space-002"></a>

## SPACE-002 — Zabezpieczyć kontrakt sztywnej transformacji

**Status:** GOTOWE

**Priorytet:** P1

**Dowód:** testy i inspekcja — [weryfikacja 2026-09-10](VERIFICATION.md)

**Kontrakt:** sekcje 3.3, 4.2, 4.3, 4.5

**Gdzie:** [RigidTransform3.java](src/main/java/nsk/nu/ashspace/api/transform/RigidTransform3.java), [RigidTransform3ApiTest.java](src/test/java/nsk/nu/ashspace/api/transform/RigidTransform3ApiTest.java), [FrameSpaceIntegrationTest.java](src/test/java/nsk/nu/ashspace/integration/space/FrameSpaceIntegrationTest.java).

**Stan podczas przeglądu:** Konstruktor sprawdza skończoność składowych, a następnie używa Quaternion.normalized z Ashcore. To nie dowodzi jednostkowej długości po normalizacji bardzo dużych składowych; zero w Ashcore jest zamieniane na identity. Dokumentacja then już jasno wskazuje kolejność i należy ją zachować.

**Znaczenie:** Sztywny obrót ma zachowywać długość. Przy wadliwej normalizacji może zgnieść wektor albo utracić odwracalność.

**Praca do wykonania:** Uzgodnij z [CORE-001](../Ashcore/ISSUES.md#core-001) zachowanie zero/skrajne wartości. Sprawdź postwarunek konstrukcji, inverse, then, rozróżnienie punktu i kierunku oraz założenia transformacji Ray. Nie wprowadzaj własnej, rozbieżnej biblioteki kwaternionów.

**Warunki zamknięcia:**

- [x] Transformacja z dużymi skończonymi składowymi rotacji zachowuje kontrakt albo jest jawnie odrzucana; zero ma opisane zachowanie.
- [x] Testy transform/inverse i złożenia sprawdzają zachowanie długości/kierunku w uzasadnionej tolerancji.
- [x] Punkt podlega przesunięciu, kierunek nie; brak przypadkowej obsługi skali/shear w klasie rigid.

**Powiązania:** [CORE-001](../Ashcore/ISSUES.md#core-001) i [CORE-004](../Ashcore/ISSUES.md#core-004); po zmianie sprawdź [TRACE-002](../Ashtrace/ISSUES.md#trace-002).

<a id="space-003"></a>

## SPACE-003 — Opisać i sprawdzić granice dokładności mapowania

**Status:** GOTOWE

**Priorytet:** P1

**Dowód:** testy i inspekcja — [weryfikacja 2026-09-10](VERIFICATION.md)

**Kontrakt:** sekcje 4.1, 4.3, 4.5

**Gdzie:** [GridSpaceMapper3.java](src/main/java/nsk/nu/ashspace/api/grid/GridSpaceMapper3.java), [FrameGraph3.java](src/main/java/nsk/nu/ashspace/api/frame/FrameGraph3.java), [GridSpaceMapper3ApiTest.java](src/test/java/nsk/nu/ashspace/api/grid/GridSpaceMapper3ApiTest.java), [README.md](README.md).

**Stan podczas przeglądu:** Mapper ma walidację finite i zakresu int oraz używa nextDown dla końca zakresu. Te zabezpieczenia już istnieją. Nadal trzeba sprawdzić obliczenia pośrednie: odwrotność bardzo małego cellSize, odejmowanie dużych współrzędnych i mapowanie blisko granicy.

**Znaczenie:** Daleko od początku świata dwa bliskie punkty mogą po zaokrągleniu stać się nierozróżnialne. Powtarzalność obliczeń nie zwiększa liczby dostępnych cyfr.

**Praca do wykonania:** Określ obsługiwany zakres wartości i zachowanie poza nim. Sprawdź reprezentowalność półotwartego max przy granicy int. Udokumentuj utratę dokładności i tolerancje round-trip, bez obietnicy dowolnie dużego świata.

**Warunki zamknięcia:**

- [x] Są testy cellCenter→worldToCell w deklarowanym zakresie oraz odrzucania skrajnych/niepoprawnych wartości bez cichego zawijania indeksów.
- [x] Przypadki dokładnie na granicy i nextUp/nextDown rozstrzygają zgodnie z udokumentowanym modelem.
- [x] README określa środowisko/stabilny stan wymagane dla determinizmu i ograniczenia dokładności.

**Powiązania:** [CORE-002](../Ashcore/ISSUES.md#core-002) oraz [CORE-004](../Ashcore/ISSUES.md#core-004) i [GRID-002](../Ashgrid/ISSUES.md#grid-002); testy integracyjne [NAV-003](../Ashnav/ISSUES.md#nav-003) powinny używać tych samych przykładów.

<a id="space-004"></a>

## SPACE-004 — Doprecyzować mutację ramek i konserwatywne obwiednie

**Status:** GOTOWE

**Priorytet:** P1

**Dowód:** testy i inspekcja — [weryfikacja 2026-09-10](VERIFICATION.md)

**Kontrakt:** sekcje 3.3, 4.1, 4.2

**Gdzie:** [FrameGraph3.java](src/main/java/nsk/nu/ashspace/api/frame/FrameGraph3.java), [GeometryTransforms3.java](src/main/java/nsk/nu/ashspace/api/geometry/GeometryTransforms3.java), [SpaceConverter3.java](src/main/java/nsk/nu/ashspace/api/space/SpaceConverter3.java), [GeometryTransforms3ApiTest.java](src/test/java/nsk/nu/ashspace/api/geometry/GeometryTransforms3ApiTest.java), [README.md](README.md).

**Stan podczas przeglądu:** README już informuje o mutable, not thread-safe FrameGraph3 i konserwatywnej obwiedni obróconego AABB. Te trafne ograniczenia powinny być spójne w API i używane przez konsumentów.

**Znaczenie:** Obrócone pudełko obejmuje się większym pudełkiem ustawionym według osi świata. Dodatkowo zmiana położenia pojazdu między dwiema częściami zapytania może rozłączyć ich wyniki.

**Praca do wykonania:** Uzupełnij zasady stabilności grafu podczas całego zapytania, aktualizacji relacji rodzic/dziecko i spójności transformacji. Sprawdź, że wszystkie narożniki mieszczą się w wynikowej obwiedni. Wyjaśnij koszt zależny od głębokości ramki.

**Warunki zamknięcia:**

- [x] Testy obwiedni zawierają narożniki obróconego pudełka, a dokumentacja nie nazywa wyniku dokładnym kształtem ani minimalnym zbiorem komórek.
- [x] Umowa mutacji i odpowiedzialność za stabilny stan w zapytaniu są jawne; nie obiecano thread-safety bez implementacji.
- [x] Testy relacji ramek i złożenia obejmują brak ramki, cykl i aktualizację transformacji zgodnie z API.

**Powiązania:** [TRACE-002](../Ashtrace/ISSUES.md#trace-002) musi używać jednej spójnej konfiguracji ramek podczas obliczania obiektów i zasłaniania.

<a id="space-005"></a>

## SPACE-005 — Zachować zgodność publicznych typów i przykładów

**Status:** GOTOWE

**Priorytet:** P1

**Dowód:** testy i inspekcja — [weryfikacja 2026-09-10](VERIFICATION.md)

**Kontrakt:** sekcje 5, 5.1, 8

**Gdzie:** [README.md](README.md), [GridSpaceMapper3.java](src/main/java/nsk/nu/ashspace/api/grid/GridSpaceMapper3.java), [RigidTransform3.java](src/main/java/nsk/nu/ashspace/api/transform/RigidTransform3.java).

**Stan podczas przeglądu:** Quick start importuje SquareXZChunkScheme z implementation Ashgrid. Publiczne API Ashspace eksponuje typy niższych bibliotek, więc jego zgodność zależy także od ich kontraktów.

**Znaczenie:** Aktualizacja samej zależności może zmienić mapowanie lub akceptowane dane, mimo niezmienionej sygnatury Ashspace.

**Praca do wykonania:** Opisz wspierane API i minimalne/sprawdzone zestawy zależności. Zachowaj prosty przykład pojazdu i wyjaśnij obrót+przesunięcie oraz rolę rozmiaru komórki. Nie przenoś klasy Ashgrid do Ashspace tylko z powodu nazwy pakietu.

**Warunki zamknięcia:**

- [x] Quick start kompiluje się na docelowych wersjach zależności.
- [x] Opis stabilności obejmuje zmiany walidacji i wyników mapowania; wybrano właściwą wersję biblioteki.
- [x] Zapisano ewentualną migrację dla Ashtrace i Ashnav, bez nadpisywania opublikowanej wersji.

**Powiązania:** [GRID-006](../Ashgrid/ISSUES.md#grid-006) i [CORE-006](../Ashcore/ISSUES.md#core-006); konsumenci: [TRACE-005](../Ashtrace/ISSUES.md#trace-005) i [NAV-007](../Ashnav/ISSUES.md#nav-007).

<a id="space-006"></a>

## SPACE-006 — Dostosować CI, pakowanie i dowody wydania

**Status:** GOTOWE

**Priorytet:** P1

**Dowód:** testy i inspekcja — [weryfikacja 2026-09-10](VERIFICATION.md)

**Kontrakt:** sekcje 2, 4.5, 6

**Gdzie:** [pom.xml](pom.xml), [.github/workflows/maven.yml](.github/workflows/maven.yml), [.github/workflows/publish.yml](.github/workflows/publish.yml), [README.md](README.md).

**Stan podczas przeglądu:** CI uruchamia mvn -B package, a kontrakt wymaga clean verify. POM ustawia source/target 21 bez jawnego przypięcia maven-compiler-plugin; Javadoc ma doclint=none i failOnError=false. Profil central istnieje, lecz pokazany workflow deploy nie aktywuje go i publikuje do GitHub Packages. Początkowa gałąź: main; CI filtruje master. To rozbieżność lokalnego stanu z konfiguracją: potwierdź faktyczną gałąź domyślną na serwerze przed zmianą filtrów.

**Znaczenie:** Zielony wynik obecnego CI nie jest dowodem wykonania całej bramki jakości ani obecności artefaktu w Maven Central. Brak automatyzacji Central nie dowodzi braku publikacji ręcznej.

**Praca do wykonania:** Ustaw rzeczywistą bramkę clean verify, dobierz przypięty compiler plugin i release 21, sprawdź generowanie dokumentacji oraz jednoznaczną identyfikację artefaktów. Potwierdź utrzymywane gałęzie, docelowe wersje zależności i sposób publikacji do każdej używanej destynacji. JUnit pozostaw w test scope; nie usuwaj go w imię niezależności produkcyjnej.

**Warunki zamknięcia:**

- [x] Zapisano wynik mvn -B clean verify z wymaganymi testami oraz wersje JDK/Maven; CI obejmuje faktycznie utrzymywane gałęzie i PR-y.
- [x] Główny JAR, sources, Javadoc i wymagane zasoby są sprawdzone. Błędny Javadoc nie jest po cichu uznawany za poprawny; nie trzeba przy tym mechanicznie włączać każdej reguły stylistycznej doclint.
- [x] Wskazano używane cele publikacji, tag/wersję i dowody dostępności albo jawnie pozostawiono publikację jako niezweryfikowaną. Sam deploy nie służy jako test poprawek.
- [x] Sprawdzono efektywne zależności i ich scope; test integracyjny korzysta z zamierzonej wersji dolnej warstwy, a nie przypadkowej starej kopii z lokalnego Maven.

**Powiązania:** Wspólny wzorzec: [TEMPLATE-001](../Ashtemplate/ISSUES.md#template-001) i [TEMPLATE-002](../Ashtemplate/ISSUES.md#template-002). Tę korektę można wykonać niezależnie od napraw algorytmów. Istniejącego numeru wydania nie nadpisuj innym artefaktem.

<a id="space-007"></a>

## SPACE-007 — Usuwanie ramek i poddrzew

**Status:** GOTOWE

**Kontrakt:** sekcje 3.3, 4.2; rozszerzenie zlecone 2026-09-10 po ocenie kompletności.

**Powód:** po usunięciu pojazdu z aplikacji nie było możliwości usunięcia odpowiadających mu ramek bez przebudowy całego grafu.

**Realizacja:** `FrameGraph3.remove` usuwa wyłącznie istniejący liść. `removeSubtree` usuwa wskazaną ramkę i jej bieżących potomków, zwracając ich liczbę. Korzeń jest chroniony. Nieprawidłowe żądania nie zmieniają grafu. Kolejność ocalałych definicji pozostaje niezmieniona; ponowne użycie usuniętego ID dodaje definicję na końcu.

- [x] Testy odrzucenia korzenia, braku ramki, null i liścia z dziećmi oraz niezmienności stanu po błędzie.
- [x] Testy reparentingu, usuwania właściwego poddrzewa, pozostałych gałęzi i ponownego użycia ID.
- [x] Test iteracyjnego usunięcia poddrzewa 2048 ramek.

**Dowód:** `FrameGraph3LifecycleTest`, [VERIFICATION.md](VERIFICATION.md).

<a id="space-008"></a>

## SPACE-008 — Niezmienny graf do kompletnych zapytań

**Status:** GOTOWE

**Kontrakt:** sekcje 3.3, 4.1, 4.2; rozszerzenie zlecone 2026-09-10.

**Powód:** kopia `frames()` zawierała dane, ale nie dawała gotowego grafu do wielu spójnych konwersji wykonywanych przez istniejące adaptery.

**Realizacja:** `FrameGraph3.snapshot()` tworzy zamrożony graf tego samego typu, przyjmowany przez istniejące konwertery. `isSnapshot()` ujawnia jego stan. Wszystkie mutatory odrzucają operacje na kopii. Kopiowanie wymaga stabilnego źródła; późniejsze równoległe odczyty po bezpiecznym przekazaniu kopii nie wymagają blokowania grafu. Nie są obliczane ani buforowane transformacje do świata.

- [x] Snapshot pozostaje poprawny po zmianie, reparentingu i usunięciu ramek źródła.
- [x] Testy wszystkich mutatorów, niezmiennej mapy definicji, kolejności i kompatybilności istniejących adapterów.
- [x] Równoległe odczyty oraz lokalne zapytanie przy nieprzedstawialnej transformacji wspólnej gałęzi do świata.

**Dowód:** `FrameGraph3SnapshotTest`, `FrameGridSpaceMapper3ApiTest`, [VERIFICATION.md](VERIFICATION.md). Snapshot nie obejmuje magazynu voxeli ani indeksu śledzenia; konsument odpowiada za ich spójność.

<a id="space-009"></a>

## SPACE-009 — Siatka związana z ruchomą ramką

**Status:** GOTOWE

**Kontrakt:** sekcje 3.2, 3.3, 4.3; rozszerzenie zlecone 2026-09-10, bez zmiany właściciela magazynowania danych.

**Powód:** istniejący `GridSpaceMapper3.localToCell` mapuje lokalny punkt do siatki świata. Siatka bloków wewnątrz obracającego się statku wymaga jawnego powiązania jej osi i początku z ramką statku.

**Realizacja:** nowy `FrameGridSpaceMapper3` łączy graf, `gridFrame`, lokalny `gridOrigin`, rozmiar komórki i standardowy rozmiar chunka XZ. Mapuje punkty i AABB ze świata lub wskazanej ramki na indeksy oraz środki/narożniki komórek do świata lub wskazanej ramki. Zachowuje zasady floor, half-open i walidację istniejącego mappera. `snapshot()` zamraża konfigurację ramek adaptera.

- [x] Obrót, przesunięcie, lokalny początek i rozmiar komórki; zgodność dróg cell/chunk/chunk-local.
- [x] Współrzędne świata i innej ramki, granice ujemne i nextUp/nextDown, konserwatywne obwiednie.
- [x] Ruch i usunięcie ramki, frozen/live, nieprawidłowe dane oraz odzyskiwanie środka komórki w innej ramce.
- [x] Integracja z magazynem `HashSparseGrid3i` Ashgrid: nowa pozycja świata po ruchu/obrocie wskazuje ten sam zapisany blok.

**Dowód:** `FrameGridSpaceMapper3ApiTest`, `MovingGridIntegrationTest`, przykład README skompilowany i uruchomiony z JAR-a przez `PackagedArtifactIT`.

<a id="space-010"></a>

## SPACE-010 — Transformacje względem wspólnego przodka

**Status:** GOTOWE

**Kontrakt:** sekcje 3.3, 4.3, 4.5; korekta zlecona 2026-09-10.

**Reprodukcja:** dwa narzędzia o przesunięciach 1 i 2 względem statku przy przesunięciu świata `2^54` uzyskiwały zerową odległość względną. Lokalna konwersja mogła też zawieść przez przepełnienie wspólnej gałęzi, której wynik nie wymaga.

**Realizacja:** graf ustala najbliższego wspólnego przodka przez relacje rodziców i głębokości. Składa wyłącznie transformacje na potrzebnych odcinkach poniżej tego przodka. Koszt wyszukania pozostaje O(hs + ht), dodatkowa pamięć żywa O(1); arytmetyka dotyczy tylko krawędzi ścieżki względnej. `rootFrom` zachowuje granice konwersji do świata. Kolejność i kierunek transformacji pozostają zgodne z API; ostatnie bity wyników mogą się zmienić.

- [x] Odtworzenie obu problemów na poprzednim kodzie: 12 testów ramki, 1 porażka i 1 błąd wykonania.
- [x] Poprawne lokalne wyniki przy ogromnej lub przepełniającej się wspólnej gałęzi.
- [x] Testy różnych głębokości, nieprzemiennych obrotów, obu kierunków, reparentingu i snapshotów.
- [x] Testy Ashtrace i Ashnav wykonane z nowym JAR-em zamiast zależności Ashspace 1.0.0; źródła obu bibliotek niezmienione.

**Dowód:** `FrameGraph3ApiTest`, `FrameGridSpaceMapper3ApiTest`, [VERIFICATION.md](VERIFICATION.md). To ochrona lokalnych obliczeń; nie odzyskuje cyfr utraconych wcześniej w punkcie świata.

<a id="space-011"></a>

## SPACE-011 — Zachować stronę granicy, gdy iloraz współrzędnej zanika do zera

**Status:** GOTOWE

**Reprodukcja:** uruchomiony z Ashtrace, niezmieniony `GridMappingIntegrationTest` nie przeszedł
z Ashgrid 1.3.0-SNAPSHOT: przy `cellSize=2`, początku zero i współrzędnej `-Double.MIN_VALUE`
`VoxelSpace` wybiera komórkę -1, a oba mappery Ashspace wybierały 0. Iloraz zaokrągla się do -0.0.
Nowe testy odtworzyły także błędnie pusty zakres dla AABB od -Double.MIN_VALUE do zera.

**Znaczenie i zakres zgody:** przypadek skrajny numerycznie, lecz narusza zgodność wyboru komórki
i zakresu między warstwami. Uznano go za P1 blokujący zgodność integracji. Użytkownik rozszerzył
początkowy zakres Ashtrace, zezwalając na naprawę istotnego błędu u właściciela. Utworzono gałąź
`fix/ashspace-grid-underflow-integration-20260910` i checkpoint `51f5340` przed zmianami.

**Realizacja:** wewnętrzny iloraz używany wyłącznie do floor/ceil zachowuje znak niezerowego offsetu,
jeśli dzielenie zwróciło zero. Nie zmieniono zwykłych wartości ani publicznych sygnatur. Dotyczy
punktów, adresów chunków oraz dodatnich/ujemnych końców zakresów przy zerze. Nie odtwarza pełnej
odległości geometrycznej ani wszystkich zakresów nierozróżnialnych po zaokrągleniu.

Zależności POM podniesiono do sprawdzonego zestawu Ashcore 1.1.0-SNAPSHOT / Ashgrid 1.3.0-SNAPSHOT;
dawna bramka korzystała z Ashgrid 1.2.0 i nie wykrywała rozbieżności z nowszym VoxelSpace.
Wersja Ashspace pozostaje rozwojowa 2.0.0-SNAPSHOT; wymaga dostarczenia tych zależności do CI.

- [x] Reprodukcja: 7 testów mapowania, 3 porażki przed poprawką.
- [x] Nowe testy punktów i zakresów przy zerze, trzech rozmiarów komórki i dwóch początków siatki.
- [x] `clean verify dependency:tree`: 74 testy + 2 testy artefaktów, PASS na JDK 21.
- [x] Dokumentacja opisuje zachowanie i aktualne wersje zależności.

Testy konsumenta i niezmienione testy sąsiednich bibliotek są uruchamiane z nowym JAR-em w Ashtrace;
dalsze dowody znajdują się w [VERIFICATION.md](VERIFICATION.md) oraz [raporcie Ashtrace](../Ashtrace/VERIFICATION.md).

## Uwagi o zakresie kolizji — 2026-09-10

Użytkownik zlecił uzupełnienie backlogu w granicach rewizji 2.0. Nowa propozycja dotyczy konwersji geometrii, nie kontrolera ruchu ani wykrywania kolizji. Punkt odniesienia: lokalne źródła odczytane 2026-09-10; zgodnie z bieżącą instrukcją nie wykonywano operacji Git ani nowego checkpointu.

<a id="space-012"></a>

## SPACE-012 — Zachować kształt prymitywów przy konwersjach ramek

**Status:** GOTOWE

**Priorytet:** P2

**Dowód:** testy i inspekcja — [weryfikacja 2026-09-10](VERIFICATION.md#2026-09-10--shape-preserving-conversions-space-012)

**Kontrakt:** sekcje 2, 3.3, 4.2–4.5, 5, 7

**Gdzie:** [GeometryTransforms3.java](src/main/java/nsk/nu/ashspace/api/geometry/GeometryTransforms3.java), [SpaceConverter3.java](src/main/java/nsk/nu/ashspace/api/space/SpaceConverter3.java), [RigidTransform3.java](src/main/java/nsk/nu/ashspace/api/transform/RigidTransform3.java), testy geometry/space i [README.md](README.md).

**Stan podczas przeglądu:** GeometryTransforms3 przekształcał promienie, odcinki i sfery. axisAlignedBox zwraca obwiednię ośmiu przekształconych narożników i jawnie dopuszcza dodatkową przestrzeń. W chwili tworzenia propozycji Ashcore miał kapsułę, ale nie miał jeszcze typu OBB. Konwersja AABB do konserwatywnej obwiedni działała zgodnie z kontraktem.

**Praca do wykonania:** Rozważyć małe konwersje zachowujące kształt: kapsułę przez przekształcenie obu końców z zachowaniem promienia oraz, po ustaleniu CORE-011, AABB→OBB i OBB→OBB przez sztywny obrót i przesunięcie. Użyć geometrii Ashcore i istniejącej algebry RigidTransform3. W nazwach i opisie rozdzielić zachowany kształt od konserwatywnej obwiedni. Skala i ścinanie pozostają poza modelem.

Nie dodawać własnych testów przecięć OBB, typu OBB należącego do wyższej warstwy, indeksu kolizji, zegara animacji ani podparcia postaci. Przeliczenie punktu ze starego ustawienia do nowego jest już możliwe przez złożenie transformacji; nie stanowi brakującego kontrolera ruchomego pokładu.

**Realizacja 2026-09-10:** `GeometryTransforms3` i `SpaceConverter3` udostępniają `capsule` oraz przeciążenia `orientedBox` dla AABB i OBB. Kapsuła zachowuje promień, OBB zachowuje półwymiary; AABB otrzymuje środek i półwymiary z granic. Składanie orientacji stosuje najpierw obrót bryły, potem obrót konwersji. Użyto istniejącej algebry `RigidTransform3` i ustalonego `OrientedBox` z Ashcore **1.2.0-SNAPSHOT**, po zamknięciu CORE-011. Zależność Ashgrid pozostaje **1.3.0-SNAPSHOT**. Sumy obu faktycznie użytych JAR-ów zapisano w VERIFICATION.md.

Zachowanie kształtu podlega zaokrągleniom double. Skrajnie mała półdługość może zaniknąć do zera; duże przesunięcie może zgubić małe różnice. Konwersje odrzucają nieskończone wyniki i niepoprawne granice, wspierają poprawne bryły zdegenerowane. Dotychczasowe `axisAlignedBox`, mapowanie siatki i umowa live/snapshot pozostają bez zmian. Nie dodano algorytmów przecięć; przykład punktu w obwiedni poza bryłą używa istniejącego zapytania Ashcore.

**Warunki zamknięcia:**

- [x] Zapisano wspierane konwersje. Część OBB używa ustalonego API i zidentyfikowanego artefaktu Ashcore; konwersję kapsuły można rozstrzygnąć niezależnie.
- [x] Testy obejmują przesunięcie, obroty 45°/90°/180°, ramy zagnieżdżone, odwrotność oraz niepoprawne i zdegenerowane dane według kontraktu prymitywu.
- [x] Potwierdzono zachowanie promienia kapsuły, wymiarów OBB i punktów powierzchni w uzasadnionej tolerancji. Przykład odróżnia punkt w osiowej obwiedni od punktu w obróconej bryle.
- [x] Nowe operacje respektują istniejące zasady live/snapshot i spójności zapytania; nie deklarują migawki storage ani indeksu.
- [x] Istniejące axisAlignedBox i mapowanie do komórek zachowują konserwatywną semantykę. Opisano precyzję, koszty i zgodność; implementacja przechodzi testy oraz clean verify.

**Powiązania:** [CORE-011](../Ashcore/ISSUES.md#core-011), [SPACE-002](#space-002), [SPACE-004](#space-004), [SPACE-008](#space-008), [TRACE-012](../Ashtrace/ISSUES.md#trace-012). Propozycja P2 nie otwiera ponownie zamkniętych zadań. Jej odrzucenie zapisać jako NIE DOTYCZY z uzasadnieniem; dopisanie planu nie oznacza GOTOWE.

## Stan przekazania i dziennik sesji

**Na 2026-09-09:** wszystkie zadania pozostają OTWARTE. Utworzono dokumentację; nie wprowadzono korekt kodu, nie wykonano buildów bibliotek ani publikacji. Nie uznawaj samego dodania ISSUES.md za realizację żadnego zadania.

**Sugerowany start:** [SPACE-001](../Ashspace/ISSUES.md#space-001); następnie [SPACE-002](../Ashspace/ISSUES.md#space-002) i [SPACE-003](../Ashspace/ISSUES.md#space-003).

Po kolejnej sesji dopisz wiersz i uzupełnij statusy odpowiednich zadań. Zapisz także nieudane próby i ograniczenia środowiska; nie opisuj kontroli niewykonanej jako zaliczonej.

| Data / commit | ID i decyzja | Zmiana | Polecenie / test i rzeczywisty wynik | Pozostałe zależności / następny krok |
| --- | --- | --- | --- | --- |
| 2026-09-09 / punkt odniesienia powyżej | Wszystkie: OTWARTE | Utworzenie planu korekt | Inspekcja statyczna; testów bibliotek nie uruchomiono | Rozpocząć od wskazanego P1 |

### Korekta 2026-09-10

**SPACE-001–SPACE-006: GOTOWE w zakresie lokalnej korekty.** Szczegółowe decyzje, pokrycie testami, środowisko, sumy artefaktów, zależności i ograniczenia zapisano w [VERIFICATION.md](VERIFICATION.md). Status nie oznacza publikacji ani wykonania nowych workflow na GitHubie.

Pracę wykonano wyłącznie w Ashspace, na gałęzi `fix/ashspace-contract-v2-20260910`, po commicie zabezpieczającym `b976a15`. Zachowano publiczne typy i sygnatury. Wersja robocza to **2.0.0-SNAPSHOT** ze względu na ostrzejszą walidację i zmienione wyniki mapowania na granicach. Poprzedniego wydania nie nadpisano.

| Data / commit | ID i decyzja | Zmiana | Polecenie / test i rzeczywisty wynik | Pozostałe zależności / następny krok |
| --- | --- | --- | --- | --- |
| 2026-09-10 / commit zawierający ten wpis; checkpoint `b976a15` | SPACE-001, SPACE-003: GOTOWE | Dzielenie zgodne z VoxelSpace; wszystkie adresy przez komórkę; standardowy XZ z przechwyconym chunkSize; walidacja finite, końców i długości zakresów; granice precyzji | Testy granic ujemnych, nextUp/nextDown, różnych rozmiarów/początków, subnormalnych rozmiarów, int i round-trip; końcowe `clean verify`: PASS | GRID-002/GRID-006 pozostają u Ashgrid; integracja NAV-003 przy aktualizacji konsumenta |
| 2026-09-10 / ten sam zestaw zmian | SPACE-002, SPACE-004: GOTOWE | Kontrola zakresu normalizacji i normy wynikowej; zero zachowuje identity; walidacja punktów/wektorów; brakująca ramka do siebie odrzucana; umowa snapshotów, mutacji i obwiedni | Testy długości, inverse/then, Ray, cykli, reparentingu, kolejności i narożników; końcowe `clean verify`: PASS | CORE-001 pozostaje u Ashcore; TRACE-002 wymaga stabilnego grafu podczas całego zapytania |
| 2026-09-10 / ten sam zestaw zmian | SPACE-005, SPACE-006: GOTOWE lokalnie | README i migracja 2.0.0-SNAPSHOT; release 21 i przypięte pluginy; Javadoc bez ukrywania błędów; test gotowego JAR, źródeł, dokumentacji i przykładu; CI obejmuje main i PR | JDK Adoptium 21.0.12.1+1, Maven 3.9.9; 54 testy + 2 testy artefaktów, 0 błędów/pominięć; actionlint 1.7.7 PASS; zależności z pustego izolowanego repo Maven Central | Publikacja do Packages/Central i zdalne wykonanie CI NIEZWERYFIKOWANE; konsumentów nie zmieniano; przed wydaniem właściciel sprawdza tag/wersję/destynacje |

Pierwsze 31 istniejących testów przechodziło. Dodane regresje przed naprawą dały 6 porażek i 1 błąd wykonania w 39 testach; po korekcie wszystkie przeszły. Końcowe 56 testów obejmuje późniejsze rozszerzenia. Nie używano deploy jako testu ani lokalnego builda sąsiedniej biblioteki jako zamiennika opublikowanej zależności.

### Uzupełnienie funkcjonalne 2026-09-10

**SPACE-007–SPACE-010: GOTOWE.** Gałąź `feat/ashspace-frame-completeness-20260910`, checkpoint `8b4747c`, kod wyjściowy `79a66f3`. Zachowano wersję roboczą `2.0.0-SNAPSHOT`; nie publikowano artefaktów. Dodano usuwanie ramek, queryable snapshots, mapper siatki w ramce i obliczenia przez wspólnego przodka. Wszystkie stare publiczne sygnatury pozostają dostępne.

`clean verify` Ashspace: **72 testy + 2 testy gotowych artefaktów, PASS**. Istniejące testy konsumentów z tym samym JAR-em: **Ashtrace 43, Ashnav 29, PASS**. Kopie źródeł uruchomiono pod `Ashspace/.verification/consumer-tests`; tylko ich skopiowane POM-y wskazywały roboczą zależność 2.0.0-SNAPSHOT. Sumy 63 oryginalnych plików źródłowych/testowych/POM pozostały niezmienione. Szczegóły i commity wejściowe: [VERIFICATION.md](VERIFICATION.md).

Testy konsumentów obejmują współpracę bibliotek, m.in. frame-aware tracing i world-to-grid navigation. Nie wymagają osobnej aplikacji. Nie uruchamiano gry/pluginu, benchmarków ani publikacji. Snapshot dotyczy wyłącznie ramek; dane siatki i pozostałe indeksy nadal wymagają spójnego stanu po stronie aplikacji.

### Przegląd zakresu kolizji 2026-09-10

**Historyczny stan przeglądu:** SPACE-001–SPACE-011 zachowały dotychczasowe statusy. SPACE-012 było otwartą propozycją P2, nie błędem obecnego axisAlignedBox ani warunkiem wydania ówczesnego zakresu.

| Data / commit | ID i decyzja | Zmiana | Polecenie / test i rzeczywisty wynik | Pozostałe zależności / następny krok |
| --- | --- | --- | --- | --- |
| 2026-09-10 / bez operacji Git, zgodnie z instrukcją użytkownika | SPACE-012: OTWARTE, P2 / DECYZJA | Konwersje zachowujące kształt kapsuły i przyszłego OBB; wyłącznie backlog | Inspekcja źródeł; kontrola struktury, odnośników i zachowania wcześniejszej treści. Testów bibliotek i buildów nie uruchamiano | Rozstrzygnąć konwersję kapsuły; część OBB zależy od CORE-011. |

### Konwersje zachowujące kształt — 2026-09-10

**SPACE-012: GOTOWE.** Praca wyłącznie w Ashspace, gałąź `fix/ashspace-shape-conversions-20260910`, checkpoint `93c28e3` zapisujący zastany backlog, kod wyjściowy `f652173`. Wersja pozostaje nieopublikowanym `2.0.0-SNAPSHOT`. SPACE-001–SPACE-011 zachowują zamknięte statusy.

| Data / commit | ID i decyzja | Zmiana | Polecenie / test i rzeczywisty wynik | Pozostałe zależności / następny krok |
| --- | --- | --- | --- | --- |
| 2026-09-10 / commit zawierający ten wpis; checkpoint `93c28e3` | SPACE-012: GOTOWE | Konwersja kapsuły, AABB→OBB i OBB→OBB; Ashcore 1.2.0-SNAPSHOT; testy, przykłady, precyzja i zgodność; korekta nieaktualnego opisu odwróconych AABB | Baseline: 74 PASS. Nowe testy: 13 PASS. `clean verify dependency:tree`: 87 + 2 PASS, JDK 21/Maven 3.9.9. `javap -public`: 6 nowych metod, 0 usuniętych sygnatur. README skompilowane i uruchomione z JAR-a | W CI i u konsumentów dostarczyć wskazane artefakty Ashcore/Ashgrid; publikacja i zdalne CI niewykonywane. Adoptowanie API przez TRACE-012 należy do Ashtrace. |

Nie było nieudanych testów ani buildów w tej sesji. Katalog nadrzędny nie jest repozytorium Git; operacje wykonano w Ashspace, a ostrzeżenie właściciela Git rozwiązano lokalnym dla polecenia `safe.directory`. Szczegóły testów, polecenia, ograniczenia i sumy artefaktów: [VERIFICATION.md](VERIFICATION.md#2026-09-10--shape-preserving-conversions-space-012).
