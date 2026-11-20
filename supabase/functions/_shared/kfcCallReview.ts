const DEFAULT_AGENTS = ['agent_5701m7vas3qtfbhrq9t76dys1m9z', 'agent_0001m7vdzmrzex4vme666p48cz1b'];

export function reviewAgentIds(config?: string) {
  return [...new Set([...DEFAULT_AGENTS, ...(config ?? '').split(',').map((id) => id.trim()).filter((id) => /^agent_[a-z0-9]+$/i.test(id))])];
}

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function list(value: unknown) {
  return Array.isArray(value) ? value.map(object) : [];
}

function string(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function phone(value: unknown) {
  const candidate = string(value);
  return candidate && /^\+?[\d ()-]{7,24}$/.test(candidate) ? candidate : null;
}

function parsed(value: unknown) {
  if (typeof value !== 'string') return object(value);
  try { return object(JSON.parse(value)); } catch { return {}; }
}

function verdict(value: unknown): ReviewVerdict {
  if (value === 'success' || value === true) return 'yes';
  if (value === 'failure' || value === false) return 'no';
  return 'unknown';
}

export type ReviewVerdict = 'yes' | 'no' | 'unknown';
export type ReviewMetadata = {
  agent_id: string;
  agent_name: string;
  channel: 'phone' | 'whatsapp' | 'web' | 'unknown';
  language: string | null;
  recommended: ReviewVerdict;
  resolved: ReviewVerdict;
  product_skus: string[];
  transfer: 'connected' | 'attempted' | 'failed' | 'not_recorded';
  transfer_number: string | null;
};

export function normalizeKfcCall(payload: unknown, allowed: string[]) {
  const data = object(payload);
  const agentId = string(data.agent_id);
  const conversationId = string(data.conversation_id);
  if (!agentId || !allowed.includes(agentId) || !conversationId || !/^conv_[a-z0-9]+$/i.test(conversationId)) return null;
  const metadata = object(data.metadata);
  const analysis = object(data.analysis);
  const seconds = metadata.start_time_unix_secs;
  if (typeof seconds !== 'number' || !Number.isFinite(seconds) || seconds <= 0 || seconds > 1e11) return null;

  const telephone = object(metadata.phone_call);
  const source = string(metadata.conversation_initiation_source) ?? '';
  const channel = Object.keys(telephone).length ? 'phone' : /whatsapp/i.test(source) ? 'whatsapp' : /widget|sdk|web/i.test(source) ? 'web' : 'unknown';
  const caller = phone(telephone.external_number ?? telephone.caller_id ?? (telephone.direction === 'inbound' ? telephone.from_number : telephone.to_number));
  const turns = list(data.transcript);
  const transcript = turns.flatMap((turn) => {
    const message = string(turn.message);
    return message && (turn.role === 'agent' || turn.role === 'user') ? [{ role: turn.role, message }] : [];
  });
  const calls = turns.flatMap((turn) => list(turn.tool_calls));
  const results = turns.flatMap((turn) => list(turn.tool_results)).filter((item) => item.tool_has_been_called !== false);
  const transferCalls = calls.filter((item) => item.tool_name === 'transfer_to_number' && item.tool_has_been_called !== false);
  const transferResults = results.filter((item) => item.tool_name === 'transfer_to_number');
  const connected = transferResults.find((item) => {
    const result = parsed(item.result_value ?? item.result);
    return item.is_error !== true && ['connected', 'answered'].includes(string(result.status) ?? '');
  });
  const failed = transferResults.length > 0 && transferResults.every((item) => item.is_error === true ||
    ['failed', 'busy', 'no_answer', 'no-answer'].includes(string(parsed(item.result_value ?? item.result).status) ?? ''));
  const transfer = connected ? 'connected' : failed ? 'failed' : transferCalls.length || transferResults.length ? 'attempted' : 'not_recorded';
  const confirmedCall = transferCalls.find((item) => item.request_id === connected?.request_id) ?? transferCalls.at(-1);
  const target = parsed(confirmedCall?.params_as_json);

  const catalogueSkus = results.filter((item) => item.tool_name === 'catalog_detail' && item.is_error !== true)
    .map((item) => string(parsed(item.result_value).sku)).filter((item): item is string => Boolean(item && /^[a-z0-9_-]{1,40}$/i.test(item)));
  const recommendations = transcript.filter((turn) => turn.role === 'agent' &&
    /recommend|suggest|would buy|should buy|should get|you need|you can use|\bfits\b|compatible|raad ik|adviseer|\bpast\b|u heeft .* nodig/i.test(turn.message) &&
    !/cannot confirm|can.t confirm|can.t verify|niet bevestigen|geen zekerheid/i.test(turn.message));
  const productSkus = [...new Set(catalogueSkus.filter((code) => recommendations.some((turn) =>
    turn.message.toUpperCase().split(/[^A-Z0-9_-]+/).includes(code.toUpperCase())
  )))];
  const evaluation = object(analysis.evaluation_criteria_results);
  const collection = object(analysis.data_collection_results);
  const productScore = verdict(object(evaluation.product_recommended).result ?? object(collection.product_recommended).value);
  const resolution = verdict(object(evaluation.issue_resolved).result ?? object(collection.issue_resolved).value);
  const evidence: ReviewMetadata = {
    agent_id: agentId, agent_name: string(data.agent_name) ?? agentId, channel, language: string(metadata.main_language),
    recommended: productScore === 'unknown' && productSkus.length ? 'yes' : productScore,
    resolved: resolution, product_skus: productSkus, transfer,
    transfer_number: phone(target.phone_number ?? target.transfer_number ?? target.destination ??
      parsed(connected?.result_value ?? connected?.result).phone_number),
  };

  return {
    conversation_id: conversationId, channel, phone: caller, status: string(data.status),
    outcome: string(analysis.call_successful), duration_secs: typeof metadata.call_duration_secs === 'number' ? metadata.call_duration_secs : null,
    summary: string(analysis.transcript_summary), transcript, created_at: new Date(seconds * 1000).toISOString(),
    metadata: { kfc_call_review: evidence },
  };
}
