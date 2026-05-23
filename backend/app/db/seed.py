from decimal import Decimal

from sqlmodel import Session, select

from app.core.database import engine, create_all_tables
from app.core.security import hash_password
from app.modules.roles.model import Rol, UsuarioRol
from app.modules.usuarios.model import Usuario
from app.modules.ingredientes.model import Ingrediente
from app.modules.categorias.model import Categoria
from app.modules.productos.model import Producto, ProductoCategoria, ProductoIngrediente
from app.modules.unidades.model import UnidadMedida
from app.modules.pedidos.model import EstadoPedido, FormaPago

ROLES = [
    {"codigo": "ADMIN",   "descripcion": "Administrador con acceso total"},
    {"codigo": "STOCK",   "descripcion": "Gestión de stock e inventario"},
    {"codigo": "PEDIDOS", "descripcion": "Gestión y avance de pedidos"},
    {"codigo": "CLIENT",  "descripcion": "Cliente del sistema"},
]

ESTADOS_PEDIDO = [
    {"codigo": "PENDIENTE", "descripcion": "Pedido registrado, pendiente de aprobación"},
    {"codigo": "CONFIRMADO", "descripcion": "Pedido confirmado por la tienda"},
    {"codigo": "EN_PREP", "descripcion": "Pedido en preparación"},
    {"codigo": "EN_CAMINO", "descripcion": "Pedido en camino"},
    {"codigo": "ENTREGADO", "descripcion": "Pedido entregado al cliente"},
    {"codigo": "CANCELADO", "descripcion": "Pedido cancelado"},
]

FORMAS_PAGO = [
    {"codigo": "EFECTIVO", "descripcion": "Pago en efectivo al recibir"},
    {"codigo": "MERCADOPAGO", "descripcion": "Pago online a través de MercadoPago"},
    {"codigo": "TARJETA", "descripcion": "Pago con tarjeta de crédito/débito"},
]


USUARIOS = [
    {"nombre": "Admin",     "apellido": "Sistema",  "email": "admin@fastfood.com", "password": "Admin1234!", "roles": ["ADMIN", "CLIENT"]},
    {"nombre": "Juan",      "apellido": "Perez",    "email": "juan@fastfood.com",  "password": "Juan1234!",  "roles": ["CLIENT"]},
    {"nombre": "Stock",     "apellido": "Manager",  "email": "stock@fastfood.com", "password": "Stock1234!", "roles": ["STOCK"]},
    {"nombre": "Pedidos",   "apellido": "Manager",  "email": "pedidos@fastfood.com","password": "Ped1234!",  "roles": ["PEDIDOS"]},
]

CATEGORIAS = [
    {"nombre": "Hamburguesas",    "descripcion": "Nuestras hamburguesas artesanales"},
    {"nombre": "Papas y Snacks",  "descripcion": "Acompañamientos y snacks"},
    {"nombre": "Bebidas",         "descripcion": "Bebidas frías y calientes"},
    {"nombre": "Postres",         "descripcion": "Postres y helados"},
    {"nombre": "Combos",          "descripcion": "Combos con descuento"},
]

UNIDADES = [
    {"nombre": "kilogramo",       "simbolo": "kg",  "tipo": "masa"},
    {"nombre": "gramo",           "simbolo": "g",   "tipo": "masa"},
    {"nombre": "litro",           "simbolo": "L",   "tipo": "volumen"},
    {"nombre": "mililitro",       "simbolo": "mL",  "tipo": "volumen"},
    {"nombre": "pieza",           "simbolo": "u",   "tipo": "unidad"},
    {"nombre": "docena",           "simbolo": "doc", "tipo": "unidad"},
    {"nombre": "metro cuadrado",  "simbolo": "m²",  "tipo": "area"},
]

