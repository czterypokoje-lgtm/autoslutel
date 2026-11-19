'use client';

import { useRef, useState, useSyncExternalStore, type FormEvent } from 'react';
import { Database, ExternalLink, Mail, MessageCircle, PencilRuler, Plus, Workflow } from 'lucide-react';
import { usePreviewLanguage } from '../PreviewLanguage';
import { PageHead } from '../_ui';
import styles from '../admin.module.css';

const integrations = [
  { id: 'whatsapp', name: 'WhatsApp Chatbot', icon: MessageCircle, nl: 'Ontvang berichten en volg chatbotgesprekken op.', en: 'Receive messages and follow up on chatbot conversations.' },
  { id: 'email', name: 'E-mail', icon: Mail, nl: 'Verstuur e-mails en meldingen vanuit het CRM.', en: 'Send emails and notifications from the CRM.' },
  { id: 'supabase', name: 'Supabase', icon: Database, nl: 'Verbind gebruikersaccounts en CRM-gegevens.', en: 'Connect user accounts and CRM data.' },
  { id: 'automation', name: 'Automatiseringen', icon: Workflow, nl: 'Koppel gebeurtenissen, geplande taken en workflows.', en: 'Connect events, scheduled tasks, and workflows.' },
  { id: 'excalidraw', name: 'Excalidraw', icon: PencilRuler, nl: 'Test een CRM-scherm of gebruikersstroom met fictieve gegevens.', en: 'Test a CRM screen or workflow using sample data.' },
] as const;

const storageKey = 'keyforcars-integration-drafts';
const setup = {
  whatsapp: ['Koppel je zakelijke WhatsApp-nummer aan je chatbot. Laat de beheerder de CRM-webhook en serverreferenties instellen. Test met een apart nummer.', 'Connect your business WhatsApp number to your chatbot. Ask your administrator to configure the CRM webhook and server credentials. Test with a separate number.'],
  email: ['Verifieer het afzenderdomein in Resend. Stel de afzender en API-sleutel op de server in en verstuur een testmail.', 'Verify the sending domain in Resend. Configure the sender and API key on the server, then send a test email.'],
  supabase: ['Maak een testproject aan, pas de CRM-migraties toe en configureer de project-URL en sleutels op de server. Controleer daarna een kantoorlogin.', 'Create a test project, apply the CRM migrations, and configure its URL and keys on the server. Then verify an office login.'],
  automation: ['Kies een gebeurtenis of planning. Configureer de bestaande webhook of geplande taak op de server en controleer de uitvoering met voorbeeldgegevens.', 'Choose an event or schedule. Configure the existing webhook or scheduled task on the server and verify a run with sample data.'],
  excalidraw: ['Voeg het ontwerp als test toe en open Excalidraw. Schets de stappen met fictieve gegevens.', 'Add the design test and open Excalidraw. Sketch the workflow using fictional data.'],
} as const;

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener(storageKey, callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener(storageKey, callback);
  };
}

function readDrafts() {
  try {
    return localStorage.getItem(storageKey) ?? '';
  } catch {
    return '';
  }
}

export default function IntegrationSetup() {
  const { english, t } = usePreviewLanguage();
  const modal = useRef<HTMLDialogElement>(null);
  const drafts = useSyncExternalStore(subscribe, readDrafts, () => '').split(',').filter(Boolean);
  const available = integrations.filter(({ id }) => !drafts.includes(id));
  const [saveError, setSaveError] = useState(false);

  function addIntegration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const provider = new FormData(event.currentTarget).get('provider');
    if (!integrations.some(({ id }) => id === provider)) return;
    try {
      const currentDrafts = readDrafts().split(',').filter(Boolean);
      localStorage.setItem(storageKey, [...new Set([...currentDrafts, String(provider)])].join(','));
      window.dispatchEvent(new Event(storageKey));
      event.currentTarget.reset();
      modal.current?.close();
    } catch {
      setSaveError(true);
    }
  }

  return (
    <section>
      <PageHead
        title={t('Integraties')}
        sub={english ? 'Prepare integrations and design tests for this workspace.' : 'Bereid integraties en ontwerptests voor deze werkruimte voor.'}
        actions={<button className={styles.integrationPrimary} type="button" disabled={!available.length} onClick={() => {
          setSaveError(false);
          modal.current?.showModal();
        }}><Plus size={17} aria-hidden="true" />{english ? 'Add integration' : 'Integratie toevoegen'}</button>}
      />
      <div className={styles.integrationGrid}>
        {integrations.map(({ id, name, icon: Icon, nl, en }) => {
          const added = drafts.includes(id);
          return (
            <article className={styles.integrationCard} key={id}>
              <div className={styles.integrationCardTop}>
                <Icon aria-hidden="true" size={22} />
                <details className={styles.integrationHelp}>
                  <summary aria-label={english ? `Setup help for ${t(name)}` : `Hulp bij ${t(name)}`}>?</summary>
                  <div><strong>{english ? 'How to set it up' : 'Zo stel je het in'}</strong><p>{setup[id][english ? 1 : 0]}</p></div>
                </details>
              </div>
              <h2>{t(name)}</h2>
              <p>{english ? en : nl}</p>
              <span className={styles.integrationStatus}>{added
                ? (id === 'excalidraw' ? (english ? 'Test added' : 'Test toegevoegd') : (english ? 'Draft · setup required' : 'Concept · installatie vereist'))
                : (english ? 'Available to add' : 'Beschikbaar om toe te voegen')}</span>
              {added && id === 'excalidraw' && (
                <>
                  <p>{english ? 'Sketch the screen, walk through the flow, and note any issues.' : 'Schets het scherm, doorloop de stappen en noteer verbeterpunten.'}</p>
                  <a className={styles.integrationLink} href="https://excalidraw.com/" target="_blank" rel="noreferrer">
                    <ExternalLink size={15} aria-hidden="true" />Open Excalidraw
                  </a>
                </>
              )}
            </article>
          );
        })}
      </div>
      <dialog ref={modal} className={styles.integrationDialog} aria-labelledby="integration-dialog-title">
        <form onSubmit={addIntegration}>
          <h2 id="integration-dialog-title">{english ? 'Add integration' : 'Integratie toevoegen'}</h2>
          <p>{english ? 'Saved in this browser. Live connections require server configuration.' : 'Wordt in deze browser opgeslagen. Voor liveverbindingen is serverconfiguratie nodig.'}</p>
          <fieldset className={styles.integrationChoices}>
            <legend>{english ? 'Choose a service or test' : 'Kies een dienst of test'}</legend>
            {available.map(({ id, name, icon: Icon, nl, en }) => <label className={styles.integrationChoice} key={id}>
              <input type="radio" name="provider" value={id} required />
              <Icon size={18} aria-hidden="true" />
              <span><strong>{t(name)}</strong><small>{english ? en : nl}</small></span>
            </label>)}
          </fieldset>
          {saveError && <p role="alert">{english ? 'Could not save in this browser.' : 'Opslaan in deze browser is mislukt.'}</p>}
          <div className={styles.integrationActions}>
            <button className={styles.integrationCancel} type="button" onClick={() => modal.current?.close()}>{english ? 'Cancel' : 'Annuleren'}</button>
            <button className={styles.integrationPrimary} type="submit">{english ? 'Add' : 'Toevoegen'}</button>
          </div>
        </form>
      </dialog>
    </section>
  );
}
