import os
import shutil
import re

CITIES_FILE = "src/config/cities.ts"
SRC_IMAGES = [
    "autosleutel_audi_smartkey_programmeren_utrecht_west.webp",
    "autosleutel_bmw_reservesleutel_bijmaken_utrecht_oost.webp",
    "autosleutel_ford_reservesleutel_bijmaken_utrecht_centrum.webp",
    "autosleutel_hyundai_reservesleutel_programmeren_utrecht_zuid.webp",
    "autosleutel_specialist_mobiele_werkplaats_utrecht_leidsche_rijn.webp",
    "autosleutel_kia_smartkey_bijmaken_amsterdam_west.webp"
]

def get_cities():
    with open(CITIES_FILE, 'r') as f:
        content = f.read()
    cities = []
    for line in content.split('\n'):
        if '{ slug:"' in line:
            m = re.search(r'slug:"([^"]+)"', line)
            if m:
                cities.append(m.group(1))
    return cities

def main():
    cities = get_cities()
    base_dir = "public/images/cities"
    os.makedirs(base_dir, exist_ok=True)

    for city in cities:
        city_dir = os.path.join(base_dir, city)
        os.makedirs(city_dir, exist_ok=True)
        for i, src_img in enumerate(SRC_IMAGES):
            src_path = os.path.join("public/images/gallery", src_img)
            dest_name = f"autosleutel-bijmaken-{city}-{i+1}.webp"
            dest_path = os.path.join(city_dir, dest_name)
            shutil.copy2(src_path, dest_path)
    print(f"Generated images for {len(cities)} cities. Total images: {len(cities)*len(SRC_IMAGES)}")

if __name__ == "__main__":
    main()
