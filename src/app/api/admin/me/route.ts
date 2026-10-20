import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdminEmail } from "@/lib/admin";

export const dynamic = "force-dynamic";

/** Lets the nav show an Admin link to the admin only (pages enforce it themselves). */
export async function GET() {
  const session = await auth().catch(() => null);
  return NextResponse.json({ admin: isAdminEmail(session?.user?.email) });
}
