/* Spire Muses — datos de cartas.
   fx: dmg, hits, all, strMul, dmgBlock, lifesteal, poisonDbl, fatalMax, block, draw, energy, vuln, weak, poison,
       str, dex, tstr, selfdmg, heal, add:{id,n,to}, discard, exhaustPick, pw:{estado:n}, doubleBlock, doubleStr,
       poisonMul, stormOfSteel, summon, ostyHit, ostyPow, ostyHeal
   flags: exhaust, innate, retain, ethereal, unplayable
   up: parche al mejorar { cost, fx:{...}, flags:{...} }                                                   */
(function () {
  const CARDS = {};
  const POOL = { miranda: [], staryuuki: [], karen: [] };
  const TRIG = { miranda: 'miranda_capurro', staryuuki: 'staryuuki', karen: 'karen_character' };

  // cls, id, nombre, tipo, rareza, coste, fx, up, flags, prompt de arte
  function def(cls, id, name, type, rarity, cost, fx, up, flags, ap, extra) {
    const c = Object.assign({ id, name, cls, type, rarity, cost, fx: fx || {}, up: up || {}, flags: flags || {}, ap: ap || '' }, extra || {});
    CARDS[id] = c;
    if (POOL[cls] && ['common', 'uncommon', 'rare'].includes(rarity)) POOL[cls].push(id);
  }
  const M = 'miranda', S = 'staryuuki', K = 'karen';
  const A = 'attack', SK = 'skill', P = 'power';

  /* ===================== ZAFIRA — La Caballera Carmesí ===================== */
  def(M, 'm_strike', 'Tajo', A, 'starter', 1, { dmg: 6 }, { fx: { dmg: 9 } }, {}, '', { img: 'strike_ironclad', tag: 'strike' });
  def(M, 'm_defend', 'Guardia', SK, 'starter', 1, { block: 5 }, { fx: { block: 8 } }, {}, '', { img: 'defend_ironclad' });
  def(M, 'm_bash', 'Golpe Carmesí', A, 'starter', 2, { dmg: 8, vuln: 2 }, { fx: { dmg: 10, vuln: 3 } }, {}, '', { img: 'bash' });
  def(M, 'm_twin', 'Tajo Doble', A, 'common', 1, { dmg: 5, hits: 2 }, { fx: { dmg: 7 } }, {}, 'armored female knight spinning with two rapid sword slashes, twin crescent slash trails, sparks');
  def(M, 'm_cleave', 'Hoja Giratoria', A, 'common', 1, { dmg: 8, all: true }, { fx: { dmg: 11 } }, {}, 'armored female knight whirling a greatsword in a wide circle slicing through a crowd of monsters, red cape flaring, motion blur');
  def(M, 'm_slam', 'Embate de Escudo', A, 'common', 1, { dmgBlock: true }, { cost: 0 }, {}, 'armored female knight charging shoulder-first with a steel shield into an enemy, shockwave, debris flying');
  def(M, 'm_flex', 'Temple', SK, 'common', 0, { tstr: 2 }, { fx: { tstr: 4 } }, {}, 'armored female knight flexing her arm gauntlet, glowing crimson aura of strength, embers around her');
  def(M, 'm_pommel', 'Cabezazo', A, 'common', 1, { dmg: 9, draw: 1 }, { fx: { dmg: 10, draw: 2 } }, {}, 'armored female knight striking with the pommel of her sword, close up, sparks and impact lines');
  def(M, 'm_clothes', 'Tajada Brutal', A, 'common', 2, { dmg: 12, weak: 2 }, { fx: { dmg: 14, weak: 3 } }, {}, 'armored female knight delivering a heavy backhand sword blow that staggers a brute, dust cloud, gloomy battlefield');
  def(M, 'm_shrug', 'Coraza Ardiente', SK, 'common', 1, { block: 8, draw: 1 }, { fx: { block: 11 } }, {}, 'armored female knight shrugging off a blow, red armor glowing with orange embers, defensive stance');
  def(M, 'm_blood', 'Sangre por Fuego', SK, 'common', 0, { selfdmg: 3, energy: 2 }, { fx: { selfdmg: 2 } }, {}, 'armored female knight pressing her palm to a cut on her arm, blood turning into fire, crimson energy swirling');
  def(M, 'm_flamebarrier', 'Cresta Ardiente', SK, 'common', 2, { block: 12, pw: { tthorns: 4 } }, { fx: { block: 16, pw: { tthorns: 6 } } }, {}, 'armored female knight surrounded by a swirling barrier of flames, shield raised, fire wall');
  def(M, 'm_heavy', 'Mandoble', A, 'common', 2, { dmg: 14, strMul: 3 }, { fx: { strMul: 5 } }, {}, 'armored female knight raising an enormous greatsword overhead with both hands, about to deliver a devastating blow, dramatic backlight');
  def(M, 'm_inflame', 'Brasa Viva', P, 'uncommon', 1, { str: 2 }, { fx: { str: 3 } }, {}, 'armored female knight with burning red aura, embers rising, eyes glowing, rage empowered');
  def(M, 'm_combust', 'Hierro Candente', P, 'uncommon', 1, { pw: { combust: 5 } }, { fx: { pw: { combust: 7 } } }, {}, 'armored female knight whose armor is glowing white-hot and radiating fire that scorches the ground around her');
  def(M, 'm_metal', 'Metalizar', P, 'uncommon', 1, { pw: { metallicize: 3 } }, { fx: { pw: { metallicize: 4 } } }, {}, 'armored female knight whose plate armor thickens and gleams with a steel sheen, reinforced layers of metal');
  def(M, 'm_whirl', 'Ira Divina', A, 'uncommon', 'X', { dmg: 5, all: true, x: true }, { fx: { dmg: 8 } }, {}, 'armored female knight in a furious whirlwind of sword slashes, spinning vortex of steel and flame, enemies thrown');
  def(M, 'm_offering', 'Ofrenda', SK, 'uncommon', 0, { selfdmg: 6, energy: 2, draw: 3 }, { fx: { draw: 5 } }, { exhaust: true }, 'armored female knight kneeling at a bloody altar offering her blood to a crimson flame, ritual circle glowing');
  def(M, 'm_uppercut', 'Gancho', A, 'uncommon', 2, { dmg: 13, weak: 1, vuln: 1 }, { fx: { weak: 2, vuln: 2 } }, {}, 'armored female knight delivering a rising uppercut slash with her sword lifting an enemy off the ground');
  def(M, 'm_entrench', 'Fortificar', SK, 'uncommon', 2, { doubleBlock: true }, { cost: 1 }, {}, 'armored female knight planting her shield into the ground, stone walls rising around her, fortress');
  def(M, 'm_carnage', 'Carnicería', A, 'uncommon', 2, { dmg: 20 }, { fx: { dmg: 28 } }, { ethereal: true }, 'armored female knight in a berserk frenzy hacking through enemies, blood spray, dark chaos, red mist');
  def(M, 'm_demon', 'Forma Demoníaca', P, 'rare', 3, { pw: { demon: 2 } }, { fx: { pw: { demon: 3 } } }, {}, 'armored female knight transforming with a demonic crimson aura, horns of fire above her head, hellish power erupting');
  def(M, 'm_barricade', 'Barricada', P, 'rare', 3, { pw: { barricade: 1 } }, { cost: 2 }, {}, 'armored female knight standing behind a towering wall of shields and stakes, unbreakable fortress defense');
  def(M, 'm_limit', 'Juicio Final', SK, 'rare', 1, { doubleStr: true }, { flags: { exhaust: false } }, { exhaust: true }, 'armored female knight screaming as red lightning erupts from her body, power pushed beyond all limits, cracked ground');
  def(M, 'm_reaper', 'Ímpetu', A, 'rare', 2, { dmg: 4, all: true, lifesteal: true }, { fx: { dmg: 5 } }, { exhaust: true }, 'armored female knight sweeping a dark scythe-like sword draining red life energy from many enemies');
  def(M, 'm_bludgeon', 'Impacto Brutal', A, 'rare', 3, { dmg: 32 }, { fx: { dmg: 42 } }, {}, 'armored female knight slamming a colossal sword down onto the ground, massive crater and blast wave, devastating strike');
  def(M, 'm_immolate', 'Inmolar', A, 'rare', 2, { dmg: 21, all: true, add: { id: 'burn', n: 1, to: 'discard' } }, { fx: { dmg: 28 } }, {}, 'armored female knight unleashing a gigantic wave of fire from her sword engulfing the battlefield, inferno');

  /* ===================== NILA — La Cazadora ===================== */
  def(S, 's_strike', 'Tajo', A, 'starter', 1, { dmg: 6 }, { fx: { dmg: 9 } }, {}, '', { img: 'strike_silent', tag: 'strike' });
  def(S, 's_defend', 'Guardia', SK, 'starter', 1, { block: 5 }, { fx: { block: 8 } }, {}, '', { img: 'defend_silent' });
  def(S, 's_neutralize', 'Neutralizar', A, 'starter', 0, { dmg: 3, weak: 1 }, { fx: { dmg: 4, weak: 2 } }, {}, '', { img: 'neutralize' });
  def(S, 's_survivor', 'Sobrevivir', SK, 'starter', 1, { block: 8, discard: 1 }, { fx: { block: 11 } }, {}, '', { img: 'survivor' });
  def(S, 's_shiv', 'Cuchilla', A, 'token', 0, { dmg: 4 }, { fx: { dmg: 6 } }, { exhaust: true }, 'a single curved throwing dagger glowing with green venom spinning through the air, dark background');
  def(S, 's_blade', 'Danza de Cuchillas', SK, 'common', 1, { add: { id: 's_shiv', n: 3, to: 'hand' } }, { fx: { add: { id: 's_shiv', n: 4, to: 'hand' } } }, {}, 'hooded huntress surrounded by a whirl of many floating daggers, graceful blade dance, green glow');
  def(S, 's_poison', 'Puñalada Venenosa', SK, 'common', 1, { poison: 5 }, { fx: { poison: 7 } }, {}, 'hooded huntress stabbing a dagger dripping glowing green poison into a monster, toxic mist');
  def(S, 's_quick', 'Tajo Veloz', A, 'common', 1, { dmg: 8, draw: 1 }, { fx: { dmg: 12 } }, {}, 'hooded huntress performing a lightning-fast slash leaving green afterimages, speed lines');
  def(S, 's_sucker', 'Golpe Bajo', A, 'common', 1, { dmg: 7, weak: 1 }, { fx: { dmg: 9, weak: 2 } }, {}, 'hooded huntress ambushing from the shadows with a low sneaky stab, mischievous grin, dark forest');
  def(S, 's_back', 'Voltereta', SK, 'common', 1, { block: 5, draw: 2 }, { fx: { block: 8 } }, {}, 'hooded huntress doing an acrobatic backflip through the air dodging an attack, cloak flowing, dynamic');
  def(S, 's_spray', 'Lluvia de Dagas', A, 'common', 1, { dmg: 4, hits: 2, all: true }, { fx: { dmg: 6 } }, {}, 'hooded huntress throwing a fan of daggers in both hands striking many enemies at once, motion trails');
  def(S, 's_dash', 'Estocada Evasiva', A, 'common', 2, { dmg: 10, block: 10 }, { fx: { dmg: 13, block: 13 } }, {}, 'hooded huntress lunging forward with a rapid thrust and sliding past the enemy, dust trail, evasive');
  def(S, 's_acro', 'Acrobacia', SK, 'common', 1, { draw: 3, discard: 1 }, { fx: { draw: 4 } }, {}, 'hooded huntress cartwheeling across rooftops under moonlight, agile acrobatics, wind');
  def(S, 's_prepare', 'Preparar', SK, 'common', 0, { draw: 1, discard: 1 }, { fx: { draw: 2, discard: 2 } }, {}, 'hooded huntress sharpening a dagger and checking her belt of knives, calm focus, lantern light');
  def(S, 's_noxious', 'Nube Tóxica', P, 'uncommon', 1, { pw: { noxious: 2 } }, { fx: { pw: { noxious: 3 } } }, {}, 'hooded huntress breathing out a cloud of glowing green toxic fumes that spreads around her, poison fog');
  def(S, 's_catalyst', 'Catalizador', SK, 'uncommon', 1, { poisonMul: 2 }, { fx: { poisonMul: 3 } }, { exhaust: true }, 'hooded huntress pouring a vial of bubbling green catalyst onto a poisoned monster causing violent reaction');
  def(S, 's_accuracy', 'Precisión', P, 'uncommon', 1, { pw: { accuracy: 4 } }, { fx: { pw: { accuracy: 6 } } }, {}, 'hooded huntress with a laser-focused aim, glowing green crosshair over her eye, daggers lined up perfectly');
  def(S, 's_eviscerate', 'Eviscerar', A, 'uncommon', 3, { dmg: 7, hits: 3 }, { fx: { dmg: 9 } }, {}, 'hooded huntress vanishing in a flurry of triple slashes leaving three glowing cuts in the air');
  def(S, 's_corrosive', 'Ola Corrosiva', SK, 'uncommon', 1, { poison: 3, all: true }, { fx: { poison: 4 } }, {}, 'hooded huntress releasing a wave of corrosive green acid that ripples across all enemies');
  def(S, 's_footwork', 'Pasos de Danza', P, 'uncommon', 1, { dex: 2 }, { fx: { dex: 3 } }, {}, 'hooded huntress moving in a graceful light-footed dance across the forest floor, leaves swirling at her feet');
  def(S, 's_adrenaline', 'Adrenalina', SK, 'uncommon', 0, { energy: 1, draw: 2 }, { fx: { energy: 2, draw: 3 } }, { exhaust: true }, 'hooded huntress with wide glowing eyes and a racing heartbeat, green energy crackling, adrenaline rush');
  def(S, 's_backstab', 'Puñalada Trasera', A, 'uncommon', 0, { dmg: 11 }, { fx: { dmg: 15 } }, { exhaust: true, innate: true }, 'hooded huntress appearing behind an unsuspecting monster to deliver a deadly stab to the back, shadowy');
  def(S, 's_storm', 'Tormenta de Acero', SK, 'uncommon', 1, { stormOfSteel: true }, { cost: 0 }, {}, 'hooded huntress hurling her entire arsenal of knives in a storm of steel, blades filling the sky');
  def(S, 's_bane', 'Perdición', A, 'uncommon', 1, { dmg: 7, poisonDbl: true }, { fx: { dmg: 9 } }, {}, 'hooded huntress driving a glowing dagger into a monster already covered in green veins of poison, cruel smile');
  def(S, 's_cuts', 'Mil Cortes', P, 'rare', 2, { pw: { cuts: 1 } }, { fx: { pw: { cuts: 2 } } }, {}, 'hooded huntress surrounded by countless razor-thin spinning blades slicing the air around her, silver lines');
  def(S, 's_diedie', 'Corte Mortal', A, 'rare', 1, { dmg: 13, all: true }, { fx: { dmg: 17 } }, { exhaust: true }, 'hooded huntress crossing her blades unleashing a huge X-shaped slash of green energy across the battlefield');
  def(S, 's_tox', 'Veneno Letal', SK, 'rare', 2, { poison: 12 }, { fx: { poison: 16 } }, { exhaust: true }, 'hooded huntress holding up a skull-shaped vial of the deadliest glowing poison, sinister green light on her face');

  /* ===================== CLAUDIA — La Nigromante ===================== */
  def(K, 'k_strike', 'Golpe', A, 'starter', 1, { dmg: 6 }, { fx: { dmg: 9 } }, {}, '', { img: 'strike_necrobinder', tag: 'strike' });
  def(K, 'k_defend', 'Guardia', SK, 'starter', 1, { block: 5 }, { fx: { block: 8 } }, {}, '', { img: 'defend_necrobinder' });
  def(K, 'k_osty', 'Osty, ¡Ataca!', A, 'starter', 1, { ostyHit: 4 }, { fx: { ostyHit: 7 } }, {}, 'gothic necromancer girl pointing at an enemy as a ghostly skeletal glowing purple hand lunges forward to claw it');
  def(K, 'k_bone', 'Muro de Huesos', SK, 'starter', 1, { block: 6, ostyHeal: 4 }, { fx: { block: 9, ostyHeal: 6 } }, {}, 'gothic necromancer girl raising a wall of bones from the ground, violet spectral glow, graveyard');
  def(K, 'k_double', 'Zarpazo Doble', A, 'common', 1, { ostyHit: 3, hits: 2 }, { fx: { ostyHit: 4 } }, {}, 'a ghostly skeletal purple hand clawing twice across an enemy, violet slash trails, necromancer in the background');
  def(K, 'k_wail', 'Lamento', A, 'common', 1, { dmg: 6, all: true }, { fx: { dmg: 9 } }, {}, 'gothic necromancer girl summoning a wailing spirit that screams across the room, ghostly purple shockwave');
  def(K, 'k_touch', 'Toque Gélido', A, 'common', 1, { dmg: 8, weak: 1 }, { fx: { dmg: 11, weak: 2 } }, {}, 'gothic necromancer girl touching an enemy with a frost-cold pale hand, icy purple mist draining its strength');
  def(K, 'k_pact', 'Pacto Oscuro', SK, 'common', 0, { selfdmg: 2, draw: 2 }, { fx: { draw: 3 } }, {}, 'gothic necromancer girl signing a dark pact with a spectral skeletal figure, glowing violet contract, candles');
  def(K, 'k_siphon', 'Drenar', A, 'common', 1, { dmg: 8, heal: 2 }, { fx: { dmg: 10, heal: 3 } }, {}, 'gothic necromancer girl draining glowing violet life force out of an enemy into her outstretched hand');
  def(K, 'k_shade', 'Sombra Gélida', SK, 'common', 1, { block: 6, weak: 1, all: true }, { fx: { block: 9 } }, {}, 'gothic necromancer girl wrapped in a swirling cloak of cold shadow that weakens everything near, purple mist');
  def(K, 'k_omen', 'Presagio', SK, 'common', 1, { draw: 2, exhaustPick: 1 }, { fx: { draw: 3 } }, {}, 'gothic necromancer girl gazing into a floating skull crystal ball showing visions, glowing violet runes');
  def(K, 'k_hand', 'Mano Cadavérica', A, 'common', 1, { dmg: 5, hits: 2 }, { fx: { dmg: 7 } }, {}, 'a pair of rotting dead hands bursting from the ground to grab and strike an enemy, graveyard, purple glow');
  def(K, 'k_legion', 'Legión de Huesos', SK, 'uncommon', 2, { summon: 10 }, { fx: { summon: 14 } }, { exhaust: true }, 'gothic necromancer girl raising a gigantic skeletal hand and a legion of bones from the earth around her, violet storm');
  def(K, 'k_might', 'Poder de Osty', P, 'uncommon', 1, { ostyPow: 2 }, { fx: { ostyPow: 3 } }, {}, 'gothic necromancer girl channeling violet energy into a glowing skeletal hand, power surging');
  def(K, 'k_dance', 'Danza Macabra', P, 'uncommon', 1, { pw: { boneDance: 4 } }, { fx: { pw: { boneDance: 6 } } }, {}, 'gothic necromancer girl dancing among whirling skeletons and spirits in a moonlit graveyard, macabre waltz');
  def(K, 'k_harvest', 'Cosecha de Almas', A, 'uncommon', 1, { dmg: 12, fatalMax: 3 }, { fx: { dmg: 16, fatalMax: 4 } }, { exhaust: true }, 'gothic necromancer girl harvesting a glowing soul from a fallen enemy with a skull staff, souls rising');
  def(K, 'k_pyre', 'Pira Espectral', A, 'uncommon', 1, { dmg: 12, all: true, exhaustPick: 1 }, { fx: { dmg: 16 } }, {}, 'gothic necromancer girl burning a card in a violet spectral pyre that explodes outward across the room');
  def(K, 'k_gaze', 'Mirada Sepulcral', SK, 'uncommon', 1, { vuln: 2, all: true }, { fx: { vuln: 3 } }, {}, 'gothic necromancer girl with glowing violet eyes locking a terrifying gaze on enemies, dread, cold tomb light');
  def(K, 'k_charge', 'Embestida de Osty', A, 'uncommon', 2, { ostyHit: 5, hits: 2 }, { fx: { ostyHit: 7 } }, {}, 'a giant ghostly skeletal hand slamming twice down on enemies like a hammer, violet shockwaves, dark church');
  def(K, 'k_embrace', 'Abrazo Oscuro', P, 'uncommon', 2, { pw: { darkEmbrace: 1 } }, { cost: 1 }, {}, 'gothic necromancer girl embraced by dark shadowy arms and spirits that whisper secrets, violet fog');
  def(K, 'k_reviv', 'Resurrección', SK, 'uncommon', 1, { ostyHeal: 99, ostyPow: 1, revive: true }, { fx: { ostyPow: 2 } }, { exhaust: true }, 'gothic necromancer girl resurrecting a skeletal hand from a pile of bones in a column of violet light');
  def(K, 'k_army', 'Ejército de Sombras', P, 'rare', 2, { pw: { ostyCleave: 1 } }, { cost: 1 }, {}, 'gothic necromancer girl commanding an army of shadowy skeleton hands spreading over a battlefield, violet banners');
  def(K, 'k_necro', 'Nigromancia', P, 'rare', 1, { pw: { ostyRegen: 3 } }, { fx: { pw: { ostyRegen: 5 } } }, {}, 'gothic necromancer girl pouring glowing violet life into a floating skeletal hand that rebuilds itself');
  def(K, 'k_abyss', 'Llamado del Abismo', A, 'rare', 3, { dmg: 24, all: true }, { fx: { dmg: 32 } }, { exhaust: true }, 'gothic necromancer girl tearing open a portal to the abyss from which giant violet spectral claws erupt and crush enemies');
  def(K, 'k_coven', 'Aquelarre', SK, 'rare', 0, { energy: 2, draw: 2 }, { fx: { energy: 3 } }, { exhaust: true }, 'gothic necromancer girl at a moonlit witches coven ritual, circle of candles and spirits, violet power rising');
  def(K, 'k_moon', 'Luna Violeta', SK, 'rare', 2, { summon: 6, ostyPow: 4 }, { fx: { ostyPow: 6 } }, { exhaust: true }, 'gothic necromancer girl bathed in the light of a huge violet moon as her skeletal hand grows enormous and radiant');

  /* ===================== Estados y maldiciones ===================== */
  def('x', 'wound', 'Herida', 'status', 'special', -1, {}, {}, { unplayable: true }, '');
  def('x', 'burn', 'Quemadura', 'status', 'special', -1, {}, {}, { unplayable: true }, '', { endHand: { selfdmg: 2 } });
  def('x', 'slime', 'Baba', 'status', 'special', 1, {}, {}, { exhaust: true }, '');
  def('x', 'doubt', 'Duda', 'curse', 'special', -1, {}, {}, { unplayable: true }, '', { endHand: { weakSelf: 1 } });

  // Iniciales
  const STARTERS = {
    miranda: ['m_strike', 'm_strike', 'm_strike', 'm_strike', 'm_strike', 'm_defend', 'm_defend', 'm_defend', 'm_defend', 'm_bash'],
    staryuuki: ['s_strike', 's_strike', 's_strike', 's_strike', 's_strike', 's_defend', 's_defend', 's_defend', 's_defend', 's_defend', 's_neutralize', 's_survivor'],
    karen: ['k_strike', 'k_strike', 'k_strike', 'k_strike', 'k_defend', 'k_defend', 'k_defend', 'k_defend', 'k_osty', 'k_bone'],
  };

  const root = typeof window !== 'undefined' ? window : globalThis;
  root.SM = root.SM || {};
  Object.assign(root.SM, { CARDS, POOL, STARTERS, TRIG });
})();
