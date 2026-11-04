import type { Rng } from "@geoclash/engine";
import { distract, fromRows, type Gen, type Row } from "./lib";

type Pair = [work: string, maker: string, difficulty: number];

const PAINTINGS: Pair[] = [
  ["Guernica", "Pablo Picasso", 1], ["Les Tournesols", "Vincent van Gogh", 2], ["Les Nymphéas", "Claude Monet", 2], ["Le Cri", "Edvard Munch", 2],
  ["Le Baiser (1907-1908)", "Gustav Klimt", 2], ["La Persistance de la mémoire", "Salvador Dalí", 2], ["La Cène", "Léonard de Vinci", 2],
  ["La Création d'Adam (plafond de la chapelle Sixtine)", "Michel-Ange", 2], ["La Liberté guidant le peuple", "Eugène Delacroix", 2],
  ["Impression, soleil levant", "Claude Monet", 3], ["La Naissance de Vénus", "Sandro Botticelli", 3], ["La Ronde de nuit", "Rembrandt", 3],
  ["La Jeune Fille à la perle", "Johannes Vermeer", 3], ["Les Demoiselles d'Avignon", "Pablo Picasso", 3], ["L'Homme de Vitruve", "Léonard de Vinci", 3],
  ["Les Ménines", "Diego Vélasquez", 4], ["Le Radeau de la Méduse", "Théodore Géricault", 4], ["Un bar aux Folies-Bergère", "Édouard Manet", 5],
  ["Un dimanche après-midi à l'île de la Grande Jatte", "Georges Seurat", 4], ["La Danse", "Henri Matisse", 4], ["Le Sacre de Napoléon", "Jacques-Louis David", 4],
  ["L'École d'Athènes", "Raphaël", 4], ["Les Glaneuses", "Jean-François Millet", 5], ["Les Joueurs de cartes", "Paul Cézanne", 5], ["Olympia", "Édouard Manet", 5],
  ["La Mort de Marat", "Jacques-Louis David", 5], ["Composition VIII", "Vassily Kandinsky", 6], ["American Gothic", "Grant Wood", 6],
];
const SCULPTURES: Pair[] = [["Le Penseur", "Auguste Rodin", 2], ["David (Florence)", "Michel-Ange", 2], ["La Pietà (basilique Saint-Pierre)", "Michel-Ange", 4], ["La Statue de la Liberté", "Frédéric Auguste Bartholdi", 4]];
const MUSIC: Pair[] = [
  ["la Symphonie n° 5 (« ta-ta-ta-taaa »)", "Ludwig van Beethoven", 1], ["l'Ode à la joie (9e symphonie)", "Ludwig van Beethoven", 2], ["Le Lac des cygnes", "Piotr Ilitch Tchaïkovski", 2],
  ["Casse-Noisette", "Piotr Ilitch Tchaïkovski", 2], ["le Boléro", "Maurice Ravel", 2], ["Clair de lune", "Claude Debussy", 2], ["Carmen", "Georges Bizet", 2],
  ["La Traviata", "Giuseppe Verdi", 3], ["Aïda", "Giuseppe Verdi", 3], ["La Bohème", "Giacomo Puccini", 3], ["Tosca", "Giacomo Puccini", 3],
  ["Le Beau Danube bleu", "Johann Strauss fils", 3], ["Pierre et le Loup", "Sergueï Prokofiev", 3], ["La Mer", "Claude Debussy", 4], ["les Gymnopédies", "Erik Satie", 4], ["La Walkyrie", "Richard Wagner", 4], ["Le Messie", "Georg Friedrich Haendel", 4],
  ["la Symphonie fantastique", "Hector Berlioz", 4], ["Peer Gynt", "Edvard Grieg", 4], ["Le Sacre du printemps", "Igor Stravinsky", 4], ["Rhapsody in Blue", "George Gershwin", 4],
  ["Les Variations Goldberg", "Jean-Sébastien Bach", 5], ["Les Tableaux d'une exposition", "Modeste Moussorgski", 5], ["Finlandia", "Jean Sibelius", 5],
  ["La Campanella", "Franz Liszt", 5], ["Le Barbier de Séville (opéra)", "Gioachino Rossini", 4], ["L'Anneau du Nibelung", "Richard Wagner", 5],
];

