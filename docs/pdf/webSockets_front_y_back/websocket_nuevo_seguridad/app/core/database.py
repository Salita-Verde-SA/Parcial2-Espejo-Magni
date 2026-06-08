# Engine SQLModel y factory de sesión.
#
# Usa PostgreSQL configurado vía variables de entorno (app.core.config).
# Los tests sobreescriben get_session con SQLite en memoria — sin tocar este módulo.
#
# Funcionamiento:
#   1. create_engine(settings.DATABASE_URL) → engine global (singleton)
#   2. get_session() → dependencia FastAPI que provee una sesión por request
#   3. create_all_tables() → crea las tablas registradas en SQLModel.metadata

from sqlmodel import SQLModel, Session, create_engine
from app.core.config import settings

# Engine global — se crea una sola vez al importar el módulo.
# echo=False evita logs excesivos de SQL en consola.
engine = create_engine(settings.DATABASE_URL, echo=False)


def get_session():
    # Dependencia FastAPI: genera una sesión por request.
    # El with Session() asegura que la sesión se cierre al terminar el request.
    with Session(engine) as session:
        yield session


def create_all_tables() -> None:
    # Crea las tablas registradas en SQLModel.metadata al arrancar la app.
    # Los imports forzan el registro de los modelos en metadata aunque
    # no se usen directamente aquí (de ahí el # noqa).
    import app.modules.usuarios.models     # Registra el modelo Usuario
    import app.modules.categorias.models   # Registra el modelo Categoria
    import app.modules.pedidos.models      # Registra el modelo Pedido
    SQLModel.metadata.create_all(engine)
