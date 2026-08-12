// ============================================================
// BRANDS CONFIG — 38 Car Brands
// Each brand: slug, name, priority, system, models
// Expanded with Year Ranges for SEO
// ============================================================

export type Brand = {
  slug: string;
  name: string;
  nameSlug: string; // for URL: /merken/[nameSlug]
  priority: 'P1' | 'P2' | 'P3';
  system: string;   // ECU/immobilizer system
  excerpt: string;
  models?: BrandModel[];
  customH1?: string;
  customMetaTitle?: string;
  customSeoBlurb?: string; // model-specific SEO paragraph for long-tail keywords
};

export type BrandModel = {
  slug: string;
  name: string;
  generations?: string;
  years: string; // e.g. "2011–2024" or "2010, 2011, 2012, 2013, 2014, 2015"
};

export const BRANDS: Brand[] = [
  {
    slug: 'bmw', name: 'BMW', nameSlug: 'bmw', priority: 'P1',
    system: 'CAS2 / CAS3+ / CAS4+ / FEM / BDC',
    excerpt: 'BMW sleutel programmering voor alle series. CAS, FEM en BDC systemen. 1/3/5/7 Serie, X1–X7, M-series, i-series.',
    customSeoBlurb: 'Wij helpen u met de BMW X1 sleutel bijmaken, BMW X2 sleutel bij laten maken en BMW sleutel bijmaken kosten transparant berekenen. De BMW X1 (E84, F48) en X2 (F39) gebruiken het BDC-systeem. Ook de 1 Serie, 3 Serie, X3 en X5 sleutels leren wij in op locatie. De BMW sleutel bijmaken kosten liggen bij ons tot 50% lager dan bij de BMW-dealer.',
    models: [
      { slug: '1-serie', name: '1 Serie', generations: 'E81, E87, F20, F40', years: '2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: '2-serie', name: '2 Serie', generations: 'F22, F44, G42', years: '2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: '3-serie', name: '3 Serie', generations: 'E46, E90, F30, G20', years: '1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: '4-serie', name: '4 Serie', generations: 'F32, G22', years: '2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: '5-serie', name: '5 Serie', generations: 'E39, E60, F10, G30, G60', years: '1995, 1996, 1997, 1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: '7-serie', name: '7 Serie', generations: 'E65, F01, G11', years: '2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'x1', name: 'X1', generations: 'E84, F48, U11', years: '2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'x3', name: 'X3', generations: 'E83, F25, G01', years: '2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'x5', name: 'X5', generations: 'E53, E70, F15, G05', years: '1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
    
      { slug: 'x2', name: 'X2', years: '2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },],
  },
  {
    slug: 'mercedes', name: 'Mercedes-Benz', nameSlug: 'mercedes', priority: 'P1',
    system: 'IR / HFM / NEC / EIS / ESL',
    excerpt: 'Mercedes sleutel programmering. W204, W205, W213, Sprinter, Vito. EIS/ESL bench programmering.',
    customSeoBlurb: 'Heeft u een Mercedes Benz CLK sleutel bijmaken nodig, of wilt u de Mercedes Benz ML autosleutel bijmaken of de Mercedes Benz SL Klasse autosleutel bijmaken? Ook de Mercedes Benz CL Klasse autosleutel bij laten maken behoort tot ons dagelijks werk. Wij werken met EIS/ESL bench-programmering voor alle modellen, van de A-Klasse tot de S-Klasse, CLA, GLA en GLC.',
    models: [
      { slug: 'a-klasse', name: 'A-Klasse', generations: 'W168, W169, W176, W177', years: '1997, 1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'c-klasse', name: 'C-Klasse', generations: 'W203, W204, W205, W206', years: '2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'e-klasse', name: 'E-Klasse', generations: 'W211, W212, W213, W214', years: '2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 's-klasse', name: 'S-Klasse', generations: 'W220, W221, W222, W223', years: '1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'vito', name: 'Vito', generations: 'W639, W447', years: '2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'sprinter', name: 'Sprinter', generations: '906, 907', years: '2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'glc', name: 'GLC', years: '2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'gla', name: 'GLA', years: '2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'cla', name: 'CLA', years: '2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'alle-modellen', name: 'Alle Modellen', years: '2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
    
      { slug: 'sl-klasse', name: 'SL-Klasse', years: '2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012' },
      { slug: 'clk', name: 'CLK', years: '2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010' },
      { slug: 'ml', name: 'ML', years: '2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015' },
      { slug: 'cls', name: 'CLS', years: '2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018' },
      { slug: 'cl-klasse', name: 'CL-Klasse', years: '2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012' },],
  },
  {
    slug: 'volkswagen', name: 'Volkswagen', nameSlug: 'volkswagen', priority: 'P1',
    system: 'MQB / MLB / PQ35 / SFD',
    excerpt: 'VW sleutel programmering. Golf 7/8, Tiguan, Polo, Passat. SFD ontgrendeling specialist.',
    customSeoBlurb: 'Populaire zoekopdrachten bij ons: Volkswagen Eos sleutel bij laten maken, Volkswagen Jetta sleutel bij laten maken en Volkswagen Transporter sleutel bij laten maken. De VW Eos (2006-2015) en VW Jetta (2005-2018) gebruiken het PQ35-platform. De Transporter T5/T6 werkt met MQB. Wij leren alle VW sleutels in op locatie.',
    models: [
      { slug: 'polo', name: 'Polo', generations: '6R, AW', years: '2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'golf', name: 'Golf', generations: '5, 6, 7, 8', years: '2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'passat', name: 'Passat', generations: 'B6, B7, B8, B9', years: '2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'tiguan', name: 'Tiguan', generations: '5N, AD1', years: '2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'id-3', name: 'ID.3', years: '2020, 2021, 2022, 2023, 2024' },
      { slug: 'id-4', name: 'ID.4', years: '2020, 2021, 2022, 2023, 2024' },
      { slug: 'id-5', name: 'ID.5', years: '2022, 2023, 2024' },
      { slug: 't-roc', name: 'T-Roc', years: '2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'touareg', name: 'Touareg', years: '2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'transporter', name: 'Transporter', generations: 'T5, T6, T6.1', years: '2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'up', name: 'Up!', years: '2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023' },
      { slug: 'touran', name: 'Touran', years: '2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'arteon', name: 'Arteon', years: '2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'crafter', name: 'Crafter', years: '2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
    
      { slug: 'jetta', name: 'Jetta', years: '2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018' },
      { slug: 'eos', name: 'Eos', years: '2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015' },],
  },
  {
    slug: 'audi', name: 'Audi', nameSlug: 'audi', priority: 'P1',
    system: 'MMI / MIB / VW Group',
    excerpt: 'Audi sleutel programmering. A3, A4, A6, Q3, Q5, Q7. VW Group platform specialist.',
    customSeoBlurb: 'Veel klanten vragen ons voor Audi A6 sleutel bij laten maken en Audi S3 sleutel bij laten maken. De Audi A6 autosleutel bijmaken (C6, C7, C8) vereist MLB-platform programmering. De Audi S3 sleutel bijmaken werkt met hetzelfde platform als de A3. Altijd op locatie, met 12 maanden garantie.',
    models: [
      { slug: 'a1', name: 'A1', generations: '8X, GB', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'a3', name: 'A3', generations: '8P, 8V, 8Y', years: '2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'a4', name: 'A4', generations: 'B7, B8, B9', years: '2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'a5', name: 'A5', years: '2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'a6', name: 'A6', generations: 'C6, C7, C8', years: '2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'a7', name: 'A7', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'q3', name: 'Q3', years: '2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'q5', name: 'Q5', generations: '8R, FY', years: '2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'q7', name: 'Q7', years: '2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'q8', name: 'Q8', years: '2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'e-tron', name: 'e-tron', years: '2018, 2019, 2020, 2021, 2022, 2023, 2024' },
    
      { slug: 's3', name: 'S3', years: '1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },],
  },
  {
    slug: 'volvo', name: 'Volvo', nameSlug: 'volvo', priority: 'P2',
    system: 'Volvo VIDA / DICE / CEM',
    excerpt: 'Volvo sleutel programmering. V40, V60, XC60, XC90, S60. CEM module specialist.',
    models: [
      { slug: 'v40', name: 'V40', generations: 'Phase II', years: '2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019' },
      { slug: 'v60', name: 'V60', generations: 'Mk1, Mk2', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'xc40', name: 'XC40', generations: 'Mk1', years: '2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'xc60', name: 'XC60', generations: 'Mk1, Mk2', years: '2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'xc90', name: 'XC90', generations: 'Mk1, Mk2', years: '2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
    
      { slug: 's80l', name: 'S80L', years: '2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016' },],
  },
  {
    slug: 'toyota', name: 'Toyota', nameSlug: 'toyota', priority: 'P1',
    system: 'Smart Key / G chip',
    excerpt: 'Toyota sleutel programmering specialist.',
    models: [
      { slug: 'aygo', name: 'Aygo', years: '2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'yaris', name: 'Yaris', years: '1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'corolla', name: 'Corolla', years: '2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'c-hr', name: 'C-HR', years: '2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'rav4', name: 'RAV4', years: '2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'prius', name: 'Prius', years: '2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'camry', name: 'Camry', years: '2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
    
      { slug: 'sienna', name: 'Sienna', years: '1997, 1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021' },
      { slug: 'avensis-verso', name: 'Avensis Verso', years: '2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009' },],
  },
  {
    slug: 'ford', name: 'Ford', nameSlug: 'ford', priority: 'P1',
    system: 'Ford PATS / Passive Anti-Theft System',
    excerpt: 'Ford sleutel programmering specialist. Fiesta, Focus, Mondeo, Transit, Kuga. PATS systemen.',
    models: [
      { slug: 'fiesta', name: 'Fiesta', years: '2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'focus', name: 'Focus', years: '1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'transit', name: 'Transit', years: '2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'kuga', name: 'Kuga', years: '2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'puma', name: 'Puma', years: '2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'mondeo', name: 'Mondeo', years: '2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' },
      { slug: 'ecosport', name: 'EcoSport', years: '2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023' },
    ],
  },
  {
    slug: 'opel', name: 'Opel', nameSlug: 'opel', priority: 'P1',
    system: 'Opel Immobiliser I / II / III',
    excerpt: 'Opel sleutel programmering specialist. Corsa, Astra, Insignia, Vivaro. PIN-code extractie.',
    customSeoBlurb: 'Wij verzorgen regelmatig Opel Crossland autosleutel bijmaken en Opel Vivaro autosleutel bijmaken. De Opel Crossland (2017+) gebruikt het PSA-platform met PIN-code extractie. De Opel Vivaro is een populaire bestelwagen waarvoor wij de sleutel op locatie bijmaken. Autosleutel bijmaken Opel Corsa, Astra, Insignia en Mokka is ook ons standaard aanbod.',
    models: [
      { slug: 'corsa', name: 'Corsa', years: '2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'astra', name: 'Astra', years: '1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'vivaro', name: 'Vivaro', years: '2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'mokka', name: 'Mokka', years: '2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'insignia', name: 'Insignia', years: '2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023' },
      { slug: 'crossland', name: 'Crossland', years: '2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'zafira', name: 'Zafira', years: '1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'grandland', name: 'Grandland', years: '2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'combo', name: 'Combo', years: '2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'movano', name: 'Movano', years: '1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
    ],
  },
  {
    slug: 'renault', name: 'Renault', nameSlug: 'renault', priority: 'P2',
    system: 'Renault Card Key / UCH',
    excerpt: 'Renault kaart sleutel specialist. Clio, Captur, Megane, Scenic, Trafic. Kaart programmering.',
    customSeoBlurb: 'Een veelgevraagde dienst is de Renault Laguna autosleutel bijmaken. De Renault Laguna II en III (1994-2015) werkt met de bekende kaartsleutel en UCH-module. Wij lezen de pincode uit en programmeren direct een nieuwe kaartsleutel op locatie. Ook voor de Clio, Megane, Trafic en Captur kunt u bij ons terecht.',
    models: [
      { slug: 'clio', name: 'Clio', years: '1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'megane', name: 'Megane', years: '2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'trafic', name: 'Trafic', years: '2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'captur', name: 'Captur', years: '2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'kadjar', name: 'Kadjar', years: '2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' },
      { slug: 'twingo', name: 'Twingo', years: '2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'master', name: 'Master', years: '1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
    
      { slug: 'laguna', name: 'Laguna', years: '1994, 1995, 1996, 1997, 1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015' },],
  },
  {
    slug: 'peugeot', name: 'Peugeot', nameSlug: 'peugeot', priority: 'P2',
    system: 'PSA BSI / PIN extractie',
    excerpt: 'Peugeot sleutel programmering specialist. 208, 308, 508, Partner. BSI programmering.',
    customSeoBlurb: 'Wij verzorgen regelmatig Peugeot 607 sleutel bij laten maken, Peugeot 5008 autosleutel bijmaken, Peugeot 406 autosleutel bijmaken en Peugeot Expert sleutel bij laten maken. De Peugeot 607 (1999-2010) en 406 (1995-2004) zijn oudere modellen. De Peugeot 5008 en Expert gebruiken het BSI-systeem. Wij lezen de pin-code uit en programmeren de sleutel op uw locatie.',
    models: [
      { slug: '208', name: '208', years: '2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: '308', name: '308', years: '2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'partner', name: 'Partner', years: '1996, 1997, 1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: '3008', name: '3008', years: '2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: '2008', name: '2008', years: '2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: '5008', name: '5008', years: '2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: '107', name: '107', years: '2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014' },
      { slug: 'boxer', name: 'Boxer', years: '2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
    
      { slug: '406', name: '406', years: '1995, 1996, 1997, 1998, 1999, 2000, 2001, 2002, 2003, 2004' },
      { slug: 'expert', name: 'Expert', years: '1995, 1996, 1997, 1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: '607', name: '607', years: '1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010' },],
  },
  {
    slug: 'fiat', name: 'Fiat', nameSlug: 'fiat', priority: 'P2',
    system: 'Fiat Code 2 / Delphi / Marelli',
    excerpt: 'Fiat sleutel programmering specialist. 500, Punto, Ducato, Panda. Body computer specialist.',
    models: [
      { slug: '500', name: '500', years: '2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'panda', name: 'Panda', years: '2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'ducato', name: 'Ducato', years: '2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'tipo', name: 'Tipo', years: '2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: '500x', name: '500X', years: '2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
    ],
  },
  {
    slug: 'seat', name: 'Seat', nameSlug: 'seat', priority: 'P2',
    system: 'VAG Immobiliser / MQB',
    excerpt: 'Seat sleutel programmering specialist. Ibiza, Leon, Ateca. VAG Groep platform.',
    customSeoBlurb: 'Populaire aanvragen zijn Seat Alhambra sleutel bij laten maken en Seat Arosa sleutel bij laten maken. De Seat Alhambra (1996-2020) is een gezinsauto op het VAG-platform. De Seat Arosa (1997-2004) is een compacte auto waarvoor wij nog altijd sleutels bijmaken. Wij programmeren Ibiza, Leon, Arona, Ateca en Tarraco via OBD2.',
    models: [
      { slug: 'ibiza', name: 'Ibiza', years: '2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'leon', name: 'Leon', years: '2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'arona', name: 'Arona', years: '2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'ateca', name: 'Ateca', years: '2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'tarraco', name: 'Tarraco', years: '2018, 2019, 2020, 2021, 2022, 2023, 2024' },
    
      { slug: 'alhambra', name: 'Alhambra', years: '1996, 1997, 1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020' },
      { slug: 'arosa', name: 'Arosa', years: '1997, 1998, 1999, 2000, 2001, 2002, 2003, 2004' },],
  },
  {
    slug: 'skoda', name: 'Skoda', nameSlug: 'skoda', priority: 'P2',
    system: 'VAG Immobiliser / MQB / SFD',
    excerpt: 'Skoda sleutel programmering specialist. Octavia, Fabia, Superb. VAG Groep platform.',
    models: [
      { slug: 'fabia', name: 'Fabia', years: '2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'octavia', name: 'Octavia', years: '2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'superb', name: 'Superb', years: '2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'karoq', name: 'Karoq', years: '2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'kodiaq', name: 'Kodiaq', years: '2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'enyaq', name: 'Enyaq', years: '2020, 2021, 2022, 2023, 2024' },
      { slug: 'scala', name: 'Scala', years: '2019, 2020, 2021, 2022, 2023, 2024' },
    ],
  },
  {
    slug: 'mazda', name: 'Mazda', nameSlug: 'mazda', priority: 'P2',
    system: 'Mazda PATS / Mitsubishi System',
    excerpt: 'Mazda sleutel programmering specialist. Mazda 2, 3, 6, CX-5. Smart key specialist.',
    customSeoBlurb: 'Wij ontvangen veel aanvragen voor Mazda 3 autosleutel bij laten maken, Mazda CX-3 autosleutel bij laten maken en Mazda 2 autosleutel bij laten maken. De Mazda 3 is een van de populairste modellen in Nederland. De CX-3 en Mazda 2 gebruiken het PATS-systeem. Wij programmeren alle Mazda sleutels direct op locatie.',
    models: [
      { slug: 'mazda-3', name: '3', years: '2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'cx-5', name: 'CX-5', years: '2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'mazda-2', name: '2', years: '2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'cx-3', name: 'CX-3', years: '2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' },
      { slug: 'mx-5', name: 'MX-5', years: '2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
    
      { slug: 'cx-7', name: 'CX-7', years: '2006, 2007, 2008, 2009, 2010, 2011, 2012' },],
  },
  {
    slug: 'kia', name: 'Kia', nameSlug: 'kia', priority: 'P2',
    system: 'Hyundai/Kia Smart Key',
    excerpt: 'Kia sleutel programmering specialist. Picanto, Rio, Sportage, Niro. PIN-code specialist.',
    customSeoBlurb: 'Een autosleutel bijmaken Kia is een van onze specialiteiten. Wij kunnen snel en voordelig een kia autosleutel bijmaken voor alle modellen, direct op locatie. Bijvoorbeeld een kia picanto autosleutel bijmaken of een kia rio autosleutel bijmaken doen wij dagelijks. Zoekt u specifiek naar autosleutel bijmaken kia rio of kia cee\'d autosleutel bijmaken (ook wel kia ceed autosleutel bijmaken)? Onze monteurs helpen u snel, ook voor een kia autosleutel bijmaken nijmegen en omstreken. Naast de bekende modellen, programmeren wij ook de rest van de vloot. Denk hierbij aan een kia sportage autosleutel bijmaken, kia sorento autosleutel bijmaken, kia optima autosleutel bijmaken, en kia soul autosleutel bijmaken. Ook voor de ruimere modellen zoals een kia carens autosleutel bijmaken, kia carnival autosleutel bijmaken en kia sedona autosleutel bijmaken hebben wij de juiste chips op voorraad. Heeft u een zeldzamer of ouder model? Geen zorgen, ook een kia amanti autosleutel bijmaken, kia clarence autosleutel bijmaken, kia forte autosleutel bijmaken, of kia pride autosleutel bijmaken is voor ons geen probleem. Klanten vragen ons vaak naar de kosten autosleutel bijmaken kia. Omdat wij op locatie werken, is de autosleutel bijmaken prijs kia bij ons vrijwel altijd voordeliger dan bij de merkdealer. Wilt u veilig een autosleutel kia bijmaken? Neem direct contact op voor een exacte prijsopgave.',
    models: [
      { slug: 'picanto', name: 'Picanto', years: '2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'niro', name: 'Niro', years: '2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'sportage', name: 'Sportage', years: '2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'ceed', name: 'Ceed', years: '2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'rio', name: 'Rio', years: '2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023' },
      { slug: 'stonic', name: 'Stonic', years: '2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
    ],
  },
  {
    slug: 'hyundai', name: 'Hyundai', nameSlug: 'hyundai', priority: 'P2',
    system: 'Hyundai/Kia Smart Key',
    excerpt: 'Hyundai sleutel programmering specialist. i10, i20, i30, Tucson, Kona.',
    customSeoBlurb: 'Veelgevraagd zijn: Hyundai Santamo autosleutel bij laten maken, Hyundai Getz autosleutel bijmaken, Hyundai Atos Prime autosleutel bij laten maken en Hyundai Excel sleutel bijmaken. De Santamo (1996-2003) en Excel (1985-1999) zijn oudere modellen waarvoor wij nog sleutels maken. De Getz en Atos Prime programmeren wij dagelijks. Ook voor de i10, i20, i30, Tucson en Kona kunt u bij ons terecht.',
    models: [
      { slug: 'i10', name: 'i10', years: '2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'tucson', name: 'Tucson', years: '2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'i20', name: 'i20', years: '2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'kona', name: 'Kona', years: '2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'i30', name: 'i30', years: '2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'ioniq', name: 'Ioniq', years: '2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
    
      { slug: 'atos-prime', name: 'Atos Prime', years: '1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008' },
      { slug: 'getz', name: 'Getz', years: '2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011' },
      { slug: 'santamo', name: 'Santamo', years: '1996, 1997, 1998, 1999, 2000, 2001, 2002, 2003' },
      { slug: 'excel', name: 'Excel', years: '1985, 1986, 1987, 1988, 1989, 1990, 1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999' },],
  },
  {
    slug: 'nissan', name: 'Nissan', nameSlug: 'nissan', priority: 'P2',
    system: 'Nissan NATS / BCM',
    excerpt: 'Nissan sleutel programmering specialist. Micra, Qashqai, Juke, Leaf.',
    customSeoBlurb: 'Wij verzorgen dagelijks Nissan Primastar autosleutel bijmaken, Nissan Qashqai autosleutel bij laten maken, Nissan Juke autosleutel bij laten maken, Nissan sleutel bijmaken, Nissan 350Z autosleutel bij laten maken, Nissan Maxima autosleutel bijmaken en Nissan Sentra autosleutel bij laten maken. De Nissan Primastar (2001-2014) deelt het Renault Trafic-platform. De 350Z, Maxima en Sentra hebben NATS-beveiliging. Wij programmeren ook sleutel met transponder direct op locatie.',
    models: [
      { slug: 'micra', name: 'Micra', years: '2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'qashqai', name: 'Qashqai', years: '2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'juke', name: 'Juke', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'x-trail', name: 'X-Trail', years: '2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'leaf', name: 'Leaf', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
    
      { slug: 'maxima', name: 'Maxima', years: '2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014' },
      { slug: 'sentra', name: 'Sentra', years: '2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012' },
      { slug: '350z', name: '350Z', years: '2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009' },
      { slug: 'primastar', name: 'Primastar', years: '2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014' },],
  },
  {
    slug: 'honda', name: 'Honda', nameSlug: 'honda', priority: 'P2',
    system: 'Honda Immobiliser System',
    excerpt: 'Honda sleutel programmering specialist. Civic, Jazz, CR-V.',
    models: [
      { slug: 'civic', name: 'Civic', years: '2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'jazz', name: 'Jazz', years: '2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'cr-v', name: 'CR-V', years: '2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'hr-v', name: 'HR-V', years: '1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
    ],
  },
  {
    slug: 'land-rover', name: 'Land Rover', nameSlug: 'land-rover', priority: 'P3',
    system: 'JLR KVM / RFA / BCM',
    excerpt: 'Land Rover sleutel specialist. Range Rover, Discovery, Evoque. KVM module specialist.',
    customSeoBlurb: 'Wij ontvangen regelmatig aanvragen voor Land Rover Freelander sleutel bijmaken en Range Rover Sport autosleutel bij laten maken. De Freelander (1997-2014) heeft een KVM-systeem dat directe OBD-programmering vereist. De Range Rover Sport (2005+) gebruikt een modern RFA-module systeem. Wij werken met JLR-software voor alle Land Rover modellen.',
    models: [
      { slug: 'range-rover', name: 'Range Rover', years: '2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'evoque', name: 'Evoque', years: '2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'discovery', name: 'Discovery', years: '2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'defender', name: 'Defender', years: '1990, 1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
    
      { slug: 'freelander', name: 'Freelander', years: '1997, 1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014' },
      { slug: 'range-rover-sport', name: 'Range Rover Sport', years: '2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },],
  },
  {
    slug: 'porsche', name: 'Porsche', nameSlug: 'porsche', priority: 'P3',
    system: 'Porsche KESSY / BCM',
    excerpt: 'Porsche sleutel specialist. 911, Cayenne, Macan, Panamera.',
    models: [
      { slug: '911', name: '911', years: '1997, 1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'cayenne', name: 'Cayenne', years: '2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'macan', name: 'Macan', years: '2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'panamera', name: 'Panamera', years: '2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'taycan', name: 'Taycan', years: '2019, 2020, 2021, 2022, 2023, 2024' },
    ],
  },
  {
    slug: 'tesla', name: 'Tesla', nameSlug: 'tesla', priority: 'P3',
    system: 'Tesla Key Card / NFC',
    excerpt: 'Tesla sleutel kaart & fob specialist. Model 3, Y, S, X.',
    models: [
      { slug: 'model-3', name: 'Model 3', years: '2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'model-y', name: 'Model Y', years: '2020, 2021, 2022, 2023, 2024' },
    ],
  },
  {
    slug: 'lexus', name: 'Lexus', nameSlug: 'lexus', priority: 'P2',
    system: 'Toyota/Lexus Smart Key',
    excerpt: 'Lexus sleutel specialist. RX, NX, IS, ES.',
    models: [
      { slug: 'rx', name: 'RX', years: '2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
    ],
  },
  {
    slug: 'mini', name: 'Mini', nameSlug: 'mini', priority: 'P2',
    system: 'BMW CAS / FEM',
    excerpt: 'Mini sleutel specialist. Cooper, One, Countryman.',
    models: [
      { slug: 'cooper', name: 'Cooper', years: '2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
    ],
  },
  {
    slug: 'citroen', name: 'Citroën', nameSlug: 'citroen', priority: 'P2',
    system: 'PSA BSI / CAN Bus',
    excerpt: 'Citroën sleutel specialist. C1, C3, C4, Berlingo.',
    models: [
      { slug: 'c3', name: 'C3', years: '2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'berlingo', name: 'Berlingo', years: '1996, 1997, 1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'c4', name: 'C4', years: '2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'c1', name: 'C1', years: '2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021' },
      { slug: 'c5-aircross', name: 'C5 Aircross', years: '2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'jumper', name: 'Jumper', years: '2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
    ],
  },
  {
    slug: 'alfa-romeo', name: 'Alfa Romeo', nameSlug: 'alfa-romeo', priority: 'P3',
    system: 'Marelli / CODE / RFHUB',
    excerpt: 'Alfa Romeo autosleutel programmering op locatie. Giulia, Stelvio, Giulietta, MiTo.',
    customSeoBlurb: 'Heeft u een nieuwe Alfa Romeo autosleutel nodig? Wij maken direct ter plaatse een nieuwe sleutel of smart key voor uw Alfa Romeo. Of u nu al uw sleutels kwijt bent of gewoon een reservesleutel zoekt voor uw Giulia; wij bieden dealer-kwaliteit voor een lagere prijs.',
    models: [
      { slug: 'giulia', name: 'Giulia', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' },
      { slug: 'stelvio', name: 'Stelvio', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' },
      { slug: 'giulietta', name: 'Giulietta', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' },
      { slug: 'mito', name: 'MiTo', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' }
    ],
  },
  {
    slug: 'buick', name: 'Buick', nameSlug: 'buick', priority: 'P3',
    system: 'GM PASS-Key / PK3 / Global A',
    excerpt: 'Buick autosleutel programmering op locatie. Encore, Envision, Regal.',
    customSeoBlurb: 'Heeft u een nieuwe Buick autosleutel nodig? Wij maken direct ter plaatse een nieuwe sleutel of smart key voor uw Buick. Of u nu al uw sleutels kwijt bent of gewoon een reservesleutel zoekt voor uw Encore; wij bieden dealer-kwaliteit voor een lagere prijs.',
    models: [
      { slug: 'encore', name: 'Encore', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' },
      { slug: 'envision', name: 'Envision', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' },
      { slug: 'regal', name: 'Regal', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' }
    ],
  },
  {
    slug: 'cadillac', name: 'Cadillac', nameSlug: 'cadillac', priority: 'P3',
    system: 'GM Global A / Global B / PK3',
    excerpt: 'Cadillac autosleutel programmering op locatie. Escalade, CTS, XT5, ATS.',
    customSeoBlurb: 'Heeft u een nieuwe Cadillac autosleutel nodig? Wij maken direct ter plaatse een nieuwe sleutel of smart key voor uw Cadillac. Of u nu al uw sleutels kwijt bent of gewoon een reservesleutel zoekt voor uw Escalade; wij bieden dealer-kwaliteit voor een lagere prijs.',
    models: [
      { slug: 'escalade', name: 'Escalade', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' },
      { slug: 'cts', name: 'CTS', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' },
      { slug: 'xt5', name: 'XT5', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' },
      { slug: 'ats', name: 'ATS', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' }
    ],
  },
  {
    slug: 'chery', name: 'Chery', nameSlug: 'chery', priority: 'P3',
    system: 'Chery Immo / Smart Key',
    excerpt: 'Chery autosleutel programmering op locatie. Tiggo, QQ, Arrizo.',
    customSeoBlurb: 'Heeft u een nieuwe Chery autosleutel nodig? Wij maken direct ter plaatse een nieuwe sleutel of smart key voor uw Chery. Of u nu al uw sleutels kwijt bent of gewoon een reservesleutel zoekt voor uw Tiggo; wij bieden dealer-kwaliteit voor een lagere prijs.',
    models: [
      { slug: 'tiggo', name: 'Tiggo', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' },
      { slug: 'qq', name: 'QQ', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' },
      { slug: 'arrizo', name: 'Arrizo', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' }
    ],
  },
  {
    slug: 'chevrolet', name: 'Chevrolet', nameSlug: 'chevrolet', priority: 'P3',
    system: 'GM Global A / Global B',
    excerpt: 'Chevrolet autosleutel programmering op locatie. Spark, Matiz, Captiva, Cruze, Corvette.',
    customSeoBlurb: 'Heeft u een nieuwe Chevrolet autosleutel nodig? Wij maken direct ter plaatse een nieuwe sleutel of smart key voor uw Chevrolet. Of u nu al uw sleutels kwijt bent of gewoon een reservesleutel zoekt voor uw Spark; wij bieden dealer-kwaliteit voor een lagere prijs.',
    models: [
      { slug: 'spark', name: 'Spark', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' },
      { slug: 'matiz', name: 'Matiz', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' },
      { slug: 'captiva', name: 'Captiva', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' },
      { slug: 'cruze', name: 'Cruze', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' },
      { slug: 'corvette', name: 'Corvette', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' }
    ],
  },
  {
    slug: 'chrysler', name: 'Chrysler', nameSlug: 'chrysler', priority: 'P3',
    system: 'FOBIK / SKIM / SKREEM',
    excerpt: 'Chrysler autosleutel programmering op locatie. 300C, Voyager, PT Cruiser.',
    customSeoBlurb: 'Heeft u een nieuwe Chrysler autosleutel nodig? Wij maken direct ter plaatse een nieuwe sleutel of smart key voor uw Chrysler. Of u nu al uw sleutels kwijt bent of gewoon een reservesleutel zoekt voor uw 300C; wij bieden dealer-kwaliteit voor een lagere prijs.',
    models: [
      { slug: '300c', name: '300C', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' },
      { slug: 'voyager', name: 'Voyager', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' },
      { slug: 'pt-cruiser', name: 'PT Cruiser', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' }
    ],
  },
  {
    slug: 'cobra', name: 'Cobra', nameSlug: 'cobra', priority: 'P3',
    system: 'Aftermarket Immo / Basic',
    excerpt: 'Cobra autosleutel programmering op locatie. AC Cobra.',
    customSeoBlurb: 'Heeft u een nieuwe Cobra autosleutel nodig? Wij maken direct ter plaatse een nieuwe sleutel of smart key voor uw Cobra. Of u nu al uw sleutels kwijt bent of gewoon een reservesleutel zoekt voor uw AC Cobra; wij bieden dealer-kwaliteit voor een lagere prijs.',
    models: [
      { slug: 'ac-cobra', name: 'AC Cobra', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' }
    ],
  },
  {
    slug: 'dacia', name: 'Dacia', nameSlug: 'dacia', priority: 'P3',
    system: 'Renault UCH / HFM',
    excerpt: 'Dacia autosleutel programmering op locatie. Duster, Sandero, Logan, Spring.',
    customSeoBlurb: 'Heeft u een nieuwe Dacia autosleutel nodig? Wij maken direct ter plaatse een nieuwe sleutel of smart key voor uw Dacia. Of u nu al uw sleutels kwijt bent of gewoon een reservesleutel zoekt voor uw Duster; wij bieden dealer-kwaliteit voor een lagere prijs.',
    models: [
      { slug: 'duster', name: 'Duster', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' },
      { slug: 'sandero', name: 'Sandero', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' },
      { slug: 'logan', name: 'Logan', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' },
      { slug: 'spring', name: 'Spring', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' }
    ],
  },
  {
    slug: 'daewoo', name: 'Daewoo', nameSlug: 'daewoo', priority: 'P3',
    system: 'GM / Megamos',
    excerpt: 'Daewoo autosleutel programmering op locatie. Matiz, Kalos, Lanos.',
    customSeoBlurb: 'Heeft u een nieuwe Daewoo autosleutel nodig? Wij maken direct ter plaatse een nieuwe sleutel of smart key voor uw Daewoo. Of u nu al uw sleutels kwijt bent of gewoon een reservesleutel zoekt voor uw Matiz; wij bieden dealer-kwaliteit voor een lagere prijs.',
    models: [
      { slug: 'matiz', name: 'Matiz', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' },
      { slug: 'kalos', name: 'Kalos', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' },
      { slug: 'lanos', name: 'Lanos', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' }
    ],
  },
  {
    slug: 'daf', name: 'DAF', nameSlug: 'daf', priority: 'P3',
    system: 'DAF Immo (Truck)',
    excerpt: 'DAF autosleutel programmering op locatie. XF, CF, LF.',
    customSeoBlurb: 'Heeft u een nieuwe DAF autosleutel nodig? Wij maken direct ter plaatse een nieuwe sleutel of smart key voor uw DAF. Of u nu al uw sleutels kwijt bent of gewoon een reservesleutel zoekt voor uw XF; wij bieden dealer-kwaliteit voor een lagere prijs.',
    models: [
      { slug: 'xf', name: 'XF', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' },
      { slug: 'cf', name: 'CF', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' },
      { slug: 'lf', name: 'LF', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' }
    ],
  },
  {
    slug: 'daihatsu', name: 'Daihatsu', nameSlug: 'daihatsu', priority: 'P3',
    system: 'Toyota Immo / 4C / 4D',
    excerpt: 'Daihatsu autosleutel programmering op locatie. Cuore, Sirion, Terios.',
    customSeoBlurb: 'Heeft u een nieuwe Daihatsu autosleutel nodig? Wij maken direct ter plaatse een nieuwe sleutel of smart key voor uw Daihatsu. Of u nu al uw sleutels kwijt bent of gewoon een reservesleutel zoekt voor uw Cuore; wij bieden dealer-kwaliteit voor een lagere prijs.',
    models: [
      { slug: 'cuore', name: 'Cuore', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' },
      { slug: 'sirion', name: 'Sirion', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' },
      { slug: 'terios', name: 'Terios', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' }
    ],
  },
  {
    slug: 'dodge', name: 'Dodge', nameSlug: 'dodge', priority: 'P3',
    system: 'FOBIK / RFHUB',
    excerpt: 'Dodge autosleutel programmering op locatie. RAM, Challenger, Charger, Caliber.',
    customSeoBlurb: 'Heeft u een nieuwe Dodge autosleutel nodig? Wij maken direct ter plaatse een nieuwe sleutel of smart key voor uw Dodge. Of u nu al uw sleutels kwijt bent of gewoon een reservesleutel zoekt voor uw RAM; wij bieden dealer-kwaliteit voor een lagere prijs.',
    models: [
      { slug: 'ram', name: 'RAM', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' },
      { slug: 'challenger', name: 'Challenger', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' },
      { slug: 'charger', name: 'Charger', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' },
      { slug: 'caliber', name: 'Caliber', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' }
    ],
  },
  {
    slug: 'ferrari', name: 'Ferrari', nameSlug: 'ferrari', priority: 'P3',
    system: 'Marelli / CODE / Keyless',
    excerpt: 'Ferrari autosleutel programmering op locatie. 458, 488, California, F430.',
    customSeoBlurb: 'Heeft u een nieuwe Ferrari autosleutel nodig? Wij maken direct ter plaatse een nieuwe sleutel of smart key voor uw Ferrari. Of u nu al uw sleutels kwijt bent of gewoon een reservesleutel zoekt voor uw 458; wij bieden dealer-kwaliteit voor een lagere prijs.',
    models: [
      { slug: '458', name: '458', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' },
      { slug: '488', name: '488', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' },
      { slug: 'california', name: 'California', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' },
      { slug: 'f430', name: 'F430', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' }
    ],
  },
  {
    slug: 'holden', name: 'Holden', nameSlug: 'holden', priority: 'P3',
    system: 'GM Global A',
    excerpt: 'Holden autosleutel programmering op locatie. Commodore, Colorado.',
    customSeoBlurb: 'Heeft u een nieuwe Holden autosleutel nodig? Wij maken direct ter plaatse een nieuwe sleutel of smart key voor uw Holden. Of u nu al uw sleutels kwijt bent of gewoon een reservesleutel zoekt voor uw Commodore; wij bieden dealer-kwaliteit voor een lagere prijs.',
    models: [
      { slug: 'commodore', name: 'Commodore', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' },
      { slug: 'colorado', name: 'Colorado', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' }
    ],
  },
  {
    slug: 'infiniti', name: 'Infiniti', nameSlug: 'infiniti', priority: 'P3',
    system: 'Nissan NATS / BCM',
    excerpt: 'Infiniti autosleutel programmering op locatie. Q50, Q30, FX35.',
    customSeoBlurb: 'Heeft u een nieuwe Infiniti autosleutel nodig? Wij maken direct ter plaatse een nieuwe sleutel of smart key voor uw Infiniti. Of u nu al uw sleutels kwijt bent of gewoon een reservesleutel zoekt voor uw Q50; wij bieden dealer-kwaliteit voor een lagere prijs.',
    models: [
      { slug: 'q50', name: 'Q50', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' },
      { slug: 'q30', name: 'Q30', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' },
      { slug: 'fx35', name: 'FX35', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' }
    ],
  },
  {
    slug: 'isuzu', name: 'Isuzu', nameSlug: 'isuzu', priority: 'P3',
    system: 'Isuzu Immo / GM',
    excerpt: 'Isuzu autosleutel programmering op locatie. D-Max, N-Series.',
    customSeoBlurb: 'Heeft u een nieuwe Isuzu autosleutel nodig? Wij maken direct ter plaatse een nieuwe sleutel of smart key voor uw Isuzu. Of u nu al uw sleutels kwijt bent of gewoon een reservesleutel zoekt voor uw D-Max; wij bieden dealer-kwaliteit voor een lagere prijs.',
    models: [
      { slug: 'd-max', name: 'D-Max', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' },
      { slug: 'n-series', name: 'N-Series', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' }
    ],
  },
  {
    slug: 'iveco', name: 'Iveco', nameSlug: 'iveco', priority: 'P3',
    system: 'Fiat CODE / BSI',
    excerpt: 'Iveco autosleutel programmering op locatie. Daily, Eurocargo.',
    customSeoBlurb: 'Heeft u een nieuwe Iveco autosleutel nodig? Wij maken direct ter plaatse een nieuwe sleutel of smart key voor uw Iveco. Of u nu al uw sleutels kwijt bent of gewoon een reservesleutel zoekt voor uw Daily; wij bieden dealer-kwaliteit voor een lagere prijs.',
    models: [
      { slug: 'daily', name: 'Daily', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' },
      { slug: 'eurocargo', name: 'Eurocargo', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' }
    ],
  },
  {
    slug: 'jaguar', name: 'Jaguar', nameSlug: 'jaguar', priority: 'P3',
    system: 'KVM / BCM / JLR',
    excerpt: 'Jaguar autosleutel programmering op locatie. F-Type, XF, XE, F-Pace.',
    customSeoBlurb: 'Heeft u een nieuwe Jaguar autosleutel nodig? Wij maken direct ter plaatse een nieuwe sleutel of smart key voor uw Jaguar. Of u nu al uw sleutels kwijt bent of gewoon een reservesleutel zoekt voor uw F-Type; wij bieden dealer-kwaliteit voor een lagere prijs.',
    models: [
      { slug: 'f-type', name: 'F-Type', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' },
      { slug: 'xf', name: 'XF', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' },
      { slug: 'xe', name: 'XE', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' },
      { slug: 'f-pace', name: 'F-Pace', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' }
    ],
  },
  {
    slug: 'lada', name: 'Lada', nameSlug: 'lada', priority: 'P3',
    system: 'Renault UCH / Basic',
    excerpt: 'Lada autosleutel programmering op locatie. Niva, Vesta.',
    customSeoBlurb: 'Heeft u een nieuwe Lada autosleutel nodig? Wij maken direct ter plaatse een nieuwe sleutel of smart key voor uw Lada. Of u nu al uw sleutels kwijt bent of gewoon een reservesleutel zoekt voor uw Niva; wij bieden dealer-kwaliteit voor een lagere prijs.',
    models: [
      { slug: 'niva', name: 'Niva', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' },
      { slug: 'vesta', name: 'Vesta', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' }
    ],
  },
  {
    slug: 'lancia', name: 'Lancia', nameSlug: 'lancia', priority: 'P3',
    system: 'Fiat CODE / BSI',
    excerpt: 'Lancia autosleutel programmering op locatie. Ypsilon, Delta.',
    customSeoBlurb: 'Heeft u een nieuwe Lancia autosleutel nodig? Wij maken direct ter plaatse een nieuwe sleutel of smart key voor uw Lancia. Of u nu al uw sleutels kwijt bent of gewoon een reservesleutel zoekt voor uw Ypsilon; wij bieden dealer-kwaliteit voor een lagere prijs.',
    models: [
      { slug: 'ypsilon', name: 'Ypsilon', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' },
      { slug: 'delta', name: 'Delta', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' }
    ],
  },
  {
    slug: 'lexus', name: 'Lexus', nameSlug: 'lexus', priority: 'P3',
    system: 'Toyota Smart Key / Immo',
    excerpt: 'Lexus autosleutel programmering op locatie. CT200h, RX, IS, NX.',
    customSeoBlurb: 'Heeft u een nieuwe Lexus autosleutel nodig? Wij maken direct ter plaatse een nieuwe sleutel of smart key voor uw Lexus. Of u nu al uw sleutels kwijt bent of gewoon een reservesleutel zoekt voor uw CT200h; wij bieden dealer-kwaliteit voor een lagere prijs.',
    models: [
      { slug: 'ct200h', name: 'CT200h', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' },
      { slug: 'rx', name: 'RX', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' },
      { slug: 'is', name: 'IS', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' },
      { slug: 'nx', name: 'NX', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' }
    ],
  },
  {
    slug: 'lincoln', name: 'Lincoln', nameSlug: 'lincoln', priority: 'P3',
    system: 'Ford PATS / BCM',
    excerpt: 'Lincoln autosleutel programmering op locatie. Navigator, Aviator, MKX.',
    customSeoBlurb: 'Heeft u een nieuwe Lincoln autosleutel nodig? Wij maken direct ter plaatse een nieuwe sleutel of smart key voor uw Lincoln. Of u nu al uw sleutels kwijt bent of gewoon een reservesleutel zoekt voor uw Navigator; wij bieden dealer-kwaliteit voor een lagere prijs.',
    models: [
      { slug: 'navigator', name: 'Navigator', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' },
      { slug: 'aviator', name: 'Aviator', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' },
      { slug: 'mkx', name: 'MKX', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' }
    ],
  },
  {
    slug: 'maserati', name: 'Maserati', nameSlug: 'maserati', priority: 'P3',
    system: 'Marelli / RFHUB',
    excerpt: 'Maserati autosleutel programmering op locatie. Ghibli, Levante, Quattroporte.',
    customSeoBlurb: 'Heeft u een nieuwe Maserati autosleutel nodig? Wij maken direct ter plaatse een nieuwe sleutel of smart key voor uw Maserati. Of u nu al uw sleutels kwijt bent of gewoon een reservesleutel zoekt voor uw Ghibli; wij bieden dealer-kwaliteit voor een lagere prijs.',
    models: [
      { slug: 'ghibli', name: 'Ghibli', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' },
      { slug: 'levante', name: 'Levante', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' },
      { slug: 'quattroporte', name: 'Quattroporte', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' }
    ],
  },
  {
    slug: 'mclaren', name: 'McLaren', nameSlug: 'mclaren', priority: 'P3',
    system: 'McLaren Smart Key',
    excerpt: 'McLaren autosleutel programmering op locatie. 570S, 720S, MP4-12C.',
    customSeoBlurb: 'Heeft u een nieuwe McLaren autosleutel nodig? Wij maken direct ter plaatse een nieuwe sleutel of smart key voor uw McLaren. Of u nu al uw sleutels kwijt bent of gewoon een reservesleutel zoekt voor uw 570S; wij bieden dealer-kwaliteit voor een lagere prijs.',
    models: [
      { slug: '570s', name: '570S', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' },
      { slug: '720s', name: '720S', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' },
      { slug: 'mp4-12c', name: 'MP4-12C', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' }
    ],
  },
  {
    slug: 'mitsubishi', name: 'Mitsubishi', nameSlug: 'mitsubishi', priority: 'P3',
    system: 'ETACS / KOS',
    excerpt: 'Mitsubishi autosleutel programmering op locatie. Outlander, Space Star, Colt, ASX.',
    customSeoBlurb: 'Heeft u een nieuwe Mitsubishi autosleutel nodig? Wij maken direct ter plaatse een nieuwe sleutel of smart key voor uw Mitsubishi. Of u nu al uw sleutels kwijt bent of gewoon een reservesleutel zoekt voor uw Outlander; wij bieden dealer-kwaliteit voor een lagere prijs.',
    models: [
      { slug: 'outlander', name: 'Outlander', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' },
      { slug: 'space-star', name: 'Space Star', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' },
      { slug: 'colt', name: 'Colt', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' },
      { slug: 'asx', name: 'ASX', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' }
    ],
  },
  {
    slug: 'oldsmobile', name: 'Oldsmobile', nameSlug: 'oldsmobile', priority: 'P3',
    system: 'GM PASS-Key',
    excerpt: 'Oldsmobile autosleutel programmering op locatie. Aurora, Alero.',
    customSeoBlurb: 'Heeft u een nieuwe Oldsmobile autosleutel nodig? Wij maken direct ter plaatse een nieuwe sleutel of smart key voor uw Oldsmobile. Of u nu al uw sleutels kwijt bent of gewoon een reservesleutel zoekt voor uw Aurora; wij bieden dealer-kwaliteit voor een lagere prijs.',
    models: [
      { slug: 'aurora', name: 'Aurora', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' },
      { slug: 'alero', name: 'Alero', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' }
    ],
  },
  {
    slug: 'proton', name: 'Proton', nameSlug: 'proton', priority: 'P3',
    system: 'Bosch / Megamos',
    excerpt: 'Proton autosleutel programmering op locatie. Wira, Gen-2.',
    customSeoBlurb: 'Heeft u een nieuwe Proton autosleutel nodig? Wij maken direct ter plaatse een nieuwe sleutel of smart key voor uw Proton. Of u nu al uw sleutels kwijt bent of gewoon een reservesleutel zoekt voor uw Wira; wij bieden dealer-kwaliteit voor een lagere prijs.',
    models: [
      { slug: 'wira', name: 'Wira', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' },
      { slug: 'gen-2', name: 'Gen-2', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' }
    ],
  },
  {
    slug: 'rolls-royce', name: 'Rolls Royce', nameSlug: 'rolls-royce', priority: 'P3',
    system: 'BMW CAS / FEM / BDC',
    excerpt: 'Rolls Royce autosleutel programmering op locatie. Phantom, Ghost, Cullinan.',
    customSeoBlurb: 'Heeft u een nieuwe Rolls Royce autosleutel nodig? Wij maken direct ter plaatse een nieuwe sleutel of smart key voor uw Rolls Royce. Of u nu al uw sleutels kwijt bent of gewoon een reservesleutel zoekt voor uw Phantom; wij bieden dealer-kwaliteit voor een lagere prijs.',
    models: [
      { slug: 'phantom', name: 'Phantom', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' },
      { slug: 'ghost', name: 'Ghost', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' },
      { slug: 'cullinan', name: 'Cullinan', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' }
    ],
  },
  {
    slug: 'rover', name: 'Rover', nameSlug: 'rover', priority: 'P3',
    system: 'Lucas / Pektron',
    excerpt: 'Rover autosleutel programmering op locatie. 75, 45, 25.',
    customSeoBlurb: 'Heeft u een nieuwe Rover autosleutel nodig? Wij maken direct ter plaatse een nieuwe sleutel of smart key voor uw Rover. Of u nu al uw sleutels kwijt bent of gewoon een reservesleutel zoekt voor uw 75; wij bieden dealer-kwaliteit voor een lagere prijs.',
    models: [
      { slug: '75', name: '75', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' },
      { slug: '45', name: '45', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' },
      { slug: '25', name: '25', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' }
    ],
  },
  {
    slug: 'saab', name: 'Saab', nameSlug: 'saab', priority: 'P3',
    system: 'CIM / TWICE',
    excerpt: 'Saab autosleutel programmering op locatie. 9-3, 9-5.',
    customSeoBlurb: 'Heeft u een nieuwe Saab autosleutel nodig? Wij maken direct ter plaatse een nieuwe sleutel of smart key voor uw Saab. Of u nu al uw sleutels kwijt bent of gewoon een reservesleutel zoekt voor uw 9-3; wij bieden dealer-kwaliteit voor een lagere prijs.',
    models: [
      { slug: '9-3', name: '9-3', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' },
      { slug: '9-5', name: '9-5', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' }
    ],
  },
  {
    slug: 'smart', name: 'Smart', nameSlug: 'smart', priority: 'P3',
    system: 'SAM / DAS',
    excerpt: 'Smart autosleutel programmering op locatie. Fortwo, Forfour.',
    customSeoBlurb: 'Heeft u een nieuwe Smart autosleutel nodig? Wij maken direct ter plaatse een nieuwe sleutel of smart key voor uw Smart. Of u nu al uw sleutels kwijt bent of gewoon een reservesleutel zoekt voor uw Fortwo; wij bieden dealer-kwaliteit voor een lagere prijs.',
    models: [
      { slug: 'fortwo', name: 'Fortwo', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' },
      { slug: 'forfour', name: 'Forfour', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' }
    ],
  },
  {
    slug: 'ssangyong', name: 'SsangYong', nameSlug: 'ssangyong', priority: 'P3',
    system: 'Delphi / REKES',
    excerpt: 'SsangYong autosleutel programmering op locatie. Rexton, Korando, Tivoli.',
    customSeoBlurb: 'Heeft u een nieuwe SsangYong autosleutel nodig? Wij maken direct ter plaatse een nieuwe sleutel of smart key voor uw SsangYong. Of u nu al uw sleutels kwijt bent of gewoon een reservesleutel zoekt voor uw Rexton; wij bieden dealer-kwaliteit voor een lagere prijs.',
    models: [
      { slug: 'rexton', name: 'Rexton', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' },
      { slug: 'korando', name: 'Korando', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' },
      { slug: 'tivoli', name: 'Tivoli', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' }
    ],
  },
  {
    slug: 'subaru', name: 'Subaru', nameSlug: 'subaru', priority: 'P3',
    system: 'Subaru Smart Key / Immo',
    excerpt: 'Subaru autosleutel programmering op locatie. Impreza, Forester, Outback.',
    customSeoBlurb: 'Heeft u een nieuwe Subaru autosleutel nodig? Wij maken direct ter plaatse een nieuwe sleutel of smart key voor uw Subaru. Of u nu al uw sleutels kwijt bent of gewoon een reservesleutel zoekt voor uw Impreza; wij bieden dealer-kwaliteit voor een lagere prijs.',
    models: [
      { slug: 'impreza', name: 'Impreza', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' },
      { slug: 'forester', name: 'Forester', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' },
      { slug: 'outback', name: 'Outback', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' }
    ],
  },
  {
    slug: 'suzuki', name: 'Suzuki', nameSlug: 'suzuki', priority: 'P3',
    system: 'Suzuki Immo / Keyless',
    excerpt: 'Suzuki autosleutel programmering op locatie. Swift, Alto, Vitara, Ignis.',
    customSeoBlurb: 'Heeft u een nieuwe Suzuki autosleutel nodig? Wij maken direct ter plaatse een nieuwe sleutel of smart key voor uw Suzuki. Of u nu al uw sleutels kwijt bent of gewoon een reservesleutel zoekt voor uw Swift; wij bieden dealer-kwaliteit voor een lagere prijs.',
    models: [
      { slug: 'swift', name: 'Swift', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' },
      { slug: 'alto', name: 'Alto', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' },
      { slug: 'vitara', name: 'Vitara', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' },
      { slug: 'ignis', name: 'Ignis', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' }
    ],
  },
  {
    slug: 'tesla', name: 'Tesla', nameSlug: 'tesla', priority: 'P3',
    system: 'NFC / BLE / RFID',
    excerpt: 'Tesla autosleutel programmering op locatie. Model S, Model 3, Model X, Model Y.',
    customSeoBlurb: 'Heeft u een nieuwe Tesla autosleutel nodig? Wij maken direct ter plaatse een nieuwe sleutel of smart key voor uw Tesla. Of u nu al uw sleutels kwijt bent of gewoon een reservesleutel zoekt voor uw Model S; wij bieden dealer-kwaliteit voor een lagere prijs.',
    models: [
      { slug: 'model-s', name: 'Model S', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' },
      { slug: 'model-3', name: 'Model 3', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' },
      { slug: 'model-x', name: 'Model X', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' },
      { slug: 'model-y', name: 'Model Y', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' }
    ],
  },
  {
    slug: 'gmc', name: 'GMC', nameSlug: 'gmc', priority: 'P3',
    system: 'GM Global A / PK3',
    excerpt: 'GMC autosleutel programmering op locatie. Sierra, Yukon, Acadia.',
    customSeoBlurb: 'Heeft u een nieuwe GMC autosleutel nodig? Wij maken direct ter plaatse een nieuwe sleutel of smart key voor uw GMC. Of u nu al uw sleutels kwijt bent of gewoon een reservesleutel zoekt voor uw Sierra; wij bieden dealer-kwaliteit voor een lagere prijs.',
    models: [
      { slug: 'sierra', name: 'Sierra', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' },
      { slug: 'yukon', name: 'Yukon', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' },
      { slug: 'acadia', name: 'Acadia', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' }
    ],
  }
,
  {
    slug: 'bentley', name: 'Bentley', nameSlug: 'bentley', priority: 'P3',
    system: 'VW Group / KESSY',
    excerpt: 'Bentley autosleutel programmering op locatie. Continental GT, Bentayga, Flying Spur.',
    customSeoBlurb: 'Heeft u een nieuwe Bentley autosleutel nodig? Wij maken direct ter plaatse een nieuwe sleutel of smart key voor uw Bentley. Of u nu al uw sleutels kwijt bent of gewoon een reservesleutel zoekt voor uw Continental GT; wij bieden dealer-kwaliteit voor een lagere prijs.',
    models: [
      { slug: 'continental-gt', name: 'Continental GT', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' },
      { slug: 'bentayga', name: 'Bentayga', years: '2016, 2017, 2018, 2019, 2020, 2021, 2022' },
      { slug: 'flying-spur', name: 'Flying Spur', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' }
    ],
  }
];
