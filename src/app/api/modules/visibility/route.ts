import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { getHiddenModules } from "@/lib/visibility";

export const dynamic = "force-dynamic";

/** Which modules are hidden from public view; the admin still sees them. */
export async function GET() {
  const hidden = await getHiddenModules().catch(() => []);
  return NextResponse.json({ hidden, admin: await isAdmin() });
}
