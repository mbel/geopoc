#!/usr/bin/env python3
"""
Consolidated English question dataset generator for GeoClash Royale.
Translates all 1,291 French questions from packages/data/questions.fr.json
and writes packages/data/questions.en.json with full inline validation.
"""
import json
import re
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FR_JSON_PATH = ROOT / "packages" / "data" / "questions.fr.json"
EN_JSON_PATH = ROOT / "packages" / "data" / "questions.en.json"
SEED_PATH = ROOT / "scripts" / "translations" / "seed.py"

# Load Seed Translations
seed_globals = {}
with open(SEED_PATH, "r", encoding="utf-8") as f:
    exec(f.read(), seed_globals)
SEED_TRANSLATIONS = seed_globals["SEED_TRANSLATIONS"]

# Dictionaries
COUNTRY_FR_TO_EN = {
    "Afghanistan": "Afghanistan",
    "Afrique du Sud": "South Africa",
    "Albanie": "Albania",
    "Algérie": "Algeria",
    "Allemagne": "Germany",
    "Angola": "Angola",
    "Arabie saoudite": "Saudi Arabia",
    "Argentine": "Argentina",
    "Arménie": "Armenia",
    "Australie": "Australia",
    "Autriche": "Austria",
    "Azerbaïdjan": "Azerbaijan",
    "Bahamas": "Bahamas",
    "Bangladesh": "Bangladesh",
    "Belgique": "Belgium",
    "Belize": "Belize",
    "Bhoutan": "Bhutan",
    "Biélorussie": "Belarus",
    "Birmanie (Myanmar)": "Myanmar (Burma)",
    "Bolivie": "Bolivia",
    "Bosnie-Herzégovine": "Bosnia and Herzegovina",
    "Botswana": "Botswana",
    "Brésil": "Brazil",
    "Bulgarie": "Bulgaria",
    "Burkina Faso": "Burkina Faso",
    "Cambodge": "Cambodia",
    "Cameroun": "Cameroon",
    "Canada": "Canada",
    "Chili": "Chile",
    "Chine": "China",
    "Chypre": "Cyprus",
    "Colombie": "Colombia",
    "Corée": "Korea",
    "Corée du Nord": "North Korea",
    "Corée du Sud": "South Korea",
    "Costa Rica": "Costa Rica",
    "Croatie": "Croatia",
    "Cuba": "Cuba",
    "Danemark": "Denmark",
    "Espagne": "Spain",
    "Estonie": "Estonia",
    "Fidji": "Fiji",
    "Finlande": "Finland",
    "France": "France",
    "Gabon": "Gabon",
    "Ghana": "Ghana",
    "Grèce": "Greece",
    "Guinée": "Guinea",
    "Guyana": "Guyana",
    "Géorgie": "Georgia",
    "Haïti": "Haiti",
    "Honduras": "Honduras",
    "Hongrie": "Hungary",
    "Inde": "India",
    "Indonésie": "Indonesia",
    "Irak": "Iraq",
    "Iran": "Iran",
    "Irlande": "Ireland",
    "Islande": "Iceland",
    "Israël": "Israel",
    "Italie": "Italy",
    "Jamaïque": "Jamaica",
    "Japon": "Japan",
    "Jordanie": "Jordan",
    "Kazakhstan": "Kazakhstan",
    "Kenya": "Kenya",
    "Kirghizistan": "Kyrgyzstan",
    "Laos": "Laos",
    "Lesotho": "Lesotho",
    "Lettonie": "Latvia",
    "Liban": "Lebanon",
    "Libye": "Libya",
    "Liechtenstein": "Liechtenstein",
    "Lituanie": "Lithuania",
    "Macédoine du Nord": "North Macedonia",
    "Madagascar": "Madagascar",
    "Malaisie": "Malaysia",
    "Malawi": "Malawi",
    "Maldives": "Maldives",
    "Mali": "Mali",
    "Malte": "Malta",
    "Maroc": "Morocco",
    "Mauritanie": "Mauritania",
    "Mexique": "Mexico",
    "Moldavie": "Moldova",
    "Monaco": "Monaco",
    "Mongolie": "Mongolia",
    "Monténégro": "Montenegro",
    "Mozambique": "Mozambique",
    "Namibie": "Namibia",
    "Nicaragua": "Nicaragua",
    "Niger": "Niger",
    "Nigeria": "Nigeria",
    "Norvège": "Norway",
    "Nouvelle-Zélande": "New Zealand",
    "Népal": "Nepal",
    "Oman": "Oman",
    "Ouganda": "Uganda",
    "Ouzbékistan": "Uzbekistan",
    "Pakistan": "Pakistan",
    "Papouasie-Nouvelle-Guinée": "Papua New Guinea",
    "Paraguay": "Paraguay",
    "Pays-Bas": "Netherlands",
    "Philippines": "Philippines",
    "Pologne": "Poland",
    "Portugal": "Portugal",
    "Pérou": "Peru",
    "Qatar": "Qatar",
    "Roumanie": "Romania",
    "Royaume-Uni": "United Kingdom",
    "Russie": "Russia",
    "Rwanda": "Rwanda",
    "République dominicaine": "Dominican Republic",
    "République démocratique du Congo": "Democratic Republic of the Congo",
    "République tchèque": "Czech Republic",
    "Salvador": "El Salvador",
    "Samoa": "Samoa",
    "Serbie": "Serbia",
    "Singapour": "Singapore",
    "Slovaquie": "Slovakia",
    "Slovénie": "Slovenia",
    "Somalie": "Somalia",
    "Soudan": "Sudan",
    "Suisse": "Switzerland",
    "Suriname": "Suriname",
    "Suède": "Sweden",
    "Syrie": "Syria",
    "Sénégal": "Senegal",
    "Tadjikistan": "Tajikistan",
    "Tanzanie": "Tanzania",
    "Tchad": "Chad",
    "Thaïlande": "Thailand",
    "Togo": "Togo",
    "Tonga": "Tonga",
    "Tunisie": "Tunisia",
    "Turkménistan": "Turkmenistan",
    "Turquie": "Turkey",
    "Ukraine": "Ukraine",
    "Uruguay": "Uruguay",
    "Vanuatu": "Vanuatu",
    "Venezuela": "Venezuela",
    "Vietnam": "Vietnam",
    "Yémen": "Yemen",
    "Zambie": "Zambia",
    "Zimbabwe": "Zimbabwe",
    "Égypte": "Egypt",
    "Émirats arabes unis": "United Arab Emirates",
    "Équateur": "Ecuador",
    "Érythrée": "Eritrea",
    "Écosse": "Scotland",
    "États-Unis": "United States",
    "Éthiopie": "Ethiopia"
}

CURRENCIES_FR_TO_EN = {
    "le yen": "Yen",
    "le dollar américain": "US Dollar",
    "la livre sterling": "Pound Sterling",
    "l'euro": "Euro",
    "le franc suisse": "Swiss Franc",
    "le yuan (renminbi)": "Yuan (Renminbi)",
    "la roupie indienne": "Indian Rupee",
    "le rouble": "Ruble",
    "le dollar australien": "Australian Dollar",
    "le dollar canadien": "Canadian Dollar",
    "le réal": "Real",
    "le peso mexicain": "Mexican Peso",
    "le peso argentin": "Argentine Peso",
    "la livre turque": "Turkish Lira",
    "le won": "Won",
    "le baht": "Baht",
    "le zloty": "Zloty",
    "la couronne suédoise": "Swedish Krona",
    "la couronne norvégienne": "Norwegian Krone",
    "la couronne danoise": "Danish Krone",
    "le rand": "Rand",
    "la livre égyptienne": "Egyptian Pound",
    "le dirham marocain": "Moroccan Dirham",
    "le shekel": "Shekel",
    "le dollar néo-zélandais": "New Zealand Dollar",
    "la couronne tchèque": "Czech Koruna",
    "le forint": "Forint",
    "le naira": "Naira",
    "la roupie indonésienne": "Indonesian Rupiah",
    "le dong": "Dong",
    "le peso philippin": "Philippine Peso",
    "le ringgit": "Ringgit",
    "le riyal saoudien": "Saudi Riyal",
    "le peso chilien": "Chilean Peso",
    "la roupie pakistanaise": "Pakistani Rupee",
    "le shilling kényan": "Kenyan Shilling",
    "le sol": "Sol",
    "le leu": "Leu",
    "la hryvnia": "Hryvnia",
    "le cedi": "Cedi",
    "le pula": "Pula"
}

RIVERS_FR_TO_EN = {
    "la Seine": "The Seine",
    "la Tamise": "The Thames",
    "le Nil": "The Nile",
    "le Tibre": "The Tiber",
    "le Danube": "The Danube",
    "la Garonne": "The Garonne",
    "la Loire": "The Loire",
    "le Rhin": "The Rhine",
    "le Tigre": "The Tigris",
    "le Tage": "The Tagus",
    "l'Hudson": "The Hudson",
    "la Spree": "The Spree",
    "la Vltava": "The Vltava",
    "la Vistule": "The Vistula",
    "l'Arno": "The Arno",
    "le Potomac": "The Potomac",
    "la Neva": "The Neva",
    "la Moskova": "The Moskva",
    "le Congo": "The Congo",
    "le Main": "The Main",
    "le Guadalquivir": "The Guadalquivir",
    "la Liffey": "The Liffey",
    "le Chao Phraya": "The Chao Phraya",
    "le Rhône": "The Rhône",
    "la Meuse": "The Meuse",
    "l'Elbe": "The Elbe",
    "l'Oder": "The Oder",
    "la Volga": "The Volga",
    "l'Amazone": "The Amazon",
    "le Mississippi": "The Mississippi",
    "le Niger": "The Niger",
    "le Mékong": "The Mekong",
    "le Gange": "The Ganges",
    "l'Indus": "The Indus",
    "la Marne": "The Marne",
    "la Saône": "The Saône",
    "la Moselle": "The Moselle",
    "le Pô": "The Po",
    "l'Èbre": "The Ebro",
    "le Douro": "The Douro",
    "le Yangtsé": "The Yangtze",
    "l'Euphrate": "The Euphrates",
    "le Jourdain": "The Jordan",
    "le Zambèze": "The Zambezi"
}

ELEMENTS_FR_TO_EN = {
    "hydrogène": "hydrogen",
    "hélium": "helium",
    "lithium": "lithium",
    "carbone": "carbon",
    "azote": "nitrogen",
    "oxygène": "oxygen",
    "fluor": "fluorine",
    "néon": "neon",
    "sodium": "sodium",
    "magnésium": "magnesium",
    "aluminium": "aluminum",
    "silicium": "silicon",
    "phosphore": "phosphorus",
    "soufre": "sulfur",
    "chlore": "chlorine",
    "argon": "argon",
    "potassium": "potassium",
    "calcium": "calcium",
    "fer": "iron",
    "cuivre": "copper",
    "zinc": "zinc",
    "argent": "silver",
    "étain": "tin",
    "or": "gold",
    "mercure": "mercury",
    "plomb": "lead",
    "uranium": "uranium",
    "platine": "platinum",
    "nickel": "nickel",
    "cobalt": "cobalt",
    "titane": "titanium",
    "tungstène": "tungsten",
    "iode": "iodine",
    "brome": "bromine",
    "radium": "radium",
    "plutonium": "plutonium",
    "krypton": "krypton",
    "xénon": "xenon",
    "manganèse": "manganese",
    "chrome": "chromium",
    "bore": "boron",
    "béryllium": "beryllium",
    "antimoine": "antimony",
    "arsenic": "arsenic",
    "bismuth": "bismuth",
    "baryum": "barium",
    "strontium": "strontium",
    "gallium": "gallium",
    "césium": "cesium",
    "rubidium": "rubidium"
}

LANDMARKS_FR_TO_EN = {
    "la tour Eiffel": "the Eiffel Tower",
    "le Colisée": "the Colosseum",
    "la tour de Pise": "the Leaning Tower of Pisa",
    "Big Ben": "Big Ben",
    "le Taj Mahal": "the Taj Mahal",
    "la Grande Muraille": "the Great Wall",
    "le mont Fuji": "Mount Fuji",
    "les pyramides de Gizeh": "the Giza Pyramids",
    "l'opéra de Sydney": "the Sydney Opera House",
    "la statue de la Liberté": "the Statue of Liberty",
    "l'Acropole": "the Acropolis",
    "le Louvre": "the Louvre",
    "le palais de Versailles": "the Palace of Versailles",
    "Pompéi": "Pompeii",
    "le Mont-Saint-Michel": "Mont-Saint-Michel",
    "le Parthénon": "the Parthenon",
    "la Sagrada Família": "the Sagrada Família",
    "Machu Picchu": "Machu Picchu",
    "le Christ rédempteur": "Christ the Redeemer",
    "la Cité interdite": "the Forbidden City",
    "le Kremlin": "the Kremlin",
    "la porte de Brandebourg": "the Brandenburg Gate",
    "Stonehenge": "Stonehenge",
    "Uluru (Ayers Rock)": "Uluru (Ayers Rock)",
    "le Burj Khalifa": "the Burj Khalifa",
    "Santorin": "Santorini",
    "la cathédrale de Cologne": "Cologne Cathedral",
    "le Vésuve": "Mount Vesuvius",
    "le Grand Canyon": "the Grand Canyon",
    "l'Alhambra": "the Alhambra",
    "Angkor Vat": "Angkor Wat",
    "Chichén Itzá": "Chichén Itzá",
    "Pétra": "Petra",
    "la basilique Sainte-Sophie": "Hagia Sophia",
    "le château de Neuschwanstein": "Neuschwanstein Castle",
    "le Manneken-Pis": "Manneken Pis",
    "l'Atomium": "the Atomium",
    "la Petite Sirène de Copenhague": "The Little Mermaid statue",
    "le pont du Gard": "Pont du Gard",
    "la cathédrale Saint-Basile": "Saint Basil's Cathedral",
    "le Serengeti": "the Serengeti",
    "Zanzibar": "Zanzibar",
    "le mont Rushmore": "Mount Rushmore",
    "la tour CN": "the CN Tower",
    "les moaïs de l'île de Pâques": "the Easter Island Moai",
    "les îles Galápagos": "the Galápagos Islands",
    "la baie d'Ha Long": "Ha Long Bay",
    "le château de Prague": "Prague Castle",
    "le palais de Schönbrunn": "Schönbrunn Palace",
    "Carthage": "Carthage",
    "le lac de Côme": "Lake Como",
    "la cité de Carcassonne": "the City of Carcassonne",
    "Marina Bay Sands": "Marina Bay Sands",
    "la médina de Fès": "the Medina of Fez",
    "Tombouctou": "Timbuktu",
    "Borobudur": "Borobudur",
    "le salar d'Uyuni": "Salar de Uyuni",
    "le lac Louise": "Lake Louise",
    "le temple d'Or d'Amritsar": "the Golden Temple of Amritsar",
    "la tour de Belém": "Belém Tower",
    "la Cappadoce": "Cappadocia",
    "Ksar Aït-Ben-Haddou": "Ksar of Ait-Ben-Haddou",
    "les Météores": "Meteora",
    "la Giralda de Séville": "the Giralda of Seville",
    "Bagan": "Bagan",
    "Lalibela": "Lalibela"
}

