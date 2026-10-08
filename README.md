# Bazaar Blot

Карточная игра Blot (Unity). Сейчас здесь первая сцена: открытие стола.

- `Docs/Art/ChatGPT-Prompts.md` — промпты для ChatGPT: фон без персонажей, персонажи по слоям, эффекты.
- `Docs/Unity-Setup.md` — как собрать сцену в Unity.
- `Assets/Scripts/TableIntro/` — скрипты сцены: подключение игроков, свет, жесты, тасовка, раздача 3-2-3.
- `Docs/Prototype/` — браузерный прототип сцены (откройте `index.html` через локальный сервер).
- `Prototype/` — кликабельный прототип игры в рамке iPhone (852×393): «Tap to play» → сплеш → лобби → выбор комнаты → стол, где можно сыграть в блот с тремя ботами до 301. Обычный HTML/CSS/JS, без сборки: откройте `Prototype/index.html`. Подробности в `Prototype/README.md`.
- `Blender/Splash/` — превиз сплеш-ролика в Blender (`blot_splash_v2.py`, `.blend`) и `splash_fx.py`, который собирает финальный сплеш: воронка, логотип, звук.
