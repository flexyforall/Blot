// Replay of the last round (the "Replay round" button on the Analysis screen).
// A simplified table without decorations: the four players, the cards of the current trick,
// your hand, the last trick, a player (first / back / play / next / last) and a coach comment
// for every move. Driven by the record js/game.js keeps of each round.
(function () {
  var R = window.BlotRules;
  var root = document.querySelector('[data-review]');
  var NAMES = { bottom: 'You', left: 'HasmikG', top: 'GarikAv', right: 'Vazgen1972' };
  var SIGN = { C: '♣', D: '♦', H: '♥', S: '♠', NT: 'NT' };
  var MOOD = { best: 'happy', great: 'happy', good: 'neutral', info: 'neutral', inaccuracy: 'puzzled', mistake: 'puzzled' };
  var RANK_NAME = { '7': 'Seven', '8': 'Eight', '9': 'Nine', '10': 'Ten', J: 'Jack', Q: 'Queen', K: 'King', A: 'Ace' };
  var rec = null, step = 0, steps = [], timer = null, onDone = null;

  function cardTxt(c) { return c.rank + '<span class="rv-s' + (c.suit === 'H' || c.suit === 'D' ? ' is-red' : '') + '">' + SIGN[c.suit] + '</span>'; }
  function team(seat) { return R.teamOf(seat); }

  // ---------- the moves and a coach line for each ----------
  function build() {
    steps = [];
    var trump = rec.contract.suit;
    rec.tricks.forEach(function (t, ti) {
      t.plays.forEach(function (p, k) {
        steps.push({ trick: ti, k: k, seat: p.seat, card: p.card, legal: p.legal, tr: t });
      });
    });
    steps.forEach(function (s) { s.note = coach(s, trump); });
  }
  function coach(s, trump) {
    var won = s.tr.winner, after = s.tr.plays.slice(0, s.k + 1);
    var winNow = R.trickWinner(after.map(function (p) { return { seat: p.seat, card: p.card }; }), trump).seat;
    var trickPts = s.tr.points;
    if (s.seat !== 'bottom') {
      var who = NAMES[s.seat];
      if (s.k === 3) return { kind: 'info', title: NAMES[won] + (won === 'bottom' ? ' take' : ' takes') + ' the trick', text: who + ' played ' + cardTxt(s.card) + '. The trick is worth ' + trickPts + ' points.' };
      return { kind: 'info', title: who + ' played ' + cardTxt(s.card), text: winNow === s.seat ? who + ' is winning the trick for now.' : NAMES[winNow] + (winNow === 'bottom' ? ' are' : ' is') + ' still winning the trick.' };
    }
    if (s.legal.length === 1) return { kind: 'good', title: 'Forced move', text: cardTxt(s.card) + ' was your only legal card here.' };
    // Hindsight check: replay this trick with every legal card in place of yours (the others' cards stay
    // as they were played) and score it for your side: + the trick if you win it, − if the opponents do.
    var bonus = s.tr.points - R.stockPoints(s.tr.plays.map(function (p) { return p.card; }), trump);
    function tryCard(c) {
      var plays = s.tr.plays.map(function (p, i) { return { seat: p.seat, card: i === s.k ? c : p.card }; });
      var w = R.trickWinner(plays, trump).seat, sum = R.stockPoints(plays.map(function (p) { return p.card; }), trump) + bonus;
      return { card: c, win: team(w) === 'us', winner: w, pts: sum, gain: team(w) === 'us' ? sum : -sum, cost: R.power(c, trump, c.suit) };
    }
    var mine = tryCard(s.card), tries = s.legal.map(tryCard);
    var best = tries.reduce(function (b, t) { return t.gain > b.gain || (t.gain === b.gain && t.cost < b.cost) ? t : b; }, tries[0]);
    var diff = best.gain - mine.gain, isTrump = trump !== R.NO_TRUMP && s.card.suit === trump;
    var grade = diff >= 10 ? 'mistake' : 'inaccuracy', label = diff >= 10 ? 'Mistake' : 'Inaccuracy';
    function alt(text) { return { card: best.card, title: 'Better: ' + cardTxt(best.card), text: text }; }
    if (diff > 0 && best.win && !mine.win)
      return { kind: grade, title: label, text: cardTxt(s.card) + ' lost the trick and ' + mine.pts + ' points went to the opponents.',
        alt: alt(cardTxt(best.card) + ' beats every card in this trick. Your side takes it for ' + best.pts + ' points instead.') };
    if (diff > 0 && !best.win)
      return { kind: grade, title: label, text: cardTxt(s.card) + ' gave ' + R.cardPoints(s.card, trump) + ' points to ' + NAMES[won] + '.',
        alt: alt(NAMES[won] + ' takes this trick anyway, so give the cheapest card. ' + cardTxt(best.card) + ' keeps ' + diff + ' points away from the opponents and saves your ' + cardTxt(s.card) + ' for later.') };
    if (diff > 0)
      return { kind: grade, title: label, text: 'Your side won the trick, but it could have been worth more.',
        alt: alt('The trick is yours either way, so load it: ' + cardTxt(best.card) + ' adds ' + diff + ' more points for your team.') };
    if (mine.win && best.cost < mine.cost && R.cardPoints(s.card, trump) === R.cardPoints(best.card, trump) && (isTrump || s.card.rank === 'A'))
      return { kind: 'inaccuracy', title: 'Inaccuracy', text: cardTxt(s.card) + ' won, but a weaker card would have won too.',
        alt: alt(cardTxt(best.card) + ' also takes this trick for ' + best.pts + ' points and keeps your ' + cardTxt(s.card) + ' for a harder trick.') };
    var pts = R.cardPoints(s.card, trump), trickPts = s.tr.points;
    if (won === 'bottom') {
      if (isTrump && (s.card.rank === 'J' || s.card.rank === '9')) return { kind: 'best', title: 'Best move!', text: 'Your ' + RANK_NAME[s.card.rank] + ' of trumps is too strong to beat. It takes the trick for ' + trickPts + ' points.' };
      return { kind: 'great', title: 'Great move!', text: 'Your ' + cardTxt(s.card) + ' took the trick for ' + trickPts + ' points.' };
    }
    if (team(won) === 'us') {
      if (pts >= 10) return { kind: 'great', title: 'Great move!', text: 'Your partner was winning, so you added ' + pts + ' points with ' + cardTxt(s.card) + '.' };
      return { kind: 'good', title: 'Good move', text: 'Your partner had the trick. ' + cardTxt(s.card) + ' kept your strong cards for later.' };
    }
    return { kind: 'good', title: 'Good move', text: 'The opponents had this trick. ' + cardTxt(s.card) + ' was the cheapest card to give.' };
  }

  // ---------- markup ----------
  // the same player profile as on the game table (css/table.css .tb-prof): avatar ring, level, flag, name
  var LEVEL = { top: 16, left: 16, right: 54 };
  function seatHtml(seat) {
    return '<div class="tb-prof rv-seat rv-seat--' + seat + (seat === 'right' ? ' tb-prof--purple' : '') + '" data-rv-seat="' + seat + '">' +
      '<span class="tb-prof_ring"><img src="assets/table/simple/avatar-' + seat + '.webp" alt=""></span>' +
      '<span class="tb-prof_plate"><b>' + NAMES[seat] + '</b></span><span class="tb-prof_lvl">' + LEVEL[seat] + '</span><i class="tb-prof_flag"></i></div>';
  }
  function render() {
    var c = rec.contract;
    root.innerHTML =
      '<div class="rv-bg"></div>' +
      '<header class="rv-head"><b>Ranking · Backroom</b><span data-rv-sub></span></header>' +
      '<div class="rv-actions"><button type="button" aria-label="Share" class="rv-icon"><svg viewBox="0 0 20 20" width="20" height="20"><circle cx="15" cy="4" r="2.6" fill="currentColor"/><circle cx="5" cy="10" r="2.6" fill="currentColor"/><circle cx="15" cy="16" r="2.6" fill="currentColor"/><path d="M7.3 8.8l5.4-3.4M7.3 11.2l5.4 3.4" stroke="currentColor" stroke-width="1.8"/></svg></button>' +
      '<button type="button" aria-label="Done" class="rv-icon" data-rv-close><svg viewBox="0 0 22 20" width="22" height="20"><path d="M2.5 10.5L8 16 19.5 3.5" stroke="currentColor" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div>' +
      '<div class="rv-table"><i class="rv-table_felt">CLASSROOM</i><i class="rv-table_sweep"><i class="rv-table_rim"></i></i></div>' +
      seatHtml('top') + seatHtml('left') + seatHtml('right') +
      ['top', 'left', 'right'].map(function (seat) { return '<div class="rv-backs rv-backs--' + seat + '" data-rv-backs="' + seat + '"></div>'; }).join('') +
      '<div class="rv-chip rv-chip--' + c.seat + '"><i data-s="' + c.suit + '"></i>' + (c.kaput ? 'Kaput' : c.value) + (c.sur ? ' ×4' : c.contra ? ' ×2' : '') + '</div>' +
      '<div class="rv-trick" data-rv-trick></div>' +
      '<div class="rv-hand" data-rv-hand></div>' +
      '<div class="rv-last"><span>Last trick</span><div data-rv-last></div></div>' +
      '<div class="rv-player">' +
        '<button type="button" data-rv="first" aria-label="First"><svg viewBox="0 0 16 16" width="16" height="16"><rect x="1" y="2" width="2.4" height="12" rx="1" fill="currentColor"/><path d="M15 2.5v11L5.5 8z" fill="currentColor"/></svg></button>' +
        '<button type="button" data-rv="prev" aria-label="Back"><svg viewBox="0 0 12 16" width="12" height="16"><path d="M10.5 2L3 8l7.5 6" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
        '<button type="button" data-rv="play" class="rv-play" aria-label="Play"><img src="assets/review/play.webp" alt=""><svg class="rv-play_off" viewBox="0 0 18 20" width="18" height="20"><rect x="3" y="2" width="4" height="16" rx="1" fill="currentColor"/><rect x="11" y="2" width="4" height="16" rx="1" fill="currentColor"/></svg></button>' +
        '<button type="button" data-rv="next" aria-label="Next"><svg viewBox="0 0 12 16" width="12" height="16"><path d="M1.5 2L9 8l-7.5 6" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
        '<button type="button" data-rv="last" aria-label="Last"><svg viewBox="0 0 16 16" width="16" height="16"><path d="M1 2.5v11L10.5 8z" fill="currentColor"/><rect x="12.6" y="2" width="2.4" height="12" rx="1" fill="currentColor"/></svg></button>' +
      '</div>' +
      '<div class="rv-note" data-rv-note><p class="rv-note_title" data-rv-note-title></p><p class="rv-note_text" data-rv-note-text></p>' +
        '<button type="button" class="rv-alt" data-rv-alt hidden><svg viewBox="0 0 12 12" width="11" height="11"><path d="M6 1.5a4.5 4.5 0 1 1-4.2 2.9M1.5 1.5v3h3" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg><span>Show better move</span></button></div>' +
      '<div class="rv-coach" data-rv-coach data-mood="neutral"><div class="rv-coach_body">' +
        ['neutral', 'happy', 'puzzled'].map(function (m) { return '<img data-mood-img="' + m + '" src="assets/review/coach-' + m + '.webp" alt="">'; }).join('') +
      '</div></div>';
  }

  // ---------- one step of the replay ----------
  function show(animate, quiet) {
    var q = function (s) { return root.querySelector(s); };
    var cur = step ? steps[step - 1] : null;
    var trickIx = cur ? cur.trick : 0;
    q('[data-rv-sub]').innerHTML = 'Round ' + rec.round + ' out of ' + rec.round + '<i></i>Trick ' + (trickIx + 1) + ' out of 8';
    // the cards of the current trick
    var onTable = cur ? steps.filter(function (s, i) { return i < step && s.trick === cur.trick; }) : [];
    var collect = animate && cur && cur.k === 0 && cur.trick > 0;
    if (collect) fly(rec.tricks[cur.trick - 1].plays);
    var fromHand = animate && cur && cur.seat === 'bottom';   // your card leaves the hand for the table
    q('[data-rv-trick]').innerHTML = onTable.map(function (s, i) {
      var isNew = animate && i === onTable.length - 1 && !fromHand;
      return '<img class="rv-card rv-card--' + s.seat + (isNew ? ' is-new' : '') + (isNew && collect ? ' is-late' : '') + '" src="assets/review/full/' + s.card.rank + s.card.suit + '.webp" alt="">';
    }).join('');
    // the trick before: the last trick
    var lastIx = cur ? (cur.k === 3 ? cur.trick - 1 : cur.trick - 1) : -1;
    var last = lastIx >= 0 ? rec.tricks[lastIx].plays : [];
    q('[data-rv-last]').innerHTML = last.length ? last.map(function (p) { return '<img' + (collect ? ' class="is-wait"' : '') + ' src="assets/review/mini/' + p.card.rank + p.card.suit + '.webp" alt="">'; }).join('') : '<em>—</em>';
    // your hand: what is left after your plays so far
    var played = steps.slice(0, step).filter(function (s) { return s.seat === 'bottom'; }).map(function (s) { return s.card.id; });
    var gone = fromHand ? cur.card.id : null;   // keep its slot for a moment so the hand closes up smoothly
    var hand = sorted(rec.hands.bottom.filter(function (c) { return played.indexOf(c.id) < 0 || c.id === gone; }));
    var upNext = steps[step] && steps[step].seat === 'bottom' ? steps[step].card.id : null;
    q('[data-rv-hand]').innerHTML = hand.map(function (c) {
      return '<img class="' + (c.id === upNext ? 'is-next' : c.id === gone ? 'is-gone' : '') + '" src="assets/review/mini/' + c.rank + c.suit + '.webp" alt="">';
    }).join('');
    if (fromHand) throwFromHand(hand.map(function (c) { return c.id; }).indexOf(gone), hand.length, collect);
    // the other players' cards, face down in front of them: what they still hold at this point
    root.querySelectorAll('[data-rv-backs]').forEach(function (el) {
      var seat = el.getAttribute('data-rv-backs');
      var left = rec.hands[seat].length - steps.slice(0, step).filter(function (s) { return s.seat === seat; }).length;
      if (el.children.length === left) return;
      var html = '';
      for (var i = 0; i < left; i++) html += '<i style="--r:' + ((i - (left - 1) / 2) * 6) + 'deg"></i>';
      el.innerHTML = html;
    });
    // whose move it was
    root.querySelectorAll('[data-rv-seat]').forEach(function (el) { el.classList.toggle('is-turn', !!cur && el.getAttribute('data-rv-seat') === cur.seat); });
    // the coach only comments on your moves; while the other players' cards run past he stays as he was
    if (!quiet) coachSay(cur, animate);
    // buttons
    q('[data-rv="first"]').disabled = q('[data-rv="prev"]').disabled = step === 0;
    q('[data-rv="next"]').disabled = q('[data-rv="last"]').disabled = nextMine(step) === null;
    root.classList.toggle('is-playing', !!timer);
  }
  function coachSay(cur, animate) {
    var q = function (s) { return root.querySelector(s); };
    var note = cur ? cur.note : { kind: 'info', title: 'Replay of round ' + rec.round, text: NAMES[rec.contract.seat] + ' won the bidding. Step through your moves: the other cards play out on their own.' };
    var box = q('[data-rv-note]');
    box.className = 'rv-note rv-note--' + note.kind + (animate ? ' is-pop' : '');
    q('[data-rv-note-title]').innerHTML = '<i></i>' + note.title;
    q('[data-rv-note-text]').innerHTML = note.text;
    var altBtn = q('[data-rv-alt]');
    altBtn.hidden = !note.alt; altBtn.classList.remove('is-on');
    altBtn.querySelector('span').textContent = 'Show better move';
    if (animate) { void box.offsetWidth; }
    // the coach reacts: pleased with good moves, puzzled by bad ones, calm otherwise
    var coach = q('[data-rv-coach]');
    coach.setAttribute('data-mood', MOOD[note.kind] || 'neutral');
    coach.classList.remove('is-react');
    if (animate) { void coach.offsetWidth; coach.classList.add('is-react'); }
  }
  // The four cards of a finished trick slide from the table into their slots in "Last trick".
  var SPOT = { left: [374, 190, -8], top: [426, 160, 3], right: [478, 190, 8], bottom: [426, 218, -3] };
  function fly(plays) {
    var slots = root.querySelector('[data-rv-last]');
    plays.forEach(function (p, i) {
      var sp = SPOT[p.seat], el = document.createElement('img');
      el.className = 'rv-fly'; el.alt = '';
      el.src = 'assets/review/full/' + p.card.rank + p.card.suit + '.webp';
      el.style.left = (sp[0] - 30) + 'px'; el.style.top = (sp[1] - 42) + 'px';
      root.appendChild(el);
      var dx = 20 + 13.5 + i * 31 - sp[0], dy = 355 - sp[1];
      var a = el.animate([
        { transform: 'rotate(' + sp[2] + 'deg)' },
        { transform: 'translate(' + dx * .45 + 'px,' + (dy * .45 - 24) + 'px) rotate(' + sp[2] * .3 + 'deg) scale(.8)', offset: .45 },
        { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + 27 / 60 + ')' }
      ], { duration: 560, delay: i * 55, easing: 'cubic-bezier(.45, 0, .25, 1)', fill: 'both' });
      a.onfinish = function () {
        el.remove();
        var mini = slots.children[i];
        if (mini && mini.classList.contains('is-wait')) { mini.classList.remove('is-wait'); mini.classList.add('is-land'); }
      };
    });
  }
  // "Show better move": your card goes back to the hand and the better one is played instead;
  // pressing again returns to what you actually played.
  var altOn = false;
  function toggleAlt() {
    var cur = steps[step - 1];
    if (!cur || !cur.note.alt) return;
    stop(); cancelFF(); clearFly();
    if (altOn) { altOn = false; show(false); return; }
    altOn = true;
    var a = cur.note.alt, q = function (s) { return root.querySelector(s); };
    var mine = q('.rv-card--bottom');
    if (mine) { mine.src = 'assets/review/full/' + a.card.rank + a.card.suit + '.webp'; mine.classList.add('is-alt'); mine.classList.remove('is-new'); }
    var played = steps.slice(0, step - 1).filter(function (s) { return s.seat === 'bottom'; }).map(function (s) { return s.card.id; });
    var hand = sorted(rec.hands.bottom.filter(function (c) { return played.indexOf(c.id) < 0; }));
    q('[data-rv-hand]').innerHTML = hand.map(function (c) {
      return '<img class="' + (c.id === a.card.id ? 'is-gone' : c.id === cur.card.id ? 'is-back' : '') + '" src="assets/review/mini/' + c.rank + c.suit + '.webp" alt="">';
    }).join('');
    throwFromHand(hand.map(function (c) { return c.id; }).indexOf(a.card.id), hand.length);
    var box = q('[data-rv-note]');
    box.className = 'rv-note rv-note--best is-pop';
    q('[data-rv-note-title]').innerHTML = '<i></i>' + a.title;
    q('[data-rv-note-text]').innerHTML = a.text;
    var btn = q('[data-rv-alt]'); btn.classList.add('is-on'); btn.querySelector('span').textContent = 'Back to my move';
    var coach = q('[data-rv-coach]'); coach.setAttribute('data-mood', 'happy');
    coach.classList.remove('is-react'); void coach.offsetWidth; coach.classList.add('is-react');
  }
  // Your card slides out of its slot in the hand (mini, 30x40, row at y 263) onto its spot on the table.
  function throwFromHand(slot, n, late) {
    var el = root.querySelector('.rv-card--bottom');
    if (!el || slot < 0) return;
    var x = 426 - (n * 34 - 4) / 2 + slot * 34 + 15, y = 283;
    var sp = SPOT.bottom;
    el.animate([
      { transform: 'translate(' + (x - sp[0]) + 'px,' + (y - sp[1]) + 'px) scale(' + 30 / 60 + ')', opacity: 1 },
      { transform: 'translate(' + (x - sp[0]) * .4 + 'px,' + ((y - sp[1]) * .4 - 18) + 'px) rotate(-8deg) scale(.9)', offset: .55 },
      { transform: 'rotate(' + sp[2] + 'deg)' }
    ], { duration: 460, delay: late ? 320 : 0, easing: 'cubic-bezier(.3, .7, .3, 1)', fill: 'backwards' });
  }
  function clearFly() { root.querySelectorAll('.rv-fly').forEach(function (el) { el.remove(); }); }
  function sorted(hand) {
    var trump = rec.contract.suit, order = ['S', 'H', 'C', 'D'];
    if (trump !== R.NO_TRUMP) order = [trump].concat(order.filter(function (s) { return s !== trump; }));
    return hand.slice().sort(function (a, b) { return order.indexOf(a.suit) - order.indexOf(b.suit) || R.RANKS.indexOf(a.rank) - R.RANKS.indexOf(b.rank); });
  }
  // Only your moves are analysed: "next" runs the other players' cards past quickly
  // and stops on your next card; "back" jumps straight to your previous one.
  function myStops() { var out = []; steps.forEach(function (s, i) { if (s.seat === 'bottom') out.push(i + 1); }); return out; }
  function nextMine(from) { var m = myStops().filter(function (n) { return n > from; }); return m.length ? m[0] : null; }
  function prevMine(from) { var m = myStops().filter(function (n) { return n < from; }); return m.length ? m[m.length - 1] : 0; }
  var ff = null;
  function go(n, animate) { altOn = false; cancelFF(); clearFly(); step = Math.max(0, Math.min(steps.length, n)); show(animate); }
  function cancelFF() { clearTimeout(ff); ff = null; }
  function forward(done) {
    var target = nextMine(step);
    cancelFF();
    if (target === null) { if (done) done(false); return; }
    (function tick() {
      step++; altOn = false;
      var cur = steps[step - 1], landed = step === target;
      show(true, !landed);
      if (landed) { ff = null; if (done) done(true); return; }
      // give a finished trick time to fly into "Last trick"
      ff = setTimeout(tick, cur.k === 0 && cur.trick > 0 ? 700 : 380);
    })();
  }
  function stop() { clearTimeout(timer); timer = null; root.classList.remove('is-playing'); }
  function play() {
    if (timer) { stop(); return; }
    if (nextMine(step) === null) go(0);
    timer = true; root.classList.add('is-playing');
    (function loop() {
      forward(function (ok) {
        if (!timer) return;
        if (!ok || nextMine(step) === null) { stop(); show(false, true); return; }
        timer = setTimeout(loop, 2600);
      });
    })();
  }

  root.addEventListener('click', function (e) {
    var b = e.target.closest('[data-rv]');
    if (b) {
      var a = b.getAttribute('data-rv');
      if (a === 'play') { play(); return; }
      stop();
      if (a === 'first') go(0);
      if (a === 'prev') go(prevMine(step));
      if (a === 'next') forward();
      if (a === 'last') go(myStops().pop());
      return;
    }
    if (e.target.closest('[data-rv-alt]')) { toggleAlt(); return; }
    if (e.target.closest('[data-rv-close]')) close();
  });
  document.addEventListener('keydown', function (e) {
    if (root.hidden) return;
    if (e.key === 'ArrowRight') { stop(); forward(); }
    if (e.key === 'ArrowLeft') { stop(); go(prevMine(step)); }
    if (e.key === ' ') { e.preventDefault(); play(); }
  });

  function open(record, done) {
    rec = record; onDone = done; step = 0; stop(); cancelFF();
    build(); render(); show(false);
    root.hidden = false;
    root.classList.remove('is-in'); void root.offsetWidth; root.classList.add('is-in');
    // the opening animations run once: later re-renders must not deal the hand again
    clearTimeout(root._in); root._in = setTimeout(function () { root.classList.remove('is-in'); }, 1700);
  }
  function close(silent) {
    stop(); cancelFF();
    if (root.hidden) return;
    root.hidden = true;
    var cb = onDone; onDone = null;
    if (!silent && cb) cb();
  }
  window.BlotReview = { open: open, close: close };
})();
