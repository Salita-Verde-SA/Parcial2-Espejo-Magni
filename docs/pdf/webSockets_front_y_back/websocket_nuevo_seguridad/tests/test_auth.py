# =============================================================================
# TESTS — Módulo de Autenticación (Auth)
# =============================================================================
#
# Cubre:
#   - Registro de usuarios
#   - Login (token endpoint)
#   - Logout
#   - Endpoint /me
#   - Control de acceso por roles (RBAC)
#   - Validaciones (credenciales, duplicados, desactivados)

import pytest
from fastapi.testclient import TestClient

from tests.conftest import get_auth_headers


# ─── REGISTRO ────────────────────────────────────────────────────────────────

class TestRegister:
    """Tests del endpoint POST /api/v1/auth/register"""

    def test_register_exitoso(self, client: TestClient):
        """Registro con datos válidos retorna 201"""
        response = client.post("/api/v1/auth/register", json={
            "username": "nuevo_usuario",
            "full_name": "Nuevo Usuario",
            "email": "nuevo@test.com",
            "password": "Password123!",
        })
        assert response.status_code == 201
        data = response.json()
        assert data["username"] == "nuevo_usuario"
        assert data["role"] == "user"  # Rol por defecto
        assert "hashed_password" not in data  # Nunca exponer hash

    def test_register_username_duplicado(self, client: TestClient, admin_user):
        """Registro con username ya existente retorna 409"""
        response = client.post("/api/v1/auth/register", json={
            "username": "test_admin",
            "full_name": "Otro Admin",
            "email": "otro@test.com",
            "password": "Password123!",
        })
        assert response.status_code == 409
        assert "ya está en uso" in response.json()["detail"]

    def test_register_email_duplicado(self, client: TestClient, admin_user):
        """Registro con email ya existente retorna 409"""
        response = client.post("/api/v1/auth/register", json={
            "username": "otro_usuario",
            "full_name": "Otro",
            "email": "admin@test.com",
            "password": "Password123!",
        })
        assert response.status_code == 409
        assert "ya está registrado" in response.json()["detail"]

    def test_register_password_corta(self, client: TestClient):
        """Registro con password menor a 8 caracteres retorna 422"""
        response = client.post("/api/v1/auth/register", json={
            "username": "corto",
            "full_name": "Corto",
            "email": "corto@test.com",
            "password": "1234567",
        })
        assert response.status_code == 422

    def test_register_email_invalido(self, client: TestClient):
        """Registro con email inválido retorna 422"""
        response = client.post("/api/v1/auth/register", json={
            "username": "invalido",
            "full_name": "Invalido",
            "email": "no_es_email",
            "password": "Password123!",
        })
        assert response.status_code == 422


# ─── LOGIN ───────────────────────────────────────────────────────────────────

class TestLogin:
    """Tests del endpoint POST /api/v1/auth/token"""

    def test_login_exitoso(self, client: TestClient, admin_user):
        """Login con credenciales válidas retorna 200 y setea cookie"""
        response = client.post(
            "/api/v1/auth/token",
            data={"username": "test_admin", "password": "Admin1234!"},
        )
        assert response.status_code == 200
        assert "access_token" in response.cookies
        assert response.json()["mensaje"] == "Login exitoso. Sesión iniciada."

    def test_login_password_incorrecta(self, client: TestClient, admin_user):
        """Login con password incorrecta retorna 401"""
        response = client.post(
            "/api/v1/auth/token",
            data={"username": "test_admin", "password": "WrongPassword"},
        )
        assert response.status_code == 401
        assert "Credenciales incorrectas" in response.json()["detail"]

    def test_login_usuario_inexistente(self, client: TestClient):
        """Login con usuario que no existe retorna 401"""
        response = client.post(
            "/api/v1/auth/token",
            data={"username": "no_existe", "password": "Password123!"},
        )
        assert response.status_code == 401

    def test_login_usuario_desactivado(self, client: TestClient, session, admin_user):
        """Login con usuario desactivado retorna 400"""
        admin_user.disabled = True
        session.add(admin_user)
        session.commit()

        response = client.post(
            "/api/v1/auth/token",
            data={"username": "test_admin", "password": "Admin1234!"},
        )
        assert response.status_code == 400
        assert "desactivada" in response.json()["detail"]


# ─── LOGOUT ──────────────────────────────────────────────────────────────────

class TestLogout:
    """Tests del endpoint POST /api/v1/auth/logout"""

    def test_logout_exitoso(self, client: TestClient, admin_user):
        """Logout elimina la cookie de sesión"""
        # Login primero
        cookies = client.post(
            "/api/v1/auth/token",
            data={"username": "test_admin", "password": "Admin1234!"},
        ).cookies

        # Logout
        response = client.post("/api/v1/auth/logout")
        assert response.status_code == 200
        assert "Sesión cerrada" in response.json()["mensaje"]


# ─── ENDPOINT /me ───────────────────────────────────────────────────────────

class TestMe:
    """Tests del endpoint GET /api/v1/auth/me"""

    def test_me_con_token_valido(self, client: TestClient, admin_user):
        """retorna los datos del usuario autenticado"""
        headers = get_auth_headers(admin_user)
        response = client.get("/api/v1/auth/me", cookies=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == "test_admin"
        assert data["role"] == "admin"

    def test_me_sin_auth(self, client: TestClient):
        """Sin token retorna 401"""
        response = client.get("/api/v1/auth/me")
        assert response.status_code == 401


# ─── RBAC ────────────────────────────────────────────────────────────────────

class TestRBAC:
    """Tests de control de acceso por roles"""

    def test_admin_accede_ruta_admin(self, client: TestClient, admin_user):
        """Admin puede acceder a rutas de admin"""
        headers = get_auth_headers(admin_user)
        response = client.get("/api/v1/auth/admin/usuarios", cookies=headers)
        assert response.status_code == 200

    def test_user_no_accede_ruta_admin(self, client: TestClient, regular_user):
        """User normal NO puede acceder a rutas de admin"""
        headers = get_auth_headers(regular_user)
        response = client.get("/api/v1/auth/admin/usuarios", cookies=headers)
        assert response.status_code == 403

    def test_cocina_no_accede_ruta_admin(self, client: TestClient, cocina_user):
        """Cocina NO puede acceder a rutas de admin"""
        headers = get_auth_headers(cocina_user)
        response = client.get("/api/v1/auth/admin/usuarios", cookies=headers)
        assert response.status_code == 403

    def test_admin_puede_activar_usuario(self, client: TestClient, admin_user, regular_user):
        """Admin puede activar un usuario"""
        headers = get_auth_headers(admin_user)
        response = client.post(
            f"/api/v1/auth/admin/usuarios/{regular_user.id}/activar",
            cookies=headers,
        )
        assert response.status_code == 200
        assert response.json()["disabled"] is False

    def test_admin_puede_desactivar_usuario(self, client: TestClient, admin_user, regular_user):
        """Admin puede desactivar un usuario"""
        headers = get_auth_headers(admin_user)
        response = client.post(
            f"/api/v1/auth/admin/usuarios/{regular_user.id}/desactivar",
            cookies=headers,
        )
        assert response.status_code == 200
        assert response.json()["disabled"] is True

    def test_user_no_puede_desactivar(self, client: TestClient, regular_user, admin_user):
        """User normal NO puede desactivar usuarios"""
        headers = get_auth_headers(regular_user)
        response = client.post(
            f"/api/v1/auth/admin/usuarios/{admin_user.id}/desactivar",
            cookies=headers,
        )
        assert response.status_code == 403
