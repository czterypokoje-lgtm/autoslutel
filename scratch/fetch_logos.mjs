import fs from 'fs';
import path from 'path';

const logos = {
  volkswagen: 'https://upload.wikimedia.org/wikipedia/commons/6/6d/Volkswagen_logo_2019.svg',
  bmw: 'https://upload.wikimedia.org/wikipedia/commons/4/44/BMW.svg',
  mercedes: 'https://upload.wikimedia.org/wikipedia/commons/9/90/Mercedes-Logo.svg',
  audi: 'https://upload.wikimedia.org/wikipedia/commons/9/92/Audi-Logo_2016.svg',
  ford: 'https://upload.wikimedia.org/wikipedia/commons/a/a0/Ford_Motor_Company_Logo.svg',
  renault: 'https://upload.wikimedia.org/wikipedia/commons/b/b7/Renault_2021_Text.svg',
  peugeot: 'https://upload.wikimedia.org/wikipedia/commons/f/f7/Peugeot_Logo.svg',
  toyota: 'https://upload.wikimedia.org/wikipedia/commons/e/ee/Toyota_logo_%28Red%29.svg',
  nissan: 'https://upload.wikimedia.org/wikipedia/commons/2/23/Nissan_2020_logo.svg',
  hyundai: 'https://upload.wikimedia.org/wikipedia/commons/4/44/Hyundai_Motor_Company_logo.svg',
  citroen: 'https://upload.wikimedia.org/wikipedia/commons/4/48/Citro%C3%ABn_2021_logo.svg',
  opel: 'https://upload.wikimedia.org/wikipedia/commons/b/b4/Opel_2020_logo.svg',
  kia: 'https://upload.wikimedia.org/wikipedia/commons/4/47/KIA_logo2.svg'
};

async function downloadLogo(name, url) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
    const buffer = await res.arrayBuffer();
    const ext = url.endsWith('.png') ? '.png' : '.svg';
    const filePath = path.join(process.cwd(), 'public', 'brands', `${name}_logo${ext}`);
    fs.writeFileSync(filePath, Buffer.from(buffer));
    console.log(`Downloaded ${name}`);
  } catch (err) {
    console.error(`Error downloading ${name}: ${err.message}`);
  }
}

async function main() {
  for (const [name, url] of Object.entries(logos)) {
    await downloadLogo(name, url);
  }
}

main();
