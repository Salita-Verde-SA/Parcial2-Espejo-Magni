# Modelo de Usuario — tabla 'usuario' en PostgreSQL.
#
# Campos clave para seguridad:
#   - hashed_password: hash bcrypt (nunca texto plano)
#   - role: "user" | "admin" | "cocina" — usado por require_role() para RBAC
#   - disabled: permite desactivar cuentas sin eliminarlas

from sqlmodel import SQLModel, Field


class Usuario(SQLModel, table=True):
    # SQLModel con table=True crea automáticamente la tabla en PostgreSQL

    id:              int | None = Field(default=None, primary_key=True)
    # username único con índice para búsqueda rápida en login
    username:        str        = Field(index=True, unique=True)
    full_name:       str        = Field()
    # email con índice para búsquedas y validación de unicidad
    email:           str        = Field(index=True, unique=True)
    # Solo almacena el hash bcrypt, NUNCA la contraseña en texto plano
    hashed_password: str        = Field()
    # RBAC: user (default), admin, cocina
    role:            str        = Field(default="user")
    # disabled=True → el usuario no puede autenticarse ni operar
    disabled:        bool       = Field(default=False)
