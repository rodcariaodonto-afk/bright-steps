/**
 * Papéis da plataforma. Nunca hardcode uma checagem — use `can()`.
 */
export type Role =
  | "global_admin"
  | "admin"
  | "manager"
  | "family"
  | "guardian"
  | "caregiver"
  | "professional"
  | "school"
  | "teacher"
  | "child"
  | "moderator"
  | "guest";

export type Action = "read" | "create" | "update" | "delete" | "moderate" | "publish";

export type Resource =
  | "child"
  | "session"
  | "report"
  | "medication"
  | "goal"
  | "message"
  | "post"
  | "comment"
  | "product"
  | "order"
  | "subscription"
  | "user"
  | "professional"
  | "school"
  | "ai_conversation"
  | "system_settings";

/**
 * Matriz de permissões. Onda 1: heurística; Ondas 2+: consulta ao banco (RLS + user_roles).
 */
const MATRIX: Partial<Record<Role, Partial<Record<Resource, Action[]>>>> = {
  global_admin: {},
  admin: {
    system_settings: ["read", "update"],
    user: ["read", "update", "delete"],
    subscription: ["read", "update"],
  },
  moderator: {
    post: ["read", "moderate", "delete"],
    comment: ["read", "moderate", "delete"],
  },
  family: {
    child: ["read", "create", "update"],
    goal: ["read"],
    message: ["read", "create"],
    ai_conversation: ["read", "create"],
  },
  professional: {
    child: ["read"],
    session: ["read", "create", "update"],
    report: ["read", "create", "update"],
    goal: ["read", "create", "update"],
    message: ["read", "create"],
    ai_conversation: ["read", "create"],
  },
  school: {
    child: ["read"],
    message: ["read", "create"],
  },
  teacher: {
    child: ["read"],
    message: ["read", "create"],
  },
  child: {
    ai_conversation: ["read", "create"],
  },
  caregiver: {
    child: ["read"],
    message: ["read", "create"],
  },
  guardian: {
    child: ["read", "update"],
    goal: ["read"],
    message: ["read", "create"],
  },
  manager: {},
  guest: {},
};

export function can(role: Role, action: Action, resource: Resource): boolean {
  if (role === "global_admin") return true;
  const resActions = MATRIX[role]?.[resource];
  return !!resActions?.includes(action);
}
