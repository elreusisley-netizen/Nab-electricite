-- =====================================================================
-- Électricité N.A.B. — schéma initial (Phase 1)
-- Site public + espace administrateur, une seule base Supabase.
--
-- Conventions
--   * montants en centimes (bigint), quantités en numeric
--   * dates en timestamptz (UTC), affichées en Europe/Paris
--   * RLS activée partout : le public ne lit que le contenu publié,
--     seuls les comptes de la table profiles (role = 'admin') lisent
--     et écrivent le reste
--   * les formulaires publics écrivent via le serveur (clé service_role),
--     jamais directement depuis le navigateur
-- =====================================================================

create extension if not exists pgcrypto;
create extension if not exists citext;

-- ---------------------------------------------------------------------
-- 1. Types énumérés
-- ---------------------------------------------------------------------
create type public.client_type        as enum ('particulier', 'professionnel');
create type public.request_kind       as enum ('devis', 'depannage');
create type public.request_status     as enum ('nouvelle', 'en_cours', 'devis_cree', 'planifiee', 'sans_suite', 'archivee');
create type public.urgency_level      as enum ('normale', 'urgente', 'tres_urgente');
create type public.building_type      as enum ('maison', 'appartement', 'commerce', 'bureau', 'autre');
create type public.service_type       as enum ('installation_neuve', 'renovation', 'mise_aux_normes', 'tableau_electrique',
                                               'videosurveillance', 'interphonie', 'vmc', 'depannage', 'autre');
create type public.quote_status       as enum ('brouillon', 'envoye', 'accepte', 'refuse', 'expire');
create type public.quote_line_type    as enum ('prestation', 'fourniture', 'main_oeuvre', 'deplacement', 'texte');
create type public.intervention_status as enum ('a_planifier', 'planifiee', 'en_cours', 'attente_materiel', 'terminee', 'annulee');
create type public.event_kind         as enum ('intervention', 'blocage');
create type public.invoice_status     as enum ('emise', 'partiellement_payee', 'payee', 'annulee');
create type public.payment_method     as enum ('virement', 'cheque', 'especes', 'carte', 'autre');
create type public.file_category      as enum ('photo_demande', 'photo_avant', 'photo_apres', 'photo_chantier', 'pdf_devis', 'document');
create type public.audience           as enum ('particulier', 'professionnel', 'tous');

-- ---------------------------------------------------------------------
-- 2. Utilitaires
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------------------------------------------------------------------
-- 3. Comptes administrateurs
-- ---------------------------------------------------------------------
create table public.profiles (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  full_name  text not null,
  role       text not null default 'admin' check (role in ('admin')),
  created_at timestamptz not null default now()
);

-- Vrai si l'utilisateur connecté est un administrateur.
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role = 'admin');
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------------------------------------------------------------------
-- 4. Paramètres
-- ---------------------------------------------------------------------
-- Une seule ligne (id = 1). Les champs vides restent à compléter dans l'admin.
create table public.company_settings (
  id                      smallint primary key default 1 check (id = 1),
  display_name            text not null default 'Électricité N.A.B.',
  legal_name              text not null default 'NAB (NAB ELECTRICITE)',
  legal_form              text not null default 'EURL',
  siret                   text default '92933024900012',
  vat_number              text default 'FR75929330249',
  naf_code                text default '43.21A',
  share_capital_cents     bigint,
  head_office_address     text,                          -- obligatoire dans les mentions légales
  public_city             text not null default 'Bordeaux', -- seule adresse affichée sur le site
  phone                   text not null default '06 66 61 43 73',
  email                   text not null default 'nabelectricite@gmail.com',
  service_area            text not null default 'Nouvelle-Aquitaine',
  insurer_name            text,                          -- assurance décennale
  insurer_coverage        text,
  insurance_policy_number text,
  quote_validity_days     int  not null default 30 check (quote_validity_days between 1 and 365),
  payment_terms           text,
  quote_legal_mentions    text,
  updated_at              timestamptz not null default now()
);
insert into public.company_settings (id) values (1);
create trigger trg_company_settings_updated before update on public.company_settings
  for each row execute function public.set_updated_at();

