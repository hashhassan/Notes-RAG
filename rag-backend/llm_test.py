from llm import generate_answer

chunks = [
    {"filename": "demo.txt", "content": "The project deadline is March 14. The team meets every Tuesday at 10am."},
    {"filename": "demo.txt", "content": "The budget for the project is 5000 dollars."},
]

print(generate_answer("When is the deadline?", chunks))
print("---")
print(generate_answer("Who is the CEO?", chunks))