INGREDIENTES = [
    {"nombre": "Carne vacuna",       "descripcion": "Medallón 100% vacuna 120g",   "es_alergeno": False},
    {"nombre": "Pan de hamburguesa", "descripcion": "Pan brioche con sésamo",       "es_alergeno": True},
    {"nombre": "Queso cheddar",      "descripcion": "Queso cheddar fundido",        "es_alergeno": True},
    {"nombre": "Lechuga",            "descripcion": "Lechuga romana fresca",        "es_alergeno": False},
    {"nombre": "Tomate",             "descripcion": "Tomate perita en rodajas",     "es_alergeno": False},
    {"nombre": "Cebolla",            "descripcion": "Cebolla morada en aros",       "es_alergeno": False},
    {"nombre": "Pepino encurtido",   "descripcion": "Pickle de pepino",             "es_alergeno": False},
    {"nombre": "Salsa especial",     "descripcion": "Salsa de la casa",             "es_alergeno": True},
    {"nombre": "Panceta ahumada",    "descripcion": "Panceta crocante en fetas",    "es_alergeno": False},
    {"nombre": "Papas fritas",       "descripcion": "Papas bastón fritas",          "es_alergeno": False},
    {"nombre": "Mayonesa",           "descripcion": "Mayonesa artesanal",           "es_alergeno": True},
    {"nombre": "Mostaza",            "descripcion": "Mostaza Dijon",                "es_alergeno": False},
]

PRODUCTOS = [
    {
        "nombre": "Classic Burger",
        "descripcion": "Hamburguesa clásica con carne, lechuga, tomate y salsa especial",
        "precio_base": Decimal("1500.00"),
        "stock_cantidad": 50,
        "disponible": True,
        "imagen_url": None,
        "categorias": ["Hamburguesas"],
        "ingredientes": ["Carne vacuna", "Pan de hamburguesa", "Lechuga", "Tomate", "Salsa especial"],
    },
    {
        "nombre": "Cheese Burger",
        "descripcion": "Classic con doble queso cheddar",
        "precio_base": Decimal("1750.00"),
        "stock_cantidad": 40,
        "disponible": True,
        "imagen_url": None,
        "categorias": ["Hamburguesas"],
        "ingredientes": ["Carne vacuna", "Pan de hamburguesa", "Queso cheddar", "Lechuga", "Tomate"],
    },
    {
        "nombre": "Bacon Burger",
        "descripcion": "Con panceta ahumada y queso",
        "precio_base": Decimal("1950.00"),
        "stock_cantidad": 30,
        "disponible": True,
        "imagen_url": None,
        "categorias": ["Hamburguesas"],
        "ingredientes": ["Carne vacuna", "Pan de hamburguesa", "Panceta ahumada", "Queso cheddar"],
    },
    {
        "nombre": "Papas Fritas",
        "descripcion": "Porción grande de papas bastón",
        "precio_base": Decimal("700.00"),
        "stock_cantidad": 100,
        "disponible": True,
        "imagen_url": None,
        "categorias": ["Papas y Snacks"],
        "ingredientes": ["Papas fritas"],
    },
    {
        "nombre": "Coca-Cola 500ml",
        "descripcion": "Bebida gaseosa fría",
        "precio_base": Decimal("500.00"),
        "stock_cantidad": 80,
        "disponible": True,
        "imagen_url": None,
        "categorias": ["Bebidas"],
        "ingredientes": [],
    },
    {
        "nombre": "Combo Classic",
        "descripcion": "Classic Burger + Papas + Bebida",
        "precio_base": Decimal("2500.00"),
        "stock_cantidad": 20,
        "disponible": True,
        "imagen_url": None,
        "categorias": ["Combos"],
        "ingredientes": [],
    },
]


def _upsert(session: Session, model_class, pk_field: str, pk_value, data: dict):
    existing = session.get(model_class, pk_value)
    if not existing:
        obj = model_class(**data)
        session.add(obj)
        return True
    return False