const ROWS: Row[] = [
  ["arts", 1, "Dans quelle ville se trouve le musée d'Orsay ?", "Paris", "Lyon", "Bruxelles", "Londres"],
  ["arts", 1, "Combien de cordes compte une guitare classique ?", "6", "4", "7", "12"],
  ["arts", 1, "Combien de cordes compte un violon ?", "4", "6", "5", "8"],
  ["arts", 1, "Combien de notes compte la gamme de do à si ?", "7", "5", "8", "12"],
  ["arts", 1, "Quel prix prestigieux est remis au Festival de Cannes ?", "La Palme d'or", "L'Ours d'or", "Le Lion d'or", "L'Oscar"],
  ["arts", 2, "Quel architecte a conçu la Sagrada Família ?", "Antoni Gaudí", "Le Corbusier", "Frank Lloyd Wright", "Oscar Niemeyer"],
  ["arts", 2, "Quel courant artistique est associé à Claude Monet ?", "L'impressionnisme", "Le cubisme", "Le surréalisme", "Le fauvisme"],
  ["arts", 2, "Quel courant artistique est associé à Salvador Dalí ?", "Le surréalisme", "L'impressionnisme", "Le cubisme", "Le pop art"],
  ["arts", 2, "Quel courant artistique est associé à Picasso et Braque ?", "Le cubisme", "Le fauvisme", "Le dadaïsme", "Le romantisme"],
  ["arts", 2, "Dans quelle ville se trouve le MoMA, musée d'art moderne ?", "New York", "Chicago", "Los Angeles", "Boston"],
  ["arts", 2, "Quel instrument à tuyaux possède un ou plusieurs claviers et des pédales ?", "L'orgue", "Le clavecin", "L'accordéon", "Le piano"],
  ["arts", 2, "Comment appelle-t-on l'industrie du cinéma indien centrée à Bombay ?", "Bollywood", "Nollywood", "Hollywood", "Cinecittà"],
  ["arts", 2, "Quelle clé note les sons aigus en musique ?", "La clé de sol", "La clé de fa", "La clé d'ut", "La clé de ré"],
  ["arts", 3, "Quel architecte a conçu la pyramide du Louvre ?", "Ieoh Ming Pei", "Jean Nouvel", "Renzo Piano", "Norman Foster"],
  ["arts", 3, "Quel architecte a conçu l'opéra de Paris inauguré en 1875 ?", "Charles Garnier", "Gustave Eiffel", "Haussmann", "Viollet-le-Duc"],
  ["arts", 3, "Quel courant artistique est associé à Andy Warhol ?", "Le pop art", "L'impressionnisme", "Le cubisme", "Le baroque"],
  ["arts", 3, "Dans quelle ville se trouve le musée du Prado ?", "Madrid", "Barcelone", "Séville", "Lisbonne"],
  ["arts", 3, "Dans quelle ville se trouve la galerie des Offices (Uffizi) ?", "Florence", "Rome", "Venise", "Milan"],
  ["arts", 3, "Dans quelle ville se trouve le Rijksmuseum ?", "Amsterdam", "La Haye", "Bruxelles", "Rotterdam"],
  ["arts", 3, "Quelle voix masculine est la plus grave dans un chœur ?", "La basse", "Le ténor", "Le baryton", "Le contre-ténor"],
  ["arts", 4, "Quel architecte a conçu le musée Guggenheim de Bilbao ?", "Frank Gehry", "Zaha Hadid", "Rem Koolhaas", "Santiago Calatrava"],
  ["arts", 4, "Quel architecte a conçu la villa Savoye ?", "Le Corbusier", "Auguste Perret", "Mies van der Rohe", "Alvar Aalto"],
  ["arts", 4, "Quelle technique de peinture utilise de petits points de couleur juxtaposés ?", "Le pointillisme", "Le fauvisme", "Le tachisme", "La fresque"],
  ["arts", 4, "Dans quelle ville se trouve le musée de l'Ermitage ?", "Saint-Pétersbourg", "Moscou", "Kiev", "Vienne"],
  ["arts", 5, "Quel est le plus ancien festival de cinéma du monde ?", "La Mostra de Venise", "Le Festival de Cannes", "La Berlinale", "Le Festival de Locarno"],
];

export function generateArts(rng: Rng): Gen[] {
  const painters = [...new Set([...PAINTINGS, ...SCULPTURES].map((p) => p[1]))];
  const composers = [...new Set(MUSIC.map((p) => p[1]))];
  const out: Gen[] = [];
  for (const [w, a, d] of PAINTINGS) out.push({ category: "arts", difficulty: d, question: `Qui a peint « ${w} » ?`, correct: a, wrong: distract(rng, painters, a) });
  for (const [w, a, d] of SCULPTURES) out.push({ category: "arts", difficulty: d, question: `Qui a réalisé la sculpture « ${w} » ?`, correct: a, wrong: distract(rng, painters, a) });
  for (const [w, a, d] of MUSIC) out.push({ category: "arts", difficulty: d, question: `Qui a composé ${w.startsWith("la ") || w.startsWith("le ") || w.startsWith("les ") || w.startsWith("l'") ? w : "« " + w + " »"} ?`, correct: a, wrong: distract(rng, composers, a) });
  return [...out, ...fromRows(ROWS)];
}
