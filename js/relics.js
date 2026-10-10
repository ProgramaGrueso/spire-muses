/* Spire Muses — reliquias y pociones. */
(function () {
  const root = typeof window !== 'undefined' ? window : globalThis;
  const SM = (root.SM = root.SM || {});
  const E = () => SM.Engine;

  const RELICS = {
    brasa_carmesi: { n: 'Brasa Carmesí', i: '🔥', rarity: 'start', d: 'Al terminar un combate, recuperas 6 PV.', onCombatEnd(G) { G.hp = Math.min(G.maxHp, G.hp + 6); } },
    anillo_cazadora: { n: 'Anillo de la Cazadora', i: '💍', rarity: 'start', d: 'Robas 2 cartas extra en el primer turno de cada combate.', onCombatStart(C) { C.firstTurnDraw = (C.firstTurnDraw || 0) + 2; } },
    sello_osty: { n: 'Sello de Osty', i: '🖐️', rarity: 'start', d: 'Osty empieza cada combate con +6 PV máx. y +1 de Poder.', onCombatStart(C) { if (C.osty) { C.osty.max += 6; C.osty.hp += 6; C.osty.pow += 1; } } },

    ancla: { n: 'Ancla Oxidada', i: '⚓', rarity: 'common', d: 'Empiezas cada combate con 10 de Bloqueo.', onCombatStart(C) { C.pl.block += 10; } },
    linterna: { n: 'Linterna de Sentina', i: '🏮', rarity: 'common', d: 'Obtén 1 de Energía extra en el primer turno.', onTurnStart(C) { if (C.turn === 1) C.energy += 1; } },
    vajra: { n: 'Hoja de Vajra', i: '🗡️', rarity: 'common', d: 'Empiezas cada combate con 1 de Fuerza.', onCombatStart(C) { E().addStatus(C, C.pl, 'strength', 1); } },
    canicas: { n: 'Bolsa de Canicas', i: '🔮', rarity: 'common', d: 'Al inicio del combate aplicas 1 Vulnerable a todos los enemigos.', onCombatStart(C) { for (const e of C.enemies) E().addStatus(C, e, 'vulnerable', 1); } },
    piedra: { n: 'Piedra Lisa', i: '🪨', rarity: 'common', d: 'Empiezas cada combate con 1 de Destreza.', onCombatStart(C) { E().addStatus(C, C.pl, 'dexterity', 1); } },
    orichalcum: { n: 'Oricalco', i: '🔶', rarity: 'common', d: 'Si no tienes Bloqueo al final de tu turno, obtienes 6.', onTurnEnd(C) { if (C.pl.block === 0) C.pl.block += 6; } },
    escamas: { n: 'Escamas de Bronce', i: '🐟', rarity: 'common', d: 'Empiezas cada combate con 3 de Espinas.', onCombatStart(C) { E().addStatus(C, C.pl, 'thorns', 3); } },
    fresa: { n: 'Fresa Dorada', i: '🍓', rarity: 'common', d: 'Aumenta tus PV máx. en 7.', onPickup(G) { G.maxHp += 7; G.hp += 7; } },
    flor: { n: 'Flor Feliz', i: '🌼', rarity: 'common', d: 'Cada 3 turnos obtienes 1 de Energía.', onTurnStart(C) { if (C.turn % 3 === 0) C.energy += 1; } },
    idolo_dorado: { n: 'Ídolo Dorado', i: '🗿', rarity: 'common', d: 'Ganas un 25% más de oro tras los combates.' },
    tarjeta: { n: 'Tarjeta de Socio', i: '💳', rarity: 'common', d: 'Los precios de la tienda se reducen a la mitad.' },
    cuerno: { n: 'Cuerno de Caza', i: '📯', rarity: 'common', d: 'Empiezas cada combate con 1 carta extra en la mano (primer turno).', onCombatStart(C) { C.firstTurnDraw = (C.firstTurnDraw || 0) + 1; } },
    vela: { n: 'Vela Eterna', i: '🕯️', rarity: 'common', d: 'Al inicio de cada turno obtienes 1 de Bloqueo.', onTurnStart(C) { C.pl.block += 1; } },

    nucleo: { n: 'Núcleo de Energía', i: '⚡', rarity: 'boss', d: '+1 de Energía por turno. Empiezas cada combate con 1 Herida en tu mazo.',
      onPickup() {}, onCombatStart(C) { C.maxEnergy += 1; E().addCards(C, 'wound', 1, 'draw'); } },
    ojo: { n: 'Ojo del Abismo', i: '👁️', rarity: 'boss', d: 'Robas 1 carta extra por turno. Empiezas cada combate con 1 Duda en tu mazo.',
      onCombatStart(C) { C.extraDraw = (C.extraDraw || 0) + 1; E().addCards(C, 'doubt', 1, 'draw'); } },
    pozo: { n: 'Pozo de Vida', i: '💖', rarity: 'boss', d: 'Aumenta tus PV máx. en 25 y te curas por completo.', onPickup(G) { G.maxHp += 25; G.hp = G.maxHp; } },
  };

  const POTIONS = {
    fuego: { n: 'Frasco de Fuego', i: '🧪', c: '#ff7a3d', d: 'Inflige 20 de daño a un enemigo.', target: true, use(C, t) { E().dealToEnemy(C, t, 20, { noReflect: true }); } },
    escudo: { n: 'Poción de Escudo', i: '🛡️', c: '#6fb4ff', d: 'Obtén 12 de Bloqueo.', use(C) { C.pl.block += 12; C.fx('block', { n: 12 }); } },
    fuerza: { n: 'Elixir de Fuerza', i: '💪', c: '#ff5555', d: 'Obtén 2 de Fuerza.', use(C) { E().addStatus(C, C.pl, 'strength', 2); } },
    energia: { n: 'Poción de Energía', i: '⚡', c: '#ffe14d', d: 'Obtén 2 de Energía.', use(C) { C.energy += 2; } },
    curacion: { n: 'Poción de Curación', i: '❤️', c: '#ff6fa0', d: 'Recuperas el 25% de tus PV máx.', use(C) { const n = Math.ceil(C.G.maxHp * 0.25); C.G.hp = Math.min(C.G.maxHp, C.G.hp + n); C.fx('heal', { n }); } },
    veneno: { n: 'Frasco de Veneno', i: '☠️', c: '#7ed957', d: 'Aplica 8 de Veneno a un enemigo.', target: true, use(C, t) { E().addStatus(C, t, 'poison', 8); } },
    niebla: { n: 'Niebla Debilitante', i: '🌫️', c: '#b9a3ff', d: 'Aplica 3 Débil y 3 Vulnerable a un enemigo.', target: true, use(C, t) { E().addStatus(C, t, 'weak', 3); E().addStatus(C, t, 'vulnerable', 3); } },
    rapidez: { n: 'Poción de Rapidez', i: '💨', c: '#7fe3ff', d: 'Robas 3 cartas.', use(C) { E().drawCards(C, 3); } },
  };
  Object.assign(SM, { RELICS, POTIONS });
})();
