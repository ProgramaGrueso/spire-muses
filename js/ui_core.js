/* Spire Muses — utilidades de interfaz: tarjetas, tooltips, ventanas modales, barra superior. */
(function () {
  const SM = window.SM, En = SM.Engine;
  const UI = (SM.UI = {});
  const $ = (s, r) => (r || document).querySelector(s);
  const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; };
  const sleep = (ms) => new Promise((r) => setTimeout(r, SM.settings.fast ? Math.min(ms, ms * 0.45) : ms));
  Object.assign(UI, { $, h, sleep });

  /* ---------- Glosario ---------- */
  const GLOS = {
    Bloqueo: 'Absorbe el daño que recibes. Se pierde al empezar tu turno.',
    Vulnerable: 'Recibe un 50% más de daño de ataques.',
    Débil: 'Inflige un 25% menos de daño con ataques.',
    Frágil: 'El Bloqueo de tus cartas se reduce un 25%.',
    Veneno: 'Al inicio de su turno pierde PV igual al Veneno; luego el Veneno baja 1.',
    Agotar: 'La carta se retira del combate (vuelve en el siguiente).',
    Innata: 'Siempre empieza en tu mano al principio del combate.',
    Etérea: 'Si no la juegas este turno, se agota.',
    Fuerza: 'Aumenta el daño de tus ataques.',
    Destreza: 'Aumenta el Bloqueo que ganas de tus cartas.',
    Osty: 'Tu fiel mano espectral. Absorbe el daño que el Bloqueo no cubre y ataca al final de tu turno con su Poder. Si cae, vuelve solo con 1 PV al inicio de tu turno y se cura 1 PV por turno; las curas normales no lo reviven.',
    Poder: 'El daño base del ataque de Osty al final de tu turno (y se suma a sus cartas).',
    Cuchilla: 'Carta de coste 0 que inflige 4 de daño. Se agota.',
    TODOS: 'Afecta a todos los enemigos.',
  };
  UI.GLOS = GLOS;
  const kw = (w, label) => `<span class="kw" data-tip="${w}">${label || w}</span>`;

  /* ---------- Texto de carta ---------- */
  function cardLines(d, C, target) {
    const f = d.fx, L = [];
    const all = f.all ? ' a ' + kw('TODOS') + ' los enemigos' : '';
    const num = (v, prev) => (prev === undefined || prev === v ? `${v}` : `<span class="${prev > v ? 'down' : 'up'}">${prev}</span>`);
    const live = C && C.enemies ? En.living(C) : [];
    const tgt = target || (live.length === 1 ? live[0] : null);
    if (f.selfdmg) L.push(`Pierdes ${f.selfdmg} PV.`);
    if (f.energy) L.push(`Obtén ${'⚡'.repeat(Math.min(f.energy, 5))}.`);
    if (f.tstr) L.push(`Obtén ${f.tstr} de ${kw('Fuerza')} hasta el fin del turno.`);
    if (f.str) L.push(`Obtén ${f.str} de ${kw('Fuerza')}.`);
    if (f.dex) L.push(`Obtén ${f.dex} de ${kw('Destreza')}.`);
    if (f.doubleStr) L.push(`Duplica tu ${kw('Fuerza')}.`);
    if (f.doubleBlock) L.push(`Duplica tu ${kw('Bloqueo')}.`);
    if (f.block) L.push(`Obtén ${C ? num(f.block, En.calcBlock(C, f.block)) : f.block} de ${kw('Bloqueo')}.`);
    if (f.pw) for (const [k, v] of Object.entries(f.pw)) { const s = En.ST[k]; L.push(s.d(v)); }
    if (f.summon) L.push(`${kw('Osty')} gana +${f.summon} PV máx. y los recupera.`);
    if (f.ostyPow) L.push(`${kw('Osty')} gana +${f.ostyPow} de ${kw('Poder')}.`);
    if (f.ostyHeal) L.push(f.ostyHeal >= 99 ? `${kw('Osty')} ${f.revive ? 'revive y ' : ''}se cura por completo.` : `${kw('Osty')} recupera ${f.ostyHeal} PV.`);
    if (f.dmg || f.dmgBlock) {
      let v = f.dmgBlock ? 'daño igual a tu ' + kw('Bloqueo') : '';
      if (!f.dmgBlock) { const p = C ? En.previewDmg(C, d, tgt) : f.dmg; v = `${num(f.dmg, C ? p : undefined)} de daño`; }
      else if (C) v += ` (${En.previewDmg(C, d, tgt)})`;
      let t = `Inflige ${v}${all}`;
      if (f.x) t += ' X veces'; else if (f.hits > 1) t += ` ${f.hits} veces`;
      L.push(t + '.');
      if (f.strMul > 1) L.push(`La ${kw('Fuerza')} se aplica ×${f.strMul}.`);
      if (f.lifesteal) L.push('Te curas por el daño no bloqueado.');
      if (f.poisonDbl) L.push(`Si tiene ${kw('Veneno')}, el daño se duplica.`);
      if (f.fatalMax) L.push(`Si mata, +${f.fatalMax} PV máx.`);
    }
    if (f.ostyHit) {
      const p = C && C.osty ? C.osty.pow : null;
      L.push(`${kw('Osty')} ataca${all ? all : ''}: ${p !== null ? f.ostyHit + p : f.ostyHit + '+' + kw('Poder')}${f.hits > 1 ? ` ×${f.hits}` : ''}.`);
    }
    if (f.vuln) L.push(`Aplica ${f.vuln} ${kw('Vulnerable')}${all}.`);
    if (f.weak) L.push(`Aplica ${f.weak} ${kw('Débil')}${all}.`);
    if (f.poison) L.push(`Aplica ${f.poison} ${kw('Veneno')}${all}.`);
    if (f.poisonMul) L.push(`${f.poisonMul === 2 ? 'Duplica' : 'Triplica'} el ${kw('Veneno')} de un enemigo.`);
    if (f.heal) L.push(`Te curas ${f.heal} PV.`);
    if (f.draw) L.push(`Roba ${f.draw} carta${f.draw > 1 ? 's' : ''}.`);
    if (f.add) { const n = SM.CARDS[f.add.id].name; L.push(`Añade ${f.add.n} ${f.add.id === 's_shiv' ? kw('Cuchilla', f.add.n > 1 ? 'Cuchillas' : 'Cuchilla') : n} a ${f.add.to === 'hand' ? 'tu mano' : f.add.to === 'draw' ? 'tu mazo' : 'tu descarte'}.`); }
    if (f.stormOfSteel) L.push(`Descarta tu mano. Añade 1 ${kw('Cuchilla')} por carta descartada.`);
    if (f.discard) L.push(`Descarta ${f.discard} carta${f.discard > 1 ? 's' : ''}.`);
    if (f.exhaustPick) L.push(`${kw('Agotar')} ${f.exhaustPick} carta de tu mano.`);
    if (d.endHand && d.endHand.selfdmg) L.push(`Si está en tu mano al final del turno, pierdes ${d.endHand.selfdmg} PV.`);
    if (d.endHand && d.endHand.weakSelf) L.push(`Si está en tu mano al final del turno, quedas ${kw('Débil')}.`);
    if (d.flags.unplayable || d.cost === -1) L.push('<span class="fl">Injugable.</span>');
    const fl = [];
    if (d.flags.innate) fl.push(kw('Innata'));
    if (d.flags.ethereal) fl.push(kw('Etérea'));
    if (d.flags.exhaust) fl.push(kw('Agotar'));
    if (fl.length) L.push(`<span class="fl">${fl.join(' · ')}</span>`);
    return L;
  }
  UI.cardLines = cardLines;
  const TYPE_ES = { attack: 'Ataque', skill: 'Habilidad', power: 'Poder', status: 'Estado', curse: 'Maldición' };
  const TYPE_EMO = { attack: '⚔️', skill: '🛡️', power: '✨', status: '🩸', curse: '👁️' };

  function cardEl(inst, C, opts) {
    opts = opts || {};
    const d = En.cardDef(inst);
    const el = h('div', `card t-${d.type} r-${d.rarity} cls-${d.cls}${inst.up ? ' upg' : ''}`);
    el.dataset.uid = inst.uid;
    const imgKey = d.img ? d.img : 'card_' + d.id;
    const hasImg = SM.hasAsset('cards/' + imgKey + '.webp');
    const costTxt = d.cost === 'X' ? 'X' : d.cost === -1 ? '–' : d.cost;
    el.innerHTML = `<div class="art"><div class="ph">${TYPE_EMO[d.type]}</div>${hasImg ? `<div style="position:absolute;inset:0;background:center/cover url('${SM.asset('cards/' + imgKey + '.webp')}')"></div>` : ''}</div>
      <div class="cost">${costTxt}</div><div class="cname">${d.name}</div><div class="ctype">${TYPE_ES[d.type]}</div>
      <div class="ctext">${cardLines(d, C, opts.target).map((l) => `<p>${l}</p>`).join('')}</div><div class="frame"></div>`;
    if (opts.num) el.insertAdjacentHTML('beforeend', `<div class="cardnum">${opts.num}</div>`);
    return el;
  }
  UI.cardEl = cardEl;

  /* ---------- Tooltips ---------- */
  const tip = h('div'); tip.id = 'tooltip'; tip.classList.add('hidden');
  UI.tipEl = tip;
  function showTip(html, x, y) {
    tip.innerHTML = html; tip.classList.remove('hidden');
    const st = $('#stage'); const sr = st.getBoundingClientRect(); const sc = sr.width / 1280;
    let lx = (x - sr.left) / sc + 14, ly = (y - sr.top) / sc + 18;
    tip.style.left = '0px'; tip.style.top = '0px';
    const w = tip.offsetWidth, hh = tip.offsetHeight;
    if (lx + w > 1270) lx = 1270 - w; if (ly + hh > 710) ly = (y - sr.top) / sc - hh - 14;
    tip.style.left = Math.max(4, lx) + 'px'; tip.style.top = Math.max(4, ly) + 'px';
  }
  UI.hideTip = () => tip.classList.add('hidden');
  UI.initTips = (stage) => {
    stage.appendChild(tip);
    stage.addEventListener('mousemove', (ev) => {
      const t = ev.target.closest && ev.target.closest('[data-tip],[data-tipt]');
      if (!t) return UI.hideTip();
      let html = '';
      if (t.dataset.tipt) html = t.dataset.tipt;
      else html = `<b>${t.dataset.tip}</b>${GLOS[t.dataset.tip] || ''}`;
      // en cartas: añade el resto de palabras clave
      showTip(html, ev.clientX, ev.clientY);
    });
    stage.addEventListener('mouseleave', UI.hideTip);
  };
  // tooltip de carta completa (palabras clave que contiene)
  UI.attachCardTip = (el, inst) => {
    const d = En.cardDef(inst);
    const words = [...new Set([...(el.querySelector('.ctext').innerHTML.matchAll(/data-tip="([^"]+)"/g))].map((m) => m[1]))];
    if (!words.length) return;
    el.addEventListener('mouseenter', (ev) => { el._tw = words; });
  };

  /* ---------- Estados / intención ---------- */
  UI.statusChips = (who) => {
    const out = [];
    for (const [k, v] of Object.entries(who.status)) {
      const s = En.ST[k]; if (!s || !v) continue;
      const bad = s.neg(v);
      out.push(`<span class="st ${bad ? 'bad' : 'good'}" data-tipt="<b>${s.n}</b>${s.d(v).replace(/"/g, '&quot;')}">${s.i}${v}</span>`);
    }
    return out.join('');
  };
  UI.intentHTML = (C, e) => {
    const it = e.intent; if (!it) return '';
    const parts = [], tipParts = [];
    if (it.dmg) {
      const d = En.intentDamage(C, e), hits = it.hits || 1;
      parts.push(`<span class="ic">⚔️</span><span class="num">${d}${hits > 1 ? `<small>×${hits}</small>` : ''}</span>`);
      tipParts.push(`Atacará por ${d}${hits > 1 ? ` (${hits} veces)` : ''}.`);
    }
    if (it.block) { parts.push('<span class="ic">🛡️</span>'); tipParts.push(`Ganará ${it.block} de Bloqueo.`); }
    if (it.selfStr || it.thorns) { parts.push('<span class="ic">⬆️</span>'); tipParts.push(it.selfStr ? `Ganará ${it.selfStr} de Fuerza.` : `Ganará ${it.thorns} de Espinas.`); }
    if (it.apply) { parts.push('<span class="ic">⬇️</span>'); tipParts.push('Te aplicará: ' + Object.entries(it.apply).map(([k, v]) => `${v} ${En.ST[k].n}`).join(', ') + '.'); }
    if (it.add) { parts.push('<span class="ic">🗑️</span>'); tipParts.push(`Añadirá ${it.add.n} ${SM.CARDS[it.add.id].name} a tu mazo.`); }
    if (it.heal || it.healAll) { parts.push('<span class="ic">💚</span>'); tipParts.push('Curará.'); }
    if (it.summon) { parts.push('<span class="ic">👥</span>'); tipParts.push('Invocará aliados.'); }
    if (!parts.length) parts.push('<span class="ic">❓</span>');
    return `<div class="intent ${it.dmg ? 'atk' : ''}" data-tipt="<b>${it.name}</b>${tipParts.join(' ')}">${parts.join('')}</div>`;
  };

  /* ---------- Toast ---------- */
  let toastT = null;
  UI.toast = (msg) => {
    const t = $('#toast'); t.textContent = msg; t.classList.add('on');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 1900);
  };

  /* ---------- Modales ---------- */
  function overlay(inner, cls) {
    const o = h('div', 'overlay' + (cls ? ' ' + cls : ''));
    if (inner) o.appendChild(inner);
    $('#stage').appendChild(o);
    UI.hideTip();
    return o;
  }
  UI.overlay = overlay;
  // Elegir cartas. opts: {title, sub, cards:[inst], n, cancel:'Texto'|null, big, confirmLabel}
  UI.pickCards = (opts) => new Promise((resolve) => {
    const o = overlay();
    const n = opts.n || 1, sel = new Set();
    o.appendChild(h('h2', '', opts.title));
    if (opts.sub) o.appendChild(h('div', 'sub', opts.sub));
    const grid = h('div', opts.cards.length <= 4 ? 'row' : 'grid');
    const btnRow = h('div', 'row');
    const ok = h('button', 'btn green', opts.confirmLabel || 'Confirmar'); ok.disabled = true;
    const upd = () => { ok.disabled = sel.size !== n && !(opts.min0 && sel.size <= n); ok.textContent = (opts.confirmLabel || 'Confirmar') + (n > 1 ? ` (${sel.size}/${n})` : ''); };
    for (const inst of opts.cards) {
      const el = cardEl(inst, opts.C, { target: null });
      if (opts.big) el.classList.add('big');
      el.tabIndex = 0;
      el.addEventListener('click', () => {
        SM.sfx('select');
        if (sel.has(inst.uid)) { sel.delete(inst.uid); el.style.boxShadow = ''; el.style.outline = ''; }
        else {
          if (sel.size >= n) { if (n === 1) { grid.querySelectorAll('.card').forEach((c) => { c.style.outline = ''; }); sel.clear(); } else return; }
          sel.add(inst.uid); el.style.outline = '5px solid var(--gold)';
        }
        upd();
        if (n === 1 && sel.size === 1 && !ok.disabled && el.matches(':focus')) ok.focus();
      });
      grid.appendChild(el);
    }
    ok.addEventListener('click', async () => {
      SM.sfx('click');
      const chosen = opts.cards.filter((c) => sel.has(c.uid));
      if (opts.upgradePreview && chosen.length === 1 && !(await UI.upgradeCompare(chosen[0], opts.C))) return;
      o.remove(); resolve(chosen);
    });
    btnRow.appendChild(ok);
    if (opts.cancel) { const c = h('button', 'btn red', opts.cancel); c.addEventListener('click', () => { SM.sfx('click'); o.remove(); resolve([]); }); btnRow.appendChild(c); }
    o.appendChild(grid); o.appendChild(btnRow); upd();
    const first = grid.querySelector('.card'); if (first) first.focus({ preventScroll: true });
  });
  // Compara la carta actual con su versión mejorada. Resuelve true si el jugador acepta.
  UI.upgradeCompare = (inst, C) => new Promise((resolve) => {
    const o = overlay();
    o.appendChild(h('h2', '', '¿Mejorar esta carta?'));
    const row = h('div', 'row'); row.style.cssText = 'align-items:center;gap:36px';
    const col = (label, c) => { const w = h('div'); w.style.textAlign = 'center'; w.appendChild(h('div', 'sub', label)); const e = cardEl(c, C); e.classList.add('big'); w.appendChild(e); return w; };
    const arrow = h('div', '', '➜'); arrow.style.cssText = 'font-size:72px;color:var(--gold)';
    row.append(col('Ahora', inst), arrow, col('Mejorada', Object.assign({}, inst, { up: true })));
    const btns = h('div', 'row');
    const yes = h('button', 'btn green', 'Mejorar'), no = h('button', 'btn red', 'Cancelar');
    yes.addEventListener('click', () => { SM.sfx('click'); o.remove(); resolve(true); });
    no.addEventListener('click', () => { SM.sfx('click'); o.remove(); resolve(false); });
    btns.append(yes, no);
    o.append(row, btns); yes.focus();
  });
  UI.viewCards = (title, cards, C) => new Promise((resolve) => {
    const o = overlay();
    o.appendChild(h('h2', '', title));
    const grid = h('div', 'grid');
    cards.forEach((inst) => grid.appendChild(cardEl(inst, C)));
    if (!cards.length) grid.appendChild(h('div', 'sub', 'No hay cartas aquí.'));
    o.appendChild(grid);
    const b = h('button', 'btn', 'Cerrar'); b.addEventListener('click', () => { SM.sfx('click'); o.remove(); resolve(); });
    o.appendChild(b);
  });
  UI.confirm = (text, yes, no) => new Promise((resolve) => {
    const p = h('div', 'panel sans');
    p.style.textAlign = 'center';
    p.innerHTML = `<div style="font-size:28px;margin-bottom:20px">${text}</div>`;
    const row = h('div', 'row');
    const y = h('button', 'btn green', yes || 'Sí'), n = h('button', 'btn red', no || 'No');
    row.append(y, n); p.appendChild(row);
    const o = overlay(p);
    y.onclick = () => { SM.sfx('click'); o.remove(); resolve(true); };
    n.onclick = () => { SM.sfx('click'); o.remove(); resolve(false); };
    n.focus();
  });
  UI.message = (title, html, btn) => new Promise((resolve) => {
    const p = h('div', 'panel sans help');
    p.innerHTML = `<h3 style="margin-top:0;font-size:30px;text-align:center">${title}</h3>${html}`;
    const b = h('button', 'btn', btn || 'Entendido'); b.style.margin = '16px auto 0'; b.style.display = 'block';
    p.appendChild(b);
    const o = overlay(p);
    b.onclick = () => { SM.sfx('click'); o.remove(); resolve(); };
  });

  /* ---------- Opciones y ayuda ---------- */
  UI.options = () => new Promise((resolve) => {
    const p = h('div', 'panel sans');
    p.innerHTML = `<h3 style="margin:0 0 10px;font-size:32px;font-family:Cinzel,serif;color:var(--gold);text-align:center">Opciones</h3>
      <div class="slider"><label>Música</label><input id="o_music" type="range" min="0" max="100" value="${Math.round(SM.settings.music * 100)}"></div>
      <div class="slider"><label>Sonidos</label><input id="o_sfx" type="range" min="0" max="100" value="${Math.round(SM.settings.sfx * 100)}"></div>
      <div class="slider"><label>Jugar carta</label><div class="toggle ${SM.settings.confirm ? 'on' : ''}" id="o_conf"><div class="sw"></div><span>${SM.settings.confirm ? 'Elegir y confirmar (más seguro)' : 'Un solo clic'}</span></div></div>
      <div class="slider"><label>Animaciones</label><div class="toggle ${SM.settings.fast ? 'on' : ''}" id="o_fast"><div class="sw"></div><span>${SM.settings.fast ? 'Rápidas' : 'Normales'}</span></div></div>`;
    const row = h('div', 'row'); row.style.marginTop = '16px';
    const b = h('button', 'btn', 'Cerrar'); row.appendChild(b); p.appendChild(row);
    const o = overlay(p);
    $('#o_music', p).oninput = (e) => { SM.settings.music = e.target.value / 100; SM.applyMusicVolume(); SM.saveSettings(); };
    $('#o_sfx', p).oninput = (e) => { SM.settings.sfx = e.target.value / 100; SM.saveSettings(); };
    $('#o_sfx', p).onchange = () => SM.sfx('hit');
    $('#o_conf', p).onclick = (e) => { SM.settings.confirm = !SM.settings.confirm; const t = e.currentTarget; t.classList.toggle('on', SM.settings.confirm); t.querySelector('span').textContent = SM.settings.confirm ? 'Elegir y confirmar (más seguro)' : 'Un solo clic'; SM.saveSettings(); };
    $('#o_fast', p).onclick = (e) => { SM.settings.fast = !SM.settings.fast; const t = e.currentTarget; t.classList.toggle('on', SM.settings.fast); t.querySelector('span').textContent = SM.settings.fast ? 'Rápidas' : 'Normales'; SM.saveSettings(); };
    b.onclick = () => { SM.sfx('click'); o.remove(); resolve(); };
  });
  UI.help = () => UI.message('Cómo jugar', `
    <h3>Objetivo</h3><p>Sube la torre superando 3 zonas. Elige tu camino en el mapa, derrota enemigos y jefes, y mejora tu mazo de cartas.</p>
    <h3>Tu turno</h3><ul>
      <li>Tienes <b>⚡ energía</b> (3 por turno). Cada carta tiene un coste en la esquina.</li>
      <li><b>Haz clic en una carta</b> para elegirla y <b>otra vez</b> para jugarla. Si la carta ataca a un enemigo concreto, después haz clic en el enemigo.</li>
      <li>Encima de cada enemigo ves su <b>intención</b>: ⚔️ ataque (con el daño), 🛡️ defensa, ⬇️ te debilita, ⬆️ se fortalece.</li>
      <li>Pulsa <b>Terminar turno</b> cuando acabes. El <b>Bloqueo 🛡️</b> te protege del daño solo durante un turno.</li></ul>
    <h3>Teclado (opcional)</h3><ul><li><b>← →</b> eligen carta · <b>↑ ↓</b> cambian de enemigo · <b>Enter</b> o <b>Espacio</b> juegan · <b>E</b> termina el turno · <b>Esc</b> cancela.</li><li>También puedes pulsar los números <b>1–9</b> para elegir una carta.</li></ul>
    <h3>Mando</h3><ul><li><b>Cruceta / stick</b> mueven · <b>A</b> acepta o juega · <b>B</b> cancela · <b>X</b> termina el turno · <b>Start</b> pausa. Al atacar con varios enemigos, mueve para elegir objetivo y pulsa A.</li></ul>
    <h3>Tus personajes</h3><ul><li><b style="color:#ff8a93">Zafira</b>: Fuerza, Bloqueo y fuego. Sacrifica vida para golpear más fuerte.</li>
    <li><b style="color:#8bf0a4">Nila</b>: Veneno, Cuchillas y robar cartas. Rápida y letal.</li>
    <li><b style="color:#caa5ff">Claudia</b>: invoca a <b>Osty</b>, su mano espectral, que absorbe daño y ataca cada turno.</li></ul>
    <h3>Consejos</h3><ul><li>Pasa el ratón sobre cualquier palabra resaltada, estado o reliquia para ver qué hace.</li><li>Descansa 🔥 cuando tu vida esté baja. Las tiendas 💰 permiten eliminar cartas malas.</li><li>Si pierdes, ¡vuelve a intentarlo! Cada partida es distinta. El modo fácil da más vida y enemigos más débiles.</li></ul>`, '¡A jugar!');

  /* ---------- Barra superior ---------- */
  UI.updateTop = () => {
    const G = SM.run; const bar = $('#topbar');
    if (!G) { bar.classList.add('hidden'); return; }
    bar.classList.remove('hidden');
    const muse = { miranda: 'Zafira', staryuuki: 'Nila', karen: 'Claudia' }[G.char];
    $('#tb_who').innerHTML = `<img src="${SM.asset('ui/' + G.char + '_icon.png')}"><span>${muse}</span>`;
    $('#tb_hp').textContent = `❤️ ${G.hp}/${G.maxHp}`;
    $('#tb_gold').textContent = `💰 ${G.gold}`;
    $('#tb_act').textContent = SM.ACTS[G.act - 1].sub + ' · ' + SM.ACTS[G.act - 1].name;
    $('#tb_deck').textContent = `📚 ${G.deck.length}`;
    const rel = $('#tb_relics'); rel.innerHTML = '';
    for (const id of G.relics) { const r = SM.RELICS[id]; const e = h('div', 'relic', r.i); e.dataset.tipt = `<b>${r.n}</b>${r.d}`; rel.appendChild(e); }
    const pot = $('#tb_potions'); pot.innerHTML = '';
    G.potions.forEach((id, i) => {
      const b = h('button', 'potion' + (id ? ' full' : ''), id ? SM.POTIONS[id].i : '');
      if (id) { const p = SM.POTIONS[id]; b.style.setProperty('--pc', p.c); b.dataset.tipt = `<b>${p.n}</b>${p.d}<br><i>Haz clic para usarla en combate.</i>`; b.onclick = () => UI.onPotion && UI.onPotion(i); }
      else b.dataset.tipt = '<b>Hueco de poción</b>Aquí se guardan las pociones.';
      pot.appendChild(b);
    });
  };
})();
