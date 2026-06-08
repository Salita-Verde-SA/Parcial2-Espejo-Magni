# =============================================================================
# CONFTEST — Setup centralizado de tests
# =============================================================================

import pytest
from fastapi.testclient import TestClient
from sqlmodel import SQLModel, Session, create_engine
from sqlmodel.pool import StaticPool

from app.main import app
from app.core.database import get_session
from app.core.security import hash_password, create_access_token
from app.modules.usuarios.models import Usuario
from app.modules.pedidos.models import Pedido
from app.modules.categorias.models import Categoria


test_engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)


@pytest.fixture(name="session")
def session_fixture():
    SQLModel.metadata.create_all(test_engine)
    with Session(test_engine) as session:
        yield session
    SQLModel.metadata.drop_all(test_engine)


@pytest.fixture(name="client")
def client_fixture(session: Session):
    def override_get_session():
        yield session
    app.dependency_overrides[get_session] = override_get_session
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()


@pytest.fixture(name="admin_user")
def admin_user_fixture(session: Session):
    user = Usuario(
        username="test_admin",
        full_name="Test Admin",
        email="admin@test.com",
        hashed_password=hash_password("Admin1234!"),
        role="admin",
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    uid = user.id
    session.expunge(user)
    user.id = uid
    return user


@pytest.fixture(name="cocina_user")
def cocina_user_fixture(session: Session):
    user = Usuario(
        username="test_cocina",
        full_name="Test Cocina",
        email="cocina@test.com",
        hashed_password=hash_password("Cocina1234!"),
        role="cocina",
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    uid = user.id
    session.expunge(user)
    user.id = uid
    return user


@pytest.fixture(name="pedidos_user")
def pedidos_user_fixture(session: Session):
    user = Usuario(
        username="test_pedidos",
        full_name="Test Pedidos",
        email="pedidos@test.com",
        hashed_password=hash_password("Pedidos1234!"),
        role="pedidos",
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    uid = user.id
    session.expunge(user)
    user.id = uid
    return user


@pytest.fixture(name="regular_user")
def regular_user_fixture(session: Session):
    user = Usuario(
        username="test_user",
        full_name="Test User",
        email="user@test.com",
        hashed_password=hash_password("User1234!"),
        role="user",
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    uid = user.id
    session.expunge(user)
    user.id = uid
    return user


def get_auth_headers(user) -> dict[str, str]:
    token = create_access_token(
        data={"sub": user.username, "role": user.role}
    )
    return {"access_token": token}


@pytest.fixture(name="pedido_pendiente")
def pedido_pendiente_fixture(session: Session, regular_user):
    pedido = Pedido(
        descripcion="Hamburguesa doble",
        total=1500.0,
        estado="pendiente",
        usuario_id=regular_user.id,
    )
    session.add(pedido)
    session.commit()
    session.refresh(pedido)
    pid = pedido.id
    session.expunge(pedido)
    pedido.id = pid
    return pedido


@pytest.fixture(name="pedido_confirmado")
def pedido_confirmado_fixture(session: Session, regular_user):
    pedido = Pedido(
        descripcion="Pizza margarita",
        total=2000.0,
        estado="confirmado",
        usuario_id=regular_user.id,
    )
    session.add(pedido)
    session.commit()
    session.refresh(pedido)
    pid = pedido.id
    session.expunge(pedido)
    pedido.id = pid
    return pedido


@pytest.fixture(name="pedido_preparando")
def pedido_preparando_fixture(session: Session, regular_user):
    pedido = Pedido(
        descripcion="Empanadas x12",
        total=3000.0,
        estado="preparando",
        usuario_id=regular_user.id,
    )
    session.add(pedido)
    session.commit()
    session.refresh(pedido)
    pid = pedido.id
    session.expunge(pedido)
    pedido.id = pid
    return pedido


@pytest.fixture(name="categoria_base")
def categoria_base_fixture(session: Session):
    cat = Categoria(nombre="Bebidas", descripcion="Bebidas frías y calientes")
    session.add(cat)
    session.commit()
    session.refresh(cat)
    cid = cat.id
    session.expunge(cat)
    cat.id = cid
    return cat
