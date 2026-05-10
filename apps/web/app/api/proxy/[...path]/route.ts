import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Shared public backend so a production web deploy works without extra env (override with BACKEND_API_URL). */
const PUBLIC_DEMO_BACKEND = "https://treasuryos-backend-production.up.railway.app";

function resolveUpstreamBase(): string {
  const fromEnv =
    process.env.BACKEND_API_URL?.trim() || process.env.NEXT_PUBLIC_API_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, "");
  }
  if (process.env.NODE_ENV === "production") {
    return PUBLIC_DEMO_BACKEND;
  }
  return "http://127.0.0.1:8000";
}

function stripHopByHopHeaders(headers: Headers): Headers {
  const out = new Headers(headers);
  out.delete("host");
  out.delete("connection");
  out.delete("keep-alive");
  out.delete("transfer-encoding");
  out.delete("upgrade");
  return out;
}

async function forward(request: NextRequest, params: { path: string[] }) {
  const url = new URL(request.url);
  const upstreamBase = resolveUpstreamBase();
  const upstreamPath = params.path.join("/");
  const upstreamUrl = `${upstreamBase}/${upstreamPath}${url.search}`;

  let displayHost: string;
  try {
    displayHost = new URL(upstreamBase).host;
  } catch {
    displayHost = "(invalid BACKEND_API_URL)";
  }

  const headers = stripHopByHopHeaders(request.headers);
  const apiKey = process.env.BACKEND_API_KEY?.trim();
  if (apiKey) {
    headers.set("x-api-key", apiKey);
  }

  try {
    const response = await fetch(upstreamUrl, {
      method: request.method,
      headers,
      body: request.method === "GET" || request.method === "HEAD" ? undefined : await request.text(),
      cache: "no-store",
    });

    const responseBody = await response.arrayBuffer();
    const outHeaders = new Headers(response.headers);
    outHeaders.delete("transfer-encoding");
    return new NextResponse(responseBody, {
      status: response.status,
      headers: outHeaders,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown fetch error";
    return NextResponse.json(
      {
        error: "upstream_unreachable",
        message,
        upstream_host: displayHost,
        hint:
          "Set BACKEND_API_URL on the Next.js service to your FastAPI base URL (no trailing slash), e.g. https://your-api.up.railway.app",
      },
      { status: 502 },
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return forward(request, await context.params);
}

export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return forward(request, await context.params);
}

export async function PUT(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return forward(request, await context.params);
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return forward(request, await context.params);
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return forward(request, await context.params);
}
