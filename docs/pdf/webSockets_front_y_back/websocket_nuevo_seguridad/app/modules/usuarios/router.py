# Router de autenticación y gestión de usuarios.
#
# HTTP puro: parsear request, validar schema Pydantic, delegar al Service,
# serializar response con response_model. No contiene lógica de negocio.
#
# Capa: Router
# Conoce a: Service (vía UoW)
# NO conoce a: Repository, Model (solo esquemas Pydantic para response_model)
#
# Convenciones HTTP:
#   200 → éxito
#   201 → recurso creado (register)
#   401 → no autenticado
#   403 → sin permisos (require_role)
#   409 → conflicto (usuario duplicado)

from typing import Annotated
from app.core.config import settings

from fastapi import APIRouter, Depends, status, Response
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session

from app.core.database import get_session
from app.core.deps import get_current_active_user, require_role
from app.modules.usuarios.schemas import UserCreate, UserPublic, Token
from app.modules.usuarios.service import UsuarioService

# Router con prefijo /api/v1/auth
router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


def get_usuario_service(session: Session = Depends(get_session)) -> UsuarioService:
    # Factory: inyecta la sesión de BD en el service
    return UsuarioService(session)


# ─── Registro ─────────────────────────────────────────────────────────────────
# POST /api/v1/auth/register — crea un nuevo usuario con role="user"

@router.post("/register", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
def register(
    user_in: UserCreate,
    svc: UsuarioService = Depends(get_usuario_service),
) -> UserPublic:
    return svc.register(user_in)


# ─── Login (OAuth2 Password Flow) ────────────────────────────────────────────
# POST /api/v1/auth/token — autentica y devuelve JWT en cookie HttpOnly

@router.post("/token")
def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    response: Response,
    svc: UsuarioService = Depends(get_usuario_service),
):
    # Autentica y obtiene el token
    token = svc.authenticate(form_data.username, form_data.password)

    # Configura la cookie HttpOnly con el JWT
    # HttpOnly → no accesible desde JavaScript (protección XSS)
    # SameSite=lax → protege contra CSRF (solo se envía desde el mismo sitio)
    # secure=False → en producción debe ser True (requiere HTTPS)
    response.set_cookie(
        key="access_token",
        value=token.access_token,
        httponly=True,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="lax",
        secure=False,
    )
    # El body solo confirma éxito; el token viaja en la cookie
    return {"mensaje": "Login exitoso. Sesión iniciada."}


# ─── Logout ──────────────────────────────────────────────────────────────────
# POST /api/v1/auth/logout — elimina la cookie HttpOnly

@router.post("/logout")
def logout(response: Response):
    # Borra la cookie access_token del cliente
    response.delete_cookie(
        key="access_token",
        httponly=True,
        samesite="lax",
        secure=False,
    )
    return {"mensaje": "Sesión cerrada exitosamente"}


# ─── Rutas protegidas ────────────────────────────────────────────────────────

@router.get("/me", response_model=UserPublic)
def read_me(
    current_user: Annotated[UserPublic, Depends(get_current_active_user)],
):
    # GET /api/v1/auth/me — devuelve los datos del usuario autenticado
    return current_user


@router.get("/privado")
def ruta_privada(
    current_user: Annotated[UserPublic, Depends(get_current_active_user)],
):
    # GET /api/v1/auth/privado — endpoint de prueba para verificar autenticación
    return {
        "mensaje": f"¡Hola, {current_user.full_name}! Accediste a una ruta privada.",
        "tu_rol": current_user.role,
    }


# ─── Rutas de administración (RBAC) ──────────────────────────────────────────
# Solo accesibles por usuarios con role="admin"

@router.get("/admin/usuarios", response_model=list[UserPublic])
def list_users(
    _admin: Annotated[UserPublic, Depends(require_role(["admin"]))],
    svc: UsuarioService = Depends(get_usuario_service),
) -> list[UserPublic]:
    # GET /api/v1/auth/admin/usuarios — lista todos los usuarios (solo admin)
    return svc.list_all()


@router.post("/admin/usuarios/{user_id}/desactivar", response_model=UserPublic)
def deactivate_user(
    user_id: int,
    _admin: Annotated[UserPublic, Depends(require_role(["admin"]))],
    svc: UsuarioService = Depends(get_usuario_service),
) -> UserPublic:
    # POST /api/v1/auth/admin/usuarios/{id}/desactivar — desactiva un usuario
    return svc.set_disabled(user_id, disabled=True)


@router.post("/admin/usuarios/{user_id}/activar", response_model=UserPublic)
def activate_user(
    user_id: int,
    _admin: Annotated[UserPublic, Depends(require_role(["admin"]))],
    svc: UsuarioService = Depends(get_usuario_service),
) -> UserPublic:
    # POST /api/v1/auth/admin/usuarios/{id}/activar — reactiva un usuario
    return svc.set_disabled(user_id, disabled=False)
