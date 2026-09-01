const fs = require('fs');
const path = './src/components/VehicleWizard/VehicleWizard.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add WorkingKeyType and update TOTAL_STEPS
content = content.replace(
  "type RemoteType = 'yes' | 'no';",
  "type RemoteType = 'yes' | 'no';\ntype WorkingKeyType = 'yes' | 'no';"
);
content = content.replace("const TOTAL_STEPS = 4;", "const TOTAL_STEPS = 5;");

// 2. Update quoteFor
content = content.replace(
  "function quoteFor(start: StartType | null, remote: RemoteType | null) {",
  "function quoteFor(start: StartType | null, remote: RemoteType | null, workingKey: WorkingKeyType | null) {"
);
content = content.replace(
  "if (start === 'push') {",
  "if (workingKey === 'no') {\n    return {\n      service: 'Alle sleutels kwijt (noodaanmaak)',\n      from: SITE_CONFIG.prices.allKeysLost,\n    };\n  }\n  if (start === 'push') {"
);

// 3. Add workingKey state
content = content.replace(
  "const [remote, setRemote] = useState<RemoteType | null>(null);",
  "const [remote, setRemote] = useState<RemoteType | null>(null);\n  const [workingKey, setWorkingKey] = useState<WorkingKeyType | null>(null);"
);

// 4. Update quoteFor call
content = content.replace(
  "const quote = quoteFor(startType, remote);",
  "const quote = quoteFor(startType, remote, workingKey);"
);

// 5. Update buildWhatsAppUrl
content = content.replace(
  "`Sleuteltype: ${quote.service}`,",
  "`Sleuteltype: ${quote.service}`,\n      `Werkende sleutel: ${workingKey === 'yes' ? 'Ja' : 'Nee, alle sleutels kwijt'}`, \n      `Start met: ${startType === 'push' ? 'Startknop' : 'Sleutel in contact'}`,"
);

// 6. Update submit body (lead payload)
content = content.replace(
  "service: quote.service,",
  "service: quote.service,\n        workingKey: workingKey === 'yes' ? 'Ja' : 'Nee',"
);

// 7. Update Step 3 to go to Step 4 instead of 4 directly, and Step 4 to go to Step 5 (Contact)
content = content.replace(/go\(4\)/g, "go(4)"); // wait, I'll need to manually replace the specific step numbers.
content = content.replace(/go\(4\)/g, "go(5)"); // for step 3 options: wait, step 3 is "Zitten er knoppen op uw sleutel?". It goes to 4.
// Let's replace Step 4 to Step 5
content = content.replace("{/* ── 4. Contact ── */}", "{/* ── 5. Contact ── */}");
content = content.replace("step === 4 && (", "step === 5 && (");
content = content.replace("key=\"s4\"", "key=\"s5\"");

// Add step 4 between step 3 and step 5
const step4HTML = `
        {/* ── 4. Werkende sleutel ── */}
        {step === 4 && (
          <div className={stepClass} key="s4">
            <h3 className={styles.q}>Heeft u nog een werkende sleutel?</h3>
            <p className={styles.hint}>
              Als u alle sleutels kwijt bent, moeten wij de auto openen zonder schade en een nieuwe sleutel vanaf nul inleren.
            </p>
            <div className={styles.options} role="radiogroup" aria-label="Heeft u nog een werkende sleutel">
              <button
                type="button"
                role="radio"
                aria-checked={workingKey === 'yes'}
                className={\`\${styles.card} \${workingKey === 'yes' ? styles.cardOn : ''}\`}
                onClick={() => { setWorkingKey('yes'); go(5); }}
              >
                <span className={styles.cardArt}><RemoteYesIcon /></span>
                <span>
                  <span className={styles.cardLabel}>Ja, ik heb een sleutel</span>
                  <span className={styles.cardSub}>Ik wil een extra reservesleutel</span>
                </span>
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={workingKey === 'no'}
                className={\`\${styles.card} \${workingKey === 'no' ? styles.cardOn : ''}\`}
                onClick={() => { setWorkingKey('no'); go(5); }}
              >
                <span className={styles.cardArt}><RemoteNoIcon /></span>
                <span>
                  <span className={styles.cardLabel}>Nee, alles is kwijt</span>
                  <span className={styles.cardSub}>Ik heb een compleet nieuwe nodig</span>
                </span>
              </button>
            </div>
          </div>
        )}
`;

content = content.replace("{/* ── 5. Contact ── */}", step4HTML + "\n        {/* ── 5. Contact ── */}");

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed VehicleWizard');
