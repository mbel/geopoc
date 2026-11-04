import type { Rng } from "@geoclash/engine";
import { capFirst, distract, fromRows, sample, stripArticle, type Gen, type Row } from "./lib";

type Cap = [prep: string, capital: string, continent: string, difficulty: number];

/** Capitales (nom d'usage en français). Pays dont la capitale prête à débat volontairement exclus. */
const CAPITALS: Cap[] = [
  // Europe
  ["de la France", "Paris", "EU", 1], ["de l'Italie", "Rome", "EU", 1], ["de l'Espagne", "Madrid", "EU", 1],
  ["de l'Allemagne", "Berlin", "EU", 1], ["du Royaume-Uni", "Londres", "EU", 1], ["de la Russie", "Moscou", "EU", 1],
  ["du Portugal", "Lisbonne", "EU", 2], ["de la Grèce", "Athènes", "EU", 2], ["de la Belgique", "Bruxelles", "EU", 2],
  ["de l'Autriche", "Vienne", "EU", 2], ["de la Pologne", "Varsovie", "EU", 2], ["de la Suède", "Stockholm", "EU", 2],
  ["de la Norvège", "Oslo", "EU", 2], ["de la Finlande", "Helsinki", "EU", 2], ["du Danemark", "Copenhague", "EU", 2],
  ["de l'Irlande", "Dublin", "EU", 2], ["de la Suisse", "Berne", "EU", 3], ["de la Hongrie", "Budapest", "EU", 3],
  ["de la République tchèque", "Prague", "EU", 3], ["de la Roumanie", "Bucarest", "EU", 3], ["de la Bulgarie", "Sofia", "EU", 3],
  ["de la Croatie", "Zagreb", "EU", 3], ["de la Serbie", "Belgrade", "EU", 3], ["de la Turquie", "Ankara", "AS", 3],
  ["de l'Islande", "Reykjavik", "EU", 3], ["de la Slovaquie", "Bratislava", "EU", 4],
  ["de la Slovénie", "Ljubljana", "EU", 4], ["de la Lituanie", "Vilnius", "EU", 4], ["de la Lettonie", "Riga", "EU", 4],
  ["de l'Estonie", "Tallinn", "EU", 4], ["de la Bosnie-Herzégovine", "Sarajevo", "EU", 4], ["de la Biélorussie", "Minsk", "EU", 4],
  ["de Malte", "La Valette", "EU", 5], ["de l'Albanie", "Tirana", "EU", 5], ["de la Macédoine du Nord", "Skopje", "EU", 5],
  ["du Monténégro", "Podgorica", "EU", 5], ["de Chypre", "Nicosie", "EU", 5], ["de la Moldavie", "Chisinau", "EU", 6], ["du Liechtenstein", "Vaduz", "EU", 6],
  // Asie
  ["du Japon", "Tokyo", "AS", 1], ["de la Chine", "Pékin", "AS", 1], ["de l'Inde", "New Delhi", "AS", 2],
  ["de la Corée du Sud", "Séoul", "AS", 2], ["de la Thaïlande", "Bangkok", "AS", 2], ["du Vietnam", "Hanoï", "AS", 3],
  ["de l'Indonésie", "Jakarta", "AS", 3], ["des Philippines", "Manille", "AS", 3], ["de la Malaisie", "Kuala Lumpur", "AS", 3],
  ["du Pakistan", "Islamabad", "AS", 3], ["de l'Iran", "Téhéran", "AS", 3], ["de l'Irak", "Bagdad", "AS", 3],
  ["de l'Arabie saoudite", "Riyad", "AS", 3], ["de la Jordanie", "Amman", "AS", 3], ["du Liban", "Beyrouth", "AS", 3],
  ["de la Syrie", "Damas", "AS", 3], ["de la Corée du Nord", "Pyongyang", "AS", 3], ["du Bangladesh", "Dacca", "AS", 4],
  ["de l'Afghanistan", "Kaboul", "AS", 4], ["du Népal", "Katmandou", "AS", 4], ["de la Mongolie", "Oulan-Bator", "AS", 4],
  ["du Cambodge", "Phnom Penh", "AS", 4], ["du Qatar", "Doha", "AS", 4], ["des Émirats arabes unis", "Abou Dabi", "AS", 4],
  ["du Kazakhstan", "Astana", "AS", 5], ["de l'Ouzbékistan", "Tachkent", "AS", 5], ["du Laos", "Vientiane", "AS", 5],
  ["d'Oman", "Mascate", "AS", 5], ["de l'Azerbaïdjan", "Bakou", "AS", 5], ["de la Géorgie", "Tbilissi", "AS", 5],
  ["de l'Arménie", "Erevan", "AS", 5], ["du Yémen", "Sanaa", "AS", 5], ["du Bhoutan", "Thimphou", "AS", 6],
  ["des Maldives", "Malé", "AS", 6], ["du Turkménistan", "Achgabat", "AS", 6], ["du Kirghizistan", "Bichkek", "AS", 6],
  ["du Tadjikistan", "Douchanbé", "AS", 6],
  // Afrique
  ["de l'Égypte", "Le Caire", "AF", 1], ["du Maroc", "Rabat", "AF", 2], ["de l'Algérie", "Alger", "AF", 2],
  ["de la Tunisie", "Tunis", "AF", 2], ["du Sénégal", "Dakar", "AF", 2], ["du Kenya", "Nairobi", "AF", 3],
  ["du Nigeria", "Abuja", "AF", 4], ["de l'Éthiopie", "Addis-Abeba", "AF", 4], ["du Ghana", "Accra", "AF", 4],
  ["de Madagascar", "Antananarivo", "AF", 4], ["du Cameroun", "Yaoundé", "AF", 4], ["de la Libye", "Tripoli", "AF", 4],
  ["du Soudan", "Khartoum", "AF", 4], ["du Mali", "Bamako", "AF", 4], ["de la République démocratique du Congo", "Kinshasa", "AF", 4],
  ["de l'Angola", "Luanda", "AF", 5], ["du Mozambique", "Maputo", "AF", 5], ["de l'Ouganda", "Kampala", "AF", 5],
  ["du Rwanda", "Kigali", "AF", 5], ["de la Namibie", "Windhoek", "AF", 5], ["du Zimbabwe", "Harare", "AF", 5],
  ["de la Zambie", "Lusaka", "AF", 5], ["du Niger", "Niamey", "AF", 5], ["du Tchad", "N'Djamena", "AF", 5],
  ["de la Somalie", "Mogadiscio", "AF", 5], ["du Gabon", "Libreville", "AF", 5], ["de la Mauritanie", "Nouakchott", "AF", 5],
  ["du Burkina Faso", "Ouagadougou", "AF", 5], ["du Togo", "Lomé", "AF", 5], ["de la Guinée", "Conakry", "AF", 5],
  ["du Botswana", "Gaborone", "AF", 6], ["du Malawi", "Lilongwe", "AF", 6], ["de l'Érythrée", "Asmara", "AF", 6],
  ["du Lesotho", "Maseru", "AF", 6],
  // Amériques
  ["des États-Unis", "Washington", "AM", 2], ["du Canada", "Ottawa", "AM", 2], ["du Mexique", "Mexico", "AM", 2],
  ["du Brésil", "Brasilia", "AM", 2], ["de l'Argentine", "Buenos Aires", "AM", 2], ["du Chili", "Santiago", "AM", 3],
  ["du Pérou", "Lima", "AM", 3], ["de la Colombie", "Bogota", "AM", 3], ["du Venezuela", "Caracas", "AM", 3],
  ["de Cuba", "La Havane", "AM", 3], ["de l'Équateur", "Quito", "AM", 4], ["de l'Uruguay", "Montevideo", "AM", 4],
  ["du Costa Rica", "San José", "AM", 4], ["de la Jamaïque", "Kingston", "AM", 4], ["d'Haïti", "Port-au-Prince", "AM", 4],
  ["du Paraguay", "Asunción", "AM", 5], ["de la République dominicaine", "Saint-Domingue", "AM", 5], ["du Nicaragua", "Managua", "AM", 5],
  ["du Salvador", "San Salvador", "AM", 5], ["des Bahamas", "Nassau", "AM", 5], ["du Honduras", "Tegucigalpa", "AM", 6],
  ["du Guyana", "Georgetown", "AM", 6], ["du Suriname", "Paramaribo", "AM", 6], ["du Belize", "Belmopan", "AM", 6],
  // Océanie
  ["de l'Australie", "Canberra", "OC", 2], ["de la Nouvelle-Zélande", "Wellington", "OC", 3], ["des Fidji", "Suva", "OC", 5],
  ["de la Papouasie-Nouvelle-Guinée", "Port Moresby", "OC", 5], ["des Samoa", "Apia", "OC", 6], ["des Tonga", "Nuku'alofa", "OC", 6],
  ["de Vanuatu", "Port-Vila", "OC", 6],
];

