import psycopg2
import sys

dsn = "postgresql://postgres:password@localhost:5433/fastfood_db"

try:
    # Try connecting with client_encoding explicitly set to cp1252 or utf8
    conn = psycopg2.connect(dsn)
    print("Connection successful")
except Exception as e:
    print(f"Exception type: {type(e)}")
    print(f"Exception args: {e.args}")
