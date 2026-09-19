# Payment & SMS providers

Both integrations sit behind a port, so switching provider is a settings change —
no service or router code moves.

| Concern | Port | Setting |
| --- | --- | --- |
| Payments | `apps.payments.providers.base.PaymentProvider` | `PAYMENT_PROVIDER` |
| SMS / OTP | `apps.users.sms.SmsBackend` | `SMS_BACKEND` |

Outbound calls go through `apps.common.http.post_json`, which owns the timeout
(8s), the retry budget, and the backoff. Nothing there logs a URL or a body:
ZarinPal's merchant id and Kavenegar's API key both travel inside the request.

## Payments

### Local sandbox (default for development)

`apps.payments.providers.local.LocalSandboxProvider` never contacts a bank. The
checkout result page shows explicit "paid / failed" buttons so the flow can be
exercised end to end. It refuses to load unless `PAYMENTS_ALLOW_SANDBOX` is on,
and `config.settings.production` refuses to boot with it configured.

### ZarinPal

```env
PAYMENT_PROVIDER=apps.payments.providers.zarinpal.ZarinPalProvider
ZARINPAL_MERCHANT_ID=<uuid from the ZarinPal panel>
ZARINPAL_BASE_URL=https://payment.zarinpal.com   # sandbox.zarinpal.com while testing
PAYMENTS_CALLBACK_BASE_URL=https://api.orfwear.ir
STOREFRONT_BASE_URL=https://orfwear.ir
PAYMENTS_ALLOW_SANDBOX=false
```

Flow:

1. Checkout commits the order, then `get_or_start_payment` asks ZarinPal for an
   *authority* and stores it as the intent's `provider_ref`.
2. The storefront sends the shopper to `.../pg/StartPay/<authority>`.
3. ZarinPal returns them to `GET /api/v1/payments/callback` with `Authority` and
   `Status`.
4. The API verifies server-to-server, settles the intent, and only then redirects
   to `/checkout/result`.

Two properties worth keeping if this is ever edited:

- **The callback is not trusted.** ZarinPal does not sign the redirect, so a
  forged one settles nothing; the verify call is the proof. The amount sent to
  verification is read from our own `PaymentIntent`, never from the query string,
  so a tampered amount fails at the gateway.
- **Replays are inert.** A callback for an intent that already reached a terminal
  status returns the stored state without re-verifying. Verify code `101`
  ("already verified") counts as paid for the same reason.

Register the callback URL in the ZarinPal panel. It must be HTTPS — the adapter
rejects anything else before making a request.

## SMS / OTP

Iranian operators only deliver transactional codes through an approved pattern,
which is why the port has a dedicated `send_otp` next to free-text `send`.

```env
SMS_BACKEND=apps.users.sms.kavenegar.KavenegarSmsBackend
KAVENEGAR_API_KEY=<panel key>
KAVENEGAR_OTP_TEMPLATE=<approved pattern name>
KAVENEGAR_SENDER=<line number, only used by free-text send>
OTP_EXPOSE_DEBUG_CODE=false
```

The OTP code is injected as the pattern's `token` via `verify/lookup`. Delivery is
never retried: a timeout may still have arrived, and a second code would
invalidate the one the shopper is reading. A failed send clears the stored code
and the resend cooldown so the shopper can try again immediately, while the
hourly cap stays consumed — otherwise forcing failures would be a way to farm
attempts.

Phone numbers reach the logs masked to the last four digits, and codes never do.

## Rate limits already in place

`request_otp` enforces a 60s resend cooldown, 5 sends per phone per hour, and 5
verify attempts per code. They live in the cache, so production needs Redis as
`CACHES` (currently local-memory) before these limits hold across processes.
