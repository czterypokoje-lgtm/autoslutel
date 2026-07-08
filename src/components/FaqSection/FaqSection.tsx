import React from 'react';
import styles from './FaqSection.module.css';

const faqs = [
  {
    question: 'Wat moet ik doen als ik mijn autosleutel kwijt ben?',
    answer: 'Het verliezen van uw autosleutel is erg vervelend, maar onze mobiele auto slotenmaker lost dit direct voor u op. Allereerst is het belangrijk om rustig te blijven en te controleren of er nog ergens een reservesleutel ligt. Is dit niet het geval, of is uw auto op slot gegaan terwijl de sleutel nog binnenin ligt? Neem dan onmiddellijk contact op met Autosleutel24. Wij komen met onze mobiele service naar uw locatie in Midden-Nederland of de Randstad, openen uw autodeur 100% schadevrij en programmeren ter plekke een compleet nieuwe transpondersleutel of smart key. Uw oude verloren sleutels worden bovendien direct uit het systeem van uw boordcomputer (ECU) gewist, zodat niemand anders meer met uw auto kan wegrijden. Dit bespaart u tijd, onnodige sleepkosten naar de merkdealer en veel frustratie.'
  },
  {
    question: 'Wat kost het gemiddeld om een autosleutel bij te laten maken in Nederland?',
    answer: 'De exacte kosten voor het bijmaken van een autosleutel hangen sterk af van het merk, het model, het bouwjaar en het type sleutel (standaard sleutel, klapsleutel of geavanceerde keyless entry smart key). Bij de officiële autodealer betaalt u al snel tussen de €300 en €900, exclusief torenhoge wegsleepkosten als u al uw sleutels kwijt bent. Bij Autosleutel24 bent u gegarandeerd stukken voordeliger uit. Een standaard transpondersleutel bijmaken begint bij ons al rond de €125 tot €150, terwijl een volledig ingeleerde smart key (inclusief behuizing en transponder programmeren op locatie) gemiddeld tussen de €150 en €350 kost, afhankelijk van de complexiteit van de startonderbreker. Doordat wij geen duur pand of showrooms hebben en direct op locatie werken, profiteert u van groothandelsprijzen met dealer-niveau kwaliteit. Neem telefonisch of via WhatsApp contact met ons op voor een exacte en vrijblijvende prijsopgave voor uw specifieke voertuig.'
  },
  {
    question: 'Hoe kan ik een transpondersleutel programmeren zonder naar de dealer te gaan?',
    answer: 'Om een transpondersleutel of smart key succesvol te programmeren en de startonderbreker van uw voertuig te synchroniseren, is gespecialiseerde diagnoseapparatuur en vakkennis vereist. Hoewel u op het internet goedkope namaaksleutels kunt vinden, vereist het daadwerkelijke inleren in de ECU toegang tot de OBD2-poort en specifieke veiligheidscodes (zoals pincodes of radiocodes) van de fabrikant. Zonder de juiste apparatuur (zoals Autel, VVDI of Lonsdor) riskeert u onherstelbare schade aan de elektronica van uw auto. Bij Autosleutel24 beschikken wij over precies dezelfde geavanceerde programmeerapparatuur als de officiële merkdealers. Onze gecertificeerde specialisten komen met deze apparatuur naar uw pechlocatie toe. Wij lezen de benodigde cryptografische data rechtstreeks uit uw voertuig (via OBD of EEPROM/MCU reading) en programmeren de nieuwe sleutelchip naadloos en veilig in uw startblokkering. U hoeft dus niet naar de dealer gesleept te worden; wij brengen de dealer-service direct naar u toe.'
  },
  {
    question: 'Wat kan ik doen als mijn keyless entry sleutel niet meer werkt?',
    answer: 'Als uw keyless entry (smart key of comfort access) sleutel plotseling niet meer functioneert, is de meest voorkomende oorzaak een lege of sterk verzwakte knoopcelbatterij (zoals een CR2032). Probeer de batterij zelf te vervangen en test of de portieren weer ontgrendelen. Blijft het probleem aanhouden? Dan is er mogelijk sprake van een defecte transponderspoel (coil), losgeraakte micro-switches in de behuizing, of waterschade op de interne printplaat. In plaats van een volledig nieuwe sleutel aan te schaffen, kunnen onze ervaren monteurs in veel gevallen uw huidige autosleutels repareren. We openen de behuizing zorgvuldig, diagnosticeren de zendfrequentie en voeren microsoldeer-reparaties uit. Mocht de sleutel elektronisch volledig onherstelbaar zijn door bijvoorbeeld een kapotte chip, dan kunnen wij ter plekke direct een nieuwe vervangende smart key frezen, inleren en synchroniseren, zodat u uw reis zonder grote vertraging kunt vervolgen.'
  },
  {
    question: 'Hoe kan ik mijn auto openen als ik mijn sleutel binnen heb laten liggen zonder schade te maken?',
    answer: 'Het overkomt de besten: de deuren vallen in het slot en uw autosleutels liggen nog op de voorstoel of in de kofferbak. Zelf proberen de autodeur te openen met een kledinghanger, schroevendraaier of het inslaan van een raam leidt in vrijwel alle gevallen tot aanzienlijke lakschade, kapotte raamrubbers of defecte slotmechanismen, wat de uiteindelijke kosten enorm verhoogt. De veiligste en meest kosteneffectieve oplossing is het inschakelen van een professionele auto slotenmaker. Onze specialisten gebruiken speciale, merkspecifieke Lishi-lockpicks en lagedruk luchtkussentjes. Hiermee manipuleren we via het sleutelgat heel voorzichtig de interne pinnen van het cilinderslot, waardoor het slot exact op dezelfde manier wordt geopend alsof u de originele sleutel zou gebruiken. Deze techniek garandeert 100% schadevrij auto openen, ongeacht of u een Volkswagen, BMW, Audi, Mercedes of ander merk rijdt. U staat binnen enkele minuten weer met uw sleutel in handen.'
  }
];

export default function FaqSection() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.answer,
      },
    })),
  };

  return (
    <section className={styles.faqSection}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <div className="container">
        <div className={styles.faqHeader}>
          <p className="section-eyebrow">VEELGESTELDE VRAGEN</p>
          <h2 className="section-title">Alles over Autosleutels &amp; Sloten</h2>
          <p className="section-lead">
            Heeft u vragen over kosten, levertijden of reparaties? Bekijk onze meest gestelde vragen.
          </p>
        </div>

        <div className={styles.faqList}>
          {faqs.map((faq, index) => (
            <details key={index} className={styles.faqItem} name="home-faq">
              <summary className={styles.faqQuestion}>
                {faq.question}
                <span className={styles.faqIcon}></span>
              </summary>
              <div className={styles.faqAnswer}>
                <p>{faq.answer}</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
