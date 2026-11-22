create or replace function public.kfc_quick_article(
  p_prefix text, p_name text, p_sku text, p_ean text, p_condition text
) returns text language plpgsql set search_path = '' as $$
declare
  v_code text;
  v_matches integer;
  v_next bigint;
begin
  if p_prefix not in ('KFC-3-', 'AS24-3-') or p_condition not in ('new','opened','used')
    then raise exception 'KFC_BAD_CARD'; end if;
  perform pg_advisory_xact_lock(hashtext('kfc_quick_article'));
  if p_condition <> 'used' then
    select min(code), count(*) into v_code, v_matches from public.kfc_articles
      where tracking = 'quantity' and ((p_sku <> '' and upper(sku) = upper(p_sku)) or p_ean = any(ean));
    if v_matches > 1 then raise exception 'KFC_AMBIGUOUS_CARD'; end if;
    if v_matches = 1 then return v_code; end if;
  end if;
  select coalesce(max(substr(code,length(p_prefix)+1)::bigint),0)+1 into v_next
    from public.kfc_articles where code ~ ('^' || p_prefix || '[0-9]{1,18}$');
  v_code := p_prefix || v_next::text;
  insert into public.kfc_articles(code,name,sku,ean,category,condition,tracking)
    values(v_code,p_name,p_sku,case when p_ean is null then array[]::text[] else array[p_ean] end,
      'Werkplaats',p_condition,case when p_condition = 'used' then 'serial' else 'quantity' end);
  return v_code;
end $$;
revoke all on function public.kfc_quick_article(text,text,text,text,text) from public,anon,authenticated;
grant execute on function public.kfc_quick_article(text,text,text,text,text) to service_role;