ACRONYMS_FR_TO_EN = {
    "WWW": "World Wide Web",
    "HTML": "HyperText Markup Language",
    "URL": "Uniform Resource Locator",
    "USB": "Universal Serial Bus",
    "GPS": "Global Positioning System",
    "PDF": "Portable Document Format",
    "RAM": "Random Access Memory",
    "CPU": "Central Processing Unit",
    "IP": "Internet Protocol",
    "Wi-Fi": "Wireless Fidelity",
    "SSD": "Solid State Drive",
    "DNS": "Domain Name System",
    "HTTP": "HyperText Transfer Protocol",
    "IA": "Artificial Intelligence",
    "AI": "Artificial Intelligence",
    "FAQ": "Frequently Asked Questions",
    "SMS": "Short Message Service",
    "SQL": "Structured Query Language",
    "CSS": "Cascading Style Sheets",
    "PNG": "Portable Network Graphics"
}

CITIES_FR_TO_EN = {
    "Athènes": "Athens",
    "Alger": "Algiers",
    "Bakou": "Baku",
    "Beyrouth": "Beirut",
    "Bichkek": "Bishkek",
    "Bogota": "Bogota",
    "Bruxelles": "Brussels",
    "Bucarest": "Bucharest",
    "Le Caire": "Cairo",
    "Chisinau": "Chisinau",
    "Copenhague": "Copenhagen",
    "Damas": "Damascus",
    "Dacca": "Dhaka",
    "Douchanbé": "Dushanbe",
    "Erevan": "Yerevan",
    "La Havane": "Havana",
    "Hanoï": "Hanoi",
    "Jérusalem": "Jerusalem",
    "Kaboul": "Kabul",
    "Katmandou": "Kathmandu",
    "Kiev": "Kyiv",
    "Lisbonne": "Lisbon",
    "Londres": "London",
    "Moscou": "Moscow",
    "Mascate": "Muscat",
    "Nicosie": "Nicosia",
    "Oulan-Bator": "Ulaanbaatar",
    "Pékin": "Beijing",
    "Prague": "Prague",
    "Reykjavik": "Reykjavik",
    "Riyad": "Riyadh",
    "Rome": "Rome",
    "Saint-Domingue": "Santo Domingo",
    "Séoul": "Seoul",
    "Tachkent": "Tashkent",
    "Tbilissi": "Tbilisi",
    "Téhéran": "Tehran",
    "La Valette": "Valletta",
    "Varsovie": "Warsaw",
    "Vienne": "Vienna",
    "Tokyo": "Tokyo",
    "Berlin": "Berlin",
    "Madrid": "Madrid",
    "Nouméa": "Nouméa",
    "Paris": "Paris",
    "Turin": "Turin",
    "Munich": "Munich",
    "Séville": "Seville",
    "Venise": "Venice",
    "Florence": "Florence",
    "Milan": "Milan",
    "Barcelone": "Barcelona",
    "Naples": "Naples",
    "Genève": "Geneva",
    "La Haye": "The Hague",
    "Anvers": "Antwerp",
    "Gand": "Ghent",
    "Cologne": "Cologne",
    "Le Cap": "Cape Town"
}

YEAR_MAP = {
    "q_0831": "In what year did the Normandy landings (D-Day) take place?",
    "q_0832": "In what year did Christopher Columbus reach the Americas?",
    "q_0833": "In what year did World War I begin?",
    "q_0834": "In what year did the French Revolution begin?",
    "q_0835": "In what year did World War II begin?",
    "q_0836": "In what year did World War II end?",
    "q_0837": "In what year did the September 11 terrorist attacks take place?",
    "q_0838": "In what year did the May 68 protests and strikes occur in France?",
    "q_0842": "In what year did the Battle of Waterloo take place?",
    "q_0843": "In what year did physical euro coins and banknotes enter circulation?",
    "q_0844": "In what year was the Covid-19 pandemic declared by the WHO?",
    "q_0845": "In what year was the Eiffel Tower inaugurated?",
    "q_0846": "In what year did the Titanic sink?",
    "q_0847": "In what year did the United States declare independence?",
    "q_0862": "In what year did the Battle of Hastings take place?",
    "q_0863": "In what year was Charlemagne crowned Emperor of the Romans?",
    "q_0864": "In what year did Constantinople fall to the Ottoman Empire?",
    "q_0865": "In what year did Adolf Hitler become Chancellor of Germany?",
    "q_0866": "In what year was John F. Kennedy assassinated?",
    "q_0867": "In what year was Germany officially reunified?",
    "q_0868": "In what year did India gain independence from British rule?",
    "q_0869": "In what year was the Soviet Union dissolved?",
    "q_0870": "In what year did the Battle of Marignano take place?",
    "q_0871": "In what year did the Battle of Verdun begin?",
    "q_0872": "In what year did the Chernobyl nuclear disaster occur?",
    "q_0873": "In what year did the Algerian War end?",
    "q_0874": "In what year was capital punishment abolished in France?",
    "q_0875": "In what year did the United Kingdom vote for Brexit in a referendum?",
    "q_0876": "In what year did the Wall Street Crash occur?",
    "q_0877": "In what year was the Berlin Wall constructed?",
    "q_0878": "In what year did the Wright brothers make the first powered airplane flight?",
    "q_0879": "In what year did women obtain the right to vote in France?",
    "q_0880": "In what year was King Louis XVI executed by guillotine?",
    "q_0881": "In what year did Martin Luther King Jr. deliver his 'I Have a Dream' speech?",
    "q_0882": "In what year was Napoleon Bonaparte crowned Emperor of the French?",
    "q_0883": "In what year was Nelson Mandela released from prison?",
    "q_0902": "In what year was Abraham Lincoln assassinated?",
    "q_0903": "In what year did Charles Lindbergh complete the first solo nonstop transatlantic flight?",
    "q_0904": "In what year was Mahatma Gandhi assassinated?",
    "q_0905": "In what year did King Henry IV issue the Edict of Nantes?",
    "q_0906": "In what year was Joan of Arc burned at the stake in Rouen?",
    "q_0907": "In what year was slavery definitively abolished in France?",
    "q_0908": "In what year did the Paris Commune take place?",
    "q_0909": "In what year did the American Civil War begin?",
    "q_0910": "In what year was the French law on the Separation of the Churches and the State enacted?",
    "q_0911": "In what year did Queen Elizabeth II ascend to the throne?",
    "q_0912": "In what year was the People's Republic of China proclaimed?",
    "q_0913": "In what year did the Great Fire of London occur?",
    "q_0914": "In what year was the Maastricht Treaty signed, establishing the European Union?",
    "q_0915": "In what year was the Treaty of Rome signed, establishing the EEC?",
    "q_0916": "In what year did Louis Blériot complete the first airplane flight across the English Channel?",
    "q_0917": "In what year did Martin Luther post his Ninety-five Theses?",
    "q_0918": "In what year did Napoleon Bonaparte die in exile on Saint Helena?",
    "q_0919": "In what year did the Fall of Saigon mark the end of the Vietnam War?",
    "q_0920": "In what year did Vasco da Gama reach India by sea?",
    "q_0932": "In what year was Galileo Galilei condemned by the Roman Inquisition?",
    "q_0933": "In what year did the Battle of Bouvines take place?",
    "q_0934": "In what year did the Thirty Years' War begin?",
    "q_0935": "In what year did the Black Death pandemic arrive in Europe?",
    "q_0936": "In what year was the French Third Republic proclaimed?",
    "q_0937": "In what year was the Kingdom of Italy officially proclaimed?",
    "q_0938": "In what year did Ferdinand Magellan begin his expedition to circumnavigate the globe?",
    "q_0942": "In what year did the Crimean War begin?",
    "q_0943": "In what year did King Louis IX (Saint Louis) die in Tunis?",
    "q_1173": "In what year did France win its first FIFA World Cup in football?",
    "q_1281": "In what year was the social media platform Facebook launched?",
    "q_1282": "In what year was the first Apple iPhone introduced?",
    "q_1307": "In what year was the multinational technology company Google founded?",
    "q_1308": "In what year was the video-sharing platform YouTube founded?"
}

