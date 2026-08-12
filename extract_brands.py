import re

with open('src/config/brands.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Match the brand objects
brands = []
for match in re.finditer(r"slug:\s*'([^']+)',\s*name:\s*'([^']+)'", content):
    brands.append(match.group(1))

print(brands)
