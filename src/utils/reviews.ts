import { GoogleReview } from '@/components/GoogleReviewCard/GoogleReviewCard';

const FIRST_NAMES = ['Thomas', 'Sara', 'Mohammed', 'Lisa', 'Jan', 'Kees', 'Fatima', 'Peter', 'Sanne', 'Mark', 'Bram', 'Emma', 'Ali', 'Julia', 'Milan', 'Sophie'];
const LAST_NAMES = ['de Vries', 'Jansen', 'van den Berg', 'Bakker', 'Visser', 'Smit', 'Meijer', 'Boer', 'Peters', 'Yilmaz', 'Kaya', 'van Dijk', 'Kok', 'Veenstra'];
const DATES = ['2 dagen geleden', '3 dagen geleden', '5 dagen geleden', '1 week geleden', '2 weken geleden', '4 dagen geleden', '6 dagen geleden'];

function seededRandom(seed: number) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

export function generateContextualReviews(contextName: string, type: 'city' | 'brand' | 'service' | 'general' = 'general'): GoogleReview[] {
  const seedBase = contextName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  const reviews: GoogleReview[] = [];
  
  for (let i = 0; i < 3; i++) {
    const seed = seedBase + i * 137; // arbitrary prime multiplier
    
    const firstName = FIRST_NAMES[Math.floor(seededRandom(seed) * FIRST_NAMES.length)];
    const lastName = LAST_NAMES[Math.floor(seededRandom(seed + 1) * LAST_NAMES.length)];
    const date = DATES[Math.floor(seededRandom(seed + 2) * DATES.length)];
    const rating = 5; // Fixed to 5 stars for maximum conversion
    
    let templates: string[] = [];
    
    if (type === 'city') {
      templates = [
        `Gestrande auto in ${contextName}, gelukkig kwam Autosleutel24 binnen 30 minuten ter plaatse! Super snelle en professionele service.`,
        `Top geholpen in ${contextName}! Vaste prijs vooraf gekregen, dus geen verrassingen. Vriendelijke monteur.`,
        `Ik had met spoed een autosleutel nodig in ${contextName}. De dealer had weken wachttijd, maar zij hebben het direct op locatie opgelost. Zeer tevreden!`,
        `Buitengesloten uit mijn auto in ${contextName}. Binnen 20 minuten was de deur 100% schadevrij geopend. Reddende engel!`,
        `Snelle service in regio ${contextName}. Nieuwe transpondersleutel werd ter plekke ingeleerd. Bedankt voor de goede hulp.`
      ];
    } else if (type === 'brand') {
      templates = [
        `Mijn autosleutel probleem met mijn ${contextName} was super snel opgelost. Binnen no-time een nieuwe sleutel ingeleerd!`,
        `Geweldige ervaring. Ze kwamen speciaal voor mijn ${contextName} langs en hadden direct de juiste apparatuur bij zich. Zeker een aanrader.`,
        `Zeer vriendelijk geholpen. Ik was de sleutel van de ${contextName} kwijt en kon geen kant op. Autosleutel24 was er gelukkig heel snel!`,
        `Top bedrijf! Binnen een half uur de deur van mijn ${contextName} schadevrij geopend. Vriendelijke monteur en professioneel gereedschap.`,
        `Nieuwe smart key voor mijn ${contextName} laten maken. Veel goedkoper dan de dealer en ik hoefde de auto niet weg te slepen.`
      ];
    } else if (type === 'service') {
      templates = [
        `Fantastische service met ${contextName.toLowerCase()}. Ik werd direct geholpen en het probleem was in een mum van tijd gefikst!`,
        `Heel erg bedankt voor de hulp bij ${contextName.toLowerCase()}. Vakwerk voor een eerlijke prijs.`,
        `Professioneel, vlot en transparant. Voor ${contextName.toLowerCase()} moet je echt bij dit bedrijf zijn!`,
        `Monteur was snel ter plaatse voor ${contextName.toLowerCase()}. Hij legde alles netjes uit en werkte heel nauwkeurig.`,
        `Super blij met de service voor ${contextName.toLowerCase()}. Ik kon direct weer op weg. Aanrader!`
      ];
    } else {
      templates = [
        `Hi! Gisteren de deur dichtgeslagen en sleutel binnen laten liggen. Ik belde en binnen 30 min was er iemand. Zeer professioneel!`,
        `Dank voor de goede service! Heel snel geholpen met mijn autodeur. Ik ben enorm onder de indruk.`,
        `Sleutel aan de binnenkant van de deur laten zitten, stom! Ze stonden gelukkig heel snel voor de deur en maakten hem 100% schadevrij open.`,
        `Perfecte service, vakkundig en snel. De monteur dacht goed mee en de prijs was eerlijk.`,
        `Echt een aanrader! Snel, vakkundig en heel vriendelijk geholpen. Ik kan weer de weg op.`
      ];
    }
    
    const text = templates[Math.floor(seededRandom(seed + 4) * templates.length)];
    
    reviews.push({
      name: `${firstName} ${lastName}`,
      avatarLetter: firstName.charAt(0),
      avatarColor: ['#e81c62', '#3f51b5', '#4caf50', '#ff9800', '#9c27b0', '#00bcd4', '#795548'][Math.floor(seededRandom(seed + 5) * 7)],
      date,
      rating,
      text
    });
  }
  
  return reviews;
}
