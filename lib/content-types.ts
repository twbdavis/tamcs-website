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

export type CoachingScheduleType =
  | "practice"
  | "dryland"
  | "meeting"
  | "social";

// Sunday = 0 … Saturday = 6 (matches JS Date#getDay()).
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type FormFieldType =
  | "text"
  | "textarea"
  | "select"
  | "radio"
  | "checkbox"
  | "number"
  | "email"
  | "multiple_choice";

export type Form = {
  id: string;
  title: string;
  description: string | null;
  created_by: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type FormField = {
  id: string;
  form_id: string;
  field_type: FormFieldType;
  label: string;
  placeholder: string | null;
  options: string[];
  is_required: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type FormResponse = {
  id: string;
  form_id: string;
  respondent_id: string;
  submitted_at: string;
};

export type FormResponseValue = {
  id: string;
  response_id: string;
  field_id: string;
  value: string | null;
};

export type AvailabilityDay =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type AvailabilityBlock = {
  id: string;
  user_id: string;
  day_of_week: AvailabilityDay;
  start_time: string;
  end_time: string;
  created_at: string;
  updated_at: string;
};

export type CoachingScheduleEntry = {
  id: string;
  title: string;
  day_of_week: DayOfWeek | null;
  start_time: string; // "HH:MM:SS"
  end_time: string;
  location: string | null;
  type: CoachingScheduleType;
  notes: string | null;
  recurring: boolean;
  specific_date: string | null; // "YYYY-MM-DD"
  effective_from: string | null;
  effective_to: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type Coach = {
  id: string;
  name: string;
  profile_id: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type CoachAssignment = {
  schedule_id: string;
  coach_id: string;
  created_at: string;
};

export type MeetResultEntry = {
  event: string;
  swimmer: string;
  time: string;
};

export type MeetAttachment = {
  name: string;
  url: string;
};

export type Meet = {
  id: string;
  title: string;
  meet_date: string; // YYYY-MM-DD
  location: string;
  description: string | null;
  signup_url: string | null;
  signup_form_id: string | null;
  signup_deadline: string | null; // ISO timestamp
  travel_info: string | null;
  warmup_time: string | null;
  event_start_time: string | null;
  attachments_urls: MeetAttachment[];
  is_published: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type MeetResult = {
  id: string;
  meet_name: string;
  date: string;
  location: string | null;
  overall_place: number | null;
  results: unknown;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type WorkoutSetStatus = "pending" | "approved" | "denied";

export type WorkoutSectionType =
  | "warmup"
  | "preset"
  | "kick"
  | "pull"
  | "main"
  | "sprint";

export type WorkoutSection = {
  id: string;
  set_id: string;
  section_type: WorkoutSectionType;
  display_order: number;
  content: string;
  total_yardage: number | null;
  created_at: string;
  updated_at: string;
};

export type WorkoutSet = {
  id: string;
  title: string;
  created_by: string;
  status: WorkoutSetStatus;
  reviewer_id: string | null;
  review_comment: string | null;
  created_at: string;
  updated_at: string;
};

export type WorkoutSetWithSections = WorkoutSet & {
  sections: WorkoutSection[];
};

export type Social = {
  id: string;
  title: string;
  description: string | null;
  event_date: string; // YYYY-MM-DD
  event_time: string | null;
  location: string | null;
  created_by: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type AttendanceSemester = "Fall" | "Spring" | "Summer";

export type AttendanceSession = {
  id: string;
  session_date: string; // YYYY-MM-DD
  title: string;
  semester: AttendanceSemester;
  academic_year: string; // e.g. "2025-2026"
  created_by: string | null;
  created_at: string;
};

export type AttendanceRecord = {
  id: string;
  session_id: string;
  athlete_name: string;
  uin_last4: string | null;
  is_restricted: boolean;
  created_at: string;
};

// Minimum practices required per the team's policy (Join Us page).
export const ATTENDANCE_MIN_PER_SEMESTER = 6;

export type EmailListCategory =
  | "athlete"
  | "officer"
  | "coach"
  | "other";

export type EmailListDuesType = "full_year" | "semester";

export type EmailListEntry = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  category: EmailListCategory;
  is_active: boolean;
  dues_type: EmailListDuesType | null;
  dues_paid: boolean;
  added_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export const EMAIL_LIST_CATEGORIES: EmailListCategory[] = [
  "athlete",
  "officer",
  "coach",
  "other",
];

export type WeeklyAnnouncement = {
  id: string;
  subject: string;
  body: string;
  body_html: string | null;
  sender: string | null;
  received_at: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export const WORKOUT_SECTION_LABELS: Record<WorkoutSectionType, string> = {
  warmup: "Warm-up/Cooldown",
  preset: "Pre-set",
  kick: "Kick Set",
  pull: "Pull Set",
  main: "Main Set",
  sprint: "Sprint Set",
};

// Tailwind color classes for the colored header on each section type.
export const WORKOUT_SECTION_COLORS: Record<
  WorkoutSectionType,
  { bg: string; text: string }
> = {
  warmup: { bg: "bg-sky-600", text: "text-white" },
  preset: { bg: "bg-amber-600", text: "text-white" },
  kick: { bg: "bg-emerald-600", text: "text-white" },
  pull: { bg: "bg-violet-600", text: "text-white" },
  main: { bg: "bg-[#500000]", text: "text-white" },
  sprint: { bg: "bg-rose-600", text: "text-white" },
};