-- Taux de TVA. Un taux non vérifié (verified_at nul) est inutilisable dans un devis.
create table public.tax_rates (
  id          uuid primary key default gen_random_uuid(),
  label       text not null,
  rate        numeric(5,2) not null check (rate >= 0 and rate < 100),
  valid_from  date not null,
  valid_to    date,
  verified_at timestamptz,
  verified_by uuid references public.profiles(user_id),
  notes       text,
  created_at  timestamptz not null default now(),
  check (valid_to is null or valid_to > valid_from)
);
-- Taux proposés, NON vérifiés : à valider avec le comptable avant usage.
insert into public.tax_rates (label, rate, valid_from, notes) values
  ('TVA normale', 20.00, '2014-01-01', 'À vérifier avant usage'),
  ('TVA intermédiaire (travaux dans un logement de plus de 2 ans)', 10.00, '2014-01-01', 'À vérifier avant usage : conditions et attestation client'),
  ('TVA réduite (travaux d''amélioration énergétique)', 5.50, '2014-01-01', 'À vérifier avant usage : conditions et attestation client');

-- Numérotation continue, par type et par année.
create table public.number_sequences (
  kind      text not null check (kind in ('devis', 'facture')),
  year      int  not null,
  last_value int not null default 0,
  primary key (kind, year)
);

create or replace function public.next_document_number(p_kind text)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_year int := extract(year from (now() at time zone 'Europe/Paris'))::int;
  v_next int;
begin
  insert into public.number_sequences (kind, year, last_value) values (p_kind, v_year, 1)
  on conflict (kind, year) do update set last_value = number_sequences.last_value + 1
  returning last_value into v_next;
  return case p_kind when 'devis' then 'D' else 'F' end || '-' || v_year || '-' || lpad(v_next::text, 4, '0');
end $$;
revoke all on function public.next_document_number(text) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 5. Activité
-- ---------------------------------------------------------------------
create table public.clients (
  id               uuid primary key default gen_random_uuid(),
  type             public.client_type not null,
  first_name       text,
  last_name        text,
  company_name     text,
  siret            text,
  email            citext,
  phone            text,
  phone_normalized text,   -- format E.164, rempli par le serveur (+33…)
  internal_notes   text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  check (coalesce(nullif(trim(last_name), ''), nullif(trim(company_name), '')) is not null),
  check (type = 'particulier' or company_name is not null)
);
-- Évite les doublons sur l'e-mail ; le téléphone sert à la détection côté admin.
create unique index clients_email_unique on public.clients (email) where email is not null;
create index clients_phone_idx on public.clients (phone_normalized);
create index clients_name_idx on public.clients (lower(coalesce(company_name, last_name)));
create trigger trg_clients_updated before update on public.clients
  for each row execute function public.set_updated_at();

create table public.sites (
  id            uuid primary key default gen_random_uuid(),
  client_id     uuid not null references public.clients(id) on delete cascade,
  label         text,
  address_line  text not null,
  postal_code   text not null check (postal_code ~ '^[0-9]{5}$'),
  city          text not null,
  building_type public.building_type,
  latitude      numeric(9,6),
  longitude     numeric(9,6),
  created_at    timestamptz not null default now()
);
create index sites_client_idx on public.sites (client_id);

create table public.requests (
  id                uuid primary key default gen_random_uuid(),
  kind              public.request_kind not null,
  status            public.request_status not null default 'nouvelle',
  client_id         uuid references public.clients(id) on delete set null,
  site_id           uuid references public.sites(id) on delete set null,
  -- ce que le visiteur a saisi, conservé tel quel
  client_type       public.client_type,
  first_name        text not null,
  last_name         text not null,
  email             citext not null,
  phone             text not null,
  address_line      text not null,
  postal_code       text not null,
  city              text not null,
  building_type     public.building_type,
  service           public.service_type,
  failure_nature    text,                 -- dépannage
  urgency           public.urgency_level, -- dépannage
  description       text not null check (length(description) between 10 and 5000),
  consent_at        timestamptz not null, -- case de consentement RGPD cochée
  ip_hash           text,                 -- empreinte de l'IP (anti-abus), jamais l'IP en clair
  received_at       timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  check (kind = 'depannage' or service is not null),
  check (kind = 'devis' or urgency is not null)
);
create index requests_status_idx on public.requests (kind, status, received_at desc);
create index requests_client_idx on public.requests (client_id);
create trigger trg_requests_updated before update on public.requests
  for each row execute function public.set_updated_at();

create table public.catalog_items (
  id                    uuid primary key default gen_random_uuid(),
  line_type             public.quote_line_type not null check (line_type <> 'texte'),
  designation           text not null,
  unit                  text not null default 'u',
  unit_price_cents      bigint not null check (unit_price_cents >= 0),
  default_tax_rate_id   uuid references public.tax_rates(id),
  active                boolean not null default true,
  created_at            timestamptz not null default now()
);

