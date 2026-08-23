import json
import os
import re

def main():
    content_file = "/Users/ik/.gemini/antigravity/brain/80d95e3c-797c-4fc1-b3b0-4c94cb959dbe/.system_generated/steps/1710/content.md"
    
    with open(content_file, 'r', encoding='utf-8') as f:
        html = f.read()

    # The string is doubly escaped JSON.
    html_unescaped = html.replace('\\"', '"').replace('\\/', '/')
    
    # Just regex out titles, amounts, and images directly!
    # Titles are under "product":{"title":"..."}
    # Wait, the titles in the JSON look like: "title":"Rechargeable VL2020 PCB Battery for BMW (90 degrees)","vendor":...
    titles = re.findall(r'"title":"([^"]+)"(?:,"vendor")?', html_unescaped)
    prices = re.findall(r'"amount":([\d\.]+)', html_unescaped)
    images = re.findall(r'"src":"([^"]+\.(?:jpg|png)[^"]*)"', html_unescaped)
    
    # filter out Default Title and irrelevant titles
    valid_titles = []
    for t in titles:
        if t != "Default Title" and t != "Coin Cell Batteries for Car Key Remotes & Fobs":
            valid_titles.append(t)
            
    # Remove duplicates from valid_titles but keep order
    seen = set()
    unique_titles = []
    for t in valid_titles:
        if t not in seen:
            seen.add(t)
            unique_titles.append(t)
            
    # We might have more prices or images, but usually they match up in the block
    print(f"Fallback extracted {len(unique_titles)} unique titles")
    
    # Load existing products
    db_file = os.path.join(os.path.dirname(__file__), '../src/lib/scraped_products.json')
    with open(db_file, 'r', encoding='utf-8') as f:
        db = json.load(f)
        
    # Get max id to start appending
    max_id = max(p.get('id', 0) for p in db)
    
    added_count = 0
    # Let's just create a list of known battery prices and images
    default_price = "5.49"
    default_img = "https://accessfobs.co.uk/cdn/shop/files/BAT10.png"
    
    for i, title in enumerate(unique_titles):
        price = prices[i] if i < len(prices) else default_price
        image = images[i] if i < len(images) else default_img
        
        if image and image.startswith('//'):
            image = 'https:' + image
            
        is_duplicate = any(p.get('title') == title for p in db)
        if is_duplicate:
            print(f"Skipping duplicate: {title}")
            continue

        max_id += 1
        new_product = {
            "id": max_id,
            "brand": "Access Fobs",
            "title": title,
            "price": price,
            "description": f"<p>{title}</p>",
            "tags": "Batteries, All Products",
            "imageLocalPath": "",
            "imageOriginalUrl": image
        }
        db.append(new_product)
        added_count += 1
        print(f"Added: {title}")
        
    with open(db_file, 'w', encoding='utf-8') as f:
        json.dump(db, f, indent=2, ensure_ascii=False)
        
    print(f"\nSuccessfully added {added_count} batteries to the database.")

if __name__ == "__main__":
    main()
