# Сцена «Открытие стола» в Unity

Скрипты лежат в `Assets/Scripts/TableIntro/`. Они повторяют браузерный прототип:
игроки подключаются, над каждым загорается свет, персонаж здоровается, Дон Марко тасует
и раздаёт 32 карты пачками 3-2-3, ваши карты уходят в руку веером.

Сцену можно собрать на заглушках сразу. Персонажей подставите, когда будет арт
(см. `Docs/Art/ChatGPT-Prompts.md`).

## 1. Проект и пакеты

1. Unity 2022.3 LTS или Unity 6, шаблон **2D (URP)**.
2. Package Manager: **2D Animation**, **2D PSD Importer**, **TextMeshPro**.
3. **DOTween** (бесплатный, Asset Store). После импорта: Tools → Demigiant → DOTween Utility Panel →
   Setup DOTween.
4. Скопируйте папку `Assets/Scripts/TableIntro` в проект.

## 2. Камера и фон

- Main Camera: Orthographic. Подберите Size так, чтобы фон влезал по ширине.
- `Background`: SpriteRenderer с комнатой **без персонажей**. Sorting Layer `Background`.
- Sorting Layers по порядку: `Background`, `Characters`, `Cards`, `FX`.

## 3. Свет (URP 2D)

- `Global Light 2D`: это `globalLight` у директора. Цвет тёплый, например `#FFD9B0`.
- `Fireplace Light`: Point Light 2D у камина, оранжевый, плюс компонент **LightFlicker**.
- На каждом кресле Point Light 2D: это `seatLight` у места.

## 4. Места за столом

Для каждого из четырёх кресел создайте объект `Seat_Top`, `Seat_Left`, `Seat_Right`, `Seat_Bottom`
с компонентом **SeatController**:

| Поле | Что положить |
|---|---|
| `playerName`, `rating`, `greeting` | Дон Марко / 2310 / «Добро пожаловать за мой стол» и т.д. |
| `animator` | Animator персонажа (пока можно заглушку-спрайт с пустым Animator) |
| `characterRenderers` | все SpriteRenderer персонажа (для проявления) |
| `idleActions` | компонент **IdleActionPicker** на персонаже |
| `appearSparkles` | Particle System с искрами |
| `seatLight` | Point Light 2D над креслом |
| `nameplate`, `nameplateStatus`, `dealerBadge` | табличка с именем (CanvasGroup + TMP_Text + значок «СДАЁТ») |
| `bubble`, `bubbleText` | пузырь с репликой (CanvasGroup + TMP_Text) |
| `pileAnchor` | пустой объект на столе перед игроком. Ось X (красная) — вдоль стороны стола |

Таблички и пузыри проще делать в **World Space Canvas** над каждым креслом, тогда они сами
стоят на месте при любом разрешении.

## 5. Анимации персонажа

1. Готовые `Marco.psd`, `Laura.psd`, `Knight.psd` уже лежат в `Assets/Art/Characters/`
   (собраны скриптом `Tools/assemble_character.py`). Выберите файл, в инспекторе в выпадающем
   списке импортёра выберите **PSD Importer** (для `.psd` Unity по умолчанию берёт обычный
   Texture Importer), включите **Character Rig** и **Use Layer Grouping** выключите.
   Скрытые слои (`HandL_Cyber_FingersUp` и т.п.) — запасные кисти для жестов.
2. Откройте **Skinning Editor** и поставьте кости: торс, шея и голова, каждая рука
   (плечо, предплечье, кисть). Привяжите слои к костям (Auto Geometry → Auto Weights).
3. Запасные кисти (`HandR_Scratch`, `HandL_Cyber_FingersUp`...) поставьте через
   **Sprite Library + Sprite Resolver**, чтобы в клипе переключать спрайт кисти.
4. Animator Controller:
   - `Idle` (по умолчанию, зацикленный, лёгкое дыхание);
   - `Appear` (масштаб 0.95 → 1.03 → 1, 0.4 с), по триггеру `Appear`;
   - `Greet` (кивок, касание шляпы и т.п.), по триггеру `Greet`;
   - жесты по триггерам, из каждого обратно в `Idle`:

| Персонаж | Триггеры для IdleActionPicker |
|---|---|
| Дон Марко | `Puff` (вес 2), `Drum` |
| Лаура | `TiltHead`, `Tap`, `TouchHair` |
| Билли | `Scratch` (вес 2), `AdjustHat`, `Lean` |
| Рыцарь | `LookAround`, `Drum`, `Stretch` |

5. В клипе `Puff` у Дона Марко добавьте два Animation Event: `Inhale` (сигара у губ)
   и `Exhale` (рука пошла вниз). Их принимает **CigarFX** на кончике сигары.

## 6. Карты

1. Лицевые стороны: 32 спрайта в порядке ♠ 7…A, ♥ 7…A, ♣ 7…A, ♦ 7…A (как в `CardDealer.faces`).
   Удобно собрать их в Sprite Atlas.
2. Префаб `Card`: SpriteRenderer (Sorting Layer `Cards`) + BoxCollider2D + компонент **Card**.
3. Объект `CardDealer` с компонентом **CardDealer**:
   - `deckSpot` — точка в центре стола;
   - `handAnchor` — точка внизу по центру экрана (под краем экрана, чтобы веер выглядывал);
   - `sfx` — AudioSource, `flicks` — 3–4 коротких звука карты.

## 7. Директор

Объект `TableIntro` с компонентом **TableIntroDirector**:

- `localSeat` = `Seat_Bottom` (рыцарь, «Вы»);
- `joinOrder` = Left, Top, Right (вы входите первым);
- `dealer` = `Seat_Top`;
- `dealOrder` = Left, Bottom, Right, Top (против часовой стрелки от сдающего);
- `deckOrigin` — точка у рук Дона Марко;
- `blackScreen` — чёрная картинка на весь экран в Screen Space Canvas (CanvasGroup);
- `phaseLabel`, `scorePanel`, `nextStagePanel` — элементы интерфейса.

Нажмите Play: сцена идёт сама (`demoJoin` включён).
В игре выключите `demoJoin` и вызывайте `PlayerJoined(seat)` из сетевого кода.

## 8. Звук

- Камин: AudioSource на камине, **Loop**, настоящая запись потрескивания (например freesound.org,
  лицензия CC0). Spatial Blend 0, громкость около 0.4.
- Карты: 3–4 варианта щелчка, скрипт сам меняет высоту тона.
- Всё сведите через Audio Mixer: группы `Ambience`, `Cards`, `UI`.

## 9. Готовые ассеты

Всё ниже уже лежит в репозитории, генерировать в ChatGPT не нужно.

| Путь | Что | Куда подключить |
|---|---|---|
| `Assets/Art/FX/Smoke.png` | клуб дыма | Particle System дыма сигары: Renderer → Material с этой текстурой (шейдер `Sprites/Default` или `Universal Render Pipeline/2D/Sprite-Unlit-Default`) |
| `Assets/Art/FX/Sparkle.png` | искра-звёздочка | Particle System появления игрока (`appearSparkles`) |
| `Assets/Art/FX/Ember.png` | уголёк | искры над камином |
| `Assets/Art/FX/Glow.png` | мягкое свечение | огонёк сигары, ореол вокруг кибер-глаза (спрайт с аддитивным материалом) |
| `Assets/Art/Cards/*.png` | 32 карты (7–туз) + `Back.png` | `CardDealer.faces` в порядке ♠ ♥ ♣ ♦, внутри масти 07, 08, 09, 10, Jack, Queen, King, Ace; `CardDealer.back` = `Back.png` |
| `Assets/Audio/CardFlick_1..4.wav` | щелчок карты | `CardDealer.flicks` |
| `Assets/Audio/CardShuffle.wav` | тасовка | проиграть в начале `CardDealer.Shuffle` |
| `Assets/Audio/PlayerJoin.wav` | звон при входе игрока | в `SeatController.Join` |
| `Assets/Audio/Fireplace_Loop.wav` | камин, 20 с, бесшовная петля | AudioSource на камине, Loop включён |

Звуки синтезированы, они годятся для прототипа. Для релиза камин лучше заменить настоящей записью.
Лицевые стороны карт — набор Vectorized Playing Cards (LGPL), см. `Assets/Art/Cards/LICENSE.txt`.

Импорт карт: Texture Type = Sprite (2D and UI), Pixels Per Unit подберите так, чтобы карта
на столе была нужного размера (для фона 2000 px шириной примерно 450).
