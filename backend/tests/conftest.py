"""
Configuración de tests (Sección 13) — pytest + TestClient de FastAPI.

Estrategia de BD: SQLite in-memory (StaticPool) compartida por todas las sesiones.
Se parchea el engine de `app.core.database` y `app.core.uow` ANTES de importar la
app, de modo que el patrón Unit of Work use la BD de test.
"""
import os
from datetime import datetime, timezone
from decimal import Decimal

# La app no debe intentar hablar con MercadoPago en tests.
os.environ["MP_ACCESS_TOKEN"] = ""
os.environ["DATABASE_URL"] = "sqlite://"

import pytest
from sqlalchemy.pool import StaticPool
from sqlmodel import SQLModel, Session, create_engine
from fastapi.testclient import TestClient

# ── Engine de test compartido ───────────────────────────────────────────────
test_engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

# Parchear el engine ANTES de usar la app (el UoW lee el global del módulo).
import app.core.database as database
database.engine = test_engine
import app.core.uow as uow_module
uow_module.engine = test_engine

from app.core.database import create_all_tables  # noqa: E402
from app.core.security import hash_password  # noqa: E402
from app.core.rate_limit import auth_limiter  # noqa: E402
from app.main import app  # noqa: E402

from app.modules.roles.model import Rol, UsuarioRol  # noqa: E402
from app.modules.usuarios.model import Usuario  # noqa: E402
from app.modules.unidades.model import UnidadMedida  # noqa: E402
from app.modules.pedidos.model import (  # noqa: E402
    EstadoPedido,
    FormaPago,
    Pedido,
    DetallePedido,
    HistorialEstadoPedido,
)
from app.modules.productos.model import Producto  # noqa: E402


def _seed():
    with Session(test_engine) as s:
        for codigo, desc in [
            ("ADMIN", "Administrador"),
            ("STOCK", "Stock"),
            ("PEDIDOS", "Pedidos"),
            ("CLIENT", "Cliente"),
        ]:
            s.add(Rol(codigo=codigo, descripcion=desc))

        estados = [
            ("PENDIENTE", 1, False),
            ("CONFIRMADO", 2, False),
            ("EN_PREP", 3, False),
            ("ENTREGADO", 4, True),
            ("CANCELADO", 5, True),
        ]
        for codigo, orden, terminal in estados:
            s.add(EstadoPedido(codigo=codigo, descripcion=codigo, orden=orden, es_terminal=terminal))

        for codigo in ["MERCADOPAGO", "EFECTIVO", "TRANSFERENCIA"]:
            s.add(FormaPago(codigo=codigo, descripcion=codigo))

        s.add(UnidadMedida(nombre="unidad", simbolo="ud", tipo="contable"))

        usuarios = [
            ("admin@test.com", "Admin1234!", ["ADMIN", "CLIENT"]),
            ("client@test.com", "Client1234!", ["CLIENT"]),
            ("pedidos@test.com", "Pedidos1234!", ["PEDIDOS"]),
        ]
        for email, pwd, roles in usuarios:
            u = Usuario(
                nombre="Test",
                apellido="User",
                email=email,
                hashed_password=hash_password(pwd),
            )
            s.add(u)
            s.flush()
            for r in roles:
                s.add(UsuarioRol(usuario_id=u.id, rol_codigo=r))
        s.commit()


@pytest.fixture(autouse=True)
def setup_db():
    """BD limpia y sembrada por cada test; resetea el rate limiter."""
    SQLModel.metadata.drop_all(test_engine)
    SQLModel.metadata.create_all(test_engine)
    _seed()
    auth_limiter.reset()
    yield
    auth_limiter.reset()


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


def _login(client: TestClient, email: str, password: str) -> dict:
    resp = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert resp.status_code == 200, resp.text
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def admin_headers(client):
    return _login(client, "admin@test.com", "Admin1234!")


@pytest.fixture
def client_headers(client):
    return _login(client, "client@test.com", "Client1234!")


@pytest.fixture
def pedidos_headers(client):
    return _login(client, "pedidos@test.com", "Pedidos1234!")


def _user_id(email: str) -> int:
    with Session(test_engine) as s:
        from sqlmodel import select
        return s.exec(select(Usuario).where(Usuario.email == email)).one().id


@pytest.fixture
def producto_factory():
    def _make(nombre="Burger Test", precio="1000.00", stock=50, disponible=True):
        with Session(test_engine) as s:
            p = Producto(
                nombre=nombre,
                descripcion="test",
                precio_base=Decimal(str(precio)),
                stock_cantidad=stock,
                disponible=disponible,
            )
            s.add(p)
            s.commit()
            s.refresh(p)
            return p.id
    return _make


@pytest.fixture
def pedido_factory():
    def _make(usuario_email="client@test.com", producto_id=None, cantidad=1, estado="PENDIENTE", precio="1000.00"):
        usuario_id = _user_id(usuario_email)
        with Session(test_engine) as s:
            if producto_id is None:
                prod = Producto(nombre="Auto Prod", precio_base=Decimal(str(precio)), stock_cantidad=100, disponible=True)
                s.add(prod)
                s.flush()
                producto_id = prod.id
            precio_dec = Decimal(str(precio))
            subtotal = precio_dec * cantidad
            ped = Pedido(
                usuario_id=usuario_id,
                estado_codigo=estado,
                forma_pago_codigo="EFECTIVO",
                subtotal=subtotal,
                descuento=Decimal("0"),
                costo_envio=Decimal("50.00"),
                total=subtotal + Decimal("50.00"),
            )
            s.add(ped)
            s.flush()
            s.add(DetallePedido(
                pedido_id=ped.id,
                producto_id=producto_id,
                cantidad=cantidad,
                precio_unitario=precio_dec,
                producto_nombre="Auto Prod",
                nombre_snapshot="Auto Prod",
                precio_snapshot=precio_dec,
                subtotal_snap=subtotal,
            ))
            s.add(HistorialEstadoPedido(
                pedido_id=ped.id,
                estado_anterior_codigo=None,
                estado_nuevo_codigo=estado,
                usuario_id=usuario_id,
            ))
            s.commit()
            s.refresh(ped)
            return ped.id
    return _make


@pytest.fixture
def user_id():
    return _user_id
