import json
import os
import re

def slugify(text):
    text = text.lower().strip()
    text = re.sub(r'\s+', '-', text)
    text = re.sub(r'[^\w\-]+', '', text)
    text = re.sub(r'\-\-+', '-', text)
    text = re.sub(r'^-+', '', text)
    text = re.sub(r'-+$', '', text)
    return text

BATTERY_INVENTORY = [
  { 'code': 'CR2032', 'title': 'Panasonic CR2032 3v Lithium Batteries 5 Pack' },
  { 'code': 'CR2025', 'title': 'Eunicell CR2025 3v Lithium Batteries 5 Pack' },
  { 'code': 'CR2016', 'title': 'Eunicell CR2016 3v Lithium Batteries 5 Pack' },
  { 'code': 'CR1620', 'title': 'Auto-XT CR1620 3v Lithium Batteries 5 Pack' },
  { 'code': 'CR1616', 'title': 'Eunicell CR1616 3v Lithium Batteries 5 Pack' },
  { 'code': 'CR2450', 'title': 'Panasonic CR2450 3v Lithium Batteries 5 Pack' },
  { 'code': 'CR1225', 'title': 'Eunicell CR1225 3v Lithium Batteries 5 Pack' },
  { 'code': 'VL2020', 'title': 'VL2020 PCB Battery for BMW (180 degrees)' },
  { 'code': 'VL2330', 'title': 'Genuine Panasonic Rechargeable Battery VL2330 Model 3V for Land Rover/ Ford Transit (180 Degrees)' },
]

def main():
    base_dir = os.path.dirname(__file__)
    input_path = os.path.join(base_dir, '../src/lib/scraped_products.json')
    output_path = os.path.join(base_dir, '../src/lib/bundle_mapping.json')

    with open(input_path, 'r', encoding='utf-8') as f:
        products = json.load(f)

    battery_db = {}
    for inv in BATTERY_INVENTORY:
        slug = slugify(inv['title'])
        prod = next((p for p in products if slugify(p['title']) == slug), None)
        if prod:
            battery_db[inv['code']] = {
                'slug': slug,
                'title': prod['title'],
                'price': prod.get('price', 5.49),
                'image': prod.get('imageOriginalUrl') or prod.get('imageUrl') or ''
            }
        else:
            battery_db[inv['code']] = {
                'slug': slug,
                'title': inv['title'],
                'price': 5.49,
                'image': ''
            }

    bundle_mapping = {}
    matched_count = 0
    default_count = 0

    for product in products:
        slug = slugify(product['title'])
        desc = (product.get('description') or '').upper()

        matched_battery = None
        for inv in BATTERY_INVENTORY:
            if inv['code'] in desc:
                matched_battery = battery_db[inv['code']]
                break

        if matched_battery:
            matched_count += 1
        else:
            matched_battery = battery_db['CR2032']
            default_count += 1

        bundle_mapping[slug] = {
            'battery': matched_battery
        }

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(bundle_mapping, f, indent=2)

    print(f"Successfully generated bundle mapping for {len(products)} products.")
    print(f"Matched explicit batteries: {matched_count}")
    print(f"Defaulted to CR2032: {default_count}")

if __name__ == '__main__':
    main()
