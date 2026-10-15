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


  // ---- Clubs (the sword icon, Figma 1958:6619): the list of clubs, and a club's page from View
  var C = 'assets/clubs/';
  var CLUBS = [
    { name: 'Yerevan Courtyard', badge: C + 'crest-dragon.webp', rank: 'Hotshot IV', n: 42, city: 'Yerevan', open: true, lvl: 8, club: 'Hotshot III', games: 42, pts: '12,480',
      about: 'Weeknight players, mostly Yerevan. We keep one table running after 20:00.' },
    { name: 'Gyumri Regulards', badge: C + 'crest-eagle.webp', rank: 'Hotshot IV', n: 12, city: 'Gyumri', open: true, lvl: 4, club: 'Contender I', games: 18, pts: '5,960',
      about: 'Small and friendly. We play Saturdays and teach anyone new to Blot.' },
    { name: 'Ararat Evenings', badge: C + 'crest-stag.webp', rank: 'Hotshot IV', n: 24, city: 'Diaspora', open: false, lvl: 12, club: 'Hotshot III', games: 31, pts: '9,140',
      about: 'Armenians abroad who miss the evening game. Mostly European time zones, invite only.' },
    { name: 'Sevan Sharks', badge: C + 'crest-spade.webp', rank: 'Contender II', n: 37, city: 'Sevan', open: true, lvl: 15, club: 'Contender II', games: 56, pts: '15,320',
      about: 'Competitive club for league weekends. Bring your best partner.' },
    { name: 'Vanadzor Aces', badge: C + 'crest-eagle.webp', rank: 'New Face II', n: 9, city: 'Vanadzor', open: true, lvl: 1, club: 'New Face II', games: 7, pts: '1,880',
      about: 'Brand new club, everyone welcome.' },
    { name: 'Night Owls', badge: C + 'crest-stag.webp', rank: 'Hotshot I', n: 50, city: 'Diaspora', open: false, lvl: 20, club: 'Hotshot I', games: 64, pts: '18,050',
      about: 'Late games after midnight. Full for now.' }
  ];
  function clubRows() {
    return CLUBS.map(function (c, i) {
      return '<div class="mn-ach mn-club" data-club-row="' + i + '"' + (c.open ? ' data-open' : '') + '><img class="mn-ach_badge" src="' + c.badge + '" alt="">' +
        '<div class="mn-ach_text"><b>' + c.name + '</b><span>' + c.rank + '<i class="mn-dot"></i>' + c.n + '/50 members<i class="mn-dot"></i>' + c.city + '</span></div>' +
        '<button class="mn-btn mn-view" type="button" data-club="' + i + '">View</button></div>';
    }).join('');
  }
  var clubsHtml = '<div class="mn" data-menu="clubs" hidden><div class="mn_dim" data-menu-close></div><div class="mn_panel mn_panel--art">' +
    '<div class="mn-card mn-card--side"><div class="mn-card_tile"></div><div class="mn-side"><div class="mn-side_head"><img class="mn-side_big" src="' + A + 'swords.webp" alt="">' +
    '<p class="mn-card_name">Clubs</p><p class="mn-card_since mn-side_sub">20 to 50 players</p></div>' + blueBtn('Create club', ' data-create-open') + '</div></div>' +
    '<div class="mn-main">' + tabs([['all', 'All'], ['open', 'Open to join']]).replace('mn-tab is-active" type="button" data-tab="all"', 'mn-tab" type="button" data-tab="all"').replace('mn-tab" type="button" data-tab="open"', 'mn-tab is-active" type="button" data-tab="open"') +
    '<div class="mn-tools"><button class="mn-search" type="button" aria-label="Поиск"><img src="' + C + 'search.svg" alt=""></button>' + close() + '</div>' +
    '<div class="mn-pane mn-list mn-clubs is-open-only" data-clubs>' + clubRows() + '</div></div></div></div>' +
    '<div class="mn" data-menu="club" hidden><div class="mn_dim" data-club-back></div><div class="mn_panel mn_panel--art">' +
    '<div class="mn-card mn-card--side"><div class="mn-card_tile"></div><div class="mn-side"><div class="mn-side_head"><span class="mn-club_badge"><img class="mn-club_glow" src="' + C + 'badge-glow.svg" alt=""><img data-c="badge" alt=""></span>' +
    '<p class="mn-card_name mn-club_name" data-c="name"></p><p class="mn-card_since mn-side_sub"><span data-c="n"></span>/50 members</p></div>' + blueBtn('Ask to join', ' data-join') + '</div></div>' +
    '<div class="mn-main">' + tabs([['about', 'About'], ['trophies', 'Trophies']]) +
    '<button class="mn-close" type="button" data-club-back aria-label="Закрыть"><img src="' + A + 'x.svg" alt=""></button>' +
    '<div class="mn-pane mn-clubpage" data-pane="about"><div class="mn-about"><p class="mn-about_h">About us</p><p class="mn-about_t" data-c="about"></p></div>' +
    '<div class="mn-join"><b><img src="' + C + 'check.webp" alt="" data-c="check"><span data-c="status"></span></b><span>Level <span data-c="lvl"></span> and above</span></div><div class="mn-tiles mn-tiles--3">' +
    '<div class="mn-tile is-badge"><img src="' + A + 'badge-novice.webp" alt=""><b data-c="club"></b><span>Division</span></div>' +
    '<div class="mn-tile"><img src="' + A + 'swords.webp" alt=""><b data-c="games"></b><span>Games played this week</span></div>' +
    '<div class="mn-tile"><img src="' + C + 'bolt.webp" alt=""><b data-c="pts"></b><span>Week points</span></div></div></div>' +
    // Trophies: not drawn in Figma yet, so the club's cups in the achievement-row style
    '<div class="mn-pane mn-list" data-pane="trophies" hidden>' +
    [['trophy.webp', 'League champion', 'Spring league 2026', '1st'], ['place-2.webp', 'Weekend cup', 'September 2026', '2nd'],
     ['place-3.webp', 'City derby', 'Yerevan vs Gyumri', '3rd']].map(function (t) {
      return '<div class="mn-ach"><img class="mn-ach_badge" src="' + A + t[0] + '" alt=""><div class="mn-ach_text"><b>' + t[1] + '</b><span>' + t[2] +
        '</span></div><span class="mn-reward mn-reward--small">' + t[3] + '</span></div>';
    }).join('') + '</div></div></div></div>';


  // ---- Club states (Figma 1958:4255): Create a club, My club (Home / Roster / Quests / League) and the
  // Sunday digest. Joining an open club or creating one makes it yours: from then on the sword icon opens it
  var B = 'assets/bond/', LF = 'assets/lobby/figma/';
  var ICON = {   // line icons from the wireframe, drawn in the menus' white
    table: '<path d="M3 5h18v14H3zM3 10h18M9 10v9"/>',
    users: '<circle cx="9" cy="8" r="3.2"/><path d="M3 19c.6-3.2 3-5 6-5s5.4 1.8 6 5M16 5a3 3 0 0 1 0 6M18 14c1.6.6 2.7 2.3 3 5"/>',
    cards: '<rect x="7" y="4" width="11" height="15" rx="2"/><path d="M4.5 7.5 3.6 17a2 2 0 0 0 1.8 2.2L12 20"/><path d="M12.5 9.5l-1.5 2 1.5 2 1.5-2z"/>',
    trend: '<path d="M3 17l6-6 4 4 8-8M15 7h6v6"/>',
    bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0"/>',
    send: '<path d="M4 12l16-8-6 16-2.5-6.5z"/>',
    up: '<path d="M12 19V5M6 11l6-6 6 6"/>'
  };
  function ic(n) { return '<svg class="mc-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' + ICON[n] + '</svg>'; }
  function loot(chips, gems) {
    return '<span class="mc-loot"><span><img src="' + LF + 'chip.webp" alt="">' + chips + '</span><span><img src="' + A + 'gem.webp" alt="">' + gems + '</span></span>';
  }
  function crestHead(sub, extra) {
    return '<div class="mn-side_head"><span class="mn-club_badge"><img class="mn-club_glow" src="' + C + 'badge-glow.svg" alt=""><img data-m="badge" alt=""></span>' +
      '<p class="mn-card_name mn-club_name" data-m="name"></p><p class="mn-card_since mn-side_sub">' + sub + '</p>' + (extra || '') + '</div>';
  }
  function ring(label) {
    return '<div class="mn-side_head"><span class="mc-ring"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="44"/><circle class="mc-ring_on" cx="50" cy="50" r="44" pathLength="100"/></svg><b>' + label + '</b></span>';
  }
  var CRESTS = [['crest-spade.webp', ''], ['crest-dragon.webp', ''], ['crest-eagle.webp', ''], ['crest-stag.webp', ''],
    ['crest-dragon.webp', 'hue-rotate(130deg)'], ['crest-spade.webp', 'hue-rotate(200deg) saturate(1.3)']];
  function crestImg(i) { return '<img src="' + C + CRESTS[i][0] + '" alt=""' + (CRESTS[i][1] ? ' style="filter:' + CRESTS[i][1] + '"' : '') + '>'; }

  var createHtml = '<div class="mn" data-menu="clubnew" hidden><div class="mn_dim" data-create-back></div><div class="mn_panel mn_panel--art">' +
    '<div class="mn-card mn-card--side"><div class="mn-card_tile"></div><div class="mn-side"><div class="mn-side_head">' +
    '<span class="mn-club_badge"><img class="mn-club_glow" src="' + C + 'badge-glow.svg" alt=""><span data-new-crest>' + crestImg(1) + '</span></span>' +
    '<p class="mn-card_name mn-club_name" data-new-name>New club</p><p class="mn-card_since mn-side_sub" data-new-sub>Preview</p></div>' +
    blueBtn('Create', ' data-create') + '</div></div>' +
    '<div class="mn-main"><button class="mn-close" type="button" data-create-back aria-label="Закрыть"><img src="' + A + 'x.svg" alt=""></button>' +
    '<div class="mn-pane mc-form">' +
      '<label class="mc-field"><span class="mn-label">Club name</span><input class="mc-input" data-new-input maxlength="22" placeholder="e.g. Kond Corner"></label>' +
      '<div class="mc-field"><span class="mn-label">Crest</span><div class="mc-crests">' + CRESTS.map(function (c, i) {
        return '<button class="mn-opt mc-crest' + (i === 1 ? ' is-active' : '') + '" type="button" data-crest="' + i + '">' + crestImg(i) + '</button>';
      }).join('') + '</div></div>' +
      '<div class="mc-pair"><input class="mc-input" placeholder="Region" value="Yerevan"><input class="mc-input" placeholder="Language" value="Armenian"></div>' +
      '<div class="mc-seg" data-seg><button class="is-active" type="button">Open</button><button type="button">Request to join</button><button type="button">Invite only</button></div>' +
      '<p class="mc-note">Clubs hold 20 to 50 players. Creating one unlocks at Career Level 8.</p>' +
    '</div></div></div></div>';

  var feed = [['lb-aramace', 'Aram', 'made a 250 contract', '2m'], ['lb-mikabluff', 'Narek', 'anyone up for a duo?', '14m']];
  var members = [['lb-aramace', 'Aram', 'Founder', 'online', '2,140'], ['lb-vardan7', 'Narek', 'Officer', 'online', '1,890'],
    [null, 'Artexcb', 'Member', 'you', '1,240'], ['lb-sonaspade', 'Sona', 'Member', 'yesterday', '980'],
    ['lb-vardan7', 'Vardan', 'Member', '3d ago', '760'], ['lb-narenoir', 'Nare', 'Member', 'last week', '410']];
  var league = [[1, 'Kond Corner', 'crest-spade.webp', 'Promote', '18,900'], [2, 'Gyumri Regulards', 'crest-eagle.webp', 'Promote', '15,240'],
    [3, null, null, '', '12,480'], ['gap'], [9, 'Nor Nork Nights', 'crest-stag.webp', 'Relegate', '4,100'], [10, 'Ararat Evenings', 'crest-stag.webp', 'Relegate', '3,050']];
  function feedRow(f) {
    return '<div class="mc-feed"><img src="' + (f[0] ? A + f[0] + '.webp' : B + 'me.webp') + '" alt=""><p><b>' + f[1] + '</b> ' + f[2] + '</p><span>' + f[3] + '</span></div>';
  }
  var myClubHtml = '<div class="mn" data-menu="myclub" hidden><div class="mn_dim" data-menu-close></div><div class="mn_panel mn_panel--art">' +
    '<div class="mn-card mn-card--side"><div class="mn-card_tile"></div>' +
      '<div class="mn-side" data-pane="home">' + crestHead('<span data-m="div"></span> · <span data-m="n"></span>/50') + '<span class="mc-chip">Your rank: 4th</span></div>' +
      '<div class="mn-side" data-pane="roster" hidden>' + crestHead('<span data-m="n"></span> of 50 members') + '<button class="mn-btn mc-manage" type="button" data-manage>Manage club</button></div>' +
      '<div class="mn-side" data-pane="quests" hidden>' + ring('64%').replace('<span class="mc-ring">', '<span class="mc-ring" style="--p:64">') +
        '<p class="mn-card_name">Club quests</p><p class="mn-card_since mn-side_sub">Resets Monday 05:00</p></div><span class="mc-chip">Everyone shares it</span></div>' +
      '<div class="mn-side" data-pane="league" hidden>' + ring('3rd').replace('<span class="mc-ring">', '<span class="mc-ring" style="--p:80">') +
        '<p class="mn-card_name">League position</p><p class="mn-card_since mn-side_sub">Group 7 of <span data-m="divname"></span> Division</p></div><span class="mc-chip">12,480 points</span></div>' +
    '</div>' +
    '<div class="mn-main">' + tabs([['home', 'Home'], ['roster', 'Roster'], ['quests', 'Quests'], ['league', 'League']]) + close() +
      // Home: the club table, the feed (the Sunday digest lands here) and a message box
      '<div class="mn-pane mc-home" data-pane="home">' +
        '<div class="mc-table">' + ic('table') + '<div class="mn-ach_text"><b>Club table</b><span>3 members are playing right now</span></div>' + blueBtn('Sit down', ' data-sit') + '</div>' +
        '<p class="mc-h">Club feed</p><div class="mc-feeds" data-feed>' +
          '<button class="mc-feed mc-feed--digest" type="button" data-digest><i>' + ic('bell') + '</i><p><b>Week 14 digest</b> your club finished 3rd</p><span>1h</span></button>' +
          feed.map(feedRow).join('') + '</div>' +
        '<form class="mc-say" data-say><input class="mc-input" data-say-input placeholder="Message the club"><button type="submit" aria-label="Отправить">' + ic('send') + '</button></form>' +
      '</div>' +
      '<div class="mn-pane mn-list mc-list" data-pane="roster" hidden><div class="mc-head"><p class="mc-h">Members</p><span class="mc-chip">Sorted by contribution</span></div>' +
        members.map(function (m) {
          return '<div class="mc-row' + (m[3] === 'you' ? ' is-me' : '') + '"><img class="mc-av" src="' + (m[0] ? A + m[0] + '.webp' : B + 'me.webp') + '" alt="">' +
            '<div class="mn-ach_text"><b>' + m[1] + (m[3] === 'you' ? ' <em>(you)</em>' : '') + '</b><span>' + m[2] + '<i class="mn-dot"></i>' +
            (m[3] === 'online' ? '<i class="mc-online"></i>online' : m[3] === 'you' ? 'playing now' : m[3]) + '</span></div>' +
            '<span class="mc-pts"><img src="' + C + 'bolt.webp" alt="">' + m[4] + '</span></div>';
        }).join('') + '</div>' +
      '<div class="mn-pane mn-list mc-list" data-pane="quests" hidden>' +
        [['Fulfil 500 contracts together', 'Every member counts, strong or new', 320, 500], ['Capture 8,000 defensive points', 'Defence counts the same as declaring', 6100, 8000]].map(function (q) {
          return '<div class="mc-quest"><div class="mc-quest_top">' + ic('cards') + '<div class="mn-ach_text"><b>' + q[0] + '</b><span>' + q[1] + '</span></div>' + loot(400, 10) + '</div>' +
            '<div class="mc-quest_bar"><span class="mc-bar"><i style="--w:' + Math.round(q[2] / q[3] * 100) + '%"></i></span><span>' + q[2].toLocaleString('en') + ' / ' + q[3].toLocaleString('en') + '</span></div></div>';
        }).join('') +
        '<p class="mc-note">Club quests are collective. A strong player carrying a new one helps the whole club, so nobody is resented for it.</p></div>' +
      '<div class="mn-pane mn-list mc-list" data-pane="league" hidden><div class="mc-head"><p class="mc-h">Weekly Club League</p><span class="mc-chip">Ends Sun 23:59</span></div>' +
        league.map(function (r) {
          if (r[0] === 'gap') return '<p class="mc-gap">ranks 4 – 8</p>';
          var me = !r[1];
          return '<div class="mc-row mc-row--league' + (me ? ' is-me' : '') + '"><span class="mc-place">' + r[0] + '</span><img class="mc-crest_s" ' + (me ? 'data-m="badge"' : 'src="' + C + r[2] + '"') + ' alt="">' +
            '<b class="mc-name"' + (me ? ' data-m="name"' : '') + '>' + (r[1] || '') + '</b>' + (r[3] ? '<span class="mc-tag mc-tag--' + r[3].toLowerCase() + '">' + r[3] + '</span>' : '') + '<span class="mc-score">' + r[4] + '</span></div>';
        }).join('') +
        '<p class="mc-note">Top 2 promote, bottom 2 relegate. Points come from playing only.</p></div>' +
    '</div></div></div>';

  var digestHtml = '<div class="mn" data-menu="digest" hidden><div class="mn_dim" data-digest-back></div><div class="mn_panel mn_panel--art">' +
    '<div class="mn-card mn-card--side"><div class="mn-card_tile"></div><div class="mn-side">' +
      '<div class="mn-side_head"><span class="mn-club_badge"><img class="mn-club_glow" src="' + C + 'badge-glow.svg" alt=""><img data-m="badge" alt=""></span>' +
      '<p class="mn-card_name">Week 14</p><p class="mn-card_since mn-side_sub">Sunday digest</p></div><span class="mc-chip">One message a week</span></div></div>' +
    '<div class="mn-main"><button class="mn-close" type="button" data-digest-back aria-label="Закрыть"><img src="' + A + 'x.svg" alt=""></button>' +
      '<div class="mn-pane mc-digest"><p class="mc-title">Your club finished 3rd</p><div class="mn-tiles mn-tiles--3 mc-tiles">' +
        '<div class="mn-tile is-cup"><img src="' + A + 'trophy.webp" alt=""><b>3rd of 10</b><span>Placement</span></div>' +
        '<div class="mn-tile"><img src="' + C + 'bolt.webp" alt=""><b>1,240</b><span>Your points</span></div>' +
        '<div class="mn-tile is-badge"><img src="' + A + 'badge-novice.webp" alt=""><b>4th</b><span>Your rank</span></div></div>' +
        '<div class="mc-line is-hot">' + ic('trend') + '<div class="mn-ach_text"><b>Promoted to <span data-m="divname"></span> Division</b><span>Next week you play Group 4</span></div><span class="mc-chip mc-chip--up">' + ic('up') + 'Up 1</span></div>' +
        '<div class="mc-line">' + ic('bell') + '<div class="mn-ach_text"><b>League rewards</b><span>Claim from the Rewards tab, no timer</span></div>' + loot(400, 10) + '</div>' +
        '<p class="mc-note">Sent once, Sunday night. Club notifications can be turned off on their own.</p>' +
    '</div></div></div></div>';

  html += tasksHtml + premiumHtml + clubsHtml + createHtml + myClubHtml + digestHtml;

  var host = document.createElement('div');
  host.className = 'mn-host';
  host.innerHTML = html;
  lobby.appendChild(host);

  function open(name) {
    host.querySelectorAll('.mn').forEach(function (m) { m.hidden = m.getAttribute('data-menu') !== name; });
    var m = name && host.querySelector('[data-menu="' + name + '"]');
    if (m) animateIn(m);
  }
  // entrance micro-animations for whatever is visible in a menu (also after a tab switch)
  var ITEMS = '.mn-card_who > *, .mn-level, .mn-card_edit, .mn-rank, .mn-side:not([hidden]) .mn-side_head > *, .mn-side:not([hidden]) > :not(.mn-side_head),' +
    ' .mn-tab, .mn-tools > *, .mn-main > .mn-close, .mn-title, .mn-prem_title, .mn-pane:not([hidden]) > :not(.mn-tiles):not(.mn-streak):not(.mn-pair),' +
    ' .mn-pane:not([hidden]) .mn-tiles > *, .mn-pane:not([hidden]) .mn-pair > *, .mn-pane:not([hidden]) .mn-day,' +
    ' .mn-set > *, .mn-links > *, .mn-group > *, .mn-opts > *, .mn-toggle, .mn-perk, .mn-buy, .mn-buy_crown';
  var REDUCED = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var lightTimers = [];
  function animateIn(root, onlyPane) {
    if (REDUCED) return;
    var els = Array.prototype.slice.call(root.querySelectorAll(ITEMS)).filter(function (el) {
      return el.offsetParent !== null && (!onlyPane || el.closest('.mn-pane, .mn-side'));
    });
    els.forEach(function (el, i) {
      el.classList.remove('mn-in'); void el.offsetWidth;
      el.style.setProperty('--d', Math.min(i * 0.035, 0.6) + 's');
      el.classList.add('mn-in');
    });
    root.querySelectorAll('.mn-pane:not([hidden]) .mn-streak').forEach(lightStreak);
    root.querySelectorAll('.mn-side:not([hidden]) .mn-counter [data-count]').forEach(countUp);
  }
  // the big number on the left counts up from 1 to its value: ticks slow down as it nears it, each
  // with a click, and it lands with a pop and a coin. "1/3" counts only the part before the slash
  function countUp(el) {
    clearTimeout(el._t);
    if (!el.hasAttribute('data-final')) el.setAttribute('data-final', el.textContent);
    var parts = el.getAttribute('data-final').split('/'), to = +parts[0], tail = parts[1] ? '/' + parts[1] : '';
    el.classList.remove('is-tick', 'is-landed');
    if (!to) { el.textContent = parts.join('/'); return; }
    var n = 1, total = to - 1, step = 0, snd = window.BlotSound && BlotSound.sfx;
    el.textContent = n + tail;
    (function tick() {
      el._t = setTimeout(function () {
        if (n < to) n++;
        step++;
        el.textContent = n + tail;
        el.classList.remove('is-tick'); void el.offsetWidth;
        if (n < to) { el.classList.add('is-tick'); if (snd) snd('click', 0.22 + step * 0.02); tick(); }
        else { el.classList.add('is-landed'); if (snd) { snd('pop', 0.5); snd('coin', 0.45); } }
      }, step === 0 ? 380 : 45 + Math.pow((step + 1) * 9 / total, 2) * 3.2);   // short runs tick as slowly near the end as long ones
    })();
  }
  // the streak's played days close one after another, each with a sound; the last (today) rings out
  function lightStreak(row) {
    lightTimers.forEach(clearTimeout); lightTimers = [];
    var days = Array.prototype.slice.call(row.querySelectorAll('.mn-day')).filter(function (d) { return d.hasAttribute('data-on') || d.classList.contains('is-on'); });
    days.forEach(function (d) { d.setAttribute('data-on', ''); d.classList.remove('is-on', 'is-lighting'); d.querySelector('img').src = A + 'flame-off.svg'; });
    days.forEach(function (d, k) {
      lightTimers.push(setTimeout(function () {
        d.classList.add('is-on', 'is-lighting');
        d.querySelector('img').src = A + 'flame-on.svg';
        var snd = window.BlotSound && BlotSound.sfx;
        if (snd) { if (k === days.length - 1) { snd('coin', 0.6); snd('shimmer', 0.5); } else snd('pop', 0.45); }
      }, 450 + k * 220));
    });
  }
  function shut() { open(null); }

  lobby.querySelector('.lb-avatar').setAttribute('data-menu-open', 'profile');
  lobby.querySelector('.lb-icon[aria-label="Рейтинг"]').setAttribute('data-menu-open', 'leaderboard');
  lobby.querySelector('[data-settings]').setAttribute('data-menu-open', 'settings');
  lobby.querySelector('.lb-icon[aria-label="Задания"]').setAttribute('data-menu-open', 'tasks');
  lobby.querySelector('.lb-icon[aria-label="Турниры"]').setAttribute('data-menu-open', 'clubs');
  lobby.querySelector('.lb-pill_crown').closest('.lb-pill').setAttribute('data-menu-open', 'premium');

  lobby.addEventListener('click', function (e) {
    var t = e.target;
    var opener = t.closest('[data-menu-open]');
    if (opener) {
      var which = opener.getAttribute('data-menu-open');
      if (which === 'clubs' && myClub) showMyClub(); else open(which);
      return;
    }
    if (t.closest('[data-create-open]')) { startCreate(false); return; }
    if (t.closest('[data-manage]')) { startCreate(true); return; }
    if (t.closest('[data-create-back]')) { if (editing) showMyClub(); else open('clubs'); return; }
    var crest = t.closest('[data-crest]');
    if (crest) { pickCrest(+crest.getAttribute('data-crest')); return; }
    var seg = t.closest('[data-seg] button');
    if (seg) { seg.parentNode.querySelectorAll('button').forEach(function (b) { b.classList.toggle('is-active', b === seg); }); return; }
    if (t.closest('[data-create]')) { finishCreate(); return; }
    if (t.closest('[data-sit]')) { shut(); if (window.BlotNav) BlotNav.show('play'); return; }
    if (t.closest('[data-digest]')) { open('digest'); return; }
    if (t.closest('[data-digest-back]')) { showMyClub(true); return; }
    if (t.closest('[data-menu-close]')) { shut(); return; }
    var view = t.closest('[data-club]');
    if (view) { showClub(CLUBS[+view.getAttribute('data-club')]); return; }
    if (t.closest('[data-club-back]')) { open('clubs'); return; }
    var join = t.closest('[data-join]');
    if (join && !join.disabled) { setMyClub(viewing); showMyClub(); sfx('coin', 0.5); sfx('shimmer', 0.4); return; }
    var tab = t.closest('.mn-tab');
    if (tab && tab.closest('[data-menu="clubs"]')) {
      tab.parentNode.querySelectorAll('.mn-tab').forEach(function (b) { b.classList.toggle('is-active', b === tab); });
      host.querySelector('[data-clubs]').classList.toggle('is-open-only', tab.getAttribute('data-tab') === 'open');
      animateIn(tab.closest('.mn_panel'), true);
      return;
    }
    if (tab) {
      var main = tab.closest('.mn_panel');
      main.querySelectorAll('.mn-tab').forEach(function (b) { b.classList.toggle('is-active', b === tab); });
      main.querySelectorAll('[data-pane]').forEach(function (p) { p.hidden = p.getAttribute('data-pane') !== tab.getAttribute('data-tab'); });
      animateIn(main, true);
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
      var cnt = collect.closest('.mn-side').querySelector('[data-count]'); clearTimeout(cnt._t); cnt.setAttribute('data-final', '0'); cnt.classList.remove('is-tick', 'is-landed'); cnt.textContent = '0';
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

  // ---- your club: joining or creating one fills the My club and digest pages
  var myClub = null, viewing = null, editing = false, newCrest = 1;
  function sfx(n, v) { if (window.BlotSound && BlotSound.sfx) BlotSound.sfx(n, v); }
  function setMyClub(c) {
    myClub = c;
    host.querySelectorAll('[data-m="badge"]').forEach(function (img) { img.src = c.badge; img.style.filter = c.filter || ''; });
    host.querySelectorAll('[data-m="name"]').forEach(function (el) {
      if (el.classList.contains('mn-club_name')) {
        var w = c.name.split(' ');
        el.innerHTML = w.length > 1 ? w.slice(0, -1).join(' ') + '<br>' + w[w.length - 1] : c.name;
      } else el.textContent = c.name;
    });
    host.querySelectorAll('[data-m="n"]').forEach(function (el) { el.textContent = c.n; });
    host.querySelectorAll('[data-m="div"]').forEach(function (el) { el.textContent = c.club; });
    host.querySelectorAll('[data-m="divname"]').forEach(function (el) { el.textContent = c.club.replace(/ [IV]+$/, ''); });
  }
  function showMyClub(keepTab) {
    var page = host.querySelector('[data-menu="myclub"]');
    if (!keepTab) {
      page.querySelectorAll('.mn-tab').forEach(function (b) { b.classList.toggle('is-active', b.getAttribute('data-tab') === 'home'); });
      page.querySelectorAll('[data-pane]').forEach(function (p) { p.hidden = p.getAttribute('data-pane') !== 'home'; });
    }
    open('myclub');
  }
  // Create a club (also Manage club, prefilled): the card on the left previews the name and crest
  var form = host.querySelector('[data-menu="clubnew"]');
  var nameInput = form.querySelector('[data-new-input]');
  function pickCrest(i) {
    newCrest = i;
    form.querySelectorAll('[data-crest]').forEach(function (b) { b.classList.toggle('is-active', +b.getAttribute('data-crest') === i); });
    form.querySelector('[data-new-crest]').innerHTML = crestImg(i);
  }
  function previewName() {
    var v = nameInput.value.trim();
    form.querySelector('[data-new-name]').textContent = v || 'New club';
  }
  function startCreate(edit) {
    editing = edit;
    nameInput.value = edit ? myClub.name : '';
    nameInput.classList.remove('is-shake');
    var idx = 1;
    if (edit) CRESTS.forEach(function (c, i) { if (myClub.badge === C + c[0] && (myClub.filter || '') === c[1]) idx = i; });
    pickCrest(idx); previewName();
    form.querySelector('[data-new-sub]').textContent = edit ? 'Club settings' : 'Preview';
    form.querySelector('[data-create] .mn-cta_label').textContent = edit ? 'Save' : 'Create';
    open('clubnew');
  }
  nameInput.addEventListener('input', function () { nameInput.classList.remove('is-shake'); previewName(); });
  function finishCreate() {
    var name = nameInput.value.trim();
    if (!name) { nameInput.focus(); sfx('click', 0.3); nameInput.classList.remove('is-shake'); void nameInput.offsetWidth; nameInput.classList.add('is-shake'); return; }
    var c = editing ? myClub : { n: 1, club: 'New Face II' };
    c.name = name; c.badge = C + CRESTS[newCrest][0]; c.filter = CRESTS[newCrest][1];
    setMyClub(c); showMyClub();
    sfx('coin', 0.5); sfx('shimmer', 0.4);
  }
  // a message to the club lands at the top of the feed
  host.querySelector('[data-say]').addEventListener('submit', function (e) {
    e.preventDefault();
    var input = this.querySelector('[data-say-input]'), v = input.value.trim();
    if (!v) return;
    var wrap = document.createElement('div');
    wrap.innerHTML = feedRow([null, 'Artexcb', v.replace(/[<>&]/g, ''), 'now']);
    var row = wrap.firstChild;
    row.classList.add('mn-in');
    var list = host.querySelector('[data-feed]');
    list.insertBefore(row, list.firstChild);
    input.value = '';
    sfx('pop', 0.4);
  });

  function showClub(c) {
    viewing = c;
    var page = host.querySelector('[data-menu="club"]');
    function set(k, v) { page.querySelector('[data-c="' + k + '"]').textContent = v; }
    page.querySelector('[data-c="badge"]').src = c.badge;
    var words = c.name.split(' ');
    page.querySelector('[data-c="name"]').innerHTML = words.slice(0, -1).join(' ') + '<br>' + words[words.length - 1];
    set('n', c.n); set('about', c.about); set('lvl', c.lvl); set('club', c.club); set('games', c.games); set('pts', c.pts);
    set('status', c.n >= 50 ? 'Club is full' : c.open ? 'Open to join' : 'Invite only');
    page.querySelector('[data-c="check"]').hidden = !(c.open && c.n < 50);
    var join = page.querySelector('[data-join]');
    var can = c.open && c.n < 50;
    join.disabled = !can;
    join.querySelector('.mn-cta_label').textContent = can ? 'Join the club' : (c.n >= 50 ? 'Club is full' : 'Invite only');
    page.querySelectorAll('.mn-tab').forEach(function (b) { b.classList.toggle('is-active', b.getAttribute('data-tab') === 'about'); });
    page.querySelectorAll('[data-pane]').forEach(function (p) { p.hidden = p.getAttribute('data-pane') !== 'about'; });
    open('club');
  }

  window.BlotMenus = { open: open, close: shut };
})();
