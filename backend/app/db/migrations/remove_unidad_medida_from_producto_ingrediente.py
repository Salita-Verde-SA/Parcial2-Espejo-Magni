from sqlalchemy import text as sa_text
from sqlmodel import Session

from app.core.database import engine


def run() -> None:
    print("=== Migration: remove_unidad_medida_from_producto_ingrediente ===\n")

    with Session(engine) as session:
        print("[1/2] Verificando existencia de columna unidad_medida_id...")

        col_result = session.exec(
            sa_text("""
                SELECT EXISTS (
                    SELECT FROM information_schema.columns
                    WHERE table_name = 'producto_ingrediente'
                    AND column_name = 'unidad_medida_id'
                );
            """)
        )
        col_existe = col_result.scalar()

        if not col_existe:
            print("  [=] La columna ya fue eliminada. Nada que hacer.\n")
            print("=== Migración completada ===\n")
            return

        print("  [OK] Columna encontrada.\n")

        print("[2/2] Eliminando columna unidad_medida_id...")

        session.exec(
            sa_text("ALTER TABLE producto_ingrediente DROP CONSTRAINT IF EXISTS fk_pi_unidad;")
        )
        print("  [+] FK fk_pi_unidad eliminada.")

        session.exec(
            sa_text("ALTER TABLE producto_ingrediente DROP COLUMN unidad_medida_id;")
        )
        print("  [+] Columna unidad_medida_id eliminada.")

        session.commit()

    print("\n=== Migración completada con éxito ===\n")


if __name__ == "__main__":
    run()
