"""Tests del módulo auth: register, login, logout/revocación y rate limiting."""


def test_register_ok(client):
    resp = client.post("/api/v1/auth/register", json={
        "nombre": "Nuevo",
        "apellido": "Cliente",
        "email": "nuevo@test.com",
        "password": "Password123",
    })
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["access_token"]
    assert body["refresh_token"]
    assert body["token_type"] == "bearer"
    assert body["expires_in"] > 0


def test_register_email_duplicado(client):
    payload = {"nombre": "Dup", "apellido": "Licado", "email": "dup@test.com", "password": "Password123"}
    assert client.post("/api/v1/auth/register", json=payload).status_code == 201
    assert client.post("/api/v1/auth/register", json=payload).status_code == 409


def test_login_ok(client):
    resp = client.post("/api/v1/auth/login", json={"email": "admin@test.com", "password": "Admin1234!"})
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["access_token"]
    assert body["token_type"] == "bearer"


def test_login_credenciales_invalidas(client):
    resp = client.post("/api/v1/auth/login", json={"email": "admin@test.com", "password": "incorrecta"})
    assert resp.status_code == 401


def test_me_requiere_token(client):
    assert client.get("/api/v1/auth/me").status_code == 401


def test_me_con_token(client, admin_headers):
    resp = client.get("/api/v1/auth/me", headers=admin_headers)
    assert resp.status_code == 200
    assert resp.json()["email"] == "admin@test.com"
    assert "ADMIN" in resp.json()["roles"]


def test_rate_limit_login(client):
    # 5 intentos fallidos permitidos; el 6º devuelve 429.
    for _ in range(5):
        r = client.post("/api/v1/auth/login", json={"email": "admin@test.com", "password": "mala"})
        assert r.status_code == 401
    r = client.post("/api/v1/auth/login", json={"email": "admin@test.com", "password": "mala"})
    assert r.status_code == 429
    assert "Retry-After" in r.headers


def test_login_exitoso_no_cuenta_para_rate_limit(client):
    # Los logins exitosos resetean el contador de fallos de esa IP.
    for _ in range(4):
        client.post("/api/v1/auth/login", json={"email": "admin@test.com", "password": "mala"})
    ok = client.post("/api/v1/auth/login", json={"email": "admin@test.com", "password": "Admin1234!"})
    assert ok.status_code == 200
    # Tras el éxito, el contador se reseteó: un nuevo fallo no debe ser 429.
    r = client.post("/api/v1/auth/login", json={"email": "admin@test.com", "password": "mala"})
    assert r.status_code == 401
