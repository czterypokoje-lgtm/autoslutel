const fs = require('fs');
let code = fs.readFileSync('src/app/admin/Sidebar.tsx', 'utf8');

const oldSearch = `{/*
          The search field lives on the page that has something to search,
          not up here — this is the way in to it, so the shortcut sits in
          the same place on every screen.
        */}
        <Link href="/admin/klanten" className={styles.iconGhost} title="Zoeken">
          <Search size={16} strokeWidth={1.9} aria-hidden="true" />
        </Link>`;

const newSearch = `
        {/* Only office roles have the global search to Klanten */}
        {(role === 'owner' || role === 'kantoor') && (
          <Link href="/admin/klanten" className={styles.iconGhost} title="Zoeken">
            <Search size={16} strokeWidth={1.9} aria-hidden="true" />
          </Link>
        )}`;

code = code.replace(oldSearch, newSearch);
fs.writeFileSync('src/app/admin/Sidebar.tsx', code);
console.log('Fixed Sidebar.');
