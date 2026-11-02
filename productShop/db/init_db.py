"""
seed:  python db/init_db.py [--reset]
"""
import argparse
import sqlite3
from pathlib import Path

HERE = Path(__file__).resolve().parent
DB_PATH = HERE / "shop.sqlite3"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--reset", action="store_true", help="delete the existing database first")
    args = parser.parse_args()

    if args.reset and DB_PATH.exists():
        DB_PATH.unlink()

    conn = sqlite3.connect(DB_PATH)
    conn.executescript((HERE / "schema.sql").read_text())
    if conn.execute("SELECT COUNT(*) FROM products").fetchone()[0] == 0:
        conn.executescript((HERE / "seed.sql").read_text())
        print("Seeded sample data.")
    else:
        print("Database already has products; skipping seed (use --reset to start over).")
    conn.commit()
    n = conn.execute("SELECT COUNT(*) FROM products").fetchone()[0]
    print(f"Database ready at {DB_PATH} ({n} products).")
    conn.close()


if __name__ == "__main__":
    main()
