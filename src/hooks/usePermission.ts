import { useAuth } from "./useAuth";

/**
 * Permission tekshiruvi. super_admin har doim true.
 *
 * @example
 *   const canCreate = usePermission("admin_users.create");
 *   {canCreate && <button>Yangi yaratish</button>}
 */
export function usePermission(...required: string[]): boolean {
  const { user } = useAuth();
  if (!user) return false;
  if (user.role === "super_admin") return true;
  const set = new Set(user.permissions ?? []);
  return required.some((p) => set.has(p));
}

export function useHasAnyPermission(perms: string[]): boolean {
  const { user } = useAuth();
  if (!user) return false;
  if (user.role === "super_admin") return true;
  const set = new Set(user.permissions ?? []);
  return perms.some((p) => set.has(p));
}
