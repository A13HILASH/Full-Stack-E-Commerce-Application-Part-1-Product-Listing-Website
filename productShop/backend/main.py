
import sqlite3
from pathlib import Path
from typing import Literal, Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.staticfiles import StaticFiles

ROOT = Path(__file__).resolve().parent.parent
DB_PATH = ROOT / "db" / "shop.sqlite3"
FRONTEND_DIR = ROOT / "frontend"

app = FastAPI(title="Product Catalogue API", version="1.0.0")

SORTS = {
    "name": "p.name COLLATE NOCASE ASC",
    "price_asc": "p.price_cents ASC, p.id ASC",
    "price_desc": "p.price_cents DESC, p.id ASC",
    "newest": "p.id DESC",
}

BASE_SELECT = """
    SELECT p.*, c.name AS category_name, c.slug AS category_slug
    FROM products p JOIN categories c ON c.id = p.category_id
"""


def get_conn() -> sqlite3.Connection:
    if not DB_PATH.exists():
        raise HTTPException(503, "Database not initialised. Run: python db/init_db.py")
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def serialize(row: sqlite3.Row) -> dict:
    return {
        "id": row["id"],
        "name": row["name"],
        "description": row["description"],
        "price": row["price_cents"] / 100,
        "price_cents": row["price_cents"],
        "image_url": row["image_url"],
        "category": {"id": row["category_id"], "name": row["category_name"], "slug": row["category_slug"]},
        "stock": row["stock"],
        "in_stock": row["stock"] > 0,
    }


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/categories")
def list_categories():
    conn = get_conn()
    try:
        rows = conn.execute(
            """SELECT c.id, c.name, c.slug, COUNT(p.id) AS product_count
               FROM categories c LEFT JOIN products p ON p.category_id = c.id
               GROUP BY c.id ORDER BY c.name"""
        ).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


@app.get("/api/products")
def list_products(
    q: Optional[str] = Query(None, max_length=100, description="Search name/description"),
    category: Optional[str] = Query(None, max_length=50, description="Category slug"),
    min_price: Optional[float] = Query(None, ge=0),
    max_price: Optional[float] = Query(None, ge=0),
    in_stock: Optional[bool] = None,
    sort: Literal["name", "price_asc", "price_desc", "newest"] = "name",
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=50),
):
    if min_price is not None and max_price is not None and min_price > max_price:
        raise HTTPException(400, "min_price cannot be greater than max_price")

    where, params = [], []
    if q and q.strip():
        like = f"%{q.strip().replace('%', '').replace('_', '')}%"
        where.append("(p.name LIKE ? OR p.description LIKE ?)")
        params += [like, like]
    if category:
        where.append("c.slug = ?")
        params.append(category)
    if min_price is not None:
        where.append("p.price_cents >= ?")
        params.append(round(min_price * 100))
    if max_price is not None:
        where.append("p.price_cents <= ?")
        params.append(round(max_price * 100))
    if in_stock:
        where.append("p.stock > 0")
    clause = (" WHERE " + " AND ".join(where)) if where else ""

    conn = get_conn()
    try:
        total = conn.execute(
            f"SELECT COUNT(*) FROM products p JOIN categories c ON c.id = p.category_id{clause}", params
        ).fetchone()[0]
        rows = conn.execute(
            f"{BASE_SELECT}{clause} ORDER BY {SORTS[sort]} LIMIT ? OFFSET ?",
            params + [page_size, (page - 1) * page_size],
        ).fetchall()
        return {
            "items": [serialize(r) for r in rows],
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": max(1, -(-total // page_size)),
        }
    finally:
        conn.close()


@app.get("/api/products/{product_id}")
def get_product(product_id: int):
    conn = get_conn()
    try:
        row = conn.execute(f"{BASE_SELECT} WHERE p.id = ?", (product_id,)).fetchone()
        if row is None:
            raise HTTPException(404, f"Product {product_id} not found")
        return serialize(row)
    finally:
        conn.close()


# Mounted last so the /api/* routes above take priority.
app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
