import React from 'react';
import Link from 'next/link';
import { SITE_CONFIG, WHATSAPP_URL } from '@/config/site.config';

export const BLOG_CONTENT: Record<string, React.ReactNode> = {
  'autosleutel-batterij-vervangen-stappenplan': (
    <>
      <h2>Hoe Vervang je de Batterij van je Autosleutel? (Model-per-Model Gids)</h2>
      <p>
        Is uw <strong>batterij autosleutel leeg en start de auto niet</strong>? Of reageert de centrale vergrendeling pas als u heel dichtbij staat en geeft uw auto een waarschuwing op het dashboard? Dan is de <strong>autosleutel batterij</strong> aan vervanging toe. Dit is een eenvoudige klus die u in veel gevallen zelf kunt doen, mits u de juiste methode en de juiste batterij gebruikt. Als uw <strong>auto niet open gaat met de afstandsbediening</strong>, kunt u ook altijd de fysieke noodsleutel gebruiken om toegang te krijgen.
      </p>

      <h3>Welke batterij voor uw autosleutel heeft u nodig?</h3>
      <p>
        Elk automerk maakt gebruik van specifieke lithium knoopcelbatterijen (3V). Het is cruciaal om een kwalitatieve A-merk batterij (zoals Duracell, Varta of Panasonic) te gebruiken. Goedkope batterijen verliezen snel hun spanning en kunnen gaan lekken, waardoor uw kostbare printplaat beschadigd raakt.
      </p>
      <ul>
        <li><strong>Volkswagen, Seat & Skoda:</strong> Meestal een CR2032 knoopcel. Dit geldt voor zowel klapsleutels als de nieuwere smart keys. Voor de nieuwste MQB48 sleutels kan een CR2025 nodig zijn (bijv. <strong>vw sleutel batterij vervangen</strong> of <strong>skoda sleutel batterij vervangen</strong>).</li>
        <li><strong>BMW:</strong> E-chassis klapsleutels hebben een gesoldeerde oplaadbare accu (LIR2025). F- en G-serie smart fobs gebruiken respectievelijk de CR2032 en de extra dikke CR2450.</li>
        <li><strong>Mercedes-Benz:</strong> Vrijwel alle chromen sleutels (FBS3 & FBS4) gebruiken één of twee CR2025 batterijen.</li>
        <li><strong>Tesla:</strong> Model S en X key fobs gebruiken een CR2032 batterij. Model 3 en Y maken primair gebruik van keycards (RFID), maar als u de optionele key fob gebruikt, zit hier ook een CR2032 in.</li>
      </ul>

      <h3>Model-specifieke instructies voor batterij vervangen</h3>
      
      <h4>1. VW & Skoda sleutel batterij vervangen</h4>
      <p>
        Bij een <strong>vw sleutel batterij vervangen</strong> of <strong>skoda sleutel batterij vervangen</strong> klapt u eerst de sleutelbaard uit. Zoek de naad aan de zijkant van de behuizing en wip het achterklepje voorzichtig omhoog met een schroevendraaier of muntje. Verwijder de oude CR2032 en plaats de nieuwe met de pluspool (+) naar boven gericht. Druk het klepje weer stevig aan.
      </p>

      <h4>2. BMW F- & G-serie smart key batterij vervangen</h4>
      <p>
        Druk op de kleine mechanische knop aan de zijkant of achterkant en schuif de metalen noodsleutelbaard eruit. Gebruik de punt van de noodsleutel om in het kleine gleufje naast de opening te drukken; hiermee klikt het achterste batterijpaneel los. Vervang de batterij (CR2032 voor F-serie, CR2450 voor G-serie) en klik de cover weer op zijn plek.
      </p>

      <h4>3. Mercedes-Benz FBS3/FBS4 sleutel batterij vervangen</h4>
      <p>
        Schuif de release-knop op de achterkant opzij en trek de noodsleutel eruit. Druk de noodsleutel in het geopende kanaal om de achterzijde van de behuizing los te drukken. De batterijen (1 of 2 stuks CR2025) glijden er nu eenvoudig uit. Plaats de nieuwe batterijen met de plus-zijde naar boven en schuif de noodsleutel terug.
      </p>

      <h4>4. Tesla Key Fob batterij vervangen</h4>
      <p>
        Leg de sleutel met de knoppen naar beneden op een zachte ondergrond. Gebruik een klein plat plastic gereedschap (of een klein schroevendraaiertje) om het onderste paneel (aan de achterkant van de "auto") voorzichtig los te wrikken. Haal de CR2032 batterij eruit en plaats een nieuwe. Druk het paneeltje weer op zijn plaats tot het vastklikt.
      </p>

      <h3>Wat te doen als de sleutel nog steeds niet werkt?</h3>
      <p>
        Heeft u de <strong>auto sleutel batterij vervangen</strong> maar reageert het voertuig nog steeds niet? Dan kan het zijn dat de sleutel zijn synchronisatie is verloren of dat de <strong>autosleutel kapot</strong> is. 
      </p>
      <ul>
        <li><strong>Keyless auto starten met sleutel (noodprocedure):</strong> Houd de afstandsbediening direct tegen de stuurkolom (waar vaak een sleutel-icoontje staat) of druk de startknop in met de sleutel zelf. Hierdoor leest de auto de passieve transponderchip uit, zelfs als de afstandsbediening niet zendt.</li>
        <li><strong>Sleutelbehuizing of knopjes kapot:</strong> Soms is de <strong>behuizing van de autosleutel kapot</strong> (<strong>behuizing autosleutel kapot</strong>) en maken de knopjes geen contact meer met de printplaat. Dan is een <strong>autosleutel behuizing vervangen</strong> of het solderen van nieuwe micro-switches de oplossing.</li>
      </ul>
    </>
  ),
  'ghost-immobiliser-utrecht': (
    <>
      <h2>Wat is een Ghost Immobiliser en Hoe Beveiligt Het Uw Auto?</h2>
      <p>
        Moderne voertuigen met keyless entry en keyless start zijn helaas uiterst diefstalgevoelig. Met behulp van een zogeheten <strong>relay attack</strong> (signaal-verlenging) kunnen dieven het signaal van uw autosleutel binnenin uw huis opvangen, doorsturen naar de auto op de oprit, en de deuren openen én starten. Dit gebeurt geruisloos en binnen dertig seconden. De <strong>Ghost Immobiliser</strong> is de ultieme oplossing om dit te voorkomen.
      </p>

      <h3>Hoe werkt de Ghost CAN-bus startonderbreking?</h3>
      <p>
        In tegenstelling tot traditionele klasse-alarmen, onderbreekt de Ghost Immobiliser geen draden of circuits in de auto. Het is een extreem klein apparaatje dat onzichtbaar in de kabelboom van de auto wordt gemonteerd. Het communiceert direct met het <strong>CAN-bus netwerk</strong> van het voertuig (het interne computernetwerk).
      </p>
      <p>
        Zodra u het contact aanzet, blokkeert de Ghost elektronisch de startmodule of de brandstofpomp via software-opdrachten. De auto start pas nadat u een unieke en persoonlijke <strong>PIN-code combinatie</strong> indrukt via de bestaande knoppen van de auto (zoals knoppen op het stuurwiel, de middenconsole of de ruitbediening). 
      </p>

      <h3>Waarom is dit 100% veilig tegen signaal-cloning?</h3>
      <ul>
        <li><strong>Geen radiogolven:</strong> De Ghost zendt geen Bluetooth, RF of wifi-signalen uit. Dieven met signaal-scanners kunnen de startonderbreker dus niet opsporen of hacken.</li>
        <li><strong>Geen klikgeluiden:</strong> Traditionele startonderbrekers maken gebruik van relais die hoorbaar klikken. De Ghost communiceert stil via computercodes, waardoor hij fysiek onvindbaar is.</li>
        <li><strong>Bescherming tegen OBD-poort hacks:</strong> Zelfs als een dief uw portier opent en een nieuwe sleutel probeert in te leren via de OBD-poort, zal hij de auto zonder de PIN-code niet kunnen starten.</li>
        <li><strong>Valet-modus voor de garage:</strong> U kunt het systeem tijdelijk deactiveren (valet-modus) wanneer u de auto naar de garage brengt voor onderhoud. Zo hoeft u uw persoonlijke code nooit aan derden te vertellen.</li>
      </ul>

      <div style={{ background: '#f8fafc', borderLeft: '4px solid #059669', padding: '1rem', margin: '1.5rem 0', borderRadius: '4px' }}>
        <strong>SCM en Verzekering:</strong> Veel autoverzekeraars eisen bij duurdere voertuigen een extra startbeveiliging. De Ghost Immobiliser is de meest effectieve en minst ingrijpende methode om te voldoen aan hoge beveiligingseisen.
      </div>
    </>
  ),
  'alle-sleutels-kwijt-wat-nu-utrecht': (
    <>
      <h2>Wat Moet Je Doen Als Je Alle Autosleutels Kwijt Bent?</h2>
      <p>
        Het verliezen van uw allerlaatste autosleutel is een nachtmerrie. Geen reservesleutel meer hebben betekent dat u uw auto niet in kunt en niet kunt starten. De traditionele weg is de auto laten wegslepen naar een dealer, waarna u 1 tot 2 weken moet wachten op een nieuwe sleutel die uit de fabriek moet komen, met een gepeperde rekening tot gevolg.
      </p>

      <h3>Stappenplan bij noodopening en verlies</h3>
      <ol>
        <li><strong>Geen paniek:</strong> Controleer nogmaals grondig al uw zakken, tassen en plekken waar de sleutel kan liggen.</li>
        <li><strong>Identificeer uw voertuig:</strong> Houd het kenteken, merk, model, bouwjaar en eventueel het chassisnummer (VIN) bij de hand.</li>
        <li><strong>Bel Autosleutel24 Utrecht:</strong> Onze spoedservice is stand-by. Wij sturen direct een mobiele technicus naar uw locatie in Utrecht of omstreken.</li>
        <li><strong>Schadevrij openen:</strong> Onze monteur opent uw portier schadevrij met speciaal gereedschap (zoals Lishi picks).</li>
        <li><strong>Sleutel frezen & programmeren:</strong> In onze bus frezen we een nieuwe sleutelbaard en programmeren we een nieuwe transponder chip via de OBD-diagnosepoort. De verloren sleutels worden direct uit het geheugen gewist.</li>
      </ol>
    </>
  ),
  'autosleutel-kosten-per-merk-2026': (
    <>
      <h2>Wat Kost een Nieuwe Autosleutel Per Merk in 2026?</h2>
      <p>
        De kosten voor het bijmaken van een autosleutel hangen sterk af van de technologie in de sleutel. Een standaardsleutel zonder chip is goedkoop, maar een moderne smart key met transponder, afstandsbediening en keyless entry vereist ingewikkelde inleerapparatuur.
      </p>
      
      <h3>Kostenindicatie per merkgroep</h3>
      <table className="price-table" style={{ width: '100%', marginBottom: '2rem' }}>
        <thead>
          <tr>
            <th>Merk / Groep</th>
            <th>Type Sleutel</th>
            <th>Gemiddelde Prijs Slotenmaker</th>
            <th>Dealerprijs indicatie</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Volkswagen / Audi / Seat</strong></td>
            <td>Transponder / Smart Key (MQB)</td>
            <td>€149 - €199</td>
            <td>€300 - €450</td>
          </tr>
          <tr>
            <td><strong>BMW / Mini</strong></td>
            <td>Smart Key (CAS/FEM/BDC)</td>
            <td>€199 - €249</td>
            <td>€350 - €550</td>
          </tr>
          <tr>
            <td><strong>Mercedes-Benz</strong></td>
            <td>Infrarood Sleutel (FBS3/FBS4)</td>
            <td>€199 - €269</td>
            <td>€400 - €600</td>
          </tr>
          <tr>
            <td><strong>Toyota / Lexus</strong></td>
            <td>Proximity Smart Key</td>
            <td>€189 - €239</td>
            <td>€350 - €480</td>
          </tr>
          <tr>
            <td><strong>Ford / Opel / Peugeot</strong></td>
            <td>Afstandsbediening Klapsleutel</td>
            <td>€129 - €179</td>
            <td>€250 - €380</td>
          </tr>
        </tbody>
      </table>
    </>
  ),
  'dealer-vs-slotenmaker-kostenverschil': (
    <>
      <h2>Dealer vs Mobiele Slotenmaker: De Echte Cijfers</h2>
      <p>
        Als u een reservesleutel wilt laten bijmaken of alle sleutels kwijt bent, denkt u wellicht direct aan uw merkdealer. Dit is echter vaak de duurste en meest tijdrovende optie. Een mobiele autosleutelspecialist zoals Autosleutel24 biedt grote voordelen.
      </p>

      <h3>Waarom een slotenmaker goedkoper en sneller is</h3>
      <ul>
        <li><strong>Geen sleepkosten:</strong> Als u uw sleutels kwijt bent, moet de dealer de auto wegslepen (€100 - €150). Wij komen gewoon naar u toe in onze mobiele werkplaats.</li>
        <li><strong>Snelle levertijd:</strong> Een dealer bestelt een sleutel op chassisnummer in Duitsland of Frankrijk, wat 3 tot 10 werkdagen duurt. Wij programmeren en snijden een sleutel direct ter plaatse terwijl u wacht.</li>
        <li><strong>Eerlijke tarieven:</strong> Wij hebben lagere overheadkosten en rekenen geen absurde fabrieksmarges. Dit scheelt u gemiddeld 30% tot 50% in de totale kosten.</li>
      </ul>
    </>
  ),
  'verzekering-dekt-autosleutel-vervangen': (
    <>
      <h2>Wordt het Vervangen van je Autosleutel Vergoed?</h2>
      <p>
        Het verliezen of laten stelen van uw autosleutel is een dure aangelegenheid. Gelukkig vergoeden Nederlandse autoverzekeringen in bepaalde gevallen de kosten voor het vervangen van de sleutels en het herprogrammeren van de startonderbreker.
      </p>

      <h3>Dekking per verzekeringstype</h3>
      <ul>
        <li><strong>WA Verzekering (Basis):</strong> Dekt helaas nooit diefstal of verlies van uw eigen autosleutels.</li>
        <li><strong>WA Beperkt Casco (WA+):</strong> Dekt diefstal en inbraak. Als uw autosleutels zijn gestolen (bijvoorbeeld na een woninginbraak), worden de vervangingskosten en het wissen van de oude sleutels uit de boordcomputer vrijwel altijd volledig vergoed. Verlies is vaak uitgesloten.</li>
        <li><strong>All Risk Verzekering:</strong> Dekt zowel diefstal als verlies van sleutels. Let wel op uw eigen risico en eventuele gevolgen voor uw schadevrije jaren (no-claim korting).</li>
      </ul>
      <p>
        Autosleutel24 Utrecht levert altijd een officiële, gespecificeerde factuur die u direct kunt indienen bij uw verzekeraar voor een snelle afhandeling.
      </p>
    </>
  ),
  'sfd-lock-vw-golf-8-uitleg': (
    <>
      <h2>Wat is SFD Lock op de Volkswagen Golf 8?</h2>
      <p>
        Heeft u een Volkswagen Golf 8, Caddy (2020+) of een nieuwe Audi A3? Dan heeft u wellicht gehoord van <strong>SFD (Schutz Fahrzeug Diagnose)</strong>. Dit is een geavanceerde beveiligingsbarrière die door de VAG-groep is geïntroduceerd om onbevoegde toegang tot de vitale stuurapparaten van de auto te voorkomen.
      </p>

      <h3>Hoe beïnvloedt SFD het bijmaken van sleutels?</h3>
      <p>
        Bij oudere auto's kon een slotenmaker eenvoudig via de OBD2-poort inloggen op de startonderbreker. Bij SFD-beveiligde voertuigen blokkeert de auto alle schrijfacties op de computer. Om een nieuwe sleutel in te leren, moet de diagnose-apparatuur via een beveiligde server rechtstreeks verbinding maken met de servers van Volkswagen in Wolfsburg om een tijdelijk ontgrendelingstoken aan te vragen.
      </p>
      <p>
        Veel universele slotenmakers hebben hier niet de juiste licenties en apparatuur voor. Onze monteurs beschikken over officiële VAG online accounts en dealer-apparatuur om SFD-sloten ter plaatse schadevrij te unlocken en uw nieuwe smart key in te leren.
      </p>
    </>
  ),
  'bmw-bdc2-sleutel-bijmaken-2026': (
    <>
      <h2>BMW BDC2 Sleutel Bijmaken: Technische Uitleg</h2>
      <p>
        BMW maakt in haar F- en G-serie modellen (zoals de 1-serie, 3-serie en X5 vanaf ca. 2015) gebruik van de <strong>FEM (Front Body Module)</strong> of <strong>BDC (Body Domain Controller)</strong> startonderbrekersysteem. Dit zijn uiterst complexe computersystemen die de elektronische startblokkering beheren.
      </p>

      <h3>Waarom is BDC2 programmering zo complex?</h3>
      <p>
        Om een reservesleutel bij te maken voor een BMW met BDC-systeem, is het niet voldoende om simpelweg een apparaat op de OBD-poort aan te sluiten. De BDC-module moet in de meeste gevallen tijdelijk gedemonteerd worden om de EEPROM-chip rechtstreeks op de testbank (bench mode) uit te lezen.
      </p>
      <p>
        Hierop schrijven we een beveiligingssleutel (secret key) waarmee we vervolgens een nieuwe smart key kunnen autoriseren. Onze specialisten voeren deze specialistische ingreep wekelijks uit in onze Utrechtse werkplaats of ter plaatse in onze mobiele bus, 100% veilig en met behoud van al uw bestaande auto-instellingen.
      </p>
    </>
  ),
  'faraday-pouch-bescherming-relay-attack': (
    <>
      <h2>Faraday Pouch: Werkt het Echt Tegen Relay Attacks?</h2>
      <p>
        Een Faraday pouch (of signaalblokkerende hoes) is een klein etui gevoerd met een speciaal metaalgaas (de kooi van Faraday). Het blokkeert alle elektromagnetische signalen van uw keyless entry autosleutel, zodat dieven buiten het signaal niet kunnen opvangen.
      </p>

      <h3>Tips voor effectief gebruik</h3>
      <ul>
        <li><strong>Test de hoes:</strong> Doe uw sleutel in de Faraday pouch, loop naar uw auto en probeer de deur te openen. Als de deur op slot blijft, werkt de hoes naar behoren.</li>
        <li><strong>Slijtage:</strong> Door het in- en uithalen van de sleutel kan de metalen voering na verloop van tijd scheuren of slijten. Vervang de hoes daarom elke 12 tot 18 maanden.</li>
        <li><strong>Reservesleutel:</strong> Vergeet niet dat dieven ook het signaal van uw reservesleutel kunnen verlengen! Bewaar ook uw reserve-exemplaren in een signaalblokkerend metalen doosje in huis.</li>
      </ul>
    </>
  ),
  'toyota-hybride-sleutel-vervangen': (
    <>
      <h2>Toyota Hybride Smart Key Vervangen & Inleren</h2>
      <p>
        Toyota hybride voertuigen (zoals de Prius, Auris, Yaris en RAV4) behoren tot de meest betrouwbare auto's op de weg, maar hun sleutelsystemen zijn technologisch geavanceerd. Ze maken gebruik van actieve transponders met rollende codes (H-chip of DST-AES 128-bit encryptie) die continu communiceren met de startknop van de auto.
      </p>

      <h3>Onze methode voor Toyota Hybrides</h3>
      <p>
        Bij verlies of diefstal kunnen we ter plekke een nieuwe smart key inleren. We maken hierbij gebruik van de nieuwste Toyota-bypass kabels, waardoor we direct verbinding kunnen maken met de startonderbrekings-ECU zonder het dashboard te hoeven demonteren. Dit bespaart u tijd, voorkomt rammelende dashboarddelen en is 100% veilig voor het hybride accupakket.
      </p>
    </>
  ),
  'case-study-bmw-besparing': (
    <>
      <h2>Casus: BMW X5 Sleutel Kwijt in Utrecht</h2>
      <p>
        Vorige week kregen we een oproep van een wanhopige klant die zijn BMW X5 sleutel was verloren op het parkeerterrein bij de Jaarbeurs in Utrecht. Hij had geen reservesleutel en de auto stond op slot.
      </p>

      <h3>De dealeroplossing vs Autosleutel24</h3>
      <p>
        De officiële BMW dealer gaf aan dat de auto op een dieplader gezet moest worden en naar de werkplaats gesleept diende te worden. De levertijd voor de nieuwe sleutel was 5 werkdagen en de totale kosten (inclusief slepen, inleren en de smart key) bedroegen ruim €550.
      </p>
      <p>
        Onze monteur was binnen 25 minuten ter plaatse. Met een Lishi pick opende hij het portierslot binnen 3 minuten volledig schadevrij. Vervolgens heeft hij de BDC-module uitgelezen en binnen 45 minuten een originele OEM smart key geprogrammeerd en ingeleerd. De klant was direct weer mobiel en bespaarde ruim €250 én een hoop wachttijd.
      </p>
    </>
  ),
  'autosleutel-gestolen-wat-te-doen': (
    <>
      <h2>Autosleutel Gestolen of Auto Gestolen? Direct Actie Stappenplan</h2>
      <p>
        Het is schrikken: u komt erachter dat uw autosleutel is gestolen, bijvoorbeeld na een woninginbraak, zakkenrollerij, of verlies in een openbare ruimte. Omdat moderne autosleutels zenders zijn waarmee uw auto direct geopend en gestart kan worden, is de diefstal van een autosleutel een direct risico voor uw complete voertuig. Met dit stappenplan weet u precies wat u moet doen om autodiefstal te voorkomen en uw verzekeringsrechten veilig te stellen.
      </p>

      <h3>Stap 1: Beveilig uw voertuig fysiek</h3>
      <p>
        Staat de auto nog op de oprit of parkeerplaats? Zorg dat de auto direct buiten bereik van de gestolen sleutel is.
      </p>
      <ul>
        <li>Plaats de auto (indien mogelijk) direct in een afgesloten garage.</li>
        <li>Blokkeer de auto met een ander voertuig (bijvoorbeeld uw tweede auto er strak voor of achter parkeren).</li>
        <li>Gebruik een mechanisch stuurslot of wielklem als tijdelijke barrière. Dit schrikt dieven af die snel met de gestolen sleutel willen wegrijden.</li>
      </ul>

      <h3>Stap 2: Doe direct aangifte bij de politie</h3>
      <p>
        Aangifte doen van diefstal van uw autosleutel is wettelijk verplicht en cruciaal voor uw verzekering. Vraag om een kopie van het proces-verbaal. Zonder dit bewijs zal uw verzekeraar de kosten voor nieuwe sleutels en eventuele diefstal van het voertuig niet dekken.
      </p>

      <h3>Stap 3: Laat de gestolen sleutel direct deprogrammeren</h3>
      <p>
        Dit is de belangrijkste stap om diefstal te voorkomen. Neem direct contact op met <strong>Autosleutel24</strong>. Onze mobiele technicus komt met spoed naar u toe op locatie. 
      </p>
      <p>
        Via de OBD2-diagnosepoort loggen we in op de boardcomputer van uw auto. We kunnen de startmodule zo programmeren dat we de **gestolen autosleutel definitief wissen uit het geheugen**. De dief kan de auto dan met de gestolen afstandsbediening niet meer elektronisch openen en de motor weigert te starten. Tegelijkertijd programmeren en leveren we een nieuwe reservesleutel voor u.
      </p>

      <h3>Stap 4: Mechanische sloten aanpassen of hercoderen</h3>
      <p>
        Hoewel de dief de motor niet meer kan starten na het wissen van de sleutel uit de boordcomputer, kan hij de auto nog wel handmatig openen via de fysieke sleutelbaard in het deurslot. Om dit risico uit te sluiten, kunnen wij de cilinder van uw deurslot hercoderen (de interne plaatjes aanpassen) zodat de oude fysieke sleutelbaard ook mechanisch niet meer past.
      </p>

      <h3>Stap 5: Informeer uw verzekeringsmaatschappij</h3>
      <p>
        Meld de diefstal zo snel mogelijk bij uw autoverzekering. 
      </p>
      <ul>
        <li><strong>WA Beperkt Casco (WA+) & All-Risk:</strong> Dekt diefstal van sleutels en het herprogrammeren/vervangen van de sloten vaak volledig, mits er aantoonbaar aangifte is gedaan.</li>
        <li><strong>Sleuteloverdracht bij voertuigdiefstal:</strong> Let op dat de verzekeraar bij diefstal van de auto altijd zal vragen om alle originele sleutels te overhandigen om fraude uit te sluiten. Als u een sleutel mist door diefstal, moet u de factuur van de slotenmaker en het proces-verbaal kunnen overleggen.</li>
      </ul>
    </>
  ),
  'autosleutel-bijmaken-zonder-origineel': (
    <>
      <h2>Kan ik een autosleutel bijmaken zonder origineel?</h2>
      <p>
        Ja, het is absoluut mogelijk om een autosleutel te laten bijmaken zonder dat u de originele sleutel nog heeft. Wanneer u alle autosleutels kwijt bent (ook wel &apos;All Keys Lost&apos; genoemd), kan een professionele mobiele autosleutelspecialist een nieuwe werkende sleutel voor u maken. Dit gebeurt door de auto schadevrij te openen, de unieke mechanische code uit de slotcilinder te lezen en de elektronische startcode rechtstreeks op de startonderbreker (immobilizer) van uw boordcomputer te programmeren. U hoeft de auto dus niet te laten wegslepen naar de dealer. Dit artikel legt uit hoe dit in zijn werk gaat, wat de kosten zijn en beantwoordt de meest gestelde vragen.
      </p>

      <h3>Hoe werkt het maken van een autosleutel zonder origineel?</h3>
      <p>
        Het bijmaken van een autosleutel zonder de originele sleutel is een complex proces dat gespecialiseerde apparatuur en diepgaande kennis van auto-elektronica vereist. Waar een traditionele slotenmaker alleen huissleutels kopieert door ze fysiek over te trekken, moet een autosleutelspecialist de sleutel vanaf nul (from scratch) opbouwen. Dit proces bestaat uit vier opeenvolgende stappen:
      </p>
      
      <h4>Stap 1: De auto schadevrij openen (Noodopening)</h4>
      <p>
        Omdat u geen sleutel meer heeft, zit de auto in de meeste gevallen op slot. De eerste taak van de autosleutelmaker is om toegang te krijgen tot het interieur en de OBD2-diagnosepoort van de auto. Hiervoor worden specialistische lockpicks gebruikt (zoals Lishi decoders). Deze tools worden in de cilinder van het deurslot geplaatst om de interne plaatjes één voor één op de juiste hoogte uit te lijnen, net alsof de originele sleutel wordt omgedraaid. Hierdoor gaat de deur schadevrij open, zonder dat er ruiten hoeven te worden ingeslagen of deurrubbers worden beschadigd.
      </p>

      <h4>Stap 2: De mechanische sleutelcode decoderen</h4>
      <p>
        Zodra het deurslot in de open-positie staat, kan de technicus de mechanische sleutelcode &apos;lezen&apos;. Met een schaalverdeling op de decoder wordt de exacte diepte van elk slotplaatje opgemeten. Deze dieptes vormen een unieke code. Deze code voeren we in op onze computergestuurde CNC-sleutelsnijmachine (zoals de Condor XC-Mini) in de servicebus. De machine snijdt vervolgens binnen enkele minuten een gloednieuwe metalen sleutelbaard die perfect soepel draait in het deurslot en het contactslot.
      </p>

      <h4>Stap 3: De elektronische transponder programmeren</h4>
      <p>
        Een mechanisch passende sleutel is tegenwoordig niet meer voldoende om de motor te starten. Sinds 1995 is elke auto uitgerust met een startonderbreker (immobilizer). In de kop van de autosleutel zit een transponder chip. Wanneer u de sleutel in het contact steekt of start met de startknop, controleert de boordcomputer de unieke RFID-code van deze chip. Om de nieuwe chip in te leren, sluiten we onze programmeertool (zoals de Autel IM608 Pro) aan op de OBD2-poort van uw auto. We configureren de software en schrijven de unieke beveiligingscode (secret key) van de startmodule direct in de nieuwe transponder.
      </p>

      <h4>Stap 4: Verloren of gestolen sleutels blokkeren</h4>
      <p>
        Als extra beveiliging voeren we tijdens de OBD-programmering een database-reset uit. We wissen alle geregistreerde sleutels uit het geheugen van de boordcomputer en schrijven alleen de nieuwe sleutels erin. Mocht de verloren of gestolen sleutel later worden gevonden door een onbevoegde, dan kan deze de motor absoluut niet meer starten. De afstandsbediening is hiermee ook direct geblokkeerd.
      </p>

      <h3>Wat kost het bijmaken van een autosleutel zonder origineel?</h3>
      <p>
        De kosten voor het bijmaken van een sleutel bij verlies van alle sleutels (All Keys Lost) liggen logischerwijs hoger dan wanneer u een reservesleutel laat kopiëren op basis van een werkend origineel. Dit komt door de benodigde noodopening en het decodeerwerk. Gemiddeld kunt u uitgaan van de volgende tarieven:
      </p>
      <ul>
        <li><strong>Standaard autosleutel met transponder (zonder afstandsbediening):</strong> Vanaf €120 tot €160. Ideaal als goedkope noodoplossing.</li>
        <li><strong>Afstandsbediening klapsleutel (centrale vergrendeling):</strong> Vanaf €149 tot €220 voor de meeste gangbare merken (Opel, Ford, Peugeot, Renault, VW).</li>
        <li><strong>Smart Key / Keyless Entry (startknop):</strong> Vanaf €199 tot €299 voor premium merken (BMW, Audi, Toyota, Volvo).</li>
        <li><strong>Complexe immobilizers (o.a. Mercedes FBS4 of nieuwe VAG MQB48):</strong> Vanaf €250 tot €399 vanwege de noodzaak om online dealer-tokens aan te vragen of modules op de bench te programmeren.</li>
      </ul>

      <h3>Welke documenten heeft u nodig?</h3>
      <p>
        Om misbruik te voorkomen, hanteert een professionele autosleutelspecialist een streng protocol. Voordat we aan de slag gaan met de noodopening en het programmeren, dient u de volgende documenten te overleggen:
      </p>
      <ol>
        <li>Een geldig legitimatiebewijs (paspoort, ID-kaart of rijbewijs).</li>
        <li>Het kentekenbewijs (kentekencard of papieren deel 1B) op uw naam, óf een officieel aankoopbewijs/leasecontract dat aantoont dat u de rechtmatige gebruiker bent van het voertuig.</li>
      </ol>

      <h3>Veelgestelde Vragen (FAQ)</h3>
      <details style={{ borderBottom: '1px solid #e2e8f0', padding: '1rem 0' }}>
        <summary style={{ fontWeight: 700, cursor: 'pointer' }}>Wat kost een autosleutel bijmaken zonder origineel?</summary>
        <p style={{ marginTop: '0.5rem', color: '#475569' }}>
          De tarieven starten vanaf €120 voor oudere auto&apos;s en eenvoudige sleutels. Voor moderne smart keys met afstandsbediening ligt de prijs gemiddeld tussen de €180 en €290. Dit is inclusief de noodopening ter plaatse, het decoderen van het slot en het inleren van de chip.
        </p>
      </details>

      <details style={{ borderBottom: '1px solid #e2e8f0', padding: '1rem 0' }}>
        <summary style={{ fontWeight: 700, cursor: 'pointer' }}>Heb ik een codekaart of sleutelnummer nodig?</summary>
        <p style={{ marginTop: '0.5rem', color: '#475569' }}>
          Nee, dat is niet verplicht. Hoewel een mechanische sleutelcode of dealer-codekaart het proces versnelt, kunnen wij de mechanische code direct uit de fysieke slotcilinder uitlezen (decoderen) en de elektronische startcode rechtstreeks uit de startonderbreker-computer berekenen.
        </p>
      </details>

      <details style={{ borderBottom: '1px solid #e2e8f0', padding: '1rem 0' }}>
        <summary style={{ fontWeight: 700, cursor: 'pointer' }}>Hoe lang duurt het maken van een sleutel op locatie?</summary>
        <p style={{ marginTop: '0.5rem', color: '#475569' }}>
          Gemiddeld duurt het proces 30 tot 60 minuten ter plaatse. Bij zeer complexe startonderbrekersystemen (zoals BMW BDC/FEM of Mercedes FBS4) kan het inleren en programmeren op de bench circa 60 tot 120 minuten in beslag nemen.
        </p>
      </details>

      <details style={{ borderBottom: '1px solid #e2e8f0', padding: '1rem 0' }}>
        <summary style={{ fontWeight: 700, cursor: 'pointer' }}>Moet de auto naar de werkplaats worden gesleept?</summary>
        <p style={{ marginTop: '0.5rem', color: '#475569' }}>
          Nee, onze mobiele servicebus is een complete rijdende werkplaats uitgerust met CNC-machines en sleutelprogrammeerapparatuur. Wij lossen alles ter plaatse op, wat u dure sleepkosten bespaart.
        </p>
      </details>

      <details style={{ borderBottom: '1px solid #e2e8f0', padding: '1rem 0' }}>
        <summary style={{ fontWeight: 700, cursor: 'pointer' }}>Wat gebeurt er met de verloren of gestolen autosleutels?</summary>
        <p style={{ marginTop: '0.5rem', color: '#475569' }}>
          Tijdens de programmering van de nieuwe sleutel wissen we de verloren sleutels definitief uit het geheugen van de boordcomputer. Mocht iemand de verloren sleutel vinden, dan kan deze de motor niet meer starten.
        </p>
      </details>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "Wat kost een autosleutel bijmaken zonder origineel?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "De kosten beginnen vanaf €120 voor eenvoudige sleutels en liggen gemiddeld tussen de €180 en €290 voor smart keys. Dit is inclusief noodopening en programmering ter plaatse."
                }
              },
              {
                "@type": "Question",
                "name": "Heb ik een codekaart of sleutelnummer nodig?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Nee. De mechanische code wordt uit het slot gelezen en de transponder wordt rechtstreeks geprogrammeerd via de OBD2-poort van de auto."
                }
              },
              {
                "@type": "Question",
                "name": "Hoe lang duurt het maken van een sleutel op locatie?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Gemiddeld duurt het proces 30 tot 60 minuten ter plaatse in onze servicebus."
                }
              },
              {
                "@type": "Question",
                "name": "Moet de auto naar de werkplaats worden gesleept?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Nee. Onze mobiele technicus lost alles op de locatie op waar uw auto geparkeerd staat."
                }
              },
              {
                "@type": "Question",
                "name": "Wat gebeurt er met de verloren of gestolen autosleutels?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Verloren sleutels worden definitief uit de boordcomputer gewist, zodat ze de motor niet meer kunnen starten."
                }
              }
            ]
          })
        }}
      />
    </>
  ),
  'dealer-vs-mobiele-sleutelmaker': (
    <>
      <h2>Dealer vs Mobiele Sleutelmaker: Wat is Goedkoper?</h2>
      <p>
        Wanneer u een nieuwe autosleutel nodig heeft — of het nu gaat om een reservesleutel ter preventie of omdat u al uw sleutels bent verloren — staat u voor een belangrijke keuze. Gaat u naar de officiële merkdealer of schakelt u een mobiele autosleutelspecialist in? Op het eerste gezicht lijkt de dealer de meest vertrouwde optie, maar in de praktijk blijkt deze keuze bijna altijd de duurste en meest tijdrovende te zijn. In dit artikel maken we een gedetailleerde vergelijking op het gebied van kosten, snelheid, garantie en servicevoorwaarden. We onderbouwen dit met prijsberekeningen en drie praktijkscenario&apos;s, zodat u precies weet welke optie voor u het goedkoopst is.
      </p>

      <h3>Prijsvergelijkingstabel (Dealer vs Slotenmaker)</h3>
      <p>
        De onderstaande tabel toont de gemiddelde tarieven voor het bijmaken en programmeren van een autosleutel in 2026. Dit is een direct overzicht van de kosten bij de dealer (exclusief eventuele sleepkosten) versus de all-in tarieven van een mobiele specialist.
      </p>

      <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '2.5rem' }}>
        <table className="price-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ padding: '1rem' }}>Merk / Technologie</th>
              <th style={{ padding: '1rem' }}>Kosten Dealer (excl. slepen)</th>
              <th style={{ padding: '1rem' }}>Kosten Mobiele Specialist (all-in)</th>
              <th style={{ padding: '1rem' }}>Gemiddelde Besparing</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '1rem' }}><strong>Volkswagen Golf 7 (Klapsleutel)</strong></td>
              <td style={{ padding: '1rem' }}>€280 - €360</td>
              <td style={{ padding: '1rem' }}>€149 - €179</td>
              <td style={{ padding: '1rem', color: '#22c55e', fontWeight: 700 }}>45% - 50% besparing</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '1rem' }}><strong>BMW 3-Serie (F30 Smart Key)</strong></td>
              <td style={{ padding: '1rem' }}>€380 - €480</td>
              <td style={{ padding: '1rem' }}>€199 - €249</td>
              <td style={{ padding: '1rem', color: '#22c55e', fontWeight: 700 }}>47% - 52% besparing</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '1rem' }}><strong>Mercedes C-Klasse (FBS3 Infrarood)</strong></td>
              <td style={{ padding: '1rem' }}>€410 - €520</td>
              <td style={{ padding: '1rem' }}>€199 - €269</td>
              <td style={{ padding: '1rem', color: '#22c55e', fontWeight: 700 }}>48% - 51% besparing</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '1rem' }}><strong>Opel Corsa E (Afstandsbediening)</strong></td>
              <td style={{ padding: '1rem' }}>€220 - €290</td>
              <td style={{ padding: '1rem' }}>€129 - €159</td>
              <td style={{ padding: '1rem', color: '#22c55e', fontWeight: 700 }}>41% - 45% besparing</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '1rem' }}><strong>Toyota Yaris (Proximity Smart Key)</strong></td>
              <td style={{ padding: '1rem' }}>€350 - €450</td>
              <td style={{ padding: '1rem' }}>€189 - €229</td>
              <td style={{ padding: '1rem', color: '#22c55e', fontWeight: 700 }}>46% - 49% besparing</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '1rem' }}><strong>Ford Transit (Bedrijfswagen smart key)</strong></td>
              <td style={{ padding: '1rem' }}>€320 - €420</td>
              <td style={{ padding: '1rem' }}>€169 - €219</td>
              <td style={{ padding: '1rem', color: '#22c55e', fontWeight: 700 }}>47% - 48% besparing</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>Waarom is de dealer zo duur?</h3>
      <p>
        De prijsverschillen die u in de tabel ziet, zijn niet het gevolg van mindere kwaliteit bij de sleutelmaker. Ze ontstaan door de structuur van een dealerorganisatie:
      </p>
      <ol>
        <li><strong>Logistiek en transport:</strong> Dealers bestellen een sleutel op chassisnummer bij de autofabrikant (vaak in Duitsland of Frankrijk). U betaalt indirect voor de verzendkosten, administratieve kosten van de importeur en de marges van de fabriek.</li>
        <li><strong>Mandatoire uurlonen:</strong> Het inleren van de sleutel gebeurt in de werkplaats. Dealers hanteren uiterst hoge werkplaatstarieven (vaak tussen de €120 en €180 per uur) en rekenen een vast tarief voor diagnose en inleren, zelfs als dit slechts 15 minuten duurt.</li>
        <li><strong>Fysieke overhead:</strong> Een dealerpand, showroom en personeel brengen hoge vaste lasten met zich mee. Dit wordt doorberekend in de onderdelen en diensten. Een mobiele sleutelmaker werkt vanuit een efficiënt ingerichte servicebus, waardoor de overheadkosten minimaal zijn.</li>
      </ol>

      <h3>Tijdsvergelijking: Dezelfde dag versus weken wachten</h3>
      <p>
        Naast de prijs is tijd de belangrijkste factor, zeker als u al uw autosleutels kwijt bent. 
      </p>
      <ul>
        <li><strong>De dealerprocedure:</strong> U moet eerst fysiek naar de dealer met uw legitimatiebewijs en kentekenpapieren om de sleutel te bestellen. Vervolgens duurt het 3 tot 10 werkdagen voordat de sleutelbaard in de fabriek is gesneden en naar Nederland is verzonden. Zodra de sleutel binnen is, moet u een afspraak inplannen in de werkplaats om de transponder in te leren. Bent u al uw sleutels kwijt? Dan moet u de auto op eigen kosten naar de dealer laten slepen (€100 - €180).</li>
        <li><strong>De mobiele specialist:</strong> U belt of stuurt een WhatsApp-bericht. De monteur komt dezelfde dag nog naar de locatie waar de auto geparkeerd staat. Binnen 30 tot 60 minuten opent de monteur de deur schadevrij, snijdt de sleutelbaard met een CNC-machine ter plaatse en programmeert de transponder. U kunt direct weer rijden.</li>
      </ul>

      <h3>Garantie en Servicevoorwaarden</h3>
      <p>
        Zowel dealers als professionele sleutelmakers leveren garantie op hun diensten, maar de service verschilt sterk:
      </p>
      <ul>
        <li><strong>Dealergarantie:</strong> Geeft doorgaans 12 tot 24 maanden garantie op de sleutel. Mocht er echter een storing optreden, dan moet u de auto weer naar hun werkplaats brengen. De garantie dekt geen sleepkosten of storingen veroorzaakt door software-updates van derden.</li>
        <li><strong>Garantie van de mobiele specialist:</strong> Wij leveren standaard 12 maanden volledige garantie op de elektronica en de programmering. Mocht de sleutel binnen deze periode niet goed functioneren, dan komen wij kosteloos bij u op locatie langs om het probleem op te lossen. Dit is een unieke service die dealers niet bieden.</li>
      </ul>

      <h3>Drie Praktische Klantenscenario&apos;s</h3>

      <h4>Scenario 1: All Keys Lost bij een gezin op vakantie</h4>
      <p>
        Een gezin staat geparkeerd bij een recreatieplas in de buurt van Utrecht en verliest hun enige smart key van een Volkswagen Passat. 
        <br />
        <em>Dealer-aanpak:</em> De auto moet worden weggesleept naar de dealer in Utrecht (€150). De dealer bestelt de sleutel in Duitsland. Levertijd: 5 werkdagen. Het gezin moet vervangend vervoer regelen of de vakantie afbreken. Kosten: €350 sleutel + €150 slepen + €200 vervangend vervoer = €700.
        <br />
        <em>Slotenmaker-aanpak:</em> Onze monteur komt binnen 30 minuten naar de recreatieplas. We openen de Passat schadevrij en programmeren een nieuwe smart key. Binnen een uur rijdt het gezin weer verder. Kosten: €199 all-in. <strong>Totale besparing: €501 en geen vakantiestress.</strong>
      </p>

      <h4>Scenario 2: De reservesleutel voor een student</h4>
      <p>
        Een student heeft een tweedehands Peugeot 208 gekocht met slechts één sleutel en wil een reservesleutel ter preventie.
        <br />
        <em>Dealer-aanpak:</em> De dealer vraagt €240 voor een klapsleutel met afstandsbediening en rekent €80 voor het inleren. De student moet de auto een ochtend achterlaten in de werkplaats. Totale kosten: €320.
        <br />
        <em>Slotenmaker-aanpak:</em> De student plant een afspraak in bij zijn studentenwoning. De monteur snijdt en programmeert de sleutel ter plaatse terwijl de student studeert. Totale kosten: €149. <strong>Besparing: €171.</strong>
      </p>

      <h4>Scenario 3: De gestrande Mercedes Sprinter koerier</h4>
      <p>
        Een pakketbezorger verliest zijn sleutel van zijn Mercedes Sprinter bestelbus tijdens zijn bezorgroute. Elke dag dat de bus stilstaat, kost de ondernemer geld (downtime).
        <br />
        <em>Dealer-aanpak:</em> De bus moet naar de dealer gesleept worden (€180). De dealer heeft een wachttijd van 4 dagen voor de sleutel. De koerier mist 4 dagen omzet en moet een huurbus regelen. Totale kosten: €380 sleutel + €180 slepen + €400 huurbus + €800 omzetverlies = €1.760.
        <br />
        <em>Slotenmaker-aanpak:</em> Wij sturen onze mobiele bus met spoed naar de locatie van de gestrande Sprinter. We openen de deuren en programmeren een nieuwe infrarood sleutel direct op locatie. De koerier kan na 45 minuten zijn route vervolgen. Kosten: €249 all-in. <strong>Totale besparing: ruim €1.500.</strong>
      </p>

      <h3>Conclusie</h3>
      <p>
        De cijfers liegen niet. Een mobiele autosleutelspecialist is in 95% van de gevallen aanzienlijk goedkoper dan de dealer. U bespaart niet alleen 30% tot 50% op de sleutel zelf, maar voorkomt ook dure sleepkosten en dagenlange downtime. Bovendien profiteert u van het gemak van service aan huis of op locatie.
      </p>
    </>
  ),
  'sleutel-kwijt-utrecht-stappenplan': (
    <>
      <h2>Sleutel Kwijt in Utrecht: 5 Stappen Directe Hulp</h2>
      <p>
        Bent u uw autosleutel verloren of is uw autosleutel gestolen in Utrecht? Dit is een uiterst vervelende situatie, zeker als u geparkeerd staat op een drukke locatie zoals bij het Centraal Station, Hoog Catharijne, het Media Park of de Jaarbeurs Utrecht. Gelukkig hoeft u uw auto niet te laten wegslepen naar een dealer. Onze Utrechtse mobiele autosleutelservice komt direct naar u toe en lost het probleem ter plaatse op. Met onze 30-minuten reactietijd belofte zijn we supersnel bij u in Utrecht en omgeving. Volg dit directe 5-stappenplan om uw auto snel, veilig en schadevrij weer op weg te helpen.
      </p>

      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '1.5rem', margin: '2rem 0', textAlign: 'center' }}>
        <h3 style={{ color: '#1e40af', margin: '0 0 0.5rem 0' }}>🚨 DIRECT SPOEDHULP IN UTRECHT?</h3>
        <p style={{ color: '#1e3a8a', margin: '0 0 1rem 0', fontSize: '0.95rem' }}>Onze mobiele specialist rijdt direct naar u toe. Binnen 30 minuten ter plaatse in heel Utrecht.</p>
        <a href={`tel:${SITE_CONFIG.phoneTel}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#dc2626', color: '#fff', padding: '0.75rem 2rem', borderRadius: '6px', fontWeight: 700, textDecoration: 'none', fontSize: '1.1rem' }} id="utrecht-cta-1">
          📞 Bel Utrecht Direct: {SITE_CONFIG.phone}
        </a>
      </div>

      <h3>Het 5-Stappenplan bij Sleutelverlies in Utrecht</h3>
      
      <h4>Stap 1: Bepaal uw exacte locatie in Utrecht</h4>
      <p>
        Utrecht is een drukke stad met veel voetgangerszones en parkeergarages. Om onze monteur zo snel mogelijk naar u toe te sturen, is het belangrijk dat we uw exacte locatie weten. Staat u in parkeergarage Hoog Catharijne, op het parkeerterrein van de Jaarbeurs, langs de Oudegracht of in de wijk Lombok? Geef eventueel ook het kenteken en het merk van uw auto door, zodat we direct de juiste tools en sleutels kunnen inladen in onze bus.
      </p>

      <h4>Stap 2: Schakel onze spoedservice in</h4>
      <p>
        Zodra u contact met ons opneemt, vertrekt onze mobiele bus direct. Dankzij onze strategische standplaatsen rondom Utrecht (nabij de A2 en de A12) garanderen wij dat we **binnen 30 minuten bij u ter plaatse** zijn. Dit geldt voor alle wijken van Utrecht, waaronder Overvecht, Utrecht-Centrum, Utrecht-Zuid, Kanaleneiland, Lunetten en Leidsche Rijn.
      </p>

      <div style={{ background: '#f8fafc', borderLeft: '4px solid #f97316', padding: '1rem', margin: '1.5rem 0', borderRadius: '4px' }}>
        <strong>Onze 30-minuten belofte:</strong> Wij begrijpen dat u snel weer op weg wilt. Daarom streven wij ernaar om bij spoedoproepen in Utrecht binnen een half uur naast uw auto te staan.
      </div>

      <h4>Stap 3: Fysieke identiteits- en eigendomscontrole</h4>
      <p>
        Om te garanderen dat we de auto openen voor de rechtmatige eigenaar, voert onze monteur een korte check uit. We vragen u om uw legitimatiebewijs en het kentekenbewijs van het voertuig te tonen. Zodra dit is geverifieerd, gaan we direct aan de slag om de deuren te openen.
      </p>

      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '1.5rem', margin: '2rem 0', textAlign: 'center' }}>
        <h3 style={{ color: '#1e40af', margin: '0 0 0.5rem 0' }}>🔑 AUTOSLEUTEL BIJMAKEN UTRECHT</h3>
        <p style={{ color: '#1e3a8a', margin: '0 0 1rem 0', fontSize: '0.95rem' }}>Voorkom sleepkosten en hoge dealertarieven. Wij maken uw sleutel direct ter plaatse.</p>
        <a href={`tel:${SITE_CONFIG.phoneTel}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#dc2626', color: '#fff', padding: '0.75rem 2rem', borderRadius: '6px', fontWeight: 700, textDecoration: 'none', fontSize: '1.1rem' }} id="utrecht-cta-2">
          📞 Bel Nu voor een Monteur: {SITE_CONFIG.phone}
        </a>
      </div>

      <h4>Stap 4: Schadevrije opening van uw portier</h4>
      <p>
        Onze monteur gebruikt professioneel lockpickgereedschap om de slotcilinder van uw autodeur schadevrij te openen. Deze methode simuleert de mechanische werking van uw sleutel, waardoor we de auto kunnen openen zonder ramen in te slaan of deurrubbers te beschadigen. Nadat de deuren open zijn, decoderen we het slot en snijden we ter plaatse een nieuwe sleutelbaard met onze computergestuurde CNC-machine.
      </p>

      <h4>Stap 5: Programmering en blokkering van de verloren sleutel</h4>
      <p>
        Als laatste stap sluiten we onze diagnose-apparatuur aan op de OBD-poort van uw auto. We programmeren de nieuwe transponder chip in de computer van de auto zodat u de motor kunt starten. Tegelijkertijd wissen we de verloren autosleutel definitief uit de boordcomputer van het voertuig. Mocht iemand uw verloren sleutel vinden op de Neude of bij de Domtoren, dan kan deze de auto er niet mee starten.
      </p>

      <h3>Waarom Kiezen voor onze Utrechtse Autosleutelservice?</h3>
      <p>
        Wij zijn de meest betrouwbare en snelle autosleutelmaker in de regio Utrecht. Enkele voordelen van onze mobiele service:
      </p>
      <ul>
        <li><strong>Geen sleepkosten:</strong> U hoeft uw auto niet te laten wegslepen naar een dealer in Utrecht, wat u al snel €150 bespaart.</li>
        <li><strong>Dealer-kwaliteit apparatuur:</strong> Wij gebruiken geavanceerde systemen om sleutels in te leren voor alle merken en modellen (inclusief Volkswagen, BMW, Mercedes, Audi, Ford, Opel).</li>
        <li><strong>12 maanden garantie:</strong> U ontvangt standaard 12 maanden volledige garantie op de werking van de nieuwe sleutel en de transponder chip, inclusief een verzekeringsklare factuur.</li>
      </ul>

      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '1.5rem', margin: '2rem 0', textAlign: 'center' }}>
        <h3 style={{ color: '#1e40af', margin: '0 0 0.5rem 0' }}>🚗 GEEN SLEEPKOSTEN IN UTRECHT</h3>
        <p style={{ color: '#1e3a8a', margin: '0 0 1rem 0', fontSize: '0.95rem' }}>Wij lossen alles op de parkeerplaats of bij u op de oprit op. 24/7 bereikbaar.</p>
        <a href={`tel:${SITE_CONFIG.phoneTel}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#dc2626', color: '#fff', padding: '0.75rem 2rem', borderRadius: '6px', fontWeight: 700, textDecoration: 'none', fontSize: '1.1rem' }} id="utrecht-cta-3">
          📞 Bel Ons Storingsnummer: {SITE_CONFIG.phone}
        </a>
      </div>

      <p>
        Voor een uitgebreide toelichting over onze specifieke dienstverlening in Utrecht bij sleutelverlies, kunt u terecht op onze servicepagina: <Link href="/steden/utrecht/autosleutel-kwijt" style={{ fontWeight: 700, color: '#f97316' }}>Autosleutel Kwijt Utrecht</Link>.
      </p>

      <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '1.5rem', margin: '2rem 0', textAlign: 'center' }}>
        <h3 style={{ color: '#991b1b', margin: '0 0 0.5rem 0' }}>📞 24/7 SPOEDNUMMER UTRECHT</h3>
        <p style={{ color: '#7f1d1d', margin: '0 0 1rem 0', fontSize: '0.95rem' }}>Staat u momenteert gestrand in de regio Utrecht? Aarzel niet en bel ons direct.</p>
        <a href={`tel:${SITE_CONFIG.phoneTel}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#dc2626', color: '#fff', padding: '0.75rem 2rem', borderRadius: '6px', fontWeight: 700, textDecoration: 'none', fontSize: '1.1rem' }} id="utrecht-cta-4">
          Bel Direct: {SITE_CONFIG.phone}
        </a>
      </div>
    </>
  ),
  'autosleutel-bijmaken-tips-snel-veilig': (
    <>
      <h2>Wat is het proces van autosleutel bijmaken?</h2>
      <p>
        Het bijmaken van een autosleutel is een proces dat begint met het identificeren van het type sleutel dat je nodig hebt. Moderne autosleutels zijn vaak meer dan alleen een stuk metaal; ze kunnen transponders of slimme technologie bevatten die communiceren met het voertuig. Het eerste wat Autosleutel24 als gespecialiseerde mobiele slotenmaker zal doen, is je huidige sleutel analyseren om te bepalen welk type sleutel je nodig hebt. Dit kan variëren van een eenvoudige mechanische sleutel tot een complexe sleutel met ingebouwde elektronische componenten.
      </p>
      <p>
        Het volgende deel van het proces is het fysiek dupliceren van de sleutel. Voor mechanische sleutels betekent dit het slijpen van een nieuw sleuteltje dat past in het slot van je auto. Voor sleutels met elektronische componenten, zoals transponders, moet de nieuwe sleutel ook worden geprogrammeerd om te communiceren met de boordcomputer van je voertuig. Dit vereist onze specialistische apparatuur en kennis.
      </p>
      <p>
        Na het fysiek bijmaken en programmeren van de sleutel, is de laatste stap het testen ervan. Onze technicus zal ervoor zorgen dat de nieuwe sleutel perfect werkt, zowel mechanisch als elektronisch. Dit betekent dat de sleutel niet alleen moet passen in het slot, maar ook de motor moet kunnen starten en eventuele alarmsystemen moet kunnen uitschakelen. Pas nadat de sleutel is getest en goedgekeurd, zal hij aan jou worden overhandigd.
      </p>

      <h3>Wanneer is het nodig om een autosleutel bij te maken?</h3>
      <p>
        Er zijn verschillende scenario's waarin het nodig kan zijn om een autosleutel bij te maken. Een van de meest voorkomende redenen is verlies of diefstal van de originele sleutel. In zo'n situatie is het essentieel om snel een nieuwe sleutel te laten maken om weer toegang te krijgen tot je voertuig en de veiligheid ervan te waarborgen. Het hebben van een reservesleutel kan je ook veel tijd en stress besparen in noodsituaties.
      </p>
      <p>
        Een andere situatie waarin je een autosleutel moet bijmaken, is wanneer je huidige sleutel beschadigd of versleten is. Sleutels kunnen na verloop van tijd slijten door regelmatig gebruik, wat kan leiden tot problemen bij het openen van deuren of het starten van de motor. Als je merkt dat je sleutel moeilijk in het slot past of niet goed meer werkt, is het een goed idee om een nieuwe sleutel te laten bijmaken voordat de oude volledig faalt.
      </p>
      <p>
        Daarnaast kan het handig zijn om extra sleutels te hebben voor meerdere bestuurders van hetzelfde voertuig. Als je auto gedeeld wordt, voorkomt dit dat je sleutels constant moet uitwisselen en maakt het het leven een stuk eenvoudiger voor iedereen.
      </p>

      <h3>Verschillende soorten autosleutels en hun kenmerken</h3>
      <p>
        Een van de meest basale typen is de mechanische sleutel, meestal gemaakt van metaal zonder elektronische componenten. Deze zijn eenvoudig en goedkoop om bij te maken, maar bieden weinig beveiliging.
      </p>
      <p>
        Een stapje hoger in complexiteit zijn de transpondersleutels. Deze sleutels bevatten een kleine elektronische chip die communiceert met de boordcomputer van de auto. Wanneer je de sleutel in het contact steekt, stuurt de chip een unieke code naar de computer, die de motor alleen start als de code correct is.
      </p>
      <p>
        Nog geavanceerder zijn de slimme sleutels, ook wel bekend als keyless entry-sleutels. Deze sleutels maken gebruik van radiogolven om met de auto te communiceren, waardoor je de deuren kunt ontgrendelen en de motor kunt starten zonder de sleutel fysiek in het slot of contact te steken. Bij Autosleutel24 hebben we de apparatuur om al deze typen sleutels te dupliceren.
      </p>

      <h3>Voor- en nadelen van het zelf bijmaken van autosleutels</h3>
      <p>
        Het zelf bijmaken van autosleutels kan enkele voordelen bieden in termen van kostenbesparing voor simpele, oude mechanische sleutels. Echter, het zelf bijmaken kent aanzienlijke nadelen. Het risico dat de sleutel niet correct wordt bijgemaakt is groot, wat kan leiden tot beschadiging van uw slot.
      </p>
      <p>
        Voor sleutels met elektronische componenten zoals transponders of slimme sleutels is gespecialiseerde kennis en dure uitleesapparatuur nodig. Een fout tijdens dit proces kan de boordcomputer (ECU) of de startonderbreker van uw voertuig beschadigen, wat resulteert in torenhoge reparatiekosten bij de dealer. Daarom is het essentieel om deze taak aan professionals zoals Autosleutel24 over te laten.
      </p>

      <h3>Professionele diensten voor autosleutel bijmaken</h3>
      <p>
        Het inschakelen van een professionele mobiele dienst zoals Autosleutel24 biedt een scala aan voordelen. Onze slotenmakers hebben de expertise, ervaring en de meest actuele diagnose-apparatuur om de meest geavanceerde autosleutels bij te maken. Dit omvat niet alleen de fysieke duplicatie, maar ook het uitlezen van pincodes en het inleren van de transponders.
      </p>
      <p>
        Een ander voordeel is de garantie. Mocht er iets misgaan met de nieuwe sleutel, dan krijgt u bij ons garantie en directe ondersteuning. Dit geeft zekerheid en gemoedsrust.
      </p>

      <h3>Kosten van het bijmaken van een autosleutel</h3>
      <p>
        De kosten van het bijmaken van een autosleutel variëren afhankelijk van het type sleutel en de complexiteit van de technologie. Mechanische sleutels zonder chip zijn erg goedkoop. Transpondersleutels (inclusief het inleren) variëren vaak van €89 tot €150.
      </p>
      <p>
        Slimme sleutels of keyless entry-sleutels zijn de duurste om bij te maken omdat ze gebruik maken van geavanceerde RFID- en cryptografische technologieën. Dit kan oplopen tot €150 - €300. Bij Autosleutel24 geven we echter altijd vooraf een vaste, transparante prijsopgave.
      </p>

      <h3>Tips voor het kiezen van een betrouwbare slotenmaker</h3>
      <p>
        Kies altijd een specialist met positieve recensies en de juiste apparatuur voor uw specifieke automerk. Transparantie over prijzen is cruciaal: vermijd partijen die geen duidelijke prijsopgave vooraf willen geven. Bij Autosleutel24 weet u direct waar u aan toe bent.
      </p>

      <h3>Preventieve maatregelen tegen autosleutelverlies</h3>
      <p>
        Zorg altijd dat u een werkende reservesleutel in huis heeft. Het preventief laten bijmaken van een autosleutel is altijd veel goedkoper dan een 'All Keys Lost' noodsituatie waarbij we op locatie in de avonduren een compleet nieuwe sleutel moeten inlezen zonder origineel. Een Bluetooth-sleutelfinder (zoals een Apple AirTag) kan daarnaast veel stress besparen als u vaak uw sleutels binnenshuis kwijtraakt.
      </p>

      <div style={{ background: '#f8fafc', borderLeft: '4px solid #0f62fe', padding: '1rem', margin: '1.5rem 0', borderRadius: '4px' }}>
        <strong>Snel een autosleutel bijmaken?</strong> Autosleutel24 komt als mobiele service naar uw locatie. Bel ons direct op <a href={WHATSAPP_URL} style={{ color: '#0f62fe', fontWeight: 'bold', textDecoration: 'underline' }}>06 11 75 12 31</a> voor een vaste, vrijblijvende prijsopgave!
      </div>
    </>
  ),
};

