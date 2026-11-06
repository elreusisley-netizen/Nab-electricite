-- Nouvelle adresse e-mail de contact de l'entreprise.
alter table public.company_settings alter column email set default 'infos.eurlnab@gmail.com';
update public.company_settings set email = 'infos.eurlnab@gmail.com' where id = 1;
