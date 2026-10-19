import "server-only";
import { redirect } from "next/navigation";
import { ADMIN_HOME_PATH, ADMIN_LOGIN_PATH } from "@/lib/admin-routes";
import { hasRole, type AdminRole } from "./roles";
import { getCurrentAdmin, type AdminIdentity } from "./session";

export class AuthorizationError extends Error {
  constructor(
    message: string,
    readonly status: 401 | 403,
  ) {
    super(message);
    this.name = "AuthorizationError";
  }
}

/**
 * For admin pages (Server Components). Every admin page calls this itself:
 * layouts are not a security boundary because they are not re-rendered on
 * every navigation.
 */
export async function requireAdminPage(required: AdminRole = "editor"): Promise<AdminIdentity> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect(ADMIN_LOGIN_PATH);
  if (!hasRole(admin.role, required)) redirect(`${ADMIN_HOME_PATH}?denied=1`);
  return admin;
}

/** For Server Actions and Route Handlers. Throws instead of redirecting. */
export async function requireAdminAction(required: AdminRole = "editor"): Promise<AdminIdentity> {
  const admin = await getCurrentAdmin();
  if (!admin) throw new AuthorizationError("Your session has expired. Please sign in again.", 401);
  if (!hasRole(admin.role, required)) {
    throw new AuthorizationError("You do not have permission to perform this action.", 403);
  }
  return admin;
}
