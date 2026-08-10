// Top models per brand for the lead capture form
export const CAR_MODELS: Record<string, string[]> = {
  BMW: ["1 Serie","2 Serie","3 Serie","4 Serie","5 Serie","6 Serie","7 Serie","X1","X2","X3","X4","X5","X6","X7","iX","i3","i4","i5","M3","M5","Z4"],
  "Mercedes-Benz": ["A-Klasse","B-Klasse","C-Klasse","E-Klasse","S-Klasse","CLA","CLS","GLA","GLB","GLC","GLE","GLS","Sprinter","Vito","EQA","EQB","EQC","EQE","EQS"],
  Audi: ["A1","A2","A3","A4","A5","A6","A7","A8","Q2","Q3","Q5","Q7","Q8","TT","e-tron","e-tron GT","RS3","RS4","RS6"],
  Volkswagen: ["Polo","Golf","Golf Plus","Passat","Tiguan","Touareg","T-Cross","T-Roc","ID.3","ID.4","ID.5","Touran","Caddy","Crafter","Transporter","Up","Arteon"],
  Toyota: ["Aygo","Yaris","Corolla","Camry","Prius","RAV4","C-HR","Land Cruiser","Auris","Avensis","Proace","bZ4X"],
  Ford: ["Fiesta","Focus","Mondeo","Puma","Kuga","Explorer","Mustang","Mustang Mach-E","EcoSport","S-Max","Galaxy","Transit","Transit Custom","Ranger"],
  Opel: ["Corsa","Astra","Insignia","Mokka","Crossland","Grandland","Zafira","Vivaro","Movano","Combo"],
  Renault: ["Clio","Megane","Laguna","Scenic","Captur","Kadjar","Koleos","Zoe","Twingo","Kangoo","Trafic","Master","Arkana"],
  Peugeot: ["108","207","208","308","408","508","2008","3008","5008","Partner","Boxer","Expert"],
  Kia: ["Picanto","Rio","Ceed","Stonic","Niro","Sportage","Sorento","Soul","EV6","EV9","XCeed"],
  Hyundai: ["i10","i20","i30","i40","Tucson","Santa Fe","Kona","IONIQ","IONIQ 5","IONIQ 6","H-1"],
  Volvo: ["V40","V60","V70","V90","S40","S60","S90","XC40","XC60","XC70","XC90","C30","C40","EX30","EX40","EX90"],
  Skoda: ["Fabia","Rapid","Octavia","Superb","Kamiq","Karoq","Kodiaq","Enyaq","Scala"],
  Seat: ["Ibiza","Leon","Toledo","Ateca","Arona","Tarraco","Alhambra"],
  Dacia: ["Sandero","Logan","Duster","Jogger","Spring"],
  Fiat: ["500","500X","500L","Panda","Punto","Tipo","Doblo","Ducato"],
  Nissan: ["Micra","Note","Juke","Qashqai","X-Trail","Leaf","Ariya","Navara","NV200"],
  Tesla: ["Model 3","Model Y","Model S","Model X","Cybertruck"],
  Mini: ["Mini 3-deurs","Mini 5-deurs","Mini Cabrio","Mini Clubman","Mini Countryman"],
  Porsche: ["911","Cayenne","Macan","Panamera","Taycan","Boxster","Cayman"],
  "Citroen": ["C1","C2","C3","C4","C5","Berlingo","Jumpy","C3 Aircross","C5 Aircross"],
  Mazda: ["2","3","6","CX-3","CX-30","CX-5","CX-60","MX-5","MX-30"],
  Honda: ["Jazz","Civic","Accord","HR-V","CR-V","e"],
  Suzuki: ["Alto","Swift","Ignis","Jimny","Vitara","S-Cross"],
  Mitsubishi: ["Colt","Lancer","Eclipse Cross","ASX","Outlander","L200"],
  Subaru: ["Impreza","Legacy","Outback","Forester","XV","BRZ"],
  Lexus: ["CT","IS","ES","LS","UX","NX","RX","LX","RZ"],
  "Land Rover": ["Defender","Discovery","Discovery Sport","Freelander","Range Rover","Range Rover Sport","Range Rover Evoque"],
  Jeep: ["Renegade","Compass","Cherokee","Grand Cherokee","Wrangler","Avenger"],
  Alfa_Romeo: ["Giulia","Stelvio","Tonale","Giulietta","MiTo"],
  Overige: ["Anders model"],
};

export const BRANDS_LIST = Object.keys(CAR_MODELS).map(b => b.replace(/_/g, " "));

export const SERVICES_LIST = [
  "Autosleutel kwijt / noodsleutel",
  "Reservesleutel bijmaken",
  "Auto openen zonder sleutel",
  "Sleutel programmeren",
  "Transponder inleren",
  "Smart key / keyless entry",
  "Contactslot reparatie",
  "Sleutelbehuizing vervangen",
  "Alle sleutels kwijt",
  "Bedrijfswagen sleutel",
  "Tesla key card programmeren",
  "ECU clonen / component protection",
];

export const YEARS_LIST: string[] = Array.from({ length: 27 }, (_, i) => String(2026 - i));
