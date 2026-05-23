import json
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

res = client.post("/api/v1/auth/login", json={"email": "juan@fastfood.com", "password": "Juan1234!"})
print("Login status:", res.status_code)
if res.status_code != 200:
    print(res.text)
    exit(1)
token = res.json()["access_token"]

payload = {
    "calle": "Falsa",
    "numero": "123",
    "piso": "",
    "departamento": "",
    "ciudad": "Springfield",
    "alias": "Casa",
    "principal": True
}
res2 = client.post("/api/v1/direcciones/", headers={"Authorization": f"Bearer {token}"}, json=payload)
print("Create status:", res2.status_code)
print(res2.text)
