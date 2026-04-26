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

