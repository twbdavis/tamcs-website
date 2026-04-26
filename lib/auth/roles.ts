import type { UserRole } from "@/lib/types";

// Mirrors public.role_level() in supabase/migrations/0010_onboarding_and_athlete_default.sql.
// Hierarchy: president > admin > officer > coach > athlete > guest.
const LEVEL: Record<UserRole, number> = {
  president: 5,
  admin: 4,
  officer: 3,
  coach: 2,
  athlete: 1,
  member: 1,
  alumni: 1,
  guest: 0,
};

export function roleLevel(role: UserRole | null | undefined): number {
  return role ? LEVEL[role] ?? 0 : 0;
}

export function hasRoleAtLeast(
  role: UserRole | null | undefined,
  min: UserRole,
): boolean {
  return roleLevel(role) >= LEVEL[min];
}

export const isPresident = (role: UserRole | null | undefined) =>
  role === "president";

export const isAdminOrAbove = (role: UserRole | null | undefined) =>
  hasRoleAtLeast(role, "admin");

export const isOfficerOrAbove = (role: UserRole | null | undefined) =>
  hasRoleAtLeast(role, "officer");

// Roles a non-president admin is allowed to assign. The president role is
// reserved for the president (matches the DB role-change guard).
export const ASSIGNABLE_BY_ADMIN: UserRole[] = [
  "admin",
  "officer",
  "member",
  "athlete",
  "coach",
  "alumni",
  "guest",
];

export const ASSIGNABLE_BY_PRESIDENT: UserRole[] = [
  "president",
  ...ASSIGNABLE_BY_ADMIN,
];
