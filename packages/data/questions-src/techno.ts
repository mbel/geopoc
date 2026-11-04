import type { Rng } from "@geoclash/engine";
import { distract, fromRows, type Gen, type Row } from "./lib";

type Pair = [subject: string, answer: string, difficulty: number];

const ACRONYMS: Pair[] = [
  ["WWW", "World Wide Web", 1], ["GPS", "Global Positioning System", 2], ["USB", "Universal Serial Bus", 3], ["PDF", "Portable Document Format", 3],
  ["HTML", "HyperText Markup Language", 3], ["CPU", "Central Processing Unit", 3], ["RAM", "Random Access Memory", 3], ["VPN", "Virtual Private Network", 3],
  ["SMS", "Short Message Service", 3], ["URL", "Uniform Resource Locator", 4], ["HTTP", "HyperText Transfer Protocol", 4], ["LED", "Light-Emitting Diode", 4],
  ["QR (dans « QR code »)", "Quick Response", 4], ["IP (dans « adresse IP »)", "Internet Protocol", 3], ["CSS", "Cascading Style Sheets", 4], ["SQL", "Structured Query Language", 4],
];
const FOUNDERS: Pair[] = [
  ["Microsoft (avec Paul Allen)", "Bill Gates", 1], ["Apple (avec Steve Wozniak)", "Steve Jobs", 1], ["Amazon", "Jeff Bezos", 1], ["Facebook", "Mark Zuckerberg", 1],
  ["Google (avec Larry Page)", "Sergey Brin", 2], ["Tesla Motors, en tant que cofondateur, avec Martin Eberhard", "Marc Tarpenning", 6],
];
const LANGS: Pair[] = [
  ["le langage de programmation Python", "Guido van Rossum", 4], ["le langage JavaScript, en 1995", "Brendan Eich", 4], ["le langage C", "Dennis Ritchie", 4],
  ["le langage Java", "James Gosling", 5], ["le langage PHP", "Rasmus Lerdorf", 6], ["le noyau Linux", "Linus Torvalds", 3], ["le World Wide Web, en 1989", "Tim Berners-Lee", 3],
];
const INVENTIONS: Pair[] = [
  ["le téléphone (brevet de 1876)", "Alexander Graham Bell", 2], ["le phonographe", "Thomas Edison", 3], ["la machine à vapeur perfectionnée", "James Watt", 3],
  ["la dynamite", "Alfred Nobel", 3], ["l'imprimerie à caractères mobiles en Europe", "Johannes Gutenberg", 2], ["le télégraphe électrique et son code", "Samuel Morse", 3],
  ["la radio (TSF)", "Guglielmo Marconi", 3], ["le paratonnerre", "Benjamin Franklin", 3], ["le moteur à explosion à quatre temps", "Nikolaus Otto", 6],
  ["le vaccin contre la rage", "Louis Pasteur", 3], ["la lampe de sûreté du mineur", "Humphry Davy", 6], ["l'ascenseur de sécurité", "Elisha Otis", 6],
];
const PEOPLE = ["Bill Gates", "Steve Jobs", "Jeff Bezos", "Mark Zuckerberg", "Sergey Brin", "Larry Page", "Elon Musk", "Steve Wozniak", "Paul Allen", "Jack Dorsey", "Tim Cook", "Larry Ellison"];
const DEVS = ["Guido van Rossum", "Brendan Eich", "Dennis Ritchie", "James Gosling", "Rasmus Lerdorf", "Linus Torvalds", "Tim Berners-Lee", "Bjarne Stroustrup", "Ken Thompson", "Yukihiro Matsumoto", "Anders Hejlsberg", "Larry Wall"];
const INVENTORS = ["Alexander Graham Bell", "Thomas Edison", "James Watt", "Alfred Nobel", "Johannes Gutenberg", "Samuel Morse", "Guglielmo Marconi", "Benjamin Franklin", "Nikola Tesla", "Louis Pasteur", "Michael Faraday", "Nikolaus Otto", "Rudolf Diesel", "Karl Benz"];

