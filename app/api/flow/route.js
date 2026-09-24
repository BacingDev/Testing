export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ data: null, source: "dummy" });
}

export async function PUT(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Payload JSON tidak valid" }, { status: 400 });
  }
  if (!body || !Array.isArray(body.nodes) || !Array.isArray(body.edges)) {
    return Response.json(
      { error: "Payload harus punya nodes[] dan edges[]" },
      { status: 400 },
    );
  }
  return Response.json({ ok: true, persisted: false, source: "browser" });
}
