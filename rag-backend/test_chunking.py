import sys
from extract import extract_text
from chunker import chunk_text

text = extract_text(sys.argv[1])
chunks = chunk_text(text)

print("characters:", len(text))
print("chunks:", len(chunks))
print("--- chunk 0 ---")
print(chunks[0])
if len(chunks) > 1:
    print("--- chunk 1 (should begin with the last words of chunk 0) ---")
    print(chunks[1][:300])