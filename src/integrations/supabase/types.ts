export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      child_guardians: {
        Row: {
          child_id: string
          granted_at: string
          granted_by: string | null
          id: string
          permission: Database["public"]["Enums"]["guardian_permission"]
          revoked_at: string | null
          user_id: string
        }
        Insert: {
          child_id: string
          granted_at?: string
          granted_by?: string | null
          id?: string
          permission?: Database["public"]["Enums"]["guardian_permission"]
          revoked_at?: string | null
          user_id: string
        }
        Update: {
          child_id?: string
          granted_at?: string
          granted_by?: string | null
          id?: string
          permission?: Database["public"]["Enums"]["guardian_permission"]
          revoked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "child_guardians_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      children: {
        Row: {
          avatar_url: string | null
          birth_date: string | null
          created_at: string
          created_by: string | null
          declared_conditions: string[]
          deleted_at: string | null
          dominant_interest: string | null
          family_id: string
          full_name: string
          id: string
          nickname: string | null
          notes: string | null
          pronouns: Database["public"]["Enums"]["child_pronouns"] | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string
          created_by?: string | null
          declared_conditions?: string[]
          deleted_at?: string | null
          dominant_interest?: string | null
          family_id: string
          full_name: string
          id?: string
          nickname?: string | null
          notes?: string | null
          pronouns?: Database["public"]["Enums"]["child_pronouns"] | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string
          created_by?: string | null
          declared_conditions?: string[]
          deleted_at?: string | null
          dominant_interest?: string | null
          family_id?: string
          full_name?: string
          id?: string
          nickname?: string | null
          notes?: string | null
          pronouns?: Database["public"]["Enums"]["child_pronouns"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "children_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      consent_records: {
        Row: {
          evidence: Json | null
          granted: boolean
          granted_at: string
          granted_by: string
          id: string
          purpose: string
          revoked_at: string | null
          scope: Database["public"]["Enums"]["consent_scope"]
          subject_child_id: string | null
          subject_user_id: string | null
          version: number
        }
        Insert: {
          evidence?: Json | null
          granted: boolean
          granted_at?: string
          granted_by: string
          id?: string
          purpose: string
          revoked_at?: string | null
          scope: Database["public"]["Enums"]["consent_scope"]
          subject_child_id?: string | null
          subject_user_id?: string | null
          version?: number
        }
        Update: {
          evidence?: Json | null
          granted?: boolean
          granted_at?: string
          granted_by?: string
          id?: string
          purpose?: string
          revoked_at?: string | null
          scope?: Database["public"]["Enums"]["consent_scope"]
          subject_child_id?: string | null
          subject_user_id?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "consent_records_subject_child_id_fkey"
            columns: ["subject_child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      families: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          name: string
          owner_id: string
          timezone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          name: string
          owner_id: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          name?: string
          owner_id?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      family_members: {
        Row: {
          accepted_at: string | null
          created_at: string
          family_id: string
          id: string
          invited_at: string | null
          invited_by: string | null
          invited_email: string | null
          role: Database["public"]["Enums"]["family_role"]
          status: Database["public"]["Enums"]["member_status"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          family_id: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          invited_email?: string | null
          role?: Database["public"]["Enums"]["family_role"]
          status?: Database["public"]["Enums"]["member_status"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          family_id?: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          invited_email?: string | null
          role?: Database["public"]["Enums"]["family_role"]
          status?: Database["public"]["Enums"]["member_status"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "family_members_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_child: {
        Args: { _child_id: string; _user_id: string }
        Returns: boolean
      }
      can_write_child: {
        Args: { _child_id: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_family_member: {
        Args: { _family_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      child_pronouns: "ele" | "ela" | "elu" | "outro"
      consent_scope:
        | "ai_context"
        | "ai_memory"
        | "clinical_share"
        | "school_share"
        | "marketplace_personalization"
        | "community_visibility"
        | "analytics"
        | "marketing"
      family_role: "owner" | "guardian" | "parent" | "caregiver"
      guardian_permission: "read" | "write" | "admin"
      member_status: "active" | "invited" | "revoked"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      child_pronouns: ["ele", "ela", "elu", "outro"],
      consent_scope: [
        "ai_context",
        "ai_memory",
        "clinical_share",
        "school_share",
        "marketplace_personalization",
        "community_visibility",
        "analytics",
        "marketing",
      ],
      family_role: ["owner", "guardian", "parent", "caregiver"],
      guardian_permission: ["read", "write", "admin"],
      member_status: ["active", "invited", "revoked"],
    },
  },
} as const
