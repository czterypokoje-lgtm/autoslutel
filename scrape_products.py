import urllib.request
import re
import csv
import json

urls = [
    # OBDSTAR
    "https://a-key-gmbh.com/XDNPR8GL-MQB-RH850-V850-Adapter",
    "https://a-key-gmbh.com/ZFPH-RH850-MCU-Reader-Module",
    "https://a-key-gmbh.com/XDMPR8GL-MQB-RH850-V850-Adapter",
    "https://a-key-gmbh.com/OBDSTAR-Key-Master-G3-Tablet",
    "https://a-key-gmbh.com/OBDSTAR-Toyota-30-Kabel-fuer-All-Key-lost",
    "https://a-key-gmbh.com/OBDSTAR-C1022-CAN-DIRECT-V2-Kit",
    "https://a-key-gmbh.com/FBS3-Kit-geeignet-fuer-Mercedes-Benz",
    "https://a-key-gmbh.com/OBDSTAR-RH850-V850-Kompletter-Adapter-Kit",
    
    # Xhorse
    "https://a-key-gmbh.com/XDMO20EN-Xhorse-VVDI-MINI-OBD-Tool",
    "https://a-key-gmbh.com/XDKP00EN-Xhorse-VVDI-Key-Tool-Plus-Pad-Full",
    "https://a-key-gmbh.com/Ein-Jahr-unbegrenzte-Token-fuer-Xhorse-VVDI-MB-BGA-TOOL-BENZ",
    "https://a-key-gmbh.com/XDKT01EN-Xhorse-VVDI-KEY-TOOL-Remote-Programmier-Kabel",
    
    # Zed-FULL
    "https://a-key-gmbh.com/ZFHC-EA-Externe-Antenne-fuer-ZedFull",
    "https://a-key-gmbh.com/ZFH-EA1-EEPROM-PCB-fuer-8-Pins-Zed-FULL",
    "https://a-key-gmbh.com/ZFH-EA2-64-PINS-MCU-ADAPTER-Zed-FULL",
    "https://a-key-gmbh.com/ZFH-C02P-VAG-UDS-DASHBOARD-KABEL-Zed-FULL",
    "https://a-key-gmbh.com/ZFH-C05-CIRCUIT-KABEL-kompatibel-fuer-VW-PASSAT-Zed-FULL",
    "https://a-key-gmbh.com/Zed-FULL-credits-Token",
    "https://a-key-gmbh.com/Zed-FULL-year-lifs-Jahresupdate-fuer-Schluesselkopiermaschine",
    "https://a-key-gmbh.com/ZFHC-OBD2-OBD-Kabel-fuer-ZedFull",
    
    # Autel
    "https://a-key-gmbh.com/Netzadapter-EU-Universal-fuer-Autel-ZedFull-ua"
]

rows = []
for url in urls:
    print(f"Scraping {url}...")
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        html = urllib.request.urlopen(req).read().decode('utf-8')
        
        # Get title
        title_match = re.search(r'<title itemprop="name">([^<]+)</title>', html)
        if not title_match:
            continue
        title = title_match.group(1).strip()
        
        # Get image
        img_match = re.search(r'<meta itemprop="image" content="([^"]+)">', html)
        img = img_match.group(1).strip() if img_match else ""
        
        # Get price from JSON-LD
        price = "0.0"
        json_ld_match = re.search(r'<script type="application/ld\+json">({[^<]+})</script>', html)
        if json_ld_match:
            try:
                data = json.loads(json_ld_match.group(1).replace('&uuml;', 'ü').replace('&ouml;', 'ö').replace('&auml;', 'ä'))
                if "offers" in data and "price" in data["offers"]:
                    price = data["offers"]["price"]
            except Exception as e:
                print("JSON-LD parse error", e)
        
        slug = url.split('/')[-1]
        
        row = {
            "ID": "9" + str(len(rows)).zfill(3), # Invent an ID
            "Slug": slug.lower(),
            "Title_DE": title,
            "Title_NL": "Accessoire · " + title,
            "Category": "accessoires",
            "Subcategory": "",
            "Makes": "",
            "CostPrice": price,
            "Main_Image": img,
            "All_Images": img
        }
        rows.append(row)
    except Exception as e:
        print("Failed", e)

# Write to akey-products.csv (Append)
import csv
with open('src/data/akey-products.csv', 'a', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=rows[0].keys())
    for row in rows:
        writer.writerow(row)
print("Done appending to CSV.")
