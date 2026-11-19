# Shared agent knowledge

One table, `agent_knowledge`, holds the facts and rules every AI agent (ElevenLabs phone and WhatsApp, the webshop chat) may use. Agents read it at answer time. Nothing an agent or the review job sends can make a row usable: **only the owner confirms**.

Statuses: `confirmed` (agents may state it), `proposed` / `unknown` (agents must NOT answer; they use the fixed sentence "Dat weet ik niet zeker. Een collega neemt contact met u op."), `retired`.

Migrations: `0086_agent_knowledge.sql` (table), `0087_agent_knowledge_seed.sql` (first rows from the knowledge base).

## Endpoints

Agent token (`AGENT_API_TOKEN`) for `/api/agent/*`; ops token (`OPS_API_TOKEN`) for `/api/ops/*`. Both as `Authorization: Bearer <secret>`.

**1. `GET /api/agent/knowledge?topic=&q=`** returns what the agent may say.
`curl -H "Authorization: Bearer $AGENT_API_TOKEN" "$CRM/api/agent/knowledge?topic=payment&q=ideal"`
Response: `{ facts: [{topic, question, answer, rule}], unknown: [{topic, question}], say_when_unknown }`. Unknown topic gives 400 with the topic list. No topic returns all topics. If `q` matches nothing, the whole topic is returned.

**2. `GET /api/ops/knowledge?status=confirmed,proposed,unknown`** lists rows (default: all except retired), most asked first.
`curl -H "Authorization: Bearer $OPS_API_TOKEN" "$CRM/api/ops/knowledge?status=unknown"`

**3. `POST /api/ops/knowledge`** reports gaps (max 50). Open rows of the topic get their counter bumped; if none, a `gap.<topic>` row is created as `proposed`.
`curl -X POST -H "Authorization: Bearer $OPS_API_TOKEN" -H "Content-Type: application/json" -d '{"gaps":[{"topic":"arrival","asked":3,"example":"how fast can you come"}]}' "$CRM/api/ops/knowledge"`
Response: `{ "bumped": 1, "created": 0 }`. Examples are redacted (phones, e-mails, plates, long numbers) and cut to 200 characters.

**4. `POST /api/ops/knowledge/decide`** records the owner's answer. Only call it with what the owner actually said.
`curl -X POST ... -d '{"key":"open.u7_discount","decision":"confirm","answer":"No discounts are given."}' "$CRM/api/ops/knowledge/decide"`
`decision` is `confirm` (needs an answer or a rule, new or already on the row) or `retire`. Response: `{ ok: true, item }`; 400 or 404 on error.

**5. `GET /api/ops/conversations?since=<ISO>&limit=`** returns recent `agent_conversations` for the review (since required, at most 31 days back; limit default 200, max 500). Only `handover`, `last_outcome` and `callback_form` are passed from metadata.

## ElevenLabs console tool `get_knowledge`

- Type: webhook (server) tool, name `get_knowledge`, method **GET**.
- URL: `https://<crm-host>/api/agent/knowledge`
- Header: `Authorization: Bearer <AGENT_API_TOKEN>` stored as a secret.
- Query parameters: `topic` (optional, one of: prices, arrival, payment, warranty, service_area, hours, documents, duration, cancellation, discount, shipping, returns, order_status, key_types, company, other) and `q` (optional, a keyword from the customer question).
- When to call: before answering any factual question about prices, arrival, payment, warranty, hours, area, documents, shipping or returns that a tool such as get_price or get_slots does not answer. State only `facts`; follow each `rule`; for anything listed under `unknown`, or when nothing matches, say `say_when_unknown` and offer a callback with escalate.

## Who confirms

Agents never edit knowledge. The review job only reports gaps and relays the owner's decisions. A `proposed` or `unknown` row stays unusable until the owner answers.
