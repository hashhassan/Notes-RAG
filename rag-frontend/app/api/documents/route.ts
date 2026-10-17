export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return Response.json({ detail: "No file provided" }, { status: 400 });
  }

  const upstream = new FormData();
  upstream.append("file", file, file.name);

  try {
    const res = await fetch("http://127.0.0.1:8000/documents", {
      method: "POST",
      body: upstream,
    });
    const data = await res.json();
    return Response.json(data, { status: res.status });
  } catch {
    return Response.json({ detail: "Python service unreachable" }, { status: 502 });
  }
}