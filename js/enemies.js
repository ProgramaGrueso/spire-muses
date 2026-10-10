/* Spire Muses — enemigos, jefes y encuentros.
   Intención: { dmg, hits, block, selfStr, apply:{weak,vuln,frail}, add:{id,n,to}, heal, healAll, summon:{id,n}, thorns, icon, name } */
(function () {
  const ENEMIES = {};
  const cyc = (arr) => (e) => arr[e.turn % arr.length];
  // aleatorio sin repetir el mismo movimiento 3 veces
  const rnd = (keys, w) => (e, C) => {
    let pool = keys.map((k, i) => [k, w ? w[i] : 1]);
    if (e.hist.length >= 2 && e.hist[e.hist.length - 1] === e.hist[e.hist.length - 2]) pool = pool.filter((p) => p[0] !== e.hist[e.hist.length - 1]);
    const tot = pool.reduce((a, p) => a + p[1], 0);
    let r = C.rng() * tot;
    for (const p of pool) { if ((r -= p[1]) < 0) return p[0]; }
    return pool[0][0];
  };
  function E(id, name, act, tier, hp, h, moves, ai, ap, extra) {
    ENEMIES[id] = Object.assign({ id, name, act, tier, hp, h, moves, ai, ap }, extra || {});
  }
  const BG = ', dark fantasy creature concept art, full body, single monster centered, painterly digital illustration, plain dark neutral background';

  /* ============ ACTO 1 — Los Bajos Muelles ============ */
  E('dockrat', 'Rata de Muelle', 1, 'normal', [11, 14], 130, {
    bite: { name: 'Mordisco', dmg: 6 }, gnaw: { name: 'Roer', dmg: 3, hits: 2 }, squeak: { name: 'Chillido', apply: { weak: 1 }, dmg: 3 },
  }, rnd(['bite', 'gnaw', 'squeak'], [3, 2, 1]), 'a huge mangy dock rat with glowing yellow eyes and sharp yellow teeth, wet fur, rope tangled on its tail' + BG);
  E('slime', 'Limo de Alcantarilla', 1, 'normal', [26, 30], 170, {
    spit: { name: 'Escupitajo', dmg: 7, add: { id: 'slime', n: 1, to: 'discard' } }, tackle: { name: 'Embestida', dmg: 11 }, glop: { name: 'Gelatina', block: 8, dmg: 4 },
  }, cyc(['spit', 'tackle', 'glop', 'spit']), 'a gross green sewer slime monster with a skull and rusty coins floating inside its translucent body, dripping goo' + BG);
  E('crab', 'Cangrejo Oxidado', 1, 'normal', [32, 36], 170, {
    claw: { name: 'Pinza', dmg: 8 }, shell: { name: 'Caparazón', block: 10 }, crush: { name: 'Machacar', dmg: 12, apply: { weak: 1 } },
  }, cyc(['claw', 'shell', 'crush']), 'a giant rust-covered armored crab with barnacles and an old anchor chain wrapped around its huge claw' + BG);
  E('jelly', 'Medusa de Sentina', 1, 'normal', [22, 26], 170, {
    sting: { name: 'Picadura', dmg: 6, apply: { weak: 1 } }, pulse: { name: 'Pulso Tóxico', dmg: 4, apply: { vulnerable: 1 } }, drift: { name: 'Deriva', block: 6, dmg: 5 },
  }, cyc(['sting', 'pulse', 'drift']), 'a floating sickly teal jellyfish with long stinging tentacles and a faintly glowing bell, dripping bilge water' + BG);
  E('ghostpirate', 'Pirata Ahogado', 1, 'normal', [38, 42], 210, {
    howl: { name: 'Aullido', selfStr: 2, block: 6 }, slash: { name: 'Sablazo', dmg: 11 }, volley: { name: 'Ráfaga', dmg: 4, hits: 3 },
  }, (e) => (e.turn === 0 ? 'howl' : e.turn % 2 === 1 ? 'slash' : 'volley'), 'a drowned pirate ghost in a tattered captain coat and tricorn hat, seaweed, glowing teal eyes, holding a rusty cutlass' + BG);
  E('minicrab', 'Cangrejito', 1, 'normal', [8, 10], 100, {
    nip: { name: 'Pellizco', dmg: 4 },
  }, () => 'nip', 'a small rusty crab with tiny pincers, cute but aggressive' + BG);
  E('chainwarden', 'Guardián de Cadenas', 1, 'elite', [68, 72], 280, {
    chain: { name: 'Cadenazo', dmg: 11, apply: { vulnerable: 2 } }, lash: { name: 'Látigo', dmg: 5, hits: 3 }, bulwark: { name: 'Baluarte', block: 14, selfStr: 2 },
  }, cyc(['bulwark', 'chain', 'lash', 'chain']), 'a hulking undead dock guardian in rusted plate armor wrapped in heavy iron chains with a giant hook, glowing red eyes' + BG);
  E('tentacle', 'Tentáculo Abisal', 1, 'elite', [78, 82], 290, {
    whip: { name: 'Azote', dmg: 14 }, drain: { name: 'Succión', dmg: 8, heal: 8 }, drown: { name: 'Ahogar', dmg: 7, hits: 2, apply: { weak: 1 } },
  }, cyc(['whip', 'drain', 'drown']), 'a colossal abyssal sea tentacle rising from dark water covered in suckers and barnacles with one glaring eye, ocean horror' + BG);
  E('crabking', 'Cangrejo Rey', 1, 'boss', [138, 142], 340, {
    roar: { name: 'Rugido', selfStr: 2, block: 12 }, summon: { name: 'Convocar', summon: { id: 'minicrab', n: 2 } }, pincer: { name: 'Tenaza', dmg: 16 },
    spin: { name: 'Torbellino', dmg: 6, hits: 3 }, twin: { name: 'Pinza Doble', dmg: 12, apply: { vulnerable: 2 } }, shell: { name: 'Coraza', block: 20 },
  }, cyc(['roar', 'pincer', 'summon', 'spin', 'twin', 'shell']), 'a gigantic crab king with a crown of rusted anchors and gold coins on its shell, enormous pincers, ship wreck on its back' + BG);

  /* ============ ACTO 2 — La Maleza ============ */
  E('sporecap', 'Hongo Esporífero', 2, 'normal', [30, 34], 170, {
    spores: { name: 'Esporas', apply: { weak: 2 }, dmg: 3 }, hit: { name: 'Golpe', dmg: 9 }, cloud: { name: 'Nube Tóxica', dmg: 5, apply: { vulnerable: 1 } },
  }, cyc(['spores', 'hit', 'cloud', 'hit']), 'a monstrous walking mushroom with glowing spore clouds, bioluminescent purple cap with a grinning face, forest' + BG);
  E('vinelasher', 'Zarcillo Azotador', 2, 'normal', [36, 40], 200, {
    lash: { name: 'Azotar', dmg: 5, hits: 2 }, tangle: { name: 'Enredar', dmg: 6, apply: { vulnerable: 2 } }, choke: { name: 'Estrangular', dmg: 13 },
  }, cyc(['lash', 'tangle', 'choke']), 'a carnivorous plant monster with thorny whip-like vines and a toothy flytrap head, glowing green eyes' + BG);
  E('thornbeast', 'Bestia de Espinas', 2, 'normal', [44, 48], 230, {
    bristle: { name: 'Erizarse', thorns: 3, block: 8 }, charge: { name: 'Embestida', dmg: 14 }, stomp: { name: 'Pisotón', dmg: 9, block: 5 },
  }, (e) => (e.turn === 0 ? 'bristle' : e.turn % 2 === 1 ? 'charge' : 'stomp'), 'a feral boar-like beast covered in huge sharp thorns and mossy bark armor, tusks, snarling, forest monster' + BG);
  E('mossgolem', 'Gólem de Musgo', 2, 'normal', [52, 56], 260, {
    charge: { name: 'Cargar', block: 10 }, smash: { name: 'Aplastar', dmg: 18 }, punch: { name: 'Puñetazo', dmg: 9, hits: 1, apply: { frail: 1 } },
  }, cyc(['charge', 'smash', 'punch']), 'a towering ancient stone golem covered in thick moss and vines with glowing green runes, ferns growing from its shoulders' + BG);
  E('dryad', 'Dríade Marchita', 2, 'normal', [34, 38], 230, {
    hex: { name: 'Maldición', apply: { vulnerable: 1, weak: 1 }, add: { id: 'doubt', n: 1, to: 'discard' } }, whip: { name: 'Latigazo', dmg: 11 }, mend: { name: 'Savia', healAll: 8, block: 6 },
  }, cyc(['hex', 'whip', 'mend', 'whip']), 'a withered forest dryad woman with bark skin, branches for hair and glowing sickly yellow eyes, tattered leaves dress' + BG);
  E('sprout', 'Brote', 2, 'normal', [10, 12], 120, {
    poke: { name: 'Picotazo', dmg: 5 },
  }, () => 'poke', 'a small angry walking sapling sprout with a toothy bud head and tiny root legs' + BG);
  E('treant', 'Árbol Ancestral', 2, 'elite', [100, 106], 330, {
    roots: { name: 'Raíces', block: 15, selfStr: 2 }, slam: { name: 'Golpe', dmg: 18 }, splinter: { name: 'Astillas', dmg: 7, hits: 3 }, vines: { name: 'Enredadera', dmg: 8, apply: { weak: 2, vulnerable: 2 } },
  }, cyc(['roots', 'slam', 'splinter', 'vines']), 'an enormous ancient treant with a gnarled angry face in its bark, huge branch arms, glowing orange eyes, moss and roots' + BG);
  E('stag', 'Venado Corrupto', 2, 'elite', [86, 90], 300, {
    gore: { name: 'Cornada', dmg: 15 }, gallop: { name: 'Galope', dmg: 9, hits: 2 }, bellow: { name: 'Berrido', selfStr: 3, add: { id: 'wound', n: 2, to: 'discard' } },
  }, cyc(['bellow', 'gore', 'gallop', 'gore']), 'a corrupted giant stag with rotting flesh and glowing green mold, massive twisted antlers dripping sap, skull face' + BG);
  E('rootmother', 'Madre Raíz', 2, 'boss', [168, 172], 360, {
    summon: { name: 'Brotar', summon: { id: 'sprout', n: 2 } }, crush: { name: 'Aplastar', dmg: 26 }, lash: { name: 'Azote', dmg: 8, hits: 3 },
    root: { name: 'Enraizar', apply: { vulnerable: 2, weak: 2 }, block: 20 }, harvest: { name: 'Cosecha', heal: 14, dmg: 10 },
  }, (e, C) => {
    if (e.turn === 0) return 'summon';
    const seq = ['crush', 'lash', 'root', 'harvest'];
    if (e.turn % 5 === 0 && C.enemies.filter((x) => x.hp > 0).length < 3) return 'summon';
    return seq[(e.turn - 1) % seq.length];
  }, 'a colossal horrifying root mother, a giant twisted tree body with a glowing red heart in its chest and a woman-like hollow face, writhing roots' + BG);

  /* ============ ACTO 3 — La Colmena ============ */
  E('drone', 'Zángano', 3, 'normal', [14, 18], 140, {
    sting: { name: 'Picar', dmg: 5, hits: 2 }, buzz: { name: 'Zumbido', block: 6, selfStr: 1 },
  }, rnd(['sting', 'buzz'], [3, 1]), 'a giant hive drone wasp with glowing amber compound eyes and translucent wings, chitinous armor' + BG);
  E('wasp', 'Avispa Soldado', 3, 'normal', [40, 44], 220, {
    stab: { name: 'Aguijón', dmg: 12, apply: { weak: 1 } }, rush: { name: 'Carga', dmg: 8, hits: 2 }, venom: { name: 'Aguijón Venenoso', dmg: 9, add: { id: 'wound', n: 1, to: 'discard' } },
  }, cyc(['rush', 'stab', 'venom']), 'a huge armored wasp soldier warrior standing upright wielding a spear stinger, black and amber stripes, wings spread' + BG);
  E('honeyslime', 'Limo de Miel', 3, 'normal', [42, 46], 190, {
    sticky: { name: 'Pegajoso', dmg: 7, add: { id: 'slime', n: 2, to: 'discard' } }, jet: { name: 'Chorro', dmg: 12 }, harden: { name: 'Endurecer', block: 12 },
  }, cyc(['sticky', 'jet', 'harden']), 'a monstrous blob of golden honey slime with dead bees and a honeycomb pattern inside, dripping glossy amber' + BG);
  E('nurse', 'Nodriza', 3, 'normal', [36, 40], 220, {
    feed: { name: 'Alimentar', healAll: 12, block: 6 }, sting: { name: 'Aguijón', dmg: 10 }, call: { name: 'Zumbar', summon: { id: 'drone', n: 1 } },
  }, (e, C) => {
    const alive = C.enemies.filter((x) => x.hp > 0).length;
    if (e.turn % 3 === 2 && alive < 4) return 'call';
    return e.turn % 3 === 0 ? 'sting' : 'feed';
  }, 'a bloated hive nurse insect with a pale grub-like swollen abdomen, caring and creepy, veil and amber eyes, carrying larvae' + BG);
  E('beetle', 'Escarabajo Acorazado', 3, 'normal', [55, 60], 220, {
    ram: { name: 'Embestida', dmg: 15 }, plate: { name: 'Coraza', block: 16 }, horn: { name: 'Cornada', dmg: 10, apply: { vulnerable: 2 } },
  }, cyc(['plate', 'ram', 'horn']), 'a giant armored rhinoceros beetle with a massive horn and a shiny iridescent shell, hive guardian' + BG, { startBlock: 10 });
  E('royalguard', 'Guardia Real', 3, 'elite', [110, 115], 310, {
    thrust: { name: 'Lanzazo', dmg: 16 }, guard: { name: 'Guardia', block: 18, selfStr: 2 }, sweep: { name: 'Barrido', dmg: 7, hits: 3 }, charge: { name: 'Carga Real', dmg: 22 },
  }, cyc(['guard', 'thrust', 'sweep', 'charge']), 'an elite royal guard insectoid knight in golden ornate armor with a halberd, bee-like wings folded, helm with antennae' + BG);
  E('hivemind', 'Mente Colmena', 3, 'elite', [95, 100], 290, {
    mind: { name: 'Pulso Mental', dmg: 6, apply: { weak: 2, vulnerable: 2 } }, wave: { name: 'Ola Psíquica', add: { id: 'wound', n: 2, to: 'discard' }, dmg: 4 },
    strike: { name: 'Golpe', dmg: 20 }, swarm: { name: 'Convocar', summon: { id: 'drone', n: 2 }, block: 10 },
  }, (e, C) => {
    const seq = ['mind', 'swarm', 'wave', 'strike'];
    return seq[e.turn % seq.length];
  }, 'a grotesque hive mind creature, a huge glowing brain-like honeycomb mass with many amber eyes and psychic tendrils, floating, eerie' + BG);
  E('queen', 'Reina de la Colmena', 3, 'boss', [222, 228], 380, {
    summon: { name: 'Convocar', summon: { id: 'drone', n: 2 }, block: 15 }, royal: { name: 'Aguijón Real', dmg: 18, apply: { weak: 2 } },
    rain: { name: 'Lluvia de Aguijones', dmg: 6, hits: 4 }, order: { name: 'Orden Real', selfStr: 3, block: 12 },
    jelly: { name: 'Jalea Real', heal: 20, block: 10 }, ram: { name: 'Embestida', dmg: 30 },
  }, (e, C) => {
    if (e.turn === 0) return 'summon';
    if (e.hp < e.maxHp * 0.5 && !e.enraged) { e.enraged = true; return 'order'; }
    const seq = ['royal', 'rain', 'ram', 'jelly', 'summon', 'rain'];
    return seq[(e.turn - 1) % seq.length];
  }, 'a majestic terrifying hive queen, a giant insectoid woman in golden regal armor with a crown, huge translucent wings, glowing amber eyes, regal and menacing' + BG);

  const ENCOUNTERS = {
    1: { normal: [['dockrat', 'dockrat', 'dockrat'], ['slime'], ['crab'], ['jelly', 'dockrat'], ['ghostpirate'], ['dockrat', 'jelly']], elite: [['chainwarden'], ['tentacle']], boss: [['crabking']] },
    2: { normal: [['sporecap', 'vinelasher'], ['thornbeast'], ['mossgolem'], ['dryad', 'sporecap'], ['vinelasher', 'vinelasher', 'sporecap']], elite: [['treant'], ['stag']], boss: [['rootmother']] },
    3: { normal: [['drone', 'drone', 'drone'], ['wasp', 'drone'], ['honeyslime'], ['nurse', 'wasp'], ['beetle'], ['wasp', 'wasp']], elite: [['royalguard'], ['hivemind']], boss: [['queen']] },
  };
  const ACTS = [
    { n: 1, id: 'underdocks', name: 'Los Bajos Muelles', sub: 'Acto I' },
    { n: 2, id: 'overgrowth', name: 'La Maleza', sub: 'Acto II' },
    { n: 3, id: 'hive', name: 'La Colmena', sub: 'Acto III' },
  ];
  const root = typeof window !== 'undefined' ? window : globalThis;
  root.SM = root.SM || {};
  Object.assign(root.SM, { ENEMIES, ENCOUNTERS, ACTS });
})();
