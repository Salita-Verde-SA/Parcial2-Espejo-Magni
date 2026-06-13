from urllib.parse import unquote

from fastapi import APIRouter, Depends, File, Form, UploadFile, status

from app.core.deps import require_roles
from app.modules.uploads.schema import CloudinaryResponse
from app.modules.uploads.service import upload_imagen, eliminar_imagen

router = APIRouter(prefix="/api/v1/uploads", tags=["uploads"])


@router.post(
    "/imagen",
    response_model=CloudinaryResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles(["ADMIN"]))],
)
async def subir_imagen(
    file: UploadFile = File(...),
    folder: str = Form("productos"),
):
    """Sube una imagen a Cloudinary. Devuelve secure_url y public_id."""
    return await upload_imagen(file, folder)


@router.delete(
    "/imagen/{public_id:path}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_roles(["ADMIN"]))],
)
def borrar_imagen(public_id: str):
    """Elimina una imagen de Cloudinary por su public_id (URL-encoded)."""
    eliminar_imagen(unquote(public_id))
