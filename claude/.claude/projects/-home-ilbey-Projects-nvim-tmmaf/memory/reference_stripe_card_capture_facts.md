---
name: reference_stripe_card_capture_facts
description: "Verified Stripe facts for card last4/network capture and refund math — charge.succeeded carries card data, no event ordering guarantee, amount_refunded is cumulative, Troy unsupported"
metadata: 
  node_type: memory
  type: reference
  originSessionId: 32449b4e-0397-47b3-80f9-7766cac6662e
  modified: 2026-07-27T03:28:16.211Z
---

Researched 2026-07-27 via the Stripe MCP documentation tools + direct API-reference reads, locked
into phase 23. **Do not re-derive these; they are verbatim from Stripe docs.**

| Fact | Detail | Source |
|---|---|---|
| Card details live on `charge.succeeded` | `data.object` is the Charge → `payment_method_details.card.{brand,last4,network}`. `checkout.session.completed` carries **no** card details; `payment_intent.succeeded` sends `latest_charge` as a bare id | `docs.stripe.com/api/events/types` |
| It IS sent for Checkout/PaymentIntent | *"the `charge.succeeded` webhook is also sent"*; fires at the same time as `payment_intent.succeeded` | Payment Intents migration guide |
| Stripe's recommended approach | Listen to `checkout.session.completed` **and** `charge.succeeded`, linked by PaymentIntent id | Stripe support guidance |
| **No event-ordering guarantee** | *"Stripe doesn't guarantee the delivery of events in the order that they're generated."* | `docs.stripe.com/webhooks` § Event ordering |
| Retry window | Up to **3 days**, exponential backoff (live mode) | `docs.stripe.com/webhooks` § Automatic retries |
| `brand` vs `network` | `brand` = printed on the card; `network` = *"which card network processed the payment"*. **They differ on co-badged cards** — use `network` for "which network was used" | Co-badged cards compliance |
| `network` enum | `amex`, `cartes_bancaires`, `diners`, `discover`, `eftpos_au`, `interac`, `jcb`, `link`, `mastercard`, `unionpay`, `visa`, `unknown` | Charge object API ref |
| **Troy is NOT supported by Stripe** | Absent from both `brand` and `network` enums and from the supported-brand list. A Turkish Troy card surfaces as its co-badged scheme (visa/mastercard) or `unknown` | Charge API ref · `docs.stripe.com/payments/cards` |
| `charge.refunded` covers partials | Fires *"whenever a charge is refunded, **including partial refunds**"* | `docs.stripe.com/api/events/types` |
| `amount_refunded` is **cumulative** | Total refunded to date, *"can be less than the amount attribute on the charge if a partial refund was issued"* | Charge object API ref |

**Two traps these facts close:**

1. **Never `+=` a refund amount from a webhook.** Stripe retries for 3 days, so an accumulator
   double-counts on the first retry. Assign the cumulative `amount_refunded` instead — idempotent
   under both redelivery and out-of-order delivery.
2. **Never couple a card-metadata write to a settlement transition.** With no ordering guarantee,
   `charge.succeeded` can land before `checkout.session.completed`. The write must be an independent
   idempotent upsert keyed by the intent that no-ops when the row is absent, and settlement must not
   clobber it.

Related: [[project_payments_financial_phases_23_24]], [[project_payment_redirect_closed_tab_fix]],
[[project_dev_stripe_webhook_forwarder]].