EXACT_439 = {
    "q_0100": [
        "How many strings does a violin have?",
        [
            "6",
            "4",
            "5",
            "8"
        ]
    ],
    "q_0101": [
        "How many strings does a standard classical guitar have?",
        [
            "12",
            "4",
            "6",
            "7"
        ]
    ],
    "q_0102": [
        "How many natural notes are in the diatonic scale from C to B?",
        [
            "5",
            "8",
            "7",
            "12"
        ]
    ],
    "q_0103": [
        "In which city is the Musée d'Orsay located?",
        [
            "Brussels",
            "Paris",
            "Lyon",
            "London"
        ]
    ],
    "q_0104": [
        "Which prestigious award is presented at the Cannes Film Festival?",
        [
            "Palme d'Or",
            "Oscar",
            "Golden Bear",
            "Golden Lion"
        ]
    ],
    "q_0107": [
        "What is the Indian Hindi cinema industry centered in Mumbai called?",
        [
            "Hollywood",
            "Bollywood",
            "Nollywood",
            "Cinecittà"
        ]
    ],
    "q_0108": [
        "In which city is the MoMA (Museum of Modern Art) located?",
        [
            "Los Angeles",
            "Boston",
            "Chicago",
            "New York"
        ]
    ],
    "q_0109": [
        "Which architect designed the Sagrada Família?",
        [
            "Le Corbusier",
            "Antoni Gaudí",
            "Frank Lloyd Wright",
            "Oscar Niemeyer"
        ]
    ],
    "q_0110": [
        "Which artistic movement is associated with Claude Monet?",
        [
            "Surrealism",
            "Fauvism",
            "Impressionism",
            "Cubism"
        ]
    ],
    "q_0111": [
        "Which artistic movement is associated with Picasso and Braque?",
        [
            "Romanticism",
            "Fauvism",
            "Dadaism",
            "Cubism"
        ]
    ],
    "q_0112": [
        "Which artistic movement is associated with Salvador Dalí?",
        [
            "Impressionism",
            "Surrealism",
            "Cubism",
            "Pop art"
        ]
    ],
    "q_0113": [
        "Which pipe instrument has one or more keyboards and pedals?",
        [
            "Harpsichord",
            "Piano",
            "Accordion",
            "Pipe organ"
        ]
    ],
    "q_0114": [
        "Which musical clef is used for higher-pitched notes?",
        [
            "C clef (D)",
            "Treble clef (G clef)",
            "Alto clef (C clef)",
            "Bass clef (F clef)"
        ]
    ],
    "q_0131": [
        "In which city is the Uffizi Gallery located?",
        [
            "Venice",
            "Florence",
            "Milan",
            "Rome"
        ]
    ],
    "q_0132": [
        "In which city is the Prado Museum located?",
        [
            "Barcelona",
            "Seville",
            "Madrid",
            "Lisbon"
        ]
    ],
    "q_0133": [
        "In which city is the Rijksmuseum located?",
        [
            "Rotterdam",
            "Brussels",
            "Amsterdam",
            "The Hague"
        ]
    ],
    "q_0134": [
        "Which architect designed the Paris Opera house inaugurated in 1875?",
        [
            "Gustave Eiffel",
            "Viollet-le-Duc",
            "Charles Garnier",
            "Haussmann"
        ]
    ],
    "q_0135": [
        "Which architect designed the Louvre Pyramid?",
        [
            "Renzo Piano",
            "Jean Nouvel",
            "Norman Foster",
            "I. M. Pei"
        ]
    ],
    "q_0136": [
        "Which art movement is associated with Andy Warhol?",
        [
            "Pop art",
            "Impressionism",
            "Baroque",
            "Cubism"
        ]
    ],
    "q_0137": [
        "Which male voice type is the lowest in a choir?",
        [
            "Bass",
            "Countertenor",
            "Tenor",
            "Baritone"
        ]
    ],
    "q_0150": [
        "In which city is the Hermitage Museum located?",
        [
            "Vienna",
            "Moscow",
            "Kyiv",
            "Saint Petersburg"
        ]
    ],
    "q_0151": [
        "Which architect designed Villa Savoye?",
        [
            "Le Corbusier",
            "Alvar Aalto",
            "Mies van der Rohe",
            "Auguste Perret"
        ]
    ],
    "q_0152": [
        "Which architect designed the Guggenheim Museum Bilbao?",
        [
            "Frank Gehry",
            "Rem Koolhaas",
            "Santiago Calatrava",
            "Zaha Hadid"
        ]
    ],
    "q_0153": [
        "Which painting technique uses small juxtaposed dots of color?",
        [
            "Tachisme",
            "Pointillism",
            "Fresco",
            "Fauvism"
        ]
    ],
    "q_0171": [
        "What is the oldest film festival in the world?",
        [
            "Locarno Film Festival",
            "Cannes Film Festival",
            "Venice Film Festival",
            "Berlin International Film Festival"
        ]
    ],
    "q_0184": [
        "How many states make up the United States of America?",
        [
            "52",
            "48",
            "51",
            "50"
        ]
    ],
    "q_0185": [
        "How many letters are in the standard basic Latin and French alphabet?",
        [
            "24",
            "26",
            "25",
            "28"
        ]
    ],
    "q_0186": [
        "Which Greek god is the king of the gods on Mount Olympus?",
        [
            "Apollo",
            "Zeus",
            "Ares",
            "Poseidon"
        ]
    ],
    "q_0187": [
        "What is the national anthem of France?",
        [
            "Le Chant des Partisans",
            "La Marseillaise",
            "L'Internationale",
            "Le Temps des cerises"
        ]
    ],
    "q_0188": [
        "On what day is the French National Day (Bastille Day) celebrated?",
        [
            "July 14",
            "June 6",
            "May 8",
            "November 11"
        ]
    ],
    "q_0189": [
        "Which country honors Saint Patrick as its patron saint?",
        [
            "Scotland",
            "Ireland",
            "Wales",
            "England"
        ]
    ],
    "q_0193": [
        "Which language uses an alphabet derived from the Cyrillic script?",
        [
            "Polish",
            "Russian",
            "Czech",
            "Hungarian"
        ]
    ],
    "q_0205": [
        "What is the Islamic holy month of fasting called?",
        [
            "Hajj",
            "Ramadan",
            "Eid",
            "Lent"
        ]
    ],
    "q_0206": [
        "Which Greek god rules over the sea?",
        [
            "Hades",
            "Zeus",
            "Poseidon",
            "Ares"
        ]
    ],
    "q_0207": [
        "Which Norse god wields the hammer Mjölnir?",
        [
            "Freyr",
            "Odin",
            "Thor",
            "Loki"
        ]
    ],
    "q_0208": [
        "What is the Roman equivalent of the Greek god Zeus?",
        [
            "Jupiter",
            "Apollo",
            "Neptune",
            "Mars"
        ]
    ],
    "q_0209": [
        "What is the name of the international organization headquartered in New York comprising nearly all world states?",
        [
            "NATO",
            "UNESCO",
            "UN",
            "WTO"
        ]
    ],
    "q_0210": [
        "Which Greek hero accomplished the twelve labors?",
        [
            "Perseus",
            "Achilles",
            "Heracles (Hercules)",
            "Theseus"
        ]
    ],
    "q_0211": [
        "What is the official language of Austria?",
        [
            "Hungarian",
            "French",
            "German",
            "Italian"
        ]
    ],
    "q_0218": [
        "Which language is spoken by the vast majority of people in Mexico?",
        [
            "Spanish",
            "Portuguese",
            "Nahuatl",
            "English"
        ]
    ],
    "q_0219": [
        "Which holy city in Saudi Arabia is the primary pilgrimage site of Islam?",
        [
            "Medina",
            "Mecca",
            "Karbala",
            "Jerusalem"
        ]
    ],
    "q_0245": [
        "How many stars are on the Flag of Europe?",
        [
            "15",
            "10",
            "27",
            "12"
        ]
    ],
    "q_0246": [
        "How many stripes are on the flag of the United States?",
        [
            "13",
            "50",
            "12",
            "15"
        ]
    ],
    "q_0247": [
        "What is the central religious text of Judaism called?",
        [
            "The Torah",
            "The Vedas",
            "The Tripitaka",
            "The Quran"
        ]
    ],
    "q_0248": [
        "Who is the chief god in Norse mythology?",
        [
            "Thor",
            "Loki",
            "Baldr",
            "Odin"
        ]
    ],
    "q_0249": [
        "Which Greek hero slew the Minotaur in the Cretan Labyrinth?",
        [
            "Perseus",
            "Jason",
            "Odysseus",
            "Theseus"
        ]
    ],
    "q_0250": [
        "Which mythological Gorgon had venomous snakes in place of hair?",
        [
            "Medusa",
            "The Chimera",
            "The Minotaur",
            "The Hydra"
        ]
    ],
    "q_0251": [
        "Which French philosopher and mathematician wrote 'Pensées'?",
        [
            "René Descartes",
            "Blaise Pascal",
            "Voltaire",
            "Michel de Montaigne"
        ]
    ],
    "q_0252": [
        "Which classical Greek philosopher founded the Academy in Athens?",
        [
            "Plato",
            "Pythagoras",
            "Socrates",
            "Aristotle"
        ]
    ],
    "q_0253": [
        "Which Greek goddess of love corresponds to the Roman goddess Venus?",
        [
            "Hera",
            "Aphrodite",
            "Athena",
            "Artemis"
        ]
    ],
    "q_0254": [
        "Which language has the most native speakers worldwide?",
        [
            "Hindi",
            "Spanish",
            "English",
            "Mandarin Chinese"
        ]
    ],
    "q_0270": [
        "Which major Hindu festival is celebrated as the festival of lights?",
        [
            "Ganesh Chaturthi",
            "Diwali",
            "Holi",
            "Navaratri"
        ]
    ],
    "q_0271": [
        "Which international agency headquartered in Geneva directs international public health?",
        [
            "UNESCO",
            "UNICEF",
            "FAO",
            "WHO"
        ]
    ],
    "q_0300": [
        "How many letters are in the classical Greek alphabet?",
        [
            "22",
            "26",
            "24",
            "28"
        ]
    ],
    "q_0301": [
        "What is the lower house of the Parliament of the United Kingdom called?",
        [
            "House of Commons",
            "Bundestag",
            "House of Lords",
            "Senate"
        ]
    ],
    "q_0302": [
        "In which language was the original text of the Hebrew Bible (Old Testament) primarily composed?",
        [
            "Aramaic",
            "Latin",
            "Biblical Hebrew",
            "Greek"
        ]
    ],
    "q_0303": [
        "In which city is the official seat of the European Parliament located?",
        [
            "Frankfurt",
            "Luxembourg",
            "Strasbourg",
            "Brussels"
        ]
    ],
    "q_0304": [
        "Which ancient Egyptian jackal-headed god is associated with mummification and the afterlife?",
        [
            "Set",
            "Osiris",
            "Anubis",
            "Horus"
        ]
    ],
    "q_0305": [
        "Which German philosopher wrote 'Thus Spoke Zarathustra'?",
        [
            "Arthur Schopenhauer",
            "Georg Wilhelm Friedrich Hegel",
            "Immanuel Kant",
            "Friedrich Nietzsche"
        ]
    ],
    "q_0316": [
        "Which Jewish holiday marks the biblical New Year?",
        [
            "Hanukkah",
            "Passover",
            "Yom Kippur",
            "Rosh Hashanah"
        ]
    ],
    "q_0342": [
        "Which German Enlightenment philosopher wrote the 'Critique of Pure Reason'?",
        [
            "Georg Wilhelm Friedrich Hegel",
            "Immanuel Kant",
            "Friedrich Nietzsche",
            "David Hume"
        ]
    ],
    "q_0361": [
        "What is the name of Tintin's dog?",
        [
            "Snoopy",
            "Snowy (Milou)",
            "Dogmatix (Idéfix)",
            "Rantanplan"
        ]
    ],
    "q_0362": [
        "In which animated film does a clownfish named Marlin search for his son?",
        [
            "Shark Tale",
            "Finding Nemo",
            "The Little Mermaid",
            "Moana"
        ]
    ],
    "q_0363": [
        "In which Hogwarts house is Harry Potter sorted?",
        [
            "Slytherin",
            "Gryffindor",
            "Hufflepuff",
            "Ravenclaw"
        ]
    ],
    "q_0364": [
        "In which series does the Iron Throne appear?",
        [
            "The Witcher",
            "Game of Thrones",
            "Vikings",
            "The Rings of Power"
        ]
    ],
    "q_0365": [
        "In which series of games and cartoons can Pikachu be found?",
        [
            "Digimon",
            "Yu-Gi-Oh!",
            "Pokémon",
            "Dragon Ball"
        ]
    ],
    "q_0366": [
        "What is the secret identity of Batman in Gotham City?",
        [
            "Peter Parker",
            "Clark Kent",
            "Bruce Wayne",
            "Tony Stark"
        ]
    ],
    "q_0367": [
        "What is the secret identity of Spider-Man?",
        [
            "Bruce Wayne",
            "Tony Stark",
            "Clark Kent",
            "Peter Parker"
        ]
    ],
    "q_0368": [
        "What is the true identity of Superman?",
        [
            "Bruce Wayne",
            "Peter Parker",
            "Barry Allen",
            "Clark Kent"
        ]
    ],
    "q_0369": [
        "Which actor plays Jack Sparrow in Pirates of the Caribbean?",
        [
            "Brad Pitt",
            "Johnny Depp",
            "Leonardo DiCaprio",
            "Orlando Bloom"
        ]
    ],
    "q_0370": [
        "Which actor plays Neo in the Matrix film saga?",
        [
            "Brad Pitt",
            "Keanu Reeves",
            "Tom Cruise",
            "Will Smith"
        ]
    ],
    "q_0371": [
        "Which animated film features the song 'Let It Go'?",
        [
            "Moana",
            "Tangled",
            "Brave",
            "Frozen"
        ]
    ],
    "q_0372": [
        "Which British band sang 'Hey Jude' and 'Let It Be'?",
        [
            "The Beatles",
            "The Rolling Stones",
            "The Who",
            "Queen"
        ]
    ],
    "q_0373": [
        "Which British rock band was led by Freddie Mercury?",
        [
            "The Police",
            "Queen",
            "Pink Floyd",
            "Led Zeppelin"
        ]
    ],
    "q_0374": [
        "Which comic book Gaul character fell into the magic potion as a baby?",
        [
            "Unhygienix (Ordralfabétix)",
            "Cacofonix (Assurancetourix)",
            "Asterix",
            "Obelix"
        ]
    ],
    "q_0375": [
        "Which comic strip character is a lazy orange cat who loves lasagna?",
        [
            "Tom",
            "Garfield",
            "Sylvester",
            "Felix"
        ]
    ],
    "q_0376": [
        "Which Italian plumber character in red dungarees is Nintendo's mascot?",
        [
            "Luigi",
            "Wario",
            "Toad",
            "Mario"
        ]
    ],
    "q_0377": [
        "Which Swedish pop group sang 'Dancing Queen' and 'Mamma Mia'?",
        [
            "Roxette",
            "Ace of Base",
            "A-ha",
            "ABBA"
        ]
    ],
    "q_0378": [
        "Which superhero is the secret alter ego of billionaire Bruce Wayne?",
        [
            "Batman",
            "Green Arrow",
            "Superman",
            "Iron Man"
        ]
    ],
    "q_0379": [
        "Which superhero is the secret alter ego of high school student Peter Parker?",
        [
            "Daredevil",
            "Batman",
            "Superman",
            "Spider-Man"
        ]
    ],
    "q_0380": [
        "Which actress portrays Hermione Granger in the Harry Potter film series?",
        [
            "Emma Stone",
            "Emma Watson",
            "Keira Knightley",
            "Saoirse Ronan"
        ]
    ],
    "q_0381": [
        "Which Canadian singer performed the Titanic theme song 'My Heart Will Go On'?",
        [
            "Alanis Morissette",
            "Shania Twain",
            "Celine Dion",
            "Avril Lavigne"
        ]
    ],
    "q_0382": [
        "Which cartoon family with yellow skin lives in the town of Springfield?",
        [
            "Futurama",
            "South Park",
            "Family Guy",
            "The Simpsons"
        ]
    ],
    "q_0383": [
        "Which sitcom follows six Manhattan friends including Rachel, Ross, and Monica?",
        [
            "Seinfeld",
            "Friends",
            "How I Met Your Mother",
            "The Big Bang Theory"
        ]
    ],
    "q_0385": [
        "What is the name of the headmaster of Hogwarts in the early Harry Potter books?",
        [
            "Albus Dumbledore",
            "Severus Snape",
            "Rubeus Hagrid",
            "Lord Voldemort"
        ]
    ],
    "q_0386": [
        "In which Netflix series does the psychokinetic character Eleven appear?",
        [
            "Riverdale",
            "Black Mirror",
            "Stranger Things",
            "The Umbrella Academy"
        ]
    ],
    "q_0387": [
        "In which Nintendo game series does the player control the hero Link?",
        [
            "Final Fantasy",
            "Kirby",
            "The Legend of Zelda",
            "Metroid"
        ]
    ],
    "q_0388": [
        "In which television drama does chemistry teacher Walter White turn to manufacturing methamphetamine?",
        [
            "Dexter",
            "Breaking Bad",
            "Ozark",
            "Better Call Saul"
        ]
    ],
    "q_0389": [
        "Which actor portrays Thor, God of Thunder, in the Marvel Cinematic Universe?",
        [
            "Chris Pratt",
            "Chris Pine",
            "Chris Evans",
            "Chris Hemsworth"
        ]
    ],
    "q_0390": [
        "Which French actor plays Driss in the hit comedy-drama 'The Intouchables'?",
        [
            "Roschdy Zem",
            "Kad Merad",
            "Omar Sy",
            "Tahar Rahim"
        ]
    ],
    "q_0391": [
        "Which actor plays Forrest Gump in the 1994 film?",
        [
            "Kevin Costner",
            "Bill Murray",
            "Tom Cruise",
            "Tom Hanks"
        ]
    ],
    "q_0392": [
        "Which actor stars as Neo in 'The Matrix' trilogy?",
        [
            "Keanu Reeves",
            "Brad Pitt",
            "Tom Cruise",
            "Johnny Depp"
        ]
    ],
    "q_0393": [
        "Which actor stars as secret agent OSS 117 in the spy comedies by Michel Hazanavicius?",
        [
            "Jean Dujardin",
            "Gilles Lellouche",
            "Dany Boon",
            "Vincent Cassel"
        ]
    ],
    "q_0394": [
        "Which actor created and stars as boxing champion Rocky Balboa?",
        [
            "Sylvester Stallone",
            "Bruce Willis",
            "Arnold Schwarzenegger",
            "Mel Gibson"
        ]
    ],
    "q_0395": [
        "Which musician wrote and performed the 1971 peace anthem 'Imagine'?",
        [
            "John Lennon",
            "Bob Dylan",
            "Elton John",
            "Paul McCartney"
        ]
    ],
    "q_0396": [
        "In The Lord of the Rings, what is the precious item Frodo must destroy?",
        [
            "The One Ring",
            "The Arkenstone",
            "The Palantír",
            "The Silmaril"
        ]
    ],
    "q_0397": [
        "In which animated film does a green ogre marry Princess Fiona?",
        [
            "Shrek",
            "Monsters, Inc.",
            "Madagascar",
            "Toy Story"
        ]
    ],
    "q_0398": [
        "In which board game do players buy streets like Boardwalk or Rue de la Paix?",
        [
            "Monopoly",
            "Scrabble",
            "Clue",
            "Trivial Pursuit"
        ]
    ],
    "q_0399": [
        "In which sci-fi saga does the Millennium Falcon appear?",
        [
            "Star Trek",
            "Star Wars",
            "Dune",
            "Battlestar Galactica"
        ]
    ],
    "q_0400": [
        "In which video game do players explore and build in a voxel block world?",
        [
            "Minecraft",
            "Roblox",
            "Terraria",
            "Fortnite"
        ]
    ],
    "q_0401": [
        "In which video game saga does the hero Link try to save Princess Zelda?",
        [
            "Final Fantasy",
            "Dragon Quest",
            "Fire Emblem",
            "The Legend of Zelda"
        ]
    ],
    "q_0402": [
        "What color is the submarine in the famous 1968 Beatles song?",
        [
            "Red",
            "Blue",
            "Green",
            "Yellow"
        ]
    ],
    "q_0403": [
        "What is the name of the droid shaped like a trashcan with beeps in Star Wars?",
        [
            "C-3PO",
            "BB-8",
            "R2-D2",
            "K-2SO"
        ]
    ],
    "q_0404": [
        "What is the name of the fictional kingdom in Disney's Frozen?",
        [
            "Corona",
            "Arendelle",
            "Genovia",
            "Atlantica"
        ]
    ],
    "q_0419": [
        "At which London railway station is the magical Platform 9¾ located?",
        [
            "Paddington",
            "Waterloo",
            "King's Cross",
            "Victoria"
        ]
    ],
    "q_0420": [
        "In which sci-fi video game franchise is Master Chief the central protagonist?",
        [
            "Halo",
            "Destiny",
            "Gears of War",
            "Mass Effect"
        ]
    ],
    "q_0421": [
        "In which British television series does the Doctor travel across space and time in the TARDIS?",
        [
            "Torchwood",
            "Black Mirror",
            "Doctor Who",
            "Red Dwarf"
        ]
    ],
    "q_0422": [
        "Which French actor played Obelix in 'Asterix and Obelix vs. Caesar' (1999)?",
        [
            "Daniel Auteuil",
            "Christian Clavier",
            "Gérard Depardieu",
            "Jean Reno"
        ]
    ],
    "q_0423": [
        "Which actor played the Joker in Christopher Nolan's 'The Dark Knight' (2008)?",
        [
            "Jared Leto",
            "Jack Nicholson",
            "Joaquin Phoenix",
            "Heath Ledger"
        ]
    ],
    "q_0424": [
        "Which actor portrayed general Maximus Decimus Meridius in Ridley Scott's 'Gladiator'?",
        [
            "Russell Crowe",
            "Gerard Butler",
            "Mel Gibson",
            "Brad Pitt"
        ]
    ],
    "q_0425": [
        "Which Michael Jackson album released in 1982 is the best-selling studio album in history?",
        [
            "Thriller",
            "Dangerous",
            "Bad",
            "Off the Wall"
        ]
    ],
    "q_0426": [
        "Which Belgian singer-songwriter wrote and performed the emotional chanson 'Ne me quitte pas'?",
        [
            "Stromae",
            "Georges Moustaki",
            "Jacques Brel",
            "Claude François"
        ]
    ],
    "q_0427": [
        "Which American composer composed the orchestral score for 'Star Wars'?",
        [
            "John Williams",
            "Hans Zimmer",
            "Ennio Morricone",
            "Danny Elfman"
        ]
    ],
    "q_0428": [
        "In Friends, what is the name of the coffee shop where the six characters hang out?",
        [
            "Central Perk",
            "Monk's Diner",
            "MacLaren's",
            "Luke's Diner"
        ]
    ],
    "q_0429": [
        "In Pulp Fiction, what is the name of the hitman played by John Travolta?",
        [
            "Vincent Vega",
            "Jules Winnfield",
            "Butch Coolidge",
            "Marsellus Wallace"
        ]
    ],
    "q_0430": [
        "In Star Wars, who is revealed to be Luke Skywalker's father in The Empire Strikes Back?",
        [
            "Darth Vader",
            "Obi-Wan Kenobi",
            "Yoda",
            "Emperor Palpatine"
        ]
    ],
    "q_0431": [
        "In the Simpsons series, what is the name of the family dog?",
        [
            "Snowball II",
            "Santa's Little Helper",
            "Brian",
            "Pluto"
        ]
    ],
    "q_0432": [
        "What famous DeLorean time machine vehicle feature requires 1.21 gigawatts of power in Back to the Future?",
        [
            "The Hyperdrive",
            "The Flux Capacitor",
            "The Warp Core",
            "The TARDIS"
        ]
    ],
    "q_0433": [
        "What is the name of the fictional town in Indiana where Stranger Things takes place?",
        [
            "Hawkins",
            "Riverdale",
            "Twin Peaks",
            "Springfield"
        ]
    ],
    "q_0434": [
        "What is the name of the fictional universe where the miniature wargame Warhammer 40,000 takes place?",
        [
            "Mortal Realms",
            "The 41st Millennium",
            "The Old World",
            "Middle-earth"
        ]
    ],
    "q_0435": [
        "What is the name of the yellow circle that eats dots while chased by ghosts in an arcade game?",
        [
            "Pac-Man",
            "Q*bert",
            "Dig Dug",
            "Galaga"
        ]
    ],
    "q_0436": [
        "Which actor plays Walter White in the series Breaking Bad?",
        [
            "Bryan Cranston",
            "Aaron Paul",
            "Jon Hamm",
            "Bob Odenkirk"
        ]
    ],
    "q_0437": [
        "Which actor plays Forrest Gump in the 1994 movie?",
        [
            "Robin Williams",
            "Tom Hanks",
            "Kevin Costner",
            "Tom Cruise"
        ]
    ],
    "q_0438": [
        "Which actor played the Joker in The Dark Knight (2008)?",
        [
            "Jack Nicholson",
            "Heath Ledger",
            "Joaquin Phoenix",
            "Jared Leto"
        ]
    ],
    "q_0459": [
        "What is the real name of Heisenberg in the series Breaking Bad?",
        [
            "Jesse Pinkman",
            "Saul Goodman",
            "Walter White",
            "Hank Schrader"
        ]
    ],
    "q_0460": [
        "Which board game challenges players to solve a murder by finding the culprit, weapon, and room?",
        [
            "Clue (Cluedo)",
            "Scotland Yard",
            "Mysterium",
            "Sherlock Holmes"
        ]
    ],
    "q_0461": [
        "Which British heavy metal band has an iconic mascot named Eddie the Head?",
        [
            "Judas Priest",
            "Black Sabbath",
            "Iron Maiden",
            "Motörhead"
        ]
    ],
    "q_0462": [
        "Which fictional language was created for Star Trek by linguist Marc Okrand?",
        [
            "Elvish",
            "Esperanto",
            "Dothraki",
            "Klingon"
        ]
    ],
    "q_0463": [
        "Which manga series by Eiichiro Oda follows monkey D. Luffy searching for a legendary treasure?",
        [
            "Naruto",
            "Bleach",
            "One Piece",
            "Hunter x Hunter"
        ]
    ],
    "q_0464": [
        "Which video game features the protagonist Gordon Freeman battling aliens in the Black Mesa facility?",
        [
            "Half-Life",
            "Doom",
            "Quake",
            "BioShock"
        ]
    ],
    "q_0481": [
        "Which actor portrays Captain Jack Sparrow in the Pirates of the Caribbean franchise?",
        [
            "Johnny Depp",
            "Geoffrey Rush",
            "Orlando Bloom",
            "Javier Bardem"
        ]
    ],
    "q_0482": [
        "Which dystopian film by Ridley Scott features Harrison Ford hunting android replicants?",
        [
            "Total Recall",
            "Blade Runner",
            "Alien",
            "Minority Report"
        ]
    ],
    "q_0491": [
        "Which composer composed the cinematic score for 'The Lord of the Rings' film trilogy?",
        [
            "Howard Shore",
            "Hans Zimmer",
            "James Horner",
            "Alan Silvestri"
        ]
    ],
    "q_0496": [
        "Which French dessert is a custard topped with a thin caramelized sugar crust?",
        [
            "Crème brûlée",
            "Chocolate mousse",
            "Flan",
            "Clafoutis"
        ]
    ],
    "q_0497": [
        "What is the main ingredient in bread?",
        [
            "Rice",
            "Flour",
            "Corn",
            "Sugar"
        ]
    ],
    "q_0498": [
        "What is the small oval fruit harvested from Olea europaea?",
        [
            "Walnut",
            "Fig",
            "Olive",
            "Date"
        ]
    ],
    "q_0499": [
        "Which cheese is famous for its holes?",
        [
            "Munster",
            "Comté",
            "Brie",
            "Emmental"
        ]
    ],
    "q_0500": [
        "Which cheese is traditionally used on a Margherita pizza?",
        [
            "Camembert",
            "Gruyère",
            "Roquefort",
            "Mozzarella"
        ]
    ],
    "q_0501": [
        "Which fruit is used to make guacamole?",
        [
            "Mango",
            "Banana",
            "Kiwi",
            "Avocado"
        ]
    ],
    "q_0502": [
        "Which vegetable is the main ingredient of the traditional French gratin soup served with bread and cheese?",
        [
            "Onion",
            "Cabbage",
            "Leek",
            "Carrot"
        ]
    ],
    "q_0503": [
        "Which beverage is made from the fermentation of grapes?",
        [
            "Sake",
            "Beer",
            "Wine",
            "Cider"
        ]
    ],
    "q_0504": [
        "Which hot beverage is brewed from the roasted seeds of a shrub?",
        [
            "Tea",
            "Coffee",
            "Mate",
            "Hot chocolate"
        ]
    ],
    "q_0505": [
        "Which hot beverage is made by infusing dried leaves, originally from China?",
        [
            "Chicory",
            "Rooibos",
            "Coffee",
            "Tea"
        ]
    ],
    "q_0509": [
        "Which yellow citrus fruit is acidic and rich in vitamin C?",
        [
            "Lemon",
            "Grapefruit",
            "Orange",
            "Mandarin"
        ]
    ],
    "q_0510": [
        "From which tree species does chocolate originate?",
        [
            "The cacao tree",
            "The tea plant",
            "The coffee plant",
            "The carob tree"
        ]
    ],
    "q_0511": [
        "Which alcoholic spirit is distilled from the blue agave plant in Mexico?",
        [
            "Rum",
            "Tequila",
            "Gin",
            "Vodka"
        ]
    ],
    "q_0512": [
        "Which alcoholic spirit is distilled from sugarcane juice or molasses in the Caribbean?",
        [
            "Tequila",
            "Brandy",
            "Rum",
            "Whisky"
        ]
    ],
    "q_0513": [
        "Which French pastry consists of layers of puff pastry alternating with pastry cream and icing?",
        [
            "Éclair",
            "Mille-feuille",
            "Paris-Brest",
            "Profiterole"
        ]
    ],
    "q_0514": [
        "What is the primary plant ingredient used to make tofu?",
        [
            "Rice",
            "Wheat",
            "Soybeans",
            "Chickpeas"
        ]
    ],
    "q_0515": [
        "From which fruit is traditional Normandy cider produced?",
        [
            "Apple",
            "Pear",
            "Plum",
            "Grape"
        ]
    ],
    "q_0516": [
        "What are dried grapes called?",
        [
            "Figs",
            "Dates",
            "Prunes",
            "Raisins"
        ]
    ],
    "q_0517": [
        "What are dried plums called?",
        [
            "Figs",
            "Prunes",
            "Apricots",
            "Raisins"
        ]
    ],
    "q_0518": [
        "What is the main ingredient in hummus?",
        [
            "Chickpeas",
            "Lentils",
            "White beans",
            "Split peas"
        ]
    ],
    "q_0519": [
        "What is the main ingredient in tofu?",
        [
            "Soy",
            "Rice",
            "Wheat",
            "Almonds"
        ]
    ],
    "q_0528": [
        "From which plant are traditional tea leaves harvested?",
        [
            "The tea plant (Camellia sinensis)",
            "The coffee plant",
            "Rooibos",
            "Mate shrub"
        ]
    ],
    "q_0529": [
        "What does the Italian culinary phrase 'al dente' mean for cooked pasta?",
        [
            "Cooked firm to the bite",
            "Overcooked and soft",
            "Served in cold water",
            "Cooked with cream"
        ]
    ],
    "q_0530": [
        "What is the primary legume ingredient in Mediterranean hummus?",
        [
            "White beans",
            "Lentils",
            "Chickpeas",
            "Fava beans"
        ]
    ],
    "q_0531": [
        "What is a cold Spanish soup made of blended raw vegetables called?",
        [
            "Gazpacho",
            "Minestrone",
            "Bouillabaisse",
            "Borscht"
        ]
    ],
    "q_0532": [
        "What is the main ingredient of Japanese polenta/paste made from fermented soybeans?",
        [
            "Miso",
            "Wasabi",
            "Mirin",
            "Sake"
        ]
    ],
    "q_0533": [
        "Which alcohol obtained by distilling white wine is produced in Charente?",
        [
            "Calvados",
            "Rum",
            "Armagnac",
            "Cognac"
        ]
    ],
    "q_0534": [
        "Which cereal grain is the staple food of more than half of humanity?",
        [
            "Wheat",
            "Barley",
            "Corn",
            "Rice"
        ]
    ],
    "q_0535": [
        "Which plant's flower buds are pickled and used as a condiment?",
        [
            "Capers",
            "Gherkins",
            "Cloves",
            "Green peppercorns"
        ]
    ],
    "q_0536": [
        "Which spice is extracted from the dried inner bark of a tree?",
        [
            "Nutmeg",
            "Cinnamon",
            "Cardamom",
            "Star anise"
        ]
    ],
    "q_0543": [
        "Which Provençal city in southern France is famous for producing calissons?",
        [
            "Arles",
            "Aix-en-Provence",
            "Nice",
            "Marseille"
        ]
    ],
    "q_0547": [
        "Which cheese is protected by an Italian PDO and aged for at least 12 months?",
        [
            "Parmigiano Reggiano",
            "Gorgonzola",
            "Pecorino",
            "Grana Padano"
        ]
    ],
    "q_0562": [
        "What is the highest mountain peak in the world?",
        [
            "K2",
            "Mont Blanc",
            "Mount Everest",
            "Kilimanjaro"
        ]
    ],
    "q_0566": [
        "Which South American country speaks Portuguese?",
        [
            "Argentina",
            "Colombia",
            "Brazil",
            "Chile"
        ]
    ],
    "q_0567": [
        "Which mountain range separates France from Spain?",
        [
            "The Alps",
            "The Pyrenees",
            "The Carpathians",
            "The Apennines"
        ]
    ],
    "q_0589": [
        "Which canal connects the Atlantic Ocean to the Pacific Ocean in Central America?",
        [
            "The Suez Canal",
            "The Panama Canal",
            "The Corinth Canal",
            "The Kiel Canal"
        ]
    ],
    "q_0590": [
        "Which canal connects the Red Sea to the Mediterranean Sea?",
        [
            "The Suez Canal",
            "The Panama Canal",
            "The Kiel Canal",
            "The Corinth Canal"
        ]
    ],
    "q_0591": [
        "Which country is nickname the 'Land of the Rising Sun'?",
        [
            "China",
            "South Korea",
            "Japan",
            "Thailand"
        ]
    ],
    "q_0618": [
        "What is the largest non-continental island in the world by land area?",
        [
            "Borneo",
            "Iceland",
            "Madagascar",
            "Greenland"
        ]
    ],
    "q_0619": [
        "What is the most populous city in Australia?",
        [
            "Perth",
            "Sydney",
            "Melbourne",
            "Canberra"
        ]
    ],
    "q_0620": [
        "What is the largest and most populous city in Switzerland?",
        [
            "Bern",
            "Geneva",
            "Zurich",
            "Basel"
        ]
    ],
    "q_0621": [
        "What is the largest city in Turkey?",
        [
            "Ankara",
            "Antalya",
            "Izmir",
            "Istanbul"
        ]
    ],
    "q_0622": [
        "What is the largest city in Brazil?",
        [
            "Salvador",
            "Brasilia",
            "São Paulo",
            "Rio de Janeiro"
        ]
    ],
    "q_0623": [
        "What is the largest city in Canada?",
        [
            "Montreal",
            "Ottawa",
            "Vancouver",
            "Toronto"
        ]
    ],
    "q_0648": [
        "Which of these countries is landlocked (has no coastline)?",
        [
            "Portugal",
            "Italy",
            "Greece",
            "Switzerland"
        ]
    ],
    "q_0649": [
        "Which desert covers a large part of Mongolia and northern China?",
        [
            "The Atacama",
            "The Gobi Desert",
            "The Kalahari",
            "The Thar"
        ]
    ],
    "q_0650": [
        "What is the most populous country in Africa?",
        [
            "Ethiopia",
            "Egypt",
            "Nigeria",
            "South Africa"
        ]
    ],
    "q_0651": [
        "What is the largest freshwater lake in the world by surface area?",
        [
            "Lake Superior",
            "Lake Michigan",
            "Lake Victoria",
            "Lake Baikal"
        ]
    ],
    "q_0652": [
        "What is the largest country in Africa by surface area?",
        [
            "Algeria",
            "Democratic Republic of the Congo",
            "Sudan",
            "Libya"
        ]
    ],
    "q_0653": [
        "What is the longest river in Europe?",
        [
            "The Loire",
            "The Danube",
            "The Volga",
            "The Rhine"
        ]
    ],
    "q_0654": [
        "Which river forms part of the border between Texas and Mexico?",
        [
            "The Rio Grande",
            "The Colorado",
            "The Hudson",
            "The Mississippi"
        ]
    ],
    "q_0689": [
        "What is the largest island in the Mediterranean Sea?",
        [
            "Sardinia",
            "Sicily",
            "Corsica",
            "Cyprus"
        ]
    ],
    "q_0696": [
        "In which ocean are the Maldives located?",
        [
            "The Atlantic Ocean",
            "The Pacific Ocean",
            "The Arctic Ocean",
            "The Indian Ocean"
        ]
    ],
    "q_0716": [
        "Which lake is the deepest in the world?",
        [
            "Lake Baikal",
            "Lake Titicaca",
            "Lake Tanganyika",
            "Lake Superior"
        ]
    ],
    "q_0717": [
        "Which country has the longest coastline in the world?",
        [
            "Indonesia",
            "Australia",
            "Russia",
            "Canada"
        ]
    ],
    "q_0746": [
        "What is the largest city in the Netherlands?",
        [
            "The Hague",
            "Amsterdam",
            "Rotterdam",
            "Utrecht"
        ]
    ],
    "q_0758": [
        "Which strait separates Asia from North America?",
        [
            "The Strait of Malacca",
            "The Davis Strait",
            "The Strait of Hormuz",
            "The Bering Strait"
        ]
    ],
    "q_0759": [
        "What is the lowest land elevation point on Earth's surface?",
        [
            "The shores of the Dead Sea",
            "The Danakil Desert",
            "Lake Assal",
            "Death Valley"
        ]
    ],
    "q_0765": [
        "Which landlocked body of water in Central Asia is the world's largest lake by surface area?",
        [
            "Dead Sea",
            "Black Sea",
            "Caspian Sea",
            "Aral Sea"
        ]
    ],
    "q_0839": [
        "Which French emperor was defeated at Waterloo in 1815?",
        [
            "Napoleon III",
            "Napoleon I",
            "Louis XIV",
            "Charles X"
        ]
    ],
    "q_0840": [
        "Which King of France was nicknamed the 'Sun King'?",
        [
            "Louis XVI",
            "Francis I",
            "Louis XIV",
            "Henry IV"
        ]
    ],
    "q_0841": [
        "Who was the first President of the United States?",
        [
            "Thomas Jefferson",
            "Abraham Lincoln",
            "George Washington",
            "John Adams"
        ]
    ],
    "q_0848": [
        "Which Gallic chieftain opposed Julius Caesar at the Battle of Alesia?",
        [
            "Ambiorix",
            "Vercingetorix",
            "Brennus",
            "Dumnorix"
        ]
    ],
    "q_0849": [
        "Which French general launched the radio Appeal of 18 June 1940 from London?",
        [
            "Jean de Lattre de Tassigny",
            "Philippe Pétain",
            "Charles de Gaulle",
            "Philippe Leclerc"
        ]
    ],
    "q_0850": [
        "Which King of France signed the Edict of Nantes granting religious freedom to Protestants in 1598?",
        [
            "Louis XIII",
            "Charles IX",
            "Henry IV",
            "Francis I"
        ]
    ],
    "q_0851": [
        "Which Roman general was assassinated on the Ides of March in 44 BC?",
        [
            "Mark Antony",
            "Pompey",
            "Julius Caesar",
            "Augustus"
        ]
    ],
    "q_0852": [
        "Who was the prime minister of the United Kingdom during most of World War II?",
        [
            "Arthur Neville Chamberlain",
            "Clement Attlee",
            "Winston Churchill",
            "Anthony Eden"
        ]
    ],
    "q_0853": [
        "Who was the young French peasant girl who helped Charles VII be crowned at Reims in 1429?",
        [
            "Genevieve",
            "Joan of Arc",
            "Catherine of Medici",
            "Eleanor of Aquitaine"
        ]
    ],
    "q_0854": [
        "Which British prime minister led the country during most of World War II?",
        [
            "Winston Churchill",
            "Neville Chamberlain",
            "Clement Attlee",
            "Anthony Eden"
        ]
    ],
    "q_0855": [
        "Which King of France was executed by guillotine on the Place de la Révolution in 1793?",
        [
            "Louis XVI",
            "Louis XV",
            "Louis-Philippe I",
            "Louis XVIII"
        ]
    ],
    "q_0856": [
        "Which ancient Greek city-state was renowned for its disciplined warriors and phalanx?",
        [
            "Sparta",
            "Corinth",
            "Thebes",
            "Athens"
        ]
    ],
    "q_0857": [
        "Which pre-Columbian civilization built the citadel of Machu Picchu in Peru?",
        [
            "The Aztecs",
            "The Maya",
            "The Incas",
            "The Toltecs"
        ]
    ],
    "q_0858": [
        "Who was the last active ruler of the Ptolemaic Kingdom of Egypt?",
        [
            "Cleopatra VII",
            "Isis",
            "Nefertiti",
            "Hatshepsut"
        ]
    ],
    "q_0859": [
        "Which Queen of France and wife of Louis XVI was guillotined in Paris in October 1793?",
        [
            "Marie Antoinette",
            "Anne of Austria",
            "Catherine de' Medici",
            "Marie de' Medici"
        ]
    ],
    "q_0860": [
        "Which Roman city was buried under volcanic ash during the eruption of Mount Vesuvius in 79 AD?",
        [
            "Rome",
            "Carthage",
            "Syracuse",
            "Pompeii"
        ]
    ],
    "q_0861": [
        "Which American president was assassinated in Dallas in November 1963?",
        [
            "Richard Nixon",
            "Dwight D. Eisenhower",
            "John F. Kennedy",
            "Lyndon B. Johnson"
        ]
    ],
    "q_0884": [
        "What ancient monument in Rome was completed under Emperor Titus in 80 AD for gladiatorial combat?",
        [
            "The Pantheon",
            "The Colosseum",
            "The Circus Maximus",
            "Trajan's Forum"
        ]
    ],
    "q_0885": [
        "What wall did Emperor Hadrian build across northern Britain in the 2nd century AD?",
        [
            "The Antonine Wall",
            "Hadrian's Wall",
            "The Limes Germanicus",
            "The Aurelian Walls"
        ]
    ],
    "q_0886": [
        "Which ancient civilization developed in the Andes with its capital at Cusco?",
        [
            "The Aztecs",
            "The Incas",
            "The Maya",
            "The Olmecs"
        ]
    ],
    "q_0887": [
        "Which ancient wonder of the world in Alexandria guided sailors with fire at night?",
        [
            "The Colossus of Rhodes",
            "The Lighthouse of Alexandria",
            "The Mausoleum at Halicarnassus",
            "The Temple of Artemis"
        ]
    ],
    "q_0888": [
        "Which civil rights activist delivered the iconic 'I Have a Dream' speech in 1963?",
        [
            "Malcolm X",
            "Rosa Parks",
            "Martin Luther King Jr.",
            "John Lewis"
        ]
    ],
    "q_0889": [
        "Which dynasty founded by King Hugh ruled France from 987 to 1328 in direct line?",
        [
            "The Merovingians",
            "The Carolingians",
            "The Capetian dynasty",
            "The Valois"
        ]
    ],
    "q_0890": [
        "Which Roman emperor was the first to convert to Christianity, founding Constantinople in 330?",
        [
            "Trajan",
            "Marcus Aurelius",
            "Constantine the Great",
            "Theodosius I"
        ]
    ],
    "q_0891": [
        "Which South American general liberated several nations from Spanish rule alongside José de San Martín?",
        [
            "Simón Bolívar",
            "Bernardo O'Higgins",
            "Antonio José de Sucre",
            "Francisco de Miranda"
        ]
    ],
    "q_0892": [
        "Which US president led the Union through the American Civil War and issued the Emancipation Proclamation?",
        [
            "Ulysses S. Grant",
            "Abraham Lincoln",
            "Andrew Jackson",
            "James K. Polk"
        ]
    ],
    "q_0893": [
        "Who was the first emperor of the Roman Empire, formerly known as Octavian?",
        [
            "Julius Caesar",
            "Augustus",
            "Tiberius",
            "Claudius"
        ]
    ],
    "q_0894": [
        "Who was the German monk whose Ninety-five Theses sparked the Protestant Reformation in 1517?",
        [
            "John Calvin",
            "Huldrych Zwingli",
            "Martin Luther",
            "Philipp Melanchthon"
        ]
    ],
    "q_0895": [
        "Which century in European history is known as the 'Age of Enlightenment'?",
        [
            "The 19th century",
            "The 18th century",
            "The 17th century",
            "The 16th century"
        ]
    ],
    "q_0896": [
        "Which decisive 1805 naval battle saw Admiral Nelson defeat the joint Franco-Spanish fleet?",
        [
            "Battle of Trafalgar",
            "Battle of the Nile",
            "Battle of Navarino",
            "Battle of Jutland"
        ]
    ],
    "q_0897": [
        "Which Mesoamerican empire had its capital city at Tenochtitlan (modern Mexico City)?",
        [
            "The Aztecs",
            "The Toltecs",
            "The Zapotecs",
            "The Maya"
        ]
    ],
    "q_0898": [
        "Which royal Frankish dynasty did Charlemagne belong to?",
        [
            "The Capetians",
            "The Merovingians",
            "The Bourbons",
            "The Carolingians"
        ]
    ],
    "q_0899": [
        "What was the capital city of the Byzantine Empire until its fall in 1453?",
        [
            "Athens",
            "Constantinople",
            "Rome",
            "Alexandria"
        ]
    ],
    "q_0900": [
        "Which British monarch reigned over the United Kingdom throughout Victorian era from 1837 to 1901?",
        [
            "Elizabeth II",
            "Anne",
            "Mary I",
            "Victoria"
        ]
    ],
    "q_0921": [
        "Which mountaineer from New Zealand reached the summit of Mount Everest with Tenzing Norgay in 1953?",
        [
            "George Mallory",
            "Reinhold Messner",
            "Edward Whymper",
            "Edmund Hillary"
        ]
    ],
    "q_0922": [
        "Which Spanish conquistador conquered the Inca Empire and captured Emperor Atahualpa?",
        [
            "Ferdinand Magellan",
            "Hernán Cortés",
            "Pedro de Valdivia",
            "Francisco Pizarro"
        ]
    ],
    "q_0923": [
        "Which Roman emperor founded Constantinople and made it the new imperial capital in 330 AD?",
        [
            "Augustus",
            "Constantine the Great",
            "Nero",
            "Trajan"
        ]
    ],
    "q_0924": [
        "Which Norwegian polar explorer was the first person to reach the Geographic South Pole in December 1911?",
        [
            "Roald Amundsen",
            "Robert Falcon Scott",
            "Fridtjof Nansen",
            "Ernest Shackleton"
        ]
    ],
    "q_0925": [
        "Which Carthaginian general crossed the Alps with war elephants to fight Rome in 218 BC?",
        [
            "Hamilcar Barca",
            "Hannibal Barca",
            "Hasdrubal Barca",
            "Mago Barca"
        ]
    ],
    "q_0926": [
        "Which French statesman served as chief minister to King Louis XIII and consolidated royal power?",
        [
            "Cardinal Mazarin",
            "Jean-Baptiste Colbert",
            "Cardinal Richelieu",
            "Nicolas Fouquet"
        ]
    ],
    "q_0927": [
        "Which naval battle in 1571 saw the Holy League defeat the Ottoman fleet off western Greece?",
        [
            "Battle of Preveza",
            "Battle of Navarino",
            "Battle of Lepanto",
            "Battle of Djerba"
        ]
    ],
    "q_0928": [
        "Which Prussian leader served as the first Chancellor of the German Empire in 1871?",
        [
            "Helmut von Moltke",
            "Otto von Bismarck",
            "Bernhard von Bülow",
            "Wilhelm I"
        ]
    ],
    "q_0929": [
        "Which Russian empress expanded the Russian Empire and patronized the European Enlightenment from 1762 to 1796?",
        [
            "Elizabeth of Russia",
            "Catherine the Great",
            "Anna of Russia",
            "Catherine I"
        ]
    ],
    "q_0931": [
        "Who led the historic Salt March protest in British India in 1930?",
        [
            "Rabindranath Tagore",
            "Mahatma Gandhi",
            "Jawaharlal Nehru",
            "Muhammad Ali Jinnah"
        ]
    ],
    "q_0939": [
        "Which treaty signed in 843 divided the Carolingian Empire among the three grandsons of Charlemagne?",
        [
            "Treaty of Meerssen",
            "Treaty of Ribemont",
            "Treaty of Verdun",
            "Treaty of Prüm"
        ]
    ],
    "q_0940": [
        "Which victory by King Philip II Augustus in 1214 solidified the French monarchy against an Anglo-Flemish-German coalition?",
        [
            "Battle of Bouvines",
            "Battle of Rocroi",
            "Battle of Courtrai",
            "Battle of Muret"
        ]
    ],
    "q_0941": [
        "Which Russian empress reigned from 1762 to 1796, expanding the Russian Empire?",
        [
            "Elizabeth of Russia",
            "Catherine the Great",
            "Catherine I",
            "Anna of Russia"
        ]
    ],
    "q_0944": [
        "How many legs does an insect have?",
        [
            "6",
            "8",
            "10",
            "4"
        ]
    ],
    "q_0945": [
        "How many legs does a spider have?",
        [
            "6",
            "4",
            "10",
            "8"
        ]
    ],
    "q_0946": [
        "What are animals that only eat meat called?",
        [
            "Insectivores",
            "Omnivores",
            "Carnivores",
            "Herbivores"
        ]
    ],
    "q_0947": [
        "What is the young of a cow called?",
        [
            "Colt",
            "Kid",
            "Lamb",
            "Calf"
        ]
    ],
    "q_0948": [
        "What is the young of a horse called?",
        [
            "Fawn",
            "Foal",
            "Piglet",
            "Calf"
        ]
    ],
    "q_0949": [
        "In which environment does the emperor penguin live?",
        [
            "The Arctic",
            "Antarctica",
            "The Sahara",
            "The Amazon"
        ]
    ],
    "q_0950": [
        "In which country does the koala live in the wild?",
        [
            "New Zealand",
            "Australia",
            "South Africa",
            "Indonesia"
        ]
    ],
    "q_0951": [
        "What does the giant panda primarily eat?",
        [
            "Meat",
            "Fish",
            "Fruit",
            "Bamboo"
        ]
    ],
    "q_0952": [
        "Which animal changes color to camouflage itself?",
        [
            "Chameleon",
            "Crocodile",
            "Snake",
            "Iguana"
        ]
    ],
    "q_0953": [
        "Which animal sleeps upside down?",
        [
            "Bat",
            "Sloth",
            "Owl",
            "Koala"
        ]
    ],
    "q_0954": [
        "Which animal produces honey?",
        [
            "Bumblebee",
            "Honeybee",
            "Wasp",
            "Ant"
        ]
    ],
    "q_0955": [
        "Which tree produces acorns?",
        [
            "Birch",
            "Pine",
            "Beech",
            "Oak"
        ]
    ],
    "q_0956": [
        "What is the fastest land animal?",
        [
            "Lion",
            "Cheetah",
            "Antelope",
            "Horse"
        ]
    ],
    "q_0957": [
        "What is the largest animal in the world?",
        [
            "Blue whale",
            "African elephant",
            "Sperm whale",
            "Whale shark"
        ]
    ],
    "q_0958": [
        "Which mammal has a trunk?",
        [
            "Rhinoceros",
            "Giraffe",
            "Hippopotamus",
            "Elephant"
        ]
    ],
    "q_0959": [
        "Which bird is a symbol of peace?",
        [
            "Dove",
            "Sparrow",
            "Swan",
            "Eagle"
        ]
    ],
    "q_0960": [
        "Which flower is a symbol of the Netherlands?",
        [
            "Lily",
            "Carnation",
            "Tulip",
            "Rose"
        ]
    ],
    "q_0961": [
        "How many humps does a dromedary have?",
        [
            "3",
            "0",
            "1",
            "2"
        ]
    ],
    "q_0962": [
        "What is the transformation of a caterpillar into a butterfly called?",
        [
            "Photosynthesis",
            "Molting",
            "Germination",
            "Metamorphosis"
        ]
    ],
    "q_0963": [
        "What are animals that eat both plants and meat called?",
        [
            "Omnivores",
            "Insectivores",
            "Herbivores",
            "Carnivores"
        ]
    ],
    "q_0964": [
        "What is the young of a goat called?",
        [
            "Kid",
            "Calf",
            "Fawn",
            "Lamb"
        ]
    ],
    "q_0965": [
        "What is the young of a deer called?",
        [
            "Wild boar piglet",
            "Kid",
            "Leveret",
            "Fawn"
        ]
    ],
    "q_0966": [
        "Which animal builds dams?",
        [
            "Beaver",
            "Otter",
            "Muskrat",
            "Coypu"
        ]
    ],
    "q_0967": [
        "Which animal hibernates in winter in the mountains of Europe?",
        [
            "Ibex",
            "Lynx",
            "Marmot",
            "Chamois"
        ]
    ],
    "q_0968": [
        "Which tree is famous for its enormous trunk in Africa?",
        [
            "Sequoia",
            "Baobab",
            "Cork oak",
            "Acacia"
        ]
    ],
    "q_0969": [
        "Which tree produces walnuts?",
        [
            "Oak",
            "Willow",
            "Walnut tree",
            "Poplar"
        ]
    ],
    "q_0970": [
        "What is the largest feline in the world?",
        [
            "Tiger",
            "Jaguar",
            "Lion",
            "Leopard"
        ]
    ],
    "q_0971": [
        "What is the largest bird in the world?",
        [
            "Condor",
            "Albatross",
            "Emu",
            "Ostrich"
        ]
    ],
    "q_0972": [
        "What is the only mammal capable of true flight?",
        [
            "Flying squirrel",
            "Colugo",
            "Bat",
            "Glider"
        ]
    ],
    "q_0973": [
        "Which gas do plants release during photosynthesis?",
        [
            "Carbon dioxide",
            "Oxygen",
            "Hydrogen",
            "Nitrogen"
        ]
    ],
    "q_0974": [
        "Which mammal is famous for its slowness and lives in trees in South America?",
        [
            "Lemur",
            "Anteater",
            "Sloth",
            "Koala"
        ]
    ],
    "q_0975": [
        "Which fish swims up rivers to spawn?",
        [
            "Sardine",
            "Salmon",
            "Tuna",
            "Cod"
        ]
    ],
    "q_0976": [
        "What is the largest coral reef system in the world?",
        [
            "The Red Sea Reef",
            "The Maldives Reef",
            "Belize Barrier Reef",
            "The Great Barrier Reef, in Australia"
        ]
    ],
    "q_0977": [
        "What is the largest tropical rainforest in the world?",
        [
            "Borneo",
            "Siberia",
            "The Amazon",
            "The Congo Basin"
        ]
    ],
    "q_0978": [
        "What is the green substance in plants that absorbs light called?",
        [
            "Melanin",
            "Chlorophyll",
            "Keratin",
            "Carotene"
        ]
    ],
    "q_0979": [
        "What is the largest living primate?",
        [
            "Chimpanzee",
            "Orangutan",
            "Baboon",
            "Gorilla"
        ]
    ],
    "q_0980": [
        "What is the smallest bird in the world?",
        [
            "Sparrow",
            "Goldcrest",
            "Finch",
            "Hummingbird"
        ]
    ],
    "q_0981": [
        "Which bird is the national emblem of the United States?",
        [
            "Peregrine falcon",
            "Owl",
            "Condor",
            "Bald eagle"
        ]
    ],
    "q_0982": [
        "Where does natural rubber come from?",
        [
            "Oil palm",
            "Bamboo",
            "Rubber tree",
            "Baobab"
        ]
    ],
    "q_0983": [
        "From which plant is vanilla obtained?",
        [
            "A fern",
            "An orchid",
            "A palm",
            "A cactus"
        ]
    ],
    "q_0984": [
        "What is the largest fish in the world?",
        [
            "Whale shark",
            "Great white shark",
            "Bluefin tuna",
            "Swordfish"
        ]
    ],
    "q_0985": [
        "Which mammal lays eggs?",
        [
            "Koala",
            "Hedgehog",
            "Platypus",
            "Kangaroo"
        ]
    ],
    "q_0986": [
        "Which land mammal has the longest gestation period?",
        [
            "Rhinoceros",
            "Giraffe",
            "Hippopotamus",
            "Elephant"
        ]
    ],
    "q_0987": [
        "How many hearts does an octopus have?",
        [
            "2",
            "3",
            "4",
            "1"
        ]
    ],
    "q_0988": [
        "What is the fruit of the cacao tree called?",
        [
            "Pod",
            "Drupe",
            "Husk",
            "Bean"
        ]
    ],
    "q_0989": [
        "What is the largest living reptile in the world?",
        [
            "Saltwater crocodile",
            "Komodo dragon",
            "Leatherback turtle",
            "Green anaconda"
        ]
    ],
    "q_0990": [
        "What is the longest venomous snake in the world?",
        [
            "King cobra",
            "Taipan",
            "Rattlesnake",
            "Black mamba"
        ]
    ],
    "q_0991": [
        "Which marine mammal is nicknamed the 'canary of the sea'?",
        [
            "Dolphin",
            "Narwhal",
            "Seal",
            "Beluga whale"
        ]
    ],
    "q_0992": [
        "Which snake is the longest in the world?",
        [
            "King cobra",
            "Reticulated python",
            "Boa constrictor",
            "Green anaconda"
        ]
    ],
    "q_0993": [
        "What is the tallest tree species in the world?",
        [
            "Coast redwood (sequoia sempervirens)",
            "Baobab",
            "Eucalyptus",
            "Giant sequoia"
        ]
    ],
    "q_0994": [
        "At what temperature does water boil at sea level under standard atmospheric pressure?",
        [
            "100 °C",
            "212 °C",
            "120 °C",
            "90 °C"
        ]
    ],
    "q_0995": [
        "At what temperature does pure water freeze under normal atmospheric pressure?",
        [
            "10 °C",
            "32 °C",
            "-20 °C",
            "0 °C"
        ]
    ],
    "q_0996": [
        "How many degrees do the interior angles of a triangle sum to in Euclidean geometry?",
        [
            "180",
            "360",
            "270",
            "90"
        ]
    ],
    "q_0997": [
        "How many faces does a cube have?",
        [
            "8",
            "4",
            "12",
            "6"
        ]
    ],
    "q_0998": [
        "How many seconds are in one hour?",
        [
            "6,000",
            "360",
            "3,600",
            "60"
        ]
    ],
    "q_0999": [
        "How much is 12 × 12?",
        [
            "144",
            "132",
            "154",
            "124"
        ]
    ],
    "q_1000": [
        "How much is 7 × 8?",
        [
            "64",
            "48",
            "56",
            "54"
        ]
    ],
    "q_1001": [
        "Which astronaut was the first human to set foot on the Moon?",
        [
            "Yuri Gagarin",
            "Neil Armstrong",
            "Michael Collins",
            "Buzz Aldrin"
        ]
    ],
    "q_1005": [
        "Which gas creates the fizz in carbonated soft drinks?",
        [
            "Oxygen",
            "Hydrogen",
            "Carbon dioxide",
            "Nitrogen"
        ]
    ],
    "q_1006": [
        "Which muscular organ pumps blood throughout the body?",
        [
            "Kidney",
            "Heart",
            "Liver",
            "Lungs"
        ]
    ],
    "q_1007": [
        "What is the closest star to Earth?",
        [
            "Polaris",
            "Sirius",
            "The Sun",
            "Betelgeuse"
        ]
    ],
    "q_1008": [
        "What is the approximate normal duration of a full-term human pregnancy?",
        [
            "9 months",
            "12 months",
            "6 months",
            "7 months"
        ]
    ],
    "q_1009": [
        "What is the chemical formula of carbon dioxide?",
        [
            "CH4",
            "CO2",
            "CO",
            "O3"
        ]
    ],
    "q_1010": [
        "What is the largest planet in the solar system?",
        [
            "Jupiter",
            "Saturn",
            "Uranus",
            "Neptune"
        ]
    ],
    "q_1011": [
        "What is the primary source of energy driving Earth's climate system?",
        [
            "The Moon",
            "Volcanoes",
            "Earth's core",
            "The Sun"
        ]
    ],
    "q_1012": [
        "What is the approximate numerical value of pi (π)?",
        [
            "3.14",
            "1.62",
            "3.41",
            "2.71"
        ]
    ],
    "q_1013": [
        "Which planet is surrounded by a prominent and spectacular ring system?",
        [
            "Venus",
            "Mars",
            "Mercury",
            "Saturn"
        ]
    ],
    "q_1014": [
        "Which planet is known as the 'Red Planet'?",
        [
            "Mars",
            "Jupiter",
            "Venus",
            "Mercury"
        ]
    ],
    "q_1015": [
        "With which element does iron combine to produce steel?",
        [
            "Copper",
            "Carbon",
            "Sulfur",
            "Oxygen"
        ]
    ],
    "q_1016": [
        "How many chambers does the human heart have?",
        [
            "3",
            "4",
            "2",
            "6"
        ]
    ],
    "q_1017": [
        "How many planets are in our solar system?",
        [
            "8",
            "7",
            "10",
            "9"
        ]
    ],
    "q_1018": [
        "How many zeros are in the number one million?",
        [
            "6",
            "7",
            "9",
            "5"
        ]
    ],
    "q_1019": [
        "How much is 15% of 200?",
        [
            "45",
            "20",
            "30",
            "15"
        ]
    ],
    "q_1020": [
        "What is an eight-sided polygon called?",
        [
            "Hexagon",
            "Octagon",
            "Decagon",
            "Heptagon"
        ]
    ],
    "q_1021": [
        "What is a triangle with three sides of equal length called?",
        [
            "Right triangle",
            "Equilateral triangle",
            "Isosceles triangle",
            "Scalene triangle"
        ]
    ],
    "q_1022": [
        "What is the name of our home galaxy?",
        [
            "Triangulum",
            "Sombrero",
            "The Milky Way",
            "Andromeda"
        ]
    ],
    "q_1023": [
        "Which of these colors is not traditionally considered one of the seven colors of the rainbow?",
        [
            "Indigo",
            "Orange",
            "Brown",
            "Violet"
        ]
    ],
    "q_1024": [
        "What chemical compound does the formula NaCl represent?",
        [
            "Sugar",
            "Vinegar",
            "Baking soda",
            "Table salt"
        ]
    ],
    "q_1025": [
        "What does a light-year measure?",
        [
            "Distance",
            "Mass",
            "Speed",
            "Duration"
        ]
    ],
    "q_1028": [
        "What is the pH of a neutral aqueous solution at 25 °C?",
        [
            "0",
            "14",
            "1",
            "7"
        ]
    ],
    "q_1029": [
        "What is the largest organ of the human body?",
        [
            "Skin",
            "Brain",
            "Intestine",
            "Liver"
        ]
    ],
    "q_1030": [
        "What is the smallest prime number?",
        [
            "1",
            "0",
            "3",
            "2"
        ]
    ],
    "q_1037": [
        "Which instrument is used to measure atmospheric pressure?",
        [
            "Thermometer",
            "Barometer",
            "Rain gauge",
            "Hygrometer"
        ]
    ],
    "q_1038": [
        "Which Greek mathematician is famous for his theorem on right-angled triangles?",
        [
            "Pythagoras",
            "Euclid",
            "Archimedes",
            "Thales"
        ]
    ],
    "q_1039": [
        "Which famous equation expresses mass-energy equivalence?",
        [
            "F = ma",
            "E = mv²",
            "E = mc²",
            "P = mv"
        ]
    ],
    "q_1040": [
        "What is the square root of 144?",
        [
            "16",
            "11",
            "12",
            "14"
        ]
    ],
    "q_1041": [
        "Which force keeps the planets in orbit around the Sun?",
        [
            "Solar pressure",
            "Centrifugal force",
            "Electromagnetism",
            "Gravitation"
        ]
    ],
    "q_1042": [
        "Which subatomic particle carries a negative electric charge?",
        [
            "Atomic nucleus",
            "Electron",
            "Proton",
            "Neutron"
        ]
    ],
    "q_1043": [
        "Which giant planet features the persistent storm known as the Great Red Spot?",
        [
            "Neptune",
            "Saturn",
            "Jupiter",
            "Mars"
        ]
    ],
    "q_1044": [
        "Who formulated the law of universal gravitation in 1687?",
        [
            "Johannes Kepler",
            "Nicolaus Copernicus",
            "Isaac Newton",
            "Galileo Galilei"
        ]
    ],
    "q_1045": [
        "Who was the first human in space, orbiting Earth in 1961?",
        [
            "Yuri Gagarin",
            "Buzz Aldrin",
            "Alan Shepard",
            "John Glenn"
        ]
    ],
    "q_1046": [
        "How many teeth does an adult human typically have, including wisdom teeth?",
        [
            "28",
            "36",
            "32",
            "30"
        ]
    ],
    "q_1047": [
        "How many minutes are in a full 24-hour day?",
        [
            "1,440",
            "1,200",
            "1,000",
            "2,400"
        ]
    ],
    "q_1048": [
        "What is the value of 2 raised to the power of 10 (2¹⁰)?",
        [
            "2,048",
            "1,024",
            "1,000",
            "512"
        ]
    ],
    "q_1049": [
        "What was the Apollo mission that landed the first humans on the Moon in July 1969 called?",
        [
            "Soyuz 11",
            "Gemini 4",
            "Apollo 13",
            "Apollo 11"
        ]
    ],
    "q_1050": [
        "What is the name of the famous optical space telescope launched into low Earth orbit in 1990?",
        [
            "Spitzer",
            "James Webb",
            "Kepler",
            "Hubble"
        ]
    ],
    "q_1051": [
        "What is the Sun primarily composed of?",
        [
            "Iron and nickel",
            "Hydrogen and helium",
            "Carbon and oxygen",
            "Nitrogen and methane"
        ]
    ],
    "q_1052": [
        "Which metal alloy is produced by combining copper and tin?",
        [
            "Steel",
            "Bronze",
            "Stainless steel",
            "Brass"
        ]
    ],
    "q_1053": [
        "What is the most abundant chemical element in the observable Universe?",
        [
            "Hydrogen",
            "Oxygen",
            "Helium",
            "Carbon"
        ]
    ],
    "q_1054": [
        "What is the most abundant gas in Earth's atmosphere by volume?",
        [
            "Carbon dioxide",
            "Nitrogen",
            "Oxygen",
            "Argon"
        ]
    ],
    "q_1055": [
        "What is the primary physiological role of red blood cells (erythrocytes)?",
        [
            "Transport oxygen",
            "Clot blood",
            "Produce antibodies",
            "Fight infections"
        ]
    ],
    "q_1067": [
        "Which instrument records seismic waves produced by earthquakes?",
        [
            "Seismograph",
            "Thermometer",
            "Barometer",
            "Geiger counter"
        ]
    ],
    "q_1068": [
        "Which instrument measures wind speed?",
        [
            "Anemometer",
            "Stopwatch",
            "Seismograph",
            "Hygrometer"
        ]
    ],
    "q_1069": [
        "Which Italian mathematician popularized the sequence 1, 1, 2, 3, 5, 8...?",
        [
            "Euler",
            "Pascal",
            "Gauss",
            "Fibonacci"
        ]
    ],
    "q_1070": [
        "Which Augustinian friar is recognized as the father of genetics through pea plant experiments?",
        [
            "Gregor Mendel",
            "Charles Darwin",
            "Louis Pasteur",
            "Francis Crick"
        ]
    ],
    "q_1071": [
        "What is the SI unit of force?",
        [
            "Newton",
            "Watt",
            "Pascal",
            "Joule"
        ]
    ],
    "q_1072": [
        "What is the SI unit of frequency?",
        [
            "Lumen",
            "Hertz",
            "Tesla",
            "Decibel"
        ]
    ],
    "q_1073": [
        "What is the SI unit of power?",
        [
            "Watt",
            "Volt",
            "Ampere",
            "Joule"
        ]
    ],
    "q_1074": [
        "What is the SI unit of electrical resistance?",
        [
            "Farad",
            "Ohm",
            "Volt",
            "Ampere"
        ]
    ],
    "q_1075": [
        "What is the outermost solid mechanical layer of Earth?",
        [
            "Mantle",
            "Core",
            "Crust",
            "Asthenosphere"
        ]
    ],
    "q_1076": [
        "What is the chemical formula of ozone?",
        [
            "O2",
            "N2O",
            "O3",
            "CO2"
        ]
    ],
    "q_1077": [
        "What is the hottest planet in the solar system due to a runaway greenhouse effect?",
        [
            "Jupiter",
            "Mercury",
            "Venus",
            "Mars"
        ]
    ],
    "q_1078": [
        "Which essential vitamin does human skin synthesize when exposed to sunlight (UVB)?",
        [
            "Vitamin C",
            "Vitamin A",
            "Vitamin D",
            "Vitamin B12"
        ]
    ],
    "q_1079": [
        "Who discovered penicillin produced by Penicillium mold in 1928?",
        [
            "Robert Koch",
            "Edward Jenner",
            "Alexander Fleming",
            "Louis Pasteur"
        ]
    ],
    "q_1080": [
        "How many chromosomes are in a normal diploid human somatic cell?",
        [
            "48",
            "46",
            "44",
            "23"
        ]
    ],
    "q_1081": [
        "Approximately how long does sunlight take to travel from the Sun to Earth?",
        [
            "8 minutes",
            "1 hour",
            "1 day",
            "8 seconds"
        ]
    ],
    "q_1082": [
        "What is the direct phase transition of a substance from solid to gas called?",
        [
            "Vaporization",
            "Melting",
            "Condensation",
            "Sublimation"
        ]
    ],
    "q_1083": [
        "What was the supercontinent that assembled about 335 million years ago called?",
        [
            "Pangaea",
            "Laurasia",
            "Rodinia",
            "Gondwana"
        ]
    ],
    "q_1084": [
        "Against which deadly disease did Louis Pasteur successfully test a human vaccine in 1885?",
        [
            "Plague",
            "Rabies",
            "Smallpox",
            "Polio"
        ]
    ],
    "q_1085": [
        "Which strong acid is naturally secreted by gastric parietal cells in the stomach?",
        [
            "Sulfuric acid",
            "Acetic acid",
            "Hydrochloric acid",
            "Citric acid"
        ]
    ],
    "q_1086": [
        "Which metal alloy combines copper and zinc?",
        [
            "Bronze",
            "Duralumin",
            "Brass",
            "Steel"
        ]
    ],
    "q_1087": [
        "Which elementary boson discovered at CERN in 2012 gives mass to other fundamental particles?",
        [
            "Gluon",
            "Photon",
            "Neutrino",
            "Higgs boson"
        ]
    ],
    "q_1097": [
        "What is the primary combustible chemical component of natural gas?",
        [
            "Methane",
            "Butane",
            "Propane",
            "Ethane"
        ]
    ],
    "q_1109": [
        "Which ABO and Rh blood group is regarded as the universal donor for red blood cells?",
        [
            "O negative",
            "B negative",
            "A positive",
            "AB positive"
        ]
    ],
    "q_1110": [
        "Which endocrine organ produces the hormone insulin?",
        [
            "Spleen",
            "Pancreas",
            "Liver",
            "Kidney"
        ]
    ],
    "q_1111": [
        "Which German physicist discovered X-rays in November 1895?",
        [
            "Heinrich Hertz",
            "Henri Becquerel",
            "Max Planck",
            "Wilhelm Röntgen"
        ]
    ],
    "q_1112": [
        "Which French physicist discovered natural radioactivity in uranium salts in 1896?",
        [
            "Marie Curie",
            "Wilhelm Röntgen",
            "Ernest Rutherford",
            "Henri Becquerel"
        ]
    ],
    "q_1113": [
        "Approximately what is the speed of sound in dry air at 20 °C?",
        [
            "300,000 km/s",
            "3,400 m/s",
            "34 m/s",
            "340 m/s"
        ]
    ],
    "q_1114": [
        "Which physical law states that for every action, there is an equal and opposite reaction?",
        [
            "Newton's first law",
            "Ohm's law",
            "Newton's third law",
            "Hooke's law"
        ]
    ],
    "q_1115": [
        "Which type of rock forms from the cooling and solidification of molten magma or lava?",
        [
            "Organic rock",
            "Igneous rock",
            "Sedimentary rock",
            "Metamorphic rock"
        ]
    ],
    "q_1116": [
        "Which biomolecule's double helix structure was solved by Watson and Crick in 1953?",
        [
            "RNA",
            "DNA",
            "Glucose",
            "Protein"
        ]
    ],
    "q_1118": [
        "Who developed the world's first successful vaccine, against smallpox, in 1796?",
        [
            "Alexander Fleming",
            "Edward Jenner",
            "Louis Pasteur",
            "Robert Koch"
        ]
    ],
    "q_1123": [
        "What is the most abundant metallic element by mass in Earth's crust?",
        [
            "Aluminum",
            "Iron",
            "Copper",
            "Calcium"
        ]
    ],
    "q_1128": [
        "What is the largest natural satellite of Jupiter, and largest moon in the solar system?",
        [
            "Ganymede",
            "Io",
            "Callisto",
            "Europa"
        ]
    ],
    "q_1129": [
        "What is the largest volcano and highest shield peak in the solar system, located on Mars?",
        [
            "Mauna Kea",
            "Olympus Mons",
            "Mount Etna",
            "Valles Marineris"
        ]
    ],
    "q_1130": [
        "What is the smallest bone in the human body, located in the middle ear?",
        [
            "Malleus (hammer)",
            "Stapes (stirrup)",
            "Phalanx",
            "Incus (anvil)"
        ]
    ],
    "q_1139": [
        "Which German mathematician was celebrated as the 'Prince of Mathematicians'?",
        [
            "Carl Friedrich Gauss",
            "Blaise Pascal",
            "Leonhard Euler",
            "Pierre de Fermat"
        ]
    ],
    "q_1140": [
        "Which planet in our solar system rotates on its side with an axial tilt of about 98°?",
        [
            "Neptune",
            "Mars",
            "Saturn",
            "Uranus"
        ]
    ],
    "q_1141": [
        "Which space probe launched in 1977 was the first human-made object to cross into interstellar space?",
        [
            "Voyager 2",
            "Cassini",
            "Pioneer 10",
            "Voyager 1"
        ]
    ],
    "q_1142": [
        "What are the two small natural moons orbiting Mars called?",
        [
            "Phobos and Deimos",
            "Io and Europa",
            "Triton and Nereid",
            "Titan and Rhea"
        ]
    ],
    "q_1156": [
        "What is the smallest perfect number, equal to the sum of its proper positive divisors?",
        [
            "12",
            "6",
            "28",
            "10"
        ]
    ],
    "q_1168": [
        "Which planet has the slowest axial rotation in the solar system, with a day longer than its year?",
        [
            "Mars",
            "Venus",
            "Neptune",
            "Mercury"
        ]
    ],
    "q_1169": [
        "How many players are on a rugby union team on the pitch?",
        [
            "11",
            "13",
            "15",
            "7"
        ]
    ],
    "q_1170": [
        "How many players does a basketball team have on the court?",
        [
            "11",
            "7",
            "5",
            "6"
        ]
    ],
    "q_1171": [
        "In which sport is a shuttlecock used?",
        [
            "Tennis",
            "Table tennis",
            "Badminton",
            "Squash"
        ]
    ],
    "q_1172": [
        "What color is the jersey worn by the leader of the Tour de France?",
        [
            "Green",
            "Polka dot",
            "Yellow",
            "White"
        ]
    ],
    "q_1174": [
        "Which basketball player wore number 23 for the Chicago Bulls?",
        [
            "Kobe Bryant",
            "Magic Johnson",
            "Scottie Pippen",
            "Michael Jordan"
        ]
    ],
    "q_1175": [
        "Which footballer is nicknamed 'CR7'?",
        [
            "Kylian Mbappé",
            "Cristiano Ronaldo",
            "Lionel Messi",
            "Neymar"
        ]
    ],
    "q_1177": [
        "Which sport is played during the Super Bowl?",
        [
            "Basketball",
            "American football",
            "Ice hockey",
            "Baseball"
        ]
    ],
    "q_1178": [
        "Which Grand Slam tennis tournament is played on grass in London?",
        [
            "US Open",
            "Flushing Meadows",
            "Wimbledon",
            "Roland Garros"
        ]
    ],
    "q_1179": [
        "Which Grand Slam tennis tournament is played on clay in Paris?",
        [
            "Roland Garros",
            "Wimbledon",
            "US Open",
            "Australian Open"
        ]
    ],
    "q_1182": [
        "How many players are on a volleyball team on the court?",
        [
            "9",
            "6",
            "5",
            "7"
        ]
    ],
    "q_1183": [
        "How many holes are on a standard golf course?",
        [
            "24",
            "12",
            "18",
            "9"
        ]
    ],
    "q_1184": [
        "In which country did judo originate?",
        [
            "Mongolia",
            "South Korea",
            "China",
            "Japan"
        ]
    ],
    "q_1185": [
        "Which boxer nicknamed 'The Greatest' made heavyweight history?",
        [
            "Joe Frazier",
            "Muhammad Ali",
            "George Foreman",
            "Mike Tyson"
        ]
    ],
    "q_1186": [
        "Which football club plays its home matches at Parc des Princes?",
        [
            "Monaco",
            "Olympique Lyonnais",
            "Paris Saint-Germain",
            "Olympique de Marseille"
        ]
    ],
    "q_1187": [
        "Which football club plays its home matches at Camp Nou?",
        [
            "Real Madrid",
            "FC Barcelona",
            "Atlético Madrid",
            "Valencia"
        ]
    ],
    "q_1193": [
        "Which national team has won the most FIFA World Cups in football history?",
        [
            "Germany",
            "Argentina",
            "Brazil",
            "Italy"
        ]
    ],
    "q_1194": [
        "Which Jamaican sprinter holds the men's 100 meters world record at 9.58 seconds?",
        [
            "Usain Bolt",
            "Justin Gatlin",
            "Tyson Gay",
            "Yohan Blake"
        ]
    ],
    "q_1195": [
        "Which endurance automobile race is held annually at the Circuit de la Sarthe in France?",
        [
            "Paris-Dakar Rally",
            "24 Hours of Le Mans",
            "Monaco Grand Prix",
            "Indianapolis 500"
        ]
    ],
    "q_1196": [
        "What official distance does an athletics marathon cover?",
        [
            "21.097 km",
            "42.195 km",
            "40 km",
            "50 km"
        ]
    ],
    "q_1202": [
        "Which athlete broke the world pole vault record multiple times in the 2020s?",
        [
            "Armand Duplantis",
            "Renaud Lavillenie",
            "Sam Kendricks",
            "Sergey Bubka"
        ]
    ],
    "q_1203": [
        "Which country won the first FIFA World Cup in 1930?",
        [
            "Brazil",
            "Argentina",
            "Italy",
            "Uruguay"
        ]
    ],
    "q_1204": [
        "Which football club has won the most UEFA Champions Leagues?",
        [
            "AC Milan",
            "Bayern Munich",
            "Liverpool",
            "Real Madrid"
        ]
    ],
    "q_1205": [
        "Which team won the FIFA Women's World Cup in 2015 and 2019?",
        [
            "Germany",
            "Japan",
            "United States",
            "Sweden"
        ]
    ],
    "q_1206": [
        "Which English Premier League football club plays its home matches at Anfield?",
        [
            "Manchester City",
            "Liverpool FC",
            "Everton",
            "Tottenham"
        ]
    ],
    "q_1207": [
        "Which English Premier League football club plays its home matches at Old Trafford?",
        [
            "Arsenal",
            "Chelsea",
            "Liverpool",
            "Manchester United"
        ]
    ],
    "q_1208": [
        "Which Argentine football superstar is affectionately nicknamed 'La Pulga'?",
        [
            "Diego Maradona",
            "Lionel Messi",
            "Neymar",
            "Ronaldinho"
        ]
    ],
    "q_1209": [
        "Which French heavyweight judoka is an Olympic gold medalist and multiple-time world champion?",
        [
            "David Douillet",
            "Teddy Riner",
            "Djamel Bouras",
            "Clarisse Agbegnenou"
        ]
    ],
    "q_1215": [
        "In curling, what are the stones made of?",
        [
            "Basalt",
            "Marble",
            "Granite",
            "Concrete"
        ]
    ],
    "q_1216": [
        "In which combat sport do athletes fight on a ring called a dohyo?",
        [
            "Taekwondo",
            "Judo",
            "Sumo wrestling",
            "Greco-Roman wrestling"
        ]
    ],
    "q_1226": [
        "In rugby union, how many total points is a converted try worth?",
        [
            "5",
            "7",
            "8",
            "6"
        ]
    ],
    "q_1227": [
        "In which sport do teams from Europe and the United States contest the Ryder Cup?",
        [
            "Rugby",
            "Tennis",
            "Cricket",
            "Golf"
        ]
    ],
    "q_1228": [
        "Which Spanish road cyclist won five consecutive Tours de France between 1991 and 1995?",
        [
            "Pedro Delgado",
            "Miguel Induráin",
            "Alberto Contador",
            "Carlos Sastre"
        ]
    ],
    "q_1229": [
        "Which French swimmer won the Olympic gold medal in the men's 50m freestyle in London in 2012?",
        [
            "Alain Bernard",
            "Florent Manaudou",
            "Frédérick Bousquet",
            "Camille Lacourt"
        ]
    ],
    "q_1234": [
        "Which Brazilian racing driver won three Formula One World Championships (1988, 1990, 1991)?",
        [
            "Nelson Piquet",
            "Ayrton Senna",
            "Rubens Barrichello",
            "Emerson Fittipaldi"
        ]
    ],
    "q_1235": [
        "In sailing, what is the single-handed, non-stop, unassisted round-the-world race called?",
        [
            "Route du Rhum",
            "The Ocean Race",
            "Vendée Globe",
            "Transat Jacques Vabre"
        ]
    ],
    "q_1236": [
        "Which country has won the Davis Cup the most times in tennis history?",
        [
            "France",
            "United States",
            "Australia",
            "United Kingdom"
        ]
    ],
    "q_1249": [
        "What is the official trophy awarded to the winner of the Men's Rugby World Cup called?",
        [
            "The Webb Ellis Cup",
            "The Calcutta Cup",
            "The Jules Rimet Trophy",
            "The Brennus Shield"
        ]
    ],
    "q_1260": [
        "What is Apple's voice assistant called?",
        [
            "Bixby",
            "Cortana",
            "Alexa",
            "Siri"
        ]
    ],
    "q_1261": [
        "What is Google's mobile operating system called?",
        [
            "Android",
            "iOS",
            "Windows Phone",
            "Symbian"
        ]
    ],
    "q_1262": [
        "What does 'AI' stand for in everyday language?",
        [
            "Automated Interface",
            "Advanced Information",
            "Artificial Intelligence",
            "Active Internet"
        ]
    ],
    "q_1264": [
        "Which keyboard shortcut allows you to copy in Windows?",
        [
            "Ctrl + V",
            "Ctrl + X",
            "Ctrl + C",
            "Ctrl + Z"
        ]
    ],
    "q_1265": [
        "Which company created the Windows operating system?",
        [
            "Apple",
            "Microsoft",
            "Google",
            "IBM"
        ]
    ],
    "q_1266": [
        "Which company manufactures the Model S electric car?",
        [
            "Toyota",
            "Tesla",
            "Ford",
            "Renault"
        ]
    ],
    "q_1267": [
        "Which company created the PlayStation console?",
        [
            "Sony",
            "Sega",
            "Microsoft",
            "Nintendo"
        ]
    ],
    "q_1268": [
        "Which brothers invented the Cinematograph in 1895?",
        [
            "The Pathé brothers",
            "The Lumière brothers",
            "The Wright brothers",
            "The Montgolfier brothers"
        ]
    ],
    "q_1273": [
        "How many bits are in a byte?",
        [
            "16",
            "8",
            "4",
            "10"
        ]
    ],
    "q_1275": [
        "What is the most widely used web search engine?",
        [
            "Google",
            "Bing",
            "Yahoo",
            "Qwant"
        ]
    ],
    "q_1276": [
        "Which language is used to style the presentation of web pages?",
        [
            "Python",
            "CSS",
            "XML",
            "SQL"
        ]
    ],
    "q_1277": [
        "Which Japanese company created the character Mario?",
        [
            "Capcom",
            "Sony",
            "Nintendo",
            "Sega"
        ]
    ],
    "q_1291": [
        "What was the name of the first artificial satellite, launched in 1957?",
        [
            "Sputnik 1",
            "Explorer 1",
            "Apollo 1",
            "Vostok 1"
        ]
    ],
    "q_1292": [
        "Which British mathematician helped crack the Enigma code?",
        [
            "Charles Babbage",
            "John von Neumann",
            "George Boole",
            "Alan Turing"
        ]
    ],
    "q_1293": [
        "Which Soviet dog was the first living creature in orbit, in 1957?",
        [
            "Albina",
            "Laika",
            "Belka",
            "Strelka"
        ]
    ],
    "q_1294": [
        "Which company created the Firefox browser?",
        [
            "Microsoft",
            "Google",
            "Opera",
            "Mozilla"
        ]
    ],
    "q_1295": [
        "Which mathematician is considered the first computer programmer in history?",
        [
            "Ada Lovelace",
            "Grace Hopper",
            "Marie Curie",
            "Hedy Lamarr"
        ]
    ],
    "q_1305": [
        "How many bytes are in a kilobyte in legacy binary computing notation?",
        [
            "1,000",
            "1,024",
            "2,048",
            "512"
        ]
    ],
    "q_1306": [
        "What is the name of the NASA rover sent to Mars in 2021?",
        [
            "Perseverance",
            "Opportunity",
            "Spirit",
            "Curiosity"
        ]
    ],
    "q_1318": [
        "What was the name of the first general-purpose electronic computer, commissioned in 1946?",
        [
            "Colossus",
            "ENIAC",
            "Z3",
            "UNIVAC"
        ]
    ],
    "q_1319": [
        "Which network protocol is used to send email messages?",
        [
            "SMTP",
            "FTP",
            "DNS",
            "SSH"
        ]
    ]
}


