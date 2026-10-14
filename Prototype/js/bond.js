// Bond mode (Figma 1952:1246), the third tab of the stage select. You play as a pair: pick a friend
// from "Your bonds" on the right by dragging them onto the empty card, or tap + and then a friend
// (while picking, the list lights up). When the bond forms, the friend's card flies in, the link
// snaps shut with a burst of light, and the record and PLAY NOW slide up. Tap the friend's card to
// undo the bond.
(function () {
  var screen = document.querySelector('[data-screen-id="play"]');
  var B = 'assets/bond/';
  var FRIENDS = [
    { name: 'AramAce', img: 'f-aramace', rank: 'Contender I', lv: 42, online: true, level: 75, rec: [24, 16, 4] },
    { name: 'Vazgen2004', img: 'f-vazgen2004', rank: 'Contender IV', lv: 34, level: 41, rec: [12, 7, 3] },
    { name: 'GTumasyan', img: 'f-gtumasyan', rank: 'Hotshot II', lv: 26, level: 18, rec: [9, 4, 2] },
    { name: 'HasmikOG', img: 'f-hasmikog', rank: 'New Face IV', lv: 4, level: 3, rec: [2, 1, 1] },
    { name: 'GarikAV', img: 'f-garikav', rank: 'New Face IV', lv: 32, level: 27, rec: [15, 8, 5] }
  ];

  var root = document.createElement('div');
  root.className = 'bd';
  root.innerHTML =
    '<div class="bd-main" data-bd-main>' +
      '<div class="bd-side bd-side--l"></div><div class="bd-side bd-side--l"></div><div class="bd-side bd-side--r"></div><div class="bd-side bd-side--r"></div>' +
      '<div class="bd-glow"></div>' +
      '<div class="bd-pair">' +
        '<div class="bd-me"><img src="' + B + 'me.webp" alt=""></div>' +
        '<div class="bd-mate" data-bd-slot>' +
          '<button class="bd-add" type="button" data-bd-add aria-label="Выбрать бонд"><img src="' + B + 'plus.svg" alt=""></button>' +
          '<img class="bd-mate_img" alt="">' +
        '</div>' +
        '<div class="bd-link"><img class="bd-link_off" src="' + B + 'link-off.svg" alt=""><img class="bd-link_on" src="' + B + 'link40.svg" alt="">' +
          '<i class="bd-ring"></i><i class="bd-ring bd-ring--2"></i><span class="bd-sparks"></span></div>' +
        '<div class="bd-names"><p class="bd-title">Artexcb &amp; <span data-bd-name>...</span></p>' +
          '<p class="bd-sub"><span data-bd-sub>Select bond to start playing</span></p></div>' +
      '</div>' +
      '<div class="bd-bottom">' +
        '<div class="bd-record"><span>Matches <b data-rec>24</b></span><i></i><span>Wins <b data-rec>16</b></span><i></i><span>Best streak <b data-rec>4</b></span></div>' +
        '<button class="bd-play" type="button" data-bd-play><img class="bd-play_fx" src="assets/lobby/figma/play-effects.webp" alt="">' +
          '<span class="bd-play_label"><img src="assets/lobby/figma/swords.webp" alt="">Play now</span><span class="bd-play_inner"></span></button>' +
      '</div>' +
    '</div>' +
    '<div class="bd-friends" data-bd-friends>' +
      '<div class="bd-friends_head"><p>Your bonds</p><button class="bd-sort" type="button" aria-label="Сортировка"><img src="' + B + 'sort.svg" alt=""></button></div>' +
      '<p class="bd-hint">Tap a friend or drag them to the card</p>' +
      '<div class="bd-list">' + FRIENDS.map(function (f, i) {
        return '<div class="bd-row' + (f.online ? ' is-online' : '') + '" data-friend="' + i + '" style="--i:' + i + '"><img class="bd-row_av" src="' + B + f.img + '.webp" alt="" draggable="false">' +
          '<div class="bd-row_text"><b>' + f.name + (f.online ? '<i class="bd-online"></i>' : '') + '</b><span>' + f.rank + ' • Lv. ' + f.lv + '</span></div>' +
          '<span class="bd-row_btn"><img class="bd-ic-plane" src="' + B + 'plane.svg" alt=""></span><span class="bd-row_btn"><img class="bd-ic-add" src="' + B + 'user-plus.svg" alt=""></span></div>';
      }).join('') + '</div>' +
    '</div>';
  screen.appendChild(root);

  // 12 sparks around the link, each on its own angle
  var sparks = root.querySelector('.bd-sparks');
  for (var k = 0; k < 12; k++) {
    var s = document.createElement('i');
    s.style.setProperty('--a', (k * 30 + (k % 2) * 12) + 'deg');
    s.style.setProperty('--d', (46 + (k % 3) * 14) + 'px');
    sparks.appendChild(s);
  }

  var main = root.querySelector('[data-bd-main]');
  var list = root.querySelector('[data-bd-friends]');
  var slot = root.querySelector('[data-bd-slot]');
  var mateImg = root.querySelector('.bd-mate_img');
  var nameEl = root.querySelector('[data-bd-name]');
  var subEl = root.querySelector('[data-bd-sub]');
  var rows = Array.prototype.slice.call(root.querySelectorAll('.bd-row'));
  var current = -1;

  function sfx(n, v) { if (window.BlotSound && BlotSound.sfx) BlotSound.sfx(n, v); }
  function picking(on) { list.classList.toggle('is-picking', on); slot.classList.toggle('is-waiting', on); }

  function bond(i) {
    var f = FRIENDS[i];
    current = i;
    picking(false);
    rows.forEach(function (r, k) { r.classList.toggle('is-bonded', k === i); });
    mateImg.src = B + f.img + '.webp';
    nameEl.textContent = f.name;
    subEl.textContent = 'Bond level ' + f.level;
    root.querySelectorAll('[data-rec]').forEach(function (el, k) { el.textContent = f.rec[k]; });
    main.classList.remove('is-bonding');
    void main.offsetWidth;
    main.classList.add('is-bonded', 'is-bonding');
    clearTimeout(bond.t);
    bond.t = setTimeout(function () { main.classList.remove('is-bonding'); }, 1600);
    sfx('whoosh', 0.5);
    setTimeout(function () { sfx('shimmer', 0.7); sfx('coin', 0.5); }, 380);
  }
  function unbond() {
    current = -1;
    main.classList.remove('is-bonded', 'is-bonding');
    rows.forEach(function (r) { r.classList.remove('is-bonded'); });
    nameEl.textContent = '...';
    subEl.textContent = 'Select bond to start playing';
  }

  root.querySelector('[data-bd-add]').addEventListener('click', function (e) {
    e.stopPropagation();
    picking(!list.classList.contains('is-picking'));
  });
  slot.addEventListener('click', function () { if (current >= 0) unbond(); });
  root.addEventListener('click', function (e) {
    if (e.target.closest('[data-bd-play]')) { screen.querySelector('[data-stage-play]').click(); return; }
    if (!e.target.closest('.bd-row, [data-bd-add]')) picking(false);
  });

  // ---- drag a friend onto the card (a tap on a row bonds right away)
  var drag = null;
  function scale() { var r = screen.getBoundingClientRect(); return r.width / screen.offsetWidth || 1; }
  function overSlot(x, y) {
    var r = slot.getBoundingClientRect(), pad = 30;
    return x > r.left - pad && x < r.right + pad && y > r.top - pad && y < r.bottom + pad;
  }
  rows.forEach(function (row, i) {
    row.addEventListener('pointerdown', function (e) {
      if (e.button) return;
      drag = { i: i, x0: e.clientX, y0: e.clientY, ghost: null, row: row };
    });
  });
  function stopDrag() {
    if (!drag) return;
    drag.row.classList.remove('is-dragging');
    slot.classList.remove('is-target', 'is-hot');
    drag = null;
  }
  window.addEventListener('pointermove', function (e) {
    if (!drag) return;
    var dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
    // an up/down swipe scrolls the list; a sideways one picks the friend up
    if (!drag.ghost && Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx)) { drag = null; return; }
    if (!drag.ghost && Math.abs(dx) > 8) {
      drag.ghost = document.createElement('img');
      drag.ghost.className = 'bd-ghost';
      drag.ghost.src = B + FRIENDS[drag.i].img + '.webp';
      screen.appendChild(drag.ghost);
      drag.row.classList.add('is-dragging');
      slot.classList.add('is-target');
      picking(false);
      sfx('pop', 0.4);
    }
    if (drag.ghost) {
      e.preventDefault();
      var sr = screen.getBoundingClientRect(), k = scale();
      drag.ghost.style.left = ((e.clientX - sr.left) / k) + 'px';
      drag.ghost.style.top = ((e.clientY - sr.top) / k) + 'px';
      slot.classList.toggle('is-hot', overSlot(e.clientX, e.clientY));
    }
  }, { passive: false });
  window.addEventListener('pointerup', function (e) {
    if (!drag) return;
    var d = drag;
    stopDrag();
    if (!d.ghost) { if (e.target.closest('.bd-row') === d.row) bond(d.i); return; }   // a tap
    var hit = overSlot(e.clientX, e.clientY);
    d.ghost.classList.add(hit ? 'is-dropped' : 'is-back');
    setTimeout(function () { d.ghost.remove(); }, 260);
    if (hit) bond(d.i);
  });
  window.addEventListener('pointercancel', function () {
    if (drag && drag.ghost) drag.ghost.remove();
    stopDrag();
  });

  // ---- the Bond tab switches the screen into bond mode
  screen.querySelectorAll('.st-tab').forEach(function (t) {
    t.addEventListener('click', function () {
      var on = t.textContent.trim() === 'Bond';
      if (on && !screen.classList.contains('is-bond')) {
        root.classList.remove('bd-enter'); void root.offsetWidth; root.classList.add('bd-enter');
      }
      screen.classList.toggle('is-bond', on);
      if (!on) picking(false);
    });
  });
})();
