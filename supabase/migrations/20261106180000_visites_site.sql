-- Mesure d'audience du site public, sans cookie ni donnée personnelle :
-- un visiteur = empreinte (IP + navigateur + jour) hachée côté serveur avec un sel secret,
-- impossible à relier d'un jour à l'autre. Conservation 13 mois maximum.

create table if not exists public.page_views (
  id           bigint generated always as identity primary key,
  viewed_at    timestamptz not null default now(),
  day          date not null default (now() at time zone 'Europe/Paris')::date,
  path         text not null check (char_length(path) <= 300),
  visitor_hash text not null check (char_length(visitor_hash) = 64),
  source       text not null default 'direct' check (char_length(source) <= 100),
  device       text not null default 'mobile' check (device in ('mobile', 'ordinateur', 'tablette'))
);
create index if not exists page_views_day_idx on public.page_views (day);

alter table public.page_views enable row level security;
drop policy if exists admin_read on public.page_views;
create policy admin_read on public.page_views for select to authenticated using (public.is_admin());
-- Pas de politique d'écriture : seule la route serveur (clé secrète) enregistre les visites.

create or replace function public.visit_stats(p_since date)
returns jsonb language sql stable security invoker set search_path = public as $$
  with v as (select * from public.page_views where p_since is null or day >= p_since)
  select jsonb_build_object(
    'views',    (select count(*) from v),
    'visitors', (select count(distinct (day, visitor_hash)) from v),
    'today',    (select count(distinct visitor_hash) from v where day = (now() at time zone 'Europe/Paris')::date),
    'days',     coalesce((select jsonb_agg(jsonb_build_object('day', day, 'views', n, 'visitors', u) order by day)
                 from (select day, count(*) n, count(distinct visitor_hash) u from v group by day) d), '[]'::jsonb),
    'pages',    coalesce((select jsonb_agg(jsonb_build_object('label', path, 'value', n) order by n desc)
                 from (select path, count(*) n from v group by path order by n desc limit 10) p), '[]'::jsonb),
    'sources',  coalesce((select jsonb_agg(jsonb_build_object('label', source, 'value', n) order by n desc)
                 from (select source, count(distinct (day, visitor_hash)) n from v group by source order by n desc limit 8) s), '[]'::jsonb),
    'devices',  coalesce((select jsonb_agg(jsonb_build_object('label', device, 'value', n) order by n desc)
                 from (select device, count(distinct (day, visitor_hash)) n from v group by device) x), '[]'::jsonb)
  );
$$;
revoke all on function public.visit_stats(date) from public, anon;
grant execute on function public.visit_stats(date) to authenticated;

-- Purge des visites de plus de 13 mois (appelée à chaque enregistrement, coût négligeable grâce à l'index).
create or replace function public.purge_old_page_views()
returns void language sql security definer set search_path = public as $$
  delete from public.page_views where day < (now() at time zone 'Europe/Paris')::date - interval '13 months';
$$;
revoke all on function public.purge_old_page_views() from public, anon, authenticated;
