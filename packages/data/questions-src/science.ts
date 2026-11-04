import type { Rng } from "@geoclash/engine";
import { distract, fromRows, sample, type Gen, type Row } from "./lib";

type El = [name: string, symbol: string, z: number, difficulty: number];
const ELEMENTS: El[] = [
  ["hydrogène", "H", 1, 1], ["hélium", "He", 2, 2], ["lithium", "Li", 3, 4], ["carbone", "C", 6, 1], ["azote", "N", 7, 2],
  ["oxygène", "O", 8, 1], ["fluor", "F", 9, 4], ["néon", "Ne", 10, 3], ["sodium", "Na", 11, 3], ["magnésium", "Mg", 12, 4],
  ["aluminium", "Al", 13, 3], ["silicium", "Si", 14, 4], ["phosphore", "P", 15, 4], ["soufre", "S", 16, 3], ["chlore", "Cl", 17, 3],
  ["argon", "Ar", 18, 5], ["potassium", "K", 19, 4], ["calcium", "Ca", 20, 3], ["fer", "Fe", 26, 2], ["cuivre", "Cu", 29, 2],
  ["zinc", "Zn", 30, 3], ["argent", "Ag", 47, 2], ["étain", "Sn", 50, 3], ["or", "Au", 79, 2], ["mercure", "Hg", 80, 3],
  ["plomb", "Pb", 82, 3], ["uranium", "U", 92, 3], ["platine", "Pt", 78, 4], ["nickel", "Ni", 28, 4], ["cobalt", "Co", 27, 4],
  ["titane", "Ti", 22, 4], ["tungstène", "W", 74, 6], ["iode", "I", 53, 4], ["brome", "Br", 35, 5], ["radium", "Ra", 88, 5],
  ["plutonium", "Pu", 94, 5], ["krypton", "Kr", 36, 6], ["xénon", "Xe", 54, 6], ["manganèse", "Mn", 25, 5], ["chrome", "Cr", 24, 5],
  ["bore", "B", 5, 5], ["béryllium", "Be", 4, 6], ["antimoine", "Sb", 51, 6], ["arsenic", "As", 33, 5], ["bismuth", "Bi", 83, 6],
  ["baryum", "Ba", 56, 6], ["strontium", "Sr", 38, 6], ["gallium", "Ga", 31, 6], ["césium", "Cs", 55, 6], ["rubidium", "Rb", 37, 6],
];

