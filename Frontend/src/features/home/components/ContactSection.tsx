"use client";

import { useState } from "react";
import {
  FaAccessibleIcon,
  FaCarSide,
  FaCheckCircle,
  FaCreditCard,
  FaEnvelope,
  FaExclamationCircle,
  FaHiking,
  FaMapMarkerAlt,
  FaParking,
  FaPhoneAlt,
  FaSkiing,
  FaSwimmingPool,
  FaUsers,
  FaWifi,
} from "react-icons/fa";
import { MdBreakfastDining, MdMeetingRoom, MdOutdoorGrill } from "react-icons/md";
import { GiFishing, GiMountainRoad } from "react-icons/gi";
import { createContactMessage } from "@/features/home/api/contact.api";

type FormState = {
  name: string;
  email: string;
  message: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const INITIAL_FORM: FormState = {
  name: "",
  email: "",
  message: "",
};

export default function ContactSection() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const messageLength = form.message.trim().length;

  function updateField(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSuccess("");
    setError("");

    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateForm(form);
    setFieldErrors(nextErrors);
    setSuccess("");
    setError("");

    if (Object.keys(nextErrors).length > 0) {
      setError("Merci de corriger les champs indiqués avant l’envoi.");
      return;
    }

    setSending(true);

    try {
      await createContactMessage({
        name: form.name.trim(),
        email: form.email.trim(),
        message: form.message.trim(),
      });

      setForm(INITIAL_FORM);
      setFieldErrors({});
      setSuccess("Message envoyé avec succès. Nous reviendrons vers vous rapidement.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible d’envoyer le message pour le moment.",
      );
    } finally {
      setSending(false);
    }
  }

  return (
<section id="contact" className=" overflow-hidden bg-[#e7e1d7]">
      <div className="mx-auto max-w-[1280px] px-4 pt-24 pb-20 sm:px-6 lg:px-8 lg:pt-28 lg:pb-24">
<div className="max-w-[720px]">
  <h2
    className="text-4xl font-semibold leading-[1.05] tracking-[-0.03em] text-[#2d2c29] sm:text-5xl"
    style={{ marginBottom: "32px" }}
  >
    Infos pratiques
  </h2>

  <div style={{ marginTop: "32px" }}>
    <p className="max-w-[760px] text-[17px] leading-8 text-[#5f5a52]">
      Une question sur un séjour, une réservation ou une venue en groupe ?
      Contactez directement l’auberge.
    </p>
  </div>
</div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-stretch">
          <div className="rounded-[28px] border border-[#d8d1c6] bg-[#f8f4ed] p-6 shadow-[0_12px_34px_rgba(0,0,0,0.05)] sm:p-7">
            <div className="space-y-4">
              <InfoBlock
                icon={<FaMapMarkerAlt />}
                label="Adresse"
                value={
                  <>
                    Auberge du Fauxcalm
                    <br />
                    Vallée du Vicdessos · Ariège
                  </>
                }
              />

              <InfoBlock icon={<FaPhoneAlt />} label="Téléphone" value="05 61 00 00 00" />

              <InfoBlock
                icon={<FaEnvelope />}
                label="Email"
                value="contact@aubergedufauxcalm.fr"
              />
            </div>

            <div className="mt-6 border-t border-[#d8d1c6] pt-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8c7b5d]">
                Services & équipements
              </p>

              <div className="mt-4 grid gap-x-5 gap-y-3 sm:grid-cols-2">
                <ServiceItem icon={<FaWifi />} label="Wi-Fi" />
                <ServiceItem icon={<FaParking />} label="Parking privé" />
                <ServiceItem icon={<FaAccessibleIcon />} label="Accès handicapé" />
                <ServiceItem icon={<MdOutdoorGrill />} label="Terrasse" />
                <ServiceItem icon={<MdMeetingRoom />} label="Salle de réunion" />
                <ServiceItem icon={<FaUsers />} label="Accueil groupes" />
                <ServiceItem icon={<MdBreakfastDining />} label="Petit-déjeuner" />
                <ServiceItem icon={<FaCreditCard />} label="Cartes & chèques vacances" />
              </div>
            </div>

            <div className="mt-6 border-t border-[#d8d1c6] pt-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8c7b5d]">
                À proximité
              </p>

              <div className="mt-4 grid gap-x-5 gap-y-3 sm:grid-cols-2">
                <ServiceItem icon={<FaHiking />} label="Randonnée" />
                <ServiceItem icon={<FaSkiing />} label="Ski & neige" />
                <ServiceItem icon={<FaSwimmingPool />} label="Piscine" />
                <ServiceItem icon={<GiFishing />} label="Pêche" />
                <ServiceItem icon={<FaCarSide />} label="Commerces" />
                <ServiceItem icon={<GiMountainRoad />} label="Activités nature" />
              </div>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            noValidate
            className="flex h-full flex-col rounded-[28px] border border-[#d8d1c6] bg-white p-6 shadow-[0_12px_34px_rgba(0,0,0,0.05)] sm:p-7"
          >
            <h3 className="text-2xl font-semibold tracking-[-0.03em] text-[#2d2c29]">
              Nous contacter
            </h3>

            <p className="mt-3 text-[15px] leading-7 text-[#6a645d]">
              Pour une demande de groupe, un renseignement ou une question avant
              réservation.
            </p>

            <div className="mt-7 grid gap-4">
              <Field label="Nom" error={fieldErrors.name}>
                <input
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  placeholder="Votre nom"
                  className={getInputClassName(Boolean(fieldErrors.name))}
                  disabled={sending}
                  autoComplete="name"
                />
              </Field>

              <Field label="Email" error={fieldErrors.email}>
                <input
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  type="email"
                  placeholder="vous@email.fr"
                  className={getInputClassName(Boolean(fieldErrors.email))}
                  disabled={sending}
                  autoComplete="email"
                />
              </Field>

              <Field label="Message" error={fieldErrors.message}>
                <textarea
                  value={form.message}
                  onChange={(event) => updateField("message", event.target.value)}
                  rows={6}
                  maxLength={3000}
                  placeholder="Votre message"
                  className={`${getInputClassName(Boolean(fieldErrors.message))} resize-none`}
                  disabled={sending}
                />

                <div className="mt-2 text-right text-xs text-[#8a8176]">
                  {messageLength}/3000
                </div>
              </Field>
            </div>

            <div className="mt-3">
              <button
                type="submit"
                disabled={sending}
                className="cursor-pointer rounded-full bg-[#7f8d81] px-8 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-[#f4efe7] transition hover:bg-[#6f7d71] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {sending ? "Envoi..." : "Envoyer"}
              </button>

       <div className="mt-3">
                {success ? <StatusMessage type="success" message={success} /> : null}
                {error ? <StatusMessage type="error" message={error} /> : null}
              </div>
            </div>

            <p className="mt-auto border-t border-[#eee7dc] pt-4 text-xs leading-5 text-[#8a8176]">
              Vos informations sont utilisées uniquement pour répondre à votre demande.
              Elles ne sont pas revendues ni utilisées à des fins commerciales.
            </p>
          </form>
        </div>

        <div className="mt-6 overflow-hidden rounded-[28px] border border-[#d8d1c6] bg-[#ddd4c8] shadow-[0_12px_34px_rgba(0,0,0,0.05)]">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m10!1m8!1m3!1d68000!2d1.5042570526533918!3d42.805756859438944!3m2!1i1024!2i768!4f12.95!5e1!3m2!1sfr!2sfr!4v1778349394834!5m2!1sfr!2sfr"
            width="100%"
            height="420"
            className="block border-0"
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Carte vallée du Vicdessos"
          />
        </div>
      </div>

      <style jsx>{`
        .field-input {
          width: 100%;
          border-radius: 1rem;
          border: 1px solid #d8d1c6;
          background: #f8f4ed;
          padding: 0.9rem 1rem;
          font-size: 15px;
          color: #2d2c29;
          outline: none;
          transition:
            border-color 0.18s ease,
            box-shadow 0.18s ease,
            background-color 0.18s ease;
        }

        .field-input:focus {
          border-color: #314835;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(49, 72, 53, 0.08);
        }

        .field-input:disabled {
          cursor: not-allowed;
          opacity: 0.7;
        }

        .field-input-error {
          border-color: #b91c1c;
          background: #fff7f7;
        }

        .field-input-error:focus {
          border-color: #b91c1c;
          box-shadow: 0 0 0 3px rgba(185, 28, 28, 0.08);
        }
      `}</style>
    </section>
  );
}

