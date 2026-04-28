if (!import.meta.env.VITE_API_URL) {
  console.warn("VITE_API_URL is not set — API requests may fail");
}
const API_BASE = import.meta.env.VITE_API_URL as string;

function handleUnauthorized(status: number) {
  if (status === 401) {
    localStorage.removeItem("authUser");
    window.dispatchEvent(new Event("auth:expired"));
  }
}

async function fetchApi<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${API_BASE}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v) url.searchParams.set(k, v);
    });
  }
  const res = await fetch(url.toString(), { credentials: "include" });
  if (!res.ok) {
    handleUnauthorized(res.status);
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `API error: ${res.status}`);
  }
  return res.json();
}

async function postApi<T>(path: string, body: any): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    handleUnauthorized(res.status);
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `API error: ${res.status}`);
  }
  return res.json();
}

async function deleteApi<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { method: "DELETE", credentials: "include" });
  if (!res.ok) {
    handleUnauthorized(res.status);
    throw new Error(`API error: ${res.status}`);
  }
  return res.json();
}

// ─── Types ─────────────────────────────────────────────────────────

export interface DashboardStats {
  today_entries: number;
  today_exits: number;
  currently_inside: number;
  total_users: number;
  total_logs_7d: number;
  strangers_today: number;
  yesterday_entries: number;
  yesterday_exits: number;
}

export interface Device {
  device_id: string;
  device_num: number;
  ip: string;
  direction: "IN" | "OUT" | "UNKNOWN";
  is_online: boolean;
  last_seen: string | null;
  today_count: number;
}

export interface ChartPoint { date: string; entries: number; exits: number; }
export interface HourlyPoint { hour: string; entries: number; exits: number; }

export interface LogEntry {
  id: number; name: string; face_id: number;
  direction: "IN" | "OUT" | "UNKNOWN";
  similarity: number; time: string; image: string | null;
  is_blocked: boolean;
}

export interface TopUser {
  name: string; count: number; role: string | null; full_name: string;
}

export interface User {
  id: number | null; face_id: number | null; uid: number | null;
  name: string; gender: string | null; rf_id_card_num?: number | null;
  extra_info?: string; image: string | null;
  time: string | null; role: string | null; full_name: string;
  is_blocked?: boolean;
  // /api/users/blocked/ endpoint qo'shimcha maydonlari
  device_states?: Record<string, "blocked" | "allowed" | "missing" | "unknown">;
  blocked_devices?: number[];
  allowed_devices?: number[];
  missing_devices?: number[];
}

export interface BlockResponse {
  status: string;
  message: string;
  blocked: boolean;
  devices_total: number;
  devices_ok: number;
  scope: "all" | "selected";
  details: Array<{ device: string; ip: string; status: string; action: string }>;
  unknown_devices?: number[];
  name?: string;
  db_user_id?: number | null;
}

export interface UserDetail extends User {
  recent_entries: { time: string; face_id: number; direction: string; similarity: number }[];
}

export interface Stranger {
  id: number; device_id: number; direction: string;
  image: string | null; time: string; ip_address: string;
}

export interface AttendanceDay {
  date: string;
  status: "on_time" | "late" | "absent";
  entry: string | null;
  exit: string | null;
  late_sec: number;
}

export interface AttendanceProfile {
  name: string;
  full_name: string;
  role: string | null;
  image: string | null;
  work_start: string;
  work_end: string;
  stats: {
    today_entry: string | null;
    avg_arrival: string | null;
    late_count: number;
    absent_count: number;
    total_entries: number;
    total_work_days: number;
    attendance_pct: number;
    avg_late_min: number | null;
  };
  timeline: AttendanceDay[];
  arrival_chart: { date: string; minutes: number }[];
  recent_images: { time: string; image: string }[];
}

export interface InsideEntry {
  name: string;
  full_name: string;
  entry_time: string;
  image: string | null;
}

export interface LiveFeedEntry {
  id: number;
  name: string;
  full_name: string;
  direction: "IN" | "OUT" | "UNKNOWN";
  face_id: number;
  time: string | null;
  image: string | null;
}

export interface CardLogEntry {
  id: number;
  name: string;
  full_name: string;
  face_id: number;
  direction: "IN" | "OUT" | "UNKNOWN";
  similarity: number;
  time: string;
  image: string | null;
}

export interface PaginatedResponse<T> {
  total: number; page: number; per_page: number; total_pages: number; data: T[];
}

// ─── API ───────────────────────────────────────────────────────────

