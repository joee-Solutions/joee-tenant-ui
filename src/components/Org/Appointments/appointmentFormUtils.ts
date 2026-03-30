/** Normalize API list responses for patients dropdowns. */
export function extractPatientsFromResponse(data: any): any[] {
  if (data == null) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data?.data)) return data.data.data;
  if (Array.isArray(data?.data?.patients)) return data.data.patients;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.patients)) return data.patients;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

/** Normalize API list responses for employees / providers. */
export function extractEmployeesFromResponse(data: any): any[] {
  if (data == null) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data?.data)) return data.data.data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

function patientRowId(p: any): string {
  if (p == null) return "";
  const id =
    p.id ??
    p.patient_id ??
    p.patientId ??
    p.user_id ??
    p.userId ??
    p.patient_id ??
    p.patientID;
  return id != null && id !== "" ? String(id) : "";
}

function employeeRowId(e: any): string {
  if (e == null) return "";
  const id =
    e.id ??
    e.userId ??
    e.user_id ??
    e.employeeId ??
    e.employee_id ??
    e.providerId ??
    e.provider_id;
  return id != null && id !== "" ? String(id) : "";
}

/** Match appointment.patient to a dropdown id (handles nested shapes and name fallback). */
export function resolveAppointmentPatientId(appointment: any, patients: any[]): string {
  if (!appointment) return "";

  // Top-level id fields (various API conventions)
  if (appointment.patientId != null || appointment.patient_id != null) {
    const raw = appointment.patientId ?? appointment.patient_id;
    const s = String(raw);
    if (appointment.patient == null) {
      const hit = patients.find(
        (x) =>
          patientRowId(x) === s ||
          String(x.user_id ?? x.userId ?? x.user?.id) === s
      );
      return hit ? patientRowId(hit) : s;
    }
  }

  const p = appointment.patient;
  if (!p) return "";
  const direct = patientRowId(p);
  if (direct) return direct;
  const fn = (p.first_name ?? p.firstname ?? p.firstName ?? "").toString().trim().toLowerCase();
  const ln = (p.last_name ?? p.lastname ?? p.lastName ?? "").toString().trim().toLowerCase();
  if (!fn && !ln) return "";
  const found = patients.find((x) => {
    const xfn = (x.first_name ?? x.firstname ?? x.firstName ?? "").toString().trim().toLowerCase();
    const xln = (x.last_name ?? x.lastname ?? x.lastName ?? "").toString().trim().toLowerCase();
    return xfn === fn && xln === ln;
  });
  return found ? patientRowId(found) : "";
}

/** Match provider row id from appointment nested user/doctor (ids may be user id vs employee row id). */
function matchProviderIdFromRaw(raw: any, providers: any[]): string {
  if (raw == null || typeof raw !== "object") return "";
  const candidateIds = [
    raw.id,
    raw.userId,
    raw.userId,
    raw.user_id,
    raw.employeeId,
    raw.employee_id,
  ].filter((v) => v != null && String(v).trim() !== "");
  for (const c of candidateIds) {
    const s = String(c);
    const byEmployeeId = providers.find((x) => employeeRowId(x) === s);
    if (byEmployeeId) return employeeRowId(byEmployeeId);
    const byUserRef = providers.find((x) => {
      const xu = x.userId ?? x.user_id ?? x.user?.id;
      return xu != null && String(xu) === s;
    });
    if (byUserRef) return employeeRowId(byUserRef);
  }
  return "";
}

/** Match appointment user/doctor/provider to a dropdown id. */
export function resolveAppointmentDoctorId(appointment: any, providers: any[]): string {
  if (!appointment) return "";
  const raw =
    appointment.user ??
    appointment.doctor ??
    appointment.provider ??
    appointment.employee;

  // Top-level id fields (various API conventions)
  if (raw == null) {
    const topRaw =
      appointment.userId ??
      appointment.user_id ??
      appointment.doctorId ??
      appointment.doctor_id ??
      appointment.providerId ??
      appointment.provider_id ??
      appointment.employeeId ??
      appointment.employee_id;
    if (topRaw != null) {
      const s = String(topRaw);
      const hit = providers.find(
        (x) =>
          employeeRowId(x) === s ||
          String(x.userId ?? x.user_id ?? x.user?.id) === s
      );
      return hit ? employeeRowId(hit) : s;
    }
  }

  if (typeof raw === "number" || typeof raw === "string") {
    const s = String(raw).trim();
    if (s && /^\d+$/.test(s)) return s;
    return "";
  }
  const direct = employeeRowId(raw);
  if (direct) {
    const byRow = providers.find((x) => employeeRowId(x) === direct);
    if (byRow) return employeeRowId(byRow);
    const byUser = matchProviderIdFromRaw(raw, providers);
    if (byUser) return byUser;
    return direct;
  }
  const fromUserFields = matchProviderIdFromRaw(raw, providers);
  if (fromUserFields) return fromUserFields;
  const u = raw as Record<string, unknown>;
  const first = (u.firstname ?? u.first_name ?? u.firstName ?? "").toString().trim().toLowerCase();
  const last = (u.lastname ?? u.last_name ?? u.lastName ?? "").toString().trim().toLowerCase();
  if (!first && !last) return "";
  const found = providers.find((x) => {
    const xFirst = (x.firstname ?? x.first_name ?? x.firstName ?? "").toString().trim().toLowerCase();
    const xLast = (x.lastname ?? x.last_name ?? x.lastName ?? "").toString().trim().toLowerCase();
    return xFirst === first && xLast === last;
  });
  return found ? employeeRowId(found) : "";
}
