// Game table, new layout (Figma "Table - In Play", node 1868:456): a dark cloth with an
// ornamental frame, three characters holding their cards fanned in from the screen edges, your
// hand at the bottom. The players take their seats one by one, then js/game.js runs the game
// through the `view` API below (deal, play a card, take a trick...). Opened by the Play button
// on the stage select.
// The characters and every card are drawn on one canvas in scene coordinates: 2000x923, the
// 852x393 screen times F. The background and the HUD are HTML (css/table.css).
(function () {
  var A = 'assets/table/';
  var W = 2000, H = 923, F = W / 852;
  var screen = document.querySelector('[data-screen-id="table"]');
  var cv = screen.querySelector('canvas'), ctx = cv.getContext('2d');
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The canvas has as many pixels as the screen shows it with (up to 3x on an iPhone), so
  // nothing is stretched; it is resized when the window or the device frame scale changes.
  cv.width = 1704; cv.height = 786;
  // Browser zoom shows up in devicePixelRatio, pinch zoom in visualViewport.scale.
  function sizeCanvas() {
    var r = cv.getBoundingClientRect();
    if (!r.width) return;
    var zoom = (window.visualViewport && window.visualViewport.scale) || 1;
    var px = Math.min(4, (window.devicePixelRatio || 1) * zoom);
    var w = Math.max(852, Math.min(852 * 4, Math.round(r.width * px)));
    var h = Math.round(w * r.height / r.width);
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
  }
  // Resize once the zoom gesture has settled, not on every step of it: each new size means new
  // card pictures, and rebuilding them dozens of times during a pinch ran Safari out of canvas
  // memory, which blanks canvases (the black screen when zooming the mockup).
  var resizeTimer = 0;
  function resized() { clearTimeout(resizeTimer); resizeTimer = setTimeout(sizeCanvas, 180); }
  window.addEventListener('resize', resized);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', resized);

  // ---------- Seats ----------
  // Teams: bottom + top vs left + right. Figma positions in screen px, turned into scene units below;
  // the side players sit 24 px further in than in the mockup, so the left one clears the iPhone's
  // island (the screen's left 48 px in landscape) and the layout stays symmetric.
  // rect: the character art (right is GarikAv, mirrored so he looks at the table);
  // fan: where the player's cards are held: the pivot just off the screen edge and the direction
  // the cards point (degrees, 0 = up), as the mockup's card fans; face: where won tricks go;
  // deck: where the deck starts when this player deals.
  var SEATS = {
    bottom: { face: [426, 400], deck: [426, 300], deckRot: 0 },
    left:   { art: 'georgi', rect: [62, 139, 81, 97], fan: { p: [9, 211.4], a: 83.94 }, face: [102, 187], deck: [164, 196], deckRot: Math.PI / 2 },
    top:    { art: 'vazgen', rect: [385, 18, 81, 97], fan: { p: [424, -15], a: 180 }, face: [426, 66], deck: [426, 128], deckRot: Math.PI },
    right:  { art: 'garik', rect: [706, 134, 93, 97], flip: true, fan: { p: [843, 212.4], a: -83.94 }, face: [752, 182], deck: [688, 196], deckRot: -Math.PI / 2 }
  };
  var IDS = Object.keys(SEATS);
  var JOIN_ORDER = ['bottom', 'left', 'top', 'right'];
  function px(p) { return [p[0] * F, p[1] * F]; }
  IDS.forEach(function (id, n) {
    var s = SEATS[id];
    s.face = px(s.face); s.deck = px(s.deck); s.phase = n * 1.7;
    if (s.rect) {
      s.rect = s.rect.map(function (v) { return v * F; });
      s.image = new Image(); s.image.src = A + 'players/' + s.art + '.webp';
    }
    if (s.fan) s.fan.p = px(s.fan.p);
  });
  // the middle of the table (the ornamental frame) and where each player's card lands in a trick
  var MID = [1000, 460];
  var TRICK_SPOT = { bottom: [1000, 505, -.04], top: [1000, 415, .04], left: [930, 462, -.14], right: [1070, 458, .14] };
  var TRICK_SC = 1.53;                 // the mockup's played card: 51 px wide
  var FAN_R = 32 * F, FAN_STEP = 9.14, FAN_SC = 1.265;   // the fans: 42 px cards, 64 degrees for 8 cards
  var HAND_SC = 1.7;                   // your cards: 57 px wide, as in the mockup

  // ---------- Cards ----------
  // The deck: one transparent PNG per card in assets/table/cards/play/ (cut by tools/cut_cards.py),
  // 450x630, so a card is 78 x 109.2 scene units.
  var CW = 78, CH = 109.2, PAD = 10, CR = 3;   // CR: corner radius, as on the card art
  // Card pictures are cached per on-screen size (in steps of 1/4 device pixel per scene unit),
  // so the table draws them at almost exactly 1:1. Each size is made in one step straight from
  // the card PNG with the browser's best resampling (createImageBitmap 'high'); until that is
  // ready a quicker drawImage copy stands in. One big shrink of a cached card (what we had
  // before) is what made the faces look soft and crunchy.
  function bucket(k) { return Math.max(.75, Math.min(6, Math.ceil(k * 4 - .05) / 4)); }
  var RANKS = ['7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  var SUITS = [{ s: '♠', l: 'S' }, { s: '♥', l: 'H' }, { s: '♣', l: 'C' }, { s: '♦', l: 'D' }];
  var faceArt = {};
  SUITS.forEach(function (su) {
    RANKS.forEach(function (r) { var im = new Image(); im.src = A + 'cards/play/' + r + su.l + '.png'; faceArt[r + su.s] = im; });
  });
  function rr(g, x, y, w, h, r) { g.beginPath(); if (g.roundRect) g.roundRect(x, y, w, h, r); else g.rect(x, y, w, h); }
  function levelCanvas(res) {
    var c = document.createElement('canvas');
    c.width = Math.round((CW + PAD * 2) * res); c.height = Math.round((CH + PAD * 2) * res);
    c.res = res;
    return c;
  }
  function cardCanvas(paint, res) {
    var c = levelCanvas(res);
    var g = c.getContext('2d'); g.scale(res, res); g.translate(PAD, PAD);
    g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 2 * res; g.shadowOffsetY = .67 * res;
    rr(g, 0, 0, CW, CH, CR); g.fillStyle = '#f6ecdc'; g.fill();
    g.shadowColor = 'transparent';
    g.save(); rr(g, 0, 0, CW, CH, CR); g.clip(); paint(g); g.restore();
    rr(g, 0, 0, CW, CH, CR); g.strokeStyle = 'rgba(0,0,0,.2)'; g.lineWidth = .5; g.stroke();
    return c;
  }
  // A face is the card art itself; its drop shadow follows the art's own rounded shape.
  var faceCache = {}, backCache = {};
  function renderFace(src, res, exact) {
    var c = levelCanvas(res), g = c.getContext('2d');
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    // canvas shadows are in pixels, not scene units: 2 x .67 units
    g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 2 * res; g.shadowOffsetY = .67 * res;
    var x = PAD * res, y = PAD * res;
    if (exact) g.drawImage(src, Math.round(x), Math.round(y));
    else g.drawImage(src, x, y, CW * res, CH * res);
    return c;
  }
  // Each card keeps only its last few sizes; the canvases of dropped sizes are emptied so the
  // browser gets the memory back straight away.
  var KEEP_FACE = 2, KEEP_BACK = 8;   // one back serves every card, so it keeps more sizes
  function remember(cache, res, c, keep) {
    if (!cache.order) cache.order = [];
    cache[res] = c;
    var i = cache.order.indexOf(res);
    if (i >= 0) cache.order.splice(i, 1);
    cache.order.push(res);
    while (cache.order.length > keep) {
      var old = cache.order.shift();
      if (cache[old]) { cache[old].width = 0; cache[old].height = 0; }
      delete cache[old];
    }
    return c;
  }
  function faceAt(key, k) {
    var cache = faceCache[key] || (faceCache[key] = {}), res = bucket(k);
    if (!cache[res]) {
      var art = faceArt[key];
      remember(cache, res, renderFace(art, res, false), KEEP_FACE);
      if (window.createImageBitmap) {
        createImageBitmap(art, { resizeWidth: Math.round(CW * res), resizeHeight: Math.round(CH * res), resizeQuality: 'high' })
          .then(function (bmp) {
            var quick = cache[res];
            if (quick) { cache[res] = renderFace(bmp, res, true); quick.width = 0; quick.height = 0; }   // still wanted
            if (bmp.close) bmp.close();
          })
          .catch(function () {});
      }
    }
    return cache[res];
  }
  function backAt(k) {
    var res = bucket(k);
    return backCache[res] || remember(backCache, res, makeBack(res), KEEP_BACK);
  }
  // Blue back in the classic "rider" spirit: white border, fine filigree field, central medallion
  // (the deck's own back, in the blue of the mockup's card fans).
  function makeBack(res) {
    return cardCanvas(function (g) {
      var m = 4.5, blue = '#25499e', x, y, i;
      g.fillStyle = blue; rr(g, m, m, CW - m * 2, CH - m * 2, 2.5); g.fill();
      g.save(); g.clip();
      g.strokeStyle = 'rgba(255,240,235,.75)'; g.lineWidth = .35;
      for (y = m + 3; y < CH; y += 6) for (x = m + 3; x < CW; x += 6) {
        g.beginPath(); g.arc(x, y, 2.1, 0, Math.PI * 2); g.stroke();
        g.beginPath(); g.moveTo(x - 3, y); g.lineTo(x + 3, y); g.moveTo(x, y - 3); g.lineTo(x, y + 3); g.stroke();
      }
      g.restore();
      g.strokeStyle = '#fdfbf6'; g.lineWidth = 1; rr(g, m + 2, m + 2, CW - m * 2 - 4, CH - m * 2 - 4, 2); g.stroke();
      g.save(); g.translate(CW / 2, CH / 2);
      g.fillStyle = blue; g.beginPath(); g.arc(0, 0, 15, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#fdfbf6'; g.lineWidth = 1.1; g.stroke();
      for (i = 0; i < 12; i++) {
        g.rotate(Math.PI / 6);
        g.beginPath(); g.ellipse(0, -8, 2.2, 5, 0, 0, Math.PI * 2); g.lineWidth = .5; g.stroke();
      }
      g.beginPath(); g.arc(0, 0, 3, 0, Math.PI * 2); g.fillStyle = '#fdfbf6'; g.fill();
      g.restore();
      [[m + 9, m + 9], [CW - m - 9, m + 9], [m + 9, CH - m - 9], [CW - m - 9, CH - m - 9]].forEach(function (p) {
        g.beginPath(); g.arc(p[0], p[1], 4, 0, Math.PI * 2); g.strokeStyle = '#fdfbf6'; g.lineWidth = .7; g.stroke();
      });
    }, res);
  }
  function Card(rank, suit) {
    this.rank = rank; this.suit = suit;
    this.x = 0; this.y = 0; this.rot = 0; this.sc = .7; this.flip = 0; this.alpha = 0; this.z = 0; this.lift = 0;
    this.dim = 0; this.base = 0;   // dim: darkened (not playable now); base: resting lift
  }
  Card.prototype.draw = function () {
    var sx = Math.abs(Math.cos(this.flip * Math.PI)) || .001;
    var k = this.sc * cv.width / W;
    var im = this.flip > .5 ? faceAt(this.rank + this.suit.s, k) : backAt(k);
    if (!im || !im.width) return;
    ctx.save(); ctx.globalAlpha = this.alpha;
    ctx.translate(this.x, this.y); ctx.rotate(this.rot); ctx.translate(0, -this.lift);
    ctx.scale(this.sc * sx, this.sc);
    ctx.drawImage(im, -(CW / 2 + PAD), -(CH / 2 + PAD), CW + PAD * 2, CH + PAD * 2);
    if (this.dim > 0) { rr(ctx, -CW / 2, -CH / 2, CW, CH, CR); ctx.fillStyle = 'rgba(0,0,0,' + .5 * this.dim + ')'; ctx.fill(); }
    ctx.restore();
  };

  // ---------- Tweens ----------
  // Everything scripted (seating, shuffle, deal) runs at double speed.
  var SPEED = 2;
  var run = 0, tweens = [];
  var ease = {
    out: function (p) { return 1 - Math.pow(1 - p, 3); },
    inOut: function (p) { return p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; },
    lin: function (p) { return p; }
  };
  function tween(o, to, dur, opt) {
    opt = opt || {};
    return new Promise(function (res) {
      tweens.push({ o: o, to: to, dur: dur * 1000, delay: (opt.delay || 0) * 1000, t: 0, e: opt.ease || ease.out, res: res, from: null, fn: opt.fn });
    });
  }
  function wait(s) { return tween({}, {}, s); }
  function anim(dur, fn) { return tween({}, {}, dur, { ease: ease.lin, fn: fn }); }
  function stepTweens(dt) {
    for (var i = tweens.length - 1; i >= 0; i--) {
      var tw = tweens[i]; tw.t += dt * SPEED;
      if (tw.t < tw.delay) continue;
      if (!tw.from) { tw.from = {}; for (var k in tw.to) tw.from[k] = tw.o[k]; }
      var p = Math.min(1, (tw.t - tw.delay) / (tw.dur || 1)), e = tw.e(p);
      for (var q in tw.to) tw.o[q] = tw.from[q] + (tw.to[q] - tw.from[q]) * e;
      if (tw.fn) tw.fn(p);
      if (p >= 1) { tweens.splice(i, 1); tw.res(); }
    }
  }

  // ---------- Sound: card flicks and the seat chime (synthesised, Web Audio) ----------
  var ac = null, master = null;
  function isMuted() { return !!(window.BlotSound && window.BlotSound.muted()); }
  function audio() {
    if (!ac) {
      try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
      master = ac.createGain(); master.gain.value = isMuted() ? 0 : 1; master.connect(ac.destination);
    }
    if (ac.state === 'suspended') ac.resume();
  }
  document.addEventListener('sound:mute', function (e) { if (master) master.gain.value = e.detail ? 0 : 1; });
  function noiseBuf(sec, shape) {
    var b = ac.createBuffer(1, Math.max(1, ac.sampleRate * sec | 0), ac.sampleRate), d = b.getChannelData(0), last = 0;
    for (var i = 0; i < d.length; i++) { var w = Math.random() * 2 - 1; d[i] = shape ? shape(w, i / d.length, last) : w; last = d[i]; }
    return b;
  }
  function flick(vol) {
    if (!ac) return;
    var s = ac.createBufferSource(); s.buffer = noiseBuf(.07, function (w, k) { return w * Math.pow(1 - k, 3); });
    var f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2200 + Math.random() * 1200; f.Q.value = .9;
    var g = ac.createGain(); g.gain.value = vol == null ? .22 : vol;
    s.connect(f).connect(g).connect(master); s.start();
  }
  function chime() {
    if (!ac) return;
    var t = ac.currentTime;
    [659, 988].forEach(function (fr, i) {
      var o = ac.createOscillator(), g = ac.createGain();
      o.frequency.value = fr;
      g.gain.setValueAtTime(0, t + i * .09); g.gain.linearRampToValueAtTime(.06, t + i * .09 + .02);
      g.gain.exponentialRampToValueAtTime(.0001, t + i * .09 + .9);
      o.connect(g).connect(master); o.start(t + i * .09); o.stop(t + i * .09 + 1);
    });
  }
  // ---------- Scene state ----------
  var S = { black: 1 };
  var cards = [], particles = [], clock = 0;

  function resetState() {
    IDS.forEach(function (id) {
      var s = SEATS[id];
      s.alpha = 0; s.pop = 1; s.ring = 0; s.idle = false;
    });
    S.black = 1;
    cards = []; particles = []; hover = null; humanWait = null;
    screen.querySelectorAll('[data-plate]').forEach(function (el) { el.classList.remove('is-turn'); });
  }
  function sparkle(x, y, n) {
    n = reduced ? 8 : (n || 26);
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2, v = 60 + Math.random() * 160;
      particles.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0, max: .6 + Math.random() * .6, r: 1.5 + Math.random() * 2.5 });
    }
  }

  // ---------- Seating: each player fades in with a little pop, a chime and a spark ring ----------
  function join(id, my) {
    var s = SEATS[id];
    chime();
    var plate = screen.querySelector('[data-plate="' + id + '"]');
    if (plate) plate.classList.add('is-on');
    if (!s.rect) return Promise.resolve();
    s.ring = 0; tween(s, { ring: 1 }, .9, { ease: ease.lin });
    sparkle(s.face[0], s.face[1]);
    s.pop = .9;
    tween(s, { alpha: 1 }, .4);
    return tween(s, { pop: 1.04 }, .22)
      .then(function () { return my === run && tween(s, { pop: 1 }, .18); })
      .then(function () { if (my === run) s.idle = true; });
  }

  async function play() {
    var my = ++run;
    tweens.length = 0; resetState();
    function ok() { return my === run && active; }

    tween(S, { black: 0 }, 1.2);
    await wait(.6); if (!ok()) return;
    for (var j = 0; j < JOIN_ORDER.length; j++) {
      join(JOIN_ORDER[j], my);
      await wait(1.3); if (!ok()) return;
    }
    await wait(.8); if (!ok()) return;

    // from here the game controller (js/game.js) runs the deals, bidding and tricks
    if (window.BlotGame) window.BlotGame.start(view);
  }

  // ---------- View API for the game controller ----------
  // Everything is in scene coordinates. Each call returns when its animation is done.
  var SUIT_OF = { S: SUITS[0], H: SUITS[1], C: SUITS[2], D: SUITS[3] };
  var byId = {}, humanWait = null, trickZ = 500;

  // An opponent's cards: fanned around the pivot at the screen edge, behind the character.
  // Your cards wait in a small pile until layoutHand spreads them.
  function pileAt(id, i, n) {
    var k = i - (n - 1) / 2;
    if (id === 'bottom') return { x: 1000 + k * 15, y: 700, rot: k * .03, sc: 1.2 };
    var f = SEATS[id].fan, a = (f.a + k * FAN_STEP) * Math.PI / 180;
    return { x: f.p[0] + Math.sin(a) * FAN_R, y: f.p[1] - Math.cos(a) * FAN_R, rot: a, sc: FAN_SC };
  }
  // your hand: an arc like the mockup's, 37 px apart, 6 degrees between cards
  function handAt(i, n) {
    var k = i - (n - 1) / 2, a = k * .105;
    return { x: 1000 + k * 87, y: 730 + 915 * (1 - Math.cos(a)), rot: a };
  }

  var view = {
    alive: function (tok) { return tok === run && active; },
    token: function () { return run; },
    wait: wait,

    // deck: engine cards in deck order; sequence: [{seat, card}] from BlotRules.deal
    deal: async function (tok, deck, sequence, dealer) {
      cards = []; byId = {}; hover = null; trickZ = 500;
      var from = SEATS[dealer], rot0 = from.deckRot;
      deck.forEach(function (ec, i) {
        var c = new Card(ec.rank, SUIT_OF[ec.suit]);
        c.id = ec.id; byId[ec.id] = c;
        c.x = from.deck[0]; c.y = from.deck[1]; c.rot = rot0 + .2; c.z = i; c.sc = .75;
        cards.push(c);
      });
      await Promise.all(cards.map(function (c, i) {
        return tween(c, { x: MID[0], y: MID[1] - i * .35, rot: rot0, alpha: 1, sc: 1.1 }, .6, { delay: .2, ease: ease.inOut });
      })); if (!view.alive(tok)) return;
      flick(.3);
      var stack = cards.slice();
      for (var rep = 0; rep < 2; rep++) {
        var L = stack.slice(0, 16), R = stack.slice(16);
        await Promise.all(stack.map(function (c, i) {
          return tween(c, { x: MID[0] + (i < 16 ? -70 : 70), rot: rot0 + (i < 16 ? -.1 : .1) }, .28, { ease: ease.inOut });
        })); if (!view.alive(tok)) return;
        var mixed = [];
        for (var i = 0; i < 16; i++) { if (Math.random() < .5) mixed.push(L[i], R[i]); else mixed.push(R[i], L[i]); }
        stack = mixed;
        await Promise.all(stack.map(function (c, k) {
          c.z = k;
          return tween(c, { x: MID[0], y: MID[1] - k * .35, rot: rot0 }, .16, { delay: k * .018, fn: function (p) { if (p === 1 && k % 3 === 0) flick(.12); } });
        })); if (!view.alive(tok)) return;
        await wait(.15); if (!view.alive(tok)) return;
      }
      var count = { bottom: 0, left: 0, top: 0, right: 0 }, zTop = 100;
      for (var q = 0; q < sequence.length; q++) {
        var st = sequence[q], c = byId[st.card.id], t = pileAt(st.seat, count[st.seat]++, 8);
        c.z = zTop++;
        c.behind = st.seat !== 'bottom';   // into the player's hands, behind the character
        flick();
        tween(c, { x: t.x, y: t.y, rot: t.rot, sc: t.sc }, .34);
        await wait(.075); if (!view.alive(tok)) return;
        if (sequence[q + 1] && sequence[q + 1].seat !== st.seat) { await wait(.12); if (!view.alive(tok)) return; }
      }
      await wait(.4);
    },
    // your hand: fanned at the bottom, face up, in the given order
    layoutHand: function (ids) {
      ids.forEach(function (id, i) {
        var c = byId[id], t = handAt(i, ids.length), first = !c.mine;
        c.z = 300 + i; c.mine = true;
        tween(c, { x: t.x, y: t.y, rot: t.rot, sc: HAND_SC }, first ? .5 : .3, { delay: first ? i * .04 : 0, ease: ease.inOut });
        if (c.flip < 1) tween(c, { flip: 1 }, .35, { delay: .45 + i * .06, ease: ease.inOut, fn: function (p) { if (p === 1) flick(.1); } });
      });
      return wait(.9);
    },
    // an opponent's fan, closed up after a card leaves
    layoutPile: function (seat, ids) {
      ids.forEach(function (id, i) { var t = pileAt(seat, i, ids.length); tween(byId[id], { x: t.x, y: t.y, rot: t.rot }, .25); });
    },
    // wait for you to tap one of the legal cards; the others are darkened
    waitHuman: function (hand, legal, hint) {
      hand.forEach(function (id) {
        var c = byId[id], ok = legal.indexOf(id) >= 0;
        c.base = ok ? 18 : 0;
        tween(c, { dim: ok ? 0 : 1, lift: c.base }, .2);
      });
      return new Promise(function (res) { humanWait = { legal: legal, res: res, hand: hand, hint: hint }; });
    },
    playCard: function (seat, id) {
      var c = byId[id], t = TRICK_SPOT[seat];
      c.mine = false; c.base = 0; c.z = trickZ++; c.behind = false;
      if (c === hover) hover = null;
      flick(.25);
      tween(c, { dim: 0, lift: 0 }, .15);
      tween(c, { flip: 1 }, .3, { ease: ease.inOut });
      return tween(c, { x: t[0], y: t[1], rot: t[2], sc: TRICK_SC }, .4, { ease: ease.out });
    },
    // the trick slides to the winner and is gone
    collect: async function (seat, ids) {
      var f = SEATS[seat].face;
      await Promise.all(ids.map(function (id, i) {
        return tween(byId[id], { x: f[0], y: f[1], sc: .5, alpha: 0 }, .45, { delay: i * .03, ease: ease.inOut });
      }));
      cards = cards.filter(function (c) { return ids.indexOf(c.id) < 0; });
    },
    clear: async function () {
      await Promise.all(cards.map(function (c) { return tween(c, { alpha: 0, sc: c.sc * .8 }, .3); }));
      cards = []; byId = {}; hover = null;
    },
    // whoever has to act gets their nameplate lit, with the turn timer; null for nobody
    turn: function (seat) {
      screen.querySelectorAll('[data-plate]').forEach(function (el) { el.classList.toggle('is-turn', el.getAttribute('data-plate') === seat); });
    },
    say: function (seat, text, kind) { bubble(seat, text, kind); },
    chime: function () { chime(); },
    // the HUD (settings, last trick, score, buttons) comes in once the first hand has been dealt
    showHud: function () {
      if (screen.classList.contains('tb-enter')) return;
      screen.classList.add('tb-enter');
    }
  };

  // tap on one of your legal cards plays it
  cv.addEventListener('click', function (e) {
    if (!humanWait) return;
    pick(e);
    if (hover && humanWait.legal.indexOf(hover.id) < 0) {
      // not playable now: shake it and say why
      var c = hover, x0 = c.x;
      anim(.3, function (p) { c.x = x0 + Math.sin(p * Math.PI * 6) * 10 * (1 - p); });
      bubble('bottom', humanWait.hint || 'Play a highlighted card', 'hint');
      return;
    }
    if (hover && humanWait.legal.indexOf(hover.id) >= 0) {
      var w = humanWait, id = hover.id;
      humanWait = null;
      w.hand.forEach(function (h) { var c = byId[h]; if (c) { c.base = 0; tween(c, { dim: 0 }, .2); } });
      w.res(id);
    }
  });

  // ---------- Own cards lift under the finger / pointer ----------
  var hover = null;
  function pick(e) {
    var r = cv.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * W, y = (e.clientY - r.top) / r.height * H, hit = null;
    var byZ = cards.slice().sort(function (a, b) { return b.z - a.z; });
    for (var i = 0; i < byZ.length; i++) {
      var c = byZ[i];
      if (!c.mine || c.flip < 1) continue;
      var dx = x - c.x, dy = y - c.y + c.lift, ca = Math.cos(-c.rot), sa = Math.sin(-c.rot);
      var lx = dx * ca - dy * sa, ly = dx * sa + dy * ca;
      if (Math.abs(lx) < CW * c.sc / 2 && Math.abs(ly) < CH * c.sc / 2) { hit = c; break; }
    }
    if (hit !== hover) {
      if (hover) tween(hover, { lift: hover.base || 0 }, .15);
      if (hit) { tween(hit, { lift: 26 }, .15); flick(.06); }
      hover = hit; cv.style.cursor = hit ? 'pointer' : 'default';
    }
  }
  cv.addEventListener('pointermove', pick);
  cv.addEventListener('pointerdown', pick);

  // ---------- Render ----------
  // The characters are drawn from copies made at their on-screen pixel size with the browser's
  // best resampling (as the cards), so they stay crisp at 3x and when the mockup is zoomed.
  function artAt(s, w, h) {
    var pw = Math.round(w * cv.width / W), ph = Math.round(h * cv.height / H);
    if (s.bmpW === pw) return s.bmp || s.image;
    s.bmpW = pw; s.bmp = null;
    if (window.createImageBitmap && s.image.naturalWidth && pw < s.image.naturalWidth) {
      createImageBitmap(s.image, { resizeWidth: pw, resizeHeight: ph, resizeQuality: 'high' })
        .then(function (b) { if (s.bmpW === pw) { if (s.bmp && s.bmp.close) s.bmp.close(); s.bmp = b; } else if (b.close) b.close(); })
        .catch(function () {});
    }
    return s.image;
  }
  var last = 0, active = false, raf = 0;
  function drawSeat(s) {
    if (!s.rect || s.alpha <= 0 || !s.image.naturalWidth) return;
    var r = s.rect, sc = s.pop;
    if (s.idle && !reduced) sc *= 1 + .008 * Math.sin(clock * 1.6 + s.phase);   // breathing
    ctx.save();
    ctx.globalAlpha = Math.min(1, s.alpha);
    ctx.translate(r[0] + r[2] / 2, r[1] + r[3]);   // grows from the bottom middle
    ctx.scale(s.flip ? -sc : sc, sc);
    ctx.drawImage(artAt(s, r[2], r[3]), -r[2] / 2, -r[3], r[2], r[3]);
    ctx.restore();
  }
  function frame(now) {
    if (!active) return;
    var dt = Math.min(50, now - (last || now)); last = now; clock += dt / 1000;
    stepTweens(dt);
    ctx.setTransform(cv.width / W, 0, 0, cv.height / H, 0, 0);
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, W, H);

    // the cards in the players' hands, then the players in front of them, then everything else
    var sorted = cards.sort(function (a, b) { return a.z - b.z; });
    sorted.forEach(function (cd) { if (cd.behind) cd.draw(); });
    IDS.forEach(function (id) { drawSeat(SEATS[id]); });
    sorted.forEach(function (cd) { if (!cd.behind) cd.draw(); });

    ctx.globalCompositeOperation = 'lighter';
    IDS.forEach(function (id) {
      var s = SEATS[id];
      if (s.ring > 0 && s.ring < 1) {
        ctx.strokeStyle = 'rgba(140,190,255,' + .6 * (1 - s.ring) + ')'; ctx.lineWidth = 6 * (1 - s.ring);
        ctx.beginPath(); ctx.ellipse(s.face[0], s.face[1], 40 + 200 * s.ring, 30 + 150 * s.ring, 0, 0, Math.PI * 2); ctx.stroke();
      }
    });
    var ds = dt / 1000;
    particles = particles.filter(function (p) { return (p.life += ds) < p.max; });
    particles.forEach(function (p) {
      var k = p.life / p.max;
      p.x += p.vx * ds; p.y += p.vy * ds; p.vx *= .96; p.vy *= .96;
      ctx.fillStyle = 'rgba(190,220,255,' + (1 - k) + ')'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalCompositeOperation = 'source-over';

    if (S.black > 0) { ctx.fillStyle = 'rgba(0,0,0,' + S.black + ')'; ctx.fillRect(0, 0, W, H); }
    raf = requestAnimationFrame(frame);
  }

  // ---------- Boot: wait for the art and the deck ----------
  var art = IDS.filter(function (id) { return SEATS[id].image; }).map(function (id) { return SEATS[id].image; })
    .concat(Object.keys(faceArt).map(function (k) { return faceArt[k]; }));
  var booting = Promise.all(art.map(function (im) { return im.decode().catch(function () {}); })).then(function () {
    faceCache = {}; backCache = {};
  });

  // The Play button is the user gesture that unlocks Web Audio for the table sounds.
  var playBtn = document.querySelector('[data-stage-play]');
  playBtn.addEventListener('click', function () {
    audio();
    // let the "into battle" hit land, then cut to the table
    setTimeout(function () { window.BlotNav.show('table'); }, 700);
  });

  document.addEventListener('screen:show', function (e) {
    if (e.detail === 'table') {
      active = true; last = 0;
      sizeCanvas();
      resetState();
      cancelAnimationFrame(raf); raf = requestAnimationFrame(frame);
      audio();
      booting.then(function () { if (active) play(); });
    } else if (active) {
      active = false; run++;
      screen.classList.remove('tb-enter'); closePops(null);
      screen.querySelectorAll('[data-plate]').forEach(function (el) { el.classList.remove('is-on'); });
      Object.keys(bubbles).forEach(function (k) { bubbles[k].textContent = ''; });
      if (window.BlotGame) window.BlotGame.stop();
      cancelAnimationFrame(raf);
    }
  });

  // ---------- HUD ----------
  // The settings button leaves the table for the stage select (there is no settings screen in the
  // prototype); Escape does the same.
  screen.querySelector('[data-table-exit]').addEventListener('click', function () { window.BlotNav.show('play'); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && active) window.BlotNav.show('play'); });

  // Score and last trick. A new game starts at 0 : 0 with the "?" slot; the game logic
  // (js/blot-rules.js) will call these as tricks are taken.
  // Numbers that change count to their new value (ease-out, about a second); step(n) shows n.
  function countUp(from, to, step, delay) {
    if (reduced || from === to) { step(to); return; }
    var t0 = 0;
    step(from);
    setTimeout(function () {
      requestAnimationFrame(function tick(now) {
        if (!t0) t0 = now;
        var p = Math.min(1, (now - t0) / 900);
        step(Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(tick);
      });
    }, delay || 0);
  }
  var shown = { us: 0, them: 0 };
  function setScore(us, them) {
    [['us', us], ['them', them]].forEach(function (t) {
      var cells = screen.querySelectorAll('[data-score="' + t[0] + '"] > span'), cell = cells[0].parentNode;
      if (shown[t[0]] !== t[1]) {
        cell.classList.remove('is-counting'); void cell.offsetWidth; cell.classList.add('is-counting');
      }
      countUp(shown[t[0]], t[1], function (n) {
        cells.forEach(function (el) { el.innerHTML = '<b>' + n + '</b><small>/' + window.BlotRules.GAME_TARGET + '</small>'; });
      });
      shown[t[0]] = t[1];
    });
  }
  // cards: [{rank, suit}] (engine cards) or [] for none yet. Small copies of the card PNGs.
  function setLastTrick(cards) {
    var box = screen.querySelector('[data-trick-cards]');
    box.innerHTML = (cards || []).map(function (c) {
      return '<img class="tb-mini" src="' + A + 'cards/play/' + c.rank + c.suit + '.png" alt="' + c.rank + c.suit + '">';
    }).join('');
    box.hidden = !(cards && cards.length);
    screen.querySelector('[data-trick-empty]').hidden = !box.hidden;
  }
  setScore(0, 0); setLastTrick([]);
  window.BlotTable = { setScore: setScore, setLastTrick: setLastTrick, countUp: countUp };

  // Chat and reactions: each button opens its popover; a pick pops up above your seat.
  var say = screen.querySelector('[data-say]');
  var bubbles = {};
  ['bottom', 'left', 'top', 'right'].forEach(function (id) {
    var el = document.createElement('div');
    el.className = 'tb-bubble tb-bubble--' + id;
    say.appendChild(el); bubbles[id] = el;
  });
  function bubble(seat, text, kind) {
    var el = document.createElement('div');
    el.className = kind === 'emoji' ? 'tb-say_emoji' : 'tb-say_line' + (kind ? ' tb-say_line--' + kind : '');
    el.textContent = text;
    bubbles[seat].textContent = ''; bubbles[seat].appendChild(el);
  }
  var social = screen.querySelectorAll('[data-social]');
  function closePops(except) {
    social.forEach(function (b) {
      var k = b.getAttribute('data-social'), open = k === except;
      b.setAttribute('aria-expanded', String(open));
      screen.querySelector('[data-pop="' + k + '"]').hidden = !open;
    });
  }
  social.forEach(function (b) {
    b.addEventListener('click', function (e) {
      e.stopPropagation();
      closePops(b.getAttribute('aria-expanded') === 'true' ? null : b.getAttribute('data-social'));
    });
  });
  function pop(cls, text) { bubble('bottom', text, cls === 'tb-say_emoji' ? 'emoji' : null); }
  screen.querySelectorAll('[data-pop="chat"] button').forEach(function (b) {
    b.addEventListener('click', function () { closePops(null); pop('tb-say_line', b.textContent); });
  });
  screen.querySelectorAll('[data-pop="react"] button').forEach(function (b) {
    b.addEventListener('click', function () { closePops(null); pop('tb-say_emoji', b.textContent); });
  });
  screen.addEventListener('click', function (e) { if (!e.target.closest('.tb-bottom')) closePops(null); });
})();
