import type { Rng } from "@geoclash/engine";
import { distract, fromRows, type Gen, type Row } from "./lib";

type Work = [work: string, author: string, difficulty: number];
const WORKS: Work[] = [
  ["Notre-Dame de Paris", "Victor Hugo", 1], ["Les Trois Mousquetaires", "Alexandre Dumas", 2], ["Le Comte de Monte-Cristo", "Alexandre Dumas", 2],
  ["Germinal", "Émile Zola", 2], ["Nana", "Émile Zola", 3], ["L'Assommoir", "Émile Zola", 4], ["Madame Bovary", "Gustave Flaubert", 3],
  ["Le Rouge et le Noir", "Stendhal", 3], ["Le Père Goriot", "Honoré de Balzac", 3], ["L'Étranger", "Albert Camus", 2], ["La Peste", "Albert Camus", 3],
  ["La Nausée", "Jean-Paul Sartre", 3], ["Huis clos", "Jean-Paul Sartre", 4], ["Le Deuxième Sexe", "Simone de Beauvoir", 4],
  ["À la recherche du temps perdu", "Marcel Proust", 3], ["Vingt mille lieues sous les mers", "Jules Verne", 1],
  ["Le Tour du monde en quatre-vingts jours", "Jules Verne", 1], ["Voyage au centre de la Terre", "Jules Verne", 2],
  ["La Cigale et la Fourmi", "Jean de La Fontaine", 1], ["Le Malade imaginaire", "Molière", 2], ["Tartuffe", "Molière", 2], ["L'Avare", "Molière", 2],
  ["Le Bourgeois gentilhomme", "Molière", 2], ["Dom Juan", "Molière", 3], ["Le Cid", "Pierre Corneille", 3], ["Phèdre", "Jean Racine", 4],
  ["Candide", "Voltaire", 2], ["Zadig", "Voltaire", 4], ["Les Confessions", "Jean-Jacques Rousseau", 4], ["Gargantua", "François Rabelais", 4],
  ["Cyrano de Bergerac", "Edmond Rostand", 3], ["Les Liaisons dangereuses", "Pierre Choderlos de Laclos", 5], ["Bel-Ami", "Guy de Maupassant", 3],
  ["Le Horla", "Guy de Maupassant", 4], ["Le Mariage de Figaro", "Beaumarchais", 4], ["Les Lettres de mon moulin", "Alphonse Daudet", 3],
  ["La Gloire de mon père", "Marcel Pagnol", 3], ["Sans famille", "Hector Malot", 3], ["Bonjour tristesse", "Françoise Sagan", 4],
  ["L'Écume des jours", "Boris Vian", 4], ["La Condition humaine", "André Malraux", 5], ["Vol de nuit", "Antoine de Saint-Exupéry", 5],
  ["Le Grand Meaulnes", "Alain-Fournier", 5], ["En attendant Godot", "Samuel Beckett", 4], ["La Cantatrice chauve", "Eugène Ionesco", 5],
  ["Les Mémoires d'outre-tombe", "François-René de Chateaubriand", 6], ["Manon Lescaut", "L'abbé Prévost", 6], ["Voyage au bout de la nuit", "Louis-Ferdinand Céline", 5],
  ["Le Seigneur des anneaux", "J. R. R. Tolkien", 1], ["Le Hobbit", "J. R. R. Tolkien", 1], ["1984", "George Orwell", 2], ["La Ferme des animaux", "George Orwell", 3],
  ["Le Meilleur des mondes", "Aldous Huxley", 4], ["Orgueil et Préjugés", "Jane Austen", 3], ["Les Hauts de Hurlevent", "Emily Brontë", 4],
  ["Jane Eyre", "Charlotte Brontë", 4], ["Oliver Twist", "Charles Dickens", 2], ["Un chant de Noël", "Charles Dickens", 2],
  ["Roméo et Juliette", "William Shakespeare", 1], ["Hamlet", "William Shakespeare", 1], ["Macbeth", "William Shakespeare", 2], ["Othello", "William Shakespeare", 3],
  ["Don Quichotte", "Miguel de Cervantes", 2], ["La Divine Comédie", "Dante Alighieri", 3], ["Le Décaméron", "Boccace", 5], ["Faust", "Johann Wolfgang von Goethe", 4],
  ["Crime et Châtiment", "Fiodor Dostoïevski", 3], ["Les Frères Karamazov", "Fiodor Dostoïevski", 4], ["Guerre et Paix", "Léon Tolstoï", 2],
  ["Anna Karénine", "Léon Tolstoï", 3], ["Le Maître et Marguerite", "Mikhaïl Boulgakov", 5], ["Lolita", "Vladimir Nabokov", 4],
  ["Le Vieil Homme et la Mer", "Ernest Hemingway", 3], ["Les Raisins de la colère", "John Steinbeck", 4], ["Moby Dick", "Herman Melville", 3],
  ["Les Aventures de Tom Sawyer", "Mark Twain", 2], ["Gatsby le Magnifique", "F. Scott Fitzgerald", 3], ["L'Attrape-cœurs", "J. D. Salinger", 4],
  ["Ne tirez pas sur l'oiseau moqueur", "Harper Lee", 5], ["Cent ans de solitude", "Gabriel García Márquez", 3], ["Le Procès", "Franz Kafka", 4],
  ["La Métamorphose", "Franz Kafka", 3], ["Ulysse", "James Joyce", 5], ["Dracula", "Bram Stoker", 2], ["Frankenstein", "Mary Shelley", 2],
  ["L'Île au trésor", "Robert Louis Stevenson", 2], ["Alice au pays des merveilles", "Lewis Carroll", 1], ["Peter Pan", "J. M. Barrie", 2],
  ["Le Livre de la jungle", "Rudyard Kipling", 2], ["Sherlock Holmes", "Arthur Conan Doyle", 1], ["Hercule Poirot", "Agatha Christie", 1],
  ["Arsène Lupin", "Maurice Leblanc", 2], ["Maigret", "Georges Simenon", 3], ["Le Parfum", "Patrick Süskind", 4], ["Le Nom de la rose", "Umberto Eco", 4],
  ["L'Iliade", "Homère", 2], ["L'Odyssée", "Homère", 2], ["L'Énéide", "Virgile", 3], ["Les Métamorphoses", "Ovide", 4], ["La République", "Platon", 4],
  ["L'Art de la guerre", "Sun Tzu", 3],
];