const ROWS: Row[] = [
  // Astronomie
  ["sciences", 1, "Quelle est la plus grande planète du système solaire ?", "Jupiter", "Saturne", "Neptune", "Uranus"],
  ["sciences", 1, "Quelle planète est surnommée la planète rouge ?", "Mars", "Vénus", "Mercure", "Jupiter"],
  ["sciences", 1, "Quelle planète est entourée d'anneaux spectaculaires ?", "Saturne", "Mars", "Vénus", "Mercure"],
  ["sciences", 1, "Quelle est l'étoile la plus proche de la Terre ?", "Le Soleil", "Sirius", "Polaris", "Bételgeuse"],
  ["sciences", 1, "Quel astronaute a posé le premier le pied sur la Lune ?", "Neil Armstrong", "Buzz Aldrin", "Youri Gagarine", "Michael Collins"],
  ["sciences", 2, "Combien de planètes compte le système solaire ?", "8", "9", "7", "10"],
  ["sciences", 2, "Comment s'appelle notre galaxie ?", "La Voie lactée", "Andromède", "Le Triangle", "Le Sombrero"],
  ["sciences", 2, "Qui fut le premier homme dans l'espace, en 1961 ?", "Youri Gagarine", "Neil Armstrong", "Alan Shepard", "Buzz Aldrin"],
  ["sciences", 2, "Quelle planète possède la Grande Tache rouge ?", "Jupiter", "Saturne", "Mars", "Neptune"],
  ["sciences", 2, "Que mesure une année-lumière ?", "Une distance", "Une durée", "Une vitesse", "Une masse"],
  ["sciences", 2, "Quelle force maintient les planètes en orbite autour du Soleil ?", "La gravité", "Le magnétisme", "La friction", "La pression solaire"],
  ["sciences", 3, "Quelle est la planète la plus chaude du système solaire ?", "Vénus", "Mercure", "Mars", "Jupiter"],
  ["sciences", 3, "Comment s'appelait la mission qui a posé les premiers hommes sur la Lune en 1969 ?", "Apollo 11", "Apollo 13", "Gemini 4", "Soyouz 11"],
  ["sciences", 3, "Comment s'appelle le télescope spatial lancé en 1990 ?", "Hubble", "James Webb", "Kepler", "Spitzer"],
  ["sciences", 3, "Quel est l'élément le plus abondant dans l'Univers ?", "L'hydrogène", "L'hélium", "L'oxygène", "Le carbone"],
  ["sciences", 3, "De quoi le Soleil est-il principalement constitué ?", "D'hydrogène et d'hélium", "De fer et de nickel", "D'oxygène et d'azote", "De carbone et de silicium"],
  ["sciences", 4, "Combien de temps la lumière du Soleil met-elle environ pour atteindre la Terre ?", "8 minutes", "8 secondes", "1 heure", "1 jour"],
  ["sciences", 5, "Quel est le plus grand satellite naturel de Jupiter ?", "Ganymède", "Europe", "Io", "Callisto"],
  ["sciences", 5, "Quelle sonde est la première à avoir atteint l'espace interstellaire ?", "Voyager 1", "Pioneer 10", "Voyager 2", "Cassini"],
  ["sciences", 5, "Quel est le plus grand volcan du système solaire, situé sur Mars ?", "Olympus Mons", "Mauna Kea", "L'Etna", "Valles Marineris"],
  ["sciences", 5, "Quelle planète tourne sur elle-même presque « couchée » sur le côté ?", "Uranus", "Neptune", "Saturne", "Mars"],
  ["sciences", 5, "Quels sont les deux satellites naturels de Mars ?", "Phobos et Déimos", "Titan et Rhéa", "Io et Europe", "Triton et Néréide"],
  ["sciences", 6, "Quelle planète a la rotation sur elle-même la plus lente, avec un jour plus long que son année ?", "Vénus", "Mercure", "Mars", "Neptune"],
  // Physique
  ["sciences", 1, "À quelle température l'eau gèle-t-elle à pression normale ?", "0 °C", "32 °C", "10 °C", "−10 °C"],
  ["sciences", 1, "À quelle température l'eau bout-elle au niveau de la mer ?", "100 °C", "90 °C", "212 °C", "120 °C"],
  ["sciences", 2, "Qui a découvert la loi de la gravitation universelle ?", "Isaac Newton", "Galilée", "Johannes Kepler", "Nicolas Copernic"],
  ["sciences", 2, "Quelle célèbre équation relie l'énergie et la masse ?", "E = mc²", "E = mv²", "F = ma", "P = mg"],
  ["sciences", 2, "Laquelle de ces couleurs ne fait pas partie des sept couleurs de l'arc-en-ciel ?", "Le marron", "Le violet", "L'indigo", "L'orange"],
  ["sciences", 3, "Quelle est l'unité de force dans le Système international ?", "Le newton", "Le joule", "Le watt", "Le pascal"],
  ["sciences", 3, "Quelle est l'unité de puissance dans le Système international ?", "Le watt", "Le joule", "Le volt", "L'ampère"],
  ["sciences", 3, "Quelle est l'unité de fréquence ?", "Le hertz", "Le décibel", "Le tesla", "Le lumen"],
  ["sciences", 3, "Quelle est l'unité de résistance électrique ?", "L'ohm", "Le volt", "L'ampère", "Le farad"],
  ["sciences", 4, "Quelle est, environ, la vitesse du son dans l'air ?", "340 m/s", "3 400 m/s", "34 m/s", "300 000 km/s"],
  ["sciences", 4, "Comment appelle-t-on le passage direct de l'état solide à l'état gazeux ?", "La sublimation", "La fusion", "La condensation", "La vaporisation"],
  ["sciences", 4, "Quel physicien a découvert les rayons X en 1895 ?", "Wilhelm Röntgen", "Henri Becquerel", "Max Planck", "Heinrich Hertz"],
  ["sciences", 4, "Quel scientifique a découvert la radioactivité naturelle en 1896 ?", "Henri Becquerel", "Marie Curie", "Wilhelm Röntgen", "Ernest Rutherford"],
  ["sciences", 4, "Quel boson, découvert en 2012, est lié à l'origine de la masse des particules ?", "Le boson de Higgs", "Le gluon", "Le photon", "Le neutrino"],
  ["sciences", 4, "Qui a inventé la pile électrique en 1800 ?", "Alessandro Volta", "Luigi Galvani", "Thomas Edison", "Michael Faraday"],
  ["sciences", 4, "Quelle loi énonce qu'à toute action correspond une réaction égale et opposée ?", "La troisième loi de Newton", "La première loi de Newton", "La loi d'Ohm", "La loi de Hooke"],
  // Chimie
  ["sciences", 1, "Quelle est la formule chimique du dioxyde de carbone ?", "CO2", "CO", "CH4", "O3"],
  ["sciences", 1, "Quel gaz fait pétiller les boissons gazeuses ?", "Le dioxyde de carbone", "L'oxygène", "L'azote", "L'hydrogène"],
  ["sciences", 2, "Quel est le pH d'une solution neutre à 25 °C ?", "7", "0", "14", "1"],
  ["sciences", 2, "Que désigne la formule NaCl ?", "Le sel de cuisine", "Le sucre", "Le bicarbonate", "Le vinaigre"],
  ["sciences", 2, "Quelle particule porte une charge électrique négative ?", "L'électron", "Le proton", "Le neutron", "Le noyau"],
  ["sciences", 2, "Avec quel élément le fer forme-t-il l'acier ?", "Le carbone", "Le cuivre", "L'oxygène", "Le soufre"],
  ["sciences", 3, "Quel est le gaz le plus abondant dans l'atmosphère terrestre ?", "L'azote", "L'oxygène", "Le dioxyde de carbone", "L'argon"],
  ["sciences", 3, "Quel alliage associe cuivre et étain ?", "Le bronze", "Le laiton", "L'acier", "L'inox"],
  ["sciences", 3, "Quelle est la formule chimique de l'ozone ?", "O3", "O2", "CO2", "N2O"],
  ["sciences", 4, "Quel alliage associe cuivre et zinc ?", "Le laiton", "Le bronze", "L'acier", "Le duralumin"],
  ["sciences", 4, "Quel acide trouve-t-on dans l'estomac ?", "L'acide chlorhydrique", "L'acide sulfurique", "L'acide acétique", "L'acide citrique"],
  ["sciences", 4, "Quel est le principal composant du gaz naturel ?", "Le méthane", "L'éthane", "Le propane", "Le butane"],
  ["sciences", 5, "Quel est le métal le plus abondant dans la croûte terrestre ?", "L'aluminium", "Le fer", "Le cuivre", "Le calcium"],
  // Corps humain
  ["sciences", 1, "Quel organe pompe le sang dans le corps ?", "Le cœur", "Le foie", "Les poumons", "Le rein"],
  ["sciences", 1, "Quelle est la durée normale approximative d'une grossesse humaine ?", "9 mois", "6 mois", "12 mois", "7 mois"],
  ["sciences", 2, "Quel est le plus grand organe du corps humain ?", "La peau", "Le foie", "Le cerveau", "L'intestin"],
  ["sciences", 2, "Combien de cavités compte le cœur humain ?", "4", "2", "3", "6"],
  ["sciences", 3, "Quelle vitamine la peau fabrique-t-elle sous l'effet du soleil ?", "La vitamine D", "La vitamine C", "La vitamine A", "La vitamine B12"],
  ["sciences", 3, "Combien de dents compte un adulte, dents de sagesse comprises ?", "32", "28", "30", "36"],
  ["sciences", 3, "Quel est le rôle principal des globules rouges ?", "Transporter l'oxygène", "Combattre les infections", "Coaguler le sang", "Digérer les aliments"],
  ["sciences", 3, "Qui a découvert la pénicilline en 1928 ?", "Alexander Fleming", "Louis Pasteur", "Robert Koch", "Edward Jenner"],
  ["sciences", 3, "Quel moine est considéré comme le père de la génétique grâce à ses expériences sur les pois ?", "Gregor Mendel", "Charles Darwin", "Louis Pasteur", "Francis Crick"],
  ["sciences", 4, "Quel organe produit l'insuline ?", "Le pancréas", "Le foie", "Le rein", "La rate"],
  ["sciences", 4, "Quel groupe sanguin est considéré comme donneur universel pour les globules rouges ?", "O négatif", "AB positif", "A positif", "B négatif"],
  ["sciences", 4, "Combien de chromosomes compte une cellule humaine ?", "46", "23", "48", "44"],
  ["sciences", 4, "Quelle structure en double hélice ont décrite Watson et Crick en 1953 ?", "L'ADN", "L'ARN", "Une protéine", "Le glucose"],
  ["sciences", 4, "Qui a mis au point le premier vaccin, contre la variole, à la fin du XVIIIe siècle ?", "Edward Jenner", "Louis Pasteur", "Alexander Fleming", "Robert Koch"],
  ["sciences", 4, "Contre quelle maladie Louis Pasteur a-t-il testé un vaccin sur l'humain en 1885 ?", "La rage", "La peste", "La variole", "La polio"],
  ["sciences", 5, "Quel est le plus petit os du corps humain ?", "L'étrier", "Le marteau", "L'enclume", "Une phalange"],
  // Mathématiques
  ["sciences", 1, "Combien font 12 × 12 ?", "144", "124", "132", "154"],
  ["sciences", 1, "Combien font 7 × 8 ?", "56", "54", "48", "64"],
  ["sciences", 1, "Quelle est la valeur approximative de pi ?", "3,14", "2,71", "1,62", "3,41"],
  ["sciences", 1, "Combien de degrés compte la somme des angles d'un triangle ?", "180", "90", "360", "270"],
  ["sciences", 1, "Combien de faces a un cube ?", "6", "4", "8", "12"],
  ["sciences", 2, "Quel est le plus petit nombre premier ?", "2", "1", "3", "0"],
  ["sciences", 2, "Comment appelle-t-on un polygone à 8 côtés ?", "Un octogone", "Un hexagone", "Un décagone", "Un heptagone"],
  ["sciences", 2, "Quelle est la racine carrée de 144 ?", "12", "14", "11", "16"],
  ["sciences", 2, "Combien de zéros contient le nombre un million ?", "6", "5", "7", "9"],
  ["sciences", 2, "Comment appelle-t-on un triangle dont les trois côtés sont égaux ?", "Un triangle équilatéral", "Un triangle isocèle", "Un triangle scalène", "Un triangle rectangle"],
  ["sciences", 2, "Combien font 15 % de 200 ?", "30", "15", "20", "45"],
  ["sciences", 2, "Quel mathématicien grec est célèbre pour son théorème sur les triangles rectangles ?", "Pythagore", "Euclide", "Archimède", "Platon"],
  ["sciences", 3, "Quel mathématicien a donné son nom à la suite 1, 1, 2, 3, 5, 8… ?", "Fibonacci", "Euler", "Gauss", "Pascal"],
  ["sciences", 3, "Combien vaut 2 puissance 10 ?", "1 024", "1 000", "512", "2 048"],
  ["sciences", 5, "Quel mathématicien est surnommé le « prince des mathématiciens » ?", "Carl Friedrich Gauss", "Leonhard Euler", "Pierre de Fermat", "Blaise Pascal"],
  ["sciences", 6, "Quel est le plus petit nombre parfait, égal à la somme de ses diviseurs propres ?", "6", "28", "12", "10"],
  // Unités et Terre
  ["sciences", 1, "Combien de secondes compte une heure ?", "3 600", "360", "6 000", "60"],
  ["sciences", 1, "Quelle est la principale source d'énergie du climat terrestre ?", "Le Soleil", "Le noyau terrestre", "La Lune", "Les volcans"],
  ["sciences", 2, "Quel instrument mesure la pression atmosphérique ?", "Le baromètre", "Le thermomètre", "L'hygromètre", "Le pluviomètre"],
  ["sciences", 3, "Combien de minutes compte une journée ?", "1 440", "1 200", "2 400", "1 000"],
  ["sciences", 3, "Quel instrument enregistre les séismes ?", "Le sismographe", "Le baromètre", "Le thermomètre", "L'anémomètre"],
  ["sciences", 3, "Quel instrument mesure la vitesse du vent ?", "L'anémomètre", "Le baromètre", "Le sismographe", "Le chronomètre"],
  ["sciences", 3, "Quelle est la couche la plus externe de la Terre ?", "La croûte", "Le manteau", "Le noyau", "L'asthénosphère"],
  ["sciences", 4, "Comment s'appelait le supercontinent qui existait il y a environ 300 millions d'années ?", "La Pangée", "Gondwana", "Laurasia", "Rodinia"],
  ["sciences", 4, "Quelle roche naît du refroidissement du magma ?", "Une roche magmatique", "Une roche sédimentaire", "Une roche métamorphique", "Une roche organique"],
];