function validateForm(form: FormState): FormErrors {
  const errors: FormErrors = {};

  if (form.name.trim().length < 2) {
    errors.name = "Indiquez un nom valide.";
  }

  if (!isValidEmail(form.email)) {
    errors.email = "Indiquez une adresse email valide.";
  }

  if (form.message.trim().length < 10) {
    errors.message = "Votre message doit contenir au moins 10 caractères.";
  }

  return errors;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function getInputClassName(hasError: boolean) {
  return `field-input ${hasError ? "field-input-error" : ""}`;
}

function StatusMessage({
  type,
  message,
}: {
  type: "success" | "error";
  message: string;
}) {
  const isSuccess = type === "success";

  return (
    <div
      className={`flex items-start gap-3 rounded-[18px] border px-4 py-3 text-sm leading-6 ${
        isSuccess
          ? "border-[#314835]/20 bg-[#314835]/8 text-[#314835]"
          : "border-[#B91C1C]/25 bg-[#B91C1C]/8 text-[#8f1515]"
      }`}
    >
      <span className="mt-1 shrink-0">
        {isSuccess ? <FaCheckCircle /> : <FaExclamationCircle />}
      </span>

      <p className="font-medium">{message}</p>
    </div>
  );
}

function InfoBlock({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex gap-4">
      <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#314835] text-[15px] text-[#f4efe7]">
        {icon}
      </span>

      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8c7b5d]">
          {label}
        </p>

        <div className="mt-1 break-words text-[15px] leading-6 text-[#2d2c29]">
          {value}
        </div>
      </div>
    </div>
  );
}

function ServiceItem({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 text-[15px] text-[#2d2c29]">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[15px] text-[#314835] shadow-[0_1px_0_rgba(0,0,0,0.04)]">
        {icon}
      </span>

      <span className="leading-5">{label}</span>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.14em] text-[#8c7b5d]">
        {label}
      </span>

      {children}

      {error ? (
        <p className="mt-2 text-sm font-medium text-[#B91C1C]">{error}</p>
      ) : null}
    </label>
  );
}