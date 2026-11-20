import { normalizeKfcCall, reviewAgentIds } from "../_shared/kfcCallReview.ts";

const elevenKey = Deno.env.get("KFC_ELEVENLABS_HISTORY_KEY");
const triggerKey = Deno.env.get("KFC_HISTORY_TRIGGER_KEY");
const project = Deno.env.get("SUPABASE_URL");
const role = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const agents = reviewAgentIds(Deno.env.get("KFC_REVIEW_AGENT_IDS"));
const outcome = (body, status = 200) => Response.json(body, { status });

function matchesKey(provided) {
  if (!triggerKey) return false;
  let mismatch = provided.length ^ triggerKey.length;
  for (let i = 0; i < triggerKey.length; i++) mismatch |= provided.charCodeAt(i) ^ triggerKey.charCodeAt(i);
  return mismatch === 0;
}

async function eleven(path) {
  const response = await fetch("https://api.elevenlabs.io/v1/convai/conversations" + path, {
    headers: { "xi-api-key": elevenKey }, signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error("ElevenLabs history lookup failed");
  return response.json();
}

async function database(table, params, body) {
  const response = await fetch(project + "/rest/v1/" + table + "?" + new URLSearchParams(params), {
    method: body ? "POST" : "GET",
    headers: { apikey: role, authorization: "Bearer " + role, "content-type": "application/json", prefer: "resolution=merge-duplicates,return=minimal" },
    body: body && JSON.stringify(body), signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error("Conversation storage failed");
  return body ? null : response.json();
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return outcome({ error: "Method not allowed" }, 405);
  if (!matchesKey(request.headers.get("x-kfc-sync-key") ?? "")) return outcome({ error: "Unauthorized" }, 401);
  if (!elevenKey || !project || !role) return outcome({ error: "History sync is not configured" }, 503);
  let imported = 0;
  try {
    const since = Math.floor(Date.now() / 1000) - 7 * 24 * 3600;
    for (const agent of agents) {
      let cursor;
      for (let pageNumber = 0; pageNumber < 10; pageNumber++) {
        const params = new URLSearchParams({ agent_id: agent, page_size: "50", call_start_after_unix: String(since) });
        if (cursor) params.set("cursor", cursor);
        const page = await eleven("?" + params);
        const ids = (page.conversations ?? []).filter((item) => ["done", "failed"].includes(item.status))
          .map((item) => item.conversation_id).filter((id) => typeof id === "string" && /^conv_[a-z0-9]+$/i.test(id));
        if (ids.length) {
          const filter = { select: "conversation_id", conversation_id: "in.(" + ids.join(",") + ")" };
          const stored = await Promise.all([database("agent_conversations", filter), database("kfc_deleted_conversations", filter)]);
          const alreadyKnown = new Set(stored.flat().map((row) => row.conversation_id));
          const pending = ids.filter((id) => !alreadyKnown.has(id));
          for (let i = 0; i < pending.length; i += 5) {
            const entries = await Promise.all(pending.slice(i, i + 5).map((id) => eleven("/" + id)));
            const rows = entries.map((entry) => normalizeKfcCall(entry, agents)).filter(Boolean);
            if (rows.length) await database("agent_conversations", { on_conflict: "conversation_id" }, rows);
            imported += rows.length;
          }
        }
        if (!page.has_more || !page.next_cursor || page.next_cursor === cursor) break;
        cursor = page.next_cursor;
      }
    }
    return outcome({ imported });
  } catch {
    return outcome({ error: "Could not complete synchronisation" }, 502);
  }
});
