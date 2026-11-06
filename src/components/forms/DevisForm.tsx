"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";
import { ChoiceGrid, ConsentField, Honeypot, PhotoPicker, TextArea, TextField } from "@/components/forms/fields";
import { submitRequest } from "@/components/forms/submit";
import { SuccessPanel } from "@/components/forms/SuccessPanel";
import { Turnstile } from "@/components/forms/Turnstile";
import {
  buildingTypes,
  clientTypes,
  requestServices,
  type BuildingType,
  type ClientType,
  type RequestService,
} from "@/lib/labels";

const STEPS = ["Vous êtes", "Bâtiment", "Prestation", "Projet", "Coordonnées"];

const toOptions = <T extends string>(o: Record<T, string>) =>
  (Object.entries(o) as [T, string][]).map(([value, label]) => ({ value, label }));

export function DevisForm({ initialService }: { initialService?: RequestService }) {
  const [step, setStep] = useState(0);
  const [clientType, setClientType] = useState<ClientType | "">("");
  const [buildingType, setBuildingType] = useState<BuildingType | "">("");
  const [service, setService] = useState<RequestService | "">(initialService ?? "");
  const [addressLine, setAddressLine] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [description, setDescription] = useState("");
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

  function validateStep(s: number) {
    const e: Record<string, string> = {};
    if (s === 0 && !clientType) e.clientType = "Choisissez une option";
    if (s === 1 && !buildingType) e.buildingType = "Choisissez une option";
    if (s === 2 && !service) e.service = "Choisissez une prestation";
    if (s === 3) {
      if (addressLine.trim().length < 3) e.addressLine = "Adresse requise";
      if (!/^\d{5}$/.test(postalCode.trim())) e.postalCode = "Code postal à 5 chiffres";
      if (!city.trim()) e.city = "Ville requise";
      if (description.trim().length < 10) e.description = "Décrivez votre projet en quelques mots";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function next() {
    if (validateStep(step)) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (step < STEPS.length - 1) return next();
    if (!clientType || !buildingType || !service) return;
    setSending(true);
    setFormError("");
    const outcome = await submitRequest(
      {
        kind: "devis",
        clientType,
        buildingType,
        service,
        addressLine,
        postalCode,
        city,
        description,
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

  if (done) return <SuccessPanel kind="devis" {...done} />;

  const isLast = step === STEPS.length - 1;

  return (
    <form onSubmit={onSubmit} noValidate className="relative rounded-xl border border-ligne bg-white p-6 sm:p-8">
      <ol className="mb-8 flex gap-1" aria-label="Étapes">
        {STEPS.map((label, i) => (
          <li key={label} className="flex-1">
            <span className={`block h-1.5 rounded ${i <= step ? "bg-rouge" : "bg-ligne"}`} />
            <span className={`mt-2 hidden text-xs sm:block ${i === step ? "font-semibold text-nuit" : "text-discret"}`}>
              {i + 1}. {label}
            </span>
          </li>
        ))}
      </ol>
      <p className="mb-6 text-sm text-discret sm:hidden">
        Étape {step + 1} sur {STEPS.length} : {STEPS[step]}
      </p>

      {step === 0 ? (
        <ChoiceGrid name="clientType" legend="Vous êtes…" options={toOptions(clientTypes)} value={clientType} onChange={setClientType} error={errors.clientType} />
      ) : null}
      {step === 1 ? (
        <ChoiceGrid name="buildingType" legend="Type de bâtiment" options={toOptions(buildingTypes)} value={buildingType} onChange={setBuildingType} error={errors.buildingType} />
      ) : null}
      {step === 2 ? (
        <ChoiceGrid name="service" legend="Prestation souhaitée" options={toOptions(requestServices)} value={service} onChange={setService} error={errors.service} />
      ) : null}
      {step === 3 ? (
        <div className="space-y-5">
          <h2 className="font-titre text-2xl font-bold text-nuit">Votre projet</h2>
          <TextField id="addressLine" label="Adresse du chantier" value={addressLine} onChange={setAddressLine} error={errors.addressLine} autoComplete="street-address" />
          <div className="grid grid-cols-[8rem_1fr] gap-3">
            <TextField id="postalCode" label="Code postal" value={postalCode} onChange={setPostalCode} error={errors.postalCode} autoComplete="postal-code" inputMode="numeric" />
            <TextField id="city" label="Ville" value={city} onChange={setCity} error={errors.city} autoComplete="address-level2" />
          </div>
          <TextArea id="description" label="Description du projet" hint="Ce que vous souhaitez faire, la surface, vos délais…" value={description} onChange={setDescription} error={errors.description} />
          <PhotoPicker files={photos} onChange={setPhotos} />
        </div>
      ) : null}
      {isLast ? (
        <div className="space-y-5">
          <h2 className="font-titre text-2xl font-bold text-nuit">Vos coordonnées</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField id="firstName" label="Prénom" value={firstName} onChange={setFirstName} error={errors.firstName} autoComplete="given-name" />
            <TextField id="lastName" label="Nom" value={lastName} onChange={setLastName} error={errors.lastName} autoComplete="family-name" />
          </div>
          <TextField id="phone" label="Téléphone" type="tel" value={phone} onChange={setPhone} error={errors.phone} autoComplete="tel" inputMode="tel" />
          <TextField id="email" label="E-mail" type="email" value={email} onChange={setEmail} error={errors.email} autoComplete="email" inputMode="email" />
          <ConsentField checked={consent} onChange={setConsent} error={errors.consent} />
          <Turnstile onToken={setToken} />
        </div>
      ) : null}

      <Honeypot value={website} onChange={setWebsite} />

      {formError ? (
        <p role="alert" className="mt-6 rounded-lg bg-rouge/10 px-4 py-3 text-rouge-fonce">
          {formError}
        </p>
      ) : null}

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        {step > 0 ? (
          <button type="button" onClick={() => setStep((s) => s - 1)} className="min-h-12 px-2 font-semibold text-nuit underline-offset-4 hover:underline">
            Retour
          </button>
        ) : (
          <span />
        )}
        <button
          type="submit"
          disabled={sending}
          className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-rouge px-6 font-semibold text-white hover:bg-rouge-fonce disabled:opacity-60"
        >
          {isLast ? (sending ? "Envoi en cours…" : "Envoyer ma demande") : "Continuer"}
          {sending ? null : <Icon name="arrow" size={18} strokeWidth={2} />}
        </button>
      </div>
    </form>
  );
}