type Cur = [prep: string, currency: string, difficulty: number];
const CURRENCIES: Cur[] = [
  ["du Japon", "le yen", 1], ["des États-Unis", "le dollar américain", 1], ["du Royaume-Uni", "la livre sterling", 1],
  ["de l'Allemagne", "l'euro", 1], ["de la Suisse", "le franc suisse", 2], ["de la Chine", "le yuan (renminbi)", 2],
  ["de l'Inde", "la roupie indienne", 2], ["de la Russie", "le rouble", 2], ["de l'Australie", "le dollar australien", 2],
  ["du Canada", "le dollar canadien", 2], ["du Brésil", "le réal", 3], ["du Mexique", "le peso mexicain", 3],
  ["de l'Argentine", "le peso argentin", 3], ["de la Turquie", "la livre turque", 3], ["de la Corée du Sud", "le won", 3],
  ["de la Thaïlande", "le baht", 3], ["de la Pologne", "le zloty", 3], ["de la Suède", "la couronne suédoise", 3],
  ["de la Norvège", "la couronne norvégienne", 3], ["du Danemark", "la couronne danoise", 3], ["de l'Afrique du Sud", "le rand", 3],
  ["de l'Égypte", "la livre égyptienne", 3], ["du Maroc", "le dirham marocain", 3], ["d'Israël", "le shekel", 3],
  ["de la Nouvelle-Zélande", "le dollar néo-zélandais", 3], ["de la République tchèque", "la couronne tchèque", 4],
  ["de la Hongrie", "le forint", 4], ["du Nigeria", "le naira", 4], ["de l'Indonésie", "la roupie indonésienne", 4],
  ["du Vietnam", "le dong", 4], ["des Philippines", "le peso philippin", 4], ["de la Malaisie", "le ringgit", 4],
  ["de l'Arabie saoudite", "le riyal saoudien", 4], ["du Chili", "le peso chilien", 4], ["du Pakistan", "la roupie pakistanaise", 4],
  ["du Kenya", "le shilling kényan", 5], ["du Pérou", "le sol", 5], ["de la Roumanie", "le leu", 5], ["de l'Ukraine", "la hryvnia", 5],
  ["du Ghana", "le cedi", 6], ["du Botswana", "le pula", 6],
];

