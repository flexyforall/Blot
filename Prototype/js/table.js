// Game table: the fireside salon from the "Prototype" scene. The four players take their seats
// one by one, then js/game.js runs the game through the `view` API below (deal, play a card,
// take a trick...). Opened by the Play button on the stage select.
// Everything is drawn on one canvas in scene coordinates of the 2000x923 art.
(function () {
  var A = 'assets/table/';
  var W = 2000, H = 923;
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

  // ---------- Seats (scene coordinates) ----------
  // Teams: bottom + top vs left + right.
  // parts: body pieces cut from the art that move on their own (rect + pivot), used until the seat's video loads.
  var SEATS = {
    bottom: { crop: [770, 725, 460, 198], pivot: [1000, 923], face: [1000, 860, 70],
              pile: [1000, 668], pileRot: 0, greet: 'bow',
              parts: { helm: { r: [925, 790, 150, 133], p: [1000, 905] }, hands: { r: [930, 735, 140, 62], p: [1000, 790] } },
              acts: ['lookAround', 'drum', 'stretch'],
              video: { src: ['knight.webm', 'knight.mp4'], rect: [680, 563, 640, 360] } },
    left:   { crop: [130, 355, 380, 360], pivot: [330, 640], face: [300, 445, 66],
              pile: [572, 525], pileRot: Math.PI / 2, greet: 'lean',
              parts: { head: { r: [200, 362, 195, 165], p: [355, 525] }, hands: { r: [410, 488, 80, 100], p: [400, 540] } },
              acts: ['tilt', 'tap', 'glance'],
              video: { src: ['laura.webm', 'laura.mp4'], rect: [0, 345, 676, 380] } },
    top:    { crop: [790, 15, 410, 290], pivot: [995, 300], face: [965, 100, 56],
              pile: [1000, 350], pileRot: Math.PI, greet: 'nod',
              parts: { head: { r: [935, 8, 130, 155], p: [995, 165] }, cigar: { r: [875, 120, 125, 100], p: [890, 215] }, claw: { r: [980, 250, 100, 58], p: [1030, 300] } },
              acts: ['puff', 'puff', 'claw'],
              video: { src: ['marco.webm', 'marco.mp4'], rect: [675, 0, 640, 360] } },
    right:  { crop: [1525, 325, 420, 410], pivot: [1720, 650], face: [1790, 452, 85],
              pile: [1428, 525], pileRot: -Math.PI / 2, greet: 'tip',
              parts: { hat: { r: [1690, 335, 205, 160], p: [1795, 445] }, hands: { r: [1540, 520, 100, 105], p: [1600, 600] } },
              acts: ['scratch', 'hat', 'scratch', 'lean'],
              video: { src: ['billy.webm', 'billy.mp4'], rect: [1289, 330, 711, 400] } }
  };
  var IDS = Object.keys(SEATS);
  var JOIN_ORDER = ['bottom', 'left', 'top', 'right'];
  var CIGAR_TIP = [957, 180], MOUTH = [990, 147], CYBER_EYE = [1010, 100];

  // Seat videos (short AI loops), drawn through a soft silhouette mask so they blend into the empty room.
  IDS.forEach(function (id) {
    var s = SEATS[id], v = document.createElement('video');
    v.muted = true; v.loop = false; v.playsInline = true; v.setAttribute('playsinline', ''); v.preload = 'auto';
    v.addEventListener('ended', function () { s.moving = false; try { v.currentTime = 0; } catch (e) {} });
    var webm = v.canPlayType('video/webm; codecs="vp9"');
    v.src = A + (webm ? s.video.src[0] : s.video.src[1]);
    v.addEventListener('canplay', function () { s.vidReady = true; }, { once: true });
    s.vid = v;
    s.vidCanvas = document.createElement('canvas');
    s.vidCanvas.width = s.video.rect[2]; s.vidCanvas.height = s.video.rect[3];
    s.vidMask = new Image(); s.vidMask.src = A + 'mask_' + id2name(id) + '.png';
  });
  function id2name(id) { return SEATS[id].video.src[0].split('.')[0]; }

  // ---------- Assets ----------
  var img = new Image(); img.src = A + 'scene.webp';    // characters are cut from this
  var room = new Image(); room.src = A + 'room.webp';   // the same room with empty chairs
  // the simplified in-play table (Figma 2289:3981) the camera zooms into once everyone is seated
  var simpleBg = new Image(); simpleBg.src = A + 'simple/bg.webp';
  var simpleTable = new Image(); simpleTable.src = A + 'simple/table.webp';
  // where the avatars sit on the simplified table: cards are dealt to them and taken back to them
  var SIMPLE = { top: [1000, 164], left: [282, 434], right: [1718, 434], bottom: [1000, 1000] };
  function simple() { return S.simple > .5; }
  // card pictures: see faceAt / backAt

  function feathered(r, core) {
    core = core == null ? .68 : core;
    var cw = r[2], ch = r[3];
    var c = document.createElement('canvas'); c.width = cw; c.height = ch;
    var g = c.getContext('2d');
    g.drawImage(img, r[0], r[1], cw, ch, 0, 0, cw, ch);
    g.globalCompositeOperation = 'destination-in';
    g.translate(cw / 2, ch / 2); g.scale(cw / 2, ch / 2);
    var gr = g.createRadialGradient(0, 0, 0, 0, 0, 1);
    gr.addColorStop(0, '#000'); gr.addColorStop(core, '#000'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(-1, -1, 2, 2);
    return c;
  }

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
    RANKS.forEach(function (r) { var im = new Image(); im.src = A + 'cards/bicycle/' + r + su.l + '.webp'; faceArt[r + su.s] = im; });
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
  // the Bicycle back (assets/table/cards/bicycle/back.webp); the drawn red back until it has loaded
  var backArt = new Image(); backArt.src = A + 'cards/bicycle/back.webp';
  function backAt(k) {
    var res = bucket(k);
    if (backArt.complete && backArt.naturalWidth) return backCache[res] || remember(backCache, res, renderFace(backArt, res, false), KEEP_BACK);
    return makeBack(res);
  }
  // Red back in the classic "rider" spirit: white border, fine red filigree field, central medallion.
  function makeBack(res) {
    return cardCanvas(function (g) {
      var m = 4.5, red = '#b5121f', x, y, i;
      g.fillStyle = red; rr(g, m, m, CW - m * 2, CH - m * 2, 2.5); g.fill();
      g.save(); g.clip();
      g.strokeStyle = 'rgba(255,240,235,.75)'; g.lineWidth = .35;
      for (y = m + 3; y < CH; y += 6) for (x = m + 3; x < CW; x += 6) {
        g.beginPath(); g.arc(x, y, 2.1, 0, Math.PI * 2); g.stroke();
        g.beginPath(); g.moveTo(x - 3, y); g.lineTo(x + 3, y); g.moveTo(x, y - 3); g.lineTo(x, y + 3); g.stroke();
      }
      g.restore();
      g.strokeStyle = '#fdfbf6'; g.lineWidth = 1; rr(g, m + 2, m + 2, CW - m * 2 - 4, CH - m * 2 - 4, 2); g.stroke();
      g.save(); g.translate(CW / 2, CH / 2);
      g.fillStyle = red; g.beginPath(); g.arc(0, 0, 15, 0, Math.PI * 2); g.fill();
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

  // ---------- Sound: card flicks, seat chime, fireplace (synthesised, Web Audio) ----------
  var ac = null, master = null, fireOn = false;
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
  var fireGain = null;
  function startFire() {
    if (!ac) return;
    if (fireOn) { fireGain.gain.setTargetAtTime(1, ac.currentTime, .4); return; }
    fireOn = true;
    fireGain = ac.createGain(); fireGain.gain.value = 0; fireGain.connect(master);
    fireGain.gain.setTargetAtTime(1, ac.currentTime, .6);
    // low roar: looped brown noise through a low-pass
    var bed = ac.createBufferSource();
    bed.buffer = noiseBuf(4, function (w, k, last) { return (last + .02 * w) / 1.02; });
    bed.loop = true;
    var lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 380;
    var bg = ac.createGain(); bg.gain.value = 1.6;
    bed.connect(lp).connect(bg).connect(fireGain); bed.start();
    // crackles: short random pops, sometimes in little bursts
    function pop(t, big) {
      var s = ac.createBufferSource(); s.buffer = noiseBuf(big ? .03 : .008, function (w, k) { return w * Math.pow(1 - k, 4); });
      var f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = big ? 900 + Math.random() * 1200 : 2000 + Math.random() * 4000; f.Q.value = 1.4;
      var g = ac.createGain(); g.gain.value = big ? .16 + Math.random() * .12 : .03 + Math.random() * .08;
      s.connect(f).connect(g).connect(fireGain); s.start(t);
    }
    (function loop() {
      if (active) {
        var t = ac.currentTime + .05, n = Math.random() < .25 ? 2 + (Math.random() * 4 | 0) : 1;
        for (var i = 0; i < n; i++) pop(t + i * (.015 + Math.random() * .04), Math.random() < .12);
      }
      setTimeout(loop, 70 + Math.random() * 380);
    })();
  }
  function stopFire() { if (fireGain) fireGain.gain.setTargetAtTime(0, ac.currentTime, .3); }

  // ---------- Scene state ----------
  var S = { black: 1, amb: .55, lamps: 0, table: .35, zoom: 0, blur: 0, simple: 0 };
  var MOVE_EVERY = 15;   // seconds between one character's gesture and the next one's
  var moves = { on: false, next: 0, last: null };
  var cards = [], particles = [], clock = 0, nextSmoke = 2;
  var shade = document.createElement('canvas'); shade.width = W / 4; shade.height = Math.ceil(H / 4);
  var sh = shade.getContext('2d');

  function moveSomeone() {
    // Don Marco is not in the rotation: he smokes all the time (see smokeForever)
    var ids = IDS.filter(function (id) { var s = SEATS[id]; return id !== 'top' && s.idle && !s.moving && !s.busy && id !== moves.last; });
    if (!ids.length) return;
    var id = ids[Math.random() * ids.length | 0], s = SEATS[id];
    moves.last = id;
    if (s.vidReady) {
      s.moving = true;
      try { s.vid.currentTime = 0; s.vid.play().catch(function () { s.moving = false; }); } catch (e) { s.moving = false; }
    } else if (s.acts) {
      act(s, s.acts[Math.random() * s.acts.length | 0]);
    }
  }
  function resetPose(s) {
    s.rot = 0; s.sc = 1; s.dx = 0; s.dy = 0; s.busy = false; s.glow = 0;
    for (var k in s.parts) { var p = s.parts[k]; p.rot = 0; p.dx = 0; p.dy = 0; }
  }
  function resetState() {
    moves = { on: false, next: 0, last: null };
    IDS.forEach(function (id) {
      var s = SEATS[id];
      s.moving = false;
      try { s.vid.pause(); s.vid.currentTime = 0; } catch (e) {}
      s.light = 0; s.idle = false; s.ring = 0; s.next = 0;
      resetPose(s);
    });
    S.black = 1; S.amb = .55; S.lamps = 0; S.table = .35; S.zoom = 0; S.blur = 0; S.simple = 0; storm.next = Infinity;
    screen.classList.remove('tb-zoom', 'tb-simple');
    cards = []; particles = []; hover = null; humanWait = null; handHidden = false;
    screen.classList.remove('tb-has-hand', 'tb-hand-up');
    screen.querySelectorAll('[data-plate]').forEach(function (el) { el.classList.remove('is-turn'); });
  }
  function sparkle(x, y, n) {
    n = reduced ? 8 : (n || 26);
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2, v = 60 + Math.random() * 160;
      particles.push({ k: 'spark', x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0, max: .6 + Math.random() * .6, r: 1.5 + Math.random() * 2.5 });
    }
  }
  function smoke(x, y, n, big) {
    for (var i = 0; i < n; i++) particles.push({
      k: 'smoke', x: x + Math.random() * (big ? 16 : 8) - (big ? 8 : 4), y: y + (big ? Math.random() * 10 - 5 : 0), life: -i * (big ? .09 : .2), max: big ? 3.2 : 2.6,
      vx: big ? -30 - Math.random() * 40 : -6 + Math.random() * 16, vy: big ? -20 - Math.random() * 30 : -16 - Math.random() * 12,
      r: big ? 7 + Math.random() * 6 : 5 + Math.random() * 5, a: big ? .13 : .22
    });
  }

  // ---------- Choreography ----------
  function bell(p) { return Math.sin(Math.PI * p); }
  var GREET = {
    bow:  function (s, p) { var b = bell(p); s.sc = 1 - .035 * b; s.dy = -9 * b; s.parts.helm.rot = .06 * Math.sin(2 * Math.PI * p); },
    lean: function (s, p) { var b = bell(p); s.dx = 12 * b; s.parts.head.rot = -.12 * b; },
    nod:  function (s, p) { var b = bell(p); s.parts.head.dy = 7 * Math.sin(2 * Math.PI * p) * (1 - p) + 5 * b; s.sc = 1 + .012 * b; },
    tip:  function (s, p) { var b = bell(p); s.parts.hat.rot = -.18 * b; s.parts.hat.dx = 10 * b; s.parts.hat.dy = -8 * b; }
  };
  // Idle gestures of the cut-out fallback (when a seat video is not available).
  var ACTS = {
    puff: { d: 4.2, f: function (s, p) {                   // mafia: hand to mouth, ember glows, exhale
      var up = p < .2 ? p / .2 : p < .55 ? 1 : p < .7 ? 1 - (p - .55) / .15 : 0, e = ease.inOut(up), c = s.parts.cigar;
      c.dx = 9 * e; c.dy = -7 * e; c.rot = .05 * e;
      s.parts.head.rot = -.05 * e; s.parts.head.dy = -3 * e;
      s.glow = p > .2 && p < .55 ? Math.min(1, (p - .2) / .1) : Math.max(0, s.glow - .03);
      if (!s._ex && p > .6) { s._ex = true; smoke(MOUTH[0], MOUTH[1], 12, true); }
      if (p > .95) s._ex = false;
    } },
    claw: { d: 1.8, f: function (s, p) { s.parts.claw.dy = p < .8 ? -6 * Math.abs(Math.sin(p * Math.PI * 5)) : 0; } },
    scratch: { d: 2.2, f: function (s, p) {                // cowboy: hand up to the beard, rubs, back down
      var h = s.parts.hands, up = p < .2 ? p / .2 : p < .8 ? 1 : 1 - (p - .8) / .2, e = ease.inOut(up);
      h.dx = 8 * e; h.dy = -10 * e; h.rot = -.06 * e;
      if (p > .2 && p < .8) { h.dx += 3 * Math.sin(p * 70); h.dy += 2 * Math.cos(p * 70); }
      s.parts.hat.rot = .06 * e; s.parts.hat.dy = -3 * e; s.rot = -.012 * e;
    } },
    hat: { d: 1.6, f: function (s, p) { var b = bell(p), h = s.parts.hat; h.rot = .12 * b; h.dy = -6 * b; h.dx = -4 * b; } },
    lean: { d: 2.4, f: function (s, p) { var b = bell(p); s.dx = -10 * b; s.rot = -.025 * b; } },
    tilt: { d: 2.2, f: function (s, p) { var b = bell(p); s.parts.head.rot = .14 * b; s.parts.head.dx = 4 * b; } },
    glance: { d: 2.6, f: function (s, p) { var k = p < .5 ? bell(p * 2) : -bell((p - .5) * 2); s.parts.head.rot = .1 * k; } },
    tap: { d: 1.8, f: function (s, p) { s.parts.hands.dy = -5 * Math.max(0, Math.sin(p * Math.PI * 8)); } },
    lookAround: { d: 3, f: function (s, p) { var k = p < .5 ? bell(p * 2) : -bell((p - .5) * 2); s.parts.helm.rot = .16 * k; } },
    drum: { d: 1.6, f: function (s, p) { s.parts.hands.dy = -4 * Math.max(0, Math.sin(p * Math.PI * 10)); s.parts.hands.rot = .03 * Math.sin(p * Math.PI * 10); } },
    stretch: { d: 2.4, f: function (s, p) { var b = bell(p); s.sc = 1 + .03 * b; s.parts.helm.dy = -6 * b; } }
  };
  function act(s, name) {
    var a = ACTS[name]; s.busy = true;
    anim(a.d, function (p) { a.f(s, p); }).then(function () { resetPose(s); });
  }

  function join(id, my) {
    var s = SEATS[id];
    chime();
    var plate = screen.querySelector('[data-plate="' + id + '"]');
    if (plate) plate.classList.add('is-on');
    s.ring = 0; tween(s, { ring: 1 }, .9, { ease: ease.lin });
    tween(s, { light: 1 }, .55);
    sparkle(s.face[0], s.face[1]);
    s.sc = .95;
    return tween(s, { sc: 1.03 }, .22)
      .then(function () { return my === run && tween(s, { sc: 1 }, .18); })
      .then(function () {
        if (my !== run) return;
        if (id === 'top') smoke(CIGAR_TIP[0], CIGAR_TIP[1], 8);
        return anim(1.4, function (p) { if (!s.vidReady) GREET[s.greet](s, p); });
      })
      .then(function () {
        if (my !== run) return;
        resetPose(s); s.idle = true;
        if (id === 'top') smokeForever(s, my);
      });
  }

  // Don Marco never stops smoking: his video (a seamless 10 s loop of him drawing on the cigar)
  // plays on repeat; without the video the cut-out keeps puffing, with smoke and the glowing tip.
  function smokeForever(s, my) {
    if (my !== run || !active) return;
    if (s.vidReady) {
      s.moving = true; s.vid.loop = true;
      if (s.vid.paused) s.vid.play().catch(function () {});
      return;
    }
    if (!s.busy) act(s, 'puff');
    setTimeout(function () { smokeForever(s, my); }, 2600);
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
    await wait(1.2); if (!ok()) return;

    // everyone is seated: the lamps come up over the table
    moves.on = true; moves.next = clock + 6;
    tween(S, { amb: .14, lamps: 1 }, 1.4);
    await wait(.7); if (!ok()) return;

    // then the camera moves in over the table and the room gives way to the simplified table
    await simplify(ok); if (!ok()) return;

    // from here the game controller (js/game.js) runs the deals, bidding and tricks
    if (window.BlotGame) window.BlotGame.start(view);
  }

  // The zoom: the room scales up around the table (so its table grows into the simplified one),
  // the characters slide back from the table and fade, the room blurs, and the simplified table
  // (red smoke, plain table) fades in riding the same zoom. Then a light runs round the rim and the
  // avatars pop in (CSS: .tb-zoom / .tb-simple in css/table.css).
  async function simplify(ok) {
    moves.on = false;
    screen.classList.add('tb-zoom');
    if (reduced) { S.zoom = 1; S.simple = 1; screen.classList.add('tb-simple'); await wait(.3); return; }
    // (scene time runs at SPEED 2: this is under a second of zoom in real time)
    tween(S, { zoom: 1 }, 1.8, { ease: ease.inOut });
    tween(S, { blur: 1 }, 1, { delay: .2, ease: ease.inOut });
    tween(S, { simple: 1 }, 1, { delay: .7, ease: ease.inOut });
    await wait(1.6); if (!ok()) return;
    storm.next = clock + .4;
    screen.classList.add('tb-simple');
    await wait(1);
  }

  // ---------- View API for the game controller ----------
  // Everything is in scene coordinates. Each call returns when its animation is done.
  var SUIT_OF = { S: SUITS[0], H: SUITS[1], C: SUITS[2], D: SUITS[3] };
  var DECK_FROM = { top: [1005, 290, Math.PI], bottom: [1000, 760, 0], left: [470, 512, Math.PI / 2], right: [1530, 512, -Math.PI / 2] };
  // the trick is laid in the middle of the table, each card nudged towards whoever played it
  var TRICK_SPOT = { bottom: [1000, 548, -.04], top: [1000, 478, .04], left: [948, 513, -.12], right: [1052, 513, .12] };
  // the simplified table is bigger on screen, and so is its trick (Figma 2289:3981: about 58px wide)
  var TRICK_SIMPLE = { bottom: [1000, 575, -.04], top: [1000, 455, .04], left: [905, 515, -.12], right: [1095, 515, .12] };
  var byId = {}, humanWait = null, trickZ = 500;

  function pileAt(id, i, n) {
    if (simple() && id !== 'bottom') return { x: SIMPLE[id][0], y: SIMPLE[id][1], rot: SEATS[id].pileRot };
    var s = SEATS[id], o = (i - (n - 1) / 2) * 15, horiz = id === 'top' || id === 'bottom';
    return { x: s.pile[0] + (horiz ? o : 0), y: s.pile[1] + (horiz ? 0 : o), rot: s.pileRot + (i - (n - 1) / 2) * .03 };
  }
  function fanAt(i, n) {
    var a = (i - (n - 1) / 2) * (simple() ? .066 : .058), R0 = 1100;
    return { x: 1000 + Math.sin(a) * R0, y: (simple() ? 838 : 850) + R0 * (1 - Math.cos(a)) + (handHidden ? 330 : 0), rot: a };
  }
  // "Hide cards" (the button right of the hand): the fan slides down out of sight and your avatar
  // shows again in its place; the hand comes back on the button, or by itself when it is your move.
  var handHidden = false;
  function myCards() { return cards.filter(function (c) { return c.mine; }).sort(function (a, b) { return a.z - b.z; }); }
  function handState() {
    var has = myCards().length > 0;
    screen.classList.toggle('tb-has-hand', has);
    screen.classList.toggle('tb-hand-up', has && !handHidden);
    var b = screen.querySelector('[data-hand-toggle]');
    if (b) { b.setAttribute('aria-pressed', handHidden ? 'true' : 'false'); b.setAttribute('aria-label', handHidden ? 'Показать карты' : 'Спрятать карты'); }
  }
  function setHandHidden(on) {
    if (handHidden === on) return;
    handHidden = on;
    var mine = myCards();
    mine.forEach(function (c, i) { var t = fanAt(i, mine.length); tween(c, { x: t.x, y: t.y, rot: t.rot }, .35, { delay: (on ? i : mine.length - 1 - i) * .02, ease: ease.inOut }); });
    handState();
  }
  function handScale() { return simple() ? 2 : 1.7; }

  var view = {
    alive: function (tok) { return tok === run && active; },
    token: function () { return run; },
    wait: wait,

    // deck: engine cards in deck order; sequence: [{seat, card}] from BlotRules.deal
    deal: async function (tok, deck, sequence, dealer) {
      cards = []; byId = {}; hover = null; trickZ = 500;
      var from = DECK_FROM[dealer];
      if (simple()) from = dealer === 'bottom' ? [1000, 820, 0] : [SIMPLE[dealer][0], SIMPLE[dealer][1], from[2]];
      deck.forEach(function (ec, i) {
        var c = new Card(ec.rank, SUIT_OF[ec.suit]);
        c.id = ec.id; byId[ec.id] = c;
        c.x = from[0]; c.y = from[1]; c.rot = from[2] + .2; c.z = i; c.sc = .75;
        cards.push(c);
      });
      await Promise.all(cards.map(function (c, i) {
        return tween(c, { x: 1000, y: 512 - i * .35, rot: from[2], alpha: 1, sc: 1 }, .6, { delay: .2, ease: ease.inOut });
      })); if (!view.alive(tok)) return;
      flick(.3);
      var stack = cards.slice();
      for (var rep = 0; rep < 2; rep++) {
        var L = stack.slice(0, 16), R = stack.slice(16);
        await Promise.all(stack.map(function (c, i) {
          return tween(c, { x: 1000 + (i < 16 ? -62 : 62), rot: from[2] + (i < 16 ? -.1 : .1) }, .28, { ease: ease.inOut });
        })); if (!view.alive(tok)) return;
        var mixed = [];
        for (var i = 0; i < 16; i++) { if (Math.random() < .5) mixed.push(L[i], R[i]); else mixed.push(R[i], L[i]); }
        stack = mixed;
        await Promise.all(stack.map(function (c, k) {
          c.z = k;
          return tween(c, { x: 1000, y: 512 - k * .35, rot: from[2] }, .16, { delay: k * .018, fn: function (p) { if (p === 1 && k % 3 === 0) flick(.12); } });
        })); if (!view.alive(tok)) return;
        await wait(.15); if (!view.alive(tok)) return;
      }
      var count = { bottom: 0, left: 0, top: 0, right: 0 }, zTop = 100;
      for (var q = 0; q < sequence.length; q++) {
        var st = sequence[q], c = byId[st.card.id], t = pileAt(st.seat, count[st.seat]++, 8);
        c.z = zTop++;
        flick();
        // on the simplified table the other players' cards go into their avatars and vanish
        tween(c, simple() && st.seat !== 'bottom' ? { x: t.x, y: t.y, rot: t.rot, alpha: 0, sc: .5 } : { x: t.x, y: t.y, rot: t.rot }, .34);
        await wait(.075); if (!view.alive(tok)) return;
        if (sequence[q + 1] && sequence[q + 1].seat !== st.seat) { await wait(.12); if (!view.alive(tok)) return; }
      }
      await wait(.4);
    },
    // your hand: fanned at the bottom, face up, in the given order
    layoutHand: function (ids) {
      ids.forEach(function (id, i) {
        var c = byId[id], t = fanAt(i, ids.length), first = !c.mine;
        c.z = 300 + i; c.mine = true;
        tween(c, { x: t.x, y: t.y, rot: t.rot, sc: handScale() }, first ? .5 : .3, { delay: first ? i * .04 : 0, ease: ease.inOut });
        if (c.flip < 1) tween(c, { flip: 1 }, .35, { delay: .45 + i * .06, ease: ease.inOut, fn: function (p) { if (p === 1) flick(.1); } });
      });
      handState();
      return wait(.9);
    },
    // an opponent's face-down cards, re-spaced after a card leaves
    layoutPile: function (seat, ids) {
      ids.forEach(function (id, i) { var t = pileAt(seat, i, ids.length); tween(byId[id], { x: t.x, y: t.y, rot: t.rot }, .25); });
    },
    // wait for you to tap one of the legal cards; the others are darkened
    waitHuman: function (hand, legal, hint) {
      setHandHidden(false);   // your move: the hand comes back up
      hand.forEach(function (id) {
        var c = byId[id], ok = legal.indexOf(id) >= 0;
        c.base = ok ? 18 : 0;
        tween(c, { dim: ok ? 0 : 1, lift: c.base }, .2);
      });
      return new Promise(function (res) { humanWait = { legal: legal, res: res, hand: hand, hint: hint }; });
    },
    playCard: function (seat, id) {
      var c = byId[id], t = (simple() ? TRICK_SIMPLE : TRICK_SPOT)[seat];
      c.mine = false; c.base = 0; c.z = trickZ++;
      if (c === hover) hover = null;
      handState();
      flick(.25);
      tween(c, { dim: 0, lift: 0 }, .15);
      tween(c, { flip: 1 }, .3, { ease: ease.inOut });
      return tween(c, { x: t[0], y: t[1], rot: t[2], sc: simple() ? 1.65 : 1.15, alpha: 1 }, .4, { ease: ease.out });
    },
    // the trick slides to the winner and is gone
    collect: async function (seat, ids) {
      var f = simple() ? SIMPLE[seat] : SEATS[seat].face;
      await Promise.all(ids.map(function (id, i) {
        return tween(byId[id], { x: f[0], y: f[1], sc: .5, alpha: 0 }, .45, { delay: i * .03, ease: ease.inOut });
      }));
      cards = cards.filter(function (c) { return ids.indexOf(c.id) < 0; });
    },
    clear: async function () {
      await Promise.all(cards.map(function (c) { return tween(c, { alpha: 0, sc: c.sc * .8 }, .3); }));
      cards = []; byId = {}; hover = null; handState();
    },
    // whoever has to act gets their nameplate lit; null for nobody
    turn: function (seat) {
      screen.querySelectorAll('[data-plate]').forEach(function (el) { el.classList.toggle('is-turn', el.getAttribute('data-plate') === seat); });
    },
    say: function (seat, text, kind) { bubble(seat, text, kind); },
    chime: function () { chime(); },
    // the HUD (last trick, score, buttons) comes in once the first hand has been dealt
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
      var dx = x - c.x, dy = y - c.y, ca = Math.cos(-c.rot), sa = Math.sin(-c.rot);
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
  var last = 0, active = false, raf = 0;
  function glow(x, y, r, col) {
    var g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  function drawSeat(s) {
    if (s.light <= 0) return;
    var px = s.pivot[0], py = s.pivot[1], sc = s.sc;
    if (s.idle) sc *= 1 + .005 * Math.sin(clock * 1.7 + px);
    if (s.vidReady && s.vidMask.complete && s.vidMask.naturalWidth) {
      var r = s.video.rect, vc = s.vidCanvas, g = vc.getContext('2d');
      g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, vc.width, vc.height);
      g.drawImage(s.vid, 0, 0, vc.width, vc.height);
      g.globalCompositeOperation = 'destination-in'; g.drawImage(s.vidMask, 0, 0, vc.width, vc.height);
      ctx.save(); ctx.globalAlpha = Math.min(1, s.light);
      ctx.drawImage(vc, r[0], r[1], r[2], r[3]); ctx.restore();
      return;
    }
    ctx.save();
    ctx.globalAlpha = Math.min(1, s.light * 1.15);
    ctx.translate(px + s.dx, py + s.dy); ctx.rotate(s.rot); ctx.scale(sc, sc); ctx.translate(-px, -py);
    ctx.drawImage(s.sprite, s.crop[0], s.crop[1]);
    for (var k in s.parts) {
      var pt = s.parts[k];
      ctx.save();
      ctx.translate(pt.p[0] + pt.dx, pt.p[1] + pt.dy); ctx.rotate(pt.rot); ctx.translate(-pt.p[0], -pt.p[1]);
      ctx.drawImage(pt.sprite, pt.r[0], pt.r[1]);
      ctx.restore();
    }
    ctx.restore();
  }
  function pool(x, y, rx, ry, a) {
    sh.save(); sh.translate(x, y); sh.scale(rx, ry);
    var g = sh.createRadialGradient(0, 0, 0, 0, 0, 1);
    g.addColorStop(0, 'rgba(0,0,0,' + a + ')'); g.addColorStop(.55, 'rgba(0,0,0,' + a * .75 + ')'); g.addColorStop(1, 'rgba(0,0,0,0)');
    sh.fillStyle = g; sh.fillRect(-1, -1, 2, 2); sh.restore();
  }
  function frame(now) {
    if (!active) return;
    var dt = Math.min(50, now - (last || now)); last = now; clock += dt / 1000;
    stepTweens(dt);
    ctx.setTransform(cv.width / W, 0, 0, cv.height / H, 0, 0);
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    var z = S.zoom, k = 1 + .34 * z, room3d = S.simple < 1;
    if (room3d) {
    // camera: scale up around the room's table, which ends where the simplified table sits
    ctx.save();
    ctx.translate(1009 - 9 * z, 528 - 68 * z); ctx.scale(k, k); ctx.translate(-1009, -528);
    if (S.blur > 0) ctx.filter = 'blur(' + (S.blur * 5 * cv.width / 1704).toFixed(2) + 'px)';
    if (room.complete && room.naturalWidth) ctx.drawImage(room, 0, 0, W, H);
    // the players stay in their seats and blur away with the room
    IDS.forEach(function (id) { if (SEATS[id].sprite) drawSeat(SEATS[id]); });
    ctx.filter = 'none';

    // Room light: a dark veil with warm pools cut out where players sit and over the table.
    sh.setTransform(1, 0, 0, 1, 0, 0);
    sh.globalCompositeOperation = 'source-over'; sh.clearRect(0, 0, shade.width, shade.height);
    sh.fillStyle = 'rgba(10,5,2,' + S.amb + ')'; sh.fillRect(0, 0, shade.width, shade.height);
    sh.setTransform(.25, 0, 0, .25, 0, 0);
    sh.globalCompositeOperation = 'destination-out';
    pool(1000, 525, 620, 330, S.table);
    pool(40, 260, 330, 330, .5 + .08 * Math.sin(clock * 9));
    IDS.forEach(function (id) {
      var s = SEATS[id];
      if (s.light > 0) pool(s.crop[0] + s.crop[2] / 2, s.crop[1] + s.crop[3] / 2, s.crop[2] * .8, s.crop[3] * .8, .9 * s.light);
    });
    ctx.drawImage(shade, 0, 0, W, H);

    ctx.globalCompositeOperation = 'lighter';
    var fl = .13 + .05 * Math.sin(clock * 9) + .03 * Math.sin(clock * 23);
    glow(30, 260, 300, 'rgba(255,140,40,' + fl + ')');
    glow(1890, 30, 260, 'rgba(255,200,120,' + .12 * S.lamps + ')');
    glow(1000, 525, 520, 'rgba(255,60,40,' + .05 * S.lamps + ')');
    IDS.forEach(function (id) {
      var s = SEATS[id];
      if (s.light > 0) glow(s.crop[0] + s.crop[2] / 2, s.crop[1] + s.crop[3] / 2, s.crop[3] * .7, 'rgba(255,190,110,' + .07 * s.light * (1 - S.lamps * .6) + ')');
      if (s.ring > 0 && s.ring < 1) {
        ctx.strokeStyle = 'rgba(241,212,154,' + .6 * (1 - s.ring) + ')'; ctx.lineWidth = 6 * (1 - s.ring);
        ctx.beginPath(); ctx.ellipse(s.face[0], s.face[1], 40 + 200 * s.ring, 30 + 150 * s.ring, 0, 0, Math.PI * 2); ctx.stroke();
      }
    });
    var top = SEATS.top;
    if (top.light > 0 && !top.vidReady) {
      var c = top.parts.cigar, h = top.parts.head;
      glow(CIGAR_TIP[0] + c.dx, CIGAR_TIP[1] + c.dy, 10 + 18 * top.glow, 'rgba(255,' + (120 + 40 * top.glow) + ',40,' + (.35 + .55 * top.glow + .08 * Math.sin(clock * 13)) + ')');
      glow(CYBER_EYE[0] + h.dx, CYBER_EYE[1] + h.dy, 16, 'rgba(255,190,60,' + (.25 + .2 * Math.sin(clock * 2.3)) * top.light + ')');
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.restore();
    }
    // the simplified table fades in on the same zoom, so the two tables stay on top of each other
    if (S.simple > 0) {
      ctx.save(); ctx.globalAlpha = S.simple;
      var bk = 1 + .08 * (1 - z);
      ctx.translate(1000, 460); ctx.scale(bk, bk); ctx.translate(-1000, -460);
      if (simpleBg.complete && simpleBg.naturalWidth) ctx.drawImage(simpleBg, 0, 0, W, H);
      if (S.simple >= 1 && !reduced) drawStorm();
      ctx.setTransform(cv.width / W, 0, 0, cv.height / H, 0, 0); ctx.globalAlpha = S.simple;
      var tk = k / 1.34;
      ctx.translate(1000, 460); ctx.scale(tk, tk); ctx.translate(-1000, -460);
      if (simpleTable.complete && simpleTable.naturalWidth) ctx.drawImage(simpleTable, 0, 0, W, H);
      ctx.restore();
    }

    cards.sort(function (a, b) { return a.z - b.z; }).forEach(function (cd) { cd.draw(); });

    if (room3d && S.zoom === 0 && top.idle && !top.vidReady && clock > nextSmoke) {
      smoke(CIGAR_TIP[0] + top.parts.cigar.dx, CIGAR_TIP[1] + top.parts.cigar.dy, 3);
      nextSmoke = clock + 1.2 + Math.random();
    }
    var ds = dt / 1000;
    particles = particles.filter(function (p) { return (p.life += ds) < p.max; });
    particles.forEach(function (p) {
      if (p.life < 0) return;
      var k = p.life / p.max;
      if (p.k === 'spark') {
        p.x += p.vx * ds; p.y += p.vy * ds; p.vx *= .96; p.vy *= .96;
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = 'rgba(255,214,130,' + (1 - k) + ')'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
      } else {
        p.x += (p.vx + Math.sin(clock * 2 + p.r) * 10) * ds; p.y += p.vy * ds; p.vx *= .99;
        var r = p.r * (1 + k * 4), g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
        g.addColorStop(0, 'rgba(225,220,212,' + p.a * (1 - k) + ')'); g.addColorStop(1, 'rgba(225,220,212,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
      }
    });

    if (moves.on && clock > moves.next) { moveSomeone(); moves.next = clock + MOVE_EVERY; }
    if (S.black > 0) { ctx.fillStyle = 'rgba(0,0,0,' + S.black + ')'; ctx.fillRect(0, 0, W, H); }
    raf = requestAnimationFrame(frame);
  }

  // ---------- The storm behind the simplified table: lightning in the red clouds ----------
  // Every few seconds a bolt forks down from the clouds at one side of the table (a double flash,
  // the clouds lit up round it), and now and then only the clouds flicker, as with far-off lightning.
  var storm = { next: Infinity, t: 0, bolt: null, x: 0, y: 0, power: 0 };
  function makeBolt(x, y, len, w) {
    var pts = [[x, y]], out = [{ pts: pts, w: w }];
    for (var d = 0; d < len; d += 26 + Math.random() * 24) {
      x += (Math.random() - .5) * 70; y += 26 + Math.random() * 24; pts.push([x, y]);
      if (w > 1.2 && Math.random() < .2) out = out.concat(makeBolt(x, y, len * (.25 + Math.random() * .3), w * .5));
    }
    return out;
  }
  function drawStorm() {
    if (clock > storm.next) {
      var left = Math.random() < .5, far = Math.random() < .35;
      storm.x = left ? 120 + Math.random() * 480 : 1330 + Math.random() * 250;
      storm.y = 40 + Math.random() * 60;
      storm.bolt = far ? null : makeBolt(storm.x, storm.y - 60, 220 + Math.random() * 200, 3.2);
      storm.power = far ? .45 : 1; storm.t = clock;
      storm.next = clock + 3.5 + Math.random() * 5;
    }
    var t = clock - storm.t;
    if (t > .7) return;
    // double flash, then a fade
    var a = (t < .07 ? 1 : t < .14 ? .25 : t < .24 ? .85 : .85 * (1 - (t - .24) / .46)) * storm.power;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = .35 * a; ctx.drawImage(simpleBg, 0, 0, W, H);
    ctx.globalAlpha = 1;
    glow(storm.x, storm.y + 60, 520, 'rgba(255,80,70,' + .35 * a + ')');
    glow(storm.x, storm.y + 40, 200, 'rgba(255,200,190,' + .25 * a + ')');
    if (storm.bolt) {
      ctx.lineJoin = ctx.lineCap = 'round';
      storm.bolt.forEach(function (b) {
        [[b.w * 6, 'rgba(255,60,60,' + .18 * a + ')'], [b.w * 2.2, 'rgba(255,150,150,' + .5 * a + ')'], [b.w * .8, 'rgba(255,245,240,' + a + ')']].forEach(function (l) {
          ctx.lineWidth = l[0]; ctx.strokeStyle = l[1]; ctx.beginPath();
          b.pts.forEach(function (p, i) { if (i) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); });
          ctx.stroke();
        });
      });
    }
    ctx.restore();
  }

  // ---------- Boot: cut the sprites and paint the deck once the art has loaded ----------
  var art = [img, room, simpleBg, simpleTable, backArt].concat(Object.keys(faceArt).map(function (k) { return faceArt[k]; }));
  var booting = Promise.all(art.map(function (im) { return im.decode().catch(function () {}); })).then(function () {
    IDS.forEach(function (id) {
      var s = SEATS[id];
      s.sprite = feathered(s.crop);
      for (var k in s.parts) s.parts[k].sprite = feathered(s.parts[k].r, .5);
    });
    faceCache = {}; backCache = {};
  });

  // The Play button is the user gesture that unlocks Web Audio for the table sounds.
  var playBtn = document.querySelector('[data-stage-play]');
  playBtn.addEventListener('click', function () {
    audio();
    IDS.forEach(function (id) { SEATS[id].vid.load(); });
    // let the "into battle" hit land, then cut to the table
    setTimeout(function () { window.BlotNav.show('table'); }, 700);
  });

  document.addEventListener('screen:show', function (e) {
    if (e.detail === 'table') {
      active = true; last = 0;
      sizeCanvas();
      resetState();
      cancelAnimationFrame(raf); raf = requestAnimationFrame(frame);
      audio(); startFire();
      booting.then(function () { if (active) play(); });
    } else if (active) {
      active = false; run++;
      screen.classList.remove('tb-enter', 'tb-zoom', 'tb-simple'); closePops(null);
      screen.querySelectorAll('[data-plate]').forEach(function (el) { el.classList.remove('is-on'); });
      Object.keys(bubbles).forEach(function (k) { bubbles[k].textContent = ''; });
      if (window.BlotGame) window.BlotGame.stop();
      cancelAnimationFrame(raf);
      IDS.forEach(function (id) { try { SEATS[id].vid.pause(); } catch (err) {} });
      stopFire();
    }
  });

  // ---------- HUD ----------
  // The settings gear is gone from the design; Escape still goes back to the stage select (prototype shortcut).
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
      var total = screen.querySelector('[data-total="' + t[0] + '"]');
      countUp(shown[t[0]], t[1], function (n) {
        cells.forEach(function (el) { el.innerHTML = '<b>' + n + '</b><small>/' + window.BlotRules.GAME_TARGET + '</small>'; });
        total.textContent = n + '/' + window.BlotRules.GAME_TARGET;
      });
      shown[t[0]] = t[1];
    });
  }
  // The simplified table's big numbers: the points each side has taken so far this round.
  var roundShown = { us: 0, them: 0 };
  function setRound(us, them) {
    [['us', us], ['them', them]].forEach(function (t) {
      var el = screen.querySelector('[data-round="' + t[0] + '"]');
      if (roundShown[t[0]] !== t[1] && t[1] > 0) { el.classList.remove('is-counting'); void el.offsetWidth; el.classList.add('is-counting'); }
      countUp(roundShown[t[0]], t[1], function (n) { el.textContent = n; });
      roundShown[t[0]] = t[1];
    });
  }
  // cards: [{rank, suit}] (engine cards) or [] for none yet. The simplified minis (big index, suit), as in Classroom.
  function setLastTrick(cards) {
    var box = screen.querySelector('[data-trick-cards]');
    box.innerHTML = (cards || []).map(function (c) {
      return '<img class="tb-mini" src="assets/review/mini/' + c.rank + c.suit + '.webp" alt="' + c.rank + c.suit + '">';
    }).join('');
    box.hidden = !(cards && cards.length);
    screen.querySelector('[data-trick-empty]').hidden = !box.hidden;
  }
  setScore(0, 0); setRound(0, 0); setLastTrick([]);
  // Play-randomly shortcuts (js/game.js): faster animations, and your pending card picked for you.
  function setSpeed(n) { SPEED = n; }
  function autoPlayCard() {
    if (!humanWait) return;
    var w = humanWait; humanWait = null;
    w.hand.forEach(function (h) { var c = byId[h]; if (c) { c.base = 0; c.dim = 0; } });
    w.res(w.legal[Math.floor(Math.random() * w.legal.length)]);
  }
  window.BlotTable = { setScore: setScore, setRound: setRound, setLastTrick: setLastTrick, countUp: countUp, setSpeed: setSpeed, autoPlayCard: autoPlayCard };

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
    if (kind === 'react') {   // a reaction picture from the drawer
      el = document.createElement('img'); el.className = 'tb-say_react'; el.src = text + '?t=' + Date.now(); el.alt = '';   // fresh copy, so the clip starts from its first frame
    } else {
      el.className = kind === 'emoji' ? 'tb-say_emoji' : 'tb-say_line' + (kind ? ' tb-say_line--' + kind : '');
      el.textContent = text;
    }
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
  // reactions drawer: a picture pops up over your seat; the veil or the cross closes it
  screen.querySelectorAll('[data-react]').forEach(function (b) {
    b.addEventListener('click', function () { closePops(null); bubble('bottom', b.getAttribute('data-react'), 'react'); });
  });
  // Reactions / GIFs tabs at the bottom of the drawer
  screen.querySelectorAll('[data-react-show]').forEach(function (b) {
    b.addEventListener('click', function () {
      var want = b.getAttribute('data-react-show');
      screen.querySelectorAll('[data-react-show]').forEach(function (t) { t.classList.toggle('is-active', t === b); });
      screen.querySelectorAll('[data-react-tab]').forEach(function (p) { p.hidden = p.getAttribute('data-react-tab') !== want; });
    });
  });
  var handBtn = screen.querySelector('[data-hand-toggle]');
  if (handBtn) handBtn.addEventListener('click', function (e) { e.stopPropagation(); closePops(null); setHandHidden(!handHidden); });
  // ---------- Throwables: the glove opens a tray; pick an item, then tap an opponent ----------
  // Everything is drawn in code over the table (a .tb-fx layer above the HUD). The glove rolls hit or
  // block at the throw; the others each play their own gag on the target's profile. The cigar and the
  // violin start at a seat instead of flying, and the white flag goes up over your own seat.
  // BlotTable.throwAt(item, seat, outcome) runs one directly (outcome: 'hit' | 'block' for the glove).
  var glove = screen.querySelector('[data-glove]'), tray = screen.querySelector('[data-throws]');
  var ui = screen.querySelector('.tb-ui');
  var fx = document.createElement('div'); fx.className = 'tb-fx'; ui.appendChild(fx);
  var hint = document.createElement('div'); hint.className = 'tb-aimhint'; hint.textContent = 'Выберите, в кого бросить'; ui.appendChild(hint);
  var profs = {};
  ['top', 'left', 'right', 'bottom'].forEach(function (s) { profs[s] = screen.querySelector('.tb-prof--' + s); });
  var ITEM_SRC = { glove: 'assets/table/simple/glove.webp' };
  var NO_TARGET = { flag: true };
  var armed = null;

  function setTray(open) { tray.hidden = !open; glove.setAttribute('aria-expanded', String(open)); }
  function arm(name) { armed = name; screen.classList.toggle('tb-aiming', !!name); }
  if (glove) glove.addEventListener('click', function (e) {
    e.stopPropagation(); closePops(null);
    if (armed) { arm(null); return; }
    setTray(tray.hidden);
  });
  tray.querySelectorAll('[data-throw]').forEach(function (b) {
    b.addEventListener('click', function (e) {
      e.stopPropagation(); setTray(false);
      var name = b.getAttribute('data-throw');
      if (NO_TARGET[name]) throwAt(name, 'bottom'); else arm(name);
    });
  });
  ['top', 'left', 'right'].forEach(function (seat) {
    profs[seat].addEventListener('click', function (e) {
      if (!armed) return;
      e.stopPropagation(); var name = armed; arm(null); throwAt(name, seat);
    });
  });
  screen.addEventListener('click', function (e) {
    if (!e.target.closest('[data-throws], [data-glove]')) setTray(false);
    if (armed && !e.target.closest('.tb-prof')) arm(null);
  });

  // geometry, in the UI's own px (the device frame may be scaled)
  function fxBox(el) {
    var u = ui.getBoundingClientRect(), r = el.getBoundingClientRect(), k = u.width / ui.offsetWidth;
    return { x: (r.left - u.left + r.width / 2) / k, y: (r.top - u.top + r.height / 2) / k, w: r.width / k, h: r.height / k };
  }
  function ringOf(seat) { return fxBox(profs[seat].querySelector('.tb-prof_ring')); }
  // which way is "away from the table" for a seat
  function outward(seat) { return seat === 'left' ? -1 : seat === 'right' ? 1 : 0; }

  function add(cls, html, x, y, size) {
    var el = document.createElement('div'); el.className = cls;
    if (html) el.innerHTML = html;
    el.style.left = x + 'px'; el.style.top = y + 'px';
    if (size) { el.style.width = size + 'px'; el.style.height = size + 'px'; }
    fx.appendChild(el); return el;
  }
  function item(name, size, p) { return add('tb-fx_item', '<img src="' + (ITEM_SRC[name] || 'assets/table/throw/' + name + '.webp') + '" alt="">', p.x, p.y, size); }
  function later(s) { return new Promise(function (r) { setTimeout(r, s * 1000); }); }
  function waAnim(el, frames, dur, opt) { return el.animate(frames, Object.assign({ duration: dur * 1000, fill: 'forwards', easing: 'ease-out' }, opt || {})).finished; }
  function gone(el, dur) { return waAnim(el, [{ opacity: 1 }, { opacity: 0 }], dur || .3).then(function () { el.remove(); }); }
  var C = 'translate(-50%, -50%) ';

  // a flight along a parabola: lift is how high the arc rises above the straight line
  function fly(el, a, b, dur, o) {
    o = o || {};
    return new Promise(function (res) {
      var t0 = performance.now(), lift = o.lift == null ? 90 : o.lift, s0 = o.s0 || 1, s1 = o.s1 || s0;
      (function step(now) {
        var t = Math.min(1, (now - t0) / (dur * 1000)), e = o.ease ? o.ease(t) : t;
        el.style.left = a.x + (b.x - a.x) * e + 'px';
        el.style.top = a.y + (b.y - a.y) * e - lift * 4 * e * (1 - e) + 'px';
        el.style.transform = C + 'rotate(' + ((o.r0 || 0) + (o.spin || 0) * e) + 'deg) scale(' + (s0 + (s1 - s0) * e) + ')';
        if (o.fade) el.style.opacity = String(1 - Math.max(0, (t - o.fade) / (1 - o.fade)));
        if (t < 1) requestAnimationFrame(step); else res();
      })(t0);
    });
  }
  var easeIn = function (t) { return t * t; };

  // the target's profile: a jolt of the whole card and a punch of the ring
  function shake(seat, amp) {
    amp = amp || 6;
    profs[seat].animate([0, -1, .8, -.6, .4, -.2, 0].map(function (k, i) { return { transform: 'translate(' + k * amp + 'px,' + (i % 2 ? -1 : 1) * Math.abs(k) * amp * .4 + 'px)' }; }), { duration: 450 });
    profs[seat].querySelector('.tb-prof_ring').animate([{ transform: 'scale(1)' }, { transform: 'scale(.88)' }, { transform: 'scale(1.06)' }, { transform: 'scale(1)' }], { duration: 380, easing: 'ease-out' });
  }
  function burst(p, color) {
    var rays = '';
    for (var i = 0; i < 8; i++) rays += '<i style="--a:' + (i * 45 + 22) + 'deg"></i>';
    var el = add('tb-fx_burst', rays, p.x, p.y); if (color) el.style.setProperty('--c', color);
    later(.6).then(function () { el.remove(); });
  }
  function word(text, p, cls) {
    var el = add('tb-fx_word' + (cls ? ' ' + cls : ''), '', p.x, p.y); el.textContent = text;
    waAnim(el, [{ transform: C + 'scale(.2) rotate(-12deg)', opacity: 0 }, { transform: C + 'scale(1.15) rotate(-6deg)', opacity: 1, offset: .25 }, { transform: C + 'scale(1) rotate(-6deg)', opacity: 1, offset: .7 }, { transform: C + 'translateY(-12px) scale(1) rotate(-6deg)', opacity: 0 }], 1.1).then(function () { el.remove(); });
  }
  // droplets / flakes: little dots that fly out and fall
  function spray(p, n, color, spread, size) {
    for (var i = 0; i < n; i++) {
      var d = add('tb-fx_dot', '', p.x, p.y, (size || 5) * (.6 + Math.random() * .8)); d.style.background = color;
      var a = Math.random() * Math.PI * 2, r = spread * (.5 + Math.random() * .6);
      fly(d, p, { x: p.x + Math.cos(a) * r, y: p.y + Math.sin(a) * r * .6 + 26 }, .55 + Math.random() * .3, { lift: 18 + Math.random() * 16, fade: .5 }).then(function (el) { return function () { el.remove(); }; }(d));
    }
  }
  // a blob outline (for the tomato splat), radius wobbling around r
  function blob(r, n, wob) {
    var pts = [];
    for (var i = 0; i < n; i++) { var a = i / n * Math.PI * 2, k = r * (1 - wob / 2 + Math.random() * wob); pts.push([Math.cos(a) * k, Math.sin(a) * k]); }
    var d = '';
    pts.forEach(function (p, i) { var q = pts[(i + 1) % n], m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]; d += (i ? ' Q' : 'M' + ((p[0] + pts[n - 1][0]) / 2).toFixed(1) + ' ' + ((p[1] + pts[n - 1][1]) / 2).toFixed(1) + ' Q') + p[0].toFixed(1) + ' ' + p[1].toFixed(1) + ' ' + m[0].toFixed(1) + ' ' + m[1].toFixed(1); });
    return d + 'Z';
  }
  // tiny synth sounds (no files): the chicken squeak and the sad violin
  var actx = null;
  function tones(seq) {
    try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    var t = actx.currentTime + .02;
    seq.forEach(function (n) {
      var o = actx.createOscillator(), g = actx.createGain();
      o.type = n.type || 'triangle'; o.frequency.setValueAtTime(n.f, t + n.at);
      if (n.f2) o.frequency.exponentialRampToValueAtTime(n.f2, t + n.at + n.d);
      if (n.vib) { var l = actx.createOscillator(), lg = actx.createGain(); l.frequency.value = 6; lg.gain.value = n.vib; l.connect(lg); lg.connect(o.frequency); l.start(t + n.at); l.stop(t + n.at + n.d + .05); }
      g.gain.setValueAtTime(0, t + n.at); g.gain.linearRampToValueAtTime(n.v || .08, t + n.at + .03); g.gain.exponentialRampToValueAtTime(.001, t + n.at + n.d);
      o.connect(g); g.connect(actx.destination); o.start(t + n.at); o.stop(t + n.at + n.d + .05);
    });
  }

  // filtered noise bursts: whooshes, splats, crunches, thumps
  function noise(seq) {
    try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    var t = actx.currentTime + .02;
    seq.forEach(function (n) {
      var len = Math.ceil(actx.sampleRate * n.d), buf = actx.createBuffer(1, len, actx.sampleRate), ch = buf.getChannelData(0);
      for (var i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1;
      var src = actx.createBufferSource(), f = actx.createBiquadFilter(), g = actx.createGain();
      src.buffer = buf; f.type = n.type || 'bandpass'; f.Q.value = n.q || 1;
      f.frequency.setValueAtTime(n.f, t + n.at); if (n.f2) f.frequency.exponentialRampToValueAtTime(n.f2, t + n.at + n.d);
      g.gain.setValueAtTime(0, t + n.at); g.gain.linearRampToValueAtTime(n.v || .2, t + n.at + (n.att || .01)); g.gain.exponentialRampToValueAtTime(.001, t + n.at + n.d);
      src.connect(f); f.connect(g); g.connect(actx.destination); src.start(t + n.at); src.stop(t + n.at + n.d + .02);
    });
  }
  var SFX = {
    whoosh: function (d) { noise([{ f: 300, f2: 1600, d: d || .5, at: 0, q: 1.2, v: .08, att: .2 }]); },
    punch: function () { noise([{ f: 900, d: .08, at: 0, q: .7, v: .35, type: 'lowpass' }]); tones([{ f: 140, f2: 50, d: .22, at: 0, type: 'sine', v: .35 }]); },
    slap: function () { noise([{ f: 2200, d: .07, at: 0, q: .8, v: .3 }]); tones([{ f: 260, f2: 120, d: .1, at: 0, type: 'sine', v: .15 }]); },
    splat: function () { noise([{ f: 1200, f2: 200, d: .3, at: 0, q: 2, v: .35, type: 'lowpass' }, { f: 500, f2: 150, d: .45, at: .05, q: 4, v: .15 }]); },
    crunch: function () { noise([{ f: 3000, f2: 1200, d: .18, at: 0, q: .6, v: .25, type: 'highpass' }, { f: 900, d: .25, at: .02, q: 1, v: .15 }]); },
    sparkle: function () { tones([{ f: 1760, d: .25, at: .05, v: .03 }, { f: 2349, d: .3, at: .12, v: .025 }, { f: 2637, d: .35, at: .2, v: .02 }]); },
    squeak: function () { tones([{ f: 900, f2: 2000, d: .1, at: 0, type: 'square', v: .05 }, { f: 1900, f2: 650, d: .28, at: .1, type: 'square', v: .05 }]); },
    bonk: function () { tones([{ f: 420, f2: 260, d: .12, at: 0, type: 'sine', v: .2 }]); },
    puff: function () { noise([{ f: 500, f2: 250, d: .5, at: 0, q: .8, v: .12, att: .08, type: 'lowpass' }]); },
    sizzle: function () { noise([{ f: 5000, d: .5, at: 0, q: .5, v: .04, att: .1, type: 'highpass' }]); },
    pop: function () { tones([{ f: 500, f2: 1100, d: .08, at: 0, type: 'sine', v: .15 }]); },
    violin: function () { tones([{ f: 659, d: .42, at: 0, type: 'sawtooth', v: .035, vib: 6 }, { f: 622, d: .42, at: .42, type: 'sawtooth', v: .035, vib: 6 }, { f: 587, d: .42, at: .84, type: 'sawtooth', v: .035, vib: 6 }, { f: 554, d: 1, at: 1.26, type: 'sawtooth', v: .035, vib: 8 }]); },
    drip: function () { tones([{ f: 1200, f2: 500, d: .12, at: 0, type: 'sine', v: .12 }]); },
    // the sad trombone "wah wah wah wahhh"
    trombone: function () { tones([{ f: 294, f2: 277, d: .32, at: 0, type: 'sawtooth', v: .04 }, { f: 277, f2: 262, d: .32, at: .34, type: 'sawtooth', v: .04 }, { f: 262, f2: 247, d: .32, at: .68, type: 'sawtooth', v: .04 }, { f: 247, f2: 233, d: .9, at: 1.02, type: 'sawtooth', v: .045, vib: 5 }]); }
  };

  var HAND = '<svg viewBox="0 0 40 48"><g fill="#e8b48c" stroke="#6b3f26" stroke-width="1.4" stroke-linejoin="round">' +
    '<rect x="6" y="7" width="6.5" height="22" rx="3.2" transform="rotate(-9 9 29)"/><rect x="13" y="2" width="6.5" height="26" rx="3.2"/>' +
    '<rect x="20.5" y="3" width="6.5" height="25" rx="3.2"/><rect x="28" y="8" width="6" height="21" rx="3" transform="rotate(9 31 29)"/>' +
    '<path d="M5 30 Q4 22 10 22 L32 22 Q37 22 36 30 L35 38 Q33 46 22 46 L16 46 Q6 46 5 38 Z"/>' +
    '<path d="M7 33 Q-1 28 1.5 22.5 Q4.5 19 8.5 25 L12 30"/></g></svg>';
  var CRACK = '<svg viewBox="-40 -40 80 80"><g fill="none" stroke-linecap="round" stroke-linejoin="round">' +
    '<path stroke="rgba(0,0,0,.55)" stroke-width="3.4" d="M0 0 L-8 -14 L-6 -24 L-14 -38 M-8 -14 L-21 -12 M0 0 L14 -8 L22 -5 L36 -16 M14 -8 L18 5 M0 0 L6 16 L2 27 L10 40 M0 0 L-14 8 L-26 5 L-38 14 M-14 8 L-12 20"/>' +
    '<path stroke="#fff" stroke-width="1.5" d="M0 0 L-8 -14 L-6 -24 L-14 -38 M-8 -14 L-21 -12 M0 0 L14 -8 L22 -5 L36 -16 M14 -8 L18 5 M0 0 L6 16 L2 27 L10 40 M0 0 L-14 8 L-26 5 L-38 14 M-14 8 L-12 20"/></g></svg>';
  var CAP = '<svg viewBox="-44 -22 88 36"><path fill="#fff" stroke="#bfe0ff" stroke-width="1.5" d="M-40 8 C-42 -6 -26 -14 -12 -12 C-6 -21 12 -21 18 -11 C32 -14 44 -4 40 8 C33 3 26 12 16 6 C9 13 -2 11 -6 5 C-14 13 -28 11 -40 8Z"/><ellipse cx="-10" cy="-8" rx="10" ry="3" fill="#e6f4ff"/></svg>';
  var TEAR = '<svg viewBox="-14 -22 28 36"><defs><linearGradient id="tbTear" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bff0ff"/><stop offset="1" stop-color="#3a9dff"/></linearGradient></defs>' +
    '<path fill="url(#tbTear)" stroke="#1d6fd6" stroke-width="1.6" d="M0 -20 C6 -8 12 -1 12 7 A12 12 0 1 1 -12 7 C-12 -1 -6 -8 0 -20Z"/><ellipse cx="-4.5" cy="4" rx="3" ry="5" fill="#fff" opacity=".8"/></svg>';

  var THROWS = {
    // glove: a hit (crack, burst, shake) or a block (he leans out of his ring and catches it)
    glove: async function (seat, to, from, outcome) {
      var block = outcome ? outcome === 'block' : Math.random() < .5;
      var g = item('glove', 42, from); SFX.whoosh(.6);
      if (!block) {
        await fly(g, from, to, .6, { lift: 110, spin: 540, s0: .8, s1: 1.25 });
        SFX.punch(); burst(to); shake(seat, 7); word('БАХ!', { x: to.x, y: to.y - 52 });
        var cr = add('tb-fx_crack', CRACK, to.x, to.y, to.w - 6);
        later(1.4).then(function () { gone(cr, .5); });
        await fly(g, to, { x: to.x + 18, y: to.y + 70 }, .6, { lift: 26, r0: 540, spin: 120, s0: 1.25, s1: 1, fade: .3 });
        g.remove(); return;
      }
      var ring = profs[seat].querySelector('.tb-prof_ring img'), side = outward(seat) || 1;
      var face = { x: to.x, y: to.y + 12 }, catchAt = { x: face.x - side * 26, y: face.y + 20 };
      var flight = fly(g, from, catchAt, .62, { lift: 100, spin: 540, s0: .8, s1: 1.15 });
      await later(.12);
      // he leans out of the frame: a copy of the portrait comes forward, bigger, over the HUD
      var out = add('tb-fx_catch', '<img src="' + ring.getAttribute('src') + '" alt="">', to.x, to.y, ring.getBoundingClientRect().width / (ui.getBoundingClientRect().width / ui.offsetWidth));
      ring.style.opacity = '0';
      waAnim(out, [{ transform: C + 'scale(1)', top: to.y + 'px' }, { transform: C + 'scale(1.45)', top: face.y + 'px' }], .3, { easing: 'cubic-bezier(.3,1.4,.5,1)' });
      await later(.16);
      var hand = add('tb-fx_hand', HAND, catchAt.x, catchAt.y);
      hand.style.setProperty('--flip', -side);
      waAnim(hand, [{ transform: C + 'translateY(36px) scaleX(var(--flip)) rotate(-10deg)', opacity: 0 }, { transform: C + 'translateY(0) scaleX(var(--flip)) rotate(0)', opacity: 1 }], .26, { easing: 'cubic-bezier(.3,1.5,.5,1)' });
      await flight;
      // caught: a squash, both wobble together, a smirk
      SFX.slap(); g.style.zIndex = 2;
      waAnim(g, [{ transform: C + 'scale(1.35,.85)' }, { transform: C + 'scale(1.05)' }], .18);
      waAnim(hand, [{ transform: C + 'translateY(0) scaleX(var(--flip))' }, { transform: C + 'translateY(5px) scaleX(var(--flip))' }, { transform: C + 'translateY(0) scaleX(var(--flip))' }], .25);
      word('Мимо!', { x: face.x, y: face.y - 66 }, 'tb-fx_word--cool');
      bubble(seat, '😏', 'emoji');
      await later(.55);
      // the toss: a flick of the hand sends it away from the table
      waAnim(hand, [{ transform: C + 'scaleX(var(--flip)) rotate(0)' }, { transform: C + 'scaleX(var(--flip)) rotate(' + (-side * 28) + 'deg) translateY(-6px)' }], .15);
      SFX.whoosh(.45);
      var away = fly(g, catchAt, { x: catchAt.x + side * 200, y: catchAt.y - 150 }, .55, { lift: 30, spin: side * 720, s0: 1.05, s1: .7, fade: .4 });
      await later(.15);
      gone(hand, .2);
      await waAnim(out, [{ transform: C + 'scale(1.45)', top: face.y + 'px' }, { transform: C + 'scale(1)', top: to.y + 'px' }], .3, { easing: 'ease-in-out' });
      ring.style.opacity = ''; out.remove();
      await away; g.remove();
    },
    // tomato: a juicy red splat on the frame that slides down and fades
    tomato: async function (seat, to, from) {
      var t = item('tomato', 34, from); SFX.whoosh(.6);
      await fly(t, from, to, .6, { lift: 100, spin: 300, s0: .8, s1: 1.15 });
      t.remove(); shake(seat, 4); SFX.splat();
      spray(to, 9, '#d71c1c', 46, 6);
      var svg = '<svg viewBox="-50 -50 100 100"><path fill="#b8100f" d="' + blob(34, 11, .55) + '"/><path fill="#e2321f" d="' + blob(24, 9, .45) + '"/>' +
        '<ellipse cx="-9" cy="-10" rx="7" ry="4" fill="#fff" opacity=".45" transform="rotate(-25 -9 -10)"/>' +
        '<g fill="#f6d35c"><ellipse cx="6" cy="4" rx="2.4" ry="1.5"/><ellipse cx="-4" cy="10" rx="2.4" ry="1.5" transform="rotate(40 -4 10)"/><ellipse cx="12" cy="-6" rx="2.4" ry="1.5" transform="rotate(-30 12 -6)"/></g></svg>';
      var sp = add('tb-fx_splat', svg, to.x, to.y, 92);
      await waAnim(sp, [{ transform: C + 'scale(.3)', opacity: .6 }, { transform: C + 'scale(1.12)', opacity: 1, offset: .6 }, { transform: C + 'scale(1)', opacity: 1 }], .2);
      await later(.6);
      await waAnim(sp, [{ transform: C + 'scale(1)', opacity: 1 }, { transform: C + 'translateY(30px) scale(.92, 1.3)', opacity: 0 }], 1.3, { easing: 'ease-in' });
      sp.remove();
    },
    // cigar: lit at your own corner, a smoke ring drifts over, wraps the target's frame and spreads out
    cigar: async function (seat, to, from) {
      var at = { x: from.x + 6, y: from.y - 58 };
      var c = item('cigar', 46, at); SFX.pop(); SFX.sizzle();
      await waAnim(c, [{ transform: C + 'scale(0) rotate(-30deg)' }, { transform: C + 'scale(1) rotate(-12deg)' }], .3, { easing: 'cubic-bezier(.3,1.6,.5,1)' });
      for (var k = 0; k < 2; k++) {
        var puff = add('tb-fx_smoke', '', at.x - 14, at.y + 14, 10);
        fly(puff, { x: at.x - 14, y: at.y + 14 }, { x: at.x - 20, y: at.y - 14 }, .7, { lift: 0, s0: 1, s1: 2.5, fade: .2 }).then(function (el) { return function () { el.remove(); }; }(puff));
        await later(.25);
      }
      SFX.puff();
      var ring = add('tb-fx_ring', '', at.x - 10, at.y, 14);
      await fly(ring, { x: at.x - 10, y: at.y }, to, 1.1, { lift: 40, s0: 1, s1: (to.w + 16) / 14, ease: function (t) { return 1 - Math.pow(1 - t, 2); } });
      // round the frame, then it spreads and thins out
      noise([{ f: 700, f2: 300, d: .9, at: 0, q: .7, v: .06, att: .3, type: 'lowpass' }]);
      await waAnim(ring, [{ transform: C + 'scale(' + (to.w + 16) / 14 + ') rotate(0)', opacity: 1 }, { transform: C + 'scale(' + (to.w + 30) / 14 + ') rotate(180deg)', opacity: .9, offset: .5 }, { transform: C + 'scale(' + (to.w + 60) / 14 + ') rotate(300deg)', opacity: 0 }], 1.1, { easing: 'ease-in-out' });
      ring.remove();
      gone(c, .3);
    },
    // snowball: bursts on the frame, leaves a snow cap on top; the avatar shakes and the snow falls off
    snowball: async function (seat, to, from) {
      var s = item('snowball', 32, from); SFX.whoosh(.55);
      await fly(s, from, to, .55, { lift: 90, spin: 220, s0: .8, s1: 1.1 });
      s.remove(); shake(seat, 5); SFX.crunch(); SFX.sparkle();
      spray(to, 14, '#fff', 50, 6);
      burst(to, '#dff3ff');
      var top = { x: to.x, y: to.y - to.h / 2 + 2 };
      var cap = add('tb-fx_cap', CAP, top.x, top.y);
      await waAnim(cap, [{ transform: C + 'scale(.4, .2)', opacity: 0 }, { transform: C + 'scale(1.08, 1)', opacity: 1 }, { transform: C + 'scale(1)', opacity: 1 }], .25);
      await later(.7);
      shake(seat, 3); noise([{ f: 4000, f2: 2000, d: .6, at: 0, q: .5, v: .05, att: .1, type: 'highpass' }]);
      for (var i = 0; i < 12; i++) {
        var f = add('tb-fx_dot', '', top.x + (Math.random() - .5) * 64, top.y + 4, 3 + Math.random() * 4); f.style.background = '#fff';
        fly(f, { x: parseFloat(f.style.left), y: top.y + 4 }, { x: parseFloat(f.style.left) + (Math.random() - .5) * 20, y: top.y + 90 + Math.random() * 30 }, .7 + Math.random() * .4, { lift: -10, ease: easeIn, fade: .5 }).then(function (el) { return function () { el.remove(); }; }(f));
      }
      await waAnim(cap, [{ transform: C + 'translateY(0)', opacity: 1 }, { transform: C + 'translateY(30px) scale(.9)', opacity: 0 }], .7, { easing: 'ease-in' });
      cap.remove();
    },
    // rubber chicken: tumbles across the table, a soft bonk and a squeak, hangs upside down off the ring
    chicken: async function (seat, to, from) {
      var ch = item('chicken', 40, from); SFX.whoosh(.85);
      await fly(ch, from, to, .85, { lift: 70, spin: 1080, s0: .8, s1: 1.05 });
      SFX.bonk(); SFX.squeak();
      shake(seat, 3);
      word('ПИ-И-И!', { x: to.x + (outward(seat) || 1) * 46, y: to.y - 50 }, 'tb-fx_word--squeak');
      await waAnim(ch, [{ transform: C + 'rotate(1080deg) scale(1.3, .7)' }, { transform: C + 'rotate(1080deg) scale(1.05)' }], .16);
      // hooked on the top of the ring by its feet, head down, swinging
      var hang = { x: to.x + 14, y: to.y - to.h / 2 + 12 };
      await fly(ch, to, hang, .25, { lift: 20, r0: 0, spin: 180, s0: 1.05, s1: 1 });
      ch.style.transformOrigin = '50% 0';
      await waAnim(ch, [-18, 14, -9, 6, -3, 0].map(function (a) { return { transform: C + 'rotate(' + (180 + a) + 'deg)' }; }), 1.3, { easing: 'ease-in-out' });
      ch.style.transformOrigin = '';
      SFX.squeak();
      await fly(ch, hang, { x: hang.x + 8, y: hang.y + 110 }, .5, { lift: 0, r0: 180, spin: 40, ease: easeIn, fade: .5 });
      ch.remove();
    },
    // mini violin: pops up beside the target and plays; a few dramatic notes and one huge cartoon tear
    violin: async function (seat, to) {
      var side = seat === 'right' ? -1 : 1, at = { x: to.x + side * (to.w / 2 + 16), y: to.y + 4 };
      var v = item('violin', 40, at); SFX.pop();
      await waAnim(v, [{ transform: C + 'scale(0) rotate(' + side * -40 + 'deg)' }, { transform: C + 'scale(1) rotate(' + side * -10 + 'deg)' }], .3, { easing: 'cubic-bezier(.3,1.6,.5,1)' });
      SFX.violin();
      v.animate([0, 1, 0, 1, 0, 1, 0, 1, 0].map(function (k) { return { transform: C + 'rotate(' + side * (-10 + k * 8) + 'deg)' }; }), { duration: 2200, easing: 'ease-in-out' });
      ['♪', '♫', '♪', '♫'].forEach(function (n, i) {
        later(.1 + i * .42).then(function () {
          var el = add('tb-fx_note', '', at.x, at.y - 14); el.textContent = n;
          fly(el, { x: at.x, y: at.y - 14 }, { x: at.x + side * (10 + i * 6), y: at.y - 64 }, 1.1, { lift: 0, s0: .7, s1: 1.2, fade: .55 }).then(function () { el.remove(); });
        });
      });
      await later(.6);
      var tear = add('tb-fx_tear', TEAR, to.x + 14, to.y - 2, 30);
      await waAnim(tear, [{ transform: C + 'scale(0)' }, { transform: C + 'scale(1.15)', offset: .7 }, { transform: C + 'scale(1)' }], .35, { easing: 'ease-out' });
      SFX.drip();
      await waAnim(tear, [{ transform: C + 'translateY(0)', opacity: 1 }, { transform: C + 'translateY(26px) scale(.9, 1.1)', opacity: 1, offset: .8 }, { transform: C + 'translateY(34px) scale(.8)', opacity: 0 }], 1.4, { easing: 'ease-in' });
      tear.remove();
      await gone(v, .3);
    },
    // white flag: grows over your own seat and comically droops
    flag: async function (seat, to) {
      var at = { x: to.x + 34, y: to.y - 70 };
      var f = item('flag', 84, at); SFX.pop();
      f.style.transformOrigin = '30% 95%';
      await waAnim(f, [{ transform: C + 'scale(.2, 0)' }, { transform: C + 'scale(1, 1.1)', offset: .7 }, { transform: C + 'scale(1)' }], .4, { easing: 'cubic-bezier(.3,1.5,.5,1)' });
      f.animate([0, 1, 0, 1, 0].map(function (k) { return { transform: C + 'rotate(' + k * 4 + 'deg)' }; }), { duration: 700 });
      await later(.8);
      // and it gives up: the stick flops over and the cloth hangs
      SFX.trombone();
      await waAnim(f, [{ transform: C + 'rotate(0)' }, { transform: C + 'rotate(38deg) scale(.95, .9)', offset: .6 }, { transform: C + 'rotate(30deg) scale(.95, .9)', offset: .8 }, { transform: C + 'rotate(34deg) scale(.95, .9)' }], .8, { easing: 'ease-in' });
      await later(.9);
      await gone(f, .4);
    }
  };
  function throwAt(name, seat, outcome) {
    if (!THROWS[name] || !profs[seat]) return Promise.resolve();
    return THROWS[name](seat, ringOf(seat), fxBox(glove), outcome);
  }
  window.BlotTable.throwAt = throwAt;
  screen.querySelectorAll('[data-react-close]').forEach(function (b) {
    b.addEventListener('click', function () { closePops(null); });
  });
  screen.addEventListener('click', function (e) { if (!e.target.closest('.tb-bottom, .tb-react_panel')) closePops(null); });
  // the settings gear leaves the table (there is no settings screen in the prototype)
  screen.querySelector('[data-table-exit]').addEventListener('click', function () { window.BlotNav.show('play'); });
})();
