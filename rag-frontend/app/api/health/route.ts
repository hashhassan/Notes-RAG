export async function GET() {
    const res = await fetch("http://127.0.0.1:8000/health", { cache: "no-store" });
    const data = await res.json();
    return Response.json({FromPython: data});
}