export const api = {
  // Dashboard
  getStats: () => fetchApi<DashboardStats>("/stats/"),
  getDevices: () => fetchApi<{ devices: Device[] }>("/devices/"),
  getDailyChart: (days = 30) => fetchApi<{ data: ChartPoint[] }>("/chart/daily/", { days: String(days) }),
  getHourlyChart: (date?: string) => fetchApi<{ date: string; data: HourlyPoint[] }>("/chart/hourly/", date ? { date } : {}),
  getDeviceChart: (days = 7) => fetchApi<{ data: Record<string, any>[] }>("/chart/devices/", { days: String(days) }),
  getLogs: (p: { page?: number; per_page?: number; search?: string; device?: string; date?: string; direction?: string }) =>
    fetchApi<PaginatedResponse<LogEntry>>("/logs/", Object.fromEntries(Object.entries(p).map(([k, v]) => [k, String(v ?? "")]))),
  getTopUsers: (days = 7, limit = 10) => fetchApi<{ data: TopUser[] }>("/top-users/", { days: String(days), limit: String(limit) }),

  // Users CRUD
  getUsers: (p: { page?: number; per_page?: number; search?: string; face_id?: string }) =>
    fetchApi<PaginatedResponse<User>>("/users/", Object.fromEntries(Object.entries(p).map(([k, v]) => [k, String(v ?? "")]))),
  getUser: (id: number) => fetchApi<UserDetail>(`/users/${id}/`),
  addUser: (data: { name: string; gender: number; extra_info?: string; rf_id_card?: number }) =>
    postApi<{ status: string; user_id: number; message: string }>("/users/add/", data),
  deleteUser: (id: number) => deleteApi<{ status: string }>(`/users/${id}/`),
  blockUser: (id: number, opts: { device_id?: number; device_ids?: number[] } = {}) =>
    postApi<BlockResponse>(`/users/${id}/block/`, { action: "block", ...opts }),
  unblockUser: (id: number, opts: { device_id?: number; device_ids?: number[] } = {}) =>
    postApi<BlockResponse>(`/users/${id}/block/`, { action: "unblock", ...opts }),
  blockByName: (name: string, opts: { device_id?: number; device_ids?: number[] } = {}) =>
    postApi<BlockResponse>("/users/block-by-name/", { name, action: "block", ...opts }),
  unblockByName: (name: string, opts: { device_id?: number; device_ids?: number[] } = {}) =>
    postApi<BlockResponse>("/users/block-by-name/", { name, action: "unblock", ...opts }),

  // Strangers
  getStrangers: (p: { page?: number; per_page?: number; date?: string; device?: string }) =>
    fetchApi<PaginatedResponse<Stranger>>("/strangers/", Object.fromEntries(Object.entries(p).map(([k, v]) => [k, String(v ?? "")]))),
  deleteStranger: (id: number) => deleteApi<{ status: string }>(`/strangers/${id}/`),

  // Card logs
  getCardLogs: (p: { page?: number; per_page?: number; search?: string; date?: string; direction?: string }) =>
    fetchApi<PaginatedResponse<CardLogEntry>>("/logs/card/", Object.fromEntries(Object.entries(p).map(([k, v]) => [k, String(v ?? "")]))),

  // Attendance
  getUserAttendance: (name: string, days = 30, workStart = "09:00", workEnd = "18:00") =>
    fetchApi<AttendanceProfile>("/attendance/user/", {
      name, days: String(days), work_start: workStart, work_end: workEnd,
    }),

  // Live
  getLiveFeed: (limit = 12, sinceId = 0) =>
    fetchApi<{ data: LiveFeedEntry[]; latest_id: number }>("/live-feed/", { limit: String(limit), since_id: String(sinceId) }),
  getInsideNow: () =>
    fetchApi<{ count: number; data: InsideEntry[] }>("/inside/"),

  // Full Analytics
  getFullStats: () => fetchApi<any>("/analytics/full/"),
  getMonthlyChart: () => fetchApi<{ data: any[] }>("/analytics/monthly/"),
  getWeeklyChart: (weeks = 12) => fetchApi<{ data: any[] }>("/analytics/weekly/", { weeks: String(weeks) }),
  getHeartbeatStats: (days = 7) => fetchApi<any>("/analytics/heartbeat/", { days: String(days) }),
  getStrangerStats: () => fetchApi<any>("/analytics/strangers/"),
  getDeviceDetail: (deviceNum: number, days = 30) => fetchApi<any>(`/analytics/device/${deviceNum}/`, { days: String(days) }),
  getStorageStats: () => fetchApi<any>("/analytics/storage/"),
  getSettings: () => fetchApi<any>("/settings/"),
  getBlockedUsers: (p: { page?: number; per_page?: number; search?: string } = {}) =>
    fetchApi<PaginatedResponse<User> & {
      all_devices?: number[];
      in_devices?: number[];
      out_devices?: number[];
      device_directions?: Record<string, "IN" | "OUT">;
    }>("/users/blocked/",
      Object.fromEntries(Object.entries(p).map(([k, v]) => [k, String(v ?? "")]))),
  bulkBlock: (names: string[], action: "block" | "unblock") =>
    postApi<any>("/users/bulk-block/", { names, action }),
  checkUserStatus: (name: string) => fetchApi<{
    found: boolean; name: string; full_name?: string; role?: string;
    is_blocked?: boolean; status?: string; devices_count?: number;
    devices?: number[]; last_seen?: string; last_device?: number;
    message?: string;
  }>("/users/check/", { name }),

  bulkBlockExcel: async (file: File, action: "block" | "unblock") => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("action", action);
    const res = await fetch(`${API_BASE}/users/bulk-block-excel/`, {
      method: "POST", body: fd, credentials: "include",
    });
    if (!res.ok) {
      handleUnauthorized(res.status);
      throw new Error(`${res.status}`);
    }
    return res.json();
  },
};

