-- Phase 6 : devis consultables et acceptables en ligne par le client.

alter table public.quotes
  add column if not exists public_token uuid not null default gen_random_uuid(),
  add column if not exists accepted_by_name text,
  add column if not exists accepted_ip_hash text,
  add column if not exists conditions text;

create unique index if not exists quotes_public_token_idx on public.quotes (public_token);

-- Un devis peut aussi être lié à une intervention planifiée (déjà possible via interventions.quote_id).
-- Duplication d'un devis (pour modifier un devis déjà envoyé) : copie en brouillon avec ses lignes.
create or replace function public.duplicate_quote(p_quote_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_new uuid;
begin
  if not public.is_admin() then raise exception 'Accès refusé'; end if;
  insert into public.quotes (client_id, site_id, request_id, title, global_discount_pct, notes, conditions)
  select client_id, site_id, request_id, title, global_discount_pct, notes, conditions
  from public.quotes where id = p_quote_id
  returning id into v_new;
  if v_new is null then raise exception 'Devis introuvable'; end if;
  insert into public.quote_lines (quote_id, position, line_type, designation, quantity, unit, unit_price_cents, discount_pct, tax_rate_id)
  select v_new, position, line_type, designation, quantity, unit, unit_price_cents, discount_pct, tax_rate_id
  from public.quote_lines where quote_id = p_quote_id order by position;
  return v_new;
end $$;
revoke all on function public.duplicate_quote(uuid) from public, anon;
grant execute on function public.duplicate_quote(uuid) to authenticated;

-- Remplace toutes les lignes d'un brouillon en une seule opération (enregistrement du générateur).
create or replace function public.replace_quote_lines(p_quote_id uuid, p_lines jsonb)
returns void language plpgsql security invoker set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Accès refusé'; end if;
  delete from public.quote_lines where quote_id = p_quote_id;
  insert into public.quote_lines (quote_id, position, line_type, designation, quantity, unit, unit_price_cents, discount_pct, tax_rate_id)
  select p_quote_id,
         (l->>'position')::int,
         (l->>'line_type')::public.quote_line_type,
         l->>'designation',
         coalesce((l->>'quantity')::numeric, 0),
         coalesce(nullif(l->>'unit', ''), 'u'),
         coalesce((l->>'unit_price_cents')::bigint, 0),
         coalesce((l->>'discount_pct')::numeric, 0),
         nullif(l->>'tax_rate_id', '')::uuid
  from jsonb_array_elements(p_lines) as l;
  perform public.recompute_quote_totals(p_quote_id);
end $$;
revoke all on function public.replace_quote_lines(uuid, jsonb) from public, anon;
grant execute on function public.replace_quote_lines(uuid, jsonb) to authenticated;

-- Message plus clair quand une ligne chiffrée n'a pas de taux de TVA.
create or replace function public.quote_line_before_write()
returns trigger language plpgsql as $$
declare v_rate numeric(5,2); v_verified timestamptz;
begin
  if (select status from public.quotes where id = new.quote_id) <> 'brouillon' then
    raise exception 'Un devis envoyé ne peut plus être modifié : créer une nouvelle version.';
  end if;
  if new.line_type = 'texte' then
    new.quantity := 0; new.unit_price_cents := 0; new.total_ht_cents := 0; new.tax_rate := null; new.tax_rate_id := null;
    return new;
  end if;
  if new.tax_rate_id is null then
    raise exception 'Choisissez un taux de TVA pour la ligne « % ».', new.designation;
  end if;
  select rate, verified_at into v_rate, v_verified from public.tax_rates where id = new.tax_rate_id;
  if v_verified is null then
    raise exception 'Taux de TVA non validé : le valider dans Réglages avant de l''utiliser.';
  end if;
  new.tax_rate := v_rate;
  new.total_ht_cents := round(new.quantity * new.unit_price_cents * (1 - new.discount_pct / 100));
  return new;
end $$;
