/* Spire Muses — pantallas: título, selección, mapa, combate, recompensas, tienda, descanso, eventos. */
(function () {
  const SM = window.SM, En = SM.Engine, UI = SM.UI, Gm = SM.Game;
  const { $, h, sleep } = UI;
  const G = () => SM.run;

  const MUSE = {
    miranda: { name: 'Zafira', role: 'La Caballera Carmesí', desc: 'Última espada de los Acorazados. Aplasta a sus enemigos con acero y fuego. Gana Fuerza y Bloqueo; sacrifica vida para golpear más fuerte.', glow: '#d8404c' },
    staryuuki: { name: 'Nila', role: 'La Cazadora Juguetona', desc: 'Cazadora de los Bosques Verdes. Apuñala y envenena todo lo que se cruce, sonriendo. Cuchillas rápidas, Veneno y mucho robo de cartas.', glow: '#4fc46c' },
    karen: { name: 'Claudia', role: 'La Nigromante Gótica', desc: 'Nigromante de la luna violeta. Invoca a su fiel mano izquierda, Osty, que absorbe daño y ataca cada turno. Agota cartas para ganar poder.', glow: '#a56cff' },
  };
  const ACT_GRAD = ['linear-gradient(#0f3a40,#05090d)', 'linear-gradient(#143a1e,#050a06)', 'linear-gradient(#4a3508,#0d0903)'];
  const ACT_KEY = ['underdocks', 'overgrowth', 'hive'];
  const MV = { dockrat: 'skitter', minicrab: 'skitter', slime: 'slither', honeyslime: 'slither', crab: 'stomp', crabking: 'stomp', thornbeast: 'stomp', mossgolem: 'stomp', chainwarden: 'stomp', beetle: 'stomp', royalguard: 'stomp', stag: 'stomp', ghostpirate: 'hover', jelly: 'hover', wasp: 'hover', drone: 'hover', nurse: 'hover', queen: 'hover', hivemind: 'hover', tentacle: 'sway', sporecap: 'sway', vinelasher: 'sway', sprout: 'sway', treant: 'sway', rootmother: 'sway', dryad: 'sway' };
  const AURA = { boss: '#ff5a5a', elite: '#ffb347' };
  const EMOJI = { dockrat: '🐀', slime: '🟢', crab: '🦀', jelly: '🪼', ghostpirate: '👻', minicrab: '🦀', chainwarden: '⛓️', tentacle: '🐙', crabking: '🦀', sporecap: '🍄', vinelasher: '🌿', thornbeast: '🐗', mossgolem: '🗿', dryad: '🌳', sprout: '🌱', treant: '🌲', stag: '🦌', rootmother: '🌳', drone: '🐝', wasp: '🐝', honeyslime: '🍯', nurse: '🐛', beetle: '🪲', royalguard: '🛡️', hivemind: '🧠', queen: '👑' };
  const stage = () => $('#stage');
  function setBg(el, key) {
    const act = G() ? G().act : 1;
    const k = key || ACT_KEY[act - 1];
    if (SM.hasAsset('bg/' + k + '.webp')) el.style.background = `#000 center/cover url('${SM.asset('bg/' + k + '.webp')}')`;
    else el.style.background = ACT_GRAD[Math.max(0, ACT_KEY.indexOf(k))] || ACT_GRAD[0];
  }
  // En combate se sube el fondo para que el suelo quede bajo los pies de los personajes (y se rellena el borde inferior con tierra oscura).
  const FLOOR = { underdocks: [1.3, -385, '#17130f'], overgrowth: [1.3, -400, '#15130d'], hive: [1.55, -620, '#2a1a08'] };
  function combatFloorBg(el) {
    const k = ACT_KEY[(G() ? G().act : 1) - 1], f = FLOOR[k];
    if (!f || !SM.hasAsset('bg/' + k + '.webp')) return;
    el.style.background = `linear-gradient(#0000 55%, ${f[2]} 90%), url('${SM.asset('bg/' + k + '.webp')}') 50% ${f[1]}px / ${f[0] * 100}% auto no-repeat, ${f[2]}`;
  }
  function show(name) {
    document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('hidden', s.id !== name));
    UI.current = name;
    SM.run && !['title', 'select', 'gallery', 'ending', 'end'].includes(name) ? UI.updateTop() : $('#topbar').classList.add('hidden');
    UI.hideTip();
  }
  UI.show = show;
  const scr = (id) => $('#' + id);

  /* ======================= TÍTULO ======================= */
  let titleChar = null;
  function title() {
    show('title');
    const s = scr('title');
    const chars = ['miranda', 'staryuuki', 'karen'];
    let ch = chars[Math.floor(Math.random() * 3)];
    if (ch === titleChar) ch = chars[(chars.indexOf(ch) + 1 + Math.floor(Math.random() * 2)) % 3];
    titleChar = ch;
    const m = MUSE[ch];
    const hasSave = !!SM.store.get('save', null);
    const unlockedN = SM.Meta.data.gal.length, totalN = SM.LORE.length;
    s.className = 'screen title-' + ch;
    s.style.setProperty('--glow', m.glow);
    s.innerHTML = `<div class="title-bg" style="background-image:url('${SM.asset('ui/' + ch + '_select.webp')}')"></div><div class="title-shade"></div><div class="embers"></div>
      <div class="title-left"><div class="logo">SPIRE<br>MUSES<small>LA TORRE DE LAS MUSAS</small></div><div class="menu-col" id="menuCol"></div></div>
      <div class="title-credit"><b>${m.name}</b><span>${m.role}</span></div><div class="footer-note">Zafira · Nila · Claudia</div>`;
    const col = $('#menuCol', s);
    const add = (t, cls, fn) => { const b = h('button', 'btn ' + (cls || ''), t); b.onclick = () => { SM.unlockAudio(); SM.sfx('click'); fn(); }; col.appendChild(b); return b; };
    add('⚔️ Nueva partida', 'big', selectScreen);
    if (hasSave) add('▶ Continuar', 'big green', () => { const g = Gm.loadRun(); if (g) { SM.run = g; mapScreen(); } else { UI.toast('No se pudo cargar la partida.'); } });
    add(`🖼️ Galería <small style="font-size:16px;opacity:.8">${unlockedN}/${totalN}</small>`, '', galleryScreen);
    add('❓ Cómo jugar', '', UI.help);
    add('⚙️ Opciones', '', UI.options);
    if (SM.Meta.nmUnlocked() > 0) $('#menuCol', s).insertAdjacentHTML('afterend', `<div class="nm-badge">🌙 Modo Pesadilla disponible (hasta nivel ${SM.Meta.nmUnlocked()})</div>`);
    SM.music('menu', 1, ch);
  }
  UI.title = title;

  /* ======================= SELECCIÓN ======================= */
  function selectScreen() {
    SM.run = null;
    show('select');
    const s = scr('select');
    let pick = null, easy = SM.store.get('easy', false), nm = 0;
    const nmMax = SM.Meta.nmUnlocked();
    s.innerHTML = `<div class="sel-title">Elige a tu Musa</div><div class="sel-row"></div><div class="sel-bottom"></div>`;
    const row = $('.sel-row', s), bot = $('.sel-bottom', s);
    for (const id of ['miranda', 'staryuuki', 'karen']) {
      const m = MUSE[id];
      const hp = { miranda: 80, staryuuki: 70, karen: 72 }[id];
      const r = SM.RELICS[{ miranda: 'brasa_carmesi', staryuuki: 'anillo_cazadora', karen: 'sello_osty' }[id]];
      const c = h('div', 'sel-card');
      c.style.backgroundImage = `url('${SM.asset('ui/' + id + '_select.webp')}')`; c.style.setProperty('--glow', m.glow);
      c.innerHTML = `<div class="shade"></div><div class="info"><div class="role">${m.role}</div><h3>${m.name}</h3><p>${m.desc}</p><div class="stats">❤️ ${hp} PV &nbsp; ${r.i} ${r.n}: ${r.d}</div></div>`;
      c.tabIndex = 0;
      c.onfocus = () => { if (pick !== id) c.click(); };
      c.onclick = () => { SM.unlockAudio(); if (pick !== id) SM.sfx('select'); pick = id; row.querySelectorAll('.sel-card').forEach((x) => x.classList.toggle('on', x === c)); go.disabled = false; };
      row.appendChild(c);
    }
    const back = h('button', 'btn', '← Volver'); back.onclick = () => { SM.sfx('click'); title(); };
    const mid = h('div', 'sel-mid');
    const renderMid = () => {
      mid.innerHTML = '';
      const tg = h('div', 'toggle' + (easy && !nm ? ' on' : ''), `<div class="sw"></div><span>Modo fácil</span>`);
      tg.tabIndex = 0;
      tg.dataset.tipt = '<b>Modo fácil</b>Más vida y enemigos más débiles. No se combina con la Pesadilla.';
      tg.onclick = () => { if (nm) return; easy = !easy; tg.classList.toggle('on', easy); SM.store.set('easy', easy); SM.sfx('select'); };
      if (nm) tg.style.opacity = 0.35;
      mid.appendChild(tg);
      if (nmMax > 0) {
        const st = h('div', 'stepper');
        const dn = h('button', 'iconbtn', '◀'), up = h('button', 'iconbtn', '▶');
        const lab = h('div', 'nm-lab', nm ? `🌙 Pesadilla ${nm}` : '🌙 Pesadilla: apagada');
        dn.onclick = () => { nm = Math.max(0, nm - 1); SM.sfx('select'); renderMid(); mid.querySelector('.stepper button').focus(); };
        up.onclick = () => { nm = Math.min(nmMax, nm + 1); SM.sfx('select'); renderMid(); mid.querySelectorAll('.stepper button')[1].focus(); };
        st.append(dn, lab, up);
        mid.appendChild(st);
        const fx = nm ? SM.NM.slice(1, nm + 1).map((t, i) => `<div>Nv.${i + 1}: ${t}</div>`).join('') : '';
        if (nm) { const d = h('div', 'nm-fx sans', fx); mid.appendChild(d); }
      } else {
        mid.appendChild(h('div', 'nm-hint sans', '🔒 Termina el juego para desbloquear la Pesadilla'));
      }
    };
    renderMid();
    const go = h('button', 'btn big green', 'Comenzar ⚔️'); go.disabled = true;
    go.onclick = async () => {
      SM.sfx('click');
      SM.run = En.newRun(pick, { easy, nm });
      SM.preloadMuse(pick);
      Gm.clearSave();
      SM.run.map = Gm.genMap(SM.run);
      mapScreen(true);
    };
    bot.append(back, mid, go);
    SM.music('menu', 1, titleChar || 'miranda');
    const firstCard = row.querySelector('.sel-card'); if (firstCard) firstCard.focus({ preventScroll: true });
  }

  /* ======================= MAPA ======================= */
  const NODE_ICON = { combat: '⚔️', elite: '💀', event: '❓', shop: '💰', rest: '🔥', boss: '👑' };
  const NODE_NAME = { combat: 'Combate', elite: 'Élite', event: 'Evento', shop: 'Tienda', rest: 'Hoguera', boss: 'Jefe' };
  const NODE_DESC = { combat: 'Un combate normal. Premio: oro, carta y a veces una poción.', elite: 'Un enemigo poderoso. Premio: una reliquia y mejores cartas.', event: 'Algo inesperado: puede ser bueno... o no.', shop: 'Compra cartas, reliquias y pociones. También puedes eliminar cartas.', rest: 'Descansa para curarte o mejora una carta.', boss: 'El guardián de la zona. ¡Prepárate!' };
  const MAP_H = 2300;
  function mapScreen(announce) {
    const g = G();
    show('map');
    const s = scr('map');
    s.style.background = '#05040a';
    SM.music('map', g.act);
    Gm.saveRun(g);
    const key = ACT_KEY[g.act - 1];
    const avail = new Set(Gm.nextNodes(g));
    const artUrl = SM.hasAsset('map/' + key + '.webp') ? SM.asset('map/' + key + '.webp') : null;
    s.innerHTML = `<div class="map-head"><span>${SM.ACTS[g.act - 1].sub}: ${SM.ACTS[g.act - 1].name}${g.nm ? ' · 🌙 Pesadilla ' + g.nm : ''}</span><small>Arrastra o usa la rueda / las flechas para ver todo el camino</small></div>
      <div id="mapScroll"><div id="mapInner" style="height:${MAP_H}px"><div class="mapbg" style="${artUrl ? `background-image:url('${artUrl}')` : `background:${ACT_GRAD[g.act - 1]}`}"></div><div class="mapfog"></div><svg id="mapSvg" viewBox="0 0 1280 ${MAP_H}"></svg></div></div>
      <div class="map-nav"><button class="iconbtn" id="mUp" data-tipt="<b>Subir</b>">▲</button><button class="iconbtn" id="mHere" data-tipt="<b>Ir a mi posición</b>">📍</button><button class="iconbtn" id="mDown" data-tipt="<b>Bajar</b>">▼</button></div>
      <div class="legend">${Object.keys(NODE_ICON).map((k) => `<div>${NODE_ICON[k]} ${NODE_NAME[k]}</div>`).join('')}</div>`;
    const inner = $('#mapInner', s), svg = $('#mapSvg', s), sc = $('#mapScroll', s);
    const pos = (n) => ({ x: n.type === 'boss' ? 640 : 230 + (n.c / 3) * 820, y: n.type === 'boss' ? 190 : MAP_H - 260 - (n.r / (Gm.ROWS - 1)) * (MAP_H - 760) });
    const all = g.map.rows.flat().concat([g.map.boss]);
    const NS = 'http://www.w3.org/2000/svg';
    const mk = (tag, attrs) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); svg.appendChild(e); return e; };
    // caminos
    const curv = (a, b) => { const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2; const off = ((a.x * 7 + b.y * 3) % 60) - 30; return `M${a.x},${a.y} Q${mx + off},${my} ${b.x},${b.y}`; };
    const startPts = g.map.rows[0].map((n) => ({ x: 640, y: MAP_H - 70, to: n }));
    for (const sp of startPts) { const b = pos(sp.to); mk('path', { d: curv(sp, b), fill: 'none', stroke: '#000a', 'stroke-width': 18, 'stroke-linecap': 'round' }); mk('path', { d: curv(sp, b), fill: 'none', stroke: g.pos ? '#f0cf7a' : '#c9b98a', 'stroke-width': 6, 'stroke-linecap': 'round', 'stroke-dasharray': g.pos ? '' : '2 12' }); }
    for (const n of all) for (const m of n.next) {
      const a = pos(n), b = pos(m), d = curv(a, b);
      const used = n.visited && m.visited, open = g.pos === n && avail.has(m);
      mk('path', { d, fill: 'none', stroke: '#000a', 'stroke-width': 18, 'stroke-linecap': 'round' });
      mk('path', { d, fill: 'none', stroke: used ? '#f0cf7a' : open ? '#fff2b0' : '#a89bd0', 'stroke-width': used ? 7 : 6, 'stroke-linecap': 'round', 'stroke-dasharray': used ? '' : '2 13', opacity: used || open ? 1 : 0.75 });
    }
    // inicio
    const st = h('div', 'map-start', '⛺ Inicio del ascenso'); st.style.left = '640px'; st.style.top = (MAP_H - 70) + 'px'; inner.appendChild(st);
    for (const n of all) {
      const p = pos(n);
      const wrap = h('div', 'nodewrap ' + n.type); wrap.style.left = p.x + 'px'; wrap.style.top = p.y + 'px';
      const b = h('button', 'node ' + n.type, NODE_ICON[n.type]);
      const can = avail.has(n);
      if (can) b.classList.add('avail'); else b.disabled = true;
      if (n.visited) b.classList.add('done');
      if (g.pos === n) { b.classList.remove('done'); b.classList.add('here'); b.insertAdjacentHTML('beforeend', `<div class="you" style="background-image:url('${SM.asset('ui/' + g.char + '_icon.png')}')"></div>`); }
      b.dataset.tipt = `<b>${NODE_NAME[n.type]}</b>${NODE_DESC[n.type]}`;
      if (can) b.onclick = () => { SM.unlockAudio(); SM.sfx('click'); enterNode(n); };
      wrap.appendChild(b); wrap.appendChild(h('div', 'nlabel', NODE_NAME[n.type]));
      inner.appendChild(wrap);
    }
    // scroll: arrastrar, botones
    let drag = null;
    sc.addEventListener('pointerdown', (e) => { if (e.target.closest('.node')) return; drag = { y: e.clientY, top: sc.scrollTop, moved: false }; sc.classList.add('grab'); });
    if (UI._mapMove) { window.removeEventListener('pointermove', UI._mapMove); window.removeEventListener('pointerup', UI._mapUp); }
    window.addEventListener('pointermove', UI._mapMove = (e) => { if (!drag) return; const k = 1280 / stage().getBoundingClientRect().width; sc.scrollTop = drag.top - (e.clientY - drag.y) * k; });
    window.addEventListener('pointerup', UI._mapUp = () => { drag = null; sc.classList.remove('grab'); });
    const by = (d) => sc.scrollBy({ top: d, behavior: 'smooth' });
    $('#mUp', s).onclick = () => { SM.sfx('click'); by(-380); };
    $('#mDown', s).onclick = () => { SM.sfx('click'); by(380); };
    const focus = (smooth) => {
      let target = [...avail][0] || g.pos; const ps = [...avail].map(pos);
      const y = ps.length ? ps.reduce((a, p) => a + p.y, 0) / ps.length : pos(g.pos || all[0]).y;
      sc.scrollTo({ top: Math.max(0, y - 330), behavior: smooth ? 'smooth' : 'instant' });
    };
    $('#mHere', s).onclick = () => { SM.sfx('click'); focus(true); };
    sc.scrollTop = MAP_H; setTimeout(() => focus(true), 60);
    if (announce) UI.toast(`${SM.ACTS[g.act - 1].sub}: ${SM.ACTS[g.act - 1].name}`);
  }
  function enterNode(n) {
    const g = G();
    g.pos = n; n.visited = true; if (n.type === 'boss') g.map.boss.visited = true;
    g.floor++; SM.Meta.add('floors');
    switch (n.type) {
      case 'combat': combat(Gm.encounterFor(g, 'normal'), 'normal'); break;
      case 'elite': combat(Gm.encounterFor(g, 'elite'), 'elite'); break;
      case 'boss': combat(Gm.encounterFor(g, 'boss'), 'boss'); break;
      case 'event': eventScreen(); break;
      case 'shop': shopScreen(); break;
      case 'rest': restScreen(); break;
    }
  }
  function nodeDone(wasBoss) {
    const g = G();
    if (wasBoss) {
      if (g.act >= 3) return victory();
      g.act++; g.pos = null; g.map = Gm.genMap(g);
      if (g.act === 3) SM.Meta.add('act3');
      g.hp = g.maxHp; // se recupera por completo entre zonas
      return mapScreen(true);
    }
    mapScreen();
  }

  /* ======================= COMBATE ======================= */
  const Cb = { C: null, sprite: null, busy: false, pending: null, selUid: null, tIdx: 0, seen: new Set(), tier: 'normal', els: new Map(), over: false };
  const OSTY_IMG = () => `<img src="${SM.asset('enemies/osty.webp')}" alt="Osty" draggable="false">`;

  function stagePos(el, fx, fy) {
    const sr = stage().getBoundingClientRect(), sc = sr.width / 1280, r = el.getBoundingClientRect();
    return { x: (r.left - sr.left + r.width * (fx === undefined ? 0.5 : fx)) / sc, y: (r.top - sr.top + r.height * (fy === undefined ? 0.3 : fy)) / sc };
  }
  let popN = 0, popQueued = false;
  function popup(el, text, cls, fy) {
    if (!el) return;
    const p = stagePos(el, 0.5, fy);
    const d = h('div', 'pop ' + cls, text); d.style.left = p.x + 'px'; d.style.top = p.y + 'px';
    const delay = (popN++) * 140; if (!popQueued) { popQueued = true; setTimeout(() => { popN = 0; popQueued = false; }, 0); }
    d.style.animationDelay = delay + 'ms'; d.style.opacity = 0;
    stage().appendChild(d); setTimeout(() => d.remove(), 1200 + delay);
  }
  function burst(el) {
    if (!el) return;
    const p = stagePos(el, 0.5, 0.6);
    for (let i = 0; i < 14; i++) {
      const d = h('div', 'spark', ['✦', '✧', '•'][i % 3]); d.style.left = p.x + 'px'; d.style.top = p.y + 'px';
      const a = Math.random() * Math.PI * 2, r = 60 + Math.random() * 90;
      d.style.setProperty('--dx', Math.cos(a) * r + 'px'); d.style.setProperty('--dy', Math.sin(a) * r - 40 + 'px');
      stage().appendChild(d); setTimeout(() => d.remove(), 900);
    }
  }
  function banner(text, red) { const b = h('div', 'banner' + (red ? ' red' : ''), text); stage().appendChild(b); setTimeout(() => b.remove(), 1500); }
  const enemyEl = (e) => Cb.els.get(e.uid);

  function fxHandler(type, d) {
    const C = Cb.C; if (!C) return;
    const pEl = $('#playerBox .sprite');
    switch (type) {
      case 'enemyHit': {
        const el = enemyEl(d.e); if (!el) break;
        if (d.poison) { popup(el.querySelector('.body'), `-${d.amt}`, 'heal'); SM.sfx('poison'); }
        else if (d.amt > 0) { popup(el.querySelector('.body'), `-${d.amt}`, 'dmg'); el.classList.remove('hit'); void el.offsetWidth; el.classList.add('hit'); setTimeout(() => el.classList.remove('hit'), 380); SM.sfx(d.amt >= 15 ? 'bigHit' : 'hit'); }
        else if (d.blocked) { popup(el.querySelector('.body'), 'Bloqueado', 'blk'); SM.sfx('block'); }
        break;
      }
      case 'playerHit':
        if (d.amt > 0) {
          popup(pEl, `-${d.amt}`, 'hurt'); SM.sfx('hurt');
          if (Cb.sprite && !d.direct) Cb.sprite.play('hurt');
          const pb = $('#playerBox'); pb.classList.remove('hit'); void pb.offsetWidth; pb.classList.add('hit');
          const f = h('div', 'flash'); stage().appendChild(f); setTimeout(() => f.remove(), 320);
        } else if (d.blocked) { popup(pEl, 'Bloqueado', 'blk'); SM.sfx('block'); }
        if (d.ostyAbs) { popup($('#ostyBox'), `-${d.ostyAbs}`, 'hurt'); }
        break;
      case 'block': popup(pEl, `+${d.n} 🛡️`, 'blk'); SM.sfx('block'); break;
      case 'enemyBlock': { const el = enemyEl(d.e); popup(el && el.querySelector('.body'), `+${d.n} 🛡️`, 'blk'); break; }
      case 'heal': popup(pEl, `+${d.n}`, 'heal'); SM.sfx('heal'); break;
      case 'enemyHeal': { const el = enemyEl(d.e); popup(el && el.querySelector('.body'), `+${d.n}`, 'heal'); break; }
      case 'ostyHeal': popup($('#ostyBox'), `+${d.n}`, 'heal'); break;
      case 'maxhp': popup(pEl, `+${d.n} PV máx.`, 'heal'); break;
      case 'status': {
        const s = En.ST[d.k]; if (!s) break;
        const isP = d.who === C.pl;
        const el = isP ? pEl : enemyEl(d.who) && enemyEl(d.who).querySelector('.body');
        popup(el, `${d.n > 0 ? '+' : ''}${d.n} ${s.n}`, 'txt', 0.1);
        SM.sfx(s.neg(d.n) === isP ? 'buff' : 'debuff');
        if (!isP && !s.neg(1)) {/* enemigo gana buff */}
        break;
      }
      case 'enemyDie': { const el = enemyEl(d.e); if (el) { el.classList.add('dying'); setTimeout(() => el.classList.add('gone'), 800); burst(el.querySelector('.body')); } SM.sfx('die'); break; }
      case 'enemySpawn': SM.sfx('buff'); break;
      case 'reshuffle': UI.toast('Se baraja tu descarte…'); break;
      case 'ostyAttack': SM.sfx('hit'); break;
      case 'ostyDown': UI.toast('Osty está caído: volverá solo al inicio de tu próximo turno.'); SM.sfx('error'); break;
      case 'ostyRevive': popup($('#ostyBox'), 'Osty regresa', 'heal'); SM.sfx('heal'); break;
      case 'handFull': UI.toast('Tu mano está llena.'); break;
      case 'draw': break;
    }
  }

  function combat(ids, tier) {
    const g = G();
    show('combat');
    const s = scr('combat');
    setBg(s); combatFloorBg(s);
    SM.music(tier === 'boss' ? 'boss' : tier === 'elite' ? 'elite' : 'combat', g.act);
    s.innerHTML = `
      <div class="arena"><div class="shadow"></div>
        <div id="playerBox"><div class="bars"><div class="blockbadge hidden"></div><div class="hpbar"><i></i><span></span></div></div><div class="statuses"></div></div>
        <div id="ostyBox" class="hidden">${OSTY_IMG()}<div class="hpbar"><i style="background:linear-gradient(#c79cff,#6a35c8)"></i><span></span></div><div class="pow"></div></div>
        <div id="enemies"></div></div>
      <div id="hudL"><div class="energy" id="energy"></div><div class="pile" id="drawPile" data-tip="Mazo">Mazo<b>0</b></div></div>
      <div id="hand"></div>
      <div id="hudR"><div class="pile" id="discardPile">Descarte<b>0</b></div><div class="pile" id="exhaustPile">Agotadas<b>0</b></div><button class="btn" id="endTurn">Terminar turno</button></div>
      <div class="tipbar" id="tipbar"></div>`;
    Cb.C = null; Cb.busy = true; Cb.pending = null; Cb.selUid = null; Cb.seen = new Set(); Cb.els = new Map(); Cb.tier = tier; Cb.tIdx = 0;
    // jugadora
    if (Cb.sprite) Cb.sprite.destroy();
    Cb.sprite = new SM.Sprite(g.char, 300);
    $('#playerBox', s).insertBefore(Cb.sprite.canvas, $('#playerBox .bars', s));
    if (g.char === 'karen') $('#ostyBox', s).classList.remove('hidden');
    $('#ostyBox', s).dataset.tip = 'Osty';
    const C = En.startCombat(g, ids, { tier, fx: fxHandler });
    Cb.C = C; Cb.over = false;
    $('#endTurn', s).onclick = endTurn;
    $('#drawPile', s).onclick = () => UI.viewCards('Mazo de robo (en orden aleatorio)', C.draw.slice().sort((a, b) => a.id.localeCompare(b.id)), C);
    $('#discardPile', s).onclick = () => UI.viewCards('Pila de descarte', C.discard, C);
    $('#exhaustPile', s).onclick = () => UI.viewCards('Cartas agotadas', C.exhaust, C);
    $('.arena', s).onclick = (ev) => { if (ev.target.closest('.enemy')) return; cancelSel(); };
    UI.onPotion = onPotion;
    renderAll(true);
    const boss = C.enemies[0];
    banner(tier === 'boss' ? boss.name : tier === 'elite' ? '¡Élite!' : 'Tu turno', tier !== 'normal');
    Cb.busy = false;
    updateHud(); updateTip();
  }

  /* --- render --- */
  function renderAll(first) {
    const C = Cb.C; if (!C) return;
    updatePlayer(); updateEnemies(first); updateOsty(); updateHud(); renderHand(); UI.updateTop(); updateTip();
  }
  function hpbar(el, hp, max) { el.querySelector('i').style.width = Math.max(0, (hp / max) * 100) + '%'; el.querySelector('span').textContent = `${Math.max(0, hp)} / ${max}`; }
  function updatePlayer() {
    const C = Cb.C, g = G();
    hpbar($('#playerBox .hpbar'), g.hp, g.maxHp);
    const bb = $('#playerBox .blockbadge'); bb.classList.toggle('hidden', !C.pl.block); bb.textContent = C.pl.block;
    $('#playerBox .statuses').innerHTML = UI.statusChips(C.pl);
    $('#combat').querySelectorAll('.vignette-low').forEach((v) => v.remove());
    if (g.hp / g.maxHp <= 0.3 && g.hp > 0) $('#combat').insertAdjacentHTML('beforeend', '<div class="vignette-low"></div>');
  }
  function updateOsty() {
    const C = Cb.C; if (!C.osty) return;
    const o = C.osty, b = $('#ostyBox');
    hpbar(b.querySelector('.hpbar'), o.hp, o.max);
    b.classList.toggle('dead', o.hp <= 0);
    b.querySelector('.pow').textContent = o.hp > 0 ? `Poder ${o.pow}` : 'Caído · vuelve en tu turno';
    b.dataset.tipt = `<b>Osty</b>${UI.GLOS.Osty}<br>PV ${o.hp}/${o.max} · Poder ${o.pow}`;
  }
  function updateEnemies(first) {
    const C = Cb.C, cont = $('#enemies');
    const n = C.enemies.filter((e) => e.hp > 0 || (Cb.els.get(e.uid) && !Cb.els.get(e.uid).classList.contains('gone'))).length;
    const k = n >= 5 ? 0.6 : n === 4 ? 0.72 : n === 3 ? 0.88 : 1.05;
    for (const e of C.enemies) {
      let el = Cb.els.get(e.uid);
      if (!el) {
        el = h('div', 'enemy mv-' + (MV[e.id] || 'sway') + (e.def.tier === 'boss' ? ' boss' : e.def.tier === 'elite' ? ' elite' : '') + (first ? '' : ' spawn'));
        el.innerHTML = `<div class="intentWrap"></div><div class="body"><div class="gshadow"></div></div><div class="bars"><div class="blockbadge hidden"></div><div class="hpbar"><i></i><span></span></div></div><div class="ename"></div><div class="statuses"></div>`;
        const body = $('.body', el); body.style.setProperty('--dly', (-Math.random() * 3).toFixed(2) + 's'); body.style.setProperty('--spd', (2.6 + Math.random() * 1.2).toFixed(2) + 's');
        const cap = e.def.tier === 'boss' ? 260 : e.def.tier === 'elite' ? 225 : 190;
        const eh = Math.round(Math.min(e.def.h * 0.85, cap) * k * 0.65);
        if (SM.hasAsset('enemies/' + e.id + '.webp')) { const im = h('img', 'eimg'); im.src = SM.asset('enemies/' + e.id + '.webp'); im.style.height = eh + 'px'; im.draggable = false; body.appendChild(im); }
        else body.appendChild(h('div', 'emoji', EMOJI[e.id] || '👾')).style.fontSize = Math.round(eh * 0.6) + 'px';
                el.onclick = () => onEnemyClick(e);
        $('.ename', el).textContent = e.name;
        el.dataset.tip = '';
        cont.appendChild(el); Cb.els.set(e.uid, el);
      }
      if (e.hp > 0) {
        $('.intentWrap', el).innerHTML = UI.intentHTML(C, e);
        const bb = $('.blockbadge', el); bb.classList.toggle('hidden', !e.block); bb.textContent = e.block;
        $('.statuses', el).innerHTML = UI.statusChips(e);
      } else { $('.intentWrap', el).innerHTML = ''; $('.statuses', el).innerHTML = ''; $('.blockbadge', el).classList.add('hidden'); }
      hpbar($('.hpbar', el), e.hp, e.maxHp);
      el.classList.toggle('target-ok', !!Cb.pending && e.hp > 0);
    }
    cont.style.setProperty('--k', k);
    cont.dataset.k = k;
  }
  function updateHud() {
    const C = Cb.C;
    const en = $('#energy'); en.innerHTML = `${C.energy}<small>/${C.maxEnergy}</small>`; en.classList.toggle('zero', C.energy === 0);
    $('#drawPile b').textContent = C.draw.length; $('#discardPile b').textContent = C.discard.length; $('#exhaustPile b').textContent = C.exhaust.length;
    const et = $('#endTurn');
    const anyPlayable = C.hand.some((c) => En.canPlay(C, c).ok);
    et.classList.toggle('glow', !anyPlayable && !Cb.busy && !C.over);
    et.disabled = Cb.busy || !!C.over;
  }
  function renderHand() {
    const C = Cb.C, hand = $('#hand'); hand.innerHTML = '';
    const n = C.hand.length, cw = 168;
    const step = n > 1 ? Math.min(cw - 6, (970 - cw) / (n - 1)) : 0;
    C.hand.forEach((inst, i) => {
      const off = i - (n - 1) / 2;
      const d = En.cardDef(inst), can = En.canPlay(C, inst).ok;
      const tgt = Cb.pending ? null : null;
      const el = UI.cardEl(inst, C, { num: i < 9 ? i + 1 : null });
      el.style.setProperty('--x', Math.round(off * step) + 'px'); el.style.setProperty('--y', Math.round(Math.abs(off) * Math.abs(off) * 1.3) + 'px'); el.style.setProperty('--r', (off * 2.2).toFixed(1) + 'deg');
      el.style.zIndex = i;
      if (!can) el.classList.add('noplay');
      if (d.cost !== 'X' && d.cost > C.energy && d.cost >= 0) el.classList.add('unaff');
      if (!Cb.seen.has(inst.uid)) { el.classList.add('draw-in'); el.style.setProperty('--d', (i * 0.06) + 's'); Cb.seen.add(inst.uid); }
      if (Cb.selUid === inst.uid) el.classList.add('sel');
      el.onclick = (ev) => { ev.stopPropagation(); onCardClick(inst); };
      el.oncontextmenu = (ev) => { ev.preventDefault(); cancelSel(); };
      hand.appendChild(el);
    });
  }
  function updateTip() {
    const tb = $('#tipbar'); if (!tb) return;
    const C = Cb.C;
    let t = '';
    if (!C || C.over) t = '';
    else if (Cb.busy) t = '';
    else if (Cb.pending) t = Cb.pending.kind === 'potion' ? '🎯 Elige un enemigo para la poción (Esc para cancelar)' : '🎯 Elige un enemigo: clic, o ←/→ y Enter (Esc para cancelar)';
    else if (Cb.selUid) t = SM.settings.confirm ? '👆 Haz clic otra vez en la carta para jugarla (Enter)' : '';
    else t = '👆 Elige una carta de tu mano · ⚡ cuesta energía';
    tb.textContent = t; tb.classList.toggle('hidden', !t);
  }

  /* --- interacción --- */
  function cancelSel() {
    Cb.pending = null; Cb.selUid = null;
    document.querySelectorAll('#hand .card.sel').forEach((c) => c.classList.remove('sel'));
    if (Cb.C) { Cb.els.forEach((el) => el.classList.remove('target-ok', 'target-cur')); updateTip(); }
  }
  function startTargeting(p) {
    Cb.pending = p; Cb.els.forEach((el, uid) => { const e = Cb.C.enemies.find((x) => x.uid === uid); el.classList.toggle('target-ok', !!e && e.hp > 0); });
    Cb.tIdx = 0; hiTarget(); updateTip();
  }
  function hiTarget() {
    document.querySelectorAll('.enemy.target-cur').forEach((x) => x.classList.remove('target-cur'));
    if (!Cb.pending || !Cb.C) return;
    const lv = En.living(Cb.C); if (!lv.length) return;
    const el = enemyEl(lv[Cb.tIdx % lv.length]); if (el) el.classList.add('target-cur');
  }
  function onCardClick(inst) {
    const C = Cb.C; if (Cb.busy || !C || C.over) return;
    const ok = En.canPlay(C, inst);
    if (!ok.ok) { SM.sfx('error'); UI.toast(ok.why); return; }
    const d = En.cardDef(inst);
    const needT = En.needsTarget(d) && En.living(C).length > 1;
    if (Cb.selUid === inst.uid && !Cb.pending) { if (needT) { startTargeting({ kind: 'card', uid: inst.uid }); } else playNow(inst); return; }
    cancelSel();
    Cb.selUid = inst.uid; SM.sfx('select');
    document.querySelectorAll('#hand .card').forEach((c) => c.classList.toggle('sel', +c.dataset.uid === inst.uid));
    if (needT) startTargeting({ kind: 'card', uid: inst.uid });
    else if (!SM.settings.confirm) playNow(inst);
    else updateTip();
  }
  function onEnemyClick(e) {
    const C = Cb.C; if (!C || Cb.busy || e.hp <= 0) return;
    if (!Cb.pending) return;
    const p = Cb.pending; Cb.pending = null;
    if (p.kind === 'card') { const inst = C.hand.find((c) => c.uid === p.uid); cancelSel(); if (inst) playNow(inst, e); }
    else { cancelSel(); usePotionNow(p.slot, e); }
  }
  function onPotion(slot) {
    const C = Cb.C; if (UI.current !== 'combat' || !C || Cb.busy || C.over) { UI.toast('Solo puedes usar pociones en combate.'); return; }
    const p = SM.POTIONS[G().potions[slot]]; if (!p) return;
    cancelSel();
    if (p.target && En.living(C).length > 1) startTargeting({ kind: 'potion', slot });
    else usePotionNow(slot, En.living(C)[0]);
  }
  async function usePotionNow(slot, target) {
    const C = Cb.C; Cb.busy = true;
    SM.sfx('potion');
    En.usePotion(C, slot, target);
    renderAll(); await sleep(350);
    if (await checkEnd()) return;
    Cb.busy = false; renderAll();
  }
  function playAnimFor(d) {
    const f = d.fx;
    if (d.type === 'attack' || f.ostyHit) { const big = (f.dmg || 0) * (f.hits || 1) >= 14 || (d.cost !== 'X' && d.cost >= 2) || f.x; return big ? 'attack_heavy' : 'attack'; }
    return 'cast';
  }
  function flyGhost(uid) {
    const el = document.querySelector(`#hand .card[data-uid="${uid}"]`); if (!el) return;
    const sr = stage().getBoundingClientRect(), sc = sr.width / 1280, r = el.getBoundingClientRect();
    const g = el.cloneNode(true); g.className = el.className.replace(/\b(sel|draw-in|noplay)\b/g, '') + ' ghost';
    g.style.left = ((r.left - sr.left + r.width / 2) / sc) + 'px'; g.style.top = ((r.top - sr.top + r.height / 2) / sc) + 'px';
    g.style.transform = 'translate(-50%,-50%) scale(1.25)'; g.style.zIndex = 200;
    stage().appendChild(g);
    requestAnimationFrame(() => { g.style.transform = 'translate(-50%,-50%) translate(' + ((640 - (r.left - sr.left + r.width / 2) / sc) * 0.55) + 'px,' + (-130) + 'px) scale(.8)'; g.style.opacity = 0; });
    setTimeout(() => g.remove(), 420);
  }
  async function playNow(inst, target) {
    const C = Cb.C; if (Cb.busy) return;
    Cb.busy = true;
    const d = En.cardDef(inst);
    cancelSel();
    flyGhost(inst.uid);
    SM.sfx('card');
    Cb.sprite.play(playAnimFor(d));
    if (d.type === 'attack' || d.fx.ostyHit) await sleep(d.cost >= 2 ? 260 : 180);
    if (!En.playCard(C, inst.uid, target)) { Cb.busy = false; renderAll(); return; }
    if (d.fx.pw || d.type === 'power') SM.sfx('buff');
    if (d.fx.add && d.fx.add.id === 's_shiv') SM.sfx('buff');
    renderAll();
    await sleep(260);
    if (C.prompt) await handlePrompt();
    if (await checkEnd()) return;
    Cb.busy = false; renderAll();
  }
  async function handlePrompt() {
    const C = Cb.C, p = C.prompt;
    const sel = await UI.pickCards({ title: p.kind === 'discard' ? `Descarta ${p.n} carta${p.n > 1 ? 's' : ''}` : `Agota ${p.n} carta${p.n > 1 ? 's' : ''}`, sub: p.kind === 'exhaust' ? 'Las cartas agotadas salen del combate.' : 'Elige de tu mano.', cards: C.hand.slice(), n: p.n, C });
    En.resolvePrompt(C, sel.map((c) => c.uid), p);
    renderAll();
  }
  async function endTurn() {
    const C = Cb.C; if (!C || Cb.busy || C.over || C.prompt) return;
    cancelSel(); Cb.busy = true; SM.sfx('end');
    En.endPlayerTurn(C); renderAll();
    if (await checkEnd()) return;
    await sleep(450);
    for (const e of C.enemies.slice()) {
      if (Cb.C !== C) return;
      if (e.hp <= 0 || C.over) continue;
      const el = enemyEl(e), it = e.intent;
      const cls = it.dmg ? 'act-atk' : 'act-buff';
      if (el) { el.classList.add(cls); }
      await sleep(it.dmg ? 280 : 200);
      En.runEnemyTurn(C, e); renderAll();
      await sleep(it.dmg ? (it.hits || 1) * 260 + 280 : 380);
      if (el) el.classList.remove(cls);
      if (C.over) break;
    }
    if (Cb.C !== C) return;
    if (await checkEnd()) return;
    En.endRound(C); En.startTurn(C);
    Cb.busy = false; renderAll();
    banner('Tu turno');
  }
  async function checkEnd() {
    const C = Cb.C; if (!C || !C.over || Cb.over) return !!(C && C.over);
    Cb.over = true; Cb.busy = true; renderAll();
    if (C.over === 'win') {
      SM.sfx('win'); await sleep(1000);
      finishWin();
    } else {
      SM.sfx('lose'); Cb.sprite.play('die'); await sleep(2300);
      gameOver();
    }
    return true;
  }
  function finishWin() {
    const g = G(), C = Cb.C;
    for (const id of g.relics) { const r = SM.RELICS[id]; if (r.onCombatEnd) r.onCombatEnd(g); }
    g.stats.fights++;
    const tier = C.tier;
    Cb.C = null; UI.onPotion = null;
    if (Cb.sprite) { Cb.sprite.destroy(); Cb.sprite = null; }
    rewardScreen(En.combatReward(g, tier), tier);
  }

  /* ======================= RECOMPENSAS ======================= */
  function rewardScreen(rew, tier, onDone) {
    const g = G();
    show('reward');
    const s = scr('reward'); s.className = 'screen scr-bg'; setBg(s);
    SM.music('map', g.act);
    s.innerHTML = `<div class="center-col"><h2 style="margin:0;font-size:46px;color:var(--gold);text-shadow:0 3px 8px #000">¡Victoria!</h2><div class="rew-list"></div><button class="btn big" id="rwDone">Continuar ➜</button></div>`;
    const list = $('.rew-list', s);
    let cardTaken = !rew.cards, bossTaken = !rew.bossRelics;
    const item = (ic, html, fn) => { const b = h('button', 'rew-item', `<span class="ic">${ic}</span><span>${html}</span>`); b.onclick = async () => { SM.sfx('click'); const r = await fn(b); if (r !== false) { b.disabled = true; } UI.updateTop(); }; list.appendChild(b); return b; };
    item('💰', `${rew.gold} de oro`, () => { En.gainGold(g, rew.gold); SM.sfx('coin'); });
    if (rew.potion) { const p = SM.POTIONS[rew.potion]; item(p.i, `${p.n}<small>${p.d}</small>`, () => { const i = g.potions.indexOf(null); if (i < 0) { UI.toast('Tienes todas las pociones llenas.'); return false; } g.potions[i] = rew.potion; SM.sfx('potion'); }); }
    if (rew.relic) { const r = SM.RELICS[rew.relic]; item(r.i, `${r.n}<small>${r.d}</small>`, () => { En.addRelic(g, rew.relic); SM.sfx('buff'); }); }
    if (rew.bossRelics) item('👑', 'Elige una reliquia de jefe<small>Obtienes una de tres.</small>', async () => {
      const p = h('div', 'row'); p.style.flexWrap = 'wrap';
      const o = UI.overlay(); o.appendChild(h('h2', '', 'Reliquia de jefe')); o.appendChild(p);
      return new Promise((res) => {
        for (const id of rew.bossRelics) {
          const r = SM.RELICS[id];
          const b = h('button', 'big-opt', `<span class="ic">${r.i}</span>${r.n}<small>${r.d}</small>`); b.style.width = '300px';
          b.onclick = () => { En.addRelic(g, id); SM.sfx('buff'); bossTaken = true; o.remove(); res(true); };
          p.appendChild(b);
        }
      });
    });
    if (rew.cards) item('🃏', 'Añadir una carta a tu mazo<small>Elige 1 de 3.</small>', async () => {
      const cards = rew.cards.map((id) => En.makeCard(g, id));
      const pick = await UI.pickCards({ title: 'Elige una carta', sub: 'Se añadirá a tu mazo.', cards, n: 1, cancel: 'Saltar', big: true, confirmLabel: 'Tomar carta' });
      if (!pick.length) return false;
      g.deck.push(En.makeCard(g, pick[0].id)); cardTaken = true; SM.sfx('buff');
    });
    $('#rwDone', s).onclick = async () => {
      SM.sfx('click');
      if (!cardTaken && !(await UI.confirm('¿Seguro que quieres continuar sin elegir una carta?'))) return;
      if (!bossTaken) { UI.toast('Elige una reliquia de jefe primero.'); return; }
      if (onDone) onDone(); else nodeDone(tier === 'boss');
    };
  }

  /* ======================= TIENDA ======================= */
  function shopScreen() {
    const g = G();
    show('shop');
    const s = scr('shop'); s.className = 'screen scr-bg'; setBg(s);
    SM.music('shop', g.act);
    const shop = Gm.genShop(g);
    const render = () => {
      UI.updateTop();
      s.innerHTML = `<div class="shop-wrap"><div style="text-align:center;font-size:34px;color:var(--gold)">💰 La Tienda del Mercader · tienes ${g.gold} de oro</div><div class="shop-cards"></div><div class="shop-mid"></div><div style="text-align:center"><button class="btn big" id="shopLeave">Salir de la tienda ➜</button></div></div>`;
      const cc = $('.shop-cards', s);
      shop.cards.forEach((it) => {
        const w = h('div', 'shop-item' + (it.sold ? ' sold' : ''));
        const el = UI.cardEl(En.makeCard(g, it.id)); el.style.setProperty('--w', '158px');
        el.onclick = async () => { if (g.gold < it.price) { SM.sfx('error'); UI.toast('No tienes suficiente oro.'); return; } if (await UI.confirm(`¿Comprar <b>${SM.CARDS[it.id].name}</b> por ${it.price} de oro?`)) { g.gold -= it.price; it.sold = true; g.deck.push(En.makeCard(g, it.id)); SM.sfx('coin'); render(); } };
        w.append(el, h('div', 'price' + (g.gold < it.price ? ' no' : ''), `💰 ${it.price}`));
        cc.appendChild(w);
      });
      const mid = $('.shop-mid', s);
      const box1 = h('div', 'shop-box'); box1.appendChild(h('div', '', '<b>Reliquias</b>'));
      shop.relics.forEach((it) => {
        const r = SM.RELICS[it.id];
        const w = h('div', 'shop-item' + (it.sold ? ' sold' : ''));
        const b = h('button', 'mini', r.i); b.dataset.tipt = `<b>${r.n}</b>${r.d}`;
        b.onclick = async () => { if (g.gold < it.price) { SM.sfx('error'); UI.toast('No tienes suficiente oro.'); return; } if (await UI.confirm(`¿Comprar <b>${r.n}</b> por ${it.price} de oro?<br><small>${r.d}</small>`)) { g.gold -= it.price; it.sold = true; En.addRelic(g, it.id); SM.sfx('coin'); render(); } };
        w.append(b, h('div', 'price' + (g.gold < it.price ? ' no' : ''), `💰 ${it.price}`)); box1.appendChild(w);
      });
      const box2 = h('div', 'shop-box'); box2.appendChild(h('div', '', '<b>Pociones</b>'));
      shop.potions.forEach((it) => {
        const p = SM.POTIONS[it.id];
        const w = h('div', 'shop-item' + (it.sold ? ' sold' : ''));
        const b = h('button', 'mini', p.i); b.dataset.tipt = `<b>${p.n}</b>${p.d}`;
        b.onclick = async () => {
          if (g.gold < it.price) { SM.sfx('error'); UI.toast('No tienes suficiente oro.'); return; }
          if (!g.potions.includes(null)) { UI.toast('Tienes todas las pociones llenas.'); return; }
          if (await UI.confirm(`¿Comprar <b>${p.n}</b> por ${it.price} de oro?`)) { g.gold -= it.price; it.sold = true; g.potions[g.potions.indexOf(null)] = it.id; SM.sfx('coin'); render(); }
        };
        w.append(b, h('div', 'price' + (g.gold < it.price ? ' no' : ''), `💰 ${it.price}`)); box2.appendChild(w);
      });
      const box3 = h('div', 'shop-box'); const rm = shop.remove;
      const rb = h('button', 'mini' + (rm.used ? ' sold' : ''), '🗑️'); rb.dataset.tipt = '<b>Eliminar una carta</b>Quita una carta de tu mazo para hacerlo más fuerte.';
      rb.onclick = async () => {
        if (g.gold < rm.price) { SM.sfx('error'); UI.toast('No tienes suficiente oro.'); return; }
        const pick = await UI.pickCards({ title: 'Elige una carta para eliminar', cards: g.deck.slice(), n: 1, cancel: 'Cancelar', confirmLabel: 'Eliminar' });
        if (!pick.length) return;
        g.deck = g.deck.filter((c) => c.uid !== pick[0].uid); g.gold -= rm.price; rm.used = true; g.removed = (g.removed || 0) + 1; SM.sfx('coin'); render();
      };
      box3.append(h('div', '', '<b>Servicio</b>'), rb, h('div', 'price' + (g.gold < rm.price ? ' no' : ''), `💰 ${rm.price}`));
      mid.append(box1, box2, box3);
      $('#shopLeave', s).onclick = () => { SM.sfx('click'); nodeDone(false); };
    };
    render();
  }

  /* ======================= DESCANSO ======================= */
  function restScreen() {
    const g = G();
    show('rest');
    const s = scr('rest'); s.className = 'screen scr-bg'; setBg(s);
    SM.music('rest', g.act);
    const rp = En.NMODS(g).rest, heal = Math.ceil(g.maxHp * rp);
    s.innerHTML = `<div class="center-col"><h2 style="margin:0;font-size:48px;color:var(--gold)">🔥 Hoguera</h2><div class="sub" style="font-family:'Segoe UI';font-size:22px;color:#ddd">Una pausa junto al fuego. Elige una opción:</div>
      <div class="rest-opts"><button class="big-opt" id="rHeal"><span class="ic">🛏️</span>Descansar<small>Recuperas ${heal} PV (${Math.round(rp * 100)}%).</small></button>
      <button class="big-opt" id="rUp"><span class="ic">⚒️</span>Mejorar<small>Mejora una carta de tu mazo.</small></button></div></div>`;
    const done = () => { UI.updateTop(); nodeDone(false); };
    $('#rHeal', s).onclick = () => { SM.sfx('heal'); g.hp = Math.min(g.maxHp, g.hp + heal); UI.toast(`Recuperas ${heal} PV.`); setTimeout(done, 500); };
    const up = $('#rUp', s); up.disabled = !g.deck.some(En.canUpgrade);
    up.onclick = async () => {
      const pick = await UI.pickCards({ title: 'Elige una carta para mejorar', sub: 'Al elegir una carta verás cómo queda mejorada.', upgradePreview: true, cards: g.deck.filter(En.canUpgrade), n: 1, cancel: 'Cancelar', confirmLabel: 'Mejorar' });
      if (!pick.length) return;
      const c = g.deck.find((x) => x.uid === pick[0].uid); c.up = true; SM.sfx('buff');
      await UI.viewCards('¡Carta mejorada!', [c]);
      done();
    };
  }

  /* ======================= EVENTOS ======================= */
  function eventScreen() {
    const g = G();
    show('event');
    const s = scr('event'); s.className = 'screen scr-bg ev';
    SM.music('rest', g.act);
    const ev = Gm.pickEvent(g);
    setBg(s, SM.hasAsset('bg/ev_' + ev.id + '.webp') ? 'ev_' + ev.id : undefined);
    const md = (t) => t.replace(/\*\*(.+?)\*\*/g, '<b style="color:var(--gold)">$1</b>');
    s.innerHTML = `<div class="center-col"><div class="panel sans event-box"><div class="eimg">${ev.img}</div><h2 style="font-family:Cinzel,serif;margin:6px 0">${ev.title}</h2><p id="evText">${ev.text}</p><div class="event-opts"></div></div></div>`;
    const opts = $('.event-opts', s);
    const ctx = { pickCard: (title, filter, n) => UI.pickCards({ title, upgradePreview: filter === En.canUpgrade, cards: g.deck.filter(filter), n, cancel: 'Cancelar' }) };
    ev.opts(g).forEach((o) => {
      const b = h('button', 'btn', `${o.t}${o.hint ? `<small>${o.hint}</small>` : ''}`);
      if (o.ok === false) b.disabled = true;
      b.onclick = async () => {
        SM.sfx('click');
        if (o.fight) { combat(Gm.encounterFor(g, o.fight), o.fight); return; }
        const res = await o.run(ctx);
        UI.updateTop();
        if (g.hp <= 0) { g.hp = 1; }
        $('#evText', s).innerHTML = md(res);
        opts.innerHTML = '';
        const c = h('button', 'btn big', 'Continuar ➜'); c.onclick = () => { SM.sfx('click'); nodeDone(false); }; opts.appendChild(c);
      };
      opts.appendChild(b);
    });
  }

  /* ======================= FIN ======================= */
  function gameOver() {
    const g = G(); SM.Meta.add('deaths');
    Gm.clearSave();
    show('end');
    const s = scr('end'); s.className = 'screen end-scr';
    s.style.backgroundImage = `url('${SM.asset('ui/' + g.char + '_select.webp')}')`; s.style.filter = '';
    SM.music('menu');
    s.innerHTML = `<h1 style="color:#ff6b75">Derrota</h1><div class="sum">${MUSE[g.char].name} cayó en ${SM.ACTS[g.act - 1].name}.<br>Combates ganados: ${g.stats.fights} · Enemigos derrotados: ${g.stats.kills} · Turnos: ${g.stats.turns}</div>`;
    const row = h('div', 'row'); const a = h('button', 'btn big green', 'Intentarlo de nuevo'), b = h('button', 'btn big', 'Menú principal');
    a.onclick = () => { SM.sfx('click'); selectScreen(); }; b.onclick = () => { SM.sfx('click'); SM.run = null; title(); };
    row.append(a, b); s.appendChild(row);
    SM.run && UI.updateTop();
    $('#topbar').classList.add('hidden');
  }
  function victory() {
    const g = G();
    Gm.clearSave();
    const newNm = Math.min(10, (g.nm || 0) + 1) > SM.Meta.nmUnlocked();
    SM.Meta.winRun(g.char, g.nm || 0);
    SM.Meta.data.lastWinner = g.char; SM.Meta.data.seenEnding = true;
    ending(g.char, g.nm || 0, () => victorySummary(g, newNm));
  }
  function victorySummary(g, newNm) {
    show('end');
    const s = scr('end'); s.className = 'screen end-scr';
    s.style.backgroundImage = `url('${SM.asset('ui/' + g.char + '_select.webp')}')`;
    SM.music('victory'); SM.sfx('win');
    const nmTxt = (g.nm || 0) >= 10 ? '<br>🌙 ¡Has superado la Pesadilla 10! Nada más puede detenerte.' : `<br>🌙 <b style="color:#caa5ff">Pesadilla ${Math.min(10, (g.nm || 0) + 1)} desbloqueada</b>: enemigos más duros te esperan.`;
    s.innerHTML = `<h1 style="color:var(--gold)">¡VICTORIA!</h1><div class="sum">${MUSE[g.char].name} ha conquistado la torre y derrotado a la Reina de la Colmena.<br>Combates ganados: ${g.stats.fights} · Enemigos derrotados: ${g.stats.kills} · Turnos: ${g.stats.turns}<br>Reliquias: ${g.relics.map((r) => SM.RELICS[r].i).join(' ')} · Cartas en el mazo: ${g.deck.length}${g.easy ? '<br><i>(Modo fácil)</i>' : ''}${g.nm ? `<br>🌙 Pesadilla ${g.nm}` : ''}${nmTxt}</div>`;
    const row = h('div', 'row'); row.style.flexWrap = 'wrap';
    const a = h('button', 'btn big green', 'Jugar de nuevo'), c = h('button', 'btn big', '🖼️ Galería'), b = h('button', 'btn big', 'Menú principal');
    a.onclick = () => { SM.sfx('click'); selectScreen(); }; b.onclick = () => { SM.sfx('click'); SM.run = null; title(); };
    c.onclick = () => { SM.sfx('click'); galleryScreen(); };
    row.append(a, c, b); s.appendChild(row);
    $('#topbar').classList.add('hidden');
  }

  /* ======================= FINAL (cinemática) ======================= */
  const NAMES = { miranda: 'Zafira', staryuuki: 'Nila', karen: 'Claudia' };
  function ending(char, nm, done, replay) {
    show('ending');
    const s = scr('ending'); s.className = 'screen cine';
    SM.music('ending');
    const others = ['miranda', 'staryuuki', 'karen'].filter((c) => c !== char);
    const fill = (t) => t.replace('{N}', NAMES[char]).replace('{O1}', NAMES[others[0]]).replace('{O2}', NAMES[others[1]]);
    const scenes = SM.ENDING.scenes.map((sc) => ({ img: sc.img.replace('{c}', char), fx: sc.fx, text: fill(sc.text) }));
    scenes.push({ img: SM.ENDING.nightmare.img, fx: SM.ENDING.nightmare.fx, text: SM.ENDING.nightmare.text, dark: true });
    s.innerHTML = `<div class="cine-stage"><div class="cine-img a"></div><div class="cine-img b"></div></div><div class="cine-bars"></div>
      <div class="cine-text sans"><p id="cineP"></p></div>
      <div class="cine-ctrl"><button class="btn small" id="cSkip">Saltar ⏭</button><button class="btn small" id="cAuto">Automático: sí</button><button class="btn" id="cNext">Siguiente ▶</button></div><div class="cine-title" id="cTitle"></div>`;
    let idx = -1, typing = null, timer = null, auto = true, front = 'a', finished = false;
    const imgs = { a: $('.cine-img.a', s), b: $('.cine-img.b', s) };
    const P = $('#cineP', s);
    const fallbackBg = `linear-gradient(135deg,#1a0f2e,#05030a)`;
    function finish() {
      if (finished) return; finished = true; clearTimeout(timer); clearInterval(typing);
      window.removeEventListener('keydown', onKey);
      if (replay) { title(); return; }
      done();
    }
    function showScene(i) {
      clearTimeout(timer); clearInterval(typing);
      idx = i;
      if (i >= scenes.length) {
        const t = $('#cTitle', s); t.textContent = 'FIN'; t.classList.add('on'); P.textContent = '';
        timer = setTimeout(finish, 3500); return;
      }
      const sc = scenes[i];
      const back = front === 'a' ? 'b' : 'a'; const el = imgs[back];
      const path = 'end/' + sc.img + '.webp';
      const url = SM.hasAsset(path) ? `url('${SM.asset(path)}')` : `url('${SM.asset('ui/' + char + '_select.webp')}')`;
      el.style.backgroundImage = url; el.className = 'cine-img ' + back + ' fx-' + sc.fx + (sc.dark ? ' dark' : '');
      void el.offsetWidth; el.classList.add('live');
      imgs[front].classList.remove('live'); imgs[front].style.opacity = 0; el.style.opacity = 1; front = back;
      // máquina de escribir
      P.textContent = ''; let k = 0; const txt = sc.text;
      typing = setInterval(() => { k += 2; P.textContent = txt.slice(0, k); if (k >= txt.length) { clearInterval(typing); if (auto) timer = setTimeout(() => showScene(idx + 1), 5200); } }, 38);
    }
    function next() {
      SM.sfx('click');
      if (idx >= 0 && idx < scenes.length && P.textContent.length < scenes[idx].text.length) { clearInterval(typing); P.textContent = scenes[idx].text; if (auto) { clearTimeout(timer); timer = setTimeout(() => showScene(idx + 1), 5200); } return; }
      showScene(idx + 1);
    }
    const onKey = (e) => { if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight') { e.preventDefault(); next(); } else if (e.key === 'Escape') finish(); };
    window.addEventListener('keydown', onKey);
    $('#cNext', s).onclick = next; $('#cSkip', s).onclick = () => { SM.sfx('click'); finish(); };
    $('#cAuto', s).onclick = (e) => { auto = !auto; e.target.textContent = 'Automático: ' + (auto ? 'sí' : 'no'); SM.sfx('click'); if (!auto) clearTimeout(timer); else if (idx >= 0 && P.textContent.length >= (scenes[idx] ? scenes[idx].text.length : 0)) timer = setTimeout(() => showScene(idx + 1), 2500); };
    showScene(0);
  }
  UI.ending = ending;

  /* ======================= GALERÍA ======================= */
  function loreArt(l) {
    const p = 'lore/' + l.id + '.webp';
    return SM.hasAsset(p) ? `background-image:url('${SM.asset(p)}')` : `background:linear-gradient(135deg,#2a1d4a,#0b0814)`;
  }
  function galleryScreen() {
    show('gallery');
    const s = scr('gallery'); SM.music('menu', 1, titleChar || 'miranda');
    const M = SM.Meta;
    const un = SM.LORE.filter((l) => M.isUnlocked(l.id)).length;
    s.innerHTML = `<div class="gal-head"><div><h2>🖼️ Galería de la Aguja</h2><div class="sub sans">La historia del mundo se revela con tus hazañas · <b>${un}/${SM.LORE.length}</b> desbloqueadas</div></div><div class="gal-btns"></div></div><div class="gal-grid"></div>`;
    const btns = $('.gal-btns', s);
    if (M.data.seenEnding) { const r = h('button', 'btn small', '🎬 Ver el final'); r.onclick = () => { SM.sfx('click'); ending(M.data.lastWinner || 'miranda', 0, null, true); }; btns.appendChild(r); }
    const back = h('button', 'btn small', '← Volver'); back.onclick = () => { SM.sfx('click'); if (SM.run && UI.galleryFrom === 'run') { UI.mapScreen(); } else title(); }; btns.appendChild(back);
    const grid = $('.gal-grid', s);
    SM.LORE.forEach((l, i) => {
      const ok = M.isUnlocked(l.id), pr = M.progress(l);
      const t = h('div', 'gal-tile' + (ok ? '' : ' locked'));
      t.innerHTML = `<div class="gal-art" style="${ok ? loreArt(l) : ''}">${ok ? '' : '<div class="lockico">🔒</div>'}${ok ? '' : `<div class="gal-ico">${l.ico}</div>`}</div><div class="gal-info sans"><b>${ok ? l.title : '???'}</b>${ok ? `<span>Capítulo ${i + 1}</span>` : `<span>${l.ch}</span><div class="pbar"><i style="width:${(pr / l.t) * 100}%"></i></div><small>${Math.min(pr, l.t)} / ${l.t}</small>`}</div>`;
      if (ok) t.onclick = () => { SM.sfx('click'); viewLore(i); };
      grid.appendChild(t);
    });
  }
  function viewLore(i) {
    const M = SM.Meta;
    const list = SM.LORE.map((l, k) => [l, k]).filter(([l]) => M.isUnlocked(l.id));
    let at = list.findIndex(([, k]) => k === i);
    const o = UI.overlay(); o.classList.add('lore-view');
    const render = () => {
      const [l, k] = list[at];
      o.innerHTML = `<div class="lore-art" style="${loreArt(l)}"></div><div class="lore-body sans"><div class="lore-chap">Capítulo ${k + 1} de ${SM.LORE.length}</div><h2>${l.title}</h2><p>${l.text}</p><div class="lore-nav"></div></div>`;
      const nav = $('.lore-nav', o);
      const pv = h('button', 'btn small', '◀ Anterior'), nx = h('button', 'btn small', 'Siguiente ▶'), cl = h('button', 'btn small red', 'Cerrar');
      pv.disabled = at === 0; nx.disabled = at === list.length - 1;
      pv.onclick = () => { at--; SM.sfx('click'); render(); }; nx.onclick = () => { at++; SM.sfx('click'); render(); }; cl.onclick = () => { SM.sfx('click'); o.remove(); };
      nav.append(pv, nx, cl);
    };
    render();
  }
  // aviso de desbloqueo
  UI.pollUnlocks = () => {
    const got = SM.Meta.takeUnlocked();
    got.forEach((l, i) => setTimeout(() => {
      const d = h('div', 'unlock sans', `<div class="uico">${l.ico}</div><div><small>Nueva imagen en la Galería</small><b>${l.title}</b></div>`);
      stage().appendChild(d); SM.sfx('win'); setTimeout(() => d.classList.add('out'), 4200); setTimeout(() => d.remove(), 4800);
    }, i * 5000));
  };
  SM.Meta.onUnlock(() => UI.pollUnlocks());


  /* ======================= PAUSA ======================= */
  function leaveRun() {
    if (Cb.sprite) { Cb.sprite.destroy(); Cb.sprite = null; }
    Cb.C = null; Cb.busy = false; UI.onPotion = null;
    document.querySelectorAll('.pop,.banner,.flash,.ghost,.vignette-low').forEach((e) => e.remove());
  }
  function pauseMenu() {
    if (!SM.run || !['map', 'combat', 'reward', 'shop', 'rest', 'event'].includes(UI.current)) return;
    if (document.querySelector('.overlay.pause')) return;
    const g = G();
    const p = h('div', 'panel sans pause-box');
    p.innerHTML = '<h3 style="margin:0 0 14px;font-size:32px;font-family:Cinzel,serif;color:var(--gold);text-align:center">⏸ Pausa</h3>';
    const col = h('div', 'menu-col'); col.style.width = '340px';
    const o = UI.overlay(p); o.classList.add('pause');
    const add = (t, cls, fn) => { const b = h('button', 'btn ' + (cls || ''), t); b.onclick = () => { SM.sfx('click'); fn(); }; col.appendChild(b); };
    add('▶ Seguir jugando', 'green', () => o.remove());
    add('⚙️ Opciones', '', () => UI.options());
    add('❓ Cómo jugar', '', () => UI.help());
    add('💾 Guardar y salir', '', async () => {
      const where = UI.current === 'map' ? 'Tu partida está guardada en este punto del mapa.' : 'Tu partida se guarda al inicio de esta sala, y la sala se repetirá al continuar.';
      if (!(await UI.confirm(`¿Guardar y salir al menú?<br><small style="font-size:18px">${where}</small>`, 'Guardar y salir', 'Cancelar'))) return;
      o.remove(); leaveRun(); SM.run = null; title();
      UI.toast('Partida guardada. Puedes continuar desde el menú.');
    });
    add('🏳️ Rendirse', 'red', async () => {
      if (!(await UI.confirm('¿Seguro que quieres rendirte?<br><small style="font-size:18px">La partida terminará como una derrota.</small>', 'Rendirme', 'Seguir luchando'))) return;
      o.remove(); leaveRun(); gameOver();
    });
    p.appendChild(col);
  }
  UI.pauseMenu = pauseMenu;

  /* ======================= TECLADO ======================= */
  const NAV_SCREENS = ['reward', 'shop', 'rest', 'event', 'title', 'select', 'gallery', 'end', 'ending'];
  function navKey(ev) {
    const ovs = document.querySelectorAll('.overlay');
    const scope = ovs.length ? ovs[ovs.length - 1] : (NAV_SCREENS.includes(UI.current) || (ev.pad && UI.current === 'map') ? document.getElementById(UI.current) : null);
    if (!scope) return false;
    if (ev.target && /^(INPUT|TEXTAREA|SELECT)$/.test(ev.target.tagName)) return false;
    const items = [...scope.querySelectorAll('button:not([disabled]), [tabindex="0"]')].filter((x) => x.offsetParent !== null);
    if (ev.key === 'Escape' && ovs.length) {
      const top = ovs[ovs.length - 1];
      if (top.classList.contains('pause')) { top.remove(); return true; }
      const b = [...items].find((x) => /^(Cancelar|Saltar|Cerrar)/.test(x.textContent.trim()));
      if (b) { b.click(); return true; }
      return false;
    }
    if (!items.length) return false;
    const act = document.activeElement;
    if (['Enter', ' '].includes(ev.key)) {
      if (act && items.includes(act) && act.tagName !== 'BUTTON') { ev.preventDefault(); act.click(); }
      return false;
    }
    const dir = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowDown: [0, 1], ArrowUp: [0, -1] }[ev.key];
    if (!dir) return false;
    ev.preventDefault();
    if (!act || !items.includes(act)) { items[0].focus(); SM.sfx('select'); return true; }
    const r = act.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    let best = null, bs = 1e12;
    for (const it of items) {
      if (it === act) continue;
      const q = it.getBoundingClientRect(), dx = q.left + q.width / 2 - cx, dy = q.top + q.height / 2 - cy;
      const along = dx * dir[0] + dy * dir[1]; if (along <= 1) continue;
      const side = Math.abs(dx * dir[1]) + Math.abs(dy * dir[0]);
      const sc = along + side * 2.5; if (sc < bs) { bs = sc; best = it; }
    }
    if (best) { best.focus(); best.scrollIntoView({ block: UI.current === 'map' ? 'center' : 'nearest' }); SM.sfx('select'); }
    return true;
  }
  UI.onKey = (ev) => {
    if (UI.current !== 'combat' || document.querySelector('.overlay')) { if (navKey(ev)) return; }
    if (ev.key === 'Escape' && !document.querySelector('.overlay') && SM.run) {
      if (UI.current === 'combat' && (Cb.selUid || Cb.pending)) { cancelSel(); return; }
      pauseMenu(); return;
    }
    if (UI.current === 'map' && !document.querySelector('.overlay')) { const sc = $('#mapScroll'); if (sc) { const d = { ArrowUp: -160, ArrowDown: 160, PageUp: -520, PageDown: 520 }[ev.key]; if (d) { ev.preventDefault(); sc.scrollBy({ top: d, behavior: 'smooth' }); } } return; }
    if (UI.current !== 'combat' || !Cb.C) return;
    if (document.querySelector('.overlay')) return;
    const C = Cb.C;
    if (ev.key === 'Escape') { cancelSel(); return; }
    if (Cb.busy || C.over) return;
    const living = En.living(C);
    if (/^[1-9]$/.test(ev.key)) { const inst = C.hand[+ev.key - 1]; if (inst) onCardClick(inst); return; }
    const moveTarget = (d) => {
      if (!living.length) return;
      Cb.tIdx = (Cb.tIdx + d + living.length * 4) % living.length;
      hiTarget(); SM.sfx('select'); UI.toast('Objetivo: ' + living[Cb.tIdx].name);
    };
    if (Cb.pending && ['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'Tab'].includes(ev.key)) {
      ev.preventDefault(); moveTarget(ev.key === 'ArrowRight' || ev.key === 'ArrowDown' || ev.key === 'Tab' ? 1 : -1); return;
    }
    if (ev.key === 'ArrowRight' || ev.key === 'ArrowLeft') {
      ev.preventDefault();
      const i = C.hand.findIndex((c) => c.uid === Cb.selUid);
      const j = ev.key === 'ArrowRight' ? Math.min(C.hand.length - 1, i + 1) : Math.max(0, i < 0 ? 0 : i - 1);
      const inst = C.hand[i < 0 ? 0 : j]; if (inst) { cancelSel(); Cb.selUid = inst.uid; SM.sfx('select'); document.querySelectorAll('#hand .card').forEach((c) => c.classList.toggle('sel', +c.dataset.uid === inst.uid)); updateTip(); }
      return;
    }
    if (ev.key === 'ArrowUp' || ev.key === 'ArrowDown' || ev.key === 'Tab') { ev.preventDefault(); moveTarget(ev.key === 'ArrowUp' ? -1 : 1); return; }
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      const inst = C.hand.find((c) => c.uid === Cb.selUid);
      if (!inst) return;
      if (!En.canPlay(C, inst).ok) { SM.sfx('error'); return; }
      const d = En.cardDef(inst);
      const needT = En.needsTarget(d) && living.length > 1;
      if (needT && !Cb.pending) { startTargeting({ kind: 'card', uid: inst.uid }); return; }
      const t = En.needsTarget(d) ? living[Cb.tIdx % living.length] : undefined;
      cancelSel(); playNow(inst, t); return;
    }
    if (ev.key.toLowerCase() === 'e') endTurn();
  };

  UI.mapScreen = mapScreen;
  Object.assign(UI, { galleryScreen, rewardScreen, shopScreen, restScreen, eventScreen, victory, gameOver, combat, selectScreen });
})();