create table public.quotes (
  id                  uuid primary key default gen_random_uuid(),
  number              text unique,                 -- attribué à l'envoi : D-2026-0001
  client_id           uuid not null references public.clients(id) on delete restrict,
  site_id             uuid references public.sites(id) on delete set null,
  request_id          uuid references public.requests(id) on delete set null,
  status              public.quote_status not null default 'brouillon',
  title               text,
  issue_date          date,
  valid_until         date,
  global_discount_pct numeric(5,2) not null default 0 check (global_discount_pct between 0 and 100),
  subtotal_ht_cents   bigint not null default 0,   -- après remises de ligne
  total_ht_cents      bigint not null default 0,   -- après remise globale
  total_tva_cents     bigint not null default 0,
  total_ttc_cents     bigint not null default 0,
  pdf_path            text,
  notes               text,
  sent_at             timestamptz,
  accepted_at         timestamptz,
  refused_at          timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  check (status = 'brouillon' or number is not null)
);
create index quotes_client_idx on public.quotes (client_id);
create index quotes_status_idx on public.quotes (status, valid_until);
create trigger trg_quotes_updated before update on public.quotes
  for each row execute function public.set_updated_at();

create table public.quote_lines (
  id               uuid primary key default gen_random_uuid(),
  quote_id         uuid not null references public.quotes(id) on delete cascade,
  position         int  not null,
  line_type        public.quote_line_type not null,
  designation      text not null,
  quantity         numeric(10,2) not null default 1 check (quantity >= 0),
  unit             text not null default 'u',
  unit_price_cents bigint not null default 0 check (unit_price_cents >= 0),
  discount_pct     numeric(5,2) not null default 0 check (discount_pct between 0 and 100),
  tax_rate_id      uuid references public.tax_rates(id),
  tax_rate         numeric(5,2),                   -- copie figée du taux au moment de la saisie
  total_ht_cents   bigint not null default 0,
  unique (quote_id, position),
  check (line_type = 'texte' or tax_rate_id is not null)
);
create index quote_lines_quote_idx on public.quote_lines (quote_id);

-- Calcule le total de la ligne et fige le taux ; refuse un taux non vérifié.
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
  select rate, verified_at into v_rate, v_verified from public.tax_rates where id = new.tax_rate_id;
  if v_verified is null then
    raise exception 'Taux de TVA non vérifié : le valider dans Paramètres avant de l''utiliser.';
  end if;
  new.tax_rate := v_rate;
  new.total_ht_cents := round(new.quantity * new.unit_price_cents * (1 - new.discount_pct / 100));
  return new;
end $$;
create trigger trg_quote_lines_before before insert or update on public.quote_lines
  for each row execute function public.quote_line_before_write();

create or replace function public.quote_line_before_delete()
returns trigger language plpgsql as $$
begin
  if (select status from public.quotes where id = old.quote_id) <> 'brouillon' then
    raise exception 'Un devis envoyé ne peut plus être modifié : créer une nouvelle version.';
  end if;
  return old;
end $$;
create trigger trg_quote_lines_before_delete before delete on public.quote_lines
  for each row execute function public.quote_line_before_delete();

-- Recalcule les totaux du devis (remise globale répartie sur chaque taux).
create or replace function public.recompute_quote_totals(p_quote_id uuid)
returns void language plpgsql as $$
declare v_disc numeric; v_sub bigint; v_ht bigint := 0; v_tva bigint := 0; r record;
begin
  select global_discount_pct into v_disc from public.quotes where id = p_quote_id;
  if not found then return; end if;
  select coalesce(sum(total_ht_cents), 0) into v_sub from public.quote_lines where quote_id = p_quote_id;
  for r in
    select tax_rate, sum(total_ht_cents) as base from public.quote_lines
    where quote_id = p_quote_id and line_type <> 'texte' group by tax_rate
  loop
    v_ht  := v_ht  + round(r.base * (1 - v_disc / 100));
    v_tva := v_tva + round(round(r.base * (1 - v_disc / 100)) * r.tax_rate / 100);
  end loop;
  update public.quotes
     set subtotal_ht_cents = v_sub, total_ht_cents = v_ht, total_tva_cents = v_tva, total_ttc_cents = v_ht + v_tva
   where id = p_quote_id;
