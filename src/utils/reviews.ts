import { GoogleReview } from '@/components/GoogleReviewCard/GoogleReviewCard';

const FIRST_NAMES = ['Thomas', 'Sara', 'Mohammed', 'Lisa', 'Jan', 'Kees', 'Fatima', 'Peter', 'Sanne', 'Mark', 'Bram', 'Emma', 'Ali', 'Julia', 'Milan', 'Sophie', 'Kevin', 'Chantal', 'Anouk', 'Daan', 'Lars', 'Fleur', 'Eva'];
const LAST_NAMES = ['de Vries', 'Jansen', 'van den Berg', 'Bakker', 'Visser', 'Smit', 'Meijer', 'Boer', 'Peters', 'Yilmaz', 'Kaya', 'van Dijk', 'Kok', 'Veenstra', 'Dekker', 'Kuipers', 'Vos', 'Willems', 'Hendriks'];
const DATES = ['1 dag geleden', '2 dagen geleden', '3 dagen geleden', '5 dagen geleden', '1 week geleden', '2 weken geleden', '4 dagen geleden', '6 dagen geleden', '3 weken geleden'];

function seededRandom(seed: number) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

const INTRO = [
  "Top service!",
  "Geweldig geholpen.",
  "Wat een redders in nood.",
  "Snel en vakkundig.",
  "Echte professionals.",
  "Zeer tevreden.",
  "Uitstekende ervaring.",
  "Absolute aanrader!",
  "Heel erg blij met de hulp.",
  "Super geregeld!",
  "Fantastisch bedrijf.",
  "Echt perfect."
];

const PROBLEM_CITY = [
  "Ik stond met een defecte sleutel in {context}.",
  "Gestrande auto in {context}, kon geen kant op.",
  "Buitengesloten uit mijn auto nabij {context}.",
  "Mijn sleutel lag nog in de auto in de regio {context}.",
  "Had met spoed een autosleutel nodig in het centrum van {context}.",
  "Sleutel afgebroken terwijl ik in {context} was."
];

const PROBLEM_BRAND = [
  "Mijn {context} sleutel was afgebroken.",
  "De transponder van mijn {context} werkte niet meer.",
  "Ik was de reserve sleutel van de {context} kwijt.",
  "Buitengesloten uit mijn {context}, erg vervelend.",
  "Contactslot van mijn {context} was defect.",
  "Ik had een nieuwe smart key voor mijn {context} nodig."
];

const PROBLEM_SERVICE = [
  "Had snel hulp nodig voor {context}.",
  "Mijn afspraak voor {context} kon direct ingepland worden.",
  "Ik zocht een specialist in {context}.",
  "Niemand kon me direct helpen met {context}, behalve zij.",
  "Voor {context} ben je hier aan het juiste adres.",
  "Ik belde voor {context} en werd erg goed te woord gestaan."
];

const PROBLEM_GENERAL = [
  "Sleutel in het contact laten zitten en de deur viel in het slot.",
  "Mijn autosleutel was spoorloos verdwenen.",
  "De afstandsbediening van de auto reageerde nergens meer op.",
  "Sleutel afgebroken in het deurslot van mijn auto.",
  "Reserve sleutel nodig vlak voor mijn vakantie.",
  "Ik was mijn autosleutels kwijtgeraakt tijdens het winkelen."
];

const ACTION = [
  "Binnen een half uur was de monteur ter plaatse.",
  "Gelukkig waren ze er heel erg snel.",
  "Ze kwamen direct nadat ik gebeld had.",
  "De monteur had de juiste apparatuur bij zich.",
  "Ze wisten precies wat er moest gebeuren.",
  "Ondanks het late tijdstip waren ze snel aanwezig."
];

const RESOLUTION = [
  "De deur werd 100% schadevrij geopend.",
  "Ze hebben ter plekke een nieuwe sleutel ingeleerd.",
  "Het probleem was binnen no-time opgelost.",
  "Alles werkt weer perfect, zonder gedoe.",
  "Voor een eerlijke prijs was ik direct weer op weg.",
  "De monteur was super vriendelijk en loste het direct op."
];

export function generateContextualReviews(contextName: string, type: 'city' | 'brand' | 'service' | 'general' = 'general'): GoogleReview[] {
  // Use a hash of contextName to have a stable but distinct base seed for each context
  const seedBase = contextName.split('').reduce((acc, char, index) => acc + char.charCodeAt(0) * (index + 1), 0) + (type.length * 100);
  
  const reviews: GoogleReview[] = [];
  
  for (let i = 0; i < 3; i++) {
    const seed = seedBase + i * 997; // large prime multiplier
    
    const firstName = FIRST_NAMES[Math.floor(seededRandom(seed) * FIRST_NAMES.length)];
    const lastName = LAST_NAMES[Math.floor(seededRandom(seed + 1) * LAST_NAMES.length)];
    const date = DATES[Math.floor(seededRandom(seed + 2) * DATES.length)];
    const rating = 5;
    
    const intro = INTRO[Math.floor(seededRandom(seed + 3) * INTRO.length)];
    const action = ACTION[Math.floor(seededRandom(seed + 4) * ACTION.length)];
    const resolution = RESOLUTION[Math.floor(seededRandom(seed + 5) * RESOLUTION.length)];
    
    let problemPool = PROBLEM_GENERAL;
    if (type === 'city') problemPool = PROBLEM_CITY;
    else if (type === 'brand') problemPool = PROBLEM_BRAND;
    else if (type === 'service') problemPool = PROBLEM_SERVICE;

    let problem = problemPool[Math.floor(seededRandom(seed + 6) * problemPool.length)];
    
    // In case context name has specific casing, we use it directly as interpolated in array
    problem = problem.replace(/\{context\}/g, contextName.toLowerCase() === contextName ? contextName : contextName);

    const text = `${intro} ${problem} ${action} ${resolution}`;
    
    reviews.push({
      name: `${firstName} ${lastName}`,
      avatarLetter: firstName.charAt(0),
      avatarColor: ['#e81c62', '#3f51b5', '#4caf50', '#ff9800', '#9c27b0', '#00bcd4', '#795548', '#009688', '#607d8b'][Math.floor(seededRandom(seed + 7) * 9)],
      date,
      rating,
      text
    });
  }
  
  return reviews;
}
