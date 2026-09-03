const API_BASE = '/api';

export function getStoredToken(): string | null {
  return localStorage.getItem('dbsm_auth_token');
}

export function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem('dbsm_auth_token', token);
  } else {
    localStorage.removeItem('dbsm_auth_token');
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  // Auth
  requestOtp: (email: string, role: 'ADMIN' | 'STUDENT') =>
    request<{ success: boolean; message: string; cooldownSeconds: number; expiresAt: string }>(
      '/auth/request-otp',
      {
        method: 'POST',
        body: JSON.stringify({ email, role }),
      }
    ),

  verifyOtp: (email: string, otp: string, role: 'ADMIN' | 'STUDENT') =>
    request<{ success: boolean; token: string; user: any }>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp, role }),
    }),

  getCurrentUser: () => request<any>('/auth/me'),

  logout: () =>
    request<{ success: boolean }>('/auth/logout', {
      method: 'POST',
    }),

  // Student (Protected & strictly scoped to authenticated student)
  getStudentMe: () => request<{ success: boolean; student: any }>('/student/me'),
  getStudentDormitory: () => request<{ success: boolean; allocation: any }>('/student/dormitory'),
  getStudentRefectory: () => request<{ success: boolean; allocation: any }>('/student/refectory'),
  getStudentDuties: () =>
    request<{ success: boolean; assignments: any[]; grouped: any }>('/student/duties'),
  getStudentNotices: () => request<{ success: boolean; notices: any[] }>('/student/notices'),
  getStudentLeaves: () => request<{ success: boolean; leaves: any[] }>('/student/leaves'),
  submitLeaveRequest: (data: { subject: string; startDate: string; endDate: string; reason: string }) =>
    request<{ success: boolean; message: string; leave: any }>('/student/leaves', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Admin
  getDashboard: () =>
    request<{ success: boolean; stats: any; languages: any[]; recentLogs: any[] }>(
      '/admin/dashboard'
    ),

  getStudents: (params?: { search?: string; gender?: string; residency?: string; languageId?: string }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.gender) query.set('gender', params.gender);
    if (params?.residency) query.set('residency', params.residency);
    if (params?.languageId) query.set('languageId', params.languageId);
    return request<{ success: boolean; students: any[] }>(`/admin/students?${query.toString()}`);
  },

  createStudent: (studentData: any) =>
    request<{ success: boolean; student: any }>('/admin/students', {
      method: 'POST',
      body: JSON.stringify(studentData),
    }),

  updateStudent: (id: string, studentData: any) =>
    request<{ success: boolean; student: any }>(`/admin/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(studentData),
    }),

  deleteStudent: (id: string) =>
    request<{ success: boolean; message: string }>(`/admin/students/${id}`, {
      method: 'DELETE',
    }),

  importStudents: (students: any[]) =>
    request<{ success: boolean; importedCount: number; skippedCount: number; message: string }>(
      '/admin/students/import',
      {
        method: 'POST',
        body: JSON.stringify({ students }),
      }
    ),

  getLanguages: () => request<{ success: boolean; languages: any[] }>('/admin/languages'),

  createLanguage: (name: string) =>
    request<{ success: boolean; language: any }>('/admin/languages', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),

  deleteLanguage: (id: string) =>
    request<{ success: boolean; message: string }>(`/admin/languages/${id}`, {
      method: 'DELETE',
    }),

  getDormitory: () => request<{ success: boolean; rooms: any[] }>('/admin/dormitory'),

  createDormRoom: (data: { name: string; capacity: number; gender: string }) =>
    request<{ success: boolean; room: any }>('/admin/dormitory/rooms', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateDormRoom: (id: string, data: any) =>
    request<{ success: boolean; room: any }>(`/admin/dormitory/rooms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteDormRoom: (id: string) =>
    request<{ success: boolean; message: string }>(`/admin/dormitory/rooms/${id}`, {
      method: 'DELETE',
    }),

  generateDormitory: (term?: string) =>
    request<{ success: boolean; message: string }>('/admin/dormitory/generate', {
      method: 'POST',
      body: JSON.stringify({ term }),
    }),

  overrideDormitory: (studentId: string, targetRoomId: string, term?: string) =>
    request<{ success: boolean; allocation: any }>('/admin/dormitory/override', {
      method: 'PUT',
      body: JSON.stringify({ studentId, targetRoomId, term }),
    }),

  getRefectory: () => request<{ success: boolean; tables: any[] }>('/admin/refectory'),

  createRefectoryTable: (data: { name: string; capacity: number; genderRule: string }) =>
    request<{ success: boolean; table: any }>('/admin/refectory/tables', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateRefectoryTable: (id: string, data: any) =>
    request<{ success: boolean; table: any }>(`/admin/refectory/tables/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteRefectoryTable: (id: string) =>
    request<{ success: boolean; message: string }>(`/admin/refectory/tables/${id}`, {
      method: 'DELETE',
    }),

  generateRefectory: (term?: string) =>
    request<{ success: boolean; message: string }>('/admin/refectory/generate', {
      method: 'POST',
      body: JSON.stringify({ term }),
    }),

  getDuties: (date?: string, dutyType?: string) => {
    const query = new URLSearchParams();
    if (date) query.set('date', date);
    if (dutyType) query.set('dutyType', dutyType);
    return request<{ success: boolean; assignments: any[] }>(`/admin/duties?${query.toString()}`);
  },

  generateDuties: (date?: string) =>
    request<{ success: boolean; count: number; message: string }>('/admin/duties/generate', {
      method: 'POST',
      body: JSON.stringify({ date }),
    }),

  generateAllSchedules: (params?: { term?: string; date?: string }) =>
    request<{ success: boolean; message: string; summary: any }>('/admin/schedules/generate-all', {
      method: 'POST',
      body: JSON.stringify(params || {}),
    }),

  getSpecialResponsibilities: () =>
    request<{ success: boolean; list: any[] }>('/admin/special-responsibilities'),

  createSpecialResponsibility: (data: { title: string; requiredCount: number; genderRule: string }) =>
    request<{ success: boolean; responsibility: any }>('/admin/special-responsibilities', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteSpecialResponsibility: (id: string) =>
    request<{ success: boolean; message: string }>(`/admin/special-responsibilities/${id}`, {
      method: 'DELETE',
    }),

  getNotices: () => request<{ success: boolean; notices: any[] }>('/admin/notices'),

  createNotice: (data: { title: string; content: string; targetAudience?: string; priority?: string }) =>
    request<{ success: boolean; notice: any }>('/admin/notices', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteNotice: (id: string) =>
    request<{ success: boolean }>(`/admin/notices/${id}`, {
      method: 'DELETE',
    }),

  getActivityLogs: () => request<{ success: boolean; logs: any[] }>('/admin/activity-logs'),

  getBackup: () => request<{ success: boolean; backup: any }>('/admin/backup'),

  // Leave Management (Admin)
  getAdminLeaves: (status?: string) =>
    request<{ success: boolean; leaves: any[]; counts: { all: number; pending: number; approved: number; rejected: number } }>(
      `/admin/leaves${status && status !== 'ALL' ? `?status=${status}` : ''}`
    ),

  updateLeaveStatus: (id: string, status: 'APPROVED' | 'REJECTED' | 'PENDING', adminRemarks?: string) =>
    request<{ success: boolean; message: string; leave: any }>(`/admin/leaves/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, adminRemarks }),
    }),
};
