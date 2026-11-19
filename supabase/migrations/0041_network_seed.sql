/*
 * Seeds the three servers and their channels.
 *
 * Split from 0040 on purpose: Postgres refuses to use a new enum value in
 * the same transaction that added it ("unsafe use of new value of enum
 * type"), and 0040 adds 'probleem'. Run 0040 first, then this.
 *
 * Everything is idempotent — re-running adds nothing and renames nothing, so
 * this is safe to apply twice and safe to extend later by editing the lists
 * and running it again.
 */

-- ── servers ────────────────────────────────────────────────────────────
insert into public.chat_servers (id, name)
values
  ('00000000-0000-0000-0000-000000000002', 'Duitsland'),
  ('00000000-0000-0000-0000-000000000003', 'België')
on conflict (id) do nothing;


-- ── channels, for every server ─────────────────────────────────────────
do $$
declare
  v_server uuid;
  v_make   text;
  v_name   text;
  /*
   * The twenty makes that actually turn up in real jobs, in demand order —
   * the same ranking src/lib/topBrands.ts uses, computed from the jobs and
   * leads tables rather than guessed.
   */
  v_makes text[] := array[
    'Volkswagen', 'BMW', 'Kia', 'Mercedes-Benz', 'Peugeot', 'Opel', 'Fiat',
    'Toyota', 'Ford', 'Renault', 'Nissan', 'Hyundai', 'Citroën', 'Seat',
    'Chevrolet', 'Volvo', 'Audi', 'Mini', 'Mitsubishi', 'Mazda'
  ];
  /*
   * What monteurs actually get stuck on, rather than generic categories.
   * Each is a thing you either solved yesterday or are about to lose an
   * afternoon to.
   */
  v_problems text[][] := array[
    array['Immobiliser & beveiliging', 'immobiliser'],
    array['Programmeren mislukt',      'programmeren-mislukt'],
    array['Sleutel frezen',            'sleutel-frezen'],
    array['Apparatuur & software',     'apparatuur-software'],
    array['Onderdelen zoeken',         'onderdelen-zoeken'],
    array['Prijzen & offertes',        'prijzen-offertes']
  ];
begin
  for v_server in
    select id from public.chat_servers
    where id in (
      '00000000-0000-0000-0000-000000000001',
      '00000000-0000-0000-0000-000000000002',
      '00000000-0000-0000-0000-000000000003'
    )
  loop
    /* Every server gets the two general channels. */
    insert into public.chat_channels (server_id, name, slug, type)
    values
      (v_server, 'Algemeen',  'algemeen',  'general'),
      (v_server, 'Vraagbaak', 'vraagbaak', 'general')
    on conflict (server_id, slug) do nothing;

    /* One channel per make. */
    foreach v_make in array v_makes loop
      insert into public.chat_channels (server_id, name, slug, type, target_make)
      values (
        v_server,
        v_make,
        /*
         * Accents and dots folded out of the slug — "Citroën" has to become
         * "citroen", or the unique index treats two spellings of one make as
         * two channels.
         */
        regexp_replace(
          /*
           * lower() first, then translate: the map below lists lowercase
           * accented letters only, so an uppercase "Š" would slip through
           * untouched if it ran the other way round. Both strings must be
           * the same length — translate() silently shifts the mapping when
           * they are not, which is how ü briefly became "o" here.
           */
          translate(
            lower(v_make),
            'ëéèêïíìîöóòôüúùûàáâäçñšž',
            'eeeeiiiioooouuuuaaaacnsz'
          ),
          '[^a-z0-9]+', '-', 'g'
        ),
        'make',
        v_make
      )
      on conflict (server_id, slug) do nothing;
    end loop;

    /* And the problem channels. */
    for i in 1 .. array_length(v_problems, 1) loop
      v_name := v_problems[i][1];
      insert into public.chat_channels (server_id, name, slug, type)
      values (v_server, v_name, v_problems[i][2], 'probleem')
      on conflict (server_id, slug) do nothing;
    end loop;
  end loop;
end $$;


/*
 * Nederland already had a "VW Groep" channel pointing at Volkswagen, from
 * 0014. The loop above has now added a plain "Volkswagen" channel beside it,
 * so the make would be listed twice. The old one is renamed rather than
 * deleted — it carries real messages, and deleting a channel to tidy a
 * sidebar throws away the answers in it.
 */
update public.chat_channels
   set name = 'VW Groep (oud)'
 where slug = 'vw-groep'
   and server_id = '00000000-0000-0000-0000-000000000001'
   and name = 'VW Groep';
