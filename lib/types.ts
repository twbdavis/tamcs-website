export type UserRole =
  | "athlete"
  | "coach"
  | "officer"
  | "admin"
  | "alumni"
  | "guest";

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  year: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};
