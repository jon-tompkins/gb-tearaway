import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

/** Lets the nav show an Admin link to the admin only (pages enforce it themselves). */
export async function GET() {
  return NextResponse.json({ admin: (await isAdmin()) });
}
