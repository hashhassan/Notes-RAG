import sys
from pathlib import Path
from ingest import ingest_file
from db import get_connection

path = sys.argv[1]
result = ingest_file(path, Path(path).name)
print("ingest result:", result)

conn = get_connection()
cur = conn.cursor()
cur.execute("""
    SELECT d.id, d.filename, COUNT(c.id) AS chunk_count,
           MIN(DATALENGTH(c.embedding)) AS min_bytes,
           MAX(DATALENGTH(c.embedding)) AS max_bytes
    FROM documents d
    JOIN chunks c ON c.document_id = d.id
    GROUP BY d.id, d.filename
""")
for row in cur.fetchall():
    print(tuple(row))
conn.close()