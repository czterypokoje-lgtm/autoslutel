import re
import json
import codecs

def to_slug(name):
    # simple slugify
    s = name.lower()
    s = re.sub(r'[^a-z0-9\s-]', '', s)
    s = re.sub(r'[\s-]+', '-', s)
    return s

# Provided by the user:
opel_list = ["Agila", "Amperia", "Antara", "Astra", "Calibra", "Combo", "Corsa", "Crossland", "Frontera", "Insignia", "Meriva", "Mokka", "Movano", "Omega", "Signum", "Karl", "Sintra", "Speedster", "Tigra", "Vectra", "Vivaro", "Zafira"]
peugeot_list = ["106", "107", "108", "206", "206 Cabrio", "207", "301", "306 SB", "306 SC", "307", "308", "406", "406 SB", "406 SC", "406 SV", "407", "607", "806", "806 SB", "806 SC", "807", "1007", "3008", "4007", "5008", "Bipper", "Boxer", "Expert", "Partner", "Ranch", "RCZ", "Traveller"]
porsche_list = ["911", "968", "Boxster", "Panamera", "Macan", "Cayenne", "Cayman"]
vw_list = ["Caddy", "Caravelle", "Crafter", "Cross Golf", "Eos", "Euro Van", "Fox", "Golf", "Golf Cabrio", "Golf Gti", "Golf Plus", "Jetta", "Kombi", "Lavida", "LT28", "Lupo", "Maggiolino", "Magotan", "Multivan", "Nouvelle", "Coccinelle", "Passat", "Passat W8", "Polo", "Rabbit", "Routan", "Sagitar", "Saveiro", "Scirocco", "Sharan", "Tiguan", "Touareg", "Touran", "Transporter", "Up", "Vento"]

