import type { Rng } from "@geoclash/engine";
import { distract, fromRows, type Gen, type Row } from "./lib";

type Dish = [dish: string, country: string, difficulty: number];
const DISHES: Dish[] = [
  ["la pizza", "L'Italie", 1], ["les sushis", "Le Japon", 1], ["la paella", "L'Espagne", 1], ["le fish and chips", "Le Royaume-Uni", 1],
  ["le tiramisu", "L'Italie", 2], ["le guacamole", "Le Mexique", 2], ["le haggis", "L'Écosse", 3], ["le goulasch", "La Hongrie", 3],
  ["la moussaka", "La Grèce", 3], ["le pad thaï", "La Thaïlande", 3], ["le kimchi", "La Corée", 3], ["les churros", "L'Espagne", 3],
  ["le rösti", "La Suisse", 4], ["le taboulé", "Le Liban", 4], ["le ceviche", "Le Pérou", 4], ["les pierogi", "La Pologne", 4],
  ["le feijoada", "Le Brésil", 4], ["le tajine", "Le Maroc", 3], ["la ratatouille", "La France", 2], ["la raclette", "La Suisse", 3],
  ["le pho", "Le Vietnam", 4], ["le bibimbap", "La Corée", 5], ["le tom yum", "La Thaïlande", 5], ["les empanadas", "L'Argentine", 5],
];
const COUNTRIES = ["L'Italie", "Le Japon", "L'Espagne", "Le Royaume-Uni", "Le Mexique", "L'Écosse", "La Hongrie", "La Grèce", "La Thaïlande", "La Corée", "La Suisse", "Le Liban", "Le Pérou", "La Pologne", "Le Brésil", "Le Maroc", "La France", "Le Vietnam", "L'Argentine", "La Turquie", "L'Inde", "L'Allemagne"];

