"use client";

import { useActionState } from "react";
import { acceptQuote, type AcceptState } from "./actions";

export function AcceptForm({ token, amount }: { token: string; amount: string }) {
  const [state, action, pending] = useActionState<AcceptState, FormData>(acceptQuote, null);
  if (state?.ok) {
    return (
      <div role="status" className="rounded-xl border-2 border-nuit bg-white p-5">
        <p className="font-titre text-2xl font-bold text-nuit">Merci, votre accord est enregistré.</p>
        <p className="mt-1 text-texte">Nous vous recontactons pour convenir de la date d&apos;intervention.</p>
      </div>
    );
  }
  return (
    <form action={action} className="space-y-4 rounded-xl border border-ligne bg-white p-5 print:hidden">
      <input type="hidden" name="token" value={token} />
      <p className="font-titre text-2xl font-bold text-nuit">Accepter ce devis</p>
      <div>
        <label htmlFor="acc-name" className="block text-[0.7rem] font-semibold tracking-widest text-discret uppercase">Vos nom et prénom</label>
        <input id="acc-name" name="name" required autoComplete="name" className="mt-1.5 w-full rounded-lg border border-ligne px-3 py-2.5 text-base" />
      </div>
      <label className="flex items-start gap-3 text-sm text-texte">
        <input type="checkbox" name="agree" required className="mt-1 size-5 shrink-0 accent-nuit" />
        <span>« Bon pour accord » : j&apos;accepte ce devis pour un montant de {amount} TTC et les conditions qui y figurent.</span>
      </label>
      {state?.error ? <p role="alert" className="rounded-lg bg-rouge/10 px-4 py-3 text-sm text-rouge-fonce">{state.error}</p> : null}
      <button type="submit" disabled={pending} className="min-h-12 w-full rounded-full bg-rouge px-6 font-semibold text-white disabled:opacity-60 sm:w-auto">
        {pending ? "Enregistrement…" : "Je donne mon accord"}
      </button>
    </form>
  );
}
