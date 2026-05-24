from sqlmodel import SQLModel, Session, create_engine
from app.core.config import settings

engine = create_engine(settings.DATABASE_URL, echo=False)


def get_session():
    with Session(engine) as session:
        yield session


def create_all_tables() -> None:
    import app.modules.roles.model          # noqa: F401
    import app.modules.auth.model           # noqa: F401
    import app.modules.usuarios.model       # noqa: F401
    import app.modules.categorias.model     # noqa: F401
    import app.modules.ingredientes.model   # noqa: F401
    import app.modules.productos.model      # noqa: F401
    import app.modules.unidades.model       # noqa: F401
    import app.modules.pedidos.model        # noqa: F401
    SQLModel.metadata.create_all(engine)
