import "server-only";
import { revalidatePath } from "next/cache";

/**
 * Public pages are statically generated with ISR. Content is small and
 * interlinked (header, footer and homepage read most tables), so any admin
 * change revalidates the whole public site. Visitors see edits on the next
 * request instead of waiting for the 5-minute background revalidation.
 */
export function revalidatePublicSite(): void {
  revalidatePath("/", "layout");
}
