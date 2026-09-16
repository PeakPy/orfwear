from ninja import Router, Schema

router = Router(tags=["payments"])


class PaymentIntentOut(Schema):
    id: str
    status: str
    amount: int
    currency: str
    provider: str


@router.post("/intents", response=PaymentIntentOut, auth=None)
def create_payment_intent(request):
    # Placeholder; real flow must be idempotent and provider-backed.
    return PaymentIntentOut(
        id="00000000-0000-0000-0000-000000000000",
        status="requires_action",
        amount=0,
        currency="IRR",
        provider="stub",
    )
