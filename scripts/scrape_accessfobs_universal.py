import json
import os
import re
import urllib.request
import ssl

def main():
    urls = [
        {"url": "https://accessfobs.co.uk/collections/keydiy-universal-remotes", "tags": "Universal Remotes, KeyDiy", "brand": "KeyDiy"},
        {"url": "https://accessfobs.co.uk/collections/universal-remotes", "tags": "Universal Remotes, Xhorse", "brand": "Xhorse"},
        {"url": "https://accessfobs.co.uk/collections/autel-remotes", "tags": "Universal Remotes, Autel", "brand": "Autel"},
        {"url": "https://accessfobs.co.uk/collections/universal-remotes-1", "tags": "Universal Remotes, Lonsdor", "brand": "Lonsdor"}
    ]
    
    db_file = os.path.join(os.path.dirname(__file__), '../src/lib/scraped_products.json')
    with open(db_file, 'r', encoding='utf-8') as f:
        db = json.load(f)
        
    max_id = max(p.get('id', 0) for p in db)
    total_added = 0
    
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    
    headers = {'User-Agent': 'Mozilla/5.0'}

    for item in urls:
        print(f"Fetching {item['url']}...")
        req = urllib.request.Request(item['url'], headers=headers)
        try:
            response = urllib.request.urlopen(req, context=ctx)
            html = response.read().decode('utf-8')
        except Exception as e:
            print(f"Error fetching {item['url']}: {e}")
            continue

        # The string is doubly escaped JSON.
        html_unescaped = html.replace('\\"', '"').replace('\\/', '/')
        
        titles = re.findall(r'"title":"([^"]+)"(?:,"vendor")?', html_unescaped)
        prices = re.findall(r'"amount":([\d\.]+)', html_unescaped)
        images = re.findall(r'"src":"([^"]+\.(?:jpg|png)[^"]*)"', html_unescaped)
        
        valid_titles = []
        for t in titles:
            if t != "Default Title" and "Universal Remotes" not in t and "Collections" not in t and "collection" not in t.lower():
                # Filter out obvious non-products
                valid_titles.append(t)
                
        seen = set()
        unique_titles = []
        for t in valid_titles:
            if t not in seen:
                seen.add(t)
                unique_titles.append(t)
                
        print(f"Extracted {len(unique_titles)} unique titles from {item['brand']}")
        
        added_count = 0
        default_price = "19.99"
        
        for i, title in enumerate(unique_titles):
            price = prices[i] if i < len(prices) else default_price
            image = images[i] if i < len(images) else ""
            
            if image and image.startswith('//'):
                image = 'https:' + image
                
            is_duplicate = any(p.get('title') == title for p in db)
            if is_duplicate:
                print(f"Skipping duplicate: {title}")
                continue

            max_id += 1
            new_product = {
                "id": max_id,
                "brand": item['brand'],
                "title": title,
                "price": price,
                "description": f"<p>{title}</p>",
                "tags": item['tags'],
                "imageLocalPath": "",
                "imageOriginalUrl": image
            }
            db.append(new_product)
            added_count += 1
            
        print(f"Added {added_count} products for {item['brand']}\n")
        total_added += added_count
        
    with open(db_file, 'w', encoding='utf-8') as f:
        json.dump(db, f, indent=2, ensure_ascii=False)
        
    print(f"\nSuccessfully added {total_added} universal remotes in total.")

if __name__ == "__main__":
    main()