type Land = [name: string, country: string, difficulty: number];
const LANDMARKS: Land[] = [
  ["la tour Eiffel", "France", 1], ["le Colisée", "Italie", 1], ["la tour de Pise", "Italie", 1], ["Big Ben", "Royaume-Uni", 1],
  ["le Taj Mahal", "Inde", 1], ["la Grande Muraille", "Chine", 1], ["le mont Fuji", "Japon", 1], ["les pyramides de Gizeh", "Égypte", 1],
  ["l'opéra de Sydney", "Australie", 1], ["la statue de la Liberté", "États-Unis", 1], ["l'Acropole", "Grèce", 1], ["le Louvre", "France", 1],
  ["le palais de Versailles", "France", 1], ["Pompéi", "Italie", 1], ["le Mont-Saint-Michel", "France", 1],
  ["le Parthénon", "Grèce", 2], ["la Sagrada Família", "Espagne", 2], ["Machu Picchu", "Pérou", 2], ["le Christ rédempteur", "Brésil", 2],
  ["la Cité interdite", "Chine", 2], ["le Kremlin", "Russie", 2], ["la porte de Brandebourg", "Allemagne", 2], ["Stonehenge", "Royaume-Uni", 2],
  ["Uluru (Ayers Rock)", "Australie", 2], ["le Burj Khalifa", "Émirats arabes unis", 2], ["Santorin", "Grèce", 2],
  ["la cathédrale de Cologne", "Allemagne", 2], ["le Vésuve", "Italie", 2], ["le Grand Canyon", "États-Unis", 2],
  ["l'Alhambra", "Espagne", 3], ["Angkor Vat", "Cambodge", 3], ["Chichén Itzá", "Mexique", 3], ["Pétra", "Jordanie", 3],
  ["la basilique Sainte-Sophie", "Turquie", 3], ["le château de Neuschwanstein", "Allemagne", 3], ["le Manneken-Pis", "Belgique", 3],
  ["l'Atomium", "Belgique", 3], ["la Petite Sirène de Copenhague", "Danemark", 3], ["le pont du Gard", "France", 3],
  ["la cathédrale Saint-Basile", "Russie", 3], ["le Serengeti", "Tanzanie", 3], ["Zanzibar", "Tanzanie", 3], ["le mont Rushmore", "États-Unis", 3],
  ["la tour CN", "Canada", 3], ["les moaïs de l'île de Pâques", "Chili", 3], ["les îles Galápagos", "Équateur", 3], ["la baie d'Ha Long", "Vietnam", 3],
  ["le château de Prague", "République tchèque", 3], ["le palais de Schönbrunn", "Autriche", 3], ["Carthage", "Tunisie", 3],
  ["le lac de Côme", "Italie", 3], ["la cité de Carcassonne", "France", 3], ["Marina Bay Sands", "Singapour", 3],
  ["la médina de Fès", "Maroc", 4], ["Tombouctou", "Mali", 4], ["Borobudur", "Indonésie", 4], ["le salar d'Uyuni", "Bolivie", 4],
  ["le lac Louise", "Canada", 4], ["le temple d'Or d'Amritsar", "Inde", 4], ["la tour de Belém", "Portugal", 4], ["la Cappadoce", "Turquie", 4],
  ["Ksar Aït-Ben-Haddou", "Maroc", 5], ["les Météores", "Grèce", 5], ["la Giralda de Séville", "Espagne", 5],
  ["Bagan", "Birmanie (Myanmar)", 6], ["Lalibela", "Éthiopie", 6],
];

