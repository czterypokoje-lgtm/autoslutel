import csv
import urllib.request
import os

rows = []
with open('src/data/akey-products.csv', 'r') as f:
    reader = csv.DictReader(f)
    fieldnames = reader.fieldnames
    for row in reader:
        rows.append(row)

for row in rows[-21:]:
    img_url = row["Main_Image"]
    if img_url.startswith("https://a-key-gmbh.com/media/image/"):
        filename = img_url.split('/')[-1]
        local_path = f"public/images/products/{filename}"
        local_url = f"https://autosleutel-specialist.nl/images/products/{filename}"
        print(f"Downloading {filename}...")
        try:
            req = urllib.request.Request(img_url, headers={'User-Agent': 'Mozilla/5.0'})
            img_data = urllib.request.urlopen(req).read()
            with open(local_path, 'wb') as img_f:
                img_f.write(img_data)
            row["Main_Image"] = local_url
            row["All_Images"] = local_url
        except Exception as e:
            print("Failed to download", filename, e)

with open('src/data/akey-products.csv', 'w', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    for row in rows:
        writer.writerow(row)