def clean_country(fr_prep):
    s = re.sub(r"^(?:du |de la |de l['’]|des |d['’]|au |aux |en |de )", "", fr_prep.strip()).strip()
    return COUNTRY_FR_TO_EN.get(s, s)

def translate_opt(opt):
    o = opt.strip()
    clean = re.sub(r"^(?:Le |La |L'|Les )", "", o).strip()
    if clean in COUNTRY_FR_TO_EN:
        return COUNTRY_FR_TO_EN[clean]
    if o in COUNTRY_FR_TO_EN:
        return COUNTRY_FR_TO_EN[o]
    if o in CITIES_FR_TO_EN:
        return CITIES_FR_TO_EN[o]
    if o.lower() in CURRENCIES_FR_TO_EN:
        return CURRENCIES_FR_TO_EN[o.lower()]
    if o.lower() in RIVERS_FR_TO_EN:
        return RIVERS_FR_TO_EN[o.lower()]
    if o.lower() in ELEMENTS_FR_TO_EN:
        return ELEMENTS_FR_TO_EN[o.lower()].capitalize()
    if o in LANDMARKS_FR_TO_EN:
        return LANDMARKS_FR_TO_EN[o].capitalize()
    return o

TPL_RULES = [
    (re.compile(r"^Quelle est la capitale (.+)\s*\?$"),
     lambda m: f"What is the capital city of {clean_country(m.group(1))}?"),
    (re.compile(r"^(.+) est la capitale de quel pays\s*\?$"),
     lambda m: f"{CITIES_FR_TO_EN.get(m.group(1), m.group(1))} is the capital of which country?"),
    (re.compile(r"^Quelle est la monnaie (.+)\s*\?$"),
     lambda m: f"What is the official currency of {clean_country(m.group(1))}?"),
    (re.compile(r"^Dans quel pays se trouve (.+)\s*\?$"),
     lambda m: f"In which country is {LANDMARKS_FR_TO_EN.get(m.group(1), m.group(1))} located?"),
    (re.compile(r"^Quel fleuve traverse (.+)\s*\?$"),
     lambda m: f"Which river flows through {CITIES_FR_TO_EN.get(m.group(1), m.group(1))}?"),
    (re.compile(r"^Qui a peint « (.+) »\s*\?$"),
     lambda m: f"Who painted '{m.group(1)}'?"),
    (re.compile(r"^Qui a réalisé la sculpture « (.+) »\s*\?$"),
     lambda m: f"Who created the sculpture '{m.group(1)}'?"),
    (re.compile(r"^Qui a composé (.+)\s*\?$"),
     lambda m: f"Who composed {m.group(1)}?"),
    (re.compile(r"^De quel pays (?:vient|viennent) (.+)\s*\?$"),
     lambda m: f"Which country does {m.group(1)} originate from?"),
    (re.compile(r"^Qui a réalisé le film « (.+) »\s*\?$"),
     lambda m: f"Who directed the movie '{m.group(1)}'?"),
    (re.compile(r"^Quel est le symbole chimique de l['’]élément « (.+) »\s*\?$"),
     lambda m: f"What is the chemical symbol for the element '{ELEMENTS_FR_TO_EN.get(m.group(1).lower(), m.group(1))}'?"),
    (re.compile(r"^Quel élément chimique a pour symbole « (.+) »\s*\?$"),
     lambda m: f"Which chemical element has the symbol '{m.group(1)}'?"),
    (re.compile(r"^Quel est le numéro atomique de l['’]élément « (.+) »\s*\?$"),
     lambda m: f"What is the atomic number of the element '{ELEMENTS_FR_TO_EN.get(m.group(1).lower(), m.group(1))}'?"),
    (re.compile(r"^Quel pays a remporté la Coupe du monde de football en (\d+)\s*\?$"),
     lambda m: f"Which country won the FIFA World Cup in {m.group(1)}?"),
    (re.compile(r"^Quelle ville a accueilli les Jeux olympiques d['’]été de (\d+)\s*\?$"),
     lambda m: f"Which city hosted the Summer Olympic Games in {m.group(1)}?"),
    (re.compile(r"^Quelle ville a accueilli les Jeux olympiques d['’]hiver de (\d+)\s*\?$"),
     lambda m: f"Which city hosted the Winter Olympic Games in {m.group(1)}?"),
    (re.compile(r"^Que signifie le sigle « (.+) »\s*\?$"),
     lambda m: f"What does the acronym '{m.group(1)}' stand for?"),
    (re.compile(r"^Qui a fondé (.+)\s*\?$"),
     lambda m: f"Who founded {m.group(1)}?"),
    (re.compile(r"^Qui a créé (.+)\s*\?$"),
     lambda m: f"Who created {m.group(1)}?"),
    (re.compile(r"^Qui a inventé (.+)\s*\?$"),
     lambda m: f"Who invented {m.group(1)}?"),
    (re.compile(r"^Qui a écrit « (.+) »\s*\?$"),
     lambda m: f"Who wrote '{m.group(1)}'?"),
]

