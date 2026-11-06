"use client";

import { useState } from "react";
import { ChoiceGrid, ConsentField, FieldError, Honeypot, PhotoPicker, TextArea, TextField } from "@/components/forms/fields";
import { submitRequest } from "@/components/forms/submit";
import { SuccessPanel } from "@/components/forms/SuccessPanel";
import { Turnstile } from "@/components/forms/Turnstile";
import { failureNatures, urgencyLevels, type UrgencyLevel } from "@/lib/labels";

const urgencyOptions = (Object.entries(urgencyLevels) as [UrgencyLevel, string][]).map(([value, label]) => ({ value, label }));

export function DepannageForm() {
  const [failureNature, setFailureNature] = useState("");
  const [urgency, setUrgency] = useState<UrgencyLevel | "">("");
  const [description, setDescription] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState("");
  const [token, setToken] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<{ photosSent: number; photosFailed: number } | null>(null);

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const e: Record<string, string> = {};
    if (!failureNature) e.failureNature = "Indiquez la nature de la panne";
    if (!urgency) e.urgency = "Indiquez le niveau d'urgence";
    setErrors(e);
    if (!urgency || Object.keys(e).length > 0) return;

    setSending(true);
    setFormError("");
    const outcome = await submitRequest(
      {
        kind: "depannage",
        failureNature,
        urgency,
        description,
        addressLine,
        postalCode,
        city,
        firstName,
        lastName,
        phone,
        email,
        consent: consent as true,
        photoCount: photos.length,
        website,
        turnstileToken: token || undefined,
      },
      photos,
    );
    setSending(false);
    if (outcome.ok) {
      setDone({ photosSent: outcome.photosSent, photosFailed: outcome.photosFailed });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setErrors(outcome.fieldErrors ?? {});
      setFormError(outcome.error);
    }
  }

  if (done) return <SuccessPanel kind="depannage" {...done} />;

  return (
    <form onSubmit={onSubmit} noValidate className="relative space-y-6 rounded-xl border border-ligne bg-white p-6 sm:p-8">
      <div>
        <label htmlFor="failureNature" className="font-titre text-2xl font-bold text-nuit">
          Nature de la panne
        </label>
        <select
          id="failureNature"
          value={failureNature}
          onChange={(e) => setFailureNature(e.target.value)}
          className={`mt-3 block min-h-12 w-full rounded-lg border bg-white px-3 text-base ${errors.failureNature ? "border-rouge" : "border-ligne"}`}
        >
          <option value="">Choisir…</option>
          {failureNatures.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
        <FieldError message={errors.failureNature} />
      </div>

      <ChoiceGrid name="urgency" legend="Niveau d'urgence" options={urgencyOptions} value={urgency} onChange={setUrgency} error={errors.urgency} columns={1} />

      <TextArea id="description" label="Description du problème" hint="Ce qui s'est passé, depuis quand, ce qui ne fonctionne plus…" value={description} onChange={setDescription} error={errors.description} />

      <div className="space-y-4">
        <TextField id="addressLine" label="Adresse" value={addressLine} onChange={setAddressLine} error={errors.addressLine} autoComplete="street-address" />
        <div className="grid grid-cols-[8rem_1fr] gap-3">
          <TextField id="postalCode" label="Code postal" value={postalCode} onChange={setPostalCode} error={errors.postalCode} autoComplete="postal-code" inputMode="numeric" />
          <TextField id="city" label="Ville" value={city} onChange={setCity} error={errors.city} autoComplete="address-level2" />
        </div>
      </div>

      <PhotoPicker files={photos} onChange={setPhotos} />

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField id="firstName" label="Prénom" value={firstName} onChange={setFirstName} error={errors.firstName} autoComplete="given-name" />
        <TextField id="lastName" label="Nom" value={lastName} onChange={setLastName} error={errors.lastName} autoComplete="family-name" />
      </div>
      <TextField id="phone" label="Téléphone" type="tel" value={phone} onChange={setPhone} error={errors.phone} autoComplete="tel" inputMode="tel" />
      <TextField id="email" label="E-mail" type="email" value={email} onChange={setEmail} error={errors.email} autoComplete="email" inputMode="email" />
      <ConsentField checked={consent} onChange={setConsent} error={errors.consent} />
      <Turnstile onToken={setToken} />
      <Honeypot value={website} onChange={setWebsite} />

      {formError ? (
        <p role="alert" className="rounded-lg bg-rouge/10 px-4 py-3 text-rouge-fonce">
          {formError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={sending}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-rouge px-6 font-semibold text-white hover:bg-rouge-fonce disabled:opacity-60 sm:w-auto"
      >
        {sending ? "Envoi en cours…" : "Envoyer la demande de dépannage"}
      </button>
    </form>
  );
}
