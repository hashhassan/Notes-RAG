from db import get_connection

conn=get_connection("master",autocommit=True)
conn.cursor().execute("IF DB_ID('NotesRag') IS NULL CREATE DATABASE NotesRag;")
conn.close()

conn=get_connection("NotesRag")
cursor=conn.cursor()

cursor.execute("""
IF OBJECT_ID('dbo.documents', 'U') IS NULL
CREATE TABLE dbo.documents (
    id INT IDENTITY(1,1) PRIMARY KEY,
    filename NVARCHAR(260) NOT NULL,
    uploaded_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
)
""")

cursor.execute("""
IF OBJECT_ID('dbo.chunks', 'U') IS NULL
CREATE TABLE dbo.chunks (
    id INT IDENTITY(1,1) PRIMARY KEY,
    document_id INT NOT NULL,
    chunk_index INT NOT NULL,
    content NVARCHAR(MAX) NOT NULL,
    embedding VARBINARY(MAX) NULL,
    CONSTRAINT fk_chunks_document FOREIGN KEY (document_id)
        REFERENCES dbo.documents(id) ON DELETE CASCADE
)
""")

cursor.execute("""
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_chunks_document_id')
CREATE INDEX ix_chunks_document_id ON dbo.chunks(document_id)
""")

conn.commit()
conn.close()
print("Database and tables created successfully.")