'use client';

import { createContext, useContext, useSyncExternalStore, type ReactNode } from 'react';
import styles from './admin.module.css';

const storageKey = 'keyforcars-preview-language';
const Language = createContext(false);
const dictionary: Record<string, string> = {
  'Bestellingen': 'Orders', 'Magazijn': 'Warehouse', 'Productzoeker': 'Product finder',
  'Etiketformaat': 'Label size',
  'Productinformatie': 'Product information', 'Soort': 'Type', 'Chip': 'Chip', 'Chip (past in)': 'Chip (fits inside)',
  'Sleutelbaard': 'Key blade', 'Sleutelbaard (past op)': 'Key blade (fits)', 'Frequentie': 'Frequency', 'Knoppen': 'Buttons',
  'Behuizing': 'Housing', 'Transpondersleutel': 'Transponder key', 'Transponderchip': 'Transponder chip',
  'Sleutel / afstandsbediening': 'Key / remote', 'Foto groot openen': 'Open large photo',
  'Geen productprofiel voor deze SKU.': 'No product profile for this SKU.', 'Minder tonen': 'Show less',
  'Alle voertuigen tonen': 'Show all vehicles', 'Volledig productprofiel': 'Full product profile', 'Alle kenmerken': 'All attributes',
  'Productprofiel': 'Product profile', 'Productprofiel zoeken': 'Find a product profile',
  'Scan of zoek: code, EAN, naam of auto en bouwjaar': 'Scan or search: code, EAN, name or car and year',
  'Niets gevonden.': 'Nothing found.', 'productprofielen': 'product profiles', 'Voorraad op locatie': 'Stock by location',
  'Voorraad kon niet geladen worden.': 'Stock could not be loaded.', 'Laden…': 'Loading…',
  'Dit product staat nog niet in de voorraadlijst.': 'This product is not in the stock list yet.', 'Totaal': 'Total',
  'Laatst verkocht': 'Last sold', 'Laatste boeking': 'Last movement', 'Past op': 'Fits',
  'Geen voertuiglijst. Vul aan in remkeys.com.': 'No vehicle list. Add it on remkeys.com.',
  'Specificaties': 'Specifications', 'In de webshops': 'In the web shops',
  'Voorraad': 'Inventory', 'Hoofdmenu': 'Main menu', 'Gesprekken': 'Conversations',
  'Planning': 'Scheduling', 'Agenda': 'Calendar', 'Klus inplannen': 'Schedule a job',
  'Aanbod': 'Offers', 'Biedingen': 'Bids', 'Vandaag (monteurscherm)': 'Today (technician view)',
  'Klanten': 'Customers', 'Monteurs': 'Technicians', 'Magazijn en bussen': 'Warehouse and vans',
  'Onderdelen bestellen': 'Order parts', 'Geld': 'Finance', 'Facturen': 'Invoices', 'Uitgaven': 'Expenses',
  'Kas & uitbetalingen': 'Cash and payouts', 'Tarieven': 'Rates', 'Monteurtarieven': 'Technician rates',
  'Rapporten': 'Reports', 'Prestaties': 'Performance', 'Winst & verbruik': 'Profit and usage',
  'Rapportage': 'Reporting', 'Advertentieklikken': 'Ad clicks', 'Klikfraude': 'Click fraud',
  'Netwerk': 'Network', 'Instellingen': 'Settings', 'Site bekijken': 'View website',
  'Menu openen': 'Open menu', 'Menu sluiten': 'Close menu', 'Zoek klant': 'Search customers',
  'Zoek klant op naam, telefoon of kenteken…': 'Search by name, phone or registration…', 'AI-agent': 'AI agent',
  'Gesprekken van de AI-agent': 'AI agent conversations', 'Profiel': 'Profile', 'Zoeken': 'Search',
  'De site openen zoals een bezoeker hem ziet': 'Open the public website',
  'Logboek': 'Journal', 'Naar lokale voorraad': 'Open local inventory', 'Voorbeeldgegevens': 'Sample data',
  'Werkplaatsartikel': 'Workshop item', 'Artikelnaam': 'Item name', 'SKU (optioneel)': 'SKU (optional)',
  'Artikel toevoegen': 'Add item', 'Artikelen': 'Items', 'Zoek of scan een artikel': 'Find or scan an item',
  'Zoek op artikel, SKU of locatie': 'Search by item, SKU or location', 'Etiketten': 'Labels',
  'Vorige pagina': 'Previous page', 'Volgende pagina': 'Next page', 'Paginanummer': 'Page number',
  'Artikelvoorraad': 'Item inventory', 'Bak- en locatie-etiket': 'Bin and location label', 'Afdrukken': 'Print',
  'Foto': 'Photo', 'Locaties': 'Locations', 'Lage voorraad': 'Low stock', 'Nog niet geteld': 'Not counted yet',
  'Locatie tellen': 'Count location', 'Voorraad boeken': 'Record stock movement', 'Proefvoorraad': 'Demo stock',
  'Beweging': 'Movement', 'Geteld aantal': 'Counted quantity', 'Aantal': 'Quantity', 'Rallocatie': 'Shelf location',
  'Bakcode': 'Bin code', 'Minimumvoorraad': 'Minimum stock', 'Naar locatie': 'Destination shelf', 'Naar bak': 'Destination bin',
  'Notitie': 'Note', 'Bijvoorbeeld: verkocht aan de balie': 'Example: sold at the counter',
  'Bewijsfoto maken': 'Take evidence photo', 'Verwijder foto': 'Remove photo', 'Beweging opslaan': 'Save movement',
  'Voorraadhistorie': 'Stock history', 'Geen bewegingen geboekt': 'No movements recorded',
  'Opgeslagen beweging': 'Saved movement', 'Delen via WhatsApp': 'Share via WhatsApp', 'Foto downloaden': 'Download photo',
  'Voorraadrapporten': 'Inventory reports', 'Vandaag': 'Today', 'Deze week': 'This week', 'Deze maand': 'This month',
  'verkocht': 'sold', 'Meest verkocht': 'Top sellers', 'Geen verkopen geregistreerd': 'No sales recorded',
  'Voorraadlogboek': 'Stock journal', 'Bewijsfoto': 'Evidence photo', 'Geen boekingen': 'No records',
  'Meer boekingen': 'Show more records', 'Externe gebeurtenissen': 'External events',
  'Externe voorraadgebeurtenissen': 'External stock events',
  'Voorbeeldgegevens · automatisch bijgewerkt zodra een gebeurtenis binnenkomt.': 'Sample data · updates when an event arrives.',
  'Telling': 'Count', 'Ontvangst': 'Receipt', 'Uitgifte': 'Stock issue', 'Verkoop': 'Sale', 'Retour': 'Return', 'Verplaatsing': 'Transfer',
  'st.': 'units', 'saldo onbekend': 'balance unknown', 'Bak': 'Bin', 'Locatie': 'Location',
  'Sluiten': 'Close', 'Foto maken': 'Take photo', 'Telefooncamera / foto kiezen': 'Use phone camera / choose photo',
  'Camera openen…': 'Opening camera…', 'Livecamera vereist HTTPS. Gebruik de telefooncamera of kies een foto.': 'Live camera requires HTTPS. Use the phone camera or choose a photo.',
  'Sta cameratoegang toe in je browser of kies een foto.': 'Allow camera access in your browser or choose a photo.',
  'De camera is niet beschikbaar. Kies een foto.': 'Camera unavailable. Choose a photo.',
  'Foto maken mislukt. Probeer het opnieuw.': 'Could not take a photo. Try again.',
  'Code lezen…': 'Reading code…', 'Gescand': 'Scanned', 'Code gelezen. Zoek of kies het artikel voordat je boekt.': 'Code read. Find or select the item before saving.',
  'Geen code gelezen. Zoek het artikel op naam of SKU. De foto blijft bij de boeking.': 'No code read. Search by name or SKU. The photo stays attached.',
  'De lokale voorraad kon niet worden geladen.': 'Could not load local inventory.', 'Werkplaatsartikel toegevoegd.': 'Workshop item added.',
  'Voorraadbeweging opgeslagen.': 'Stock movement saved.', 'Opslaan is mislukt.': 'Could not save.',
  'Foto opslaan is mislukt.': 'Could not save the photo.', 'Etiketfoto opgeslagen.': 'Label photo saved.',
  'Tel deze locatie eerst.': 'Count this location first.', 'Onvoldoende voorraad op deze locatie.': 'Insufficient stock at this location.',
  'artikelen': 'items', 'resultaten': 'results', 'opgeslagen': 'saved', 'Artikel': 'Item',
  'Controleer artikel, locatie, bakcode en aantallen.': 'Check the item, shelf, bin code and quantities.',
  'Zoek op artikelnummer, merk of model — bijv. 1012AB, Golf, Peugeot 107': 'Search by part number, make or model — e.g. 1012AB, Golf, Peugeot 107',
  'Zoek': 'Search', 'Wis': 'Clear', 'artikel': 'item', 'knoppen': 'buttons', 'meer': 'more',
  'geen eigen foto': 'no product photo', 'Vraag aan': 'Request part', 'gevraagd': 'requested',
  'Woningsleutels': 'House keys', 'Behuizingen': 'Housings', 'Zonder chip': 'Without chip', 'Accessoires': 'Accessories',
  'Afstandsbedieningen': 'Remotes', 'Frezen & tasters': 'Cutters and probes', 'Universeel': 'Universal',
  'Transpondersleutels': 'Transponder keys', 'Sleutelbaarden': 'Key blades', 'Batterijen': 'Batteries', 'Sloten': 'Locks',
  'Vraag aan wat u nodig heeft; kantoor bestelt het.': 'Request the parts you need and the office will order them.',
  'Uw login is niet aan een monteur gekoppeld, dus u kunt niets aanvragen. Kantoor kan dit koppelen bij Monteurs.': 'Your login is not linked to a technician. The office can link it under Technicians so you can request parts.',
  'Uw laatste aanvragen': 'Your latest requests',
  'Verkocht aantal': 'Quantity sold', 'Afname': 'Stock decrease', 'Toename': 'Stock increase',
  'Voorraad na boeking': 'Stock after movement', 'Onbekend': 'Unknown',
  'Externe voorraadberichten': 'Incoming stock updates', 'Locatie niet opgegeven': 'Location not recorded',
  'Dit artikel heeft getelde voorraad. Kies een locatie en bak.': 'This item has counted stock. Choose a shelf and bin.',
  'Deze boekingsreferentie is al gebruikt. Controleer het logboek.': 'This reference has already been used. Check the journal.',
  'Rapportarchief': 'Report archive', 'Gekozen periode': 'Selected period', 'Kies maand': 'Choose month',
  'Van': 'From', 'Tot en met': 'Through', 'Toon rapport': 'Show report', 'Huidige periodes': 'Current periods',
  'Geboekte verkoopbedragen': 'Recorded sales amounts', 'Geboekte inkoopbedragen': 'Recorded purchase amounts',
  'Boekingen zonder bedrag': 'Records without an amount', 'Bedrag': 'Amount',
  'Totaal verkoopbedrag (€)': 'Total sale amount (€)', 'Totaal inkoopbedrag (€)': 'Total purchase amount (€)',
  'Controleer het bedrag in euro.': 'Check the euro amount.',
  'Rapportweergave': 'Report view', 'Lijst': 'List', 'Staafdiagram': 'Bar chart', 'Ringdiagram': 'Donut chart',
  'Overige producten': 'Other products', 'Aandeel van verkochte aantallen': 'Share of units sold',
  'uniek artikel verkocht': 'distinct item sold', 'unieke artikelen verkocht': 'distinct items sold',
  'Alle verkochte artikelen': 'All sold items',
  'Verkoopvoorbeeld': 'Sample sales scenario', 'Bestaande voorbeeldgegevens': 'Existing sample data',
  'Geen verkoop': 'No sales', '100 verschillende producten': '100 different products',
  '1.200 verschillende producten': '1,200 different products',
  'Voorbeeldverkopen voor vandaag. Voorraad wordt niet gewijzigd.': 'Sample sales for today. Inventory is unchanged.',
};

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener(storageKey, callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener(storageKey, callback);
  };
}

export function usePreviewLanguage() {
  const english = useContext(Language);
  return { english, t: (dutch: string) => english ? dictionary[dutch] ?? dutch : dutch };
}

export function PreviewText({ children }: { children: string }) {
  return usePreviewLanguage().t(children);
}

export default function PreviewLanguage({ children }: { children: ReactNode }) {
  const english = useSyncExternalStore(subscribe, () => localStorage.getItem(storageKey) === 'en', () => false);
  return <Language.Provider value={english}>
    {children}
    <div role="group" aria-label="Preview language" className={`${styles.readonlyBanner} ${styles.languageBanner}`}>
      <span>{english ? 'KeyForCars · Preview' : 'KeyForCars · proefversie'}</span>
      {['NL', 'EN'].map((lang) => <button key={lang} type="button" aria-pressed={english === (lang === 'EN')} onClick={() => {
        localStorage.setItem(storageKey, lang.toLowerCase());
        window.dispatchEvent(new Event(storageKey));
      }}>{lang}</button>)}
    </div>
  </Language.Provider>;
}
