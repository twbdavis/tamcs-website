export type Officer = {
  id: string;
  name: string;
  role: string;
  email: string | null;
  year: string | null;
  photo_url: string | null;
  bio: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type RecordCategory = "men" | "women" | "mixed";

export type TeamRecord = {
  id: string;
  swimmer_name: string;
  event: string;
  time: string;
  year: string | null;
  category: RecordCategory;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type ScheduleType = "practice" | "meet" | "social" | "other";

export type ScheduleEvent = {
  id: string;
  date: string;
  title: string;
  location: string | null;
  type: ScheduleType;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type MeetResult = {
  id: string;
  meet_name: string;
  date: string;
  location: string | null;
  results: unknown;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  content: string;
  author: string | null;
  published_at: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};
