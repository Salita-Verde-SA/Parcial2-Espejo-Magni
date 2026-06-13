"""Tests del WebSocket: autenticación JWT en handshake y broadcast post-commit."""


def test_ws_rechaza_sin_token(client):
    # /ws/pedidos requiere JWT de ADMIN/PEDIDOS; sin token cierra (4001).
    import pytest
    from starlette.websockets import WebSocketDisconnect

    with pytest.raises(WebSocketDisconnect):
        with client.websocket_connect("/ws/pedidos") as ws:
            ws.receive_text()


def test_ws_admin_recibe_nuevo_pedido(client, admin_headers, client_headers, producto_factory):
    token = admin_headers["Authorization"].split(" ")[1]
    pid = producto_factory(precio="1000.00", stock=10)

    with client.websocket_connect(f"/ws/pedidos?token={token}") as ws:
        # Un cliente crea un pedido → debe emitirse al canal admin.
        resp = client.post("/api/v1/pedidos/", headers=client_headers, json={
            "forma_pago_codigo": "EFECTIVO",
            "items": [{"producto_id": pid, "cantidad": 1}],
        })
        assert resp.status_code == 201
        data = ws.receive_json()
        assert data["type"] == "NEW_PEDIDO"
        assert data["pedido_id"] == resp.json()["id"]


def test_ws_cliente_recibe_cambio_estado(client, admin_headers, pedidos_headers, client_headers, pedido_factory):
    client_token = client_headers["Authorization"].split(" ")[1]
    ped_id = pedido_factory(usuario_email="client@test.com", estado="PENDIENTE")

    with client.websocket_connect(f"/ws/pedidos/{ped_id}?token={client_token}") as ws:
        # Staff avanza el estado → el dueño del pedido recibe el evento.
        resp = client.patch(f"/api/v1/pedidos/{ped_id}/estado", headers=pedidos_headers,
                            json={"estado_codigo": "CONFIRMADO"})
        assert resp.status_code == 200
        data = ws.receive_json()
        assert data["event"] == "estado_cambiado"
        assert data["estado_nuevo"] == "CONFIRMADO"
