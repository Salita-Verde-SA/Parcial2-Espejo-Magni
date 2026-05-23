import psycopg2
import sys

passwords = ["postgres", "root", "password", "1234", "123456", "admin", "fastfood"]

for pwd in passwords:
    dsn = f"postgresql://postgres:{pwd}@localhost:5433/fastfood_db"
    try:
        conn = psycopg2.connect(dsn)
        print(f"Success with password: {pwd}")
        conn.close()
        sys.exit(0)
    except Exception as e:
        if b"password" in str(e.args).encode("utf-8", "ignore") or "autentificaci" in str(e.args):
            pass
        elif "database" in str(e.args) or "base de datos" in str(e.args):
            print(f"Password '{pwd}' might be correct, but DB fastfood_db doesn't exist.")
            # test postgres db
            try:
                conn = psycopg2.connect(f"postgresql://postgres:{pwd}@localhost:5433/postgres")
                print(f"Success with password: {pwd} on 'postgres' DB")
                conn.close()
                sys.exit(0)
            except Exception as e2:
                print(e2)
        else:
            print(f"Other error with {pwd}: {e.args}")

print("No password worked")
