"""Tests del módulo pagos. MercadoPago está deshabilitado en tests (sin token)."""


def test_crear_pago_sin_mp_configurado(client, client_headers, pedido_factory):
    ped_id = pedido_factory(usuario_email="client@test.com", estado="PENDIENTE")
    resp = client.post("/api/v1/pagos/crear", headers=client_headers, json={"pedido_id": ped_id})
    # Sin MP_ACCESS_TOKEN, el servicio degrada con 503 (no crashea).
    assert resp.status_code == 503


def test_get_pago_inexistente(client, client_headers, pedido_factory):
    ped_id = pedido_factory(usuario_email="client@test.com", estado="PENDIENTE")
    resp = client.get(f"/api/v1/pagos/{ped_id}", headers=client_headers)
    assert resp.status_code == 404


def test_get_pago_no_propietario(client, client_headers, pedido_factory):
    # Pedido de pedidos@test.com, consultado por client → 403.
    ped_id = pedido_factory(usuario_email="pedidos@test.com", estado="PENDIENTE")
    resp = client.get(f"/api/v1/pagos/{ped_id}", headers=client_headers)
    assert resp.status_code == 403


def test_crear_pago_requiere_auth(client, pedido_factory):
    ped_id = pedido_factory(estado="PENDIENTE")
    resp = client.post("/api/v1/pagos/crear", json={"pedido_id": ped_id})
    assert resp.status_code == 401
