const API_BASE = import.meta.env.VITE_API_URL || "https://face-id-admin.misterdev.uz/api";

async function fetchApi<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${API_BASE}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v) url.searchParams.set(k, v);
    });
  }
  try {
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  } catch {
    return getDemoData(path) as T;
  }
}

async function postApi<T>(path: string, body: any): Promise<T> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `API error: ${res.status}`);
    }
    return res.json();
  } catch (e: any) {
    throw e;
  }
}

async function deleteApi<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
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
  id: number; face_id: number | null; uid: number;
  name: string; gender: string; rf_id_card_num: number | null;
  extra_info: string; image: string | null;
  time: string | null; role: string | null; full_name: string;
}

export interface UserDetail extends User {
  recent_entries: { time: string; face_id: number; direction: string; similarity: number }[];
}

export interface Stranger {
  id: number; device_id: number; direction: string;
  image: string | null; time: string; ip_address: string;
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
  blockUser: (id: number) => postApi<{ status: string; blocked: boolean }>(`/users/${id}/block/`, { action: "block" }),
  unblockUser: (id: number) => postApi<{ status: string; blocked: boolean }>(`/users/${id}/block/`, { action: "unblock" }),

  // Strangers
  getStrangers: (p: { page?: number; per_page?: number; date?: string; device?: string }) =>
    fetchApi<PaginatedResponse<Stranger>>("/strangers/", Object.fromEntries(Object.entries(p).map(([k, v]) => [k, String(v ?? "")]))),
  deleteStranger: (id: number) => deleteApi<{ status: string }>(`/strangers/${id}/`),

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
    fetchApi<PaginatedResponse<User>>("/users/blocked/",
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
    const res = await fetch(`${API_BASE}/users/bulk-block-excel/`, { method: "POST", body: fd });
    if (!res.ok) throw new Error(`${res.status}`);
    return res.json();
  },
};

// ─── Demo Data ─────────────────────────────────────────────────────

function getDemoData(path: string): any {
  if (path.startsWith("/stats"))
    return { today_entries: 247, today_exits: 198, currently_inside: 49, total_users: 1432, total_logs_7d: 8745, strangers_today: 12, yesterday_entries: 231, yesterday_exits: 220 };

  if (path.startsWith("/devices"))
    return { devices: [
      { device_id: "ID_2489002", device_num: 2489002, ip: "192.168.15.36", direction: "OUT", is_online: true, last_seen: new Date().toISOString(), today_count: 87 },
      { device_id: "ID_2489005", device_num: 2489005, ip: "192.168.15.39", direction: "IN", is_online: true, last_seen: new Date().toISOString(), today_count: 124 },
      { device_id: "ID_2489007", device_num: 2489007, ip: "192.168.15.41", direction: "IN", is_online: true, last_seen: new Date().toISOString(), today_count: 95 },
      { device_id: "ID_2489012", device_num: 2489012, ip: "192.168.15.46", direction: "OUT", is_online: false, last_seen: new Date(Date.now() - 3600000).toISOString(), today_count: 43 },
      { device_id: "ID_2489019", device_num: 2489019, ip: "192.168.15.53", direction: "IN", is_online: true, last_seen: new Date().toISOString(), today_count: 156 },
    ]};

  if (path.startsWith("/chart/daily")) {
    const data = []; for (let i = 13; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); data.push({ date: d.toISOString().slice(0, 10), entries: Math.floor(Math.random() * 150 + 180), exits: Math.floor(Math.random() * 140 + 170) }); }
    return { data };
  }

  if (path.startsWith("/chart/hourly")) {
    const data = []; for (let h = 7; h <= 20; h++) { const peak = h >= 8 && h <= 10 ? 3 : h >= 12 && h <= 14 ? 2.5 : 1; data.push({ hour: `${h.toString().padStart(2, "0")}:00`, entries: Math.floor(Math.random() * 20 * peak + 5), exits: Math.floor(Math.random() * 18 * peak + 3) }); }
    return { date: new Date().toISOString().slice(0, 10), data };
  }

  if (path.startsWith("/top-users"))
    return { data: [
      { name: "AB9666486", count: 14, role: "O'qituvchi", full_name: "Ulug'bek Erkinov" },
      { name: "AD3689793", count: 12, role: "O'qituvchi", full_name: "Elchin Kamolov" },
      { name: "AD4018303", count: 11, role: "Talaba", full_name: "Ehson Rahimov" },
      { name: "AB5819512", count: 10, role: "Talaba", full_name: "Muhriddin Aliyev" },
      { name: "AC2505571", count: 9, role: "Xodim", full_name: "Farzona Umarova" },
    ]};

  if (path.startsWith("/users/") && !path.includes("add"))
    return { total: 85, page: 1, per_page: 50, total_pages: 2, data: Array.from({ length: 12 }, (_, i) => {
      const names = ["Ulug'bek Erkinov", "Elchin Kamolov", "Ehson Rahimov", "Muhriddin Aliyev", "Farzona Umarova", "Sirojiddin Nazarov", "Nodir Tursunov", "Mirakbar Yusupov"];
      const blocked = i === 3; return { id: i + 1, face_id: 2489005, uid: 1000 + i, name: names[i % names.length], gender: i % 3 === 2 ? "female" : "male", rf_id_card_num: 1000 + i, extra_info: blocked ? "BLOCKED|Test" : "", image: null, time: new Date(Date.now() - i * 86400000).toISOString(), role: i % 2 === 0 ? "O'qituvchi" : "Talaba", full_name: names[i % names.length] };
    })};

  if (path.startsWith("/strangers"))
    return { total: 34, page: 1, per_page: 30, total_pages: 2, data: Array.from({ length: 10 }, (_, i) => {
      const devices = [2489002, 2489005, 2489007, 2489019]; const t = new Date(); t.setMinutes(t.getMinutes() - i * 15);
      return { id: 100 + i, device_id: devices[i % devices.length], direction: i % 2 === 0 ? "IN" : "OUT", image: null, time: t.toISOString(), ip_address: `192.168.15.${36 + (i % 5)}` };
    })};

  if (path.startsWith("/logs"))
    return { total: 1247, page: 1, per_page: 25, total_pages: 50, data: Array.from({ length: 25 }, (_, i) => {
      const names = ["Ulug'bek E.", "Elchin K.", "Ehson R.", "Muhriddin A.", "Farzona U.", "Sirojiddin N.", "Nodir T."]; const devices = [2489002, 2489005, 2489007, 2489012, 2489019]; const face_id = devices[Math.floor(Math.random() * devices.length)]; const isIn = [2489005, 2489007, 2489019].includes(face_id); const t = new Date(); t.setMinutes(t.getMinutes() - i * 3);
      return { id: 10000 + i, name: names[i % names.length], face_id, direction: isIn ? "IN" : "OUT", similarity: Math.floor(Math.random() * 15 + 85), time: t.toISOString(), image: null };
    })};

  return {};
}
