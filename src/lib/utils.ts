export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')        // Replace spaces with -
    .replace(/[^\w\-]+/g, '')    // Remove all non-word chars
    .replace(/\-\-+/g, '-')      // Replace multiple - with single -
    .replace(/^-+/, '')          // Trim - from start of text
    .replace(/-+$/, '');         // Trim - from end of text
}

export function formatProductDescription(html: string): string {
  if (!html) return '';
  
  let cleaned = html;
  
  // 1. Translate headers
  cleaned = cleaned.replace(/Compatible with[;:]?/gi, '<strong>Geschikt voor:</strong>');
  cleaned = cleaned.replace(/Comes complete with[;:]?/gi, '<strong>Inclusief:</strong>');
  cleaned = cleaned.replace(/Key Features[;:]?/gi, '<strong>Belangrijkste kenmerken:</strong>');
  cleaned = cleaned.replace(/Benefits[;:]?/gi, '<strong>Voordelen:</strong>');
  cleaned = cleaned.replace(/For following vehicles[;:]?/gi, '<strong>Geschikt voor:</strong>');
  cleaned = cleaned.replace(/Blank Reference[;:]?/gi, '<strong>Sleutelblad referentie:</strong>');
  
  // Custom keyword replacements
  cleaned = cleaned.replace(/This is a key blade for/gi, 'Sleutelblad geschikt voor');
  cleaned = cleaned.replace(/For /gi, 'Voor ');
  cleaned = cleaned.replace(/(\d+)\s*Buttons/gi, '$1 knoppen');
  cleaned = cleaned.replace(/Buttons/gi, 'knoppen');
  cleaned = cleaned.replace(/Lock, Unlock, Boot, Lights & Panic/gi, 'Vergrendelen, Ontgrendelen, Kofferbak, Verlichting & Paniek');
  cleaned = cleaned.replace(/Lock, Unlock, Boot/gi, 'Vergrendelen, Ontgrendelen, Kofferbak');
  cleaned = cleaned.replace(/Lock, Unlock/gi, 'Vergrendelen, Ontgrendelen');
  cleaned = cleaned.replace(/Emergency Key Blade/gi, 'Noodsleutel');
  
  // 2. Remove known English fluff sentences/paragraphs (case-insensitive)
  const fluffPhrases = [
    /Give your car key a fresh look with our high-quality key cases, designed to repair or replace the appearance of your existing car key remote\.?/gi,
    /This is a remote key case only and contains no internals, transponder, or battery\. Simply swap the electronics from your existing remote into this new case for easy, seamless functionality\.?/gi,
    /Remote cases and housings require some assembly\. We cannot be held liable for any damage caused when changing your key housing\.?/gi,
    /Aftermarket replacement key to replace your old remote keys\.?/gi,
    /Aftermarket Lonsdor JLR remote key to replace your old remote keys\.?/gi,
    /All Lock Picks are quality checked before they are posted out to customers to ensure they are fully operational and we are unable to accept returns or refund for broken or damaged lockpicks\.?/gi,
    /A tool that will enable you to pick and decode\s*locks much faster and more efficiently compared to conventional lock picking tools\.?/gi,
    /<p>\s*<\/p>/gi,
    /<br\s*\/?>/gi, // Strip all arbitrary breaks that make it huge
    /class="[^"]*"/gi, // Remove any weird injected classes like MsoNormal
    /style="[^"]*"/gi // Remove any weird injected inline styles
  ];

  fluffPhrases.forEach(regex => {
    cleaned = cleaned.replace(regex, '');
  });

  // 3. Wrap in a tight layout class
  return `<div class="product-desc-cleaned">${cleaned}</div>`;
}
