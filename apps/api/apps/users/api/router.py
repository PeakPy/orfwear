from ninja import Router, Schema
from ninja.responses import Response

router = Router(tags=["users"])


class MeOut(Schema):
    id: str
    email: str
    username: str


@router.get("/me", response={200: MeOut, 401: dict}, auth=None)
def me(request):
    user = getattr(request, "user", None)
    if not user or not getattr(user, "is_authenticated", False):
        return Response(
            {"code": "unauthenticated", "message": "Authentication required."},
            status=401,
        )
    return 200, MeOut(id=str(user.id), email=user.email, username=user.username)
