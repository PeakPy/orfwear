# API conventions

## Base

- Prefix: `/api/v1`
- Format: JSON
- Errors: stable `code` + safe `message` + optional `details`
- IDs: UUID where public-facing
- Money: integer minor units + ISO currency (`IRR` initially)
- Timestamps: ISO-8601 UTC

## Error shape

```json
{
  "code": "cart_item_unavailable",
  "message": "This variant is no longer available.",
  "details": {
    "variant_id": "..."
  },
  "correlation_id": "..."
}
```

## Auth

- Session cookie for web/PWA
- CSRF protected mutating routes when using cookie auth
- Service layer checks permissions; routers stay thin

## Idempotency

Required for:

- payment initiation
- order creation from checkout
- provider webhooks

Send `Idempotency-Key` header; persist on the relevant aggregate.

## Pagination

Cursor pagination for catalog/list endpoints.
Avoid large offset pages for product discovery.

## Versioning

Additive changes in `v1`.
Breaking response/request contracts require `v2`.
