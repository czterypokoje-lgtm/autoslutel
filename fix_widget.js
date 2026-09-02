const fs = require('fs');

let content = fs.readFileSync('src/components/webshop/VehicleFitmentWidget.tsx', 'utf8');

const newCode = `
  const [result, setResult] = useState<'idle' | 'success' | 'fail'>('idle');

  const checkFitment = () => {
    if (!selectedBrand || !selectedModel || !selectedYear) return;
    
    // If no fitment data is available on the product at all, we assume it's generic
    if (fitment.length === 0) {
      setResult('success');
      return;
    }

    const yearNum = parseInt(selectedYear);
    
    const isMatch = fitment.some(f => 
      f.make.toLowerCase() === selectedBrand.toLowerCase() &&
      f.model.toLowerCase() === selectedModel.toLowerCase() &&
      yearNum >= f.from && yearNum <= f.to
    );

    setResult(isMatch ? 'success' : 'fail');
  };

  // Reset result if user changes inputs
  useEffect(() => {
    setResult('idle');
  }, [selectedBrand, selectedModel, selectedYear]);
`;

content = content.replace(
  "const isComplete = selectedBrand && selectedModel && selectedYear && selectedOrigin;",
  "const isComplete = selectedBrand && selectedModel && selectedYear && selectedOrigin;\n" + newCode
);

const oldButton = `<button \n            disabled={!isComplete}\n            style={{ \n              background: isComplete ? '#0f172a' : '#cbd5e1', \n              color: '#fff', \n              border: 'none', \n              padding: '0.5rem 1rem', \n              borderRadius: '4px', \n              fontWeight: 700, \n              fontSize: '0.85rem', \n              cursor: isComplete ? 'pointer' : 'not-allowed', \n              flex: '1 1 120px',\n              transition: 'background 0.2s'\n            }}>\n            Voertuig toevoegen\n          </button>`;

const newButton = `<button 
            disabled={!isComplete}
            onClick={checkFitment}
            style={{ 
              background: isComplete ? '#0f172a' : '#cbd5e1', 
              color: '#fff', 
              border: 'none', 
              padding: '0.5rem 1rem', 
              borderRadius: '4px', 
              fontWeight: 700, 
              fontSize: '0.85rem', 
              cursor: isComplete ? 'pointer' : 'not-allowed', 
              flex: '1 1 120px',
              transition: 'background 0.2s'
            }}>
            Controleer
          </button>`;

content = content.replace(oldButton, newButton);

const newResultBox = `
      {result === 'success' && (
        <div style={{ marginTop: '1rem', padding: '1rem', background: '#dcfce7', color: '#166534', borderRadius: '4px', display: 'flex', gap: '0.5rem', alignItems: 'center', fontWeight: 600 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
          Pasvorm bevestigd! Dit onderdeel past op uw {selectedBrand} {selectedModel} ({selectedYear}).
        </div>
      )}
      {result === 'fail' && (
        <div style={{ marginTop: '1rem', padding: '1rem', background: '#fee2e2', color: '#991b1b', borderRadius: '4px', display: 'flex', gap: '0.5rem', alignItems: 'center', fontWeight: 600 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
          Dit onderdeel past helaas niet op de geselecteerde auto.
        </div>
      )}
`;

content = content.replace(
  "</div>\n      )}\n\n    </div>\n  );\n}",
  "</div>\n      )}\n" + newResultBox + "\n    </div>\n  );\n}"
);

fs.writeFileSync('src/components/webshop/VehicleFitmentWidget.tsx', content);
