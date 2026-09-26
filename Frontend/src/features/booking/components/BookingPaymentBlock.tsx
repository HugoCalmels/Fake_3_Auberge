"use client";

import { useEffect, useRef, useState } from "react";
import {
  CardCvcElement,
  CardExpiryElement,
  CardNumberElement,
  Elements,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import type { SelectedRoomLine } from "@/features/booking/types";
import {
  cancelBookingPaymentIntent,
  confirmBookingPaymentIntent,
  createBookingPaymentIntent,
} from "@/features/booking/api/bookings.api";

export type BookingPaymentMethod = "card" | "paypal";

type Props = {
  startDate: string;
  endDate: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  selectedRooms: SelectedRoomLine[];
  selectedMethod: BookingPaymentMethod | null;
  submitTrigger: number;
  onSelectedMethodChange: (value: BookingPaymentMethod) => void;
  onPaymentReadyChange: (value: boolean) => void;
  onPaymentSuccess: (paymentIntentId: string) => void;
  onPaymentError: (message: string) => void;
};

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

// Clé de test Stripe = site de démo : on affiche la carte de test au visiteur
const IS_STRIPE_TEST_MODE =
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.startsWith("pk_test_") ??
  false;

const DEMO_CARD_NUMBER = "4242 4242 4242 4242";

export default function BookingPaymentBlock(props: Props) {
  if (!stripePromise) {
    return (
      <section className="rounded-[18px] border border-[#e6c8c8] bg-white p-4 text-sm text-[#8c3b3b]">
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY manquant dans le .env frontend.
      </section>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <BookingPaymentBlockInner {...props} />
    </Elements>
  );
}

function BookingPaymentBlockInner({
  startDate,
  endDate,
  guestName,
  guestEmail,
  guestPhone,
  selectedRooms,
  selectedMethod,
  submitTrigger,
  onSelectedMethodChange,
  onPaymentReadyChange,
  onPaymentSuccess,
  onPaymentError,
}: Props) {
  const stripe = useStripe();
  const elements = useElements();

  const lastSubmitTrigger = useRef(submitTrigger);
  const paymentMethodsRef = useRef<HTMLDivElement>(null);

  const [cardNumberComplete, setCardNumberComplete] = useState(false);
  const [cardExpiryComplete, setCardExpiryComplete] = useState(false);
  const [cardCvcComplete, setCardCvcComplete] = useState(false);

  const isCard = selectedMethod === "card";
  const isCardComplete =
    cardNumberComplete && cardExpiryComplete && cardCvcComplete;

  useEffect(() => {
    onPaymentReadyChange(isCard && isCardComplete);
  }, [isCard, isCardComplete, onPaymentReadyChange]);

  useEffect(() => {
    if (submitTrigger === lastSubmitTrigger.current) return;

    lastSubmitTrigger.current = submitTrigger;

    if (!selectedMethod) {
      onPaymentError("Choisissez un moyen de paiement.");
      return;
    }

    if (selectedMethod !== "card") {
      onPaymentError("Le paiement PayPal sera branché plus tard.");
      return;
    }

    void submitCardPayment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitTrigger]);

  function handleMethodChange(value: BookingPaymentMethod) {
    onSelectedMethodChange(value);
    onPaymentReadyChange(value === "card" && isCardComplete);

    // Le formulaire carte se déplie sous l'option : on remonte le bloc en haut
    // de la modale pour que le client le voie en entier sans avoir à scroller.
    if (value === "card" && !isCard) {
      paymentMethodsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }

  async function submitCardPayment() {
    if (!stripe || !elements) {
      onPaymentError("Stripe n'est pas encore prêt.");
      return;
    }

    const cardNumberElement = elements.getElement(CardNumberElement);

    if (!cardNumberElement) {
      onPaymentError("Le champ carte bancaire est introuvable.");
      return;
    }

    let paymentIntentId: string | null = null;
    let clientSecret: string | null = null;

    try {
      const intent = await createBookingPaymentIntent({
        startDate,
        endDate,
        guestName: guestName.trim(),
        guestEmail: guestEmail.trim(),
        guestPhone: guestPhone.trim() || undefined,
        paymentMethod: "card",
        selections: selectedRooms.map((room) => ({
          roomTypeId: room.offerId,
          adults: room.adults,
          children: room.children,
          mealPlanCode: room.mealPlanCode,
        })),
      });

      paymentIntentId = intent.paymentIntentId;
      clientSecret = intent.clientSecret;

      const result = await stripe.confirmCardPayment(intent.clientSecret, {
        payment_method: {
          card: cardNumberElement,
          billing_details: {
            name: guestName.trim(),
            email: guestEmail.trim(),
            phone: guestPhone.trim() || undefined,
          },
        },
      });

      if (result.error) {
        await safeCancelPending(paymentIntentId, clientSecret);

        onPaymentError(getStripeErrorMessage(result.error));
        return;
      }

      if (result.paymentIntent?.status !== "succeeded") {
        await safeCancelPending(paymentIntentId, clientSecret);

        onPaymentError(
          `Paiement incomplet. Statut Stripe : ${
            result.paymentIntent?.status ?? "inconnu"
          }`,
        );
        return;
      }

      await confirmBookingPaymentIntent(result.paymentIntent.id, clientSecret);

      onPaymentSuccess(result.paymentIntent.id);
    } catch (error) {
      if (paymentIntentId) {
        await safeCancelPending(paymentIntentId, clientSecret);
      }

      onPaymentError(
        error instanceof Error
          ? error.message
          : "Erreur lors du paiement par carte.",
      );
    }
  }

  async function safeCancelPending(
    paymentIntentId: string,
    clientSecret: string | null,
  ) {
    if (!clientSecret) return;

    try {
      await cancelBookingPaymentIntent(paymentIntentId, clientSecret);
    } catch {
      // On affiche l'erreur Stripe principale au client.
      // Le nettoyage peut aussi être rattrapé plus tard par admin/cron.
    }
  }

  return (
    <section className="rounded-[18px] border border-[#d8d0c2] bg-[#fcfaf7] p-4">
      <div className="flex items-start justify-between gap-4">
        <StepTitle number="2" title="Paiement" />

        <span className="rounded-full border border-[#d8d0c2] bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#314835]">
          Sécurisé
        </span>
      </div>

      <div
        ref={paymentMethodsRef}
        role="radiogroup"
        aria-label="Moyen de paiement"
        className="mt-4 scroll-mt-4 overflow-hidden rounded-[16px] border border-[#e1d8cb] bg-white"
      >
        <PaymentMethodRow
          checked={isCard}
          title="Carte bancaire"
          description="CB, Visa, Mastercard"
          onSelect={() => handleMethodChange("card")}
          logos={
            <>
              <CBLogo />
              <VisaLogo />
              <MastercardLogo />
            </>
          }
        />

        {/* Toujours monté (les champs Stripe gardent leur saisie), replié visuellement */}
        <div
          className={[
            "grid transition-[grid-template-rows] duration-300 ease-out",
            isCard ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
          ].join(" ")}
        >
          <div className="overflow-hidden" inert={!isCard}>
            <div className="space-y-3 border-t border-[#eee7dc] bg-[#fcfaf7] p-4">
              {IS_STRIPE_TEST_MODE && <DemoCardNotice />}

              <StripeField label="Numéro de carte">
                <CardNumberElement
                  options={stripeElementOptions}
                  onChange={(event) => setCardNumberComplete(event.complete)}
                />
              </StripeField>

              <div className="grid grid-cols-2 gap-3">
                <StripeField label="Expiration">
                  <CardExpiryElement
                    options={stripeElementOptions}
                    onChange={(event) => setCardExpiryComplete(event.complete)}
                  />
                </StripeField>

                <StripeField label="CVC">
                  <CardCvcElement
                    options={stripeElementOptions}
                    onChange={(event) => setCardCvcComplete(event.complete)}
                  />
                </StripeField>
              </div>

              <p className="flex items-start gap-1.5 text-xs leading-5 text-[#8a847b]">
                <LockIcon />
                Paiement chiffré et traité par Stripe. Une validation par SMS ou
                application bancaire peut être demandée.
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-[#eee7dc]">
          <PaymentMethodRow
            checked={false}
            disabled
            title="PayPal"
            description="Paiement rapide via PayPal"
            badge="Bientôt"
            onSelect={() => handleMethodChange("paypal")}
            logos={<PaypalLogo />}
          />
        </div>
      </div>

      <p className="mt-3 text-xs leading-5 text-[#8a847b]">
        Vos informations bancaires ne sont jamais stockées par l’auberge.
      </p>
    </section>
  );
}

function getStripeErrorMessage(error: {
  message?: string;
  code?: string;
  decline_code?: string;
  type?: string;
}) {
  if (error.decline_code === "insufficient_funds") {
    return "Paiement refusé : fonds insuffisants.";
  }

  if (error.code === "incorrect_cvc") {
    return "Le code de sécurité CVC est incorrect.";
  }

  if (error.code === "expired_card") {
    return "La carte bancaire est expirée.";
  }

  if (error.code === "card_declined") {
    return "La carte a été refusée par la banque.";
  }

  if (error.type === "validation_error") {
    return "Certaines informations de carte sont invalides.";
  }

  return error.message ?? "Le paiement a échoué. Veuillez réessayer.";
}

const stripeElementOptions = {
  style: {
    base: {
      fontSize: "15px",
      color: "#1e1e1e",
      fontFamily:
        "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
      "::placeholder": {
        color: "#9a9489",
      },
    },
    invalid: {
      color: "#8c3b3b",
    },
  },
};

function StripeField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-[#6c675f]">
        {label}
      </label>

      <div className="rounded-[14px] border border-[#d8d0c2] bg-white px-4 py-3.5">
        {children}
      </div>
    </div>
  );
}

function PaymentMethodRow({
  checked,
  disabled = false,
  title,
  description,
  badge,
  logos,
  onSelect,
}: {
  checked: boolean;
  disabled?: boolean;
  title: string;
  description: string;
  badge?: string;
  logos: React.ReactNode;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      aria-label={badge ? `${title} (${badge.toLowerCase()})` : title}
      disabled={disabled}
      onClick={onSelect}
      className={[
        "flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors",
        checked && "bg-[#f3f7f1]",
        !checked && !disabled && "cursor-pointer hover:bg-[#faf8f4]",
        disabled && "cursor-not-allowed",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span
        aria-hidden
        className={[
          "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors",
          checked ? "border-[#314835]" : "border-[#c9c0b2]",
          disabled && "opacity-50",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <span
          className={[
            "h-2 w-2 rounded-full bg-[#314835] transition-transform duration-200",
            checked ? "scale-100" : "scale-0",
          ].join(" ")}
        />
      </span>

      <span
        className={["min-w-0 flex-1", disabled && "opacity-50"]
          .filter(Boolean)
          .join(" ")}
      >
        <span className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[#1e1e1e]">{title}</span>
          {badge && (
            <span className="rounded-full bg-[#efe9df] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8a847b]">
              {badge}
            </span>
          )}
        </span>
        <span className="mt-0.5 block text-xs leading-5 text-[#6c675f]">
          {description}
        </span>
      </span>

      <span
        className={[
          "flex shrink-0 items-center gap-1.5",
          disabled && "opacity-50 grayscale",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {logos}
      </span>
    </button>
  );
}

function DemoCardNotice() {
  const [copied, setCopied] = useState(false);

  async function copyCardNumber() {
    try {
      await navigator.clipboard.writeText(DEMO_CARD_NUMBER.replaceAll(" ", ""));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Presse-papiers indisponible : le numéro reste lisible à l'écran
    }
  }

  return (
    <div className="rounded-[14px] border border-dashed border-[#c9b98f] bg-[#fbf6e9] px-4 py-3">
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-[#314835] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-white">
          Démo
        </span>
        <p className="text-xs font-medium text-[#5c5443]">
          Aucun débit réel : utilisez la carte de test Stripe.
        </p>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-2">
        <button
          type="button"
          onClick={copyCardNumber}
          className="group flex cursor-pointer items-center gap-2 rounded-[10px] border border-[#e3d7b8] bg-white px-3 py-1.5 transition hover:border-[#314835]/40"
          aria-label="Copier le numéro de carte de test"
        >
          <span className="font-mono text-[13px] tracking-[0.06em] text-[#1e1e1e]">
            {DEMO_CARD_NUMBER}
          </span>
          <span className="text-[11px] font-semibold text-[#314835]">
            {copied ? "Copié ✓" : "Copier"}
          </span>
        </button>

        <p className="text-[11px] leading-4 text-[#8a847b]">
          Date future au choix · CVC : 3 chiffres au choix
        </p>
      </div>
    </div>
  );
}

function LockIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className="mt-[3px] h-3 w-3 shrink-0 fill-current"
    >
      <path d="M8 1a3.5 3.5 0 0 0-3.5 3.5V6H4a1.5 1.5 0 0 0-1.5 1.5v6A1.5 1.5 0 0 0 4 15h8a1.5 1.5 0 0 0 1.5-1.5v-6A1.5 1.5 0 0 0 12 6h-.5V4.5A3.5 3.5 0 0 0 8 1Zm2 5H6V4.5a2 2 0 1 1 4 0V6Z" />
    </svg>
  );
}

function StepTitle({ number, title }: { number: string; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#314835] text-[11px] font-semibold text-white">
        {number}
      </span>
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8a847b]">
        {title}
      </p>
    </div>
  );
}

function VisaLogo() {
  return (
    <span className="inline-flex h-[18px] min-w-[32px] items-center justify-center rounded-[3px] border border-[#d7dbe8] bg-white px-1 text-[10px] font-black italic tracking-[-0.04em] text-[#1434CB]">
      VISA
    </span>
  );
}

function MastercardLogo() {
  return (
    <span className="relative inline-flex h-[18px] w-[32px] items-center justify-center overflow-hidden rounded-[3px] border border-[#d7dbe8] bg-white">
      <span className="absolute left-[7px] h-[13px] w-[13px] rounded-full bg-[#eb001b]" />
      <span className="absolute right-[7px] h-[13px] w-[13px] rounded-full bg-[#f79e1b] mix-blend-multiply" />
    </span>
  );
}

function CBLogo() {
  return (
    <span className="inline-flex h-[18px] min-w-[28px] items-center justify-center rounded-[3px] bg-[#0066a4] px-1 text-[9px] font-black tracking-[-0.03em] text-white">
      CB
    </span>
  );
}

function PaypalLogo() {
  return (
    <span className="inline-flex h-[20px] items-center rounded-[4px] bg-[#0070ba] px-2 text-[10px] font-bold text-white">
      Pay<span className="text-[#bfe6ff]">Pal</span>
    </span>
  );
}
