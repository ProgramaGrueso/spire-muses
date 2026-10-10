/* Spire Muses — mapa, eventos y tienda (lógica de la partida, sin DOM). */
(function () {
  const SM = window.SM;
  const En = SM.Engine;

  /* ---------- Mapa ---------- */
  const ROWS = 6, COLS = 4;
  function genMap(G) {
    const rows = [];
    for (let r = 0; r < ROWS; r++) {
      const n = En.rint(G, 2, 4);
      const cols = En.shuffle(G, [0, 1, 2, 3]).slice(0, n).sort((a, b) => a - b);
      rows.push(cols.map((c) => ({ r, c, type: 'combat', next: [], visited: false })));
    }
    const boss = { r: ROWS, c: 1.5, type: 'boss', next: [], visited: false };
    // conexiones
    for (let r = 0; r < ROWS - 1; r++) {
      const A = rows[r], B = rows[r + 1];
      for (const a of A) {
        const near = B.filter((b) => Math.abs(b.c - a.c) <= 1);
        const cand = near.length ? near : [B.reduce((x, y) => (Math.abs(y.c - a.c) < Math.abs(x.c - a.c) ? y : x))];
        const k = Math.min(cand.length, En.rnd(G) < 0.4 ? 2 : 1);
        for (const b of En.shuffle(G, cand.slice()).slice(0, k)) if (!a.next.includes(b)) a.next.push(b);
      }
      for (const b of B) {
        if (!A.some((a) => a.next.includes(b))) {
          const a = A.reduce((x, y) => (Math.abs(y.c - b.c) < Math.abs(x.c - b.c) ? y : x));
          a.next.push(b);
        }
      }
    }
    for (const a of rows[ROWS - 1]) a.next.push(boss);
    // tipos
    const W = (r, table) => { let t = En.rnd(G) * table.reduce((s, x) => s + x[1], 0); for (const [k, w] of table) if ((t -= w) < 0) return k; return table[0][0]; };
    rows.forEach((row, r) => row.forEach((nd) => {
      if (r === 0) nd.type = 'combat';
      else if (r === 1) nd.type = W(r, [['combat', 6], ['event', 3], ['shop', 1]]);
      else if (r === 2) nd.type = W(r, [['combat', 5], ['event', 3], ['shop', 2], ['elite', 2]]);
      else if (r === 3) nd.type = W(r, [['combat', 4], ['event', 3], ['elite', 3], ['rest', 2]]);
      else if (r === 4) nd.type = W(r, [['combat', 4], ['elite', 3], ['event', 2], ['shop', 2], ['rest', 2]]);
      else nd.type = 'rest';
    }));
    const flat = rows.flat();
    const ensure = (type, rr) => {
      if (flat.some((n) => n.type === type)) return;
      const cand = flat.filter((n) => rr.includes(n.r) && n.type === 'combat');
      if (cand.length) En.pick(G, cand).type = type;
    };
    ensure('shop', [2, 3]); ensure('elite', [3, 4]); ensure('event', [1, 2]);
    return { rows, boss };
  }
  function nextNodes(G) {
    const m = G.map;
    if (!G.pos) return m.rows[0];
    return G.pos.next;
  }

  /* ---------- Encuentros ---------- */
  function encounterFor(G, tier) {
    const t = SM.ENCOUNTERS[G.act][tier];
    return En.pick(G, t);
  }

  /* ---------- Tienda ---------- */
  const PRICE = { common: 50, uncommon: 78, rare: 150 };
  function genShop(G) {
    const disc = En.hasRelic(G, 'tarjeta') ? 0.5 : 1;
    const price = (n) => Math.max(5, Math.round(n * disc));
    const cards = [];
    const ids = En.rewardCards(G, 5, 0.1);
    for (const id of ids) cards.push({ id, price: price(PRICE[SM.CARDS[id].rarity] * (0.9 + En.rnd(G) * 0.2)), sold: false });
    const relics = [];
    const pool = Object.keys(SM.RELICS).filter((id) => SM.RELICS[id].rarity === 'common' && !G.relics.includes(id));
    for (const id of En.shuffle(G, pool).slice(0, 2)) relics.push({ id, price: price(140 + En.rint(G, 0, 40)), sold: false });
    const potions = [];
    for (const id of En.shuffle(G, Object.keys(SM.POTIONS)).slice(0, 2)) potions.push({ id, price: price(45), sold: false });
    return { cards, relics, potions, remove: { price: price(75 + 25 * (G.removed || 0)), used: false } };
  }

  /* ---------- Eventos ---------- */
  // opción: { t: texto, hint?, run(ctx) -> texto de resultado | Promise }, ctx = { G, pickCard(title, filter, n) -> Promise<inst[]>, fight(ids, tier) }
  const EVENTS = [
    { id: 'altar', title: 'Altar Olvidado', img: '🗿', text: 'Entre la niebla hallas un altar cubierto de runas. Parece pedir algo a cambio de su poder.',
      opts: (G) => [
        { t: 'Ofrecer sangre', hint: 'Pierdes 8 PV. Obtienes una reliquia.', ok: G.hp > 10, run() { G.hp -= 8; const r = En.randomRelic(G); if (r) { En.addRelic(G, r); return `El altar brilla y te concede **${SM.RELICS[r].n}**.`; } return 'El altar guarda silencio.'; } },
        { t: 'Rezar', hint: 'Recuperas 15 PV.', run() { G.hp = Math.min(G.maxHp, G.hp + 15); return 'Una calidez suave recorre tu cuerpo.'; } },
        { t: 'Marcharte', hint: '', run() { return 'Sigues tu camino.'; } },
      ] },
    { id: 'fuente', title: 'Fuente Luminosa', img: '⛲', text: 'Una fuente de agua luminosa brota de entre las rocas. Sus aguas parecen tener propiedades extrañas.',
      opts: (G) => [
        { t: 'Beber', hint: 'Recuperas el 30% de tus PV máx.', run() { const n = Math.ceil(G.maxHp * 0.3); G.hp = Math.min(G.maxHp, G.hp + n); return `Recuperas ${n} PV.`; } },
        { t: 'Purificar una carta', hint: 'Elimina una carta de tu mazo. Pierdes 5 PV.', ok: G.hp > 6, async run(ctx) { const c = await ctx.pickCard('Elige una carta para eliminar', () => true, 1); if (!c.length) return 'Cambias de idea.'; G.deck = G.deck.filter((x) => x.uid !== c[0].uid); G.hp -= 5; return `Eliminas **${SM.CARDS[c[0].id].name}** de tu mazo.`; } },
        { t: 'Marcharte', hint: '', run() { return 'Sigues tu camino.'; } },
      ] },
    { id: 'forjador', title: 'Forjador Errante', img: '⚒️', text: 'Un herrero ambulante con su yunque portátil te ofrece sus servicios.',
      opts: (G) => [
        { t: 'Mejorar una carta', hint: 'Gratis.', ok: G.deck.some(En.canUpgrade), async run(ctx) { const c = await ctx.pickCard('Elige una carta para mejorar', En.canUpgrade, 1); if (!c.length) return 'Cambias de idea.'; c[0].up = true; return `**${SM.CARDS[c[0].id].name}** ha sido mejorada.`; } },
        { t: 'Regatear', hint: 'Ganas 45 de oro. Pierdes 6 PV.', ok: G.hp > 7, run() { G.hp -= 6; En.gainGold(G, 45); return 'El herrero te lanza unas monedas tras un forcejeo.'; } },
        { t: 'Marcharte', hint: '', run() { return 'Sigues tu camino.'; } },
      ] },
    { id: 'cofre', title: 'Cofre Maldito', img: '🧰', text: 'Un cofre ornamentado emite un susurro inquietante. El oro asoma entre sus grietas.',
      opts: (G) => [
        { t: 'Abrirlo', hint: 'Ganas 80 de oro. Añades la maldición Duda.', run() { En.gainGold(G, 80); G.deck.push(En.makeCard(G, 'doubt')); return 'Tomas el oro... y sientes un escalofrío.'; } },
        { t: 'Dejarlo', hint: '', run() { return 'Es mejor no tentar a la suerte.'; } },
      ] },
    { id: 'hongos', title: 'Hongos Brillantes', img: '🍄', text: 'Un círculo de hongos luminosos crece junto al camino. Parecen comestibles... quizá.',
      opts: (G) => [
        { t: 'Comerlos', hint: '+6 PV máx. Añades una Herida.', run() { G.maxHp += 6; G.hp += 6; G.deck.push(En.makeCard(G, 'wound')); return 'Te sientes más fuerte, pero con náuseas.'; } },
        { t: 'Recolectarlos', hint: 'Ganas 30 de oro.', run() { En.gainGold(G, 30); return 'Los vendes más adelante.'; } },
        { t: 'Marcharte', hint: '', run() { return 'Sigues tu camino.'; } },
      ] },
    { id: 'mercader', title: 'Mercader Fantasma', img: '👻', text: 'Una figura translúcida te saluda con una sonrisa vacía y abre su capa llena de curiosidades.',
      opts: (G) => [
        { t: 'Comprar reliquia (50 de oro)', hint: 'Una reliquia aleatoria.', ok: G.gold >= 50, run() { G.gold -= 50; const r = En.randomRelic(G); if (r) { En.addRelic(G, r); return `Obtienes **${SM.RELICS[r].n}**.`; } return 'No le quedan reliquias.'; } },
        { t: 'Comprar poción (20 de oro)', hint: 'Una poción aleatoria.', ok: G.gold >= 20 && G.potions.includes(null), run() { G.gold -= 20; const id = En.pick(G, Object.keys(SM.POTIONS)); G.potions[G.potions.indexOf(null)] = id; return `Obtienes **${SM.POTIONS[id].n}**.`; } },
        { t: 'Marcharte', hint: '', run() { return 'El fantasma se desvanece.'; } },
      ] },
    { id: 'duelo', title: 'Rival Misterioso', img: '⚔️', text: 'Un guerrero encapuchado bloquea el camino y desenvaina su arma: "Muéstrame de qué estás hecha".',
      opts: (G) => [
        { t: 'Aceptar el duelo', hint: 'Combate contra un élite. Recompensa mejorada.', fight: 'elite' },
        { t: 'Rechazarlo', hint: '', run() { return 'Lo rodeas con cuidado.'; } },
      ] },
  ];
  function pickEvent(G) {
    const pool = EVENTS.filter((e) => !G.seenEvents.includes(e.id));
    const ev = En.pick(G, pool.length ? pool : EVENTS);
    G.seenEvents.push(ev.id);
    if (G.seenEvents.length >= EVENTS.length) G.seenEvents = [];
    return ev;
  }

  /* ---------- Guardado ---------- */
  function saveRun(G, extra) {
    try {
      const m = G.map; const idx = (n) => (n ? (n.type === 'boss' ? 'B' : m.rows[n.r].indexOf(n)) : null);
      const snap = JSON.stringify(Object.assign({}, G, { map: { rows: m.rows.map((row) => row.map((n) => ({ r: n.r, c: n.c, type: n.type, visited: n.visited, next: n.next.map((x) => (x.type === 'boss' ? 'B' : m.rows[x.r].indexOf(x))) }))), boss: { visited: m.boss.visited } },
        pos: G.pos ? { r: G.pos.r, i: idx(G.pos) } : null, _x: extra || null }));
      SM.store.set('save', snap);
    } catch (e) {}
  }
  function loadRun() {
    try {
      const s = SM.store.get('save', null); if (!s) return null;
      const G = JSON.parse(s);
      const rows = G.map.rows.map((row) => row.map((n) => Object.assign({}, n, { next: [] })));
      const boss = { r: ROWS, c: 1.5, type: 'boss', next: [], visited: G.map.boss.visited };
      G.map.rows.forEach((row, r) => row.forEach((n, i) => { rows[r][i].next = n.next.map((x) => (x === 'B' ? boss : rows[r + 1][x])); }));
      G.map = { rows, boss };
      G.pos = G.pos ? (G.pos.i === 'B' ? boss : rows[G.pos.r][G.pos.i]) : null;
      return G;
    } catch (e) { return null; }
  }
  const clearSave = () => SM.store.set('save', null);

  SM.Game = { genMap, nextNodes, encounterFor, genShop, EVENTS, pickEvent, saveRun, loadRun, clearSave, ROWS, COLS };
})();