const ROWS: Row[] = [
  ["culture", 1, "Combien de lettres compte l'alphabet français ?", "26", "24", "28", "25"],
  ["culture", 1, "Quelle est la devise de la République française ?", "Liberté, Égalité, Fraternité", "Travail, Famille, Patrie", "Dieu et mon droit", "Unité, Travail, Progrès"],
  ["culture", 1, "Quel est l'hymne national français ?", "La Marseillaise", "Le Chant des partisans", "L'Internationale", "La Parisienne"],
  ["culture", 1, "Quel jour célèbre-t-on la fête nationale française ?", "Le 14 juillet", "Le 11 novembre", "Le 8 mai", "Le 1er mai"],
  ["culture", 1, "Quelle religion a pour livre sacré le Coran ?", "L'islam", "Le judaïsme", "Le christianisme", "L'hindouisme"],
  ["culture", 1, "Combien d'États comptent les États-Unis ?", "50", "48", "52", "51"],
  ["culture", 1, "Quel dieu grec est le roi des dieux ?", "Zeus", "Poséidon", "Hadès", "Apollon"],
  ["culture", 2, "Quel est l'équivalent romain du dieu grec Zeus ?", "Jupiter", "Mars", "Neptune", "Apollon"],
  ["culture", 2, "Quel dieu grec règne sur la mer ?", "Poséidon", "Zeus", "Hadès", "Arès"],
  ["culture", 2, "Quel héros grec a accompli douze travaux ?", "Héraclès", "Persée", "Thésée", "Achille"],
  ["culture", 2, "Quel dieu nordique manie le marteau Mjöllnir ?", "Thor", "Odin", "Loki", "Freyr"],
  ["culture", 2, "Comment s'appelle le mois de jeûne des musulmans ?", "Le ramadan", "Le carême", "Le hajj", "L'Aïd"],
  ["culture", 2, "Quelle langue parle-t-on majoritairement au Mexique ?", "L'espagnol", "Le portugais", "L'anglais", "Le nahuatl"],
  ["culture", 2, "Quelle est la langue officielle de l'Autriche ?", "L'allemand", "Le français", "L'italien", "Le hongrois"],
  ["culture", 2, "Quelle ville musulmane d'Arabie saoudite est le principal lieu de pèlerinage de l'islam ?", "La Mecque", "Médine", "Jérusalem", "Karbala"],
  ["culture", 2, "Quel est le nom de l'organisation internationale dont le siège est à New York et qui réunit presque tous les États ?", "L'ONU", "L'OTAN", "L'OMC", "L'UNESCO"],
  ["culture", 3, "Quelle déesse grecque correspond à la déesse romaine Vénus ?", "Aphrodite", "Athéna", "Héra", "Artémis"],
  ["culture", 3, "Quel monstre mythologique avait des serpents pour cheveux ?", "Méduse", "Le Minotaure", "L'Hydre", "La Chimère"],
  ["culture", 3, "Quel héros grec a tué le Minotaure ?", "Thésée", "Persée", "Ulysse", "Jason"],
  ["culture", 3, "Quel est le dieu principal de la mythologie nordique ?", "Odin", "Thor", "Loki", "Baldr"],
  ["culture", 3, "Comment appelle-t-on le livre sacré du judaïsme ?", "La Torah", "Le Coran", "Les Védas", "Le Tripitaka"],
  ["culture", 3, "Quelle fête hindoue est la fête des lumières ?", "Diwali", "Holi", "Navaratri", "Ganesh Chaturthi"],
  ["culture", 3, "Quel philosophe grec a fondé l'Académie à Athènes ?", "Platon", "Aristote", "Socrate", "Pythagore"],
  ["culture", 3, "Quel philosophe français a écrit « Les Pensées » ?", "Blaise Pascal", "René Descartes", "Michel de Montaigne", "Voltaire"],
  ["culture", 3, "Combien d'étoiles compte le drapeau de l'Union européenne ?", "12", "15", "27", "10"],
  ["culture", 3, "Combien de bandes compte le drapeau des États-Unis ?", "13", "50", "12", "15"],
  ["culture", 3, "Quelle est la langue maternelle la plus parlée au monde ?", "Le mandarin", "L'anglais", "L'espagnol", "Le hindi"],
  ["culture", 3, "Quelle organisation a son siège à Genève et s'occupe de santé mondiale ?", "L'OMS", "L'UNESCO", "La FAO", "L'UNICEF"],
  ["culture", 4, "Quel dieu égyptien à tête de chacal est lié à l'embaumement ?", "Anubis", "Horus", "Osiris", "Seth"],
  ["culture", 4, "Quelle fête juive marque le Nouvel An ?", "Roch Hachana", "Yom Kippour", "Pessah", "Hanoucca"],
  ["culture", 4, "Quel philosophe allemand a écrit « Ainsi parlait Zarathoustra » ?", "Friedrich Nietzsche", "Emmanuel Kant", "Georg Hegel", "Arthur Schopenhauer"],
  ["culture", 4, "Dans quelle ville se trouve le siège officiel du Parlement européen ?", "Strasbourg", "Bruxelles", "Luxembourg", "Francfort"],
  ["culture", 4, "Combien de lettres compte l'alphabet grec ?", "24", "26", "22", "28"],
  ["culture", 4, "Dans quelle langue l'essentiel de l'Ancien Testament a-t-il été écrit ?", "L'hébreu", "Le grec", "Le latin", "L'araméen"],
  ["culture", 4, "Comment s'appelle la chambre basse du Parlement britannique ?", "La Chambre des communes", "La Chambre des lords", "Le Sénat", "Le Bundestag"],
  ["culture", 5, "Quel philosophe a écrit la « Critique de la raison pure » ?", "Emmanuel Kant", "Georg Hegel", "Friedrich Nietzsche", "David Hume"],
];

export function generateCulture(rng: Rng): Gen[] {
  const authors = [...new Set(WORKS.map((w) => w[1]))];
  const out: Gen[] = WORKS.map(([work, author, d]) => {
    const q = work === "Sherlock Holmes" || work === "Hercule Poirot" || work === "Arsène Lupin" || work === "Maigret"
      ? `Qui a créé le personnage de ${work} ?`
      : `Qui a écrit « ${work} » ?`;
    return { category: "culture", difficulty: d, question: q, correct: author, wrong: distract(rng, authors, author) };
  });
  return [...out, ...fromRows(ROWS)];
}
