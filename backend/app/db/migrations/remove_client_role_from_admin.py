from sqlmodel import Session, text
from app.core.database import engine


def run() -> None:
    print("=== Migration: remove_client_role_from_admin ===\n")

    with Session(engine) as session:
        result = session.exec(
            text("""
                DELETE FROM usuario_rol
                WHERE rol_id = (SELECT id FROM roles WHERE codigo = 'CLIENT')
                  AND usuario_id IN (
                    SELECT usuario_id FROM usuario_rol
                    WHERE rol_id = (SELECT id FROM roles WHERE codigo = 'ADMIN')
                  )
            """)
        )
        affected = result.rowcount
        session.commit()
        print(f"  [OK] Role CLIENT removido de {affected} administrador(es).\n")

    print("=== Migración completada ===\n")


if __name__ == "__main__":
    run()
