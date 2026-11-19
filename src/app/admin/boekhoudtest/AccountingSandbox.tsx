'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PageHead, Card, Table, ui } from '../_ui';
import { usePreviewLanguage } from '../PreviewLanguage';
import helpStyles from '../voorraad/keyforcars.module.css';
import styles from './sandbox.module.css';

type Text = [nl: string, en: string];
type Scenario = { title: Text; purpose: Text; rows: [Text, string][]; steps: [action: Text, result: Text][] };

const scenarios: Scenario[] = [
  {
    title: ['Bankafstemming', 'Bank reconciliation'],
    purpose: ['Koppel een ontvangen betaling aan de juiste openstaande factuur.', 'Match an incoming payment to the correct outstanding invoice.'],
    rows: [[['Banktransactie', 'Bank transaction'], '€ 121,00 · KFC-TEST-001'], [['Openstaande factuur', 'Outstanding invoice'], '€ 121,00 · KFC-TEST-001']],
    steps: [
      [['Zoek een overeenkomst', 'Find a match'], ['Bedrag en factuurreferentie komen overeen.', 'Amount and invoice reference match.']],
      [['Bevestig de testmatch', 'Confirm test match'], ['Factuurstatus in dit scenario: betaald.', 'Invoice status in this scenario: paid.']],
    ],
  },
  {
    title: ['Periodieke facturen', 'Recurring invoices'],
    purpose: ['Bekijk wat er gebeurt wanneer een terugkerende factuur gepland staat.', 'See what happens when a recurring invoice is due.'],
    rows: [[['Abonnement', 'Subscription'], 'KFC-TEST-SUB'], [['Frequentie', 'Frequency'], '1× / 1 mo.'], [['Bedrag', 'Amount'], '€ 29,00']],
    steps: [
      [['Simuleer de volgende factuurdatum', 'Simulate the next billing date'], ['Concept TEST-REC-001 staat klaar voor € 29,00.', 'Draft TEST-REC-001 is ready for €29.00.']],
      [['Simuleer de verzending', 'Simulate sending'], ['De testfactuur is gemarkeerd als verzonden.', 'The test invoice is marked as sent.']],
    ],
  },
  {
    title: ['Peppol', 'Peppol'],
    purpose: ['Controleer een ontvanger en doorloop elektronische factuurbezorging.', 'Look up a recipient and walk through electronic invoice delivery.'],
    rows: [[['Testontvanger', 'Test recipient'], 'KFC Test BV'], [['Conceptfactuur', 'Draft invoice'], 'TEST-PEPPOL-001 · € 121,00']],
    steps: [
      [['Simuleer ontvangercontrole', 'Simulate recipient lookup'], ['Voorbeeldontvanger gevonden in de gesimuleerde directory.', 'Sample recipient found in the simulated directory.']],
      [['Simuleer Peppol-verzending', 'Simulate Peppol delivery'], ['Gesimuleerde ontvangstbevestiging voor TEST-PEPPOL-001.', 'Simulated delivery receipt for TEST-PEPPOL-001.']],
    ],
  },
  {
    title: ['Offerte en goedkeuring', 'Quote and acceptance'],
    purpose: ['Doorloop klantgoedkeuring en neem de offerte over in een factuurconcept.', 'Walk through customer approval and turn a quote into an invoice draft.'],
    rows: [[['Offerte', 'Quote'], 'TEST-Q-001'], [['Bedrag', 'Amount'], '€ 242,00']],
    steps: [
      [['Simuleer ondertekening', 'Simulate signature'], ['Testklant heeft offerte TEST-Q-001 geaccepteerd.', 'The sample customer accepted quote TEST-Q-001.']],
      [['Maak een conceptfactuur', 'Create an invoice draft'], ['Concept TEST-Q-INV-001 neemt het offertebedrag van € 242,00 over.', 'Draft TEST-Q-INV-001 carries over the quoted €242.00.']],
    ],
  },
  {
    title: ['Inkomende documenten', 'Incoming documents'],
    purpose: ['Controleer herkende gegevens van een leveranciersfactuur voordat je die goedkeurt.', 'Review extracted supplier invoice data before approval.'],
    rows: [[['E-mailbijlage', 'Email attachment'], 'supplier-test-001.pdf'], [['Afzender', 'Sender'], 'supplier@example.invalid']],
    steps: [
      [['Simuleer herkenning', 'Simulate document recognition'], ['Voorbeeldvelden: leverancier Test BV, factuur TEST-SUP-001, € 60,50 inclusief € 10,50 btw.', 'Sample fields: supplier Test BV, invoice TEST-SUP-001, €60.50 including €10.50 VAT.']],
      [['Keur het testdocument goed', 'Approve test document'], ['Status in de testinbox: verwerkt.', 'Status in the test inbox: processed.']],
    ],
  },
  {
    title: ['Projecten en uren', 'Projects and time'],
    purpose: ['Vergelijk gewerkte uren met het budget en factureer de declarabele uren.', 'Compare time worked with the budget and invoice the billable hours.'],
    rows: [[['Project', 'Project'], 'KFC-PROJECT-TEST'], [['Urenbudget', 'Hour budget'], '12 h'], [['Declarabel', 'Billable'], '4,5 h × € 60,00']],
    steps: [
      [['Controleer het urenbudget', 'Check the hour budget'], ['4,5 van de 12 uur geregistreerd. Er resteert 7,5 uur.', '4.5 of 12 hours logged. 7.5 hours remain.']],
      [['Zet uren op de testfactuur', 'Add hours to test invoice'], ['Conceptregel: 4,5 uur × € 60,00 = € 270,00 excl. btw.', 'Draft line: 4.5 hours × €60.00 = €270.00 excluding VAT.']],
    ],
  },
  {
    title: ['Btw-aangifte', 'VAT return'],
    purpose: ['Bekijk het verschil tussen btw op omzet en voorbelasting in een testaangifte.', 'Review output VAT minus input VAT in a sample return.'],
    rows: [[['Btw op omzet', 'Output VAT'], '€ 210,00'], [['Voorbelasting', 'Input VAT'], '€ 84,00']],
    steps: [
      [['Bereken de testaangifte', 'Calculate test return'], ['Testsaldo: € 210,00 − € 84,00 = € 126,00.', 'Test balance: €210.00 − €84.00 = €126.00.']],
      [['Simuleer de indiening', 'Simulate filing'], ['Testscenario voltooid. Er is geen aangifte verzonden.', 'Test scenario complete. No return was filed.']],
    ],
  },
];

