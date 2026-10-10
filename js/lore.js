/* Spire Muses — historia del mundo, retos de la Galería, finales y niveles de Pesadilla. */
(function () {
  const root = typeof window !== 'undefined' ? window : globalThis;
  const SM = (root.SM = root.SM || {});

  const S = (k) => (m) => m.s[k] || 0;
  const WIN3 = (m) => Math.min(m.s.win_miranda || 0, m.s.win_staryuuki || 0, m.s.win_karen || 0);

  // ch: reto. v(meta) devuelve el valor actual; t = objetivo. lora: personaje para el arte (opcional)
  const LORE = [
    { id: 'canto', title: 'El Canto Primero', ch: 'Empieza tu primera partida', t: 1, v: S('runs'), ico: '🎵',
      text: 'Antes de los muelles, los bosques y las colmenas, el mundo era una canción. La cantaba una diosa dormida, y cada nota se volvía una montaña, un río, un animal. Mientras la canción sonara, nada podía morir de verdad.',
      ap: 'a gigantic sleeping goddess made of starlight and aurora, her song visible as flowing ribbons of golden music notes forming mountains and rivers, cosmic, ethereal, dark fantasy painting' },
    { id: 'aguja', title: 'La Aguja del Compositor', ch: 'Derrota 10 enemigos', t: 10, v: S('kills'), ico: '🗼',
      text: 'Para que la canción no se apagara, un compositor sin nombre levantó una torre inmensa: la Aguja. Dentro, un carillón de mil engranajes guardaba la melodía. Subir por ella es recorrer, nota a nota, el corazón del mundo.',
      ap: 'a colossal slender gothic spire tower piercing the clouds, covered in giant brass gears and bells, glowing violet and gold lights, stormy sky, epic dark fantasy matte painting' },
    { id: 'movimientos', title: 'Los Tres Movimientos', ch: 'Recorre 25 salas en total', t: 25, v: S('floors'), ico: '🎼',
      text: 'La melodía tenía tres movimientos: el Preludio del Agua, el Canto de la Vida y la Marcha del Hambre. Cada uno dio origen a una región, y cada región a sus criaturas. Pero un movimiento mal tocado puede volverse una amenaza.',
      ap: 'three glowing panels showing a harbor at night, a mossy ancient forest and a golden honeycomb hive, united by a ribbon of musical notes, triptych, dark fantasy painting' },
    { id: 'muelles', title: 'Preludio del Agua', ch: 'Derrota al Cangrejo Rey', t: 1, v: S('boss_crabking'), ico: '🦀',
      text: 'Los Bajos Muelles fueron la primera estrofa: agua, sal y campanas lejanas. El Cangrejo Rey se coronó con anclas oxidadas y juró que ninguna nota subiría más allá del puerto. Hasta que alguien tuvo la osadía de cantarle de vuelta.',
      ap: 'flooded abandoned harbor at night, a giant crab king on a pier wearing a crown of rusty anchors, teal fog, lanterns, ships wrecks, dark fantasy painting' },
    { id: 'oro1', title: 'La Moneda que Canta', ch: 'Reúne 500 de oro en total', t: 500, v: S('gold'), ico: '💰',
      text: 'En los muelles dicen que cada moneda guarda un eco de la canción primera. Los mercaderes fantasma las coleccionan, las pulen y las venden. Dicen que si juntas las suficientes, puedes oír una melodía completa.',
      ap: 'a ghostly merchant in a harbor tavern surrounded by glowing floating coins that ring like bells, warm lantern light, dark fantasy painting' },
    { id: 'maleza', title: 'El Canto de la Vida', ch: 'Derrota a la Madre Raíz', t: 1, v: S('boss_rootmother'), ico: '🌳',
      text: 'En la Maleza, la segunda estrofa creció salvaje. La Madre Raíz es el corazón de un bosque que aprendió a defenderse con espinas. No es mala: solo recuerda que todo lo que ama puede ser talado.',
      ap: 'ancient enchanted forest with a giant tree that has a glowing red heart in its trunk, fireflies, mist, roots forming a cathedral, dark fantasy painting' },
    { id: 'savia', title: 'La Savia que Recuerda', ch: 'Derrota a 5 élites', t: 5, v: S('elites'), ico: '💀',
      text: 'Los élites no nacieron monstruos. Cada uno fue un guardián de la canción: un estibador, un ciervo, un árbol que cantaba a los viajeros. Cuando la melodía se debilitó, su lealtad se retorció en furia.',
      ap: 'a corrupted noble giant stag with glowing green eyes standing among roots, sap glowing like gold, melancholic, dark fantasy painting' },
    { id: 'colmena', title: 'La Marcha del Hambre', ch: 'Llega a la Colmena (Acto III)', t: 1, v: S('act3'), ico: '🐝',
      text: 'El tercer movimiento debía ser una marcha triunfal. Pero alguien tocó demasiado fuerte, demasiado rápido, y de aquel ruido nació la Colmena: miel, cera y un hambre que nunca descansa.',
      ap: 'cavernous giant beehive interior with glowing amber honeycomb, bee warriors marching in formation, golden light shafts, dark fantasy painting' },
    { id: 'reina', title: 'La Reina Hambrienta', ch: 'Termina el juego (vence a la Reina)', t: 1, v: S('wins'), ico: '👑',
      text: 'La Reina fue la hija del Compositor. Cuando él se durmió, ella intentó terminar la canción y no pudo: le faltaba una nota. Esa ausencia se volvió hambre, y el hambre, corona. Nadie la odió tanto como ella misma.',
      ap: 'a tragic insectoid queen in golden armor sitting on a throne of honeycomb, a single tear of amber, crown cracked, sad and regal, dark fantasy painting' },
    { id: 'miranda', title: 'Zafira, Voz del Valor', ch: 'Gana una partida con Zafira', t: 1, v: S('win_miranda'), ico: '⚔️', lora: 'miranda',
      text: 'Zafira fue la última de los Acorazados, una orden de caballeros que juró proteger la melodía. Su espada no corta carne: corta silencio. Cada vez que cae, una nota grave se enciende en su pecho, y se levanta.',
      ap: 'dignified armored female knight with a huge sword kneeling at the foot of a tower in ruins, red cape, a faint glowing low musical note on her chest, dramatic dusk light' },
    { id: 'staryuuki', title: 'Nila, Voz de la Astucia', ch: 'Gana una partida con Nila', t: 1, v: S('win_staryuuki'), ico: '🗡️', lora: 'staryuuki',
      text: 'Nila creció entre los árboles y aprendió que la fuerza es solo una forma torpe de ser rápida. Se ríe de las trampas, pero conoce de memoria cada una. Su nota es aguda, un silbido que apenas se oye y lo cambia todo.',
      ap: 'cheerful hooded huntress with daggers perched on a high tree branch smiling at the camera, forest at sunrise, tiny glowing high musical note floating beside her' },
    { id: 'karen', title: 'Claudia, Voz de la Memoria', ch: 'Gana una partida con Claudia', t: 1, v: S('win_karen'), ico: '💀', lora: 'karen',
      text: 'Claudia no teme a los muertos: los escucha. En sus canciones guarda los nombres que el mundo olvidó. Cuando invoca a Osty, no llama a un esqueleto, sino a un recuerdo que se niega a desvanecerse.',
      ap: 'gothic necromancer girl in a moonlit cemetery surrounded by gentle glowing violet spirits like fireflies, holding a skull staff, serene and sad, dark fantasy painting' },
    { id: 'osty', title: 'Osty, la Mano que Recuerda', ch: 'Osty ataca 60 veces', t: 60, v: S('ostyHits'), ico: '🖐️',
      text: 'Nadie sabe de quién fue la mano de Osty. Claudia dice que de alguien que quiso tocar el piano una última vez. Por eso, cada golpe suyo suena un poco a acorde.',
      ap: 'a ghostly skeletal glowing purple hand playing a piano made of bones in an abandoned gothic chapel, candles, soft violet light, dark fantasy painting' },
    { id: 'veneno', title: 'La Cazadora y el Veneno', ch: 'Aplica 300 de Veneno en total', t: 300, v: S('poison'), ico: '☠️',
      text: 'El veneno de Nila no mata rápido: espera. Es la paciencia hecha líquido, destilada de hongos que crecen donde nadie canta. Dicen que los enemigos envenenados tararean antes de caer.',
      ap: 'alchemy workbench in a hollow tree with bubbling green vials, herbs, daggers and mushrooms glowing, warm light, cozy but dangerous, dark fantasy painting' },
    { id: 'escudo', title: 'El Escudo Carmesí', ch: 'Bloquea 1500 de daño en total', t: 1500, v: S('block'), ico: '🛡️',
      text: 'Zafira dice que defenderse no es retroceder: es elegir dónde clavar los pies. Su escudo, forjado con el hierro de un barco hundido, ha detenido más golpes de los que cualquiera podría contar.',
      ap: 'a huge battered crimson shield stuck into the ground on a battlefield at dawn, arrows around it, embers, banners fluttering, dark fantasy painting' },
    { id: 'notas', title: 'Cien Notas', ch: 'Juega 300 cartas en total', t: 300, v: S('cards'), ico: '🃏',
      text: 'Cada carta es una nota. Un mazo es una partitura. Las musas aprendieron que no hay carta inútil, solo notas esperando su compás.',
      ap: 'hundreds of glowing tarot-like cards floating in a spiral forming a musical score in the air above an ancient stone table, magical, dark fantasy painting' },
    { id: 'oro2', title: 'Bolsillos del Mundo', ch: 'Reúne 2500 de oro en total', t: 2500, v: S('gold'), ico: '🏦',
      text: 'Hay tesoros bajo la Aguja que nadie reclamó: tumbas de comerciantes, cofres malditos, ofrendas a dioses olvidados. El oro no compra la canción, pero paga a quienes la guardan.',
      ap: 'a vast underground vault of gold coins and ancient treasures lit by a single violet lantern, huge golden bell, dark fantasy painting' },
    { id: 'pociones', title: 'Alquimia de Viaje', ch: 'Usa 15 pociones', t: 15, v: S('potions'), ico: '🧪',
      text: 'En cada sala de la Aguja hay un frasco olvidado. Algunos fueron preparados por el Compositor, otros por viajeras desesperadas. Todos saben a lo mismo: a segunda oportunidad.',
      ap: 'a wooden shelf in a dim tower room full of colorful glowing potion bottles with handwritten labels, candles, cobwebs, dark fantasy painting' },
    { id: 'reliquias', title: 'El Relicario', ch: 'Descubre 12 reliquias distintas', t: 12, v: (m) => (m.relics || []).length, ico: '💍',
      text: 'Las reliquias son fragmentos de la canción atrapados en objetos. Una linterna que recuerda la calidez de un hogar, una piedra lisa que recuerda al río. Al reunirlas, empiezan a susurrar entre sí.',
      ap: 'a circle of ancient relics floating around a glowing flame: a lantern, an anchor, a ring, a smooth stone, a golden strawberry, a horn, in a dark chamber, dark fantasy painting' },
    { id: 'leyenda', title: 'Un Golpe de Leyenda', ch: 'Inflige 40 de daño con un solo golpe', t: 40, v: S('maxHit'), ico: '💥',
      text: 'Hay golpes que se oyen en tres reinos. Los bardos los llaman fortissimo. Cuando uno se da bien, la Aguja entera vibra y los engranajes se detienen un instante a escuchar.',
      ap: 'an enormous shockwave of golden light from a sword strike splitting a dark sky, tower silhouettes trembling, epic dark fantasy painting' },
    { id: 'matanza', title: 'Sinfonía de Acero', ch: 'Derrota 250 enemigos en total', t: 250, v: S('kills'), ico: '🎻',
      text: 'Un campo de batalla bien librado tiene ritmo: avance, compás, silencio, avance. Las musas lo saben. Y lo lamentan, porque cada criatura derrotada fue una vez una nota de la misma canción.',
      ap: 'a battlefield at twilight with fallen monsters turning into glowing musical notes that rise towards the sky, three silhouettes of warriors, melancholic, dark fantasy painting' },
    { id: 'sinrasguno', title: 'Danza sin Rasguños', ch: 'Vence a un élite sin recibir daño', t: 1, v: S('flawlessElite'), ico: '✨',
      text: 'Hay un baile que solo se aprende al lado de la muerte: dar un paso atrás justo cuando la espada pasa. Quien lo domina no esquiva el golpe: lo hace parte de la música.',
      ap: 'elegant duel at night, a hooded figure gracefully dodging a giant monster blow with a trail of silver light, moonlit ruins, dark fantasy painting' },
    { id: 'pesadilla1', title: 'La Melodía Invertida', ch: 'Supera la Pesadilla 1', t: 1, v: S('nm'), ico: '🌙',
      text: 'Cuando la Reina cayó, la torre no calló. Empezó a sonar al revés. Las notas se agrietaron, los pasillos cambiaron de lugar y los enemigos regresaron más furiosos. La Pesadilla había comenzado.',
      ap: 'the same tall tower seen upside down in a dark reflection, notes cracking like glass, nightmarish purple and black sky, surreal dark fantasy painting' },
    { id: 'pesadilla3', title: 'El Compositor Dormido', ch: 'Supera la Pesadilla 3', t: 3, v: S('nm'), ico: '😴',
      text: 'En la cima de la Aguja duerme el Compositor, hecho de papel de música y polvo. Sueña con su hija. Sus pesadillas son las que dan forma a la torre, y cada una es más oscura que la anterior.',
      ap: 'a giant sleeping elderly composer made of old sheet music and dust, lying on a huge desk in the clouds, ghostly notes floating from his dreams, dark fantasy painting' },
    { id: 'pesadilla6', title: 'Silencio Final', ch: 'Supera la Pesadilla 6', t: 6, v: S('nm'), ico: '🔇',
      text: 'Hay un lugar más allá del último compás: el Silencio. No es vacío, es espera. Allí el mundo contiene la respiración y decide si la canción merece seguir.',
      ap: 'a vast dark void with a single tiny glowing bell floating in the center, thin silver threads of music, minimalist, eerie, dark fantasy painting' },
    { id: 'pesadilla10', title: 'El Fin de la Canción', ch: 'Supera la Pesadilla 10', t: 10, v: S('nm'), ico: '🌌',
      text: 'Quien llega hasta aquí ha oído la canción de todas las formas posibles: en orden, al revés, rota y entera. Y entiende al fin que una canción no se acaba: se hereda.',
      ap: 'a cosmic finale: the tower dissolving into millions of golden notes forming a new galaxy, a sunrise breaking through, majestic, dark fantasy painting' },
    { id: 'tres', title: 'Tres Voces', ch: 'Gana una partida con cada musa', t: 3, v: WIN3, ico: '🎶',
      text: 'Valor, astucia y memoria. Zafira, Nila y Claudia nunca cantaron juntas, pero sus notas siempre armonizaron. La Aguja lo sabía: faltaba una cuarta voz para completar el acorde.',
      ap: 'three glowing figures in red, green and violet light standing back to back at the summit of a tower, silhouettes only, their three colored auras blending into white, cosmic sky, dark fantasy painting' },
    { id: 'ultima', title: 'La Última Nota', ch: 'Desbloquea todo el resto de la Galería', t: 27, v: (m) => (m.unlocked || 0), ico: '🔔',
      text: 'La cuarta voz era la de la Reina. No una corona, sino una canción de cuna. Al entenderlo, las musas no la mataron: la dejaron descansar. Y la diosa, por fin, sonrió en sueños.',
      ap: 'a tender scene of a sleeping goddess smiling in a garden of stars, a small golden bell resting in her hand, surrounded by butterflies made of light, peaceful, dark fantasy painting' },
  ];

  // Niveles de Pesadilla. Los efectos son acumulativos.
  const NM = [
    '', 'Los enemigos tienen +10% de PV.', 'Los enemigos infligen +10% de daño.', 'Empiezas cada partida con la maldición Duda.',
    'Ganas un 25% menos de oro.', 'Los élites y jefes empiezan con +2 de Fuerza.', 'La hoguera cura solo un 20% de tu vida.',
    'Los enemigos tienen +25% de PV (en total).', 'Cada combate empieza con una Herida en tu mazo.', 'Los enemigos infligen +25% de daño (en total).',
    'Los enemigos normales llegan con +1 de Fuerza y los jefes con +4.',
  ];
  function nmMods(n) {
    return {
      hp: 1 + (n >= 7 ? 0.25 : n >= 1 ? 0.1 : 0),
      dmg: 1 + (n >= 9 ? 0.25 : n >= 2 ? 0.1 : 0),
      gold: n >= 4 ? 0.75 : 1,
      rest: n >= 6 ? 0.2 : 0.3,
      doubt: n >= 3,
      eliteStr: n >= 5 ? 2 : 0,
      wound: n >= 8,
      allStr: n >= 10 ? 1 : 0,
      bossStr: n >= 10 ? 4 : n >= 5 ? 2 : 0,
    };
  }

  // Cinemática del final. Cada escena: imagen (clave), texto, [char] para variantes por musa.
  const ENDING = {
    scenes: [
      { img: 'end_1', fx: 'zoomin', text: 'La Reina Hambrienta cayó, y su corona se deshizo en miles de abejas de luz. Por primera vez en siglos, la Aguja guardó silencio.' },
      { img: 'end_2_{c}', fx: 'panup', text: '{N} dio un paso al frente. En la cima, una campana colgaba sin badajo. Al rozarla con los dedos, el metal cantó solo.' },
      { img: 'end_3', fx: 'zoomout', text: 'Entonces vio la verdad: la Aguja no era una fortaleza, sino un carillón gigante. Y la melodía del mundo estaba incompleta.' },
      { img: 'end_4_{c}', fx: 'zoomin', text: '{N} cerró los ojos y oyó dos voces más. {O1} y {O2}, lejos, en otros pasillos, cantaban la misma nota. «Éramos las notas que faltaban», susurró.' },
      { img: 'end_5', fx: 'panright', text: 'Cuando las tres voces se unieron, la canción volvió a sonar. En los muelles se encendieron los faroles; el bosque rebrotó; la colmena floreció en jardines de mariposas.' },
      { img: 'end_6_{c}', fx: 'zoomout', text: 'Las musas no regresaron a casa. Se quedaron en la Aguja, convertidas en luz, cantando cada noche para que el mundo no volviera a olvidarse. {N} es ahora una estrella que se ve desde cualquier puerto.' },
    ],
    nightmare: { img: 'end_nm', fx: 'zoomin', text: 'Pero en lo más hondo de la torre, algo se removió. Una nota al revés, una sonrisa en la oscuridad. «Otra vez», susurró el Compositor dormido. La Pesadilla aún no ha terminado.' },
    final: 'FIN',
  };

  Object.assign(SM, { LORE, NM, nmMods, ENDING });
})();
