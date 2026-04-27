export type UserRole =
  | "president"
  | "admin"
  | "officer"
  | "member"
  | "athlete"
  | "coach"
  | "alumni"
  | "guest";

export type ClassYear =
  | "Freshman"
  | "Sophomore"
  | "Junior"
  | "Senior"
  | "5th Year"
  | "Graduate";

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  year: string | null;
  bio: string | null;
  avatar_url: string | null;
  first_name: string | null;
  last_name: string | null;
  birthday: string | null; // YYYY-MM-DD
  class_year: ClassYear | null;
  uin: string | null;
  phone_number: string | null;
  instagram_handle: string | null;
  snapchat_handle: string | null;
  linkedin_handle: string | null;
  show_phone: boolean;
  show_instagram: boolean;
  show_snapchat: boolean;
  show_linkedin: boolean;
  constitution_agreed: boolean;
  onboarding_completed: boolean;
  account_approved: boolean;
  created_at: string;
  updated_at: string;
};