type Riv = [city: string, river: string, difficulty: number];
const RIVERS: Riv[] = [
  ["Paris", "la Seine", 1], ["Londres", "la Tamise", 1], ["Le Caire", "le Nil", 1], ["Rome", "le Tibre", 2], ["Vienne", "le Danube", 2],
  ["Budapest", "le Danube", 2], ["Toulouse", "la Garonne", 2], ["Bordeaux", "la Garonne", 2], ["Nantes", "la Loire", 3],
  ["Orléans", "la Loire", 3], ["Cologne", "le Rhin", 3], ["Bagdad", "le Tigre", 3], ["Lisbonne", "le Tage", 3], ["New York", "l'Hudson", 3],
  ["Berlin", "la Spree", 4], ["Prague", "la Vltava", 4], ["Varsovie", "la Vistule", 4], ["Florence", "l'Arno", 4],
  ["Washington", "le Potomac", 4], ["Saint-Pétersbourg", "la Neva", 4], ["Moscou", "la Moskova", 4], ["Kinshasa", "le Congo", 4],
  ["Francfort", "le Main", 5], ["Séville", "le Guadalquivir", 5], ["Dublin", "la Liffey", 5], ["Khartoum", "le Nil", 5],
  ["Bangkok", "le Chao Phraya", 5], ["Belgrade", "le Danube", 4],
];
const RIVER_POOL = ["la Seine", "la Tamise", "le Tibre", "le Danube", "le Nil", "le Tigre", "la Loire", "la Garonne", "le Rhin", "le Rhône",
  "la Meuse", "l'Elbe", "l'Oder", "la Volga", "l'Amazone", "le Mississippi", "le Congo", "le Niger", "le Mékong", "le Gange", "l'Indus",
  "la Marne", "la Saône", "la Moselle", "le Pô", "l'Èbre", "le Douro", "la Tamise", "le Yangtsé", "l'Euphrate", "le Jourdain", "le Zambèze"];

