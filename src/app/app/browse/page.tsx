import { redirect } from "next/navigation";

// One Modules page for everyone: /modules.
export default function BrowseRedirect() {
  redirect("/modules");
}
