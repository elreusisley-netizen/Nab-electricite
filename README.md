# Électricité N.A.B. — site public et espace administrateur

Une seule application Next.js : le site public (`src/app/(site)`) et l'administration (`src/app/admin`),
reliés à la même base Supabase.

## Pile

Next.js (App Router), React, TypeScript, Tailwind CSS 4, Supabase (base, connexion, fichiers, RLS),
Resend (e-mails, phase 3), Vercel.

## Démarrer en local

1. `npm install`
2. Copier `.env.example` en `.env.local` et renseigner les clés Supabase.
3. `npm run dev`, puis ouvrir http://localhost:3000 (site) et http://localhost:3000/admin (administration).

## Base de données

Le schéma est dans `supabase/migrations/`. Il est déjà appliqué sur le projet Supabase.
Toute évolution se fait par un nouveau fichier de migration, jamais en modifiant un fichier existant.

Comptes administrateurs : créer l'utilisateur dans Supabase > Authentication, puis :

```sql
insert into public.profiles (user_id, full_name)
select id, 'Prénom Nom' from auth.users where email = 'adresse@exemple.fr';
```

## Sécurité

- La clé `SUPABASE_SECRET_KEY` reste côté serveur (`src/lib/supabase/admin.ts`, importé seulement par du code serveur).
- `/admin` est protégé par le middleware, par `requireAdmin()` dans chaque page et action, et par la RLS.
- Les inscriptions publiques sont désactivées dans Supabase.

## Phases

0. Audit et architecture — fait
1. Direction artistique, schéma de base, dépôt, déploiement — en cours
2. Pages du site public
3. Formulaires, e-mails, liste des demandes
4. Structure de l'admin, tableau de bord, PWA
5. Agenda et interventions
6. Clients et devis
7. Statistiques, facturation externe, édition du site
8. Notifications, sécurité, tests, mise en ligne
