"""Marketplace B2B security and state-machine tests. All data below are synthetic."""
import hashlib
import json
from contextlib import asynccontextmanager
from datetime import date, timedelta

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.marketplace import build_marketplace_router, initialize_marketplace, load_keys


KEYS = {
    "supplier_a": "supplier-test-" + "a" * 40,
    "supplier_b": "supplier-test-" + "b" * 40,
    "buyer_a": "buyer-test-" + "c" * 40,
    "buyer_b": "buyer-test-" + "d" * 40,
    "admin": "admin-test-" + "e" * 40,
    "buyer_same": "buyer-same-tenant-" + "f" * 40,
}
PRINCIPALS = {
    "supplier_a": ("supplier-one", "supplier"),
    "supplier_b": ("supplier-two", "supplier"),
    "buyer_a": ("buyer-one", "buyer"),
    "buyer_b": ("buyer-two", "buyer"),
    "admin": ("admin-nurvo", "admin"),
    "buyer_same": ("supplier-one", "buyer"),
}
PRODUCT = {
    "sku": "BRAKE-007",
    "title": "Pastillas alternativas de prueba",
    "condition": "alternativo",
    "oem_reference": "REF-123",
    "brand": "Marca de ensayo",
    "fitment_note": "Compatibilidad por confirmar con especialista",
    "price_clp": 45990,
    "stock_qty": 4,
    "source_url": "https://repuestos.example.cl/pieza/BRAKE-007",
    "warranty_summary": "Garantía por confirmar por vendedor según ley aplicable",
}


def headers(actor):
    return {"X-NURVO-Key": KEYS[actor]}


def make_client(tmp_path, enabled=True):
    data = {
        hashlib.sha256(KEYS[name].encode()).hexdigest(): {
            "tenant_id": tenant, "role": role,
        } for name, (tenant, role) in PRINCIPALS.items()
    }

    @asynccontextmanager
    async def lifespan(_app):
        if enabled:
            await initialize_marketplace(tmp_path / "market.sqlite")
        yield

    app = FastAPI(lifespan=lifespan)
    app.include_router(build_marketplace_router(
        tmp_path / "market.sqlite", enabled, json.dumps(data) if enabled else ""
    ))
    return TestClient(app)


def test_marketplace_disabled_by_default(tmp_path):
    with make_client(tmp_path, enabled=False) as client:
        status = client.get("/api/marketplace/status")
        assert status.status_code == 200
        assert status.json()["enabled"] is False
        assert status.json()["checkout"] == "no_disponible"
        assert client.get("/api/marketplace/products").status_code == 503
        assert client.post("/api/marketplace/products", json=PRODUCT).status_code == 503


def test_invalid_key_config_is_fail_closed():
    for config in ('{"not-a-hash":{"tenant_id":"supplier-one","role":"supplier"}}',
                   '{"' + "a" * 64 + '":{"tenant_id":"NO SPACES!","role":"supplier"}}',
                   '{"' + "a" * 64 + '":{"tenant_id":"supplier-one","role":"root"}}',
                   'not json', '[]'):
        try:
            load_keys(config)
        except ValueError:
            pass
        else:
            raise AssertionError("Keys malformed should fail closed")


def test_catalogue_requires_review_and_scopes_suppliers(tmp_path):
    with make_client(tmp_path) as client:
        assert client.get("/api/marketplace/status").json()["enabled"] is True
        assert client.get("/api/marketplace/metrics", headers=headers("buyer_a")).status_code == 403
        empty_metrics=client.get("/api/marketplace/metrics",headers=headers("admin")).json()
        assert empty_metrics["products_pending"] == 0
        assert empty_metrics["quotes_responded"] == 0
        assert client.get("/api/marketplace/products").json()["results"] == []
        assert client.post("/api/marketplace/products", json=PRODUCT).status_code == 401
        bad = client.post("/api/marketplace/products", json=PRODUCT,
                          headers={"X-NURVO-Key": "bad" * 15})
        assert bad.status_code == 401
        assert client.post("/api/marketplace/products", json=PRODUCT, headers=headers("buyer_a")).status_code == 403

        created = client.post("/api/marketplace/products", json=PRODUCT, headers=headers("supplier_a"))
        assert created.status_code == 201
        product_id = created.json()["id"]
        assert created.json()["review_state"] == "pending"
        assert client.get("/api/marketplace/products").json()["results"] == []
        assert client.get("/api/marketplace/my/products", headers=headers("supplier_b")).json()["results"] == []
        mine = client.get("/api/marketplace/my/products", headers=headers("supplier_a")).json()
        assert mine["results"][0]["id"] == product_id

        fake = client.post(f"/api/marketplace/products/{product_id}/publish",
                           json={"internal_reference": "rev-test-123"}, headers=headers("supplier_a"))
        assert fake.status_code == 403
        reviewed = client.post(f"/api/marketplace/products/{product_id}/publish",
                               json={"internal_reference": "rev-test-123"}, headers=headers("admin"))
        assert reviewed.status_code == 200
        assert "no certifica" in reviewed.json()["warning"]

        visible = client.get("/api/marketplace/products").json()
        assert visible["count"] == 1
        assert visible["results"][0]["sku"] == PRODUCT["sku"]
        assert visible["results"][0]["stock_qty"] == 4
        assert "no_certificados" in visible["results"][0]["origin_status"] or "sin_certificacion" in visible["results"][0]["origin_status"]
        assert visible["results"][0]["fitment_status"] == "pendiente_de_verificacion_tecnica"
        assert client.get("/api/marketplace/products?condition=genuino").json()["results"] == []
        assert client.get("/api/marketplace/products?limit=999").status_code == 422
        assert client.get("/api/marketplace/products?condition=ilegal").status_code == 422

        updated = dict(PRODUCT, price_clp=49000)
        update = client.post("/api/marketplace/products", json=updated, headers=headers("supplier_a"))
        assert update.status_code == 201
        assert update.json()["id"] == product_id
        assert client.get("/api/marketplace/products").json()["results"] == []
        assert client.post(f"/api/marketplace/products/{product_id}/publish",
                           json={"internal_reference":"segunda-revision"}, headers=headers("admin")).status_code == 200
        assert client.get("/api/marketplace/products").json()["results"][0]["price_clp"] == 49000


