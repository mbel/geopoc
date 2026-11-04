import type { Rng } from "@geoclash/engine";
import { distract, fromRows, type Gen, type Row } from "./lib";

const WORLD_CUP: [number, string, number][] = [
  [1930, "L'Uruguay", 5], [1934, "L'Italie", 5], [1938, "L'Italie", 5], [1950, "L'Uruguay", 5], [1958, "Le Brésil", 4], [1962, "Le Brésil", 4],
  [1966, "L'Angleterre", 3], [1970, "Le Brésil", 3], [1978, "L'Argentine", 4], [1982, "L'Italie", 4], [1986, "L'Argentine", 3], [1990, "L'Allemagne", 3],
  [1994, "Le Brésil", 3], [1998, "La France", 1], [2002, "Le Brésil", 2], [2006, "L'Italie", 2], [2010, "L'Espagne", 2], [2014, "L'Allemagne", 2], [2022, "L'Argentine", 2],
];
const FOOT_NATIONS = ["Le Brésil", "L'Allemagne", "L'Italie", "L'Argentine", "La France", "L'Espagne", "L'Angleterre", "L'Uruguay", "Les Pays-Bas", "La Croatie"];

const SUMMER: [number, string, number][] = [
  [1896, "Athènes", 4], [1900, "Paris", 4], [1924, "Paris", 3], [1948, "Londres", 4], [1952, "Helsinki", 5], [1956, "Melbourne", 5], [1960, "Rome", 4], [1964, "Tokyo", 4],
  [1968, "Mexico", 4], [1972, "Munich", 4], [1976, "Montréal", 4], [1980, "Moscou", 3], [1984, "Los Angeles", 3], [1988, "Séoul", 3], [1996, "Atlanta", 3],
  [2000, "Sydney", 2], [2004, "Athènes", 2], [2008, "Pékin", 2], [2012, "Londres", 2], [2016, "Rio de Janeiro", 1], [2024, "Paris", 1],
];
const WINTER: [number, string, number][] = [
  [1924, "Chamonix", 5], [1968, "Grenoble", 4], [1980, "Lake Placid", 5], [1988, "Calgary", 5], [1992, "Albertville", 3], [1994, "Lillehammer", 5],
  [1998, "Nagano", 4], [2002, "Salt Lake City", 4], [2006, "Turin", 4], [2010, "Vancouver", 3], [2014, "Sotchi", 3], [2018, "PyeongChang", 3], [2022, "Pékin", 2],
];
const HOSTS = ["Athènes", "Paris", "Londres", "Helsinki", "Melbourne", "Rome", "Tokyo", "Mexico", "Munich", "Montréal", "Moscou", "Los Angeles", "Séoul", "Barcelone", "Atlanta", "Sydney", "Pékin", "Rio de Janeiro", "Berlin", "Amsterdam", "Stockholm"];
const WINTER_HOSTS = ["Chamonix", "Grenoble", "Lake Placid", "Calgary", "Albertville", "Lillehammer", "Nagano", "Salt Lake City", "Turin", "Vancouver", "Sotchi", "PyeongChang", "Sapporo", "Innsbruck", "Sarajevo", "Oslo"];

