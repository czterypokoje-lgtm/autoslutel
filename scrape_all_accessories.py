import urllib.request
import re
import csv
import json
import os
import concurrent.futures

# Get existing slugs
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

def scrape_url(url):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        html = urllib.request.urlopen(req).read().decode('utf-8')
        
        title_match = re.search(r'<title itemprop="name">([^<]+)</title>', html)
        if not title_match:
            return None
        title = title_match.group(1).strip()
        
        img_match = re.search(r'<meta itemprop="image" content="([^"]+)">', html)
        img_url = img_match.group(1).strip() if img_match else ""
        
        price = "1.0"
        json_ld_match = re.search(r'<script type="application/ld\+json">({[^<]+})</script>', html)
        if json_ld_match:
            try:
                data = json.loads(json_ld_match.group(1).replace('&uuml;', 'ü').replace('&ouml;', 'ö').replace('&auml;', 'ä'))
                if "offers" in data and "price" in data["offers"]:
                    price = data["offers"]["price"]
            except:
                pass
                
        slug = url.split('/')[-1].lower()
        
        # Download image
        local_url = ""
        if img_url.startswith("http"):
            filename = img_url.split('/')[-1]
            local_path = f"public/images/products/{filename}"
            local_url = f"https://autosleutel-specialist.nl/images/products/{filename}"
            if not os.path.exists(local_path):
                try:
                    img_req = urllib.request.Request(img_url, headers={'User-Agent': 'Mozilla/5.0'})
                    img_data = urllib.request.urlopen(img_req).read()
                    with open(local_path, 'wb') as img_f:
                        img_f.write(img_data)
                except:
                    pass
                    
        return {
            "ID": "9" + str(len(existing_slugs) + len(new_urls)).zfill(3),
            "Slug": slug,
            "Title_DE": title,
            "Title_NL": "Accessoire · " + title,
            "Category": "accessoires",
            "Subcategory": "",
            "Makes": "",
            "CostPrice": price if float(price) > 0 else "1.0",
            "Main_Image": local_url,
            "All_Images": local_url
        }
    except Exception as e:
        return None

rows = []
with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
    results = list(executor.map(scrape_url, new_urls))
    for r in results:
        if r:
            rows.append(r)
            existing_slugs.add(r['Slug'])

# Read fieldnames from CSV
with open('src/data/akey-products.csv', 'r') as f:
    reader = csv.DictReader(f)
    fieldnames = reader.fieldnames

with open('src/data/akey-products.csv', 'a', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    for row in rows:
        writer.writerow(row)

print(f"Done appending {len(rows)} products to CSV.")
