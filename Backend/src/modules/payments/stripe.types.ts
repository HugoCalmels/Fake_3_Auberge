import type Stripe from 'stripe';

// stripe@22 n'exporte plus Stripe.PaymentIntent, Stripe.Event... depuis son
// point d'entrée CJS, mais exporte bien le type du client : on en déduit les
// types des ressources utilisées plutôt que de retomber sur `any`.
export type StripeClient = Stripe.Stripe;

// Les appels API renvoient la ressource + `lastResponse` (en-têtes HTTP) ; les
// objets reçus par webhook n'ont pas ce champ, on le retire pour couvrir les deux.
type WithoutResponse<T> = Omit<T, 'lastResponse'>;

export type StripePaymentIntent = WithoutResponse<
  Awaited<ReturnType<StripeClient['paymentIntents']['retrieve']>>
>;

export type StripeCheckoutSession = WithoutResponse<
  Awaited<ReturnType<StripeClient['checkout']['sessions']['retrieve']>>
>;

export type StripeEvent = ReturnType<
  StripeClient['webhooks']['constructEvent']
>;

export type StripeMetadata = StripePaymentIntent['metadata'];
