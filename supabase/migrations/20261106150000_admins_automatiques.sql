-- Droits administrateur automatiques.
-- Toute adresse inscrite dans admin_emails devient administrateur dès que le compte est créé
-- (ou recréé) dans Supabase > Authentication > Users, sans requête SQL à relancer.

create table if not exists public.admin_emails (
  email      citext primary key,
  full_name  text not null default 'Administrateur',
  created_at timestamptz not null default now()
);

alter table public.admin_emails enable row level security;
drop policy if exists admin_all on public.admin_emails;
create policy admin_all on public.admin_emails for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

insert into public.admin_emails (email) values ('audifaxe@yahoo.fr')
on conflict (email) do nothing;

create or replace function public.grant_admin_from_allowlist()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id, full_name)
  select new.id, a.full_name from public.admin_emails a where a.email = new.email
  on conflict (user_id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_admin on auth.users;
create trigger on_auth_user_admin
  after insert or update of email on auth.users
  for each row execute function public.grant_admin_from_allowlist();

-- Rattrapage : comptes déjà existants dont l'adresse est dans la liste.
insert into public.profiles (user_id, full_name)
select u.id, a.full_name from auth.users u join public.admin_emails a on a.email = u.email
on conflict (user_id) do nothing;
