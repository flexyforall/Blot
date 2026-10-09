// Lobby game modes: Play Online and Play with Friends are the same card; the one in the middle is
// active (full size, highlight, PLAY NOW). Tap Play with Friends, swipe, or use the arrow keys and
// the whole row (Training included, which stays the original static card) glides one card to the
// left; tap Play Online on the left to glide back. Nothing fades out or jumps. When a card becomes
// active its characters push out over the top edge (css/lobby.css: .lb-card_pop opens its clip,
// .is-popping bounces the cut-out).
(function () {
  var lobby = document.querySelector('[data-screen-id="lobby"]');
  var deck = lobby.querySelector('[data-modes]');
  var cards = Array.prototype.slice.call(deck.querySelectorAll('.lb-card'));   // online, friends
  var shift = 0;   // how many cards the row has moved left: 0 (Play Online in the middle) or 1

  function render() {
    deck.style.setProperty('--shift', shift);
    cards.forEach(function (c, i) {
      c.style.setProperty('--slot', i);
      c.classList.toggle('is-active', i === shift);
    });
  }
  function select(i) {
    i = Math.max(0, Math.min(cards.length - 1, i));
    if (i === shift) return;
    shift = i;
    cards.forEach(function (c) { c.classList.remove('is-popping'); });
    render();
    var card = cards[shift];
    void card.offsetWidth;
    card.classList.add('is-popping');
  }
  render();

  // the entrance animation goes by where each card is when the lobby opens, and is dropped once it
  // has played, so switching cards later never replays it
  var enterTimer = 0;
  document.addEventListener('screen:show', function (e) {
    if (e.detail !== 'lobby') return;
    cards.forEach(function (c, i) { c.setAttribute('data-in', i - shift); });
    clearTimeout(enterTimer);
    enterTimer = setTimeout(function () { cards.forEach(function (c) { c.removeAttribute('data-in'); }); }, 2000);
  });

  // tap the side card to bring it to the middle (its PLAY NOW does nothing until then)
  var swiped = false;
  deck.addEventListener('click', function (e) {
    if (swiped) { swiped = false; return; }
    var card = e.target.closest('.lb-card');
    if (card && !card.classList.contains('is-active')) select(cards.indexOf(card));
  });
  // swipe left / right over the cards
  var x0 = null;
  deck.addEventListener('pointerdown', function (e) { x0 = e.clientX; });
  deck.addEventListener('pointerup', function (e) {
    if (x0 === null) return;
    var dx = e.clientX - x0; x0 = null;
    if (Math.abs(dx) > 40) { swiped = true; select(shift + (dx < 0 ? 1 : -1)); setTimeout(function () { swiped = false; }, 400); }
  });
  document.addEventListener('keydown', function (e) {
    if (!lobby.classList.contains('is-active')) return;
    if (e.key === 'ArrowRight') select(shift + 1);
    if (e.key === 'ArrowLeft') select(shift - 1);
  });

  window.BlotLobby = { select: select, active: function () { return cards[shift].getAttribute('data-card'); } };
})();