export function generateScience(rng: Rng): Gen[] {
  const out: Gen[] = [];
  const symbols = ELEMENTS.map((e) => e[1]);
  const names = ELEMENTS.map((e) => e[0]);
  for (const [name, sym, , d] of ELEMENTS) {
    out.push({ category: "sciences", difficulty: d, question: `Quel est le symbole chimique de l'élément « ${name} » ?`, correct: sym, wrong: distract(rng, symbols, sym) });
  }
  for (const [name, sym, , d] of sample(rng, ELEMENTS, 20, (e) => e[3] < 3)) {
    out.push({ category: "sciences", difficulty: Math.min(6, d + 1), question: `Quel élément chimique a pour symbole « ${sym} » ?`, correct: name[0].toUpperCase() + name.slice(1), wrong: distract(rng, names.map((n) => n[0].toUpperCase() + n.slice(1)), name[0].toUpperCase() + name.slice(1)) });
  }
  for (const [name, , z, d] of sample(rng, ELEMENTS, 12, (e) => e[2] > 30 && e[2] !== 79 && e[2] !== 47 && e[2] !== 92)) {
    const wrong = new Set<string>();
    for (const off of [-2, -1, 1, 2, 3, -3, 4, 5, 10, -5]) {
      const v = z + off;
      if (v >= 1 && v !== z) wrong.add(String(v));
      if (wrong.size >= 3) break;
    }
    out.push({ category: "sciences", difficulty: Math.min(6, d + 1), question: `Quel est le numéro atomique de l'élément « ${name} » ?`, correct: String(z), wrong: [...wrong].slice(0, 3) });
  }
  return [...out, ...fromRows(ROWS)];
}
