import type {
  Appointment,
  ChildSummary,
  DashboardSnapshot,
  EvolutionEntry,
  MessageThread,
  Professional,
  ProfessionalReport,
  Scale,
  Session,
  TherapeuticGoal,
} from "../types";

/**
 * Interfaces dos repositórios do Módulo Profissionais.
 * Onda 1: implementação mock em memória (`inMemoryRepositories`).
 * Onda 2 (após Cloud): implementação Supabase substitui o mock sem tocar em componentes.
 * Componentes SEMPRE consomem via `getProfessionalRepositories()`.
 */

export interface ProfessionalRepository {
  getMe(): Promise<Professional | null>;
}

export interface PatientsRepository {
  list(): Promise<ChildSummary[]>;
  get(id: string): Promise<ChildSummary | null>;
}

export interface AgendaRepository {
  listForRange(fromISO: string, toISO: string): Promise<Appointment[]>;
  today(): Promise<Appointment[]>;
}

export interface SessionsRepository {
  listByChild(childId: string): Promise<Session[]>;
  get(id: string): Promise<Session | null>;
}

export interface EvolutionRepository {
  listByChild(childId: string): Promise<EvolutionEntry[]>;
  feed(): Promise<EvolutionEntry[]>;
}

export interface GoalsRepository {
  listByChild(childId: string): Promise<TherapeuticGoal[]>;
  all(): Promise<TherapeuticGoal[]>;
}

export interface ScalesRepository {
  catalog(): Promise<Scale[]>;
}

export interface ReportsRepository {
  list(): Promise<ProfessionalReport[]>;
}

export interface MessagesRepository {
  threads(): Promise<MessageThread[]>;
}

export interface DashboardRepository {
  snapshot(): Promise<DashboardSnapshot>;
}

export interface ProfessionalRepositories {
  me: ProfessionalRepository;
  patients: PatientsRepository;
  agenda: AgendaRepository;
  sessions: SessionsRepository;
  evolution: EvolutionRepository;
  goals: GoalsRepository;
  scales: ScalesRepository;
  reports: ReportsRepository;
  messages: MessagesRepository;
  dashboard: DashboardRepository;
}

/* -------------------- Implementação mock (Onda 1) -------------------- */

const today = new Date();
function iso(offsetMinutes: number): string {
  const d = new Date(today.getTime() + offsetMinutes * 60_000);
  return d.toISOString();
}

const mockProfessional: Professional = {
  id: "pro-1",
  userId: "user-1",
  fullName: "Rodrigo Cária",
  councilId: "CRP 00/00000",
  specialties: ["psychologist", "neuropsychologist"],
};

const mockPatients: ChildSummary[] = [
  {
    id: "child-1",
    fullName: "Bento Alves",
    birthDate: "2018-03-14",
    diagnosis: "TEA nível 1",
    cid: "F84.0",
    supportLevel: 1,
    interests: ["dinossauros", "trens"],
    scopes: ["view", "session_write", "report_write", "message"],
    lastSessionAt: iso(-60 * 24 * 3),
    nextSessionAt: iso(60 * 2),
    goalsProgress: 62,
  },
  {
    id: "child-2",
    fullName: "Aurora Lima",
    birthDate: "2020-11-02",
    diagnosis: "TDAH",
    cid: "F90.0",
    supportLevel: 1,
    interests: ["desenho", "música"],
    scopes: ["view", "session_write"],
    lastSessionAt: iso(-60 * 24 * 8),
    nextSessionAt: iso(60 * 26),
    goalsProgress: 34,
  },
  {
    id: "child-3",
    fullName: "Miguel Souza",
    birthDate: "2016-07-22",
    diagnosis: "TEA nível 2",
    cid: "F84.0",
    supportLevel: 2,
    interests: ["mapas", "carros"],
    scopes: ["view", "session_write", "report_write", "message"],
    lastSessionAt: iso(-60 * 24),
    nextSessionAt: iso(60 * 5),
    goalsProgress: 78,
  },
];

const mockAppointments: Appointment[] = [
  {
    id: "apt-1",
    childId: "child-1",
    professionalId: "pro-1",
    start: iso(60),
    end: iso(110),
    status: "confirmed",
    modality: "in_person",
    location: "Sala 3",
  },
  {
    id: "apt-2",
    childId: "child-3",
    professionalId: "pro-1",
    start: iso(180),
    end: iso(230),
    status: "scheduled",
    modality: "online",
  },
  {
    id: "apt-3",
    childId: "child-2",
    professionalId: "pro-1",
    start: iso(300),
    end: iso(345),
    status: "scheduled",
    modality: "in_person",
    location: "Sala 1",
  },
];

const mockGoals: TherapeuticGoal[] = [
  {
    id: "goal-1",
    childId: "child-1",
    description: "Ampliar tempo de atenção compartilhada para 8 minutos",
    category: "Interação social",
    startDate: iso(-60 * 24 * 30),
    ownerProfessionalId: "pro-1",
    participantIds: ["family-1"],
    status: "active",
    progressPercent: 62,
  },
  {
    id: "goal-2",
    childId: "child-3",
    description: "Reduzir hiperfoco em situações de transição",
    category: "Regulação",
    startDate: iso(-60 * 24 * 60),
    ownerProfessionalId: "pro-1",
    participantIds: ["family-2", "school-1"],
    status: "active",
    progressPercent: 78,
  },
];

const inMemoryRepositories: ProfessionalRepositories = {
  me: { getMe: async () => mockProfessional },
  patients: {
    list: async () => mockPatients,
    get: async (id) => mockPatients.find((p) => p.id === id) ?? null,
  },
  agenda: {
    listForRange: async () => mockAppointments,
    today: async () => mockAppointments,
  },
  sessions: {
    listByChild: async () => [],
    get: async () => null,
  },
  evolution: {
    listByChild: async () => [],
    feed: async () => [],
  },
  goals: {
    listByChild: async (id) => mockGoals.filter((g) => g.childId === id),
    all: async () => mockGoals,
  },
  scales: { catalog: async () => [] },
  reports: { list: async () => [] },
  messages: { threads: async () => [] },
  dashboard: {
    snapshot: async () => ({
      todayAppointments: mockAppointments,
      activePatients: mockPatients.length,
      pendingReports: 2,
      unreadMessages: 3,
      newDocuments: 1,
      aiAlerts: 1,
    }),
  },
};

import { supabaseRepositories } from "./supabase";

let current: ProfessionalRepositories = supabaseRepositories;

/** Ponto único de acesso aos repositórios do módulo Profissional. */
export function getProfessionalRepositories(): ProfessionalRepositories {
  return current;
}

export function setProfessionalRepositories(next: ProfessionalRepositories) {
  current = next;
}

/** Mantido para testes/storybook. */
export const __mockProfessionalRepositories = inMemoryRepositories;
