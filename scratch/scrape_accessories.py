import urllib.request
from bs4 import BeautifulSoup
import json
import csv

urls = [
    "https://a-key-gmbh.com/OBDSTAR-Zubehoer",
    "https://a-key-gmbh.com/XHORSE-Zubehoer",
    "https://a-key-gmbh.com/Zed-FULL-Zubehoer",
    "https://a-key-gmbh.com/Autel-Zubehoer"
]

results = []

for url in urls:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    html = urllib.request.urlopen(req).read()
    soup = BeautifulSoup(html, 'html.parser')
    
    # Items are usually inside .product-wrapper or .product-info
    items = soup.find_all('div', class_='product-wrapper')
    brand = url.split('/')[-1].split('-')[0]
    
    for item in items:
        title_elem = item.find('a', class_='text-clamp-2')
        if not title_elem:
            continue
        title = title_elem.text.strip()
        link = title_elem.get('href')
        
        price_elem = item.find('div', class_='product-price')
        price = price_elem.text.strip() if price_elem else ""
        
        img_elem = item.find('img')
        img = img_elem.get('src') if img_elem else ""
        
        results.append({
            'brand': brand,
            'title': title,
            'link': link,
            'price': price,
            'image': img
        })

print(json.dumps(results, indent=2))
