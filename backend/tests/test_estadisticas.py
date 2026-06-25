"""Tests del módulo estadísticas (EST-01..05) — solo ADMIN."""


def test_estadisticas_requiere_admin(client, client_headers):
    assert client.get("/api/v1/estadisticas/resumen", headers=client_headers).status_code == 403


def test_resumen_ok(client, admin_headers, pedido_factory):
    pedido_factory(estado="CONFIRMADO", precio="1000.00")
    pedido_factory(estado="PENDIENTE", precio="500.00")
    resp = client.get("/api/v1/estadisticas/resumen", headers=admin_headers)
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert "ventas_hoy" in body
    assert "ticket_promedio" in body
    assert body["pedidos_activos"] >= 2  # PENDIENTE + CONFIRMADO


def test_pedidos_por_estado(client, admin_headers, pedido_factory):
    pedido_factory(estado="PENDIENTE")
    pedido_factory(estado="CONFIRMADO")
    pedido_factory(estado="CANCELADO")
    resp = client.get("/api/v1/estadisticas/pedidos-por-estado", headers=admin_headers)
    assert resp.status_code == 200
    data = {row["estado_codigo"]: row["cantidad"] for row in resp.json()}
    assert data.get("PENDIENTE", 0) >= 1
    assert data.get("CANCELADO", 0) >= 1


def test_productos_top_excluye_cancelados(client, admin_headers, producto_factory, pedido_factory):
    pid = producto_factory(precio="1000.00", stock=100)
    # 1 pedido válido y 1 cancelado con el mismo producto
    pedido_factory(producto_id=pid, estado="ENTREGADO", precio="1000.00", cantidad=2)
    pedido_factory(producto_id=pid, estado="CANCELADO", precio="1000.00", cantidad=9)
    resp = client.get("/api/v1/estadisticas/productos-top", headers=admin_headers)
    assert resp.status_code == 200
    top = resp.json()
    assert len(top) >= 1
    fila = next(r for r in top if r["producto_id"] == pid)
    # EST-01: el cancelado (9u) no suma; solo cuentan las 2u entregadas.
    assert fila["cantidad_vendida"] == 2


def test_ingresos_excluye_cancelados(client, admin_headers, pedido_factory):
    pedido_factory(estado="ENTREGADO", precio="1000.00")
    pedido_factory(estado="CANCELADO", precio="9999.00")
    resp = client.get("/api/v1/estadisticas/ingresos", headers=admin_headers)
    assert resp.status_code == 200
    total = sum(float(r["total"]) for r in resp.json())
    # El cancelado (9999) no debe sumar.
    assert total == 0.0 or total < 9999.0


def test_ventas_periodo(client, admin_headers, pedido_factory):
    pedido_factory(estado="CONFIRMADO", precio="1000.00")
    resp = client.get("/api/v1/estadisticas/ventas?agrupacion=day", headers=admin_headers)
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)