export default function AccountingSandbox() {
  const { english, t } = usePreviewLanguage();
  const copy = ([nl, en]: Text) => english ? en : nl;
  const [selected, setSelected] = useState(0);
  const [progress, setProgress] = useState(0);
  const scenario = scenarios[selected];
  const next = scenario.steps[progress];

  return (
    <section className={styles.shell}>
      <PageHead title={t('Boekhoudtest')} sub={copy([
        'Doorloop boekhoudscenario’s met fictieve gegevens. De test wijzigt geen CRM-records en verstuurt niets.',
        'Try accounting workflows with fictional data. The sandbox updates no CRM records and sends nothing.',
      ])} actions={
        <details className={helpStyles.stockHelp}>
          <summary aria-label={copy(['Uitleg over de Boekhoudtest', 'Accounting Sandbox Help'])}><span aria-hidden="true">?</span></summary>
          <dl>
            <div><dt>{copy(['Kies Een Scenario', 'Choose a Scenario'])}</dt><dd>{copy(['Selecteer een scenario en bekijk de voorbeeldgegevens voordat je de eerste stap uitvoert.', 'Select a scenario and check the sample data before starting the first step.'])}</dd></div>
            <div><dt>{copy(['Bekijk Het Resultaat', 'Review the Result'])}</dt><dd>{copy(['Na elke stap verschijnt het resultaat. Met Opnieuw Starten ga je terug naar het begin van het scenario.', 'Each step displays its result. Use Reset Scenario to return to the start.'])}</dd></div>
            <div><dt>{copy(['Bankaansluiting Oefenen', 'Practice Bank Reconciliation'])}</dt><dd><Link href="/admin/bank/transacties">{copy(['Open Banktransacties', 'Open Transactions'])}</Link>{copy([' om te zien hoe een bevestigde match het openstaande factuurbedrag wijzigt.', ' to see how confirming a match updates the outstanding balance.'])}</dd></div>
          </dl>
        </details>
      } />
      <div className={styles.layout}>
        <nav className={styles.menu} aria-label={copy(['Testscenario’s', 'Test scenarios'])}>
          {scenarios.map(({ title }, index) => (
            <button key={title[0]} type="button" aria-pressed={index === selected} onClick={() => {
              if (index === selected) return;
              setSelected(index);
              setProgress(0);
            }}>{copy(title)}</button>
          ))}
        </nav>
        <div className={styles.scenario}>
          <h2>{copy(scenario.title)}</h2>
          <p>{copy(scenario.purpose)}</p>
          <small>{copy(['Afgeronde stappen', 'Completed steps'])} {progress} / {scenario.steps.length}</small>
          <Card>
            <Table head={<><th scope="col">{copy(['Voorbeeldgegeven', 'Sample field'])}</th><th scope="col">{copy(['Waarde', 'Value'])}</th></>}>
              {scenario.rows.map(([label, value]) => <tr key={label[0]}><td>{copy(label)}</td><td>{value}</td></tr>)}
            </Table>
          </Card>
          <div aria-live="polite">
            {progress > 0 && <ol className={styles.results}>
              {scenario.steps.slice(0, progress).map(([action, result]) => <li key={action[0]}>{copy(result)}</li>)}
            </ol>}
          </div>
          <div className={styles.actions}>
            {next && <button className={`${ui.btn} ${ui.btnPrimary}`} type="button" onClick={() => setProgress(progress + 1)}>{copy(next[0])}</button>}
            {progress > 0 && <button className={ui.btn} type="button" onClick={() => setProgress(0)}>{copy(['Opnieuw starten', 'Reset scenario'])}</button>}
            {selected === 0 && <Link className={ui.btn} href="/admin/bank/transacties">{copy(['Oefen In Banktransacties', 'Practice in Transactions'])}</Link>}
          </div>
        </div>
      </div>
    </section>
  );
}
