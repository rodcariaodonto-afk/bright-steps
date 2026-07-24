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
      appointments: {
        Row: {
          child_id: string
          created_at: string
          ends_at: string
          id: string
          location: string | null
          modality: string
          notes: string | null
          professional_id: string
          starts_at: string
          status: string
          updated_at: string
        }
        Insert: {
          child_id: string
          created_at?: string
          ends_at: string
          id?: string
          location?: string | null
          modality?: string
          notes?: string | null
          professional_id: string
          starts_at: string
          status?: string
          updated_at?: string
        }
        Update: {
          child_id?: string
          created_at?: string
          ends_at?: string
          id?: string
          location?: string | null
          modality?: string
          notes?: string | null
          professional_id?: string
          starts_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      behavior_events: {
        Row: {
          antecedent: string | null
          behavior: string | null
          category: string
          child_id: string
          consequence: string | null
          created_at: string
          duration_minutes: number | null
          id: string
          intensity: number | null
          location: string | null
          logged_by: string | null
          note: string | null
          occurred_at: string
          strategies_used: string[]
          triggers: string[]
        }
        Insert: {
          antecedent?: string | null
          behavior?: string | null
          category?: string
          child_id: string
          consequence?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          intensity?: number | null
          location?: string | null
          logged_by?: string | null
          note?: string | null
          occurred_at?: string
          strategies_used?: string[]
          triggers?: string[]
        }
        Update: {
          antecedent?: string | null
          behavior?: string | null
          category?: string
          child_id?: string
          consequence?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          intensity?: number | null
          location?: string | null
          logged_by?: string | null
          note?: string | null
          occurred_at?: string
          strategies_used?: string[]
          triggers?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "behavior_events_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          all_day: boolean
          category: string
          child_id: string | null
          color: string | null
          created_at: string
          created_by: string
          description: string | null
          ends_at: string
          family_id: string
          id: string
          location: string | null
          starts_at: string
          title: string
          updated_at: string
        }
        Insert: {
          all_day?: boolean
          category?: string
          child_id?: string | null
          color?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          ends_at: string
          family_id: string
          id?: string
          location?: string | null
          starts_at: string
          title: string
          updated_at?: string
        }
        Update: {
          all_day?: boolean
          category?: string
          child_id?: string | null
          color?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          ends_at?: string
          family_id?: string
          id?: string
          location?: string | null
          starts_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      child_documents: {
        Row: {
          category: string
          child_id: string
          created_at: string
          id: string
          issued_at: string | null
          mime_type: string | null
          notes: string | null
          size_bytes: number | null
          storage_path: string
          title: string
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          category?: string
          child_id: string
          created_at?: string
          id?: string
          issued_at?: string | null
          mime_type?: string | null
          notes?: string | null
          size_bytes?: number | null
          storage_path: string
          title: string
          updated_at?: string
          uploaded_by: string
        }
        Update: {
          category?: string
          child_id?: string
          created_at?: string
          id?: string
          issued_at?: string | null
          mime_type?: string | null
          notes?: string | null
          size_bytes?: number | null
          storage_path?: string
          title?: string
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "child_documents_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
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
      clinical_sessions: {
        Row: {
          activities: string | null
          appointment_id: string | null
          attachments: Json
          child_id: string
          child_response: string | null
          created_at: string
          duration_minutes: number
          goals_worked: string[]
          id: string
          materials: string | null
          next_steps: string | null
          observations: string | null
          professional_id: string
          session_date: string
          shared_with_family: boolean
          shared_with_school: boolean
          updated_at: string
        }
        Insert: {
          activities?: string | null
          appointment_id?: string | null
          attachments?: Json
          child_id: string
          child_response?: string | null
          created_at?: string
          duration_minutes?: number
          goals_worked?: string[]
          id?: string
          materials?: string | null
          next_steps?: string | null
          observations?: string | null
          professional_id: string
          session_date?: string
          shared_with_family?: boolean
          shared_with_school?: boolean
          updated_at?: string
        }
        Update: {
          activities?: string | null
          appointment_id?: string | null
          attachments?: Json
          child_id?: string
          child_response?: string | null
          created_at?: string
          duration_minutes?: number
          goals_worked?: string[]
          id?: string
          materials?: string | null
          next_steps?: string | null
          observations?: string | null
          professional_id?: string
          session_date?: string
          shared_with_family?: boolean
          shared_with_school?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinical_sessions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_sessions_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      community_comments: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          post_id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          post_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_likes: {
        Row: {
          created_at: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          author_id: string
          body: string
          comments_count: number
          created_at: string
          id: string
          likes_count: number
          status: string
          title: string
          topic: string
          updated_at: string
        }
        Insert: {
          author_id: string
          body: string
          comments_count?: number
          created_at?: string
          id?: string
          likes_count?: number
          status?: string
          title: string
          topic?: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: string
          comments_count?: number
          created_at?: string
          id?: string
          likes_count?: number
          status?: string
          title?: string
          topic?: string
          updated_at?: string
        }
        Relationships: []
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
      conversations: {
        Row: {
          child_id: string | null
          created_at: string
          family_user_id: string
          id: string
          last_message_at: string
          professional_user_id: string
        }
        Insert: {
          child_id?: string | null
          created_at?: string
          family_user_id: string
          id?: string
          last_message_at?: string
          professional_user_id: string
        }
        Update: {
          child_id?: string | null
          created_at?: string
          family_user_id?: string
          id?: string
          last_message_at?: string
          professional_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      evolution_entries: {
        Row: {
          attachments: Json
          category: string | null
          child_id: string
          content: string
          created_at: string
          id: string
          professional_id: string
          shared_with_family: boolean
          shared_with_school: boolean
          updated_at: string
        }
        Insert: {
          attachments?: Json
          category?: string | null
          child_id: string
          content: string
          created_at?: string
          id?: string
          professional_id: string
          shared_with_family?: boolean
          shared_with_school?: boolean
          updated_at?: string
        }
        Update: {
          attachments?: Json
          category?: string | null
          child_id?: string
          content?: string
          created_at?: string
          id?: string
          professional_id?: string
          shared_with_family?: boolean
          shared_with_school?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "evolution_entries_child_id_fkey"
            columns: ["child_id"]
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
      goal_progress: {
        Row: {
          child_id: string
          created_at: string
          goal_id: string
          id: string
          logged_at: string
          logged_by: string
          note: string | null
          value: number | null
        }
        Insert: {
          child_id: string
          created_at?: string
          goal_id: string
          id?: string
          logged_at?: string
          logged_by: string
          note?: string | null
          value?: number | null
        }
        Update: {
          child_id?: string
          created_at?: string
          goal_id?: string
          id?: string
          logged_at?: string
          logged_by?: string
          note?: string | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "goal_progress_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_progress_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          category: string
          child_id: string
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          id: string
          status: string
          target_value: number | null
          title: string
          unit: string | null
          updated_at: string
        }
        Insert: {
          category?: string
          child_id: string
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          id?: string
          status?: string
          target_value?: number | null
          title: string
          unit?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          child_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          id?: string
          status?: string
          target_value?: number | null
          title?: string
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      kid_achievements: {
        Row: {
          category: string | null
          child_id: string
          code: string
          description: string | null
          icon: string | null
          id: string
          stars_earned: number
          title: string
          unlocked_at: string
        }
        Insert: {
          category?: string | null
          child_id: string
          code: string
          description?: string | null
          icon?: string | null
          id?: string
          stars_earned?: number
          title: string
          unlocked_at?: string
        }
        Update: {
          category?: string | null
          child_id?: string
          code?: string
          description?: string | null
          icon?: string | null
          id?: string
          stars_earned?: number
          title?: string
          unlocked_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kid_achievements_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      kid_reward_log: {
        Row: {
          child_id: string
          created_at: string
          delta: number
          id: string
          reason: string
          source: string
        }
        Insert: {
          child_id: string
          created_at?: string
          delta: number
          id?: string
          reason: string
          source: string
        }
        Update: {
          child_id?: string
          created_at?: string
          delta?: number
          id?: string
          reason?: string
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "kid_reward_log_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      kid_rewards: {
        Row: {
          child_id: string
          created_at: string
          id: string
          lifetime_stars: number
          stars: number
          updated_at: string
        }
        Insert: {
          child_id: string
          created_at?: string
          id?: string
          lifetime_stars?: number
          stars?: number
          updated_at?: string
        }
        Update: {
          child_id?: string
          created_at?: string
          id?: string
          lifetime_stars?: number
          stars?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kid_rewards_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: true
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      medication_logs: {
        Row: {
          child_id: string
          created_at: string
          dose_taken: string | null
          id: string
          logged_by: string | null
          medication_id: string
          note: string | null
          side_effects: string | null
          status: string
          taken_at: string
        }
        Insert: {
          child_id: string
          created_at?: string
          dose_taken?: string | null
          id?: string
          logged_by?: string | null
          medication_id: string
          note?: string | null
          side_effects?: string | null
          status?: string
          taken_at?: string
        }
        Update: {
          child_id?: string
          created_at?: string
          dose_taken?: string | null
          id?: string
          logged_by?: string | null
          medication_id?: string
          note?: string | null
          side_effects?: string | null
          status?: string
          taken_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medication_logs_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medication_logs_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
        ]
      }
      medications: {
        Row: {
          child_id: string
          created_at: string
          created_by: string | null
          dose: string | null
          end_date: string | null
          frequency: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          prescriber: string | null
          route: string | null
          schedule_times: string[]
          start_date: string | null
          updated_at: string
        }
        Insert: {
          child_id: string
          created_at?: string
          created_by?: string | null
          dose?: string | null
          end_date?: string | null
          frequency?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          prescriber?: string | null
          route?: string | null
          schedule_times?: string[]
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          child_id?: string
          created_at?: string
          created_by?: string | null
          dose?: string | null
          end_date?: string | null
          frequency?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          prescriber?: string | null
          route?: string | null
          schedule_times?: string[]
          start_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medications_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          id: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      mood_logs: {
        Row: {
          child_id: string
          created_at: string
          emoji: string | null
          id: string
          level: number
          logged_at: string
          logged_by: string | null
          note: string | null
          triggers: string[]
        }
        Insert: {
          child_id: string
          created_at?: string
          emoji?: string | null
          id?: string
          level: number
          logged_at?: string
          logged_by?: string | null
          note?: string | null
          triggers?: string[]
        }
        Update: {
          child_id?: string
          created_at?: string
          emoji?: string | null
          id?: string
          level?: number
          logged_at?: string
          logged_by?: string | null
          note?: string | null
          triggers?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "mood_logs_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          kind: string
          link: string | null
          priority: string
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          link?: string | null
          priority?: string
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          link?: string | null
          priority?: string
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      professional_contact_requests: {
        Row: {
          child_id: string | null
          created_at: string
          id: string
          message: string
          professional_user_id: string
          requester_user_id: string
          status: string
          updated_at: string
        }
        Insert: {
          child_id?: string | null
          created_at?: string
          id?: string
          message: string
          professional_user_id: string
          requester_user_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          child_id?: string | null
          created_at?: string
          id?: string
          message?: string
          professional_user_id?: string
          requester_user_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_contact_requests_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_profiles: {
        Row: {
          accepting_patients: boolean
          bio: string | null
          city: string | null
          contact_email: string | null
          contact_phone: string | null
          council_id: string | null
          created_at: string
          full_name: string
          id: string
          languages: string[]
          modality: string | null
          photo_url: string | null
          price_range: string | null
          specialties: string[]
          state: string | null
          updated_at: string
          user_id: string
          visible_in_marketplace: boolean
        }
        Insert: {
          accepting_patients?: boolean
          bio?: string | null
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          council_id?: string | null
          created_at?: string
          full_name: string
          id?: string
          languages?: string[]
          modality?: string | null
          photo_url?: string | null
          price_range?: string | null
          specialties?: string[]
          state?: string | null
          updated_at?: string
          user_id: string
          visible_in_marketplace?: boolean
        }
        Update: {
          accepting_patients?: boolean
          bio?: string | null
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          council_id?: string | null
          created_at?: string
          full_name?: string
          id?: string
          languages?: string[]
          modality?: string | null
          photo_url?: string | null
          price_range?: string | null
          specialties?: string[]
          state?: string | null
          updated_at?: string
          user_id?: string
          visible_in_marketplace?: boolean
        }
        Relationships: []
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
      reports: {
        Row: {
          ai_generated: boolean
          child_id: string
          created_at: string
          created_by: string
          data: Json
          highlights: Json
          id: string
          kind: string
          period_end: string
          period_start: string
          summary: string
          title: string
          updated_at: string
        }
        Insert: {
          ai_generated?: boolean
          child_id: string
          created_at?: string
          created_by: string
          data?: Json
          highlights?: Json
          id?: string
          kind?: string
          period_end: string
          period_start: string
          summary: string
          title: string
          updated_at?: string
        }
        Update: {
          ai_generated?: boolean
          child_id?: string
          created_at?: string
          created_by?: string
          data?: Json
          highlights?: Json
          id?: string
          kind?: string
          period_end?: string
          period_start?: string
          summary?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      routine_completions: {
        Row: {
          child_id: string
          completed_on: string
          created_at: string
          id: string
          logged_by: string | null
          note: string | null
          routine_id: string
          status: string
        }
        Insert: {
          child_id: string
          completed_on: string
          created_at?: string
          id?: string
          logged_by?: string | null
          note?: string | null
          routine_id: string
          status?: string
        }
        Update: {
          child_id?: string
          completed_on?: string
          created_at?: string
          id?: string
          logged_by?: string | null
          note?: string | null
          routine_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "routine_completions_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routine_completions_routine_id_fkey"
            columns: ["routine_id"]
            isOneToOne: false
            referencedRelation: "routines"
            referencedColumns: ["id"]
          },
        ]
      }
      routines: {
        Row: {
          category: string
          child_id: string
          color: string | null
          created_at: string
          created_by: string | null
          days_of_week: number[]
          icon: string | null
          id: string
          is_active: boolean
          notes: string | null
          time_of_day: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          child_id: string
          color?: string | null
          created_at?: string
          created_by?: string | null
          days_of_week?: number[]
          icon?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          time_of_day?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          child_id?: string
          color?: string | null
          created_at?: string
          created_by?: string | null
          days_of_week?: number[]
          icon?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          time_of_day?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "routines_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      school_notes: {
        Row: {
          author_id: string
          author_role: string
          category: string
          child_id: string
          content: string
          created_at: string
          id: string
          mood: string | null
          pinned: boolean
          school_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          author_role: string
          category: string
          child_id: string
          content: string
          created_at?: string
          id?: string
          mood?: string | null
          pinned?: boolean
          school_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          author_role?: string
          category?: string
          child_id?: string
          content?: string
          created_at?: string
          id?: string
          mood?: string | null
          pinned?: boolean
          school_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_notes_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_notes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "school_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      school_profiles: {
        Row: {
          child_id: string
          class_name: string | null
          created_at: string
          created_by: string | null
          grade: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          teacher_email: string | null
          teacher_name: string | null
          updated_at: string
        }
        Insert: {
          child_id: string
          class_name?: string | null
          created_at?: string
          created_by?: string | null
          grade?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          teacher_email?: string | null
          teacher_name?: string | null
          updated_at?: string
        }
        Update: {
          child_id?: string
          class_name?: string | null
          created_at?: string
          created_by?: string | null
          grade?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          teacher_email?: string | null
          teacher_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_profiles_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
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
      add_kid_stars: {
        Args: {
          _child_id: string
          _delta: number
          _reason: string
          _source: string
        }
        Returns: number
      }
      add_professional_by_email: {
        Args: { _child_id: string; _email: string; _permission?: string }
        Returns: string
      }
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
      list_my_patients: {
        Args: never
        Returns: {
          birth_date: string
          child_id: string
          declared_conditions: string[]
          dominant_interest: string
          full_name: string
          nickname: string
          permission: string
        }[]
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
