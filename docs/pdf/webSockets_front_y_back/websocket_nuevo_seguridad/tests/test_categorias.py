# =============================================================================
# TESTS — Módulo de Categorías (CRUD)
# =============================================================================
#
# Cubre:
#   - Listar categorías
#   - Obtener categoría por ID
#   - Crear categoría (con validación de nombre único)
#   - Actualizar categoría (PATCH)
#   - Eliminar categoría
#   - Autenticación requerida

import pytest
from fastapi.testclient import TestClient

from tests.conftest import get_auth_headers


# ─── LISTAR ──────────────────────────────────────────────────────────────────

class TestCategoriaList:
    """Tests de listado de categorías"""

    def test_listar_categorias(self, client: TestClient, admin_user, categoria_base):
        """Lista todas las categorías"""
        headers = get_auth_headers(admin_user)
        response = client.get("/api/v1/categorias/", cookies=headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert data[0]["nombre"] == "Bebidas"

    def test_listar_sin_auth(self, client: TestClient):
        """Sin autenticación retorna 401"""
        response = client.get("/api/v1/categorias/")
        assert response.status_code == 401


# ─── OBTENER POR ID ─────────────────────────────────────────────────────────

class TestCategoriaGet:
    """Tests de obtención por ID"""

    def test_obtener_categoria(self, client: TestClient, admin_user, categoria_base):
        """Obtiene una categoría por ID"""
        headers = get_auth_headers(admin_user)
        response = client.get(f"/api/v1/categorias/{categoria_base.id}", cookies=headers)
        assert response.status_code == 200
        assert response.json()["nombre"] == "Bebidas"

    def test_obtener_categoria_inexistente(self, client: TestClient, admin_user):
        """Categoría que no existe retorna 404"""
        headers = get_auth_headers(admin_user)
        response = client.get("/api/v1/categorias/99999", cookies=headers)
        assert response.status_code == 404


# ─── CREAR ───────────────────────────────────────────────────────────────────

class TestCategoriaCreate:
    """Tests de creación de categorías"""

    def test_crear_categoria(self, client: TestClient, admin_user):
        """Crea una nueva categoría"""
        headers = get_auth_headers(admin_user)
        response = client.post(
            "/api/v1/categorias/",
            json={"nombre": "Postres", "descripcion": "Dulces y helados"},
            cookies=headers,
        )
        assert response.status_code == 201
        data = response.json()
        assert data["nombre"] == "Postres"
        assert data["descripcion"] == "Dulces y helados"

    def test_crear_categoria_nombre_duplicado(self, client: TestClient, admin_user, categoria_base):
        """Crear categoría con nombre duplicado retorna 409"""
        headers = get_auth_headers(admin_user)
        response = client.post(
            "/api/v1/categorias/",
            json={"nombre": "Bebidas", "descripcion": "Otra vez bebidas"},
            cookies=headers,
        )
        assert response.status_code == 409
        assert "existe" in response.json()["detail"].lower()

    def test_crear_categoria_sin_descripcion(self, client: TestClient, admin_user):
        """Crear categoría sin descripción (usa default vacío)"""
        headers = get_auth_headers(admin_user)
        response = client.post(
            "/api/v1/categorias/",
            json={"nombre": "Snacks"},
            cookies=headers,
        )
        assert response.status_code == 201
        assert response.json()["descripcion"] == ""

    def test_crear_categoria_nombre_vacio(self, client: TestClient, admin_user):
        """Nombre vacío retorna 422"""
        headers = get_auth_headers(admin_user)
        response = client.post(
            "/api/v1/categorias/",
            json={"nombre": ""},
            cookies=headers,
        )
        assert response.status_code == 422


# ─── ACTUALIZAR ──────────────────────────────────────────────────────────────

class TestCategoriaUpdate:
    """Tests de actualización parcial (PATCH)"""

    def test_actualizar_nombre(self, client: TestClient, admin_user, categoria_base):
        """Actualiza solo el nombre"""
        headers = get_auth_headers(admin_user)
        response = client.patch(
            f"/api/v1/categorias/{categoria_base.id}",
            json={"nombre": "Bebidas Premium"},
            cookies=headers,
        )
        assert response.status_code == 200
        assert response.json()["nombre"] == "Bebidas Premium"
        assert response.json()["descripcion"] == "Bebidas frías y calientes"  # No cambió

    def test_actualizar_descripcion(self, client: TestClient, admin_user, categoria_base):
        """Actualiza solo la descripción"""
        headers = get_auth_headers(admin_user)
        response = client.patch(
            f"/api/v1/categorias/{categoria_base.id}",
            json={"descripcion": "Solo bebidas frías"},
            cookies=headers,
        )
        assert response.status_code == 200
        assert response.json()["descripcion"] == "Solo bebidas frías"
        assert response.json()["nombre"] == "Bebidas"  # No cambió

    def test_actualizar_nombre_duplicado(self, client: TestClient, admin_user, categoria_base):
        """Actualizar a nombre duplicado retorna 409"""
        headers = get_auth_headers(admin_user)

        # Crear segunda categoría
        resp2 = client.post(
            "/api/v1/categorias/",
            json={"nombre": "Comida"},
            cookies=headers,
        )
        assert resp2.status_code == 201
        cat2_id = resp2.json()["id"]

        # Intentar cambiar "Comida" a "Bebidas" (ya existe)
        response = client.patch(
            f"/api/v1/categorias/{cat2_id}",
            json={"nombre": "Bebidas"},
            cookies=headers,
        )
        assert response.status_code == 409

    def test_actualizar_categoria_inexistente(self, client: TestClient, admin_user):
        """Actualizar categoría que no existe retorna 404"""
        headers = get_auth_headers(admin_user)
        response = client.patch(
            "/api/v1/categorias/99999",
            json={"nombre": "No existe"},
            cookies=headers,
        )
        assert response.status_code == 404


# ─── ELIMINAR ────────────────────────────────────────────────────────────────

class TestCategoriaDelete:
    """Tests de eliminación de categorías"""

    def test_eliminar_categoria(self, client: TestClient, admin_user, categoria_base):
        """Elimina una categoría existente"""
        headers = get_auth_headers(admin_user)
        response = client.delete(
            f"/api/v1/categorias/{categoria_base.id}",
            cookies=headers,
        )
        assert response.status_code == 204

        # Verificar que ya no existe
        response = client.get(
            f"/api/v1/categorias/{categoria_base.id}",
            cookies=headers,
        )
        assert response.status_code == 404

    def test_eliminar_categoria_inexistente(self, client: TestClient, admin_user):
        """Eliminar categoría que no existe retorna 404"""
        headers = get_auth_headers(admin_user)
        response = client.delete("/api/v1/categorias/99999", cookies=headers)
        assert response.status_code == 404
