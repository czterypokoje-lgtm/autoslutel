/**
 * A minimal Supabase-client look-alike over a pglite (real Postgres) instance,
 * so the job room handlers can run against real constraints, triggers and SQL
 * functions. It supports only what the handlers use: select / insert / update /
 * upsert with eq, in, is, order, limit, single, maybeSingle, and rpc.
 *
 * Errors come back as { code, message } like PostgREST. Whichever role the
 * session is in (`set role service_role`) is the role the statements run as.
 */
type Row = Record<string, any>;

const ident = (s: string) => {
  if (!/^[a-z_][a-z0-9_]*$/.test(s)) throw new Error(`bad identifier ${s}`);
  return s;
};
const param = (v: unknown) => (v !== null && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date) ? JSON.stringify(v) : v);

export function pgClient(pg: { query: (sql: string, params?: unknown[]) => Promise<{ rows: Row[] }> }) {
  const fail = (e: any) => ({ data: null, error: { code: e?.code as string | undefined, message: String(e?.message ?? e) } });

  const from = (table: string) => {
    let op: 'select' | 'insert' | 'update' | 'upsert' = 'select';
    let cols = '*';
    let payload: Row = {};
    let conflict = '';
    const filters: Array<[string, 'eq' | 'in' | 'is', unknown]> = [];
    let orderBy: [string, boolean] | null = null;
    let max: number | null = null;
    let mode: 'many' | 'single' | 'maybe' = 'many';

    const run = async () => {
      const t = `public.${ident(table)}`;
      const params: unknown[] = [];
      const p = (v: unknown) => (params.push(param(v)), `$${params.length}`);
      const where = () =>
        filters.length
          ? ' where ' + filters.map(([c, k, v]) => {
              if (k === 'is') return `${ident(c)} is ${v === null ? 'null' : p(v)}`;
              if (k === 'in') return `${ident(c)} = any(${p(v)})`;
              return `${ident(c)} = ${p(v)}`;
            }).join(' and ')
          : '';
      let sql: string;
      if (op === 'insert' || op === 'upsert') {
        const keys = Object.keys(payload);
        sql = `insert into ${t} (${keys.map(ident).join(',')}) values (${keys.map((k) => p(payload[k])).join(',')})`;
        if (op === 'upsert') {
          sql += ` on conflict (${ident(conflict)}) do update set ${keys.filter((k) => k !== conflict).map((k) => `${ident(k)} = excluded.${ident(k)}`).join(', ')}`;
        }
        sql += ' returning *';
      } else if (op === 'update') {
        sql = `update ${t} set ${Object.keys(payload).map((k) => `${ident(k)} = ${p(payload[k])}`).join(', ')}${where()} returning *`;
      } else {
        sql = `select ${cols} from ${t}${where()}`;
        if (orderBy) sql += ` order by ${ident(orderBy[0])} ${orderBy[1] ? 'asc' : 'desc'}`;
        if (max !== null) sql += ` limit ${Number(max)}`;
      }
      try {
        const { rows } = await pg.query(sql, params);
        if (mode === 'many') return { data: rows, error: null };
        if (mode === 'single' && !rows[0]) return { data: null, error: { code: 'PGRST116', message: 'none' } };
        return { data: rows[0] ?? null, error: null };
      } catch (e) {
        return fail(e);
      }
    };

    const b: any = {
      select: (c = '*') => { if (op === 'select') cols = c.replace(/\s+/g, ' ').trim(); return b; },
      insert: (v: Row) => ((op = 'insert'), (payload = v), b),
      update: (v: Row) => ((op = 'update'), (payload = v), b),
      upsert: (v: Row, o: { onConflict: string }) => ((op = 'upsert'), (payload = v), (conflict = o.onConflict), b),
      eq: (c: string, v: unknown) => (filters.push([c, 'eq', v]), b),
      in: (c: string, v: unknown[]) => (filters.push([c, 'in', v]), b),
      is: (c: string, v: unknown) => (filters.push([c, 'is', v]), b),
      order: (c: string, o: { ascending?: boolean } = {}) => ((orderBy = [c, o.ascending !== false]), b),
      limit: (n: number) => ((max = n), b),
      single: () => ((mode = 'single'), b),
      maybeSingle: () => ((mode = 'maybe'), b),
      then: (resolve: (v: unknown) => void, reject: (e: unknown) => void) => run().then(resolve, reject),
    };
    return b;
  };

  const rpc = async (name: string, args: Row) => {
    const keys = Object.keys(args);
    try {
      const { rows } = await pg.query(`select * from public.${ident(name)}(${keys.map((k, i) => `${ident(k)} => $${i + 1}`).join(', ')})`, keys.map((k) => args[k]));
      // a function returning one scalar comes back as the bare value, like PostgREST
      if (rows.length === 1 && Object.keys(rows[0]).length === 1 && Object.keys(rows[0])[0] === name) return { data: Object.values(rows[0])[0], error: null };
      return { data: rows, error: null };
    } catch (e) {
      return fail(e);
    }
  };

  return { from, rpc } as any;
}
