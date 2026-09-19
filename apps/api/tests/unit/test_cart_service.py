from __future__ import annotations

import pytest

from apps.cart.models import Cart
from apps.cart.services import (
    MAX_LINE_QUANTITY,
    add_line,
    get_current_cart,
    merge_guest_cart_into_user,
    remove_line,
    update_line,
)
from apps.common.exceptions import NotFoundError, ValidationAppError

pytestmark = pytest.mark.django_db


def test_add_line_sets_totals(guest_request, variant):
    request = guest_request("guest-1")
    cart = add_line(request, variant_id=str(variant.id), quantity=2)

    assert cart.item_count == 2
    assert cart.subtotal_amount == 2 * variant.price_amount
    assert cart.lines[0].is_available is True
    assert cart.lines[0].image_url == "http://img.test/a.jpg"


def test_add_line_accumulates_same_variant(guest_request, variant):
    request = guest_request("guest-2")
    add_line(request, variant_id=str(variant.id), quantity=1)
    cart = add_line(request, variant_id=str(variant.id), quantity=2)

    assert len(cart.lines) == 1
    assert cart.lines[0].quantity == 3


def test_add_line_rejects_quantity_above_stock(guest_request, variant_low):
    request = guest_request("guest-3")
    with pytest.raises(ValidationAppError):
        add_line(request, variant_id=str(variant_low.id), quantity=2)


def test_add_line_rejects_quantity_above_cap(guest_request, product):
    from tests.conftest import _make_variant

    plenty = _make_variant(product, sku="TEE-XL", size="XL", color="سفید", price=1000, on_hand=100)
    request = guest_request("guest-4")
    with pytest.raises(ValidationAppError):
        add_line(request, variant_id=str(plenty.id), quantity=MAX_LINE_QUANTITY + 1)


def test_add_line_rejects_unknown_variant(guest_request):
    request = guest_request("guest-5")
    with pytest.raises(NotFoundError):
        add_line(request, variant_id="not-a-uuid", quantity=1)


def test_update_line_to_zero_removes_it(guest_request, variant):
    request = guest_request("guest-6")
    cart = add_line(request, variant_id=str(variant.id), quantity=2)
    cart = update_line(request, line_id=cart.lines[0].id, quantity=0)

    assert cart.lines == []
    assert cart.item_count == 0


def test_update_line_respects_stock(guest_request, variant):
    request = guest_request("guest-7")
    cart = add_line(request, variant_id=str(variant.id), quantity=1)
    with pytest.raises(ValidationAppError):
        update_line(request, line_id=cart.lines[0].id, quantity=99)


def test_remove_line(guest_request, variant):
    request = guest_request("guest-8")
    cart = add_line(request, variant_id=str(variant.id), quantity=1)
    cart = remove_line(request, line_id=cart.lines[0].id)
    assert cart.lines == []


def test_guest_cart_merges_into_user_cart_on_login(guest_request, user_request, variant, customer):
    cart_key = "merge-key"
    add_line(guest_request(cart_key), variant_id=str(variant.id), quantity=2)

    logged_in = user_request(cart_key)
    merge_guest_cart_into_user(logged_in, user=customer)

    cart = get_current_cart(user_request())
    assert cart.item_count == 2
    assert Cart.objects.filter(session_key=cart_key, is_active=True).count() == 0


def test_merge_clamps_to_available_stock(guest_request, user_request, variant, customer):
    cart_key = "merge-clamp"
    # 3 in the signed-in cart plus 3 as a guest exceeds the 5 on hand.
    add_line(user_request(), variant_id=str(variant.id), quantity=3)
    add_line(guest_request(cart_key), variant_id=str(variant.id), quantity=3)

    merge_guest_cart_into_user(user_request(cart_key), user=customer)

    cart = get_current_cart(user_request())
    assert cart.item_count == 5
