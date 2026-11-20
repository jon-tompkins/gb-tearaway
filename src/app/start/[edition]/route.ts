import { NextResponse } from "next/server";
import { freeUpgradeUrl } from "@/lib/free/copy";
import { requestOrigin } from "@/lib/free/flag";
import { loadFreeAdmin } from "@/lib/free/runtime";

export const dynamic = "force-dynamic";

/**
 * Short URL printed under the upgrade QR. Sends the parent to setup with the
 * print campaign params. Stays available when the free-edition flag is off so
 * a page already on the fridge still opens.
 */
export async function GET(req: Request, ctx: { params: Promise<{ edition: string }> }) {
  const { edition } = await ctx.params;
  const known = (await loadFreeAdmin()).editions.find((e) => e.id === edition && !e.archived);
  if (!known) return NextResponse.redirect(new URL("/app/setup", requestOrigin(req)));
  return NextResponse.redirect(freeUpgradeUrl(known.id, requestOrigin(req), "print"));
}
