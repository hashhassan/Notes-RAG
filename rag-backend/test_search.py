import sys
from search import search_chunks

question = " ".join(sys.argv[1:])
for r in search_chunks(question, top_k=3):
    print(f"score {r['score']:.3f} | {r['filename']} #{r['chunk_index']}")
    print("   ", r["content"][:400].replace("\n", " "))
    print()