def test_price_quote_exchange_without_payment_or_tenant_leakage(tmp_path):
    with make_client(tmp_path) as client:
        product = client.post("/api/marketplace/products",json=PRODUCT,headers=headers("supplier_a")).json()
        pid = product["id"]
        assert client.post("/api/marketplace/quotes",
                           json={"product_id":pid,"quantity":2},headers=headers("buyer_a")).status_code == 404
        client.post(f"/api/marketplace/products/{pid}/publish",
                    json={"internal_reference":"contrato-prueba-1"},headers=headers("admin"))

        created = client.post("/api/marketplace/quotes",
                              json={"product_id":pid,"quantity":2},headers=headers("buyer_a"))
        assert created.status_code == 201
        quote_id = created.json()["id"]
        assert created.json()["status"] == "requested"
        assert client.get("/api/marketplace/quotes",headers=headers("buyer_b")).json()["results"] == []
        assert client.get("/api/marketplace/quotes",headers=headers("supplier_b")).json()["results"] == []
        assert len(client.get("/api/marketplace/quotes",headers=headers("buyer_a")).json()["results"]) == 1
        assert len(client.get("/api/marketplace/quotes",headers=headers("supplier_a")).json()["results"]) == 1
        assert client.get("/api/marketplace/quotes",headers=headers("admin")).status_code == 403

        payload = {
            "total_clp": 100000,
            "valid_until": (date.today() + timedelta(days=10)).isoformat(),
            "warranty_summary": "Garantía informada por proveedor, sujeta a ley vigente",
        }
        assert client.post(f"/api/marketplace/quotes/{quote_id}/respond",
                           json=payload,headers=headers("supplier_b")).status_code == 404
        assert client.post(f"/api/marketplace/quotes/{quote_id}/respond",
                           json=payload,headers=headers("buyer_a")).status_code == 403
        accepted = client.post(f"/api/marketplace/quotes/{quote_id}/respond",
                               json=payload,headers=headers("supplier_a"))
        assert accepted.status_code == 200
        assert accepted.json()["status"] == "quoted"
        metrics=client.get("/api/marketplace/metrics",headers=headers("admin")).json()
        assert metrics["quotes_responded"] == 1
        assert metrics["products_published"] == 1
        assert metrics["not_sales_or_paid_orders"] is True
        assert client.post(f"/api/marketplace/quotes/{quote_id}/respond",
                           json=payload,headers=headers("supplier_a")).status_code == 404

        quote = client.get("/api/marketplace/quotes",headers=headers("buyer_a")).json()["results"][0]
        assert quote["quoted_total_clp"] == 100000
        assert quote["status"] == "quoted"
        assert "payment" not in quote
        assert client.post("/api/marketplace/quotes",
                           json={"product_id":pid,"quantity":1},headers=headers("buyer_same")).status_code == 403
        assert client.post("/api/marketplace/quotes",
                           json={"product_id":pid,"quantity":1001},headers=headers("buyer_a")).status_code == 422


def test_no_private_source_urls_or_fake_vendor_data(tmp_path):
    with make_client(tmp_path) as client:
        unsafe_urls = (
            "http://repuestos.example.cl",
            "https://127.0.0.1/admin",
            "https://localhost/",
            "https://user:password@repuestos.example.cl/",
            "https://repuestos.example.cl/?api_key=secret",
            "https://repuestos.example.cl/#token",
        )
        for url in unsafe_urls:
            response = client.post("/api/marketplace/products",
                                   json=dict(PRODUCT,source_url=url),
                                   headers=headers("supplier_a"))
            assert response.status_code == 422, (url,response.text)
        response=client.post("/api/marketplace/products",
                             json=dict(PRODUCT,condition="falsificado"),headers=headers("supplier_a"))
        assert response.status_code == 422
        assert client.get("/api/marketplace/products").json()["results"] == []