def run() -> None:
    print("=== Fast Food Seed ===")
    create_all_tables()

    with Session(engine) as session:
        print("\n[Roles]")
        for r in ROLES:
            if _upsert(session, Rol, "codigo", r["codigo"], r):
                print(f"  [+] {r['codigo']}")
            else:
                print(f"  [=] {r['codigo']}")
        session.flush()

        print("\n[Estados Pedido]")
        for ep in ESTADOS_PEDIDO:
            if _upsert(session, EstadoPedido, "codigo", ep["codigo"], ep):
                print(f"  [+] {ep['codigo']}")
            else:
                print(f"  [=] {ep['codigo']}")
        session.flush()

        print("\n[Formas de Pago]")
        for fp in FORMAS_PAGO:
            if _upsert(session, FormaPago, "codigo", fp["codigo"], fp):
                print(f"  [+] {fp['codigo']}")
            else:
                print(f"  [=] {fp['codigo']}")
        session.flush()

        print("\n[Unidades de Medida]")
        unid_ids = {}
        for u in UNIDADES:
            existing = session.exec(
                select(UnidadMedida).where(UnidadMedida.simbolo == u["simbolo"])
            ).first()
            if not existing:
                unid = UnidadMedida(**u)
                session.add(unid)
                session.flush()
                unid_ids[u["simbolo"]] = unid.id
                print(f"  [+] {u['nombre']} ({u['simbolo']})")
            else:
                unid_ids[u["simbolo"]] = existing.id
                print(f"  [=] {u['nombre']} ({u['simbolo']})")
        
        unidad_default_id = unid_ids.get("u", 1)

        print("\n[Categorias]")
        cat_ids = {}
        for c in CATEGORIAS:
            existing = session.exec(
                select(Categoria).where(Categoria.nombre == c["nombre"])
            ).first()
            if not existing:
                cat = Categoria(nombre=c["nombre"], descripcion=c["descripcion"])
                session.add(cat)
                session.flush()
                cat_ids[c["nombre"]] = cat.id
                print(f"  [+] {c['nombre']}")
            else:
                cat_ids[c["nombre"]] = existing.id
                print(f"  [=] {c['nombre']}")

        print("\n[Ingredientes]")
        ing_ids = {}
        for i in INGREDIENTES:
            existing = session.exec(
                select(Ingrediente).where(Ingrediente.nombre == i["nombre"])
            ).first()
            if not existing:
                ing = Ingrediente(**i)
                session.add(ing)
                session.flush()
                ing_ids[i["nombre"]] = ing.id
                flag = "[ALERGENO]" if i["es_alergeno"] else ""
                print(f"  [+] {i['nombre']} {flag}")
            else:
                ing_ids[i["nombre"]] = existing.id
                print(f"  [=] {i['nombre']}")

        print("\n[Usuarios]")
        for u in USUARIOS:
            existing = session.exec(
                select(Usuario).where(Usuario.email == u["email"])
            ).first()
            if not existing:
                user = Usuario(
                    nombre=u["nombre"],
                    apellido=u["apellido"],
                    email=u["email"],
                    hashed_password=hash_password(u["password"]),
                )
                session.add(user)
                session.flush()
                for rol in u["roles"]:
                    session.add(UsuarioRol(usuario_id=user.id, rol_codigo=rol))
                session.flush()
                print(f"  [+] {u['email']} / {u['password']}  roles={u['roles']}")
            else:
                print(f"  [=] {u['email']}")

        print("\n[Productos]")
        for p in PRODUCTOS:
            existing = session.exec(
                select(Producto).where(Producto.nombre == p["nombre"])
            ).first()
            if not existing:
                prod = Producto(
                    nombre=p["nombre"],
                    descripcion=p["descripcion"],
                    precio_base=p["precio_base"],
                    stock_cantidad=p["stock_cantidad"],
                    disponible=p["disponible"],
                    imagen_url=p["imagen_url"],
                )
                session.add(prod)
                session.flush()
                for cat_name in p["categorias"]:
                    if cat_name in cat_ids:
                        session.add(ProductoCategoria(producto_id=prod.id, categoria_id=cat_ids[cat_name]))
                for ing_name in p["ingredientes"]:
                    if ing_name in ing_ids:
                        session.add(ProductoIngrediente(
                            producto_id=prod.id,
                            ingrediente_id=ing_ids[ing_name],
                            cantidad=Decimal("1"),
                            unidad_medida_id=unidad_default_id,
                            es_removible=True,
                        ))
                session.flush()
                print(f"  [+] {p['nombre']}")
            else:
                print(f"  [=] {p['nombre']}")

        session.commit()

    print("\nCredenciales:")
    for u in USUARIOS:
        print(f"  {u['email']} / {u['password']}  {u['roles']}")
    print()


if __name__ == "__main__":
    run()