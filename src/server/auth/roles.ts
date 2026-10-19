export const ADMIN_ROLES = ["editor", "admin"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

const RANK: Record<AdminRole, number> = { editor: 1, admin: 2 };

/** True when `role` grants at least the privileges of `required`. */
export function hasRole(role: AdminRole, required: AdminRole): boolean {
  return RANK[role] >= RANK[required];
}
