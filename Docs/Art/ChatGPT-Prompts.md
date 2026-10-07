# Арт для сцены «Открытие стола»: промпты для ChatGPT

Цель: получить из одной сгенерированной картинки стола арт, который можно анимировать в Unity
(2D Animation + PSD Importer). Для этого нужны:

1. комната с **пустыми** креслами (фон);
2. каждый персонаж **по частям** (голова, торс, руки, кисти, шляпа, сигара), где под каждой частью
   **дорисовано** то, что она закрывала;
3. несколько запасных кистей рук для жестов (почесать бороду, постучать пальцами);
4. мелочи: дым, искры, рубашка карты, аватарки.

Промпты написаны по-английски: генератор картинок понимает их точнее. Пояснения на русском.

---

## 0. Как работать в ChatGPT

- Один персонаж — один чат. Так модель держит стиль и детали.
- В начале каждого чата **прикрепите картинку стола** (`table_scene.png`) и лист персонажа,
  если он есть (как три вида мафиози: спереди, с сигарой, сзади).
- Первым сообщением вставьте «Правила стиля» из пункта 1. Дальше работайте промптами из нужного раздела.
- Всегда просите **PNG с прозрачным фоном** (`transparent background`). Если фон всё равно получился
  сплошным, допишите: *"Make the background fully transparent, no floor, no shadow."*
- ChatGPT отдаёт картинки фиксированного размера (например 1536×1024). Это нормально: в Photoshop или
  Krita вы подгоняете масштаб, положив часть поверх исходного кадра с прозрачностью 50%.
- Если деталь съехала (другой галстук, лишний палец), используйте **редактирование выделенной области**
  в ChatGPT: выделите кистью место и напишите, что исправить.

---

## 1. Правила стиля (вставлять первым сообщением в каждом чате)

```
You are helping me produce game art for a 2D card game "Bazaar Blot".
The attached image is the master reference. Match it exactly in every output:

- Camera: strict top-down view (90°, looking straight down) over a card table, orthographic feel.
- Style: painterly, semi-realistic stylized game illustration, clean shapes, soft brush shading,
  crisp edges, like a premium mobile/PC card game.
- Lighting: warm evening interior light. Main warm light from a fireplace on the LEFT,
  secondary warm lamp light from the TOP-RIGHT. Soft shadows fall to the lower-right.
- Palette: deep reds, walnut browns, brass/gold accents, warm skin tones.
- Scale: keep each character exactly the same size and proportions as in the reference.
- Never add text, logos, watermarks, frames or extra objects.
- When I ask for a part, draw ONLY that part, on a fully transparent background, PNG.

Reply "Ready" and wait for my next request.
```

---

## 2. Фон: комната с пустыми креслами

Прикрепите картинку стола.

```
Edit the attached image. Remove all four people (the man in the pinstripe suit at the top,
the white-haired woman on the left, the cowboy on the right and the armored knight at the bottom).
Leave the four brown leather armchairs exactly where they are, now empty, with their seats,
cushions and backrests fully visible and naturally lit.
Keep EVERYTHING else identical: same framing, same aspect ratio, same table, rug, fireplace,
bookshelf, lamp, side table with whisky glass and ashtray, same lighting and colors.
Do not move, resize or redraw anything else.
```

Если кресла получились разными или съехали, проще сделать по одному креслу. Вырежьте кусок с
персонажем (с запасом) и отправьте его:

```
Edit the attached crop. Remove the person sitting in the leather armchair and paint the empty
armchair underneath: seat cushion, backrest and armrests, matching the leather, studs and
lighting already visible. Keep the rug, floor and table edge exactly as they are.
Same size and framing as the input.
```

Затем вставьте кусок обратно в фон с мягким краем.

---

## 3. Персонажи по частям

Общий принцип для каждого персонажа:

1. **Целиком на прозрачном фоне**: эталон для сборки.
2. **Части по одной**, каждая на прозрачном фоне, в том же масштабе и положении.
3. **Торс без рук**: с дорисованной одеждой там, где лежали руки.
4. **Запасные кисти** для жестов.

### 3.1 Общий промпт «персонаж целиком»

```
From the attached table scene, redraw ONLY the [CHARACTER] exactly as he/she sits there:
same top-down angle, same pose, same size, same clothes and colors.
Remove the armchair, table and floor. Transparent background PNG.
```

### 3.2 Общий промпт «одна часть»

