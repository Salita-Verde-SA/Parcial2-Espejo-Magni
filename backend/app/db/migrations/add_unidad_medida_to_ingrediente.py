from sqlalchemy import text as sa_text
from sqlmodel import Session, select

from app.core.database import engine
from app.modules.unidades.model import UnidadMedida


def run() -> None:
    print("=== Migration: add_unidad_medida_to_ingrediente ===\n")

    with Session(engine) as session:
        print("[1/2] Agregando columna unidad_medida_id a ingrediente...")

        col_result = session.exec(
            sa_text("""
                SELECT EXISTS (
                    SELECT FROM information_schema.columns
                    WHERE table_name = 'ingrediente'
                    AND column_name = 'unidad_medida_id'
                );
            """)
        )
        col_existe = col_result.scalar()

        if not col_existe:
            session.exec(
                sa_text("ALTER TABLE ingrediente ADD COLUMN unidad_medida_id INTEGER REFERENCES unidad_medida(id);")
            )
            session.commit()
            print("  [+] Columna unidad_medida_id agregada.\n")
        else:
            print("  [=] Columna unidad_medida_id ya existe.\n")

        print("[2/2] Asignando unidad por defecto a ingredientes existentes...")

        unidad_default = session.exec(
            select(UnidadMedida).where(UnidadMedida.simbolo == "u")
        ).first()
        default_id = unidad_default.id if unidad_default else 1

        result_nulls = session.exec(
            sa_text("SELECT COUNT(*) FROM ingrediente WHERE unidad_medida_id IS NULL;")
        )
        null_count = result_nulls.scalar() or 0

        if null_count > 0:
            session.execute(
                sa_text("UPDATE ingrediente SET unidad_medida_id = :default_id WHERE unidad_medida_id IS NULL;"),
                {"default_id": default_id}
            )
            session.commit()
            print(f"  [+] Asignado 'u' (id={default_id}) a {null_count} ingrediente(s) sin unidad.\n")
        else:
            print("  [=] Todos los ingredientes ya tienen unidad asignada.\n")

    print("=== Migración completada con éxito ===\n")


if __name__ == "__main__":
    run()
