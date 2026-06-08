# Script de seed — carga usuarios iniciales para pruebas.
#
# Idempotente: se puede ejecutar múltiples veces sin duplicar datos.
#
# Uso:
#     python -m app.db.seed
#
# Requiere PostgreSQL corriendo con las variables de .env configuradas.
#
# Usuarios:
#   - admin   / Admin1234!   (role=admin,   acceso total)
#   - pedidos / Admin1234! (role=pedidos, cajero)
#   - cocina  / Cocina1234!  (role=cocina,  KDS cocina)
#   - juan    / Juan1234!    (role=user,    cliente 1)
#   - maria   / Maria1234!   (role=user,    cliente 2)

from sqlmodel import Session, select
from app.core.database import engine, create_all_tables
from app.core.security import hash_password
from app.modules.usuarios.models import Usuario

# Lista de usuarios iniciales para desarrollo/pruebas.
# Cada entrada tiene username, email, password (texto plano) y role.
# El hash bcrypt se genera en tiempo de ejecución.
USUARIOS_INICIALES = [
    {
        "username":  "admin",
        "full_name": "Administrador del Sistema",
        "email":     "admin@example.com",
        "password":  "Admin1234!",
        "role":      "admin",
    },
    {
        "username":  "pedidos",
        "full_name": "Cajero Principal",
        "email":     "pedidos@example.com",
        "password":  "Pedidos1234!",
        "role":      "pedidos",
    },
    {
        "username":  "cocina",
        "full_name": "Cocinero KDS",
        "email":     "cocina@foodstore.com",
        "password":  "Cocina1234!",
        "role":      "cocina",
    },
    {
        "username":  "juan",
        "full_name": "Juan Pérez",
        "email":     "juan@example.com",
        "password":  "Juan1234!",
        "role":      "user",
    },
    {
        "username":  "maria",
        "full_name": "María García",
        "email":     "maria@example.com",
        "password":  "Maria1234!",
        "role":      "user",
    },
]


def run() -> None:
    # Crea las tablas si no existen (idempotente)
    print("=== Seed - Seguridad JWT (PostgreSQL) ===")
    create_all_tables()

    with Session(engine) as session:
        for data in USUARIOS_INICIALES:
            # Verifica si el usuario ya existe (por username) para evitar duplicados
            existing = session.exec(
                select(Usuario).where(Usuario.username == data["username"])
            ).first()

            if existing:
                # El usuario ya fue creado en una ejecución anterior
                print(f"  [=] Ya existe: {data['username']} ({data['role']})")
            else:
                # Crea el usuario con la contraseña hasheada
                usuario = Usuario(
                    username=data["username"],
                    full_name=data["full_name"],
                    email=data["email"],
                    hashed_password=hash_password(data["password"]),
                    role=data["role"],
                )
                session.add(usuario)
                print(f"  [+] Creado: {data['username']} / {data['password']}  (role={data['role']})")

        # Persiste todos los cambios en una sola transacción
        session.commit()

    # Muestra resumen de usuarios disponibles
    print("\nUsuarios disponibles para pruebas:")
    print("  admin   / Admin1234!   -> role=admin   (acceso total)")
    print("  pedidos / Pedidos1234! -> role=pedidos  (cajero)")
    print("  cocina  / Cocina1234!  -> role=cocina   (KDS cocina)")
    print("  juan    / Juan1234!    -> role=user     (cliente 1)")
    print("  maria   / Maria1234!   -> role=user     (cliente 2)")
    print()


if __name__ == "__main__":
    # Punto de entrada: ejecutar con python -m app.db.seed
    run()
