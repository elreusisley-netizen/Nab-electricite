import { signIn } from "../actions";

const messages: Record<string, string> = {
  identifiants: "E-mail ou mot de passe incorrect.",
  format: "E-mail invalide ou mot de passe trop court (8 caractères minimum).",
  "non-confirme": "Ce compte n'est pas encore confirmé dans Supabase.",
  technique: "Connexion à Supabase impossible : vérifier les clés dans Vercel.",
  acces: "Ce compte n'a pas accès à l'administration.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const { erreur } = await searchParams;
  const message = erreur ? messages[erreur] : undefined;

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <form action={signIn} className="w-full max-w-sm rounded-xl border border-ligne bg-white p-8">
        <h1 className="font-titre text-2xl font-bold text-nuit">Administration</h1>
        <p className="mt-1 text-sm text-discret">Électricité N.A.B.</p>

        {message ? (
          <p role="alert" className="mt-6 rounded-lg bg-rouge/10 px-4 py-3 text-sm text-rouge-fonce">
            {message}
          </p>
        ) : null}

        <label htmlFor="email" className="mt-6 block text-sm font-medium text-encre">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="mt-1 block min-h-11 w-full rounded-lg border border-ligne px-3"
        />

        <label htmlFor="password" className="mt-4 block text-sm font-medium text-encre">
          Mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={8}
          className="mt-1 block min-h-11 w-full rounded-lg border border-ligne px-3"
        />

        <button
          type="submit"
          className="mt-6 min-h-12 w-full rounded-lg bg-rouge font-semibold text-white hover:bg-rouge-fonce"
        >
          Se connecter
        </button>
      </form>
    </main>
  );
}
