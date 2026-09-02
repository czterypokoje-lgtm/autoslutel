const fs = require('fs');

let content = fs.readFileSync('src/components/webshop/VehicleFitmentWidget.tsx', 'utf8');

const oldSyntax = `{activeTab === 'kenteken' ? (
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <input`;
          
const newSyntax = `{activeTab === 'kenteken' ? (
        <>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <input`;
          
content = content.replace(oldSyntax, newSyntax);

content = content.replace(
  "{kentekenError && <div style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: '0.5rem' }}>{kentekenError}</div>}\n      ) : (",
  "{kentekenError && <div style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: '0.5rem' }}>{kentekenError}</div>}\n        </>\n      ) : ("
);

fs.writeFileSync('src/components/webshop/VehicleFitmentWidget.tsx', content);
