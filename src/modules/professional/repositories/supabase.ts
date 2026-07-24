import { supabase } from "@/integrations/supabase/client";
import type {
  Appointment,
  ChildSummary,
  DashboardSnapshot,
  EvolutionEntry,
  Professional,
  Session,
  TherapeuticGoal,
} from "../types";
import type { ProfessionalRepositories } from "./index";

async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

function startOfToday(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}
function endOfToday(): string {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

function mapPatient(row: {
  child_id: string;
  full_name: string;
  birth_date: string | null;
  nickname: string | null;
  declared_conditions: string[] | null;
  dominant_interest: string | null;
  permission: string;
}): ChildSummary {
  const scopes = row.permission === "admin"
    ? (["view", "session_write", "report_write", "message"] as const)
    : row.permission === "write"
      ? (["view", "session_write", "report_write"] as const)
      : (["view"] as const);
  return {
    id: row.child_id,
    fullName: row.full_name,
    birthDate: row.birth_date ?? new Date().toISOString(),
    diagnosis: row.declared_conditions?.[0] ?? undefined,
    interests: row.dominant_interest ? [row.dominant_interest] : [],
    scopes: [...scopes],
  };
}

function mapAppointment(a: {
  id: string;
  child_id: string;
  professional_id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  modality: string;
  location: string | null;
}): Appointment {
  return {
    id: a.id,
    childId: a.child_id,
    professionalId: a.professional_id,
    start: a.starts_at,
    end: a.ends_at,
    status: a.status as Appointment["status"],
    modality: a.modality as Appointment["modality"],
    location: a.location ?? undefined,
  };
}

function mapSession(s: {
  id: string;
  appointment_id: string | null;
  child_id: string;
  professional_id: string;
  session_date: string;
  duration_minutes: number;
  goals_worked: string[] | null;
  activities: string | null;
  materials: string | null;
  child_response: string | null;
  observations: string | null;
  next_steps: string | null;
}): Session {
  return {
    id: s.id,
    appointmentId: s.appointment_id ?? undefined,
    childId: s.child_id,
    professionalId: s.professional_id,
    date: s.session_date,
    durationMinutes: s.duration_minutes,
    goalsWorked: s.goals_worked ?? [],
    activities: s.activities ?? "",
    materials: s.materials ?? undefined,
    childResponse: s.child_response ?? undefined,
    observations: s.observations ?? undefined,
    nextSteps: s.next_steps ?? undefined,
    attachmentIds: [],
  };
}

function mapEvolution(e: {
  id: string;
  child_id: string;
  professional_id: string;
  created_at: string;
  content: string;
  shared_with_family: boolean;
  shared_with_school: boolean;
}): EvolutionEntry {
  return {
    id: e.id,
    childId: e.child_id,
    professionalId: e.professional_id,
    createdAt: e.created_at,
    text: e.content,
    attachmentIds: [],
    scaleApplicationIds: [],
    sharedWith: {
      family: e.shared_with_family,
      school: e.shared_with_school,
    },
  };
}

export const supabaseRepositories: ProfessionalRepositories = {
  me: {
    async getMe(): Promise<Professional | null> {
      const uid = await currentUserId();
      if (!uid) return null;
      const { data: prof } = await supabase
        .from("professional_profiles")
        .select("id, user_id, full_name, council_id, specialties, bio, photo_url")
        .eq("user_id", uid)
        .maybeSingle();
      if (prof) {
        return {
          id: prof.id,
          userId: prof.user_id,
          fullName: prof.full_name,
          councilId: prof.council_id ?? undefined,
          specialties: prof.specialties ?? [],
          bio: prof.bio ?? undefined,
          photoUrl: prof.photo_url ?? undefined,
        };
      }
      const { data: p } = await supabase
        .from("profiles")
        .select("full_name, email, avatar_url")
        .eq("id", uid)
        .maybeSingle();
      return {
        id: uid,
        userId: uid,
        fullName: p?.full_name ?? p?.email ?? "Profissional",
        specialties: [],
        photoUrl: p?.avatar_url ?? undefined,
      };
    },
  },
  patients: {
    async list(): Promise<ChildSummary[]> {
      const { data, error } = await supabase.rpc("list_my_patients");
      if (error) throw error;
      return (data ?? []).map(mapPatient);
    },
    async get(id: string): Promise<ChildSummary | null> {
      const { data, error } = await supabase.rpc("list_my_patients");
      if (error) throw error;
      const row = (data ?? []).find((r) => r.child_id === id);
      return row ? mapPatient(row) : null;
    },
  },
  agenda: {
    async listForRange(fromISO: string, toISO: string): Promise<Appointment[]> {
      const uid = await currentUserId();
      if (!uid) return [];
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("professional_id", uid)
        .gte("starts_at", fromISO)
        .lte("starts_at", toISO)
        .order("starts_at");
      if (error) throw error;
      return (data ?? []).map(mapAppointment);
    },
    async today(): Promise<Appointment[]> {
      const uid = await currentUserId();
      if (!uid) return [];
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("professional_id", uid)
        .gte("starts_at", startOfToday())
        .lte("starts_at", endOfToday())
        .order("starts_at");
      if (error) throw error;
      return (data ?? []).map(mapAppointment);
    },
  },
  sessions: {
    async listByChild(childId: string): Promise<Session[]> {
      const { data, error } = await supabase
        .from("clinical_sessions")
        .select("*")
        .eq("child_id", childId)
        .order("session_date", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(mapSession);
    },
    async get(id: string): Promise<Session | null> {
      const { data, error } = await supabase
        .from("clinical_sessions")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data ? mapSession(data) : null;
    },
  },
  evolution: {
    async listByChild(childId: string): Promise<EvolutionEntry[]> {
      const { data, error } = await supabase
        .from("evolution_entries")
        .select("*")
        .eq("child_id", childId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(mapEvolution);
    },
    async feed(): Promise<EvolutionEntry[]> {
      const uid = await currentUserId();
      if (!uid) return [];
      const { data, error } = await supabase
        .from("evolution_entries")
        .select("*")
        .eq("professional_id", uid)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []).map(mapEvolution);
    },
  },
  goals: {
    async listByChild(childId: string): Promise<TherapeuticGoal[]> {
      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .eq("child_id", childId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((g) => ({
        id: g.id,
        childId: g.child_id,
        description: g.title,
        category: g.category ?? "",
        startDate: g.created_at,
        deadline: g.due_date ?? undefined,
        ownerProfessionalId: g.created_by ?? "",
        participantIds: [],
        status: (g.status ?? "active") as TherapeuticGoal["status"],
        progressPercent: 0,
      }));
    },
    async all(): Promise<TherapeuticGoal[]> {
      const uid = await currentUserId();
      if (!uid) return [];
      const patients = await supabaseRepositories.patients.list();
      if (patients.length === 0) return [];
      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .in("child_id", patients.map((p) => p.id))
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((g) => ({
        id: g.id,
        childId: g.child_id,
        description: g.title,
        category: g.category ?? "",
        startDate: g.created_at,
        deadline: g.due_date ?? undefined,
        ownerProfessionalId: g.created_by ?? "",
        participantIds: [],
        status: (g.status ?? "active") as TherapeuticGoal["status"],
        progressPercent: 0,
      }));
    },
  },
  scales: { catalog: async () => [] },
  reports: { list: async () => [] },
  messages: { threads: async () => [] },
  dashboard: {
    async snapshot(): Promise<DashboardSnapshot> {
      const [todayAppointments, patients] = await Promise.all([
        supabaseRepositories.agenda.today(),
        supabaseRepositories.patients.list(),
      ]);
      return {
        todayAppointments,
        activePatients: patients.length,
        pendingReports: 0,
        unreadMessages: 0,
        newDocuments: 0,
        aiAlerts: 0,
      };
    },
  },
};

/** Escritas usadas pelas telas (fora do contrato de leitura). */
export const proWrites = {
  async createAppointment(input: {
    childId: string;
    startsAt: string;
    endsAt: string;
    modality: Appointment["modality"];
    location?: string;
    notes?: string;
  }) {
    const uid = await currentUserId();
    if (!uid) throw new Error("not authenticated");
    const { data, error } = await supabase
      .from("appointments")
      .insert({
        child_id: input.childId,
        professional_id: uid,
        starts_at: input.startsAt,
        ends_at: input.endsAt,
        modality: input.modality,
        location: input.location,
        notes: input.notes,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async updateAppointmentStatus(id: string, status: Appointment["status"]) {
    const { error } = await supabase
      .from("appointments")
      .update({ status })
      .eq("id", id);
    if (error) throw error;
  },
  async createSession(input: {
    childId: string;
    sessionDate: string;
    durationMinutes: number;
    activities?: string;
    materials?: string;
    childResponse?: string;
    observations?: string;
    nextSteps?: string;
    goalsWorked?: string[];
    sharedWithFamily?: boolean;
  }) {
    const uid = await currentUserId();
    if (!uid) throw new Error("not authenticated");
    const { data, error } = await supabase
      .from("clinical_sessions")
      .insert({
        child_id: input.childId,
        professional_id: uid,
        session_date: input.sessionDate,
        duration_minutes: input.durationMinutes,
        activities: input.activities,
        materials: input.materials,
        child_response: input.childResponse,
        observations: input.observations,
        next_steps: input.nextSteps,
        goals_worked: input.goalsWorked ?? [],
        shared_with_family: input.sharedWithFamily ?? false,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async createEvolution(input: {
    childId: string;
    content: string;
    category?: string;
    sharedWithFamily?: boolean;
    sharedWithSchool?: boolean;
  }) {
    const uid = await currentUserId();
    if (!uid) throw new Error("not authenticated");
    const { data, error } = await supabase
      .from("evolution_entries")
      .insert({
        child_id: input.childId,
        professional_id: uid,
        content: input.content,
        category: input.category,
        shared_with_family: input.sharedWithFamily ?? true,
        shared_with_school: input.sharedWithSchool ?? false,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async upsertProfile(input: {
    fullName: string;
    councilId?: string;
    specialties?: string[];
    bio?: string;
  }) {
    const uid = await currentUserId();
    if (!uid) throw new Error("not authenticated");
    const { data, error } = await supabase
      .from("professional_profiles")
      .upsert(
        {
          user_id: uid,
          full_name: input.fullName,
          council_id: input.councilId,
          specialties: input.specialties ?? [],
          bio: input.bio,
        },
        { onConflict: "user_id" },
      )
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async addProfessionalByEmail(childId: string, email: string, permission: "view" | "write" | "admin" = "write") {
    const { data, error } = await supabase.rpc("add_professional_by_email", {
      _child_id: childId,
      _email: email,
      _permission: permission,
    });
    if (error) throw error;
    return data;
  },
};
