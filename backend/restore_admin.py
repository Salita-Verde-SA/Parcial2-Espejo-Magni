import sys
import os
sys.path.append(os.path.dirname(__file__))

from app.core.database import engine
from sqlmodel import Session, select
from app.modules.usuarios.model import Usuario
from app.modules.roles.model import UsuarioRol

def restore_admin():
    with Session(engine) as session:
        # Find admin user
        admin_user = session.exec(select(Usuario).where(Usuario.email == "admin@fastfood.com")).first()
        if not admin_user:
            print("No admin user found with email admin@fastfood.com")
            # If not admin@fastfood.com, maybe id 1?
            admin_user = session.exec(select(Usuario).where(Usuario.id == 1)).first()
            if not admin_user:
                return

        print(f"Restoring ADMIN role to user {admin_user.email} (ID: {admin_user.id})")
        
        # Check if they have the role
        existing = session.exec(
            select(UsuarioRol)
            .where(UsuarioRol.usuario_id == admin_user.id)
            .where(UsuarioRol.rol_codigo == "ADMIN")
        ).first()

        if not existing:
            session.add(UsuarioRol(usuario_id=admin_user.id, rol_codigo="ADMIN"))
            session.commit()
            print("ADMIN role restored successfully!")
        else:
            print("User already has ADMIN role.")

if __name__ == "__main__":
    restore_admin()
