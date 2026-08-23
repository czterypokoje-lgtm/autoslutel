export const VEHICLE_DATA: Record<string, string[]> = {
  'Audi': ['A1', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'Q2', 'Q3', 'Q5', 'Q7', 'Q8', 'TT', 'R8', 'e-tron'],
  'BMW': ['1-Serie', '2-Serie', '3-Serie', '4-Serie', '5-Serie', '6-Serie', '7-Serie', '8-Serie', 'X1', 'X2', 'X3', 'X4', 'X5', 'X6', 'X7', 'Z4', 'i3', 'i4', 'iX'],
  'Citroën': ['C1', 'C3', 'C4', 'C5', 'Berlingo', 'Cactus', 'Picasso', 'Jumpy'],
  'Fiat': ['500', 'Panda', 'Punto', 'Tipo', 'Ducato', 'Fiorino'],
  'Ford': ['Fiesta', 'Focus', 'Mondeo', 'Mustang', 'Kuga', 'Puma', 'Transit', 'Explorer'],
  'Honda': ['Civic', 'Accord', 'CR-V', 'HR-V', 'Jazz'],
  'Hyundai': ['i10', 'i20', 'i30', 'Tucson', 'Kona', 'Santa Fe', 'IONIQ'],
  'Kia': ['Picanto', 'Rio', 'Ceed', 'Sportage', 'Niro', 'Sorento', 'EV6'],
  'Mazda': ['Mazda2', 'Mazda3', 'Mazda6', 'CX-3', 'CX-5', 'CX-30', 'MX-5'],
  'Mercedes-Benz': ['A-Klasse', 'B-Klasse', 'C-Klasse', 'E-Klasse', 'S-Klasse', 'GLA', 'GLC', 'GLE', 'Vito', 'Sprinter'],
  'Mini': ['Cooper', 'Clubman', 'Countryman', 'Paceman'],
  'Nissan': ['Micra', 'Leaf', 'Juke', 'Qashqai', 'X-Trail', 'Navara'],
  'Opel': ['Corsa', 'Astra', 'Insignia', 'Mokka', 'Crossland', 'Grandland', 'Vivaro'],
  'Peugeot': ['108', '208', '308', '508', '2008', '3008', '5008', 'Partner'],
  'Renault': ['Twingo', 'Clio', 'Megane', 'Captur', 'Kadjar', 'Scenic', 'Trafic', 'Master'],
  'Seat': ['Ibiza', 'Leon', 'Arona', 'Ateca', 'Tarraco', 'Mii'],
  'Skoda': ['Fabia', 'Octavia', 'Superb', 'Kamiq', 'Karoq', 'Kodiaq', 'Enyaq'],
  'Toyota': ['Aygo', 'Yaris', 'Corolla', 'C-HR', 'RAV4', 'Prius', 'Hilux'],
  'Volkswagen': ['up!', 'Polo', 'Golf', 'Passat', 'T-Cross', 'T-Roc', 'Tiguan', 'Touareg', 'Transporter', 'ID.3', 'ID.4'],
  'Volvo': ['V40', 'V60', 'V90', 'XC40', 'XC60', 'XC90', 'S60', 'S90']
};

export const FALLBACK_MODELS = ['Standaard Model', 'Sport Model', 'Sedan', 'SUV', 'Stationwagen'];

export const PLATFORMS = ['Hatchback', 'Sedan', 'Stationwagen', 'SUV/Crossover', 'Cabriolet', 'Coupe', 'Bedrijfswagen'];

export const TYPES = ['Benzine', 'Diesel', 'Hybride', 'PHEV (Plug-in)', 'Elektrisch'];

export const MOTORS = ['1.0 TSI', '1.2 PureTech', '1.4 TFSI', '1.5 EcoBoost', '1.6 TDI', '2.0 TDI', '2.0 TFSI', '3.0 V6', 'Elektrisch 150kW'];

export const getYears = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = currentYear; i >= 1990; i--) {
    years.push(i.toString());
  }
  return years;
};
