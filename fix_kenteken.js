const fs = require('fs');
let content = fs.readFileSync('src/components/webshop/VehicleFitmentWidget.tsx', 'utf8');

const kentekenState = `
  const [kenteken, setKenteken] = useState('');
  const [kentekenLoading, setKentekenLoading] = useState(false);
  const [kentekenError, setKentekenError] = useState('');
`;

content = content.replace("const [selectedOrigin, setSelectedOrigin] = useState<string>('');", "const [selectedOrigin, setSelectedOrigin] = useState<string>('');\n" + kentekenState);

const kentekenFunc = `
  const checkKenteken = async () => {
    if (!kenteken) return;
    setKentekenLoading(true);
    setKentekenError('');
    setResult('idle');
    try {
      const cleanK = kenteken.replace(/[^a-zA-Z0-9]/g, '');
      const res = await fetch(\`/api/kenteken?kenteken=\${cleanK}\`);
      const data = await res.json();
      
      if (!res.ok || data.error) {
        setKentekenError(data.error || 'Kenteken niet gevonden');
        setKentekenLoading(false);
        return;
      }
      
      const { merk, handelsbenaming, datum_eerste_toelating } = data.data;
      const kBrand = (merk || '').toLowerCase();
      const kModel = (handelsbenaming || '').toLowerCase();
      const kYear = datum_eerste_toelating ? parseInt(datum_eerste_toelating.substring(0,4)) : 0;
      
      if (fitment.length === 0) {
        setResult('success');
        setKentekenLoading(false);
        return;
      }
      
      const isMatch = fitment.some(f => 
        kBrand.includes(f.make.toLowerCase()) &&
        (kModel.includes(f.model.toLowerCase()) || f.model.toLowerCase().includes(kModel)) &&
        kYear >= f.from && kYear <= f.to
      );
      
      setSelectedBrand(merk || '');
      setSelectedModel(handelsbenaming || '');
      setSelectedYear(kYear.toString());
      setResult(isMatch ? 'success' : 'fail');
    } catch (e) {
      setKentekenError('Fout bij ophalen kenteken');
    }
    setKentekenLoading(false);
  };
`;

content = content.replace("const isComplete = selectedBrand && selectedModel && selectedYear && selectedOrigin;", kentekenFunc + "\n  const isComplete = selectedBrand && selectedModel && selectedYear && selectedOrigin;");

const oldKentekenUI = `<input type="text" placeholder="AB-123-C" style={{ padding: '0.5rem 1rem', border: '1px solid #cbd5e1', borderRadius: '4px', textTransform: 'uppercase', flex: 1, maxWidth: '250px' }} />
          <button style={{ background: '#cbd5e1', color: '#fff', border: 'none', padding: '0.5rem 1.5rem', borderRadius: '4px', fontWeight: 700, cursor: 'not-allowed' }}>Voertuig toevoegen</button>`;

const newKentekenUI = `<input 
            type="text" 
            placeholder="AB-123-C" 
            value={kenteken}
            onChange={(e) => setKenteken(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && checkKenteken()}
            style={{ padding: '0.5rem 1rem', border: '1px solid #cbd5e1', borderRadius: '4px', textTransform: 'uppercase', flex: 1, maxWidth: '250px' }} 
          />
          <button 
            onClick={checkKenteken}
            disabled={!kenteken || kentekenLoading}
            style={{ 
              background: kenteken && !kentekenLoading ? '#0f172a' : '#cbd5e1', 
              color: '#fff', border: 'none', padding: '0.5rem 1.5rem', borderRadius: '4px', fontWeight: 700, 
              cursor: kenteken && !kentekenLoading ? 'pointer' : 'not-allowed' 
            }}>
            {kentekenLoading ? 'Zoeken...' : 'Controleer'}
          </button>
        </div>
        {kentekenError && <div style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: '0.5rem' }}>{kentekenError}</div>}`;

content = content.replace(oldKentekenUI, newKentekenUI);

fs.writeFileSync('src/components/webshop/VehicleFitmentWidget.tsx', content);