# Add custom comprehensive lists for major brands
brand_models = {
    'opel': opel_list,
    'peugeot': peugeot_list,
    'porsche': porsche_list,
    'volkswagen': vw_list,
    'bmw': ['1 Serie', '2 Serie', '3 Serie', '4 Serie', '5 Serie', '6 Serie', '7 Serie', '8 Serie', 'i3', 'i4', 'i5', 'i7', 'i8', 'iX', 'iX1', 'iX2', 'iX3', 'X1', 'X2', 'X3', 'X4', 'X5', 'X6', 'X7', 'Z3', 'Z4', 'M2', 'M3', 'M4', 'M5', 'M6', 'M8'],
    'mercedes': ['A-Klasse', 'B-Klasse', 'C-Klasse', 'CLA', 'CLK', 'CLS', 'E-Klasse', 'G-Klasse', 'GL', 'GLA', 'GLB', 'GLC', 'GLE', 'GLK', 'GLS', 'M-Klasse', 'R-Klasse', 'S-Klasse', 'SL', 'SLC', 'SLK', 'SLS AMG', 'Sprinter', 'V-Klasse', 'Viano', 'Vito', 'EQE', 'EQS', 'EQC', 'EQA', 'EQB'],
    'audi': ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'Q2', 'Q3', 'Q5', 'Q7', 'Q8', 'R8', 'TT', 'e-tron', 'Q4 e-tron', 'e-tron GT', 'S1', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'RS3', 'RS4', 'RS5', 'RS6', 'RS7', 'RS Q3', 'RS Q8'],
    'volvo': ['C30', 'C70', 'S40', 'S60', 'S70', 'S80', 'S90', 'V40', 'V50', 'V60', 'V70', 'V90', 'XC40', 'XC60', 'XC70', 'XC90', 'EX30', 'EX90', 'C40'],
    'toyota': ['Auris', 'Avensis', 'Aygo', 'C-HR', 'Camry', 'Celica', 'Corolla', 'Corolla Cross', 'GT86', 'Highlander', 'Hilux', 'IQ', 'Land Cruiser', 'MR2', 'Prius', 'Proace', 'Proace City', 'RAV4', 'Supra', 'Urban Cruiser', 'Verso', 'Yaris', 'Yaris Cross', 'bZ4X'],
    'ford': ['B-Max', 'C-Max', 'Cougar', 'Courier', 'EcoSport', 'Edge', 'Escape', 'Escort', 'Explorer', 'F-150', 'Fiesta', 'Focus', 'Fusion', 'Galaxy', 'Grand C-Max', 'KA', 'KA+', 'Kuga', 'Mondeo', 'Mustang', 'Mustang Mach-E', 'Puma', 'Ranger', 'S-Max', 'Tourneo', 'Transit', 'Transit Connect', 'Transit Courier', 'Transit Custom'],
    'fiat': ['124 Spider', '500', '500C', '500L', '500X', '600', 'Barchetta', 'Bravo', 'Croma', 'Doblo', 'Ducato', 'Fiorino', 'Freemont', 'Grande Punto', 'Idea', 'Multipla', 'Palio', 'Panda', 'Punto', 'Punto Evo', 'Qubo', 'Scudo', 'Sedici', 'Seicento', 'Stilo', 'Talento', 'Tipo', 'Ulysse'],
    'seat': ['Alhambra', 'Altea', 'Altea XL', 'Arona', 'Arosa', 'Ateca', 'Cordoba', 'Exeo', 'Ibiza', 'Leon', 'Mii', 'Tarraco', 'Toledo'],
    'skoda': ['Citigo', 'Enyaq', 'Fabia', 'Kamiq', 'Karoq', 'Kodiaq', 'Octavia', 'Praktik', 'Rapid', 'Roomster', 'Scala', 'Superb', 'Yeti'],
    'mazda': ['Mazda 121', 'Mazda 2', 'Mazda 3', 'Mazda 323', 'Mazda 5', 'Mazda 6', 'Mazda 626', 'BT-50', 'CX-3', 'CX-30', 'CX-5', 'CX-60', 'CX-7', 'CX-9', 'MX-3', 'MX-5', 'RX-8', 'Tribute'],
    'kia': ['Carens', 'Carnival', 'Ceed', 'Cerato', 'EV6', 'EV9', 'Niro', 'Optima', 'Picanto', 'ProCeed', 'Rio', 'Sorento', 'Soul', 'Sportage', 'Stinger', 'Stonic', 'Venga', 'XCeed'],
    'hyundai': ['Atos', 'Bayon', 'Coupe', 'Elantra', 'Excel', 'Galloper', 'Getz', 'Grandeur', 'H-1', 'H200', 'i10', 'i20', 'i30', 'i40', 'Ioniq', 'Ioniq 5', 'Ioniq 6', 'ix20', 'ix35', 'Kona', 'Matrix', 'NEXO', 'Santa Fe', 'Sonata', 'Terracan', 'Trajet', 'Tucson', 'Veloster'],
    'nissan': ['200SX', '350Z', '370Z', 'Almera', 'Almera Tino', 'Ariya', 'Cube', 'Evalia', 'GT-R', 'Interstar', 'Juke', 'Kubistar', 'Leaf', 'Maxima', 'Micra', 'Murano', 'Navara', 'Note', 'NV200', 'NV250', 'NV300', 'NV400', 'Pathfinder', 'Patrol', 'Pixo', 'Primastar', 'Primera', 'Qashqai', 'Qashqai+2', 'Serena', 'Skyline', 'Sunny', 'Terrano', 'Townstar', 'X-Trail'],
    'honda': ['Accord', 'Civic', 'CR-V', 'CR-Z', 'FR-V', 'HR-V', 'Insight', 'Jazz', 'Legend', 'Logo', 'NSX', 'Prelude', 'S2000', 'Stream', 'e'],
    'land-rover': ['Defender', 'Discovery', 'Discovery Sport', 'Freelander', 'Range Rover', 'Range Rover Evoque', 'Range Rover Sport', 'Range Rover Velar'],
    'tesla': ['Cybertruck', 'Model 3', 'Model S', 'Model X', 'Model Y', 'Roadster'],
    'lexus': ['CT', 'ES', 'GS', 'IS', 'LC', 'LFA', 'LS', 'NX', 'RC', 'RX', 'RZ', 'SC', 'UX'],
    'mini': ['Clubman', 'Convertible', 'Cooper', 'Countryman', 'Coupe', 'Paceman', 'Roadster'],
    'citroen': ['AMI', 'Berlingo', 'C-Crosser', 'C-Elysée', 'C-Zero', 'C1', 'C2', 'C3', 'C3 Aircross', 'C3 Picasso', 'C4', 'C4 Aircross', 'C4 Cactus', 'C4 Picasso', 'C4 SpaceTourer', 'C5', 'C5 Aircross', 'C5 X', 'C6', 'C8', 'DS3', 'DS4', 'DS5', 'E-Mehari', 'Grand C4 Picasso', 'Grand C4 SpaceTourer', 'Jumper', 'Jumpy', 'Nemo', 'Saxo', 'SpaceTourer', 'Xsara', 'Xsara Picasso'],
    'alfa-romeo': ['145', '146', '147', '156', '159', '166', '4C', '8C', 'Brera', 'Giulia', 'Giulietta', 'GT', 'GTV', 'MiTo', 'Spider', 'Stelvio', 'Tonale'],
    'renault': ['Arkana', 'Austral', 'Avantime', 'Captur', 'Clio', 'Clio II', 'Clio III', 'Clio IV', 'Coach', 'Espace', 'Espace III', 'Espace IV', 'Fluence', 'Kadjar', 'Kangoo', 'Koleos', 'Kyron', 'Laguna', 'Laguna II', 'Laguna III', 'Latitude', 'Master', 'Megane', 'Megane E-Tech', 'Megane II', 'Megane III', 'Megane IV', 'Modus', 'Safrane', 'Scenic', 'Talisman', 'Trafic', 'Twingo', 'Twizy', 'Zoe']
}

file_path = 'src/config/brands.ts'

with codecs.open(file_path, 'r', 'utf-8') as f:
    content = f.read()

# For each brand in the file, if it exists in brand_models, replace its models array.
# The structure is: 
# models: [
#   { ... },
#   { ... }
# ],
# We will find the "slug: 'brand_name'" then find its "models: [" block.

for brand_slug, model_names in brand_models.items():
    # Remove duplicates from the model names list, preserve order
    seen = set()
    unique_models = []
    for m in model_names:
        if m.lower() not in seen:
            seen.add(m.lower())
            unique_models.append(m)
            
    # Generate the replacement block
    new_models_str = "models: [\n"
    for name in unique_models:
        slug = to_slug(name)
        new_models_str += f"      {{ slug: '{slug}', name: '{name}', years: 'Alle bouwjaren' }},\n"
    new_models_str += "    ]"

    # Find the brand block
    pattern = r"(slug:\s*'" + re.escape(brand_slug) + r"'.*?)models:\s*\[.*?\]"
    # replace using regex sub
    new_content = re.sub(pattern, r"\1" + new_models_str, content, flags=re.DOTALL)
    
    # Check if a replacement happened
    if content != new_content:
        content = new_content
    else:
        print(f"Warning: Could not replace models for brand {brand_slug}")

with codecs.open(file_path, 'w', 'utf-8') as f:
    f.write(content)

print("Models updated successfully.")
