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
  selectedMethod: BookingPaymentMethod;
  submitTrigger: number;
  onSelectedMethodChange: (value: BookingPaymentMethod) => void;
  onPaymentReadyChange: (value: boolean) => void;
  onPaymentSuccess: (paymentIntentId: string) => void;
  onPaymentError: (message: string) => void;
};

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

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
        await safeCancelPending(paymentIntentId);

        onPaymentError(getStripeErrorMessage(result.error));
        return;
      }

      if (result.paymentIntent?.status !== "succeeded") {
        await safeCancelPending(paymentIntentId);

        onPaymentError(
          `Paiement incomplet. Statut Stripe : ${
            result.paymentIntent?.status ?? "inconnu"
          }`,
        );
        return;
      }

      await confirmBookingPaymentIntent(result.paymentIntent.id);

      onPaymentSuccess(result.paymentIntent.id);
    } catch (error) {
      if (paymentIntentId) {
        await safeCancelPending(paymentIntentId);
      }

      onPaymentError(
        error instanceof Error
          ? error.message
          : "Erreur lors du paiement par carte.",
      );
    }
  }

  async function safeCancelPending(paymentIntentId: string) {
    try {
      await cancelBookingPaymentIntent(paymentIntentId);
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

      <div className="mt-4 space-y-3">
        <PaymentOption
          active={selectedMethod === "card"}
          title="Carte bancaire"
          description="CB, Visa, Mastercard"
          onClick={() => handleMethodChange("card")}
          logos={
            <>
              <CBLogo />
              <VisaLogo />
              <MastercardLogo />
            </>
          }
        />

        <PaymentOption
          active={selectedMethod === "paypal"}
          title="PayPal"
          description="Paiement rapide via PayPal"
          onClick={() => handleMethodChange("paypal")}
          logos={<PaypalLogo />}
        />

        {isCard ? (
          <div className="overflow-hidden rounded-[16px] border border-[#e1d8cb] bg-white">
            <div className="flex items-center justify-between gap-3 border-b border-[#eee7dc] px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-[#1e1e1e]">
                  Informations de carte
                </p>
                <p className="mt-0.5 text-xs text-[#8a847b]">
                  Paiement sécurisé par Stripe
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <CBLogo />
                <VisaLogo />
                <MastercardLogo />
              </div>
            </div>

            <div className="space-y-3 p-4">
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

              <div className="rounded-[14px] border border-[#e3dbcf] bg-[#fcfaf7] px-4 py-3 text-xs leading-5 text-[#6c675f]">
                Une validation bancaire par SMS ou application peut être
                demandée au moment du paiement.
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-[16px] border border-[#e1d8cb] bg-white p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-[#1e1e1e]">
                  Paiement via PayPal
                </p>
                <p className="mt-1 text-xs leading-5 text-[#6c675f]">
                  PayPal est sélectionnable côté UI, mais sera branché plus
                  tard.
                </p>
              </div>

              <PaypalLogo />
            </div>
          </div>
        )}
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

function PaymentOption({
  active,
  title,
  description,
  logos,
  onClick,
}: {
  active: boolean;
  title: string;
  description: string;
  logos: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-full rounded-[16px] border p-4 text-left transition",
        active
          ? "border-[#314835] bg-[#f3f7f1]"
          : "border-[#e1d8cb] bg-white hover:border-[#314835]/40",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#1e1e1e]">{title}</p>
          <p className="mt-1 text-xs leading-5 text-[#6c675f]">
            {description}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">{logos}</div>
      </div>
    </button>
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