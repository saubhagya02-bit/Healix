import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

//Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.clear();

      window.location.href = "/login";
    }
    return Promise.reject(err);
  },
);

export default api;

// Auth
export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  logout: () => api.post("/auth/logout"),
  me: () => api.get("/auth/me"),
};

// Patients
export const patientAPI = {
  getAll: (params) => api.get("/patients", { params }),
  getMe: () => api.get("/patients/me"),
  getById: (id) => api.get(`/patients/${id}`),
  updateMe: (data) => api.put("/patients/me", data),
  update: (id, data) => api.put(`/patients/${id}`, data),
  delete: (id) => api.delete(`/patients/${id}`),
};

// Doctor
export const doctorAPI = {
  getAll: (params) => api.get("/doctors", { params }),
  getMe: () => api.get("/doctors/me"),
  getById: (id) => api.get(`/doctors/${id}`),
  create: (data) => api.post("/doctors", data),
  updateMe: (data) => api.put("/doctors/me", data),
  update: (id, data) => api.put(`/doctors/${id}`, data),
  delete: (id) => api.delete(`/doctors/${id}`),
};

// Appointments
export const appointmentAPI = {
  getAll: (params) => api.get("/appointments", { params }),
  getById: (id) => api.get(`/appointments/${id}`),
  create: (data) => api.post("/appointments", data),
  update: (id, data) => api.put(`/appointments/${id}`, data),
  cancel: (id) => api.put(`/appointments/${id}`, { status: "cancelled" }),
  delete: (id) => api.delete(`/appointments/${id}`),
};

// Medical Records
export const recordAPI = {
  getAll: (params) => api.get("/records", { params }),
  getById: (id) => api.get(`/records/${id}`),
  create: (data) => api.post("/records", data),
  update: (id, data) => api.put(`/records/${id}`, data),
};

// Departments
export const departmentAPI = {
  getAll: () => api.get("/departments"),
  getById: (id) => api.get(`/departments/${id}`),
  create: (data) => api.post("/departments", data),
  update: (id, data) => api.put(`/departments/${id}`, data),
  delete: (id) => api.delete(`/departments/${id}`),
};

// Users
export const userAPI = {
  getAll: (params) => api.get("/users", { params }),
  getById: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
  toggleActive: (id) => api.patch(`/users/${id}/toggle-active`),
  delete: (id) => api.delete(`/users/${id}`),
};

// Reports
export const reportAPI = {
  adminDashboard: () => api.get("/reports/dashboard/admin"),
  doctorDashboard: () => api.get("/reports/dashboard/doctor"),
  patientDashboard: () => api.get("/reports/dashboard/patient"),
  monthlyAppointments: (year) =>
    api.get("/reports/appointments/monthly", { params: { year } }),
  appointmentsByDept: () => api.get("/reports/appointments/by-department"),
  patientStats: () => api.get("/reports/patients/statistics"),
};
