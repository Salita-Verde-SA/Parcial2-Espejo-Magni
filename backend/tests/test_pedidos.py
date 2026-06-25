"""Tests del módulo pedidos: creación, FSM (RN-01/05), snapshot y append-only."""


def _crear_pedido_api(client, headers, producto_id, cantidad=1, forma="EFECTIVO"):
    return client.post("/api/v1/pedidos/", headers=headers, json={
        "forma_pago_codigo": forma,
        "items": [{"producto_id": producto_id, "cantidad": cantidad}],
    })


def test_crear_pedido_ok(client, client_headers, producto_factory):
    pid = producto_factory(precio="1000.00", stock=50)
    resp = _crear_pedido_api(client, client_headers, pid, cantidad=2)
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["estado_codigo"] == "PENDIENTE"
    # total = subtotal(2000) - descuento(0) + costo_envio(50)
    assert float(body["subtotal"]) == 2000.0
    assert float(body["costo_envio"]) == 50.0
    assert float(body["total"]) == 2050.0
    # snapshot inmutable
    assert body["items"][0]["subtotal_snap"] is not None
    assert float(body["items"][0]["precio_snapshot"]) == 1000.0


def test_crear_pedido_stock_insuficiente(client, client_headers, producto_factory):
    pid = producto_factory(precio="500.00", stock=1)
    resp = _crear_pedido_api(client, client_headers, pid, cantidad=5)
    assert resp.status_code == 400


def test_avanzar_estado_valido(client, pedidos_headers, pedido_factory):
    ped_id = pedido_factory(estado="PENDIENTE")
    resp = client.patch(f"/api/v1/pedidos/{ped_id}/estado", headers=pedidos_headers,
                        json={"estado_codigo": "CONFIRMADO"})
    assert resp.status_code == 200, resp.text
    assert resp.json()["estado_codigo"] == "CONFIRMADO"


def test_avanzar_estado_invalido_422(client, pedidos_headers, pedido_factory):
    # PENDIENTE -> ENTREGADO no es una transición válida.
    ped_id = pedido_factory(estado="PENDIENTE")
    resp = client.patch(f"/api/v1/pedidos/{ped_id}/estado", headers=pedidos_headers,
                        json={"estado_codigo": "ENTREGADO"})
    assert resp.status_code == 422


def test_estado_terminal_rechaza_transicion(client, pedidos_headers, pedido_factory):
    # RN-01: ENTREGADO es terminal.
    ped_id = pedido_factory(estado="ENTREGADO")
    resp = client.patch(f"/api/v1/pedidos/{ped_id}/estado", headers=pedidos_headers,
                        json={"estado_codigo": "EN_PREP"})
    assert resp.status_code == 422


def test_cancelar_requiere_motivo(client, pedidos_headers, pedido_factory):
    # RN-05: cancelar sin motivo -> 422.
    ped_id = pedido_factory(estado="PENDIENTE")
    sin_motivo = client.patch(f"/api/v1/pedidos/{ped_id}/estado", headers=pedidos_headers,
                            json={"estado_codigo": "CANCELADO"})
    assert sin_motivo.status_code == 422

    con_motivo = client.patch(f"/api/v1/pedidos/{ped_id}/estado", headers=pedidos_headers,
                            json={"estado_codigo": "CANCELADO", "motivo": "Sin stock"})
    assert con_motivo.status_code == 200
    assert con_motivo.json()["estado_codigo"] == "CANCELADO"


def test_cliente_cancela_su_pedido(client, client_headers, pedido_factory):
    ped_id = pedido_factory(usuario_email="client@test.com", estado="PENDIENTE")
    resp = client.post(f"/api/v1/pedidos/{ped_id}/cancelar", headers=client_headers)
    assert resp.status_code == 200
    assert resp.json()["estado_codigo"] == "CANCELADO"


def test_historial_append_only(client, pedidos_headers, pedido_factory):
    ped_id = pedido_factory(estado="PENDIENTE")
    h0 = client.get(f"/api/v1/pedidos/{ped_id}/historial", headers=pedidos_headers)
    assert h0.status_code == 200
    n0 = len(h0.json())
    client.patch(f"/api/v1/pedidos/{ped_id}/estado", headers=pedidos_headers, json={"estado_codigo": "CONFIRMADO"})
    h1 = client.get(f"/api/v1/pedidos/{ped_id}/historial", headers=pedidos_headers)
    historial = h1.json()
    # Append-only: se agregó un registro, ninguno se borró.
    assert len(historial) == n0 + 1
    # El primer registro tiene estado_desde = None (RN-02).
    assert historial[0]["estado_anterior_codigo"] is None
    # Orden ascendente por fecha.
    assert historial[-1]["estado_nuevo_codigo"] == "CONFIRMADO"


def test_cliente_no_avanza_estado(client, client_headers, pedido_factory):
    ped_id = pedido_factory(estado="PENDIENTE")
    resp = client.patch(f"/api/v1/pedidos/{ped_id}/estado", headers=client_headers,
                        json={"estado_codigo": "CONFIRMADO"})
    assert resp.status_code == 403