const MISC: Row[] = [
  ["geo", 1, "Quel est le plus haut sommet du monde ?", "L'Everest", "Le K2", "Le mont Blanc", "Le Kilimandjaro"],
  ["geo", 1, "Quelle chaîne de montagnes sépare la France de l'Espagne ?", "Les Pyrénées", "Les Alpes", "Les Vosges", "Le Jura"],
  ["geo", 1, "Quel pays d'Amérique du Sud parle portugais ?", "Le Brésil", "L'Argentine", "Le Chili", "Le Pérou"],
  ["geo", 2, "Quelle est la plus grande île du monde ?", "Le Groenland", "Madagascar", "Bornéo", "L'Islande"],
  ["geo", 2, "Quel canal relie la mer Rouge à la Méditerranée ?", "Le canal de Suez", "Le canal de Panama", "Le canal de Kiel", "Le canal du Midi"],
  ["geo", 2, "Quel canal relie l'océan Atlantique à l'océan Pacifique en Amérique centrale ?", "Le canal de Panama", "Le canal de Suez", "Le canal de Corinthe", "Le canal Érié"],
  ["geo", 2, "Quel détroit sépare l'Espagne du Maroc ?", "Le détroit de Gibraltar", "Le détroit du Bosphore", "Le détroit de Magellan", "Le détroit de Messine"],
  ["geo", 2, "Quelle est la plus grande ville de Suisse ?", "Zurich", "Genève", "Berne", "Bâle"],
  ["geo", 2, "Quelle est la plus grande ville de Turquie ?", "Istanbul", "Ankara", "Izmir", "Antalya"],
  ["geo", 2, "Quelle est la plus grande ville du Canada ?", "Toronto", "Montréal", "Vancouver", "Ottawa"],
  ["geo", 2, "Quelle est la plus grande ville d'Australie ?", "Sydney", "Canberra", "Melbourne", "Perth"],
  ["geo", 2, "Quelle est la plus grande ville du Brésil ?", "São Paulo", "Brasilia", "Rio de Janeiro", "Salvador"],
  ["geo", 3, "Quel est le plus long fleuve d'Europe ?", "La Volga", "Le Danube", "Le Rhin", "La Loire"],
  ["geo", 3, "Quel est le pays le plus peuplé d'Afrique ?", "Le Nigeria", "L'Égypte", "L'Éthiopie", "L'Afrique du Sud"],
  ["geo", 3, "Quel est le plus grand pays d'Afrique par sa superficie ?", "L'Algérie", "La République démocratique du Congo", "Le Soudan", "La Libye"],
  ["geo", 3, "Quel est le plus grand lac d'eau douce du monde par sa superficie ?", "Le lac Supérieur", "Le lac Victoria", "Le lac Baïkal", "Le lac Michigan"],
  ["geo", 3, "Quelle est la plus grande île de la Méditerranée ?", "La Sicile", "La Sardaigne", "Chypre", "La Corse"],
  ["geo", 3, "Quel désert couvre une grande partie de la Mongolie et du nord de la Chine ?", "Le désert de Gobi", "Le Kalahari", "Le Thar", "L'Atacama"],
  ["geo", 3, "Lequel de ces pays n'a aucun accès à la mer ?", "La Suisse", "L'Italie", "La Grèce", "Le Portugal"],
  ["geo", 3, "Quel fleuve marque une partie de la frontière entre le Texas et le Mexique ?", "Le Rio Grande", "Le Colorado", "Le Mississippi", "L'Hudson"],
  ["geo", 4, "Quel lac est le plus profond du monde ?", "Le lac Baïkal", "Le lac Tanganyika", "Le lac Supérieur", "Le lac Titicaca"],
  ["geo", 4, "Quelle est la plus grande ville des Pays-Bas ?", "Amsterdam", "Rotterdam", "La Haye", "Utrecht"],
  ["geo", 4, "Quel pays possède la plus longue côte du monde ?", "Le Canada", "L'Indonésie", "La Russie", "L'Australie"],
  ["geo", 4, "Dans quel océan se trouvent les Maldives ?", "L'océan Indien", "L'océan Pacifique", "L'océan Atlantique", "L'océan Arctique"],
  ["geo", 5, "Quel est le point le plus bas des terres émergées ?", "Les rives de la mer Morte", "La vallée de la Mort", "Le lac Assal", "Le désert de Danakil"],
  ["geo", 5, "Quel détroit sépare l'Asie de l'Amérique du Nord ?", "Le détroit de Béring", "Le détroit de Malacca", "Le détroit d'Ormuz", "Le détroit de Davis"],
  ["geo", 5, "Quelle « mer » d'Asie centrale est en réalité le plus grand lac du monde par sa superficie ?", "La mer Caspienne", "La mer d'Aral", "La mer Morte", "La mer Noire"],
];

