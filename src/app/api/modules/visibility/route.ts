import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdminEmail } from "@/lib/admin";
import { getHiddenModules } from "@/lib/visibility";

export const dynamic = "force-dynamic";

/** Which modules are hidden from public view; the admin still sees them. */
export async function GET() {
  const session = await auth().catch(() => null);
  const hidden = await getHiddenModules().catch(() => []);
  return NextResponse.json({ hidden, admin: isAdminEmail(session?.user?.email) });
}
