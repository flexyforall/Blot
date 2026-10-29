// States the main flow did not show yet: leaving a game, the move timer, a lost connection, an opponent
// who leaves, and the stage select's locked room and not-enough-chips taps. The shortcut bar under the
// phone previews each of them (and the won / lost end screens).
(function () {
  var table = document.querySelector('[data-screen-id="table"]');
  var ui = table.querySelector('.tb-ui');
  var NAMES = { top: 'GarikAv', left: 'HasmikG', right: 'Vazgen1972', bottom: 'You' };
  var TURN_S = 15;

  function el(html) { var d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; }

  // ---------- a modal over the table: title, text, two buttons ----------
  function modal(o) {
    var m = el('<div class="ss-modal"><div class="ss-modal_dim"></div><div class="ss-modal_box">' +
      (o.icon ? '<div class="ss-modal_icon">' + o.icon + '</div>' : '') +
      '<p class="ss-modal_title">' + o.title + '</p><p class="ss-modal_text">' + o.text + '</p>' +
      '<div class="ss-modal_btns">' + (o.cancel ? '<button type="button" class="ss-btn ss-btn--ghost" data-ss="cancel">' + o.cancel + '</button>' : '') +
      '<button type="button" class="ss-btn ss-btn--' + (o.danger ? 'red' : 'blue') + '" data-ss="ok">' + o.ok + '</button></div></div></div>');
    (o.host || ui).appendChild(m);
    function close(v) { m.classList.add('is-out'); setTimeout(function () { m.remove(); }, 200); if (v && o.onOk) o.onOk(); if (!v && o.onCancel) o.onCancel(); }
    m.addEventListener('click', function (e) {
      var b = e.target.closest('[data-ss]');
      if (b) close(b.getAttribute('data-ss') === 'ok');
      else if (e.target.classList.contains('ss-modal_dim') && o.cancel) close(false);
    });
    return m;
  }
  function toast(text, kind, host) {
    var t = el('<div class="ss-toast' + (kind ? ' ss-toast--' + kind : '') + '">' + text + '</div>');
    (host || ui).appendChild(t);
    setTimeout(function () { t.classList.add('is-out'); setTimeout(function () { t.remove(); }, 300); }, 2600);
  }

  // ---------- leaving the game ----------
  var leaving = null;
  function confirmLeave() {
    if (leaving) return;
    leaving = modal({
      icon: '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="M10 17l-5-5 5-5"/><path d="M5 12h12"/></svg>',
      title: 'Leave the game?', text: 'The game goes on without you: a bot takes your seat and you lose your <b>2,000</b> chip stake.',
      cancel: 'Keep playing', ok: 'Leave', danger: true,
      onOk: function () { leaving = null; window.BlotNav.show('play'); },
      onCancel: function () { leaving = null; }
    });
  }

  // ---------- the move timer: a ring that runs down round the avatar of whoever acts ----------
  var timer = null;
  function clearTimer() {
    if (timer) { clearTimeout(timer.t); clearTimeout(timer.warn); clearInterval(timer.tick); timer = null; }
    table.querySelectorAll('.tb-prof.ss-timing').forEach(function (p) { p.classList.remove('ss-timing', 'ss-hurry'); });
    table.classList.remove('ss-my-hurry');
    var bar = ui.querySelector('.ss-mybar'); if (bar) bar.remove();
  }
  var demoUntil = 0;   // the shortcut-bar preview keeps its timer while the bots play on
  function turn(seat) {
    if (performance.now() < demoUntil) return;
    clearTimer();
    if (!seat) return;
    var prof = table.querySelector('.tb-prof--' + seat);
    if (!prof) return;
    prof.style.setProperty('--ss-turn', TURN_S + 's');
    void prof.offsetWidth;
    prof.classList.add('ss-timing');
    timer = { seat: seat };
  }
  // your own move: the last 5 seconds pulse red, then a card is played for you
  function myTurn(onTimeout) {
    if (performance.now() < demoUntil) return;
    turn('bottom');
    var me = timer;
    var bar = el('<div class="ss-mybar"><span class="ss-mybar_label">Your move</span><div class="ss-mybar_track"><i class="ss-mybar_fill"></i></div></div>');
    bar.style.setProperty('--ss-turn', TURN_S + 's');
    ui.appendChild(bar);
    var left = TURN_S, lab = bar.querySelector('.ss-mybar_label');
    me.tick = setInterval(function () { left--; if (left <= 5) lab.textContent = 'Your move \u00b7 ' + left + 's'; }, 1000);
    me.warn = setTimeout(function () {
      var p = table.querySelector('.tb-prof--bottom'); if (p) p.classList.add('ss-hurry');
      table.classList.add('ss-my-hurry'); bar.classList.add('is-hurry');
    }, (TURN_S - 5) * 1000);
    me.t = setTimeout(function () { if (timer === me) { clearTimer(); onTimeout(); } }, TURN_S * 1000);
  }
  function timedOut() { toast('Time’s up! A card was played for you.', 'warn'); }

  // ---------- connection lost / back ----------
  function connectionLost() {
    if (ui.querySelector('.ss-net')) return;
    var n = el('<div class="ss-net"><div class="ss-net_box"><span class="ss-spin"></span><p class="ss-modal_title">Connection lost</p>' +
      '<p class="ss-modal_text">Reconnecting… <b data-ss-count>3</b></p><p class="ss-net_sub">Your seat is kept for 60 seconds.</p></div></div>');
    ui.appendChild(n);
    var k = 3, c = n.querySelector('[data-ss-count]');
    var iv = setInterval(function () {
      k--; c.textContent = k;
      if (k <= 0) { clearInterval(iv); n.classList.add('is-out'); setTimeout(function () { n.remove(); }, 250); toast('Back online', 'ok'); }
    }, 1000);
  }

  // ---------- an opponent leaves: a bot takes the seat ----------
  function opponentLeft(seat) {
    seat = seat || 'right';
    var prof = table.querySelector('.tb-prof--' + seat);
    if (!prof || prof.classList.contains('ss-bot')) return;
    prof.classList.add('ss-bot');
    prof.appendChild(el('<span class="ss-botbadge">BOT</span>'));
    toast(NAMES[seat] + ' left the game. A bot plays for them.', 'warn');
  }

  // ---------- stage select: a locked room and not enough chips ----------
  var stage = document.querySelector('[data-screen-id="play"]');
  if (stage) {
    stage.addEventListener('click', function (e) {
      var card = e.target.closest('.st-card.is-locked');
      if (card) { toast('Arena Challengers opens at <b>level 30</b>. You are level 22.', 'lock', stage); return; }
      var play = e.target.closest('.st-play');
      if (play && stage.classList.contains('is-poor')) {
        modal({
          host: stage,
          icon: '<img src="assets/lobby/figma/chip.webp" alt="" width="40" height="40">',
          title: 'Not enough chips', text: 'This room needs more chips than you have. Get chips or pick a cheaper room.',
          cancel: 'Choose a room', ok: 'Get chips'
        });
      }
    }, true);
  }

  // ---------- shortcut bar: preview the states ----------
  var bar = document.querySelector('[data-dev-bar]');
  if (bar) {
    bar.insertAdjacentHTML('beforeend', '<span class="dev-bar_sep"></span>' +
      [['won-round', 'Round won'], ['won-game', 'Victory'], ['lost-game', 'Game lost'], ['leave', 'Leave game'], ['timer', 'Move timer'], ['net', 'Connection lost'], ['left', 'Opponent left']]
        .map(function (b) { return '<button class="dev-bar_btn" type="button" data-ss-demo="' + b[0] + '">' + b[1] + '</button>'; }).join(''));
    bar.addEventListener('click', function (e) {
      var b = e.target.closest('[data-ss-demo]'); if (!b) return;
      var k = b.getAttribute('data-ss-demo');
      if (k === 'leave') confirmLeave();
      else if (k === 'timer') { demoUntil = 0; clearTimer(); myTurn(function () { demoUntil = 0; timedOut(); }); demoUntil = performance.now() + TURN_S * 1000 + 200; }
      else if (k === 'net') connectionLost();
      else if (k === 'left') opponentLeft('right');
      else if (window.BlotGame && window.BlotGame.preview) window.BlotGame.preview(k);
    });
  }

  window.BlotStates = { confirmLeave: confirmLeave, turn: turn, myTurn: myTurn, timedOut: timedOut, connectionLost: connectionLost, opponentLeft: opponentLeft, toast: toast };
})();
