// Replay of the last round (the "Replay round" button on the Analysis screen).
// A simplified table without decorations: the four players, the cards of the current trick,
// your hand, the last trick, a player (first / back / play / next / last) and a coach comment
// for every move. Driven by the record js/game.js keeps of each round.
(function () {
  var R = window.BlotRules;
  var root = document.querySelector('[data-review]');
  var NAMES = { bottom: 'You', left: 'HasmikG', top: 'GarikAv', right: 'Vazgen1972' };
  var AVATAR = { bottom: 'avatar-artexcb', left: 'avatar-hasmikg', top: 'avatar-garikav', right: 'avatar-placeholder' };
  var SIGN = { C: '♣', D: '♦', H: '♥', S: '♠', NT: 'NT' };
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
    var pts = R.cardPoints(s.card, trump), won = s.tr.winner, after = s.tr.plays.slice(0, s.k + 1);
    var winNow = R.trickWinner(after.map(function (p) { return { seat: p.seat, card: p.card }; }), trump).seat;
    var trickPts = s.tr.points;
    if (s.seat !== 'bottom') {
      var who = NAMES[s.seat];
      if (s.k === 3) return { kind: 'info', title: NAMES[won] + (won === 'bottom' ? ' take' : ' takes') + ' the trick', text: who + ' played ' + cardTxt(s.card) + '. The trick is worth ' + trickPts + ' points.' };
      return { kind: 'info', title: who + ' played ' + cardTxt(s.card), text: winNow === s.seat ? who + ' is winning the trick for now.' : NAMES[winNow] + (winNow === 'bottom' ? ' are' : ' is') + ' still winning the trick.' };
    }
    var cheaper = s.legal.filter(function (c) { return R.cardPoints(c, trump) < pts; });
    var cheapest = s.legal.reduce(function (m, c) { return R.cardPoints(c, trump) < R.cardPoints(m, trump) ? c : m; }, s.legal[0]);
    var isTrump = trump !== R.NO_TRUMP && s.card.suit === trump;
    if (s.legal.length === 1) return { kind: 'good', title: 'Forced move', text: cardTxt(s.card) + ' was your only legal card here.' };
    if (won === 'bottom') {
      if (isTrump && (s.card.rank === 'J' || s.card.rank === '9')) return { kind: 'best', title: 'Best move!', text: 'Your ' + RANK_NAME[s.card.rank] + ' of trumps is too strong to beat. It takes the trick for ' + trickPts + ' points.' };
      return { kind: 'great', title: 'Great move!', text: 'Your ' + cardTxt(s.card) + ' took the trick for ' + trickPts + ' points.' };
    }
    if (team(won) === 'us') {
      if (pts >= 10) return { kind: 'great', title: 'Great move!', text: 'Your partner was winning, so you added ' + pts + ' points with ' + cardTxt(s.card) + '.' };
      return { kind: 'good', title: 'Good move', text: 'Your partner had the trick. ' + cardTxt(s.card) + ' kept your strong cards for later.' };
    }
    if (pts >= 10 && cheaper.length) return { kind: 'mistake', title: 'Mistake', text: cardTxt(s.card) + ' gave ' + pts + ' points to the opponents. ' + cardTxt(cheapest) + ' would have saved them.' };
    if (pts > 0 && cheaper.length) return { kind: 'inaccuracy', title: 'Inaccuracy', text: 'The trick was lost anyway: ' + cardTxt(cheapest) + ' was cheaper than ' + cardTxt(s.card) + '.' };
    return { kind: 'good', title: 'Good move', text: 'The opponents had this trick. ' + cardTxt(s.card) + ' was the cheapest card to give.' };
  }

  // ---------- markup ----------
  function seatHtml(seat) {
    return '<div class="rv-seat rv-seat--' + seat + '" data-rv-seat="' + seat + '">' +
      '<img src="assets/table/ui/' + AVATAR[seat] + '.webp" alt=""><b>' + (seat === 'bottom' ? 'Artexcb' : NAMES[seat]) + '</b></div>';
  }
  function render() {
    var c = rec.contract;
    root.innerHTML =
      '<div class="rv-bg"></div>' +
      '<header class="rv-head"><b>Ranking · Backroom</b><span data-rv-sub></span></header>' +
      '<div class="rv-actions"><button type="button" aria-label="Share" class="rv-icon"><svg viewBox="0 0 20 20" width="20" height="20"><circle cx="15" cy="4" r="2.6" fill="currentColor"/><circle cx="5" cy="10" r="2.6" fill="currentColor"/><circle cx="15" cy="16" r="2.6" fill="currentColor"/><path d="M7.3 8.8l5.4-3.4M7.3 11.2l5.4 3.4" stroke="currentColor" stroke-width="1.8"/></svg></button>' +
      '<button type="button" aria-label="Done" class="rv-icon" data-rv-close><svg viewBox="0 0 22 20" width="22" height="20"><path d="M2.5 10.5L8 16 19.5 3.5" stroke="currentColor" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div>' +
      '<div class="rv-table"><i class="rv-table_felt"></i></div>' +
      seatHtml('top') + seatHtml('left') + seatHtml('right') +
      '<div class="rv-chip rv-chip--' + c.seat + '"><i data-s="' + c.suit + '"></i>' + (c.kaput ? 'Kaput' : c.value) + (c.sur ? ' ×4' : c.contra ? ' ×2' : '') + '</div>' +
      '<div class="rv-trick" data-rv-trick></div>' +
      '<div class="rv-hand" data-rv-hand></div>' +
      '<div class="rv-last"><span>Last trick</span><div data-rv-last></div></div>' +
      '<div class="rv-player">' +
        '<button type="button" data-rv="first" aria-label="First"><svg viewBox="0 0 16 16" width="16" height="16"><rect x="1" y="2" width="2.4" height="12" rx="1" fill="currentColor"/><path d="M15 2.5v11L5.5 8z" fill="currentColor"/></svg></button>' +
        '<button type="button" data-rv="prev" aria-label="Back"><svg viewBox="0 0 12 16" width="12" height="16"><path d="M10.5 2L3 8l7.5 6" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
        '<button type="button" data-rv="play" class="rv-play" aria-label="Play"><svg class="rv-play_on" viewBox="0 0 18 20" width="18" height="20"><path d="M3 1.5v17L17 10z" fill="currentColor"/></svg><svg class="rv-play_off" viewBox="0 0 18 20" width="18" height="20"><rect x="3" y="2" width="4" height="16" rx="1" fill="currentColor"/><rect x="11" y="2" width="4" height="16" rx="1" fill="currentColor"/></svg></button>' +
        '<button type="button" data-rv="next" aria-label="Next"><svg viewBox="0 0 12 16" width="12" height="16"><path d="M1.5 2L9 8l-7.5 6" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
        '<button type="button" data-rv="last" aria-label="Last"><svg viewBox="0 0 16 16" width="16" height="16"><path d="M1 2.5v11L10.5 8z" fill="currentColor"/><rect x="12.6" y="2" width="2.4" height="12" rx="1" fill="currentColor"/></svg></button>' +
      '</div>' +
      '<div class="rv-note" data-rv-note><img class="rv-note_coach" src="assets/table/ui/react-face.webp" alt=""><div class="rv-note_body"><p class="rv-note_title" data-rv-note-title></p><p class="rv-note_text" data-rv-note-text></p></div></div>';
  }

  // ---------- one step of the replay ----------
  function show(animate) {
    var q = function (s) { return root.querySelector(s); };
    var cur = step ? steps[step - 1] : null;
    var trickIx = cur ? cur.trick : 0;
    q('[data-rv-sub]').innerHTML = 'Round ' + rec.round + ' · Trick ' + (trickIx + 1) + ' of 8 · ' + NAMES[rec.contract.seat] + ' bid ' + (rec.contract.kaput ? 'Kaput ' : rec.contract.value + ' ') + '<span class="rv-s' + (rec.contract.suit === 'H' || rec.contract.suit === 'D' ? ' is-red' : '') + '">' + SIGN[rec.contract.suit] + '</span>';
    // the cards of the current trick
    var onTable = cur ? steps.filter(function (s, i) { return i < step && s.trick === cur.trick; }) : [];
    q('[data-rv-trick]').innerHTML = onTable.map(function (s, i) {
      var isNew = animate && i === onTable.length - 1;
      return '<img class="rv-card rv-card--' + s.seat + (isNew ? ' is-new' : '') + '" src="assets/review/full/' + s.card.rank + s.card.suit + '.webp" alt="">';
    }).join('');
    // the trick before: the last trick
    var lastIx = cur ? (cur.k === 3 ? cur.trick - 1 : cur.trick - 1) : -1;
    var last = lastIx >= 0 ? rec.tricks[lastIx].plays : [];
    q('[data-rv-last]').innerHTML = last.length ? last.map(function (p) { return '<img src="assets/review/mini/' + p.card.rank + p.card.suit + '.webp" alt="">'; }).join('') : '<em>—</em>';
    // your hand: what is left after your plays so far
    var played = steps.slice(0, step).filter(function (s) { return s.seat === 'bottom'; }).map(function (s) { return s.card.id; });
    var hand = sorted(rec.hands.bottom.filter(function (c) { return played.indexOf(c.id) < 0; }));
    var nextMine = steps[step] && steps[step].seat === 'bottom' ? steps[step].card.id : null;
    q('[data-rv-hand]').innerHTML = hand.map(function (c) {
      return '<img class="' + (c.id === nextMine ? 'is-next' : '') + '" src="assets/review/mini/' + c.rank + c.suit + '.webp" alt="">';
    }).join('');
    // whose move it was
    root.querySelectorAll('[data-rv-seat]').forEach(function (el) { el.classList.toggle('is-turn', !!cur && el.getAttribute('data-rv-seat') === cur.seat); });
    // the coach
    var note = cur ? cur.note : { kind: 'info', title: 'Replay of round ' + rec.round, text: NAMES[rec.contract.seat] + ' won the bidding. Press play or step through the moves.' };
    var box = q('[data-rv-note]');
    box.className = 'rv-note rv-note--' + note.kind + (animate ? ' is-pop' : '');
    q('[data-rv-note-title]').innerHTML = '<i></i>' + note.title;
    q('[data-rv-note-text]').innerHTML = note.text;
    if (animate) { void box.offsetWidth; }
    // buttons
    q('[data-rv="first"]').disabled = q('[data-rv="prev"]').disabled = step === 0;
    q('[data-rv="next"]').disabled = q('[data-rv="last"]').disabled = step === steps.length;
    root.classList.toggle('is-playing', !!timer);
  }
  function sorted(hand) {
    var trump = rec.contract.suit, order = ['S', 'H', 'C', 'D'];
    if (trump !== R.NO_TRUMP) order = [trump].concat(order.filter(function (s) { return s !== trump; }));
    return hand.slice().sort(function (a, b) { return order.indexOf(a.suit) - order.indexOf(b.suit) || R.RANKS.indexOf(a.rank) - R.RANKS.indexOf(b.rank); });
  }
  function go(n, animate) { step = Math.max(0, Math.min(steps.length, n)); show(animate); }
  function stop() { clearInterval(timer); timer = null; root.classList.remove('is-playing'); }
  function play() {
    if (timer) { stop(); return; }
    if (step === steps.length) go(0);
    timer = setInterval(function () {
      if (step >= steps.length) { stop(); show(false); return; }
      go(step + 1, true);
    }, 1300);
    go(step + 1, true);
  }

  root.addEventListener('click', function (e) {
    var b = e.target.closest('[data-rv]');
    if (b) {
      var a = b.getAttribute('data-rv');
      if (a === 'play') { play(); return; }
      stop();
      if (a === 'first') go(0);
      if (a === 'prev') go(step - 1);
      if (a === 'next') go(step + 1, true);
      if (a === 'last') go(steps.length);
      return;
    }
    if (e.target.closest('[data-rv-close]')) close();
  });
  document.addEventListener('keydown', function (e) {
    if (root.hidden) return;
    if (e.key === 'ArrowRight') { stop(); go(step + 1, true); }
    if (e.key === 'ArrowLeft') { stop(); go(step - 1); }
    if (e.key === ' ') { e.preventDefault(); play(); }
  });

  function open(record, done) {
    rec = record; onDone = done; step = 0; stop();
    build(); render(); show(false);
    root.hidden = false;
    root.classList.remove('is-in'); void root.offsetWidth; root.classList.add('is-in');
  }
  function close(silent) {
    stop();
    if (root.hidden) return;
    root.hidden = true;
    var cb = onDone; onDone = null;
    if (!silent && cb) cb();
  }
  window.BlotReview = { open: open, close: close };
})();
