import { NextResponse } from "next/server";
import { appendToDoc } from "@/lib/docs";

type DocAppendPayload = {
  slug?: string;
  content?: string;
  title?: string;
};

export async function POST(req: Request) {
  const body = (await req.json()) as DocAppendPayload;
  if (!body.slug || !body.content) {
    return NextResponse.json({ ok: false, error: "Missing slug or content" }, { status: 400 });
  }
  const result = appendToDoc(body.slug, body.content, body.title);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
