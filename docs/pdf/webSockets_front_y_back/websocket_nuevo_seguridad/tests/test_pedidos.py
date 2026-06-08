# =============================================================================
# TESTS — Módulo de Pedidos (CRUD + FSM + RBAC)
# =============================================================================
#
# Cubre:
#   - CRUD de pedidos (listar, obtener, crear)
#   - Transiciones FSM (máquina de estados)
#   - RBAC por roles (admin, pedidos, cocina, user)
#   - Validaciones (pedido no existe, transición inválida)

import pytest
from fastapi.testclient import TestClient

from tests.conftest import get_auth_headers


# ─── CRUD DE PEDIDOS ────────────────────────────────────────────────────────

class TestPedidoCRUD:
    """Tests de operaciones CRUD básicas de pedidos"""

    def test_listar_pedidos(self, client: TestClient, admin_user, pedido_pendiente):
        """Admin puede listar todos los pedidos"""
        headers = get_auth_headers(admin_user)
        response = client.get("/api/v1/pedidos", cookies=headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert data[0]["descripcion"] == "Hamburguesa doble"

    def test_listar_pedidos_user(self, client: TestClient, regular_user, pedido_pendiente):
        """User autenticado puede listar pedidos"""
        headers = get_auth_headers(regular_user)
        response = client.get("/api/v1/pedidos", cookies=headers)
        assert response.status_code == 200

    def test_obtener_pedido_por_id(self, client: TestClient, admin_user, pedido_pendiente):
        """Obtener un pedido específico por ID"""
        headers = get_auth_headers(admin_user)
        response = client.get(f"/api/v1/pedidos/{pedido_pendiente.id}", cookies=headers)
        assert response.status_code == 200
        assert response.json()["id"] == pedido_pendiente.id

    def test_obtener_pedido_inexistente(self, client: TestClient, admin_user):
        """Pedido que no existe retorna 404"""
        headers = get_auth_headers(admin_user)
        response = client.get("/api/v1/pedidos/99999", cookies=headers)
        assert response.status_code == 404

    def test_crear_pedido(self, client: TestClient, regular_user):
        """User puede crear un nuevo pedido"""
        headers = get_auth_headers(regular_user)
        response = client.post(
            "/api/v1/pedidos",
            json={"descripcion": "Tacos al pastor", "total": 1200.0},
            cookies=headers,
        )
        assert response.status_code == 201
        data = response.json()
        assert data["descripcion"] == "Tacos al pastor"
        assert data["estado"] == "pendiente"  # Estado inicial
        assert data["usuario_id"] == regular_user.id

    def test_crear_pedido_sin_auth(self, client: TestClient):
        """Crear pedido sin autenticación retorna 401"""
        response = client.post(
            "/api/v1/pedidos",
            json={"descripcion": "Sin auth", "total": 100.0},
        )
        assert response.status_code == 401


# ─── FSM — TRANSICIONES DE ESTADO ───────────────────────────────────────────

class TestPedidoFSM:
    """Tests de la máquina de estados finita (FSM)"""

    def test_pendiente_a_confirmado(self, client: TestClient, admin_user, pedido_pendiente):
        """Admin puede confirmar un pedido pendiente"""
        headers = get_auth_headers(admin_user)
        response = client.patch(
            f"/api/v1/pedidos/{pedido_pendiente.id}/estado",
            json={"nuevo_estado": "confirmado"},
            cookies=headers,
        )
        assert response.status_code == 200
        assert response.json()["estado"] == "confirmado"

    def test_pendiente_a_cancelado(self, client: TestClient, admin_user, pedido_pendiente):
        """Admin puede cancelar un pedido pendiente"""
        headers = get_auth_headers(admin_user)
        response = client.patch(
            f"/api/v1/pedidos/{pedido_pendiente.id}/estado",
            json={"nuevo_estado": "cancelado"},
            cookies=headers,
        )
        assert response.status_code == 200
        assert response.json()["estado"] == "cancelado"

    def test_confirmado_a_preparando(self, client: TestClient, admin_user, pedido_confirmado):
        """Admin puede pasar pedido a preparando"""
        headers = get_auth_headers(admin_user)
        response = client.patch(
            f"/api/v1/pedidos/{pedido_confirmado.id}/estado",
            json={"nuevo_estado": "preparando"},
            cookies=headers,
        )
        assert response.status_code == 200
        assert response.json()["estado"] == "preparando"

    def test_preparando_a_enviado(self, client: TestClient, admin_user, pedido_preparando):
        """Admin puede enviar un pedido en preparación"""
        headers = get_auth_headers(admin_user)
        response = client.patch(
            f"/api/v1/pedidos/{pedido_preparando.id}/estado",
            json={"nuevo_estado": "enviado"},
            cookies=headers,
        )
        assert response.status_code == 200
        assert response.json()["estado"] == "enviado"

    def test_transicion_invalida(self, client: TestClient, admin_user, pedido_pendiente):
        """No se puede ir de pendiente a preparando (saltar confirmado)"""
        headers = get_auth_headers(admin_user)
        response = client.patch(
            f"/api/v1/pedidos/{pedido_pendiente.id}/estado",
            json={"nuevo_estado": "preparando"},
            cookies=headers,
        )
        assert response.status_code == 403
        assert "no permitida" in response.json()["detail"]

    def test_estado_terminal_no_transiciona(self, client: TestClient, admin_user, pedido_pendiente):
        """Un pedido cancelado no puede cambiar de estado"""
        headers = get_auth_headers(admin_user)
        # Cancelar
        client.patch(
            f"/api/v1/pedidos/{pedido_pendiente.id}/estado",
            json={"nuevo_estado": "cancelado"},
            cookies=headers,
        )
        # Intentar avanzar desde cancelado
        response = client.patch(
            f"/api/v1/pedidos/{pedido_pendiente.id}/estado",
            json={"nuevo_estado": "confirmado"},
            cookies=headers,
        )
        assert response.status_code == 403


# ─── RBAC — PERMISOS POR ROL ────────────────────────────────────────────────

class TestPedidoRBAC:
    """Tests de control de acceso por roles en transiciones FSM"""

    # --- ROL COCINA ---
    def test_cocina_confirmado_a_preparando(self, client: TestClient, cocina_user, pedido_confirmado):
        """Cocina puede pasar de confirmado a preparando"""
        headers = get_auth_headers(cocina_user)
        response = client.patch(
            f"/api/v1/pedidos/{pedido_confirmado.id}/estado",
            json={"nuevo_estado": "preparando"},
            cookies=headers,
        )
        assert response.status_code == 200

    def test_cocina_preparando_a_enviado(self, client: TestClient, cocina_user, pedido_preparando):
        """Cocina puede pasar de preparando a enviado"""
        headers = get_auth_headers(cocina_user)
        response = client.patch(
            f"/api/v1/pedidos/{pedido_preparando.id}/estado",
            json={"nuevo_estado": "enviado"},
            cookies=headers,
        )
        assert response.status_code == 200

    def test_cocina_no_puede_confirmar(self, client: TestClient, cocina_user, pedido_pendiente):
        """Cocina NO puede confirmar un pedido (solo pedidos/admin)"""
        headers = get_auth_headers(cocina_user)
        response = client.patch(
            f"/api/v1/pedidos/{pedido_pendiente.id}/estado",
            json={"nuevo_estado": "confirmado"},
            cookies=headers,
        )
        assert response.status_code == 403

    def test_cocina_no_puede_cancelar(self, client: TestClient, cocina_user, pedido_confirmado):
        """Cocina NO puede cancelar un pedido"""
        headers = get_auth_headers(cocina_user)
        response = client.patch(
            f"/api/v1/pedidos/{pedido_confirmado.id}/estado",
            json={"nuevo_estado": "cancelado"},
            cookies=headers,
        )
        assert response.status_code == 403

    # --- ROL PEDIDOS ---
    def test_pedidos_puede_confirmar(self, client: TestClient, pedidos_user, pedido_pendiente):
        """Pedidos puede confirmar un pedido pendiente"""
        headers = get_auth_headers(pedidos_user)
        response = client.patch(
            f"/api/v1/pedidos/{pedido_pendiente.id}/estado",
            json={"nuevo_estado": "confirmado"},
            cookies=headers,
        )
        assert response.status_code == 200

    def test_pedidos_puede_avanzar_flujo_completo(self, client: TestClient, pedidos_user):
        """Pedidos puede hacer el flujo completo pendiente → confirmado → preparando → enviado → entregado"""
        headers = get_auth_headers(pedidos_user)

        # Crear pedido
        resp = client.post(
            "/api/v1/pedidos",
            json={"descripcion": "Flujo completo", "total": 5000.0},
            cookies=headers,
        )
        pedido_id = resp.json()["id"]

        # pendiente → confirmado
        resp = client.patch(
            f"/api/v1/pedidos/{pedido_id}/estado",
            json={"nuevo_estado": "confirmado"},
            cookies=headers,
        )
        assert resp.status_code == 200

        # confirmado → preparando
        resp = client.patch(
            f"/api/v1/pedidos/{pedido_id}/estado",
            json={"nuevo_estado": "preparando"},
            cookies=headers,
        )
        assert resp.status_code == 200

        # preparando → enviado
        resp = client.patch(
            f"/api/v1/pedidos/{pedido_id}/estado",
            json={"nuevo_estado": "enviado"},
            cookies=headers,
        )
        assert resp.status_code == 200

        # enviado → entregado
        resp = client.patch(
            f"/api/v1/pedidos/{pedido_id}/estado",
            json={"nuevo_estado": "entregado"},
            cookies=headers,
        )
        assert resp.status_code == 200
        assert resp.json()["estado"] == "entregado"

    # --- ROL USER ---
    def test_user_no_puede_avanzar_estado(self, client: TestClient, regular_user, pedido_pendiente):
        """User normal NO puede avanzar estados de pedidos"""
        headers = get_auth_headers(regular_user)
        response = client.patch(
            f"/api/v1/pedidos/{pedido_pendiente.id}/estado",
            json={"nuevo_estado": "confirmado"},
            cookies=headers,
        )
        assert response.status_code == 403

    # --- ROL ADMIN ---
    def test_admin_puede_hacer_cualquier_transicion(self, client: TestClient, admin_user):
        """Admin puede hacer cualquier transición válida"""
        headers = get_auth_headers(admin_user)

        # Crear pedido
        resp = client.post(
            "/api/v1/pedidos",
            json={"descripcion": "Admin total", "total": 9999.0},
            cookies=headers,
        )
        pedido_id = resp.json()["id"]

        # pendiente → confirmado
        resp = client.patch(
            f"/api/v1/pedidos/{pedido_id}/estado",
            json={"nuevo_estado": "confirmado"},
            cookies=headers,
        )
        assert resp.status_code == 200

        # confirmado → cancelado (admin puede cancelar en cualquier momento)
        resp = client.patch(
            f"/api/v1/pedidos/{pedido_id}/estado",
            json={"nuevo_estado": "cancelado"},
            cookies=headers,
        )
        assert resp.status_code == 200
        assert resp.json()["estado"] == "cancelado"


# ─── KDS — PEDIDOS DE COCINA ────────────────────────────────────────────────

class TestPedidoKDS:
    """Tests del endpoint de cocina (KDS)"""

    def test_listar_pedidos_cocina(self, client: TestClient, cocina_user, pedido_confirmado, pedido_preparando):
        """Cocina puede ver pedidos activos (confirmados + preparando)"""
        headers = get_auth_headers(cocina_user)
        response = client.get("/api/v1/cocina/pedidos", cookies=headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 2

    def test_listar_pedidos_cocina_sin_pendientes(self, client: TestClient, cocina_user, pedido_pendiente):
        """Cocina NO ve pedidos pendientes (solo confirmados y preparando)"""
        headers = get_auth_headers(cocina_user)
        response = client.get("/api/v1/cocina/pedidos", cookies=headers)
        assert response.status_code == 200
        data = response.json()
        # El pedido pendiente NO debería estar en la lista de cocina
        ids = [p["id"] for p in data]
        assert pedido_pendiente.id not in ids
