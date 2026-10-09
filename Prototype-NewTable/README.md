# Blot Bazar — prototype with the new table

A copy of `../Prototype` (start screen, splash, lobby, Quick Game, the playable Blot game to 301)
with the table from Figma "Table - In Play" (node 1868:456): dark cloth with an ornamental frame,
three characters holding their cards fanned in from the screen edges, metal nameplates (the lit one,
with a running timer bar, is whose turn it is), last trick and score boxes, 40px icon buttons.

Open `index.html` in a browser (no build step, works from the file system).

- `js/table.js` — the new table: characters and cards on one canvas (scene 2000x923), seating, deal,
  opponents' fans, your hand arc, tricks; the view API that `js/game.js` drives.
- `css/table.css` — background, HUD, nameplates, bid / result panels, speech clouds.
- `assets/table/` — `bg.webp` (the flattened table design), `players/` (character art), `hud/`
  (button, nameplates, icons), `ui/suits/` (suit discs), `cards/play/` (the deck).
- The side players sit 24 px further in than in the mockup, so the left one clears the iPhone island.
