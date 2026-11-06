"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { addAdmin, listAccounts, removeAdmin, setPassword, type AccountRow } from "@/app/admin/comptes-actions";
import { formatDateTime } from "@/lib/labels";

const field = "mt-1.5 w-full rounded-lg border border-ligne bg-white px-3 py-2.5 text-base text-encre focus:border-nuit focus:outline-none";
const label = "block text-[0.7rem] font-semibold tracking-widest text-discret uppercase";

export function AccountsView({ onToast }: { onToast: (m: string) => void }) {
  const [rows, setRows] = useState<AccountRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pwdFor, setPwdFor] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setRows(await listAccounts());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chargement impossible.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function run(p: Promise<{ ok: true; message: string } | { ok: false; error: string }>) {
    setBusy(true);
    setError(null);
    const res = await p;
    setBusy(false);
    if (res.ok) {
      onToast(res.message);
      await load();
      return true;
    }
    setError(res.error);
    return false;
  }

  async function onAdd(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const ok = await run(
      addAdmin({
        email: String(fd.get("email") ?? ""),
        fullName: String(fd.get("fullName") ?? ""),
        password: String(fd.get("password") ?? "") || undefined,
      }),
    );
    if (ok) form.reset();
  }

  async function onPassword(e: FormEvent<HTMLFormElement>, email: string) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const ok = await run(setPassword({ email, password: String(fd.get("password") ?? "") }));
    if (ok) setPwdFor(null);
  }

  return (
    <div className="space-y-6">
      <p className="text-texte">
        Les adresses de cette liste ont accès à l&apos;administration. Un compte créé ou recréé avec l&apos;une d&apos;elles
        devient administrateur automatiquement.
      </p>

      {error ? (
        <p role="alert" className="rounded-lg bg-rouge/10 px-4 py-3 text-sm text-rouge-fonce">
          {error}
        </p>
      ) : null}

      <ul className="space-y-3">
        {rows === null ? <li className="text-discret">Chargement…</li> : null}
        {rows?.map((r) => (
          <li key={r.email} className="rounded-xl border border-ligne bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-titre text-xl font-bold text-nuit">
                  {r.fullName}
                  {r.isMe ? <span className="ml-2 text-sm font-normal text-discret">(vous)</span> : null}
                </p>
                <p className="break-all text-sm text-texte">{r.email}</p>
                <p className="mt-1 text-xs text-discret">
                  {!r.hasAccount
                    ? "Compte pas encore créé"
                    : !r.confirmed
                      ? "Compte non confirmé"
                      : r.lastSignIn
                        ? `Dernière connexion : ${formatDateTime(r.lastSignIn)}`
                        : "Jamais connecté"}
                </p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${r.hasAccount && r.confirmed ? "bg-nuit text-white" : "bg-fond text-discret"}`}>
                {r.hasAccount && r.confirmed ? "Actif" : "En attente"}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {r.hasAccount ? (
                <button type="button" onClick={() => setPwdFor(pwdFor === r.email ? null : r.email)} className="min-h-10 rounded-lg border border-ligne px-4 text-sm text-nuit">
                  Changer le mot de passe
                </button>
              ) : null}
              {!r.isMe ? (
                confirmRemove === r.email ? (
                  <span className="flex items-center gap-2 text-sm">
                    Retirer l&apos;accès ?
                    <button type="button" disabled={busy} onClick={() => run(removeAdmin(r.email)).then(() => setConfirmRemove(null))} className="min-h-10 rounded-lg bg-rouge px-4 text-white">
                      Oui
                    </button>
                    <button type="button" onClick={() => setConfirmRemove(null)} className="min-h-10 px-2 underline">
                      Non
                    </button>
                  </span>
                ) : (
                  <button type="button" onClick={() => setConfirmRemove(r.email)} className="min-h-10 px-2 text-sm text-rouge-fonce underline underline-offset-4">
                    Retirer l&apos;accès
                  </button>
                )
              ) : null}
            </div>

            {pwdFor === r.email ? (
              <form onSubmit={(e) => onPassword(e, r.email)} className="mt-4 flex flex-wrap items-end gap-3">
                <div className="min-w-[14rem] flex-1">
                  <label htmlFor={`pwd-${r.email}`} className={label}>Nouveau mot de passe</label>
                  <input id={`pwd-${r.email}`} name="password" type="password" minLength={8} required autoComplete="new-password" className={field} />
                </div>
                <button type="submit" disabled={busy} className="min-h-11 rounded-lg bg-nuit px-5 font-semibold text-white disabled:opacity-60">
                  Enregistrer
                </button>
              </form>
            ) : null}
          </li>
        ))}
      </ul>

      <form onSubmit={onAdd} className="space-y-4 rounded-xl border border-ligne bg-white p-5">
        <h2 className="font-titre text-xl font-bold text-nuit">Ajouter un administrateur</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="acc-name" className={label}>Nom</label>
            <input id="acc-name" name="fullName" placeholder="Prénom Nom" className={field} />
          </div>
          <div>
            <label htmlFor="acc-email" className={label}>E-mail *</label>
            <input id="acc-email" name="email" type="email" required inputMode="email" className={field} />
          </div>
        </div>
        <div>
          <label htmlFor="acc-pwd" className={label}>Mot de passe (pour créer le compte tout de suite)</label>
          <input id="acc-pwd" name="password" type="password" minLength={8} autoComplete="new-password" placeholder="8 caractères minimum" className={field} />
          <p className="mt-1 text-xs text-discret">Laissez vide pour seulement autoriser l&apos;adresse : le compte pourra être créé plus tard dans Supabase.</p>
        </div>
        <button type="submit" disabled={busy} className="min-h-12 rounded-full bg-nuit px-7 font-semibold text-white disabled:opacity-60">
          {busy ? "En cours…" : "Ajouter"}
        </button>
      </form>
    </div>
  );
}
