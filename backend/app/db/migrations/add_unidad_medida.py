"""
Migración: Agregar tabla unidad_medida y migrar producto_ingrediente.

Uso:
    python -m app.db.migrations.add_unidad_medida

Este script:
  1. Crea la tabla unidad_medida si no existe
  2. Inserta las 7 unidades de medida (idempotente)
  3. Actualiza producto_ingrediente: agrega columna unidad_medida_id
  4. Asigna unidad default "u" a registros existentes con NULL

IMPORTANT: Ejecutar ANTES del seed la primera vez en una BD existente.
           Si es una BD nueva, el seed se encarga de todo.
"""

from sqlmodel import SQLModel, Session, text, select

from app.core.database import engine
from app.modules.unidades.model import UnidadMedida


def run() -> None:
    print("=== Migration: add_unidad_medida ===\n")

    with Session(engine) as session:

        # ── 1. Verificar si la tabla unidad_medida ya existe ──────────────────
        result = session.exec(
            text("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'unidad_medida');")
        )
        unidad_tabla_existe = result.scalar()

        if not unidad_tabla_existe:
            print("[1/3] Creando tabla unidad_medida...")
            SQLModel.metadata.create_all(engine)
            print("  [OK] Tabla unidad_medida creada.\n")
        else:
            print("[1/3] Tabla unidad_medida ya existe. OK.\n")

        # ── 2. Insertar unidades si no están ─────────────────────────────────
        print("[2/3] Insertando unidades de medida...")

        UNIDADES = [
            {"nombre": "kilogramo",      "simbolo": "kg",  "tipo": "masa"},
            {"nombre": "gramo",          "simbolo": "g",   "tipo": "masa"},
            {"nombre": "litro",          "simbolo": "L",   "tipo": "volumen"},
            {"nombre": "mililitro",      "simbolo": "mL",  "tipo": "volumen"},
            {"nombre": "pieza",          "simbolo": "u",   "tipo": "unidad"},
            {"nombre": "docena",         "simbolo": "doc", "tipo": "unidad"},
            {"nombre": "metro cuadrado", "simbolo": "m²",  "tipo": "area"},
        ]

        for u in UNIDADES:
            existing = session.exec(
                select(UnidadMedida).where(UnidadMedida.simbolo == u["simbolo"])
            ).first()
            if not existing:
                session.add(UnidadMedida(**u))
                print(f"  [+] {u['nombre']} ({u['simbolo']})")
            else:
                print(f"  [=] {u['nombre']} ({u['simbolo']}) — ya existe")

        session.flush()

        # Obtener ID de la unidad "u" como default
        unidad_default = session.exec(
            select(UnidadMedida).where(UnidadMedida.simbolo == "u")
        ).first()

        if not unidad_default:
            print("\n  [ERROR] No se encontró la unidad 'u' (pieza).")
            print("  Asegurate de que la tabla unidad_medida tenga la unidad 'u'.")
            return

        unidad_default_id = unidad_default.id
        print(f"  [OK] Unidad default: 'u' (id={unidad_default_id})\n")

        # ── 3. Migrar producto_ingrediente ────────────────────────────────────
        print("[3/3] Migrando producto_ingrediente...")

        # 3a. Agregar columna unidad_medida_id si no existe
        col_result = session.exec(
            text("""
                SELECT EXISTS (
                    SELECT FROM information_schema.columns
                    WHERE table_name = 'producto_ingrediente'
                    AND column_name = 'unidad_medida_id'
                );
            """)
        )
        col_existe = col_result.scalar()

        if not col_existe:
            # Modificar columna cantidad de INTEGER a NUMERIC(10,3)
            session.exec(text("ALTER TABLE producto_ingrediente ALTER COLUMN cantidad TYPE NUMERIC(10,3);"))
            # Agregar columna FK
            session.exec(
                text("ALTER TABLE producto_ingrediente ADD COLUMN unidad_medida_id INTEGER NOT NULL DEFAULT :default_id;"),
                {"default_id": unidad_default_id}
            )
            session.exec(
                text("ALTER TABLE producto_ingrediente ADD CONSTRAINT fk_pi_unidad FOREIGN KEY (unidad_medida_id) REFERENCES unidad_medida(id);")
            )
            session.commit()
            print("  [+] Columnas agregadas: cantidad → NUMERIC(10,3), unidad_medida_id → FK")
        else:
            print("  [=] Columna unidad_medida_id ya existe. OK.")

        # 3b. Asignar unidad default a registros con NULL (por si quedó alguno)
        result_nulls = session.exec(
            text("SELECT COUNT(*) FROM producto_ingrediente WHERE unidad_medida_id IS NULL;")
        )
        null_count = result_nulls.scalar() or 0

        if null_count > 0:
            session.exec(
                text("UPDATE producto_ingrediente SET unidad_medida_id = :default_id WHERE unidad_medida_id IS NULL;"),
                {"default_id": unidad_default_id}
            )
            session.commit()
            print(f"  [+] Asignado unidad 'u' a {null_count} registros con NULL.")
        else:
            print("  [=] No hay registros con unidad_medida_id NULL. OK.")

        # 3c. Agregar DEFAULT a columna cantidad si es INTEGER
        try:
            session.exec(text("ALTER TABLE producto_ingrediente ALTER COLUMN cantidad SET DEFAULT '1';"))
            print("  [+] DEFAULT en columna cantidad actualizado a '1'.")
        except Exception:
            print("  [=] DEFAULT en columna cantidad ya estaba seteado. OK.")

    print("\n=== Migración completada con éxito ===\n")


if __name__ == "__main__":
    run()