const ROWS: Row[] = [
  ["techno", 1, "Que signifie « IA » dans le langage courant ?", "Intelligence artificielle", "Interface automatique", "Information avancée", "Internet actif"],
  ["techno", 1, "Quelle société a créé la console PlayStation ?", "Sony", "Nintendo", "Microsoft", "Sega"],
  ["techno", 1, "Comment s'appelle l'assistant vocal d'Apple ?", "Siri", "Alexa", "Cortana", "Bixby"],
  ["techno", 1, "Comment s'appelle le système d'exploitation mobile de Google ?", "Android", "iOS", "Windows Phone", "Symbian"],
  ["techno", 1, "Quelle entreprise a créé le système d'exploitation Windows ?", "Microsoft", "Apple", "IBM", "Google"],
  ["techno", 1, "Quelle entreprise fabrique la voiture électrique Model S ?", "Tesla", "Renault", "Toyota", "Ford"],
  ["techno", 1, "Quel raccourci clavier permet de copier sous Windows ?", "Ctrl + C", "Ctrl + V", "Ctrl + X", "Ctrl + Z"],
  ["techno", 1, "Quels frères ont inventé le cinématographe en 1895 ?", "Les frères Lumière", "Les frères Wright", "Les frères Pathé", "Les frères Montgolfier"],
  ["techno", 2, "Combien de bits compte un octet ?", "8", "4", "16", "10"],
  ["techno", 2, "Quel langage sert à styliser l'apparence des pages web ?", "CSS", "SQL", "Python", "XML"],
  ["techno", 2, "Quelle société japonaise a créé le personnage de Mario ?", "Nintendo", "Sega", "Sony", "Capcom"],
  ["techno", 2, "Quel est le plus utilisé des moteurs de recherche ?", "Google", "Bing", "Yahoo", "Qwant"],
  ["techno", 3, "En quelle année le premier iPhone a-t-il été présenté ?", "2007", "2005", "2009", "2010"],
  ["techno", 3, "En quelle année Facebook a-t-il été lancé ?", "2004", "2002", "2006", "2008"],
  ["techno", 3, "Quelle mathématicienne est considérée comme la première programmeuse de l'histoire ?", "Ada Lovelace", "Grace Hopper", "Marie Curie", "Hedy Lamarr"],
  ["techno", 3, "Quel mathématicien britannique a contribué à casser le code Enigma ?", "Alan Turing", "Charles Babbage", "John von Neumann", "George Boole"],
  ["techno", 3, "Quelle entreprise a créé le navigateur Firefox ?", "Mozilla", "Google", "Microsoft", "Opera"],
  ["techno", 3, "Quel est le nom du premier satellite artificiel, lancé en 1957 ?", "Spoutnik 1", "Explorer 1", "Vostok 1", "Apollo 1"],
  ["techno", 3, "Quelle chienne soviétique fut le premier être vivant en orbite, en 1957 ?", "Laïka", "Belka", "Strelka", "Albina"],
  ["techno", 4, "En quelle année Google a-t-il été fondé ?", "1998", "1995", "2001", "2004"],
  ["techno", 4, "En quelle année YouTube a-t-il été fondé ?", "2005", "2003", "2007", "2009"],
  ["techno", 4, "Combien d'octets compte un kilo-octet dans l'ancienne convention informatique ?", "1 024", "1 000", "512", "2 048"],
  ["techno", 4, "Comment s'appelle le robot d'exploration envoyé sur Mars par la NASA en 2021 ?", "Perseverance", "Curiosity", "Opportunity", "Spirit"],
  ["techno", 5, "Comment s'appelle le premier ordinateur électronique généraliste, mis en service en 1946 ?", "ENIAC", "UNIVAC", "Colossus", "Z3"],
  ["techno", 5, "Quel protocole sert à envoyer des courriers électroniques ?", "SMTP", "FTP", "SSH", "DNS"],
];

export function generateTechno(rng: Rng): Gen[] {
  const out: Gen[] = [];
  const meanings = ACRONYMS.map((a) => a[1]);
  for (const [s, a, d] of ACRONYMS) out.push({ category: "techno", difficulty: d, question: `Que signifie le sigle « ${s} » ?`, correct: a, wrong: distract(rng, meanings, a) });
  for (const [s, a, d] of FOUNDERS.slice(0, 5)) out.push({ category: "techno", difficulty: d, question: `Qui a fondé ${s} ?`, correct: a, wrong: distract(rng, PEOPLE.filter((p) => !s.includes(p)), a) });
  for (const [s, a, d] of LANGS) out.push({ category: "techno", difficulty: d, question: `Qui a créé ${s} ?`, correct: a, wrong: distract(rng, DEVS, a) });
  for (const [s, a, d] of INVENTIONS) out.push({ category: "techno", difficulty: d, question: `Qui a inventé ${s} ?`, correct: a, wrong: distract(rng, INVENTORS, a) });
  return [...out, ...fromRows(ROWS)];
}