const ROWS: Row[] = [
  ["sport", 1, "Combien de joueurs une équipe de basket aligne-t-elle sur le terrain ?", "5", "6", "7", "11"],
  ["sport", 1, "Combien de joueurs compte une équipe de rugby à XV ?", "15", "13", "11", "7"],
  ["sport", 1, "Quel tournoi de tennis se joue sur terre battue à Paris ?", "Roland-Garros", "Wimbledon", "L'US Open", "L'Open d'Australie"],
  ["sport", 1, "Quel tournoi de tennis se joue sur gazon à Londres ?", "Wimbledon", "Roland-Garros", "L'US Open", "Flushing Meadows"],
  ["sport", 1, "De quelle couleur est le maillot du leader du Tour de France ?", "Jaune", "Vert", "Blanc", "À pois"],
  ["sport", 1, "Dans quel sport utilise-t-on un volant ?", "Le badminton", "Le tennis", "Le squash", "Le ping-pong"],
  ["sport", 1, "Quel footballeur est surnommé « CR7 » ?", "Cristiano Ronaldo", "Lionel Messi", "Neymar", "Kylian Mbappé"],
  ["sport", 1, "Quel basketteur a porté le numéro 23 aux Chicago Bulls ?", "Michael Jordan", "Magic Johnson", "Kobe Bryant", "Scottie Pippen"],
  ["sport", 1, "Quel sport pratique-t-on lors du Super Bowl ?", "Le football américain", "Le baseball", "Le basket-ball", "Le hockey sur glace"],
  ["sport", 2, "Quelle distance mesure un marathon ?", "42,195 km", "40 km", "21,097 km", "50 km"],
  ["sport", 2, "Combien de trous compte un parcours de golf standard ?", "18", "9", "12", "24"],
  ["sport", 2, "Dans quel pays le judo est-il né ?", "Le Japon", "La Chine", "La Corée du Sud", "La Mongolie"],
  ["sport", 2, "Combien de joueurs compte une équipe de volley-ball sur le terrain ?", "6", "5", "7", "9"],
  ["sport", 2, "Quel pays a remporté le plus de Coupes du monde de football ?", "Le Brésil", "L'Allemagne", "L'Italie", "L'Argentine"],
  ["sport", 2, "Quel sprinteur détient le record du monde du 100 m (9 s 58) ?", "Usain Bolt", "Carl Lewis", "Justin Gatlin", "Tyson Gay"],
  ["sport", 2, "Quel club joue ses matchs au Camp Nou ?", "Le FC Barcelone", "Le Real Madrid", "L'Atlético de Madrid", "Valence"],
  ["sport", 2, "Quel club de football joue au Parc des Princes ?", "Le Paris Saint-Germain", "L'Olympique de Marseille", "L'Olympique lyonnais", "Monaco"],
  ["sport", 2, "Quelle course automobile mythique se déroule chaque année dans la Sarthe ?", "Les 24 Heures du Mans", "Le Grand Prix de Monaco", "Les 500 miles d'Indianapolis", "Le Paris-Dakar"],
  ["sport", 2, "Quel boxeur surnommé « The Greatest » a marqué l'histoire des poids lourds ?", "Mohamed Ali", "Mike Tyson", "George Foreman", "Joe Frazier"],
  ["sport", 3, "Combien de sets faut-il gagner pour remporter un match de Grand Chelem masculin ?", "3", "2", "4", "5"],
  ["sport", 3, "Combien de joueurs compte une équipe de handball sur le terrain (gardien compris) ?", "7", "6", "9", "11"],
  ["sport", 3, "Quel club joue ses matchs à Old Trafford ?", "Manchester United", "Liverpool", "Chelsea", "Arsenal"],
  ["sport", 3, "Quel club joue ses matchs à Anfield ?", "Liverpool", "Manchester City", "Everton", "Tottenham"],
  ["sport", 3, "Quel club espagnol est surnommé « les Merengues » ?", "Le Real Madrid", "Le FC Barcelone", "Séville", "Valence"],
  ["sport", 3, "Quel pilote allemand a remporté sept titres de champion du monde de Formule 1 ?", "Michael Schumacher", "Sebastian Vettel", "Nico Rosberg", "Ralf Schumacher"],
  ["sport", 3, "Dans quel sport joue-t-on la Coupe Davis ?", "Le tennis", "Le golf", "Le rugby", "Le cricket"],
  ["sport", 3, "Quel judoka français est multiple champion olympique et du monde dans la catégorie des plus de 100 kg ?", "Teddy Riner", "Djamel Bouras", "Lucie Décosse", "Marie-Claire Restoux"],
  ["sport", 3, "Quelle gymnaste américaine a remporté quatre médailles d'or aux Jeux olympiques de Rio en 2016 ?", "Simone Biles", "Gabby Douglas", "Nadia Comăneci", "Aly Raisman"],
  ["sport", 3, "Quel joueur est surnommé « La Pulga » ?", "Lionel Messi", "Diego Maradona", "Neymar", "Ronaldinho"],
  ["sport", 4, "Quel cycliste espagnol a remporté cinq Tours de France consécutifs entre 1991 et 1995 ?", "Miguel Indurain", "Alberto Contador", "Pedro Delgado", "Óscar Freire"],
  ["sport", 4, "Quel pilote brésilien a remporté trois titres de champion du monde de F1 (1988, 1990, 1991) ?", "Ayrton Senna", "Nelson Piquet", "Emerson Fittipaldi", "Rubens Barrichello"],
  ["sport", 4, "Combien de points vaut un essai transformé au rugby à XV ?", "7", "5", "6", "8"],
  ["sport", 4, "Quelle est la hauteur réglementaire d'un panier de basket ?", "3,05 m", "2,80 m", "3,30 m", "2,50 m"],
  ["sport", 4, "Quelle équipe a remporté la Coupe du monde de rugby en 2019 ?", "L'Afrique du Sud", "L'Angleterre", "La Nouvelle-Zélande", "Le pays de Galles"],
  ["sport", 4, "Quel nageur français a remporté l'or olympique du 50 m nage libre à Londres en 2012 ?", "Florent Manaudou", "Alain Bernard", "Yannick Agnel", "Camille Lacourt"],
  ["sport", 4, "Dans quel sport joue-t-on la Ryder Cup ?", "Le golf", "Le tennis", "Le rugby", "Le cricket"],
  ["sport", 5, "Comment s'appelle le trophée de la Coupe du monde de rugby ?", "La coupe Webb Ellis", "Le Bouclier de Brennus", "La Calcutta Cup", "Le Trophée Jules-Rimet"],
];

export function generateSport(rng: Rng): Gen[] {
  const out: Gen[] = [];
  for (const [y, w, d] of WORLD_CUP)
    out.push({ category: "sport", difficulty: d, question: `Quel pays a remporté la Coupe du monde de football en ${y} ?`, correct: w, wrong: distract(rng, FOOT_NATIONS, w) });
  for (const [y, c, d] of SUMMER)
    out.push({ category: "sport", difficulty: d, question: `Quelle ville a accueilli les Jeux olympiques d'été de ${y} ?`, correct: c, wrong: distract(rng, HOSTS, c) });
  for (const [y, c, d] of WINTER)
    out.push({ category: "sport", difficulty: d, question: `Quelle ville a accueilli les Jeux olympiques d'hiver de ${y} ?`, correct: c, wrong: distract(rng, WINTER_HOSTS, c) });
  return [...out, ...fromRows(ROWS)];
}