export function generateGeo(rng: Rng): Gen[] {
  const out: Gen[] = [];
  const caps = CAPITALS.map((c) => c[1]);

  for (const [prep, capital, cont, d] of CAPITALS) {
    const near = CAPITALS.filter((c) => c[2] === cont && c[1] !== capital).map((c) => c[1]);
    const pool = near.length >= 8 ? near : caps;
    out.push({ category: "geo", difficulty: d, question: `Quelle est la capitale ${prep} ?`, correct: capital, wrong: distract(rng, pool, capital) });
  }
  // questions inverses sur un sous-ensemble (difficulté ≥ 2)
  const reverse = sample(rng, CAPITALS, 28, (c) => c[3] < 2 || c[3] > 5);
  for (const [prep, capital, cont, d] of reverse) {
    const country = stripArticle(prep);
    const others = CAPITALS.filter((c) => c[2] === cont && c[1] !== capital).map((c) => stripArticle(c[0]));
    out.push({ category: "geo", difficulty: Math.min(6, d + 1), question: `${capital} est la capitale de quel pays ?`, correct: country, wrong: distract(rng, others, country) });
  }
  for (const [prep, currency, d] of CURRENCIES) {
    out.push({
      category: "culture",
      difficulty: d,
      question: `Quelle est la monnaie ${prep} ?`,
      correct: capFirst(currency),
      wrong: distract(rng, CURRENCIES.map((c) => capFirst(c[1])), capFirst(currency)),
    });
  }
  for (const [name, country, d] of LANDMARKS) {
    out.push({
      category: "geo",
      difficulty: d,
      question: `Dans quel pays se trouve ${name} ?`,
      correct: country,
      wrong: distract(rng, [...new Set(LANDMARKS.map((l) => l[1]))], country),
    });
  }
  for (const [city, river, d] of RIVERS) {
    out.push({ category: "geo", difficulty: d, question: `Quel fleuve traverse ${city} ?`, correct: capFirst(river), wrong: distract(rng, RIVER_POOL.map(capFirst), capFirst(river)) });
  }
  return [...out, ...fromRows(MISC)];
}
