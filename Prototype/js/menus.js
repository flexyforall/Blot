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


  // ---- Tasks (the clipboard icon): Objectives / Streak / Rewards; the card on the left follows the tab
  function blueBtn(label, attr) {
    return '<button class="mn-cta" type="button"' + (attr || '') + '><img class="mn-cta_fx" src="' + LB + 'play-effects.webp" alt="">' +
      '<span class="mn-cta_label">' + label + '</span><span class="mn-cta_inner"></span></button>';
  }
  function side(pane, icon, title, sub, box, foot) {
    return '<div class="mn-side" data-pane="' + pane + '"' + (pane === 'objectives' ? '' : ' hidden') + '><div class="mn-side_head"><img src="' + A + icon +
      '" alt=""><p class="mn-card_name">' + title + '</p>' + (sub ? '<p class="mn-card_since">' + sub + '</p>' : '') + '</div>' + box + foot + '</div>';
  }
  function counter(n, label, bar) {
    return '<div class="mn-counter' + (bar ? ' mn-counter--bar' : '') + '"><b data-count>' + n + '</b><span>' + label + '</span>' + (bar ? progress() : '') + '</div>';
  }
  var taskList = [['ach-firsttrick.webp', 'First trick', 'Win your first trick', '0/1', 2, 0],
    ['ach-hothand.webp', 'Hot hand', 'Win 5 games in a row', '2/5', 8, 1],
    ['ach-perfect.webp', 'Perfect match', 'Win 10 games with the same bond', '1/10', 12, 1]];
  function taskRows(withProgress) {
    return taskList.map(function (a) {
      return '<div class="mn-ach"><img class="mn-ach_badge" src="' + A + a[0] + '" alt=""><div class="mn-ach_text"><b>' + a[1] + '</b><span>' + a[2] +
        '</span></div>' + (withProgress ? (a[5] ? progress() : track()) + '<b class="mn-ach_count">' + a[3] + '</b>' : '') +
        '<span class="mn-reward"><img src="' + A + 'gem.webp" alt="">' + a[4] + '</span></div>';
    }).join('');
  }
  var tasksCard = '<div class="mn-card mn-card--side"><div class="mn-card_tile"></div>' +
    side('objectives', 't-checklist.webp', 'Today’s tasks', 'Resets at <span data-reset>5:03:25</span>', counter('1/3', 'Tasks completed', true), '<p class="mn-side_foot">1 reroll left</p>') +
    side('streak', 'flame-big.webp', 'Current streak', '', counter('5', 'Days played in a row'), '<p class="mn-side_foot">4 days till your longest streak</p>') +
    side('rewards', 't-chest.webp', 'Rewards earned', '', counter('6', 'Rewards wait for you'), blueBtn('Collect all', ' data-collect')) + '</div>';
  var streakPane = '<div class="mn-pane" data-pane="streak" hidden><p class="mn-h">5 days in a row</p><div class="mn-streak">' +
    days.map(function (d) {
      return '<div class="mn-day' + (d[1] ? ' is-on' : '') + (d[1] === 2 ? ' is-today' : '') + '"><span class="mn-day_box"><img src="' + A +
        (d[1] ? 'flame-on.svg' : 'flame-off.svg') + '" alt=""></span><span class="mn-day_label">' + d[0] + '</span></div>';
    }).join('') + '</div><div class="mn-pair"><div class="mn-big"><b>10</b><span>Longest streak</span></div><div class="mn-big"><b>23</b><span>Days played</span></div></div>' +
    '<div class="mn-ach mn-ach--shield"><img class="mn-ach_badge" src="' + A + 'ach-firsttrick.webp" alt=""><div class="mn-ach_text"><b>Streak shields</b>' +
    '<span>Used automatically to cover a missed day</span></div><span class="mn-reward mn-reward--small">2/2</span></div></div>';
  var tasksHtml = '<div class="mn" data-menu="tasks" hidden><div class="mn_dim" data-menu-close></div><div class="mn_panel mn_panel--art">' + tasksCard +
    '<div class="mn-main">' + tabs([['objectives', 'Objectives'], ['streak', 'Streak'], ['rewards', 'Rewards']]) + close() +
    '<div class="mn-pane mn-list" data-pane="objectives">' + taskRows(true) + '</div>' + streakPane +
    '<div class="mn-pane mn-list" data-pane="rewards" hidden>' + taskRows(false) + '</div></div></div></div>';

  // ---- Buy Premium (the crown pill in the header)
  var premiumHtml = '<div class="mn" data-menu="premium" hidden><div class="mn_dim" data-menu-close></div><div class="mn_panel mn_panel--premium"><div class="mn-prem">' +
    '<p class="mn-prem_title">Buy Premium</p>' + close() + '<div class="mn-perks">' +
    [['p-noads.webp', 'No Ads', 72], ['p-analysis.webp', 'Unlimited game analysis', 70], ['p-xp.webp', '+50% XP', 70], ['gem.webp', 'Monthly gems', 58]].map(function (k) {
      return '<div class="mn-perk"><span class="mn-perk_icon"><img src="' + A + k[0] + '" alt="" style="width:' + k[2] + 'px;height:' + k[2] + 'px"></span><p>' + k[1] + '</p></div>';
    }).join('') + '</div><div class="mn-buy"><p><b>Buy Premium</b> $1,99 / month</p>' + blueBtn('Get premium', ' data-buy') + '</div>' +
    '<img class="mn-buy_crown" src="' + LB + 'crown.webp" alt=""></div></div></div>';

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

  html += tasksHtml + premiumHtml;

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
  lobby.querySelector('.lb-icon[aria-label="Задания"]').setAttribute('data-menu-open', 'tasks');
  lobby.querySelector('.lb-pill_crown').closest('.lb-pill').setAttribute('data-menu-open', 'premium');

  lobby.addEventListener('click', function (e) {
    var t = e.target;
    var opener = t.closest('[data-menu-open]');
    if (opener) { open(opener.getAttribute('data-menu-open')); return; }
    if (t.closest('[data-menu-close]')) { shut(); return; }
    var tab = t.closest('.mn-tab');
    if (tab) {
      var main = tab.closest('.mn_panel');
      main.querySelectorAll('.mn-tab').forEach(function (b) { b.classList.toggle('is-active', b === tab); });
      main.querySelectorAll('[data-pane]').forEach(function (p) { p.hidden = p.getAttribute('data-pane') !== tab.getAttribute('data-tab'); });
      return;
    }
    var opt = t.closest('.mn-opt');
    if (opt) { opt.parentNode.querySelectorAll('.mn-opt').forEach(function (o) { o.classList.toggle('is-active', o === opt); }); return; }
    var set = t.closest('[data-set]');
    if (set && set.getAttribute('data-set') === 'game') { open('game'); return; }
    if (set && set.getAttribute('data-set') === 'noads') { open('premium'); return; }
    var collect = t.closest('[data-collect]');
    if (collect && !collect.disabled) {
      var panel = collect.closest('.mn_panel');
      panel.querySelector('[data-pane="rewards"].mn-list').classList.add('is-collected');
      collect.closest('.mn-side').querySelector('[data-count]').textContent = '0';
      collect.disabled = true; collect.querySelector('.mn-cta_label').textContent = 'Collected';
      return;
    }
    if (set && set.getAttribute('data-set') === 'music') { var s = document.querySelector('[data-sound-toggle]'); if (s) s.click(); return; }
    var link = t.closest('[data-link="logout"]');
    if (link) { shut(); if (window.BlotNav && BlotNav.restart) BlotNav.restart(); }
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') shut(); });
  document.addEventListener('screen:show', shut);

  // Today's tasks count down to the reset
  var left = 5 * 3600 + 3 * 60 + 25;
  var resetEl = host.querySelector('[data-reset]');
  setInterval(function () {
    left = left > 0 ? left - 1 : 24 * 3600;
    var h = Math.floor(left / 3600), m = Math.floor(left / 60) % 60, sec = left % 60;
    resetEl.textContent = h + ':' + (m < 10 ? '0' : '') + m + ':' + (sec < 10 ? '0' : '') + sec;
  }, 1000);

  window.BlotMenus = { open: open, close: shut };
})();