const ROWS: Row[] = [
  ["gastronomie", 1, "Quel fromage met-on traditionnellement sur une pizza Margherita ?", "La mozzarella", "Le roquefort", "Le gruyère", "Le camembert"],
  ["gastronomie", 1, "Quel fromage est connu pour ses trous ?", "L'emmental", "Le brie", "Le comté", "Le munster"],
  ["gastronomie", 1, "Quel fruit sert à faire le guacamole ?", "L'avocat", "La banane", "Le kiwi", "La mangue"],
  ["gastronomie", 1, "Quel est l'ingrédient principal du pain ?", "La farine", "Le sucre", "Le riz", "Le maïs"],
  ["gastronomie", 1, "Quelle boisson est obtenue par la fermentation du raisin ?", "Le vin", "La bière", "Le cidre", "Le saké"],
  ["gastronomie", 1, "Quel dessert français est une crème recouverte d'une fine croûte de caramel ?", "La crème brûlée", "Le flan", "La mousse au chocolat", "Le clafoutis"],
  ["gastronomie", 1, "Quel légume est l'ingrédient principal de la soupe gratinée traditionnelle servie avec du pain et du fromage ?", "L'oignon", "Le poireau", "La carotte", "Le chou"],
  ["gastronomie", 1, "Quelle céréale est la plus consommée en Asie ?", "Le riz", "Le blé", "L'orge", "Le seigle"],
  ["gastronomie", 1, "Quel est le fruit de l'olivier ?", "L'olive", "La figue", "La datte", "La noix"],
  ["gastronomie", 2, "Quel est l'ingrédient principal du tofu ?", "Le soja", "Le riz", "Le blé", "Le pois chiche"],
  ["gastronomie", 2, "De quelle plante provient le chocolat ?", "Le cacaoyer", "Le caféier", "Le théier", "Le vanillier"],
  ["gastronomie", 2, "De quelle plante provient le café ?", "Le caféier", "Le cacaoyer", "Le théier", "Le guaranier"],
  ["gastronomie", 2, "Quel alcool est fabriqué à partir d'agave au Mexique ?", "La tequila", "Le rhum", "La vodka", "Le whisky"],
  ["gastronomie", 2, "Quel alcool est fabriqué à partir de canne à sucre aux Antilles ?", "Le rhum", "La tequila", "Le cognac", "Le gin"],
  ["gastronomie", 2, "Quel dessert est composé de feuilles de pâte, de crème pâtissière et d'un glaçage ?", "Le mille-feuille", "Le paris-brest", "L'éclair", "Le saint-honoré"],
  ["gastronomie", 2, "Quelle ville est célèbre pour sa moutarde ?", "Dijon", "Lyon", "Reims", "Nantes"],
  ["gastronomie", 2, "Quelle est la base d'une mayonnaise ?", "Jaune d'œuf et huile", "Lait et farine", "Crème et citron", "Beurre et ail"],
  ["gastronomie", 2, "Quelle est la base du gazpacho ?", "La tomate", "Le concombre seul", "Le poivron seul", "L'aubergine"],
  ["gastronomie", 2, "Avec quelle céréale fait-on le risotto ?", "Le riz", "Le blé", "L'orge", "Le maïs"],
  ["gastronomie", 3, "Quelle épice est la plus chère du monde au poids ?", "Le safran", "La vanille", "Le poivre", "La cannelle"],
  ["gastronomie", 3, "Quel pays est le premier producteur de café au monde ?", "Le Brésil", "La Colombie", "Le Vietnam", "L'Éthiopie"],
  ["gastronomie", 3, "Quel fromage français à pâte persillée vient de l'Aveyron ?", "Le roquefort", "Le bleu d'Auvergne", "La fourme d'Ambert", "Le gorgonzola"],
  ["gastronomie", 3, "Quel est l'ingrédient principal du houmous ?", "Les pois chiches", "Les lentilles", "Les haricots blancs", "Les fèves"],
  ["gastronomie", 3, "Quelle est la base d'une sauce béchamel ?", "Du lait, du beurre et de la farine", "De la crème et du citron", "Du vin et du beurre", "Du fromage et de l'œuf"],
  ["gastronomie", 3, "Avec quelle céréale fait-on traditionnellement la bière ?", "L'orge", "Le riz", "Le maïs", "Le sarrasin"],
  ["gastronomie", 3, "Quelle ville est célèbre pour son nougat ?", "Montélimar", "Nîmes", "Carpentras", "Avignon"],
  ["gastronomie", 3, "Dans quelle ville trouve-t-on des « bouchons » (restaurants traditionnels) ?", "Lyon", "Marseille", "Bordeaux", "Strasbourg"],
  ["gastronomie", 3, "De quelle plante provient le thé ?", "Le théier", "Le caféier", "Le maté", "Le rooibos"],
  ["gastronomie", 3, "Que signifie « al dente » pour des pâtes ?", "Cuites mais encore fermes sous la dent", "Très cuites", "Crues", "Sans sel"],
  ["gastronomie", 4, "Quelle ville est célèbre pour ses calissons ?", "Aix-en-Provence", "Nice", "Toulon", "Arles"],
  ["gastronomie", 4, "De quel arbre provient le sirop d'érable ?", "L'érable à sucre", "Le bouleau", "Le noyer", "Le chêne"],
  ["gastronomie", 5, "Quelle ville est célèbre pour ses bêtises, des bonbons à la menthe ?", "Cambrai", "Lille", "Amiens", "Reims"],
];

export function generateFood(rng: Rng): Gen[] {
  const out: Gen[] = DISHES.map(([dish, country, d]) => ({
    category: "gastronomie", difficulty: d, question: `De quel pays ${/^[aeiouhéè]/i.test(dish.replace(/^(le |la |les |l')/, "")) && dish.startsWith("l'") ? "vient" : dish.startsWith("les ") ? "viennent" : "vient"} ${dish} ?`,
    correct: country, wrong: distract(rng, COUNTRIES, country),
  }));
  return [...out, ...fromRows(ROWS)];
}
