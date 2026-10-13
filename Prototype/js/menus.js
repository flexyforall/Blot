// Lobby menus (Figma 1914:41825): tap your avatar for Profile (Stats / Achievements), the ranking icon
// for the Leaderboard (Global / Armenia), the gear for Settings; Settings > Game opens Game settings.
// Each is a panel over the dimmed lobby; the cross or a tap on the dim closes it.
(function () {
  var lobby = document.querySelector('[data-screen-id="lobby"]');
  var A = 'assets/menus/';
  var LB = 'assets/lobby/figma/';

  function progress() {   // the lobby's gold progress bar, at the same 30%
    return '<div class="lb-progress"><div class="lb-progress_track"></div><div class="lb-progress_haze"></div>' +
      '<img class="lb-progress_glow lb-progress_glow--wake" src="' + LB + 'glow-wake.svg" alt="">' +
      '<img class="lb-progress_glow lb-progress_glow--envelope" src="' + LB + 'glow-envelope.svg" alt="">' +
      '<img class="lb-progress_glow lb-progress_glow--rim" src="' + LB + 'glow-rim.svg" alt="">' +
      '<div class="lb-progress_head"></div><div class="lb-progress_fill">' +
      '<div class="lb-progress_base"><img src="' + LB + 'fill.svg" alt=""></div>' +
      '<div class="lb-progress_taper"><img src="' + LB + 'light-taper.svg" alt=""></div>' +
      '<div class="lb-progress_filament"><img src="' + LB + 'light-filament.svg" alt=""></div></div></div>';
  }
  function track() { return '<div class="lb-progress is-empty"><div class="lb-progress_track"></div></div>'; }
  function close() {
    return '<button class="mn-close" type="button" data-menu-close aria-label="Закрыть"><img src="' + A + 'x.svg" alt=""></button>';
  }
  function tabs(list) {
    return '<div class="mn-tabs">' + list.map(function (t, i) {
      return '<button class="mn-tab' + (i ? '' : ' is-active') + '" type="button" data-tab="' + t[0] + '">' + t[1] + '</button>';
    }).join('') + '</div>';
  }
  // the player card on the left of Profile and Leaderboard
  function card(bottom) {
    return '<div class="mn-card"><div class="mn-card_tile"></div><div class="mn-card_inner">' +
      '<div class="mn-card_who"><img class="mn-card_avatar" src="' + A + 'avatar-cowboy.webp" alt="">' +
      '<p class="mn-card_name">Artexcb <i class="mn-flag"><img src="' + A + 'flag-am.svg" alt=""></i></p>' +
      '<p class="mn-card_since">Playing since Aug 2026</p></div>' + bottom + '</div></div>';
  }
  var level = '<div class="mn-level">' + progress() + '<p class="mn-level_row"><b>Lv. 22</b><span>1,296 xp to lvl 23</span></p></div>' +
    '<button class="mn-btn mn-card_edit" type="button"><img src="' + A + 'pen.svg" alt="">Edit</button>';
  var ranking = '<div class="mn-rank"><p class="mn-rank_label">Your ranking</p><p class="mn-rank_place">3,428</p>' +
    '<p class="mn-rank_cups"><img src="' + A + 'trophy.webp" alt="">3,120</p></div>';

  // ---- Profile: Stats
  var days = [['Tu 2', 1], ['We 3', 1], ['Th 4', 1], ['Fr 5', 1], ['Sa 6', 2], ['Su 7', 0], ['Mo 8', 0]];
  var stats = '<div class="mn-pane" data-pane="stats"><p class="mn-h">5 days streak</p><div class="mn-streak">' +
    days.map(function (d) {
      return '<div class="mn-day' + (d[1] ? ' is-on' : '') + (d[1] === 2 ? ' is-today' : '') + '"><span class="mn-day_box"><img src="' + A +
        (d[1] ? 'flame-on.svg' : 'flame-off.svg') + '" alt=""></span><span class="mn-day_label">' + d[0] + '</span></div>';
    }).join('') + '</div><div class="mn-tiles">' +
    [['badge-novice.webp', 'Novice III', 'Ranking', 'is-badge'], ['swords.webp', '1,256', 'Games played'],
     ['trophy.webp', '57%', 'Current winrate', 'is-cup'], ['flame-big.webp', '10', 'Longest winstreak']].map(function (t) {
      return '<div class="mn-tile ' + (t[3] || '') + '"><img src="' + A + t[0] + '" alt=""><b>' + t[1] + '</b><span>' + t[2] + '</span></div>';
    }).join('') + '</div></div>';

  // ---- Profile: Achievements
  var ach = '<div class="mn-pane mn-list" data-pane="achievements" hidden>' +
    [['ach-firsttrick.webp', 'First trick', 'Win your first trick', '0/1', 2, 0],
     ['ach-hothand.webp', 'Hot hand', 'Win 5 games in a row', '2/5', 8, 1],
     ['ach-perfect.webp', 'Perfect match', 'Win 10 games with the same bond', '1/10', 12, 1],
     ['badge-novice.webp', 'Blot Master', 'Win 5 Games', '2/5', 2, 1]].map(function (a) {
      return '<div class="mn-ach"><img class="mn-ach_badge" src="' + A + a[0] + '" alt=""><div class="mn-ach_text"><b>' + a[1] +
        '</b><span>' + a[2] + '</span></div>' + (a[5] ? progress() : track()) + '<b class="mn-ach_count">' + a[3] +
        '</b><span class="mn-reward"><img src="' + A + 'gem.webp" alt="">' + a[4] + '</span></div>';
    }).join('') + '</div>';

  // ---- Leaderboard
  var players = [['AramAce', 'aramace', '28,164'], ['NareNoir', 'narenoir', '22,432'], ['MikaBluff', 'mikabluff', '20,591'],
    ['SonaSpade', 'sonaspade', '16,763'], ['Vardan7', 'vardan7', '14,876'], ['GarikAv', 'mikabluff', '13,402'],
    ['HasmikG', 'narenoir', '12,950'], ['Vazgen1972', 'vardan7', '11,318']];
  var armenia = [2, 4, 0, 6, 1, 7, 3, 5];   // the Armenia tab: the same players in a different order
  function rows(order) {
    return order.map(function (p, i) {
      var pl = players[p];
      var place = i < 3 ? '<img class="mn-place" src="' + A + 'place-' + (i + 1) + '.webp" alt="' + (i + 1) + '">'
                        : '<span class="mn-place mn-place--n">' + (i + 1) + '</span>';
      return '<div class="mn-row">' + place + '<img class="mn-row_avatar" src="' + A + 'lb-' + pl[1] + '.webp" alt="">' +
        '<b class="mn-row_name">' + pl[0] + '</b><span class="mn-score">' + pl[2] + '<img src="' + A + 'trophy.webp" alt=""></span></div>';
    }).join('');
  }
  var global = [0, 1, 2, 3, 4, 5, 6, 7];

  var html =
    '<div class="mn" data-menu="profile" hidden><div class="mn_dim" data-menu-close></div><div class="mn_panel mn_panel--art">' +
      card(level) + '<div class="mn-main">' + tabs([['stats', 'Stats'], ['achievements', 'Achievements']]) + close() + stats + ach + '</div></div></div>' +
    '<div class="mn" data-menu="leaderboard" hidden><div class="mn_dim" data-menu-close></div><div class="mn_panel mn_panel--art">' +
      card(ranking) + '<div class="mn-main">' + tabs([['global', 'Global'], ['armenia', 'Armenia']]) + close() +
      '<div class="mn-pane mn-list mn-list--rows" data-pane="global">' + rows(global) + '</div>' +
      '<div class="mn-pane mn-list mn-list--rows" data-pane="armenia" hidden>' + rows(armenia) + '</div></div></div></div>' +
    '<div class="mn" data-menu="settings" hidden><div class="mn_dim" data-menu-close></div><div class="mn_panel mn_panel--plain">' +
      '<p class="mn-title">Settings</p>' + close() + '<div class="mn-set">' +
      [['game', 'Game'], ['language', 'Language'], ['noads', 'No Ads'], ['music', 'Music'], ['bell', 'Notifications'], ['tutorial', 'Tutorial']].map(function (s) {
        return '<button class="mn-set_item" type="button" data-set="' + s[0] + '"><span class="mn-set_icon"><img src="' + A + 'ic-' + s[0] +
          '.svg" alt=""></span>' + s[1] + '</button>';
      }).join('') + '</div><div class="mn-links">' +
      [['support', 'Support'], ['account', 'Account'], ['fairplay', 'Fair Play'], ['privacy', 'Privacy'], ['logout', 'Log out']].map(function (s) {
        return '<button class="mn-btn" type="button" data-link="' + s[0] + '"><img src="' + A + 'ic-' + s[0] + '.svg" alt="">' + s[1] + '</button>';
      }).join('') + '</div></div></div>' +
    '<div class="mn" data-menu="game" hidden><div class="mn_dim" data-menu-close></div><div class="mn_panel mn_panel--plain">' +
      '<p class="mn-title">Game settings</p>' + close() + '<div class="mn-game"><div class="mn-game_col">' +
      '<div class="mn-group"><p class="mn-label">Elements size</p><div class="mn-opts" data-opts>' +
      ['S', 'M', 'L'].map(function (s, i) {
        return '<button class="mn-opt mn-opt--size' + (i === 1 ? ' is-active' : '') + '" type="button" style="--deck:' + (24 + i * 4) +
          'px"><img src="' + A + 'deck-1.webp" alt=""><span>' + s + '</span></button>';
      }).join('') + '</div></div><div class="mn-toggles">' +
      [['Auto-sort cards', 1], ['Fast animations', 0], ['Left-handed', 0]].map(function (t) {
        return '<label class="mn-toggle"><span>' + t[0] + '</span><input type="checkbox"' + (t[1] ? ' checked' : '') + '><i></i></label>';
      }).join('') + '</div></div><div class="mn-game_col">' +
      '<div class="mn-group"><p class="mn-label">Card deck</p><div class="mn-opts" data-opts>' +
      [1, 2, 3].map(function (n) {
        return '<button class="mn-opt mn-opt--deck' + (n === 1 ? ' is-active' : '') + '" type="button"><img src="' + A + 'deck-' + n + '.webp" alt=""></button>';
      }).join('') + '</div></div><div class="mn-group"><p class="mn-label">Table theme</p><div class="mn-opts" data-opts>' +
      ['green', 'blue', 'red'].map(function (c) {
        return '<button class="mn-opt mn-opt--table' + (c === 'red' ? ' is-active' : '') + '" type="button"><img src="' + A + 'table-' + c + '.webp" alt=""></button>';
      }).join('') + '</div></div></div></div></div></div>';

  var host = document.createElement('div');
  host.className = 'mn-host';
  host.innerHTML = html;
  lobby.appendChild(host);

  function open(name) {
    host.querySelectorAll('.mn').forEach(function (m) { m.hidden = m.getAttribute('data-menu') !== name; });
  }
  function shut() { open(null); }

  lobby.querySelector('.lb-avatar').setAttribute('data-menu-open', 'profile');
  lobby.querySelector('.lb-icon[aria-label="Рейтинг"]').setAttribute('data-menu-open', 'leaderboard');
  lobby.querySelector('[data-settings]').setAttribute('data-menu-open', 'settings');

  lobby.addEventListener('click', function (e) {
    var t = e.target;
    var opener = t.closest('[data-menu-open]');
    if (opener) { open(opener.getAttribute('data-menu-open')); return; }
    if (t.closest('[data-menu-close]')) { shut(); return; }
    var tab = t.closest('.mn-tab');
    if (tab) {
      var main = tab.closest('.mn-main');
      main.querySelectorAll('.mn-tab').forEach(function (b) { b.classList.toggle('is-active', b === tab); });
      main.querySelectorAll('[data-pane]').forEach(function (p) { p.hidden = p.getAttribute('data-pane') !== tab.getAttribute('data-tab'); });
      return;
    }
    var opt = t.closest('.mn-opt');
    if (opt) { opt.parentNode.querySelectorAll('.mn-opt').forEach(function (o) { o.classList.toggle('is-active', o === opt); }); return; }
    var set = t.closest('[data-set]');
    if (set && set.getAttribute('data-set') === 'game') { open('game'); return; }
    if (set && set.getAttribute('data-set') === 'music') { var s = document.querySelector('[data-sound-toggle]'); if (s) s.click(); return; }
    var link = t.closest('[data-link="logout"]');
    if (link) { shut(); if (window.BlotNav && BlotNav.restart) BlotNav.restart(); }
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') shut(); });
  document.addEventListener('screen:show', shut);

  window.BlotMenus = { open: open, close: shut };
})();
