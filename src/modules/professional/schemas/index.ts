import { z } from "zod";

/**
 * Schemas Zod do Módulo Profissionais.
 * Aplicados na validação client + server (inputValidator) quando o Cloud voltar.
 */

export const specialtyKeySchema = z.string().min(2);

export const sessionInputSchema = z.object({
  childId: z.string().uuid(),
  date: z.string(),
  durationMinutes: z.number().int().min(1).max(600),
  goalsWorked: z.array(z.string()).default([]),
  activities: z.string().min(1),
  materials: z.string().optional(),
  childResponse: z.string().optional(),
  observations: z.string().optional(),
  nextSteps: z.string().optional(),
  attachmentIds: z.array(z.string()).default([]),
});

export type SessionInput = z.infer<typeof sessionInputSchema>;

export const evolutionInputSchema = z.object({
  childId: z.string().uuid(),
  text: z.string().min(1),
  attachmentIds: z.array(z.string()).default([]),
  scaleApplicationIds: z.array(z.string()).default([]),
  sharedWith: z
    .object({
      family: z.boolean().optional(),
      school: z.boolean().optional(),
      professionalIds: z.array(z.string()).optional(),
    })
    .default({}),
});

export type EvolutionInput = z.infer<typeof evolutionInputSchema>;

export const goalInputSchema = z.object({
  childId: z.string().uuid(),
  description: z.string().min(1),
  category: z.string().min(1),
  startDate: z.string(),
  deadline: z.string().optional(),
  participantIds: z.array(z.string()).default([]),
  progressPercent: z.number().min(0).max(100).default(0),
});

export type GoalInput = z.infer<typeof goalInputSchema>;

export const appointmentInputSchema = z.object({
  childId: z.string().uuid(),
  start: z.string(),
  end: z.string(),
  modality: z.enum(["in_person", "online", "home_visit", "school_visit"]),
  location: z.string().optional(),
  recurrenceRule: z.string().optional(),
});

export type AppointmentInput = z.infer<typeof appointmentInputSchema>;

export const reportInputSchema = z.object({
  childId: z.string().uuid(),
  type: z.enum(["session", "weekly", "monthly", "quarterly", "annual", "custom"]),
});

export type ReportInput = z.infer<typeof reportInputSchema>;

export const scaleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  schema: z.record(z.string(), z.unknown()),
});

export type ScaleInput = z.infer<typeof scaleSchema>;