end $$;

create or replace function public.quote_lines_after_write()
returns trigger language plpgsql as $$
begin
  perform public.recompute_quote_totals(coalesce(new.quote_id, old.quote_id));
  return null;
end $$;
create trigger trg_quote_lines_after after insert or update or delete on public.quote_lines
  for each row execute function public.quote_lines_after_write();

-- Numérote à l'envoi, horodate les changements de statut, recalcule si la remise change.
create or replace function public.quote_before_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status <> old.status then
    if old.status = 'brouillon' and new.status = 'envoye' then
      if not exists (select 1 from public.quote_lines where quote_id = new.id and line_type <> 'texte') then
        raise exception 'Un devis sans ligne chiffrée ne peut pas être envoyé.';
      end if;
      new.number     := coalesce(new.number, public.next_document_number('devis'));
      new.issue_date := coalesce(new.issue_date, (now() at time zone 'Europe/Paris')::date);
      new.valid_until := coalesce(new.valid_until,
        new.issue_date + (select quote_validity_days from public.company_settings where id = 1));
      new.sent_at    := now();
    elsif new.status = 'accepte' then
      if old.status <> 'envoye' then raise exception 'Seul un devis envoyé peut être accepté.'; end if;
      new.accepted_at := now();
    elsif new.status = 'refuse' then
      if old.status <> 'envoye' then raise exception 'Seul un devis envoyé peut être refusé.'; end if;
      new.refused_at := now();
    elsif new.status = 'expire' then
      if old.status <> 'envoye' then raise exception 'Seul un devis envoyé peut expirer.'; end if;
    elsif new.status = 'brouillon' then
      raise exception 'Un devis envoyé ne repasse pas en brouillon : créer une nouvelle version.';
    end if;
  end if;
  if old.status <> 'brouillon' and new.global_discount_pct <> old.global_discount_pct then
    raise exception 'Un devis envoyé ne peut plus être modifié.';
  end if;
  return new;
end $$;
create trigger trg_quotes_before_update before update on public.quotes
  for each row execute function public.quote_before_update();

create or replace function public.quote_after_discount()
returns trigger language plpgsql as $$
begin
  if new.global_discount_pct is distinct from old.global_discount_pct then
    perform public.recompute_quote_totals(new.id);
  end if;
  return null;
end $$;
create trigger trg_quotes_after_discount after update of global_discount_pct on public.quotes
  for each row execute function public.quote_after_discount();

-- Passe en « expiré » les devis envoyés dont la date de validité est dépassée (tâche planifiée).
create or replace function public.expire_quotes()
returns int language plpgsql security definer set search_path = public as $$
declare n int;
begin
  update public.quotes set status = 'expire'
   where status = 'envoye' and valid_until < (now() at time zone 'Europe/Paris')::date;
  get diagnostics n = row_count;
  return n;
end $$;
revoke all on function public.expire_quotes() from public, anon, authenticated;

