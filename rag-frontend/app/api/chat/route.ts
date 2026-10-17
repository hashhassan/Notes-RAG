export async function POST(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ detail: "Invalid JSON" }, { status: 400 });
  }

  let res: Response;
  try {
    res = await fetch("http://127.0.0.1:8000/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: body.question, top_k: body.top_k }),
      signal: AbortSignal.timeout(60000),
    });
  } catch (e) {
    if (e instanceof Error && e.name === "TimeoutError") {
      return Response.json({ detail: "The answer took too long. Try again." }, { status: 504 });
    }
    return Response.json({ detail: "Python service unreachable" }, { status: 502 });
  }

  try {
    const data = await res.json();
    return Response.json(data, { status: res.status });
  } catch {
    return Response.json({ detail: "Python service returned an invalid response" }, { status: 502 });
  }
}