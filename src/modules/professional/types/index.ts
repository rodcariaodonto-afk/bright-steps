/**
 * Tipos do Módulo Profissionais.
 * Refletem o schema previsto para a Onda 2 (após ativação do Cloud).
 * Repositórios abaixo consomem estes tipos — trocar mock por Supabase não muda a assinatura.
 */

export type SpecialtyKey =
  | "psychologist"
  | "neuropsychologist"
  | "speech_therapist"
  | "occupational_therapist"
  | "psychopedagogue"
  | "physician"
  | "neurologist"
  | "psychiatrist"
  | "pediatrician"
  | "nutritionist"
  | "physical_educator"
  | "teacher"
  | "school_coordinator"
  | "caregiver"
  | (string & {}); // aberto para novas especialidades

export type PermissionScope =
  | "view"
  | "session_write"
  | "report_write"
  | "message";

export interface Professional {
  id: string;
  userId: string;
  fullName: string;
  councilId?: string; // ex.: CRP, CRFa, CREFITO
  specialties: SpecialtyKey[];
  bio?: string;
  photoUrl?: string;
}

export interface ChildSummary {
  id: string;
  fullName: string;
  birthDate: string; // ISO
  diagnosis?: string;
  cid?: string;
  supportLevel?: 1 | 2 | 3;
  interests?: string[];
  scopes: PermissionScope[];
  lastSessionAt?: string;
  nextSessionAt?: string;
  goalsProgress?: number; // 0-100
}

export interface Appointment {
  id: string;
  childId: string;
  professionalId: string;
  start: string;
  end: string;
  status: "scheduled" | "confirmed" | "done" | "canceled" | "no_show";
  modality: "in_person" | "online" | "home_visit" | "school_visit";
  location?: string;
  recurrenceRule?: string; // rrule
}

export interface Session {
  id: string;
  appointmentId?: string;
  childId: string;
  professionalId: string;
  date: string;
  durationMinutes: number;
  goalsWorked: string[];
  activities: string;
  materials?: string;
  childResponse?: string;
  observations?: string;
  nextSteps?: string;
  attachmentIds: string[];
}

export interface EvolutionEntry {
  id: string;
  childId: string;
  professionalId: string;
  createdAt: string;
  text: string;
  attachmentIds: string[];
  scaleApplicationIds: string[];
  sharedWith: {
    family?: boolean;
    school?: boolean;
    professionalIds?: string[];
  };
}

export interface TherapeuticGoal {
  id: string;
  childId: string;
  description: string;
  category: string;
  startDate: string;
  deadline?: string;
  ownerProfessionalId: string;
  participantIds: string[];
  status: "active" | "paused" | "achieved" | "canceled";
  progressPercent: number;
}

export interface Scale {
  id: string;
  name: string;
  description?: string;
  schema: Record<string, unknown>; // itens/pontuação/ranges — jsonb flexível
}

export interface ScaleApplication {
  id: string;
  scaleId: string;
  childId: string;
  professionalId: string;
  appliedAt: string;
  result: Record<string, unknown>;
}

export interface ProfessionalReport {
  id: string;
  childId: string;
  professionalId: string;
  type: "session" | "weekly" | "monthly" | "quarterly" | "annual" | "custom";
  createdAt: string;
  status: "draft" | "final" | "shared";
  fileUrl?: string;
}

export interface MessageThread {
  id: string;
  childId: string;
  audience: "family" | "school" | "professionals";
  subject: string;
  lastMessageAt: string;
  unreadCount: number;
}

export interface DashboardSnapshot {
  todayAppointments: Appointment[];
  activePatients: number;
  pendingReports: number;
  unreadMessages: number;
  newDocuments: number;
  aiAlerts: number;
}
