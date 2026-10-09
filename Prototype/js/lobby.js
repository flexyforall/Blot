// Lobby game modes: a looping carousel of three cards. The card in the middle is the active one
// (full size, highlight, PLAY NOW); tap a side card, swipe, or use the arrow keys to bring the
// next one in. A card that would cross the whole screen to change sides leaves by its edge and
// comes back in from the other one. When a card becomes active its characters push out over
// the top edge (css/lobby.css: .lb-card_pop opens its clip, .is-popping bounces the cut-out).
(function () {
  var lobby = document.querySelector('[data-screen-id="lobby"]');
  var deck = lobby.querySelector('[data-modes]');
  var cards = Array.prototype.slice.call(deck.querySelectorAll('.lb-card'));
  var n = cards.length;
  var active = cards.findIndex(function (c) { return c.classList.contains('is-active'); });
  if (active < 0) active = 0;

  function slotOf(i) { return ((i - active + n + 1) % n) - 1; }   // -1, 0, 1 for three cards
  function setSlot(card, slot) {
    card.style.setProperty('--slot', slot);
    card.setAttribute('data-slot', slot);
  }
  cards.forEach(function (c, i) { setSlot(c, slotOf(i)); });

  function select(i) {
    i = (i + n) % n;
    if (i === active) return;
    var before = cards.map(function (c, k) { return slotOf(k); });
    active = i;
    cards.forEach(function (c, k) {
      var from = before[k], to = slotOf(k);
      c.classList.toggle('is-active', k === active);
      c.classList.remove('is-popping');
      if (Math.abs(to - from) > 1) {
        // across the screen: out by the near edge, in by the far one
        setSlot(c, from * 2); c.classList.add('is-leaving');
        setTimeout(function () {
          c.classList.add('is-jumping'); setSlot(c, to * 2);
          void c.offsetWidth;
          c.classList.remove('is-jumping', 'is-leaving'); setSlot(c, to);
        }, 300);
      } else {
        setSlot(c, to);
      }
    });
    var card = cards[active];
    void card.offsetWidth;
    card.classList.add('is-popping');
  }

  // tap an idle card to bring it to the middle (its PLAY NOW does nothing until then)
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
    if (Math.abs(dx) > 40) { swiped = true; select(active + (dx < 0 ? 1 : -1)); setTimeout(function () { swiped = false; }, 400); }
  });
  document.addEventListener('keydown', function (e) {
    if (!lobby.classList.contains('is-active')) return;
    if (e.key === 'ArrowRight') select(active + 1);
    if (e.key === 'ArrowLeft') select(active - 1);
  });

  window.BlotLobby = { select: select, active: function () { return cards[active].getAttribute('data-card'); } };
})();