```
Using the [CHARACTER] you just drew as reference, draw ONLY his/her [PART],
in exactly the same position, angle, size and lighting as in that image.
Nothing else in the picture. Transparent background PNG.
```

### 3.3 Общий промпт «торс без рук»

```
Draw the [CHARACTER] again in the same pose and size, but WITHOUT arms and hands:
shoulders end at the sleeve seams. Fully paint the parts of the [clothing] that the arms
and hands were covering, so the torso is complete underneath. Transparent background PNG.
```

---

### 3.4 Дон Марко (мафиози, сверху)

Слоты для Unity (названия слоёв в PSB):

| Слой | Что | Для какой анимации |
|---|---|---|
| `Head` | голова с волосами и кибер-половиной лица | кивок, затяжка (голова чуть назад) |
| `Torso` | костюм-тройка, жилет, галстук, без рук | дыхание |
| `ArmR_Upper`, `ArmR_Fore`, `HandR_Cigar` | правая рука, кисть с сигарой | поднести сигару ко рту |
| `Cigar` | сигара отдельно, кончик без огонька | огонёк и дым добавляет Unity |
| `ArmL_Upper`, `ArmL_Fore`, `HandL_Cyber` | левая кибер-рука | постучать пальцами |
| `HandL_Cyber_FingersUp` | кибер-кисть с приподнятыми пальцами | постукивание (замена спрайта) |

Промпты (после «Правил стиля» и «персонажа целиком»):

```
Draw ONLY his head: slicked-back black-and-grey hair, the half-metal cybernetic face plate
with the glowing amber eye, beard. Include the neck down to the shirt collar.
Same top-down angle and size. Transparent background PNG.
```

```
Draw the man again WITHOUT arms and hands. Fully paint the pinstripe suit jacket, waistcoat,
red tie and white shirt that the arms and the cigar were covering. Transparent background PNG.
```

```
Draw ONLY his right arm as three separate pieces placed side by side with some space between them:
1) upper arm (pinstripe sleeve, shoulder to elbow),
2) forearm with the shirt cuff,
3) the hand holding the cigar.
Same top-down angle, size and lighting as in the reference. Transparent background PNG.
```

```
Draw ONLY the cigar on its own: thick brown cigar with a gold band, the tip unlit (dark ash).
Same size as in the reference. Transparent background PNG.
```

```
Draw ONLY his left cybernetic arm as three separate pieces side by side:
1) upper arm in the pinstripe sleeve, 2) forearm with shirt cuff, 3) the mechanical hand
(dark steel with brass joints) resting flat.
Then, next to them, the same mechanical hand with the index and middle fingers raised
as if tapping the table. Transparent background PNG.
```

### 3.5 Лаура (девушка с белыми волосами, слева)

| Слой | Что | Анимация |
|---|---|---|
| `Hair_Back`, `Head`, `Hair_Front` | волосы двумя слоями и лицо | наклон головы, лёгкое качание волос |
| `Torso` | зелёный жакет, без рук | дыхание, наклон вперёд |
| `ArmL_*`, `ArmR_*` | обе руки | — |
| `Hands_Clasped` | сцепленные кисти | исходная поза |
| `HandR_Open`, `HandR_Tapping` | правая кисть раскрыта / пальцы постукивают | постукивание |
| `HandL_HairTouch` | кисть у волос | заправить прядь |

```
Draw ONLY her head and hair as two layers placed side by side:
1) the back part of the voluminous white wavy hair,
2) the face, ear with the gold earring, and the front strands of hair.
Same top-down angle and size as in the reference. Transparent background PNG.
```

```
Draw her again WITHOUT arms and hands. Fully paint the teal jacket and dark top that the arms
were covering. Transparent background PNG.
```

```
Draw ONLY her two forearms with clasped hands resting on the table edge, as in the reference.
Then, next to it, her right hand open and relaxed, and her right hand with fingers slightly
raised as if tapping. Then her left hand raised to the hair, tucking a strand behind the ear.
Same angle, size and lighting. Transparent background PNG.
```

### 3.6 Билли Ривз (ковбой, справа)

| Слой | Что | Анимация |
|---|---|---|
| `Hat` | шляпа отдельно | поправить шляпу, кивок |
| `Head` | голова без шляпы: волосы, усы, лицо | кивок, почесать бороду |
| `Torso` | рубашка, жилет, платок, без рук | дыхание, откинуться |
| `Arm*_Upper`, `Arm*_Fore` | рукава рубашки | — |
| `Hands_Clasped` | сцепленные кисти | исходная поза |
| `HandR_Scratch` | кисть, чешущая подбородок | почесаться |
| `HandR_HatBrim` | кисть, держащая поля шляпы | поправить шляпу |

