"""Tests del módulo uploads (Cloudinary). Sin credenciales → 503 controlado."""

_PNG = (
    b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
    b"\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01"
    b"\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
)


def test_upload_requiere_auth(client):
    resp = client.post("/api/v1/uploads/imagen", files={"file": ("x.png", _PNG, "image/png")})
    assert resp.status_code == 401


def test_upload_solo_admin(client, client_headers):
    resp = client.post(
        "/api/v1/uploads/imagen",
        headers=client_headers,
        files={"file": ("x.png", _PNG, "image/png")},
    )
    assert resp.status_code == 403


def test_upload_admin_sin_cloudinary_503(client, admin_headers):
    # En tests no hay credenciales Cloudinary → 503 (degradación elegante).
    resp = client.post(
        "/api/v1/uploads/imagen",
        headers=admin_headers,
        files={"file": ("x.png", _PNG, "image/png")},
    )
    assert resp.status_code == 503


def test_delete_requiere_admin(client, client_headers):
    resp = client.delete("/api/v1/uploads/imagen/foo", headers=client_headers)
    assert resp.status_code == 403
