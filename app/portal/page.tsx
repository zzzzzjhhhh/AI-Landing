import { redirect } from "next/navigation";
import { portalVideosPath } from "@/lib/portal-access";

export default function PortalIndexPage() {
  redirect(portalVideosPath);
}
