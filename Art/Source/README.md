# Исходники арта из ChatGPT

Сюда складываются картинки, сгенерированные по инструкциям для каждого персонажа.
Эта папка лежит вне `Assets`, поэтому Unity её не импортирует. В Unity попадают только
собранные `.psb` (в `Assets/Art/Characters/`).

| Папка | Что положить |
|---|---|
| `Room/` | `Room_Empty.png` — комната с пустыми креслами; `table_scene.png` — исходная картинка стола |
| `Marco/` | `Marco_Full`, `Marco_Head`, `Marco_Torso`, `Marco_ArmRight`, `Marco_Cigar`, `Marco_ArmLeft`, `Marco_Avatar` |
| `Laura/` | `Laura_Full`, `Laura_Head`, `Laura_Torso`, `Laura_Arms`, `Laura_Hands`, `Laura_Avatar` |
| `Billy/` | `Billy_Full`, `Billy_Hat`, `Billy_Head`, `Billy_Torso`, `Billy_Arms`, `Billy_Hands`, `Billy_Avatar` |
| `Knight/` | `Knight_Full`, `Knight_Helmet`, `Knight_Torso`, `Knight_Arms`, `Knight_Gauntlets`, `Knight_Avatar` |
| `FX/` | `Smoke.png`, `Sparkle.png`, `CardBack.png` |

Все файлы — PNG с прозрачным фоном, как их отдал ChatGPT, без обработки.

## Сборка в PSD

`python3 Tools/assemble_character.py Marco Laura Billy Knight` совмещает части с картинкой
`<Имя>_Full.png` и пишет `Assets/Art/Characters/<Имя>.psd` для Unity. Превью и отчёт по каждому
персонажу лежат в `Art/Build/<Имя>/`.

| Персонаж | Состояние |
|---|---|
| Дон Марко | собран |
| Лаура | собрана |
| Рыцарь | собран |
| Комната | `Room_Empty.png` → `Assets/Art/Background/Room_Empty.png` (2000×923) |
| Билли | не собран: `Billy_Torso.png` нарисован в другом повороте, а голова и шляпа под другим углом |

### Как переделать Билли

Нужны две картинки, сделанные **редактированием** `Billy_Full.png`, а не новой генерацией.
Тогда поза и размер совпадут один в один. В чате с Билли прикрепите `Billy_Full.png` и отправьте:

```
Edit this exact image. Do not redraw it: keep the same pose, size, angle and framing.
Remove the hat and both arms with the hands. Paint the head and hair that the hat was covering,
and the white shirt, brown vest and red neckerchief that the arms were covering.
Transparent background PNG.
```

Сохраните как `Billy_Torso.png` (замените старый). Затем новым сообщением, снова прикрепив `Billy_Full.png`:

```
Edit this exact image. Do not redraw it: keep the same position, size and angle.
Keep ONLY the cowboy hat and erase everything else. Transparent background PNG.
```

Сохраните как `Billy_Hat.png` (замените старый).