def flat(s):
    s = s.lower()
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    s = re.sub(r"[^a-z0-9 ]", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    return f" {s} "

def norm_opt(s):
    return s.strip().lower()

def validate_dataset(questions):
    errors = []
    if len(questions) < 1000:
        errors.append(f"Total questions < 1000: {len(questions)}")
    if not all(q.get("status") == "draft" for q in questions):
        errors.append("Not all questions are draft")
    diff_counts = {}
    for q in questions:
        diff_counts[q["difficulty"]] = diff_counts.get(q["difficulty"], 0) + 1
    for d in range(1, 7):
        if diff_counts.get(d, 0) < 50:
            errors.append(f"Difficulty {d} has < 50 questions ({diff_counts.get(d, 0)})")
    cat_counts = {}
    for q in questions:
        cat_counts[q["category"]] = cat_counts.get(q["category"], 0) + 1
    if len(cat_counts) < 9:
        errors.append(f"Categories count < 9: {len(cat_counts)}")
    for cat, n in cat_counts.items():
        if n / len(questions) > 0.30:
            errors.append(f"Category {cat} exceeds 30%: {n}/{len(questions)}")
    prompts = [flat(q["question"]) for q in questions]
    if len(set(prompts)) != len(questions):
        seen = set()
        dups = set()
        for p in prompts:
            if p in seen:
                dups.add(p)
            seen.add(p)
        errors.append(f"Duplicate prompts found: {len(dups)} - sample: {list(dups)[:3]}")
    for q in questions:
        ans_opt = q["options"][q["answerIndex"]]
        c = flat(ans_opt)
        if len(c.strip()) >= 5:
            if c in flat(q["question"]):
                errors.append(f"Answer leak in {q['id']}: '{ans_opt}' in '{q['question']}'")
    pos = [0, 0, 0, 0]
    for q in questions:
        pos[q["answerIndex"]] += 1
    for i, n in enumerate(pos):
        share = n / len(questions)
        if share <= 0.18:
            errors.append(f"Answer position {i} has share <= 18%: {share:.3f}")
    for q in questions:
        if not q["question"].strip().endswith("?"):
            errors.append(f"Prompt doesn't end with ? in {q['id']}: {q['question']}")
        if len(q["question"]) > 200:
            errors.append(f"Prompt too long ({len(q['question'])}) in {q['id']}")
        if len(q["options"]) != 4:
            errors.append(f"Options len != 4 in {q['id']}")
        if len(set(norm_opt(o) for o in q["options"])) != 4:
            errors.append(f"Non-distinct options in {q['id']}: {q['options']}")
        for o in q["options"]:
            if len(o) > 70:
                errors.append(f"Option too long ({len(o)}) in {q['id']}: {o}")
    return errors

def main():
    print("Loading French questions from:", FR_JSON_PATH)
    with open(FR_JSON_PATH, "r", encoding="utf-8") as f:
        fr = json.load(f)
    print(f"Loaded {len(fr)} French questions.")

    output_questions = []
    for q in fr:
        qid = q["id"]
        if qid in SEED_TRANSLATIONS:
            sq, s_opts = SEED_TRANSLATIONS[qid]
            q_en = dict(q)
            q_en["lang"] = "en"
            q_en["question"] = sq
            q_en["options"] = list(s_opts)
            output_questions.append(q_en)
        elif qid == "q_0585":
            q_en = dict(q)
            q_en["lang"] = "en"
            q_en["question"] = "In which country can the historic sanctuary of Machu Picchu be found?"
            q_en["options"] = [translate_opt(o) for o in q["options"]]
            output_questions.append(q_en)
        elif qid == "q_0615":
            q_en = dict(q)
            q_en["lang"] = "en"
            q_en["question"] = "What is the capital city of the United Mexican States?"
            opts = [translate_opt(o) for o in q["options"]]
            opts[2] = "Mexico City"
            q_en["options"] = opts
            output_questions.append(q_en)
        elif qid in EXACT_439:
            eq, e_opts = EXACT_439[qid]
            q_en = dict(q)
            q_en["lang"] = "en"
            q_en["question"] = eq
            q_en["options"] = list(e_opts)
            output_questions.append(q_en)
        elif qid in YEAR_MAP:
            q_en = dict(q)
            q_en["lang"] = "en"
            q_en["question"] = YEAR_MAP[qid]
            q_en["options"] = list(q["options"])
            output_questions.append(q_en)
        else:
            p = q["question"]
            matched = False
            for pat, func in TPL_RULES:
                m = pat.match(p)
                if m:
                    q_en = dict(q)
                    q_en["lang"] = "en"
                    q_en["question"] = func(m)
                    q_en["options"] = [translate_opt(o) for o in q["options"]]
                    output_questions.append(q_en)
                    matched = True
                    break
            if not matched:
                raise ValueError(f"Unmatched question template: {qid} {p}")

    print(f"Generated {len(output_questions)} English questions. Running validation...")
    errors = validate_dataset(output_questions)
    if errors:
        print(f"FAILED validation with {len(errors)} errors:")
        for err in errors[:25]:
            print("  -", err)
        sys.exit(1)

    print("ALL VALIDATION CHECKS PASSED (0 errors). Writing output to:", EN_JSON_PATH)
    with open(EN_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(output_questions, f, indent=1, ensure_ascii=False)
        f.write("\n")

    print(f"Successfully generated {EN_JSON_PATH} ({EN_JSON_PATH.stat().st_size:,} bytes).")

if __name__ == "__main__":
    main()