create table public.interventions (
  id             uuid primary key default gen_random_uuid(),
  client_id      uuid not null references public.clients(id) on delete restrict,
  site_id        uuid references public.sites(id) on delete set null,
  quote_id       uuid references public.quotes(id) on delete set null,
  request_id     uuid references public.requests(id) on delete set null,
  service        public.service_type not null,
  title          text not null,
  description    text,
  status         public.intervention_status not null default 'a_planifier',
  internal_notes text,
  completed_at   timestamptz,
  cancelled_at   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index interventions_client_idx on public.interventions (client_id);
create index interventions_status_idx on public.interventions (status);
create trigger trg_interventions_updated before update on public.interventions
  for each row execute function public.set_updated_at();

create or replace function public.intervention_status_dates()
returns trigger language plpgsql as $$
begin
  if new.status = 'terminee' and old.status <> 'terminee' then new.completed_at := now(); end if;
  if new.status = 'annulee'  and old.status <> 'annulee'  then new.cancelled_at := now(); end if;
  return new;
end $$;
create trigger trg_interventions_status before update of status on public.interventions
  for each row execute function public.intervention_status_dates();

-- Agenda : seules les interventions planifiées et les blocages y figurent.
create table public.schedule_events (
  id              uuid primary key default gen_random_uuid(),
  kind            public.event_kind not null,
  intervention_id uuid references public.interventions(id) on delete cascade,
  starts_at       timestamptz not null,
  ends_at         timestamptz not null,
  note            text,
  reminder_sent_at timestamptz,
  created_at      timestamptz not null default now(),
  check (ends_at > starts_at),
  check ((kind = 'intervention') = (intervention_id is not null))
);
create index schedule_events_range_idx on public.schedule_events (starts_at, ends_at);
create index schedule_events_intervention_idx on public.schedule_events (intervention_id);

-- Un créneau ajouté à une intervention « à planifier » la passe en « planifiée ».
create or replace function public.event_marks_planned()
returns trigger language plpgsql as $$
begin
  if new.intervention_id is not null then
    update public.interventions set status = 'planifiee'
     where id = new.intervention_id and status = 'a_planifier';
  end if;
  return null;
end $$;
create trigger trg_schedule_events_planned after insert on public.schedule_events
  for each row execute function public.event_marks_planned();

-- Factures : émises dans l'outil de facturation de l'entreprise, suivies ici.
create table public.invoices (
  id               uuid primary key default gen_random_uuid(),
  client_id        uuid not null references public.clients(id) on delete restrict,
  quote_id         uuid references public.quotes(id) on delete set null,
  intervention_id  uuid references public.interventions(id) on delete set null,
  number           text not null,
  issue_date       date not null,
  total_ht_cents   bigint not null check (total_ht_cents >= 0),
  total_ttc_cents  bigint not null check (total_ttc_cents >= 0),
  status           public.invoice_status not null default 'emise',
  external_provider text,   -- nom de l'outil de facturation
  external_id       text,   -- identifiant dans cet outil
  created_at       timestamptz not null default now(),
  unique (number),
  unique (external_provider, external_id)
);
create index invoices_date_idx on public.invoices (issue_date);

create table public.payments (
  id           uuid primary key default gen_random_uuid(),
  invoice_id   uuid not null references public.invoices(id) on delete cascade,
  amount_cents bigint not null check (amount_cents > 0),
  paid_on      date not null,
  method       public.payment_method not null default 'virement',
  external_id  text,
  created_at   timestamptz not null default now()
);
create index payments_invoice_idx on public.payments (invoice_id);
create index payments_date_idx on public.payments (paid_on);

-- Toutes les pièces jointes (le fichier vit dans Supabase Storage).
create table public.files (
  id              uuid primary key default gen_random_uuid(),
  bucket          text not null,
  path            text not null,
  category        public.file_category not null,
  request_id      uuid references public.requests(id) on delete cascade,
  quote_id        uuid references public.quotes(id) on delete cascade,
  intervention_id uuid references public.interventions(id) on delete cascade,
  client_id       uuid references public.clients(id) on delete cascade,
  mime_type       text not null,
  size_bytes      int not null check (size_bytes > 0 and size_bytes <= 10485760),
  created_at      timestamptz not null default now(),
  unique (bucket, path),
  check (num_nonnulls(request_id, quote_id, intervention_id, client_id) = 1)
);

create table public.activity_log (
  id          bigint generated always as identity primary key,
  entity      text not null,
  entity_id   uuid not null,
  action      text not null,
  actor_id    uuid references public.profiles(user_id) on delete set null,
  detail      jsonb,
  created_at  timestamptz not null default now()
);
create index activity_log_entity_idx on public.activity_log (entity, entity_id, created_at desc);

create table public.email_log (
  id             uuid primary key default gen_random_uuid(),
  template       text not null,
  recipient      citext not null,
  entity         text,
  entity_id      uuid,
  resend_id      text unique,
  status         text not null default 'en_attente',
  error          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create trigger trg_email_log_updated before update on public.email_log
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 6. Contenu du site
-- ---------------------------------------------------------------------
-- Blocs de texte : brouillon modifiable, version publiée lue par le site.
create table public.site_content (
  key            text primary key,           -- ex. 'accueil.hero.titre'
  draft_value    text not null,
  published_value text,
  published_at   timestamptz,
  updated_at     timestamptz not null default now()
);
create trigger trg_site_content_updated before update on public.site_content
  for each row execute function public.set_updated_at();

create table public.services (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique check (slug ~ '^[a-z0-9-]+$'),
  service      public.service_type not null,
  title        text not null,
  summary      text not null,
  body         text,
  audience     public.audience not null default 'tous',
  image_path   text,
  position     int not null default 0,
  is_published boolean not null default false,
  updated_at   timestamptz not null default now()
);
create trigger trg_services_updated before update on public.services
  for each row execute function public.set_updated_at();

create table public.projects (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique check (slug ~ '^[a-z0-9-]+$'),
  title        text not null,
  description  text,
  service_id   uuid references public.services(id) on delete set null,
  city         text,
  completed_on date,
  position     int not null default 0,
  is_published boolean not null default false,
  updated_at   timestamptz not null default now()
);
create trigger trg_projects_updated before update on public.projects
  for each row execute function public.set_updated_at();

create table public.project_photos (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  path       text not null,
  alt        text not null,
  kind       text not null default 'galerie' check (kind in ('galerie', 'avant', 'apres')),
  position   int not null default 0
);
create index project_photos_project_idx on public.project_photos (project_id, position);

-- Références : jamais de logo sans autorisation écrite enregistrée.
create table public."references" (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null unique,
  logo_path          text,
  logo_authorized    boolean not null default false,
  logo_authorized_on date,
  position           int not null default 0,
  is_published       boolean not null default false,
  check (logo_path is null or (logo_authorized and logo_authorized_on is not null))
);
insert into public."references" (name, position, is_published) values
  ('Pitaya', 1, true), ('Maxi Coffee', 2, true), ('Stokomani', 3, true);

-- Avis : uniquement de vrais avis, avec leur source.
create table public.reviews (
  id           uuid primary key default gen_random_uuid(),
  author_name  text not null,
  rating       smallint check (rating between 1 and 5),
  body         text not null,
  source       text not null,       -- ex. 'Google', 'e-mail client'
  source_url   text,
  reviewed_on  date not null,
  is_published boolean not null default false,
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 7. Sécurité : RLS
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'profiles','company_settings','tax_rates','number_sequences','clients','sites','requests',
    'catalog_items','quotes','quote_lines','interventions','schedule_events','invoices','payments',
    'files','activity_log','email_log','site_content','services','projects','project_photos',
    'references','reviews']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy admin_all on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

-- Lecture publique : uniquement ce qui est publié.
create policy public_read on public.company_settings for select to anon, authenticated using (true);
create policy public_read on public.services        for select to anon, authenticated using (is_published);
create policy public_read on public.projects        for select to anon, authenticated using (is_published);
create policy public_read on public.project_photos  for select to anon, authenticated
  using (exists (select 1 from public.projects p where p.id = project_id and p.is_published));
create policy public_read on public."references"    for select to anon, authenticated using (is_published);
create policy public_read on public.reviews         for select to anon, authenticated using (is_published);
create policy public_read on public.site_content    for select to anon, authenticated using (published_value is not null);

-- Le public ne voit jamais le brouillon ni l'adresse du siège via l'API.
revoke select on public.site_content from anon;
grant  select (key, published_value, published_at) on public.site_content to anon;
revoke select on public.company_settings from anon;
grant  select (display_name, legal_name, legal_form, siret, vat_number, public_city, phone, email,
               service_area, head_office_address, insurer_name, insurer_coverage) on public.company_settings to anon;

-- ---------------------------------------------------------------------
-- 8. Stockage des fichiers
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('site-media',     'site-media',     true,  10485760, array['image/jpeg','image/png','image/webp']),
  ('request-photos', 'request-photos', false, 10485760, array['image/jpeg','image/png','image/webp','image/heic']),
  ('job-photos',     'job-photos',     false, 10485760, array['image/jpeg','image/png','image/webp','image/heic']),
  ('documents',      'documents',      false, 10485760, array['application/pdf']);

-- Les administrateurs gèrent tout ; les envois publics passent par des URL signées créées par le serveur.
create policy admin_all_objects on storage.objects for all to authenticated
  using (bucket_id in ('site-media','request-photos','job-photos','documents') and public.is_admin())
  with check (bucket_id in ('site-media','request-photos','job-photos','documents') and public.is_admin());

-- ---------------------------------------------------------------------
-- 9. RGPD
-- ---------------------------------------------------------------------
-- Supprime les demandes sans suite de plus de 3 ans (tâche planifiée).
-- Les fichiers liés (lignes de public.files) partent en cascade ;
-- le serveur supprime ensuite les objets correspondants du stockage.
create or replace function public.purge_stale_requests()
returns int language plpgsql security definer set search_path = public as $$
declare n int;
begin
  delete from public.requests
   where status in ('sans_suite', 'archivee')
     and client_id is null
     and received_at < now() - interval '3 years';
  get diagnostics n = row_count;
  return n;
end $$;
revoke all on function public.purge_stale_requests() from public, anon, authenticated;
