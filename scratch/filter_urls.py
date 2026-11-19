import csv

existing_slugs = set()
with open('src/data/akey-products.csv', 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        existing_slugs.add(row['Slug'].lower())

with open('all_accessory_urls.txt', 'r') as f:
    urls = [line.strip() for line in f if line.strip()]

new_urls = []
for url in urls:
    slug = url.split('/')[-1].lower()
    if slug not in existing_slugs:
        new_urls.append(url)

print(f"Found {len(new_urls)} NEW urls out of {len(urls)}.")

with open('new_accessory_urls.txt', 'w') as f:
    for url in new_urls:
        f.write(url + '\n')
