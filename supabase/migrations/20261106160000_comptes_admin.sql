-- Gestion des comptes administrateurs depuis l'admin (sans SQL).

-- Liste des adresses autorisées avec l'état de leur compte.
create or replace function public.admin_accounts()
returns table (email citext, full_name text, compte_cree boolean, confirme boolean, derniere_connexion timestamptz, est_moi boolean)
language plpgsql stable security definer set search_path = public, auth as $$
begin
  if not public.is_admin() then raise exception 'Accès refusé'; end if;
  return query
    select a.email, a.full_name,
           u.id is not null,
           coalesce(u.email_confirmed_at is not null, false),
           u.last_sign_in_at,
           coalesce(u.id = auth.uid(), false)
    from public.admin_emails a
    left join auth.users u on lower(u.email) = lower(a.email::text)
    order by a.created_at;
end $$;

-- Ajoute (ou renomme) une adresse ; si le compte existe déjà, il devient administrateur tout de suite.
create or replace function public.add_admin_email(p_email text, p_name text)
returns void language plpgsql security definer set search_path = public, auth as $$
begin
  if not public.is_admin() then raise exception 'Accès refusé'; end if;
  if p_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Adresse e-mail invalide'; end if;
  insert into public.admin_emails (email, full_name) values (lower(trim(p_email)), coalesce(nullif(trim(p_name), ''), 'Administrateur'))
  on conflict (email) do update set full_name = excluded.full_name;
  insert into public.profiles (user_id, full_name)
  select u.id, coalesce(nullif(trim(p_name), ''), 'Administrateur') from auth.users u where lower(u.email) = lower(trim(p_email))
  on conflict (user_id) do update set full_name = excluded.full_name;
end $$;

-- Retire une adresse et ses droits. Interdit de se retirer soi-même ou de retirer le dernier administrateur.
create or replace function public.remove_admin_email(p_email text)
returns void language plpgsql security definer set search_path = public, auth as $$
declare v_self text;
begin
  if not public.is_admin() then raise exception 'Accès refusé'; end if;
  select lower(email) into v_self from auth.users where id = auth.uid();
  if lower(trim(p_email)) = v_self then raise exception 'Vous ne pouvez pas retirer votre propre accès'; end if;
  if (select count(*) from public.admin_emails) <= 1 then raise exception 'Il doit rester au moins un administrateur'; end if;
  delete from public.admin_emails where email = lower(trim(p_email));
  delete from public.profiles where user_id in (select id from auth.users where lower(email) = lower(trim(p_email)));
end $$;

revoke all on function public.admin_accounts() from public, anon;
revoke all on function public.add_admin_email(text, text) from public, anon;
revoke all on function public.remove_admin_email(text) from public, anon;
grant execute on function public.admin_accounts() to authenticated;
grant execute on function public.add_admin_email(text, text) to authenticated;
grant execute on function public.remove_admin_email(text) to authenticated;
