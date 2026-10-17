import pyodbc

SERVER="DESKTOP-F8N84OK\\HASSANSQL"
DRIVER="{ODBC Driver 18 for SQL Server}"

def get_connection(database="NotesRag",autocommit=False):
    conn_str=(
        f"DRIVER={DRIVER};"
        f"SERVER={SERVER};"
        f"DATABASE={database};"
        "Trusted_Connection=yes;"
        "TrustServerCertificate=yes;"
    )
    return pyodbc.connect(conn_str,autocommit=autocommit)
