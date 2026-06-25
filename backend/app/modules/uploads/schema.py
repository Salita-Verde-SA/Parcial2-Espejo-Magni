from pydantic import BaseModel


class CloudinaryResponse(BaseModel):
    secure_url: str
    public_id: str
    width: int = 0
    height: int = 0
    format: str = ""
    resource_type: str = "image"
