from apps.common.exceptions import AppError


def test_app_error_defaults():
    err = AppError("boom", details={"a": 1})
    assert err.code == "app_error"
    assert err.status_code == 400
    assert err.details["a"] == 1
