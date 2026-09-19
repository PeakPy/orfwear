import json
import logging

from django.http import HttpResponseRedirect
from ninja import Router, Schema

from apps.common.exceptions import AppError
from apps.orders.schemas import PaymentOut
from apps.payments.models import PaymentIntent
from apps.payments.services import (
    complete_sandbox_payment,
    get_intent,
    handle_provider_callback,
    serialize_payment,
    storefront_result_url,
)

logger = logging.getLogger(__name__)

router = Router(tags=["payments"])


class SandboxCompleteIn(Schema):
    succeeded: bool = True


@router.get("/intents/{intent_id}", response=PaymentOut, auth=None)
def payment_intent_detail(request, intent_id: str):
    return serialize_payment(get_intent(intent_id))


@router.post("/intents/{intent_id}/sandbox-complete", response=PaymentOut, auth=None)
def sandbox_complete(request, intent_id: str, payload: SandboxCompleteIn):
    """Development-only settlement hook; rejected unless the active provider opts in."""
    return serialize_payment(complete_sandbox_payment(intent_id, succeeded=payload.succeeded))


@router.post("/callback", response=PaymentOut, auth=None)
def provider_callback(request):
    try:
        body = json.loads(request.body or b"{}")
    except ValueError:
        body = {}
    return serialize_payment(handle_provider_callback(payload=body, headers=dict(request.headers)))


@router.get("/callback", auth=None, include_in_schema=False)
def provider_callback_return(request):
    """Browser return leg used by redirect gateways (ZarinPal and friends).

    Settles the attempt server-side, then hands the shopper to the storefront.
    Failures are swallowed into a redirect on purpose: the shopper is coming back
    from a bank page and must land somewhere useful, never on an API error body.
    """
    try:
        intent = handle_provider_callback(
            payload=dict(request.GET.items()), headers=dict(request.headers)
        )
    except AppError as exc:
        logger.warning("payment.callback_unresolved code=%s", exc.code)
        return HttpResponseRedirect(storefront_result_url(None))

    status = "paid" if intent.status == PaymentIntent.Status.SUCCEEDED else "failed"
    return HttpResponseRedirect(f"{storefront_result_url(str(intent.order_id))}&status={status}")