```
Draw ONLY his cream cowboy hat with the dark leather band, seen from directly above,
same size and angle as in the reference. Transparent background PNG.
```

```
Draw ONLY his head WITHOUT the hat: long wavy brown hair, thick mustache, face seen from above,
as it would look under the hat in the reference. Include the neck and the red neckerchief knot.
Transparent background PNG.
```

```
Draw him again WITHOUT the hat, arms and hands. Fully paint the white shirt, brown vest and
red neckerchief that the arms were covering. Transparent background PNG.
```

```
Draw ONLY his clasped hands with the rolled-up white shirt sleeves, as in the reference.
Next to it, his right hand with fingers bent, scratching a beard (no face, just the hand).
Next to it, his right hand pinching a hat brim between thumb and fingers (no hat, just the hand).
Same angle, size and lighting. Transparent background PNG.
```

### 3.7 Рыцарь (это игрок «Вы», снизу, вид со спины)

| Слой | Что | Анимация |
|---|---|---|
| `Helmet` | шлем | повернуть голову влево и вправо |
| `Torso` | наплечники, кираса со спины, красный плащ | дыхание |
| `ArmL_*`, `ArmR_*` | латные руки | — |
| `Gauntlets_Clasped` | сцепленные латные перчатки | исходная поза |
| `GauntletR_Drum` | перчатка с поднятыми пальцами | постукивание |

```
Draw ONLY his steel knight helmet with brass trim, seen from above and slightly from behind,
same size and angle as in the reference. Transparent background PNG.
```

```
Draw the knight again WITHOUT helmet, arms and gauntlets: shoulders with pauldrons, back plate,
the red cloth at the neck. Paint the armor under where the arms were. Transparent background PNG.
```

```
Draw ONLY his two armored forearms with the clasped steel gauntlets, as in the reference.
Next to it, his right gauntlet flat on the table with the fingers raised as if drumming.
Same angle, size and lighting. Transparent background PNG.
```

---

## 4. Мелочи для эффектов

**Дым (текстура для Particle System)**
```
A single soft wispy puff of cigar smoke, light grey-white, seen from above, centered,
very soft edges that fade to fully transparent. No background. 512x512, transparent PNG.
```

**Искра появления**
```
A small golden magical sparkle / star glint, four soft rays, glowing warm gold center,
fades to fully transparent at the edges. Centered, 256x256, transparent PNG.
```

**Рубашка карты (своя, без логотипов)**
```
Design an original playing card back for a classic casino deck: deep red, a white border,
a dense symmetrical filigree pattern of fine white lines, a round ornamental medallion
in the center, small rosettes in the corners. Perfectly symmetrical top-to-bottom.
No text, no letters, no logos, no people, no animals. Flat front view, card ratio 2.5:3.5,
transparent background around the rounded corners.
```

**Аватарки для табличек с именами** (по одной на персонажа)
```
A circular bust portrait of [CHARACTER] from the reference, three-quarter front view,
same painterly style and colors, warm rim light, simple dark warm-brown background,
centered face. Square 512x512.
```

---

## 5. Сборка в PSB для Unity

1. Откройте в Photoshop или Krita пустой холст размером с фон (например 2000×923).
2. Положите фон с пустыми креслами нижним слоем, кадр с персонажами — над ним с прозрачностью 50%.
3. Каждую часть персонажа подгоните по масштабу и положению к этому кадру.
4. Назовите слои как в таблицах выше (`Head`, `Torso`, `HandR_Cigar`...). Запасные кисти
   (`HandR_Scratch` и т.п.) тоже положите в файл, их можно скрыть.
5. Удалите фон и кадр-подложку. Сохраните **каждого персонажа отдельным файлом `.psb`**:
   `Marco.psb`, `Laura.psb`, `Billy.psb`, `Knight.psb`.
6. Положите файлы в `Assets/Art/Characters/`. Дальше в Unity: см. `Docs/Unity-Setup.md`.

## 6. Проверка перед сборкой

- [ ] Под руками, шляпой и головой всё дорисовано (нет дыр, если часть отодвинуть).
- [ ] Свет на всех частях падает одинаково: слева от камина и справа сверху от лампы.
- [ ] Масштаб частей совпадает с исходным кадром.
- [ ] Нигде нет текста, логотипов и водяных знаков.
