# Unit of Work genérico.
# Encapsula la sesión de BD y maneja commit/rollback automático
# vía context manager (__enter__ / __exit__).
#
# Uso:
#   with MiUnitOfWork(session) as uow:
#       uow.mi_repo.add(...)
#   # commit automático si no hay excepción

from sqlmodel import Session


class UnitOfWork:
    def __init__(self, session: Session) -> None:
        # Recibe una sesión ya abierta (no la crea)
        self._session = session

    def __enter__(self) -> "UnitOfWork":
        # Al entrar al bloque with, retorna sí mismo para acceder a los repos
        return self

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        # Sin excepción → commit; con excepción → rollback
        # Siempre cierra la sesión al salir
        if exc_type is None:
            self._session.commit()
        else:
            self._session.rollback()
        self._session.close()

    def commit(self) -> None:
        # Commit explícito — útil si se necesita persistir antes de salir del with
        self._session.commit()

    def rollback(self) -> None:
        # Rollback explícito
        self._session.rollback()
