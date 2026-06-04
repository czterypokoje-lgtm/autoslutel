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
    ],
  },
  {
    slug: 'mercedes', name: 'Mercedes-Benz', nameSlug: 'mercedes', priority: 'P1',
    system: 'IR / HFM / NEC / EIS / ESL',
    excerpt: 'Mercedes sleutel programmering. W204, W205, W213, Sprinter, Vito. EIS/ESL bench programmering.',
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
    ],
  },
  {
    slug: 'volkswagen', name: 'Volkswagen', nameSlug: 'volkswagen', priority: 'P1',
    system: 'MQB / MLB / PQ35 / SFD',
    excerpt: 'VW sleutel programmering. Golf 7/8, Tiguan, Polo, Passat. SFD ontgrendeling specialist.',
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
    ],
  },
  {
    slug: 'audi', name: 'Audi', nameSlug: 'audi', priority: 'P1',
    system: 'MMI / MIB / VW Group',
    excerpt: 'Audi sleutel programmering. A3, A4, A6, Q3, Q5, Q7. VW Group platform specialist.',
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
    ],
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
    ],
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
    ],
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
    models: [
      { slug: 'clio', name: 'Clio', years: '1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'megane', name: 'Megane', years: '2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'trafic', name: 'Trafic', years: '2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'captur', name: 'Captur', years: '2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'kadjar', name: 'Kadjar', years: '2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' },
      { slug: 'twingo', name: 'Twingo', years: '2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'master', name: 'Master', years: '1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
    ],
  },
  {
    slug: 'peugeot', name: 'Peugeot', nameSlug: 'peugeot', priority: 'P2',
    system: 'PSA BSI / PIN extractie',
    excerpt: 'Peugeot sleutel programmering specialist. 208, 308, 508, Partner. BSI programmering.',
    models: [
      { slug: '208', name: '208', years: '2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: '308', name: '308', years: '2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'partner', name: 'Partner', years: '1996, 1997, 1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: '3008', name: '3008', years: '2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: '2008', name: '2008', years: '2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: '5008', name: '5008', years: '2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: '107', name: '107', years: '2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014' },
      { slug: 'boxer', name: 'Boxer', years: '2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
    ],
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
    models: [
      { slug: 'ibiza', name: 'Ibiza', years: '2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'leon', name: 'Leon', years: '2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'arona', name: 'Arona', years: '2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'ateca', name: 'Ateca', years: '2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'tarraco', name: 'Tarraco', years: '2018, 2019, 2020, 2021, 2022, 2023, 2024' },
    ],
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
    models: [
      { slug: 'mazda-3', name: '3', years: '2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'cx-5', name: 'CX-5', years: '2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'mazda-2', name: '2', years: '2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'cx-3', name: 'CX-3', years: '2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' },
      { slug: 'mx-5', name: 'MX-5', years: '2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
    ],
  },
  {
    slug: 'kia', name: 'Kia', nameSlug: 'kia', priority: 'P2',
    system: 'Hyundai/Kia Smart Key',
    excerpt: 'Kia sleutel programmering specialist. Picanto, Rio, Sportage, Niro. PIN-code specialist.',
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
    models: [
      { slug: 'i10', name: 'i10', years: '2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'tucson', name: 'Tucson', years: '2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'i20', name: 'i20', years: '2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'kona', name: 'Kona', years: '2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'i30', name: 'i30', years: '2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'ioniq', name: 'Ioniq', years: '2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
    ],
  },
  {
    slug: 'nissan', name: 'Nissan', nameSlug: 'nissan', priority: 'P2',
    system: 'Nissan NATS / BCM',
    excerpt: 'Nissan sleutel programmering specialist. Micra, Qashqai, Juke, Leaf.',
    models: [
      { slug: 'micra', name: 'Micra', years: '2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'qashqai', name: 'Qashqai', years: '2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'juke', name: 'Juke', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'x-trail', name: 'X-Trail', years: '2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'leaf', name: 'Leaf', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
    ],
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
    models: [
      { slug: 'range-rover', name: 'Range Rover', years: '2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'evoque', name: 'Evoque', years: '2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'discovery', name: 'Discovery', years: '2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'defender', name: 'Defender', years: '1990, 1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
    ],
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
    slug: 'dacia', name: 'Dacia', nameSlug: 'dacia', priority: 'P3',
    system: 'Renault/Dacia UCH',
    excerpt: 'Dacia sleutel specialist. Logan, Sandero, Duster.',
    models: [
      { slug: 'duster', name: 'Duster', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
    ],
  },
  {
    slug: 'iveco', name: 'Iveco', nameSlug: 'iveco', priority: 'P3',
    system: 'Iveco Code 2 / BCM',
    excerpt: 'Iveco bedrijfswagen sleutel specialist. Daily specialist.',
    models: [
      { slug: 'daily', name: 'Daily', years: '1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
    ],
  },
  {
    slug: 'daf', name: 'DAF', nameSlug: 'daf', priority: 'P3',
    system: 'DAF Immobiliser',
    excerpt: 'DAF truck sleutel specialist. XF, CF, LF.',
    models: [
      { slug: 'xf', name: 'XF', years: '2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
    ],
  },
  {
    slug: 'scania', name: 'Scania', nameSlug: 'scania', priority: 'P3',
    system: 'Scania Immobiliser / Coordinator',
    excerpt: 'Scania truck sleutel specialist. R-Serie, G-Serie, P-Serie. Coordinator programmering.',
    models: [
      { slug: 'r-serie', name: 'R-Serie', years: '2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
    ],
  },
  {
    slug: 'man', name: 'MAN', nameSlug: 'man', priority: 'P3',
    system: 'MAN Immobiliser / FFR',
    excerpt: 'MAN truck sleutel specialist. TGX, TGS, TGL. FFR en PTM specialist.',
    models: [
      { slug: 'tgx', name: 'TGX', years: '2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
    ],
  },
  {
    slug: 'jeep', name: 'Jeep', nameSlug: 'jeep', priority: 'P3',
    system: 'Jeep / Chrysler FOBIK / Proximity',
    excerpt: 'Jeep sleutel specialist. Grand Cherokee, Wrangler, Renegade.',
    models: [
      { slug: 'grand-cherokee', name: 'Grand Cherokee', years: '2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
      { slug: 'wrangler', name: 'Wrangler', years: '2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
    ],
  },
  {
    slug: 'alfa-romeo', name: 'Alfa Romeo', nameSlug: 'alfa-romeo', priority: 'P3',
    system: 'Alfa Code 2 / Marelli / BCM',
    excerpt: 'Alfa Romeo sleutel specialist. Giulietta, Giulia, Stelvio.',
    models: [
      { slug: 'giulietta', name: 'Giulietta', years: '2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022' },
      { slug: 'giulia', name: 'Giulia', years: '2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
    ],
  },
  {
    slug: 'mitsubishi', name: 'Mitsubishi', nameSlug: 'mitsubishi', priority: 'P3',
    system: 'Mitsubishi Immobiliser / KOS',
    excerpt: 'Mitsubishi sleutel specialist. Outlander, ASX, Space Star.',
    models: [
      { slug: 'outlander', name: 'Outlander', years: '2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
    ],
  },
  {
    slug: 'suzuki', name: 'Suzuki', nameSlug: 'suzuki', priority: 'P3',
    system: 'Suzuki Immobiliser / Smart Key',
    excerpt: 'Suzuki sleutel specialist. Swift, Vitara, Jimny.',
    models: [
      { slug: 'swift', name: 'Swift', years: '2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
    ],
  },
  {
    slug: 'smart', name: 'Smart', nameSlug: 'smart', priority: 'P3',
    system: 'Mercedes/Smart Immobiliser',
    excerpt: 'Smart sleutel specialist. Fortwo, Forfour.',
    models: [
      { slug: 'fortwo', name: 'Fortwo', years: '1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024' },
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
    slug: 'ds', name: 'DS Automobiles', nameSlug: 'ds', priority: 'P3',
    system: 'PSA BSI / Keyless',
    excerpt: 'DS sleutel specialist. DS3, DS4, DS7.',
    models: [
      { slug: 'ds3', name: 'DS3', years: '2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019' },
    ],
  },
];
