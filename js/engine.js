/* Spire Muses — motor de juego (sin DOM). */
(function () {
  const root = typeof window !== 'undefined' ? window : globalThis;
  const SM = (root.SM = root.SM || {});
  const { CARDS } = SM;

  const MT = (k, n) => { if (SM.Meta) SM.Meta.add(k, n); };
  const MX = (k, n) => { if (SM.Meta) SM.Meta.max(k, n); };
  const NMODS = (G) => (SM.nmMods ? SM.nmMods(G.nm || 0) : { hp: 1, dmg: 1, gold: 1, rest: 0.3 });

  /* ---------- Aleatorio con estado serializable ---------- */
  function rnd(G) {
    G.rs = (G.rs + 0x6d2b79f5) | 0;
    let t = G.rs;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  const rint = (G, a, b) => a + Math.floor(rnd(G) * (b - a + 1));
  const pick = (G, arr) => arr[Math.floor(rnd(G) * arr.length)];
  function shuffle(G, arr) {
    for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(rnd(G) * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
    return arr;
  }

  /* ---------- Estados (buffs/debuffs) ---------- */
  const ST = {
    strength: { n: 'Fuerza', i: '💪', d: (n) => `Tus ataques infligen ${n} de daño ${n > 0 ? 'extra' : 'menos'}.`, neg: (n) => n < 0 },
    dexterity: { n: 'Destreza', i: '🦶', d: (n) => `Tu Bloqueo aumenta en ${n}.`, neg: (n) => n < 0 },
    vulnerable: { n: 'Vulnerable', i: '💢', d: () => 'Recibe un 50% más de daño de ataques.', neg: () => true },
    weak: { n: 'Débil', i: '🥀', d: () => 'Inflige un 25% menos de daño con ataques.', neg: () => true },
    frail: { n: 'Frágil', i: '🩹', d: () => 'El Bloqueo ganado de cartas se reduce un 25%.', neg: () => true },
    poison: { n: 'Veneno', i: '☠️', d: (n) => `Al inicio de su turno pierde ${n} PV y el Veneno baja 1.`, neg: () => true },
    thorns: { n: 'Espinas', i: '🌵', d: (n) => `Quien lo ataca recibe ${n} de daño.`, neg: () => false },
    tthorns: { n: 'Espinas (turno)', i: '🔥', d: (n) => `Quien te ataca recibe ${n} de daño. Dura hasta tu próximo turno.`, neg: () => false },
    tstr: { n: 'Fuerza temporal', i: '⏳', d: (n) => `Pierdes ${n} de Fuerza al final del turno.`, neg: () => true, hide: false },
    metallicize: { n: 'Metalizar', i: '🛡️', d: (n) => `Al final de tu turno obtienes ${n} de Bloqueo.`, neg: () => false },
    demon: { n: 'Forma Demoníaca', i: '😈', d: (n) => `Al inicio de tu turno ganas ${n} de Fuerza.`, neg: () => false },
    combust: { n: 'Hierro Candente', i: '🔥', d: (n) => `Al final de tu turno pierdes 1 PV e infliges ${n} a TODOS.`, neg: () => false },
    noxious: { n: 'Nube Tóxica', i: '☣️', d: (n) => `Al inicio de tu turno aplicas ${n} de Veneno a TODOS.`, neg: () => false },
    accuracy: { n: 'Precisión', i: '🎯', d: (n) => `Las Cuchillas infligen ${n} de daño extra.`, neg: () => false },
    cuts: { n: 'Mil Cortes', i: '🗡️', d: (n) => `Cada carta que juegas inflige ${n} a TODOS los enemigos.`, neg: () => false },
    barricade: { n: 'Barricada', i: '🏰', d: () => 'Tu Bloqueo ya no se pierde al empezar tu turno.', neg: () => false },
    boneDance: { n: 'Danza Macabra', i: '🦴', d: (n) => `Al agotar una carta obtienes ${n} de Bloqueo.`, neg: () => false },
    darkEmbrace: { n: 'Abrazo Oscuro', i: '🌑', d: (n) => `Al agotar una carta robas ${n}.`, neg: () => false },
    ostyCleave: { n: 'Ejército de Sombras', i: '👻', d: () => 'Los ataques de Osty golpean a TODOS los enemigos.', neg: () => false },
    ostyRegen: { n: 'Nigromancia', i: '🔮', d: (n) => `Al inicio de tu turno Osty recupera ${n} PV.`, neg: () => false },
  };
  const DEBUFFS = ['vulnerable', 'weak', 'frail'];

  const getS = (c, k) => c.status[k] || 0;
  function addStatus(C, c, k, n) {
    if (!n) return;
    c.status[k] = (c.status[k] || 0) + n;
    if (k === 'poison' && n > 0 && c !== C.pl) MT('poison', n);
    if (c.status[k] === 0 || (c.status[k] < 0 && !['strength', 'dexterity'].includes(k))) delete c.status[k];
    if (c === C.pl && C.phase === 'enemy' && DEBUFFS.includes(k)) (c._fresh = c._fresh || {})[k] = true;
    C.fx('status', { who: c, k, n });
  }

  /* ---------- Cartas ---------- */
  function makeCard(G, id, up) { return { uid: ++G.uid, id, up: !!up }; }
  const defCache = new Map();
  function cardDef(inst) {
    const key = inst.id + (inst.up ? '+' : '');
    let d = defCache.get(key);
    if (d) return d;
    const b = CARDS[inst.id];
    d = Object.assign({}, b, { fx: Object.assign({}, b.fx), flags: Object.assign({}, b.flags) });
    if (inst.up && b.up) {
      if (b.up.cost !== undefined) d.cost = b.up.cost;
      if (b.up.fx) d.fx = Object.assign(d.fx, b.up.fx);
      if (b.up.flags) d.flags = Object.assign(d.flags, b.up.flags);
      d.name = b.name + '+';
    }
    defCache.set(key, d);
    return d;
  }
  const canUpgrade = (inst) => !inst.up && CARDS[inst.id].up && Object.keys(CARDS[inst.id].up).length > 0 && !['status', 'curse'].includes(CARDS[inst.id].type);
  function needsTarget(d) {
    const f = d.fx;
    if (f.all) return false;
    return !!(f.dmg || f.dmgBlock || f.ostyHit || f.vuln || f.weak || f.poison || f.poisonMul);
  }

  /* ---------- Cálculo de daño y bloqueo ---------- */
  function calcDamage(base, src, dst, extraStr) {
    let d = base + getS({ status: src }, 'strength') * (extraStr || 1);
    if (src.weak) d = Math.floor(d * 0.75);
    if (dst && dst.vulnerable) d = Math.floor(d * 1.5);
    return Math.max(0, d);
  }
  function calcBlock(C, base) {
    let b = base + getS(C.pl, 'dexterity');
    if (getS(C.pl, 'frail')) b = Math.floor(b * 0.75);
    return Math.max(0, b);
  }
  // vista previa para el texto de las cartas
  function previewDmg(C, d, target) {
    const f = d.fx;
    let base = f.dmgBlock ? C.pl.block : f.dmg || 0;
    if (d.id === 's_shiv') base += getS(C.pl, 'accuracy');
    if (f.poisonDbl && target && getS(target, 'poison')) base *= 2;
    return calcDamage(base, C.pl.status, target ? target.status : null, f.strMul);
  }

  /* ---------- Reliquias (se rellenan en relics.js) ---------- */
  function relicHook(C, name, a) {
    for (const id of C.G.relics) {
      const r = SM.RELICS[id];
      if (r && r[name]) r[name](C, a);
    }
  }
  const hasRelic = (G, id) => G.relics.includes(id);

  /* ---------- Nueva partida ---------- */
  const BASE = { miranda: { hp: 80 }, staryuuki: { hp: 70 }, karen: { hp: 72 } };
  const START_RELIC = { miranda: 'brasa_carmesi', staryuuki: 'anillo_cazadora', karen: 'sello_osty' };
  function newRun(char, opts) {
    opts = opts || {};
    const G = { char, seed: opts.seed || (Math.random() * 1e9) | 0, rs: 0, uid: 0, easy: !!opts.easy, hp: 0, maxHp: 0, gold: 99, deck: [], relics: [START_RELIC[char]],
      potions: [null, null, null], act: 1, floor: 0, map: null, pos: null, stats: { kills: 0, turns: 0, fights: 0 }, seenEvents: [], nm: opts.nm || 0, removed: 0 };
    G.rs = G.seed;
    G.easy = G.easy && !G.nm; G.maxHp = BASE[char].hp + (G.easy ? 25 : 0);
    G.hp = G.maxHp;
    for (const id of SM.STARTERS[char]) G.deck.push(makeCard(G, id));
    if (G.nm && NMODS(G).doubt) G.deck.push(makeCard(G, 'doubt'));
    MT('runs'); if (SM.Meta) SM.Meta.seeRelic(START_RELIC[char]);
    return G;
  }

  /* ---------- Combate ---------- */
  function spawnEnemy(C, id, slot) {
    const def = SM.ENEMIES[id], G = C.G;
    const hp = Math.round(rint(G, def.hp[0], def.hp[1]) * NMODS(G).hp);
    const e = { uid: ++G.uid, id, def, name: def.name, hp, maxHp: hp, block: def.startBlock || 0, status: {}, turn: 0, hist: [], intent: null, moveKey: null };
    return e;
  }
  function startCombat(G, ids, opts) {
    opts = opts || {};
    const C = { G, pl: { block: 0, status: {} }, enemies: [], draw: [], hand: [], discard: [], exhaust: [], energy: 0, maxEnergy: 3, turn: 0, phase: 'player',
      prompt: null, over: null, osty: null, tier: opts.tier || 'normal', playedThisTurn: 0, fx: opts.fx || (() => {}), rng: () => rnd(G) };
    for (const id of ids) C.enemies.push(spawnEnemy(C, id));
    if (G.nm) { const m = NMODS(G); for (const e of C.enemies) { const st = (e.def.tier === 'boss' ? m.bossStr : e.def.tier === 'elite' ? m.eliteStr : 0) + m.allStr; if (st) e.status.strength = st; } }
    C.draw = shuffle(G, G.deck.map((c) => Object.assign({}, c)));
    // innatas arriba
    const inn = C.draw.filter((c) => cardDef(c).flags.innate);
    C.draw = C.draw.filter((c) => !cardDef(c).flags.innate).concat(inn);
    if (G.char === 'karen') C.osty = { hp: 10, max: 10, pow: 3 };
    relicHook(C, 'onCombatStart');
    if (G.nm && NMODS(G).wound) addCards(C, 'wound', 1, 'draw');
    for (const e of C.enemies) chooseIntent(C, e);
    startTurn(C);
    return C;
  }
  const living = (C) => C.enemies.filter((e) => e.hp > 0);

  function drawCards(C, n) {
    let drawn = 0;
    for (let i = 0; i < n; i++) {
      if (C.hand.length >= 10) { C.fx('handFull'); break; }
      if (!C.draw.length) {
        if (!C.discard.length) break;
        C.draw = shuffle(C.G, C.discard.splice(0));
        C.fx('reshuffle');
      }
      C.hand.push(C.draw.pop());
      drawn++;
    }
    if (drawn) C.fx('draw', { n: drawn });
    return drawn;
  }
  function addCards(C, id, n, to, up) {
    for (let i = 0; i < n; i++) {
      const c = makeCard(C.G, id, up);
      if (to === 'hand' && C.hand.length < 10) C.hand.push(c);
      else if (to === 'draw') C.draw.splice(Math.floor(rnd(C.G) * (C.draw.length + 1)), 0, c);
      else C.discard.push(c);
    }
    C.fx('addCards', { id, n, to });
  }

  function startTurn(C) {
    C.turn++; C.phase = 'player'; C.playedThisTurn = 0; C.G.stats.turns++;
    if (!getS(C.pl, 'barricade')) C.pl.block = 0;
    delete C.pl.status.tthorns;
    C.energy = C.maxEnergy;
    const S = C.pl.status;
    if (S.demon) addStatus(C, C.pl, 'strength', S.demon);
    if (S.noxious) for (const e of living(C)) addStatus(C, e, 'poison', S.noxious);
    if (C.osty && C.turn > 1) {
      if (C.osty.hp <= 0) { C.osty.hp = 1; C.fx('ostyRevive'); }   // revive solo con 1 PV
      else ostyHeal(C, 1);                                          // y se cura 1 PV por turno
    }
    if (S.ostyRegen && C.osty && C.osty.hp > 0) ostyHeal(C, S.ostyRegen);
    relicHook(C, 'onTurnStart');
    drawCards(C, 5 + (C.extraDraw || 0));
    if (C.turn === 1 && C.firstTurnDraw) drawCards(C, C.firstTurnDraw);
    C.fx('turnStart');
  }

  function loseHp(C, n) {
    const G = C.G;
    G.hp -= n; C.hpLost = (C.hpLost || 0) + n; C.fx('playerHit', { amt: n, blocked: 0, direct: true });
    if (G.hp <= 0) { G.hp = 0; C.over = 'lose'; }
  }
  // Un Osty caído solo se cura si la carta lo revive explícitamente; si no, vuelve solo al inicio del turno.
  function ostyHeal(C, n, revive) {
    const o = C.osty; if (!o) return;
    if (o.hp <= 0 && !revive) { C.fx('ostyDown'); return; }
    const before = o.hp; o.hp = Math.min(o.max, Math.max(o.hp, 0) + n);
    C.fx('ostyHeal', { n: o.hp - before });
  }
  // daño al jugador: bloqueo -> Osty -> PV
  function dealToPlayer(C, amt, src, noThorns) {
    let blocked = Math.min(C.pl.block, amt);
    C.pl.block -= blocked; amt -= blocked;
    let ostyAbs = 0;
    if (amt > 0 && C.osty && C.osty.hp > 0) {
      ostyAbs = Math.min(C.osty.hp, amt); C.osty.hp -= ostyAbs; amt -= ostyAbs;
      C.fx('ostyHit', { amt: ostyAbs, dead: C.osty.hp <= 0 });
    }
    if (amt > 0) { C.G.hp -= amt; C.hpLost = (C.hpLost || 0) + amt; if (C.G.hp <= 0) { C.G.hp = 0; C.over = 'lose'; } }
    if (blocked > 0) MT('block', blocked);
    C.fx('playerHit', { amt, blocked, ostyAbs, src });
    if (!noThorns && src && src.hp > 0) {
      const th = getS(C.pl, 'thorns') + getS(C.pl, 'tthorns');
      if (th) dealToEnemy(C, src, th, { thorns: true });
    }
    return amt;
  }
  function dealToEnemy(C, e, amt, o) {
    o = o || {};
    if (e.hp <= 0) return 0;
    const blocked = Math.min(e.block, amt);
    if (!o.thorns && !o.poison && !o.osty && !o.noReflect) MX('maxHit', amt);
    e.block -= blocked; amt -= blocked;
    e.hp -= amt;
    C.fx('enemyHit', { e, amt, blocked, osty: !!o.osty, thorns: !!o.thorns });
    if (!o.thorns && !o.osty && amt + blocked > 0 && getS(e, 'thorns') && !o.noReflect) {
      const t = getS(e, 'thorns');
      C.G.hp -= t; C.fx('playerHit', { amt: t, blocked: 0, direct: true });
      if (C.G.hp <= 0) { C.G.hp = 0; C.over = 'lose'; }
    }
    if (e.hp <= 0) killEnemy(C, e, o);
    return amt;
  }
  function killEnemy(C, e, o) {
    e.hp = 0; C.G.stats.kills++; MT('kills'); if (e.def.tier === 'elite') { MT('elites'); if (!(C.hpLost > 0)) MT('flawlessElite'); } if (e.def.tier === 'boss') MT('boss_' + e.id);
    C.fx('enemyDie', { e });
    if (e.def.tier === 'boss') for (const x of C.enemies) if (x.hp > 0 && x !== e) { x.hp = 0; C.fx('enemyDie', { e: x }); }
    if (o && o.fatal) o.fatal(e);
    if (!living(C).length && !C.over) C.over = 'win';
  }

  function chooseIntent(C, e) {
    const key = e.def.ai(e, C);
    e.moveKey = key; e.hist.push(key);
    e.intent = Object.assign({}, e.def.moves[key]);
  }
  function intentDamage(C, e) {
    const it = e.intent; if (!it || !it.dmg) return 0;
    let d = calcDamage(it.dmg, e.status, C.pl.status);
    if (C.G.easy) d = Math.max(1, Math.floor(d * 0.8));
    else if (C.G.nm) d = Math.max(1, Math.round(d * NMODS(C.G).dmg));
    return d;
  }

  function runEnemyTurn(C, e) {
    if (e.hp <= 0 || C.over) return;
    e.block = 0;
    const p = getS(e, 'poison');
    if (p) {
      e.hp -= p; C.fx('enemyHit', { e, amt: p, blocked: 0, poison: true });
      addStatus(C, e, 'poison', -1);
      if (e.hp <= 0) { killEnemy(C, e); return; }
    }
    const it = e.intent;
    C.fx('enemyAct', { e, it });
    if (it.block) { e.block += it.block; C.fx('enemyBlock', { e, n: it.block }); }
    if (it.selfStr) addStatus(C, e, 'strength', it.selfStr);
    if (it.thorns) addStatus(C, e, 'thorns', it.thorns);
    if (it.heal) { e.hp = Math.min(e.maxHp, e.hp + it.heal); C.fx('enemyHeal', { e, n: it.heal }); }
    if (it.healAll) for (const x of living(C)) { x.hp = Math.min(x.maxHp, x.hp + it.healAll); C.fx('enemyHeal', { e: x, n: it.healAll }); }
    if (it.summon) {
      for (let i = 0; i < it.summon.n && C.enemies.filter((x) => x.hp > 0).length < 5; i++) {
        const ne = spawnEnemy(C, it.summon.id); chooseIntent(C, ne); ne.fresh = true; C.enemies.push(ne); C.fx('enemySpawn', { e: ne });
      }
    }
    if (it.dmg) {
      const hits = it.hits || 1;
      for (let h = 0; h < hits && !C.over && e.hp > 0; h++) dealToPlayer(C, intentDamage(C, e), e);
    }
    if (it.apply && !C.over) for (const [k, n] of Object.entries(it.apply)) addStatus(C, C.pl, k, n);
    if (it.add && !C.over) addCards(C, it.add.id, it.add.n, it.add.to);
    e.turn++;
  }
  // tras actuar todos los enemigos
  function endRound(C) {
    for (const e of C.enemies) {
      if (e.hp <= 0) continue;
      for (const k of DEBUFFS) if (e.status[k]) { e.status[k]--; if (e.status[k] <= 0) delete e.status[k]; }
      if (!e.fresh) chooseIntent(C, e); else { e.fresh = false; }
    }
    const pl = C.pl;
    for (const k of DEBUFFS) {
      if (pl.status[k] && !(pl._fresh && pl._fresh[k])) { pl.status[k]--; if (pl.status[k] <= 0) delete pl.status[k]; }
    }
    pl._fresh = {};
  }
  // El motor decide la próxima intención al ejecutar (turno ya contado). Reajuste: las que acaban de actuar eligen aquí.

  /* ---------- Jugar cartas ---------- */
  function cardCost(C, inst) {
    const d = cardDef(inst);
    if (d.cost === 'X') return C.energy;
    return d.cost;
  }
  function canPlay(C, inst) {
    if (C.over || C.phase !== 'player' || C.prompt) return { ok: false, why: 'No puedes jugar ahora.' };
    const d = cardDef(inst);
    if (d.flags.unplayable || d.cost === -1) return { ok: false, why: 'Esta carta no se puede jugar.' };
    if (d.cost !== 'X' && d.cost > C.energy) return { ok: false, why: 'No tienes suficiente energía.' };
    return { ok: true };
  }
  function playCard(C, uid, target) {
    const idx = C.hand.findIndex((c) => c.uid === uid);
    if (idx < 0) return false;
    const inst = C.hand[idx], d = cardDef(inst);
    if (!canPlay(C, inst).ok) return false;
    if (needsTarget(d) && (!target || target.hp <= 0)) {
      const l = living(C);
      if (l.length === 1) target = l[0]; else return false;
    }
    let X = 0;
    if (d.cost === 'X') { X = C.energy; C.energy = 0; } else C.energy -= d.cost;
    C.hand.splice(idx, 1);
    C.playedThisTurn++; MT('cards');
    C.fx('play', { card: inst, d, target });
    relicHook(C, 'onCardPlayed', { inst, d });
    runFx(C, d, target, X);
    const cuts = getS(C.pl, 'cuts');
    if (cuts) for (const e of living(C)) dealToEnemy(C, e, cuts, { noReflect: true });
    if (d.type === 'power') { /* se consume */ }
    else if (d.flags.exhaust) exhaustCard(C, inst, true);
    else C.discard.push(inst);
    if (!living(C).length && !C.over) C.over = 'win';
    return true;
  }
  function exhaustCard(C, inst, played) {
    C.exhaust.push(inst);
    C.fx('exhaust', { card: inst });
    const S = C.pl.status;
    if (S.boneDance) { C.pl.block += calcBlock(C, S.boneDance); C.fx('block', { n: S.boneDance }); }
    if (S.darkEmbrace) drawCards(C, S.darkEmbrace);
  }
  function runFx(C, d, target, X) {
    const f = d.fx, pl = C.pl;
    const tgts = f.all ? living(C) : target ? [target] : [];
    if (f.selfdmg) loseHp(C, f.selfdmg);
    if (f.energy) C.energy += f.energy;
    if (f.str) addStatus(C, pl, 'strength', f.str);
    if (f.dex) addStatus(C, pl, 'dexterity', f.dex);
    if (f.tstr) { addStatus(C, pl, 'strength', f.tstr); addStatus(C, pl, 'tstr', f.tstr); }
    if (f.doubleStr && getS(pl, 'strength') > 0) addStatus(C, pl, 'strength', getS(pl, 'strength'));
    if (f.doubleBlock) { const b = pl.block; pl.block += b; C.fx('block', { n: b }); }
    if (f.block) { const b = calcBlock(C, f.block); pl.block += b; C.fx('block', { n: b }); }
    if (f.pw) for (const [k, v] of Object.entries(f.pw)) addStatus(C, pl, k, v);
    if (f.summon && C.osty) { C.osty.max += f.summon; if (C.osty.hp > 0) { C.osty.hp += f.summon; C.fx('ostyHeal', { n: f.summon }); } }
    if (f.ostyPow && C.osty) { C.osty.pow += f.ostyPow; C.fx('ostyPow'); }
    if (f.ostyHeal && C.osty) ostyHeal(C, f.ostyHeal, f.revive);
    if (f.dmg || f.dmgBlock) {
      const hits = f.x ? X : f.hits || 1;
      let healed = 0, killedHp = false;
      for (let h = 0; h < hits; h++) {
        for (const t of tgts) {
          if (t.hp <= 0) continue;
          let base = f.dmgBlock ? pl.block : f.dmg;
          if (d.id === 's_shiv') base += getS(pl, 'accuracy');
          if (f.poisonDbl && getS(t, 'poison')) base *= 2;
          const amt = calcDamage(base, pl.status, t.status, f.strMul);
          const o = {};
          if (f.fatalMax) o.fatal = () => { C.G.maxHp += f.fatalMax; C.G.hp += f.fatalMax; C.fx('maxhp', { n: f.fatalMax }); };
          const loss = dealToEnemy(C, t, amt, o);
          if (f.lifesteal) healed += loss;
        }
      }
      if (healed) { C.G.hp = Math.min(C.G.maxHp, C.G.hp + healed); C.fx('heal', { n: healed }); }
    }
    if (f.ostyHit && C.osty) {
      if (C.osty.hp <= 0) C.fx('ostyDown');
      else {
        const cleave = getS(pl, 'ostyCleave') || f.all;
        const hits = f.hits || 1;
        for (let h = 0; h < hits; h++) {
          const ts = cleave ? living(C) : target && target.hp > 0 ? [target] : [];
          for (const t of ts) dealToEnemy(C, t, calcDamage(f.ostyHit + C.osty.pow, {}, t.status), { osty: true });
        }
        C.fx('ostyAttack'); MT('ostyHits');
      }
    }
    if (f.vuln) for (const t of tgts) if (t.hp > 0) addStatus(C, t, 'vulnerable', f.vuln);
    if (f.weak) for (const t of tgts) if (t.hp > 0) addStatus(C, t, 'weak', f.weak);
    if (f.poison) for (const t of tgts) if (t.hp > 0) addStatus(C, t, 'poison', f.poison);
    if (f.poisonMul && target && target.hp > 0 && getS(target, 'poison')) addStatus(C, target, 'poison', getS(target, 'poison') * (f.poisonMul - 1));
    if (f.heal) { C.G.hp = Math.min(C.G.maxHp, C.G.hp + f.heal); C.fx('heal', { n: f.heal }); }
    if (f.draw) drawCards(C, f.draw);
    if (f.add) addCards(C, f.add.id, f.add.n, f.add.to);
    if (f.stormOfSteel) {
      const n = C.hand.length;
      while (C.hand.length) C.discard.push(C.hand.pop());
      addCards(C, 's_shiv', n, 'hand');
    }
    if (f.discard && C.hand.length) askPrompt(C, 'discard', f.discard);
    if (f.exhaustPick && C.hand.length) askPrompt(C, 'exhaust', f.exhaustPick);
  }
  function askPrompt(C, kind, n) {
    n = Math.min(n, C.hand.length);
    if (n >= C.hand.length) { resolvePrompt(C, C.hand.map((c) => c.uid), { kind, n }); return; }
    C.prompt = { kind, n };
  }
  function resolvePrompt(C, uids, p) {
    p = p || C.prompt; if (!p) return;
    C.prompt = null;
    for (const uid of uids.slice(0, p.n)) {
      const i = C.hand.findIndex((c) => c.uid === uid);
      if (i < 0) continue;
      const [c] = C.hand.splice(i, 1);
      if (p.kind === 'discard') { C.discard.push(c); C.fx('discard', { card: c }); }
      else exhaustCard(C, c);
    }
  }

  /* ---------- Fin de turno del jugador ---------- */
  function endPlayerTurn(C) {
    if (C.over || C.phase !== 'player' || C.prompt) return;
    C.phase = 'enemy';
    const S = C.pl.status;
    for (const c of C.hand.slice()) {
      const d = cardDef(c);
      if (d.endHand) {
        if (d.endHand.selfdmg) { dealToPlayer(C, d.endHand.selfdmg, null, true); }
        if (d.endHand.weakSelf) addStatus(C, C.pl, 'weak', d.endHand.weakSelf);
      }
    }
    if (C.over) return;
    relicHook(C, 'onTurnEnd');
    if (S.metallicize) { C.pl.block += S.metallicize; C.fx('block', { n: S.metallicize }); }
    if (S.combust) {
      loseHp(C, 1);
      if (!C.over) for (const e of living(C)) dealToEnemy(C, e, S.combust, { noReflect: true });
    }
    if (C.osty && C.osty.hp > 0 && C.osty.pow > 0 && living(C).length && !C.over) {
      const ts = S.ostyCleave ? living(C) : [pick(C.G, living(C))];
      for (const t of ts) dealToEnemy(C, t, calcDamage(C.osty.pow, {}, t.status), { osty: true });
      C.fx('ostyAttack'); MT('ostyHits');
    }
    // descartar mano
    for (const c of C.hand.splice(0)) {
      const d = cardDef(c);
      if (d.flags.ethereal) exhaustCard(C, c); else C.discard.push(c);
    }
    if (S.tstr) { addStatus(C, C.pl, 'strength', -S.tstr); delete S.tstr; }
    if (!living(C).length && !C.over) C.over = 'win';
  }
  // Ejecuta toda la fase enemiga de golpe (para pruebas / modo sin animación)
  function enemyPhaseInstant(C) {
    for (const e of C.enemies.slice()) runEnemyTurn(C, e);
    if (C.over) return;
    endRound(C);
    startTurn(C);
  }

  /* ---------- Pociones ---------- */
  function usePotion(C, slot, target) {
    const id = C.G.potions[slot]; if (!id || C.over || C.phase !== 'player') return false;
    const p = SM.POTIONS[id];
    if (p.target && (!target || target.hp <= 0)) { const l = living(C); if (l.length === 1) target = l[0]; else return false; }
    C.G.potions[slot] = null; MT('potions');
    p.use(C, target);
    C.fx('potion', { id });
    if (!living(C).length && !C.over) C.over = 'win';
    return true;
  }

  /* ---------- Recompensas ---------- */
  function rewardCards(G, n, bonusRare) {
    const pool = SM.POOL[G.char];
    const out = [];
    for (let i = 0; i < n; i++) {
      let r = rnd(G), rar = r < 0.6 - (bonusRare || 0) ? 'common' : r < 0.97 - (bonusRare || 0) / 2 ? 'uncommon' : 'rare';
      let cands = pool.filter((id) => CARDS[id].rarity === rar && !out.includes(id));
      if (!cands.length) cands = pool.filter((id) => !out.includes(id));
      out.push(pick(G, cands));
    }
    return out;
  }
  function combatReward(G, tier) {
    const gold = tier === 'boss' ? rint(G, 90, 110) : tier === 'elite' ? rint(G, 30, 45) : rint(G, 12, 22);
    const rew = { gold: Math.round(gold * (hasRelic(G, 'idolo_dorado') ? 1.25 : 1) * NMODS(G).gold), cards: rewardCards(G, 3, tier === 'elite' ? 0.2 : 0), relic: null, potion: null, bossRelics: null };
    if (tier === 'elite') rew.relic = randomRelic(G);
    if (tier === 'boss') rew.bossRelics = bossRelics(G);
    if (rnd(G) < (tier === 'normal' ? 0.4 : 0.6) && G.potions.includes(null)) rew.potion = pick(G, Object.keys(SM.POTIONS));
    return rew;
  }
  function randomRelic(G) {
    const c = Object.keys(SM.RELICS).filter((id) => SM.RELICS[id].rarity === 'common' && !G.relics.includes(id));
    return c.length ? pick(G, c) : null;
  }
  function bossRelics(G) {
    const c = Object.keys(SM.RELICS).filter((id) => SM.RELICS[id].rarity === 'boss' && !G.relics.includes(id));
    return shuffle(G, c).slice(0, 3);
  }
  function gainGold(G, n) { G.gold += n; if (n > 0) MT('gold', n); }
  function addRelic(G, id) {
    G.relics.push(id); if (SM.Meta) SM.Meta.seeRelic(id);
    const r = SM.RELICS[id];
    if (r.onPickup) r.onPickup(G);
  }

  Object.assign(SM, { Engine: {
    rnd, rint, pick, shuffle, ST, getS, addStatus, makeCard, cardDef, canUpgrade, needsTarget, calcDamage, calcBlock, previewDmg, newRun, startCombat, living, drawCards,
    addCards, startTurn, dealToPlayer, dealToEnemy, runEnemyTurn, endRound, intentDamage, cardCost, canPlay, playCard, resolvePrompt, endPlayerTurn, enemyPhaseInstant,
    usePotion, rewardCards, combatReward, randomRelic, bossRelics, addRelic, hasRelic, ostyHeal, loseHp, gainGold, NMODS,
  } });
})();
