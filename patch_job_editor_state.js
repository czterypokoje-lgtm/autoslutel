const fs = require('fs');
let content = fs.readFileSync('src/app/admin/jobs/[id]/JobEditor.tsx', 'utf8');

// Add states
const states = `
  const [revCallout, setRevCallout] = useState(job.revenue_callout === null ? '' : String(job.revenue_callout));
  const [revMaterials, setRevMaterials] = useState(job.revenue_materials === null ? '' : String(job.revenue_materials));
  const [revLabor, setRevLabor] = useState(job.revenue_labor === null ? '' : String(job.revenue_labor));
  const [revDiscount, setRevDiscount] = useState(job.revenue_discount === null ? '' : String(job.revenue_discount));
  
  const [costMaterials, setCostMaterials] = useState(job.cost_materials === null ? '' : String(job.cost_materials));
  const [costTech, setCostTech] = useState(job.cost_technician === null ? '' : String(job.cost_technician));
  const [costTravel, setCostTravel] = useState(job.cost_travel === null ? '' : String(job.cost_travel));
  const [costFee, setCostFee] = useState(job.cost_payment_fee === null ? '' : String(job.cost_payment_fee));
  const [costOther, setCostOther] = useState(job.cost_other === null ? '' : String(job.cost_other));
`;

content = content.replace("  const [error, setError] = useState('');", states + "\n  const [error, setError] = useState('');");

// Update JSON body
const jsonPatch = `
        revenue_callout: revCallout.trim() === '' ? null : revCallout.trim(),
        revenue_materials: revMaterials.trim() === '' ? null : revMaterials.trim(),
        revenue_labor: revLabor.trim() === '' ? null : revLabor.trim(),
        revenue_discount: revDiscount.trim() === '' ? null : revDiscount.trim(),
        cost_materials: costMaterials.trim() === '' ? null : costMaterials.trim(),
        cost_technician: costTech.trim() === '' ? null : costTech.trim(),
        cost_travel: costTravel.trim() === '' ? null : costTravel.trim(),
        cost_payment_fee: costFee.trim() === '' ? null : costFee.trim(),
        cost_other: costOther.trim() === '' ? null : costOther.trim(),
`;

content = content.replace(
  "final_price: finalPrice.trim() === '' ? null : finalPrice.trim(),",
  "final_price: finalPrice.trim() === '' ? null : finalPrice.trim(),\n" + jsonPatch
);

fs.writeFileSync('src/app/admin/jobs/[id]/JobEditor.tsx', content);
