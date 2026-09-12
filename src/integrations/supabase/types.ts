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
      candidate_profiles: {
        Row: {
          best_project_url: string | null
          certifications: Json | null
          created_at: string
          degree: string | null
          department: string | null
          email: string | null
          experience: string | null
          full_name: string | null
          github_analysis: Json | null
          github_url: string | null
          graduation_year: number | null
          id: string
          institution: string | null
          linkedin_url: string | null
          phone: string | null
          photo_path: string | null
          profile_completion: number | null
          resume_path: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          best_project_url?: string | null
          certifications?: Json | null
          created_at?: string
          degree?: string | null
          department?: string | null
          email?: string | null
          experience?: string | null
          full_name?: string | null
          github_analysis?: Json | null
          github_url?: string | null
          graduation_year?: number | null
          id?: string
          institution?: string | null
          linkedin_url?: string | null
          phone?: string | null
          photo_path?: string | null
          profile_completion?: number | null
          resume_path?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          best_project_url?: string | null
          certifications?: Json | null
          created_at?: string
          degree?: string | null
          department?: string | null
          email?: string | null
          experience?: string | null
          full_name?: string | null
          github_analysis?: Json | null
          github_url?: string | null
          graduation_year?: number | null
          id?: string
          institution?: string | null
          linkedin_url?: string | null
          phone?: string | null
          photo_path?: string | null
          profile_completion?: number | null
          resume_path?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      interview_messages: {
        Row: {
          content: Json
          created_at: string
          id: string
          role: string
          status: string
          thread_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: Json
          created_at?: string
          id?: string
          role: string
          status?: string
          thread_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          role?: string
          status?: string
          thread_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      interview_patterns: {
        Row: {
          content: string | null
          created_at: string
          file_path: string | null
          id: string
          organization_id: string
          title: string
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          file_path?: string | null
          id?: string
          organization_id: string
          title: string
          updated_at?: string
          uploaded_by: string
        }
        Update: {
          content?: string | null
          created_at?: string
          file_path?: string | null
          id?: string
          organization_id?: string
          title?: string
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_patterns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_threads: {
        Row: {
          behavioral_score: number | null
          camera_status: string
          cheating_violation: boolean
          company: string
          competency_scores: Json | null
          created_at: string
          cumulative_score: number | null
          difficulty: string
          domain: string
          ended_at: string | null
          evidence: Json
          github_context: Json | null
          hiring_manager_score: number | null
          id: string
          improvements: string[] | null
          language_violation: boolean
          lost_points: Json
          microphone_status: string
          notes: string | null
          overall_score: number | null
          panel_scores: Json | null
          product_manager_score: number | null
          recommendation: string | null
          role: string
          screen_share_status: string
          started_at: string | null
          status: string
          strengths: string[] | null
          technical_score: number | null
          termination_reason: string | null
          transcript: string | null
          turn_away_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          behavioral_score?: number | null
          camera_status?: string
          cheating_violation?: boolean
          company: string
          competency_scores?: Json | null
          created_at?: string
          cumulative_score?: number | null
          difficulty?: string
          domain: string
          ended_at?: string | null
          evidence?: Json
          github_context?: Json | null
          hiring_manager_score?: number | null
          id?: string
          improvements?: string[] | null
          language_violation?: boolean
          lost_points?: Json
          microphone_status?: string
          notes?: string | null
          overall_score?: number | null
          panel_scores?: Json | null
          product_manager_score?: number | null
          recommendation?: string | null
          role: string
          screen_share_status?: string
          started_at?: string | null
          status?: string
          strengths?: string[] | null
          technical_score?: number | null
          termination_reason?: string | null
          transcript?: string | null
          turn_away_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          behavioral_score?: number | null
          camera_status?: string
          cheating_violation?: boolean
          company?: string
          competency_scores?: Json | null
          created_at?: string
          cumulative_score?: number | null
          difficulty?: string
          domain?: string
          ended_at?: string | null
          evidence?: Json
          github_context?: Json | null
          hiring_manager_score?: number | null
          id?: string
          improvements?: string[] | null
          language_violation?: boolean
          lost_points?: Json
          microphone_status?: string
          notes?: string | null
          overall_score?: number | null
          panel_scores?: Json | null
          product_manager_score?: number | null
          recommendation?: string | null
          role?: string
          screen_share_status?: string
          started_at?: string | null
          status?: string
          strengths?: string[] | null
          technical_score?: number | null
          termination_reason?: string | null
          transcript?: string | null
          turn_away_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      monitoring_events: {
        Row: {
          created_at: string
          detail: string | null
          event_type: string
          id: string
          thread_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          detail?: string | null
          event_type: string
          id?: string
          thread_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          detail?: string | null
          event_type?: string
          id?: string
          thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "monitoring_events_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "interview_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          updated_at: string
          website: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      roadmap_progress: {
        Row: {
          created_at: string
          dimension: string
          id: string
          order_index: number
          status: string
          title: string
          updated_at: string
          user_id: string
          weeks: string | null
        }
        Insert: {
          created_at?: string
          dimension: string
          id?: string
          order_index?: number
          status?: string
          title: string
          updated_at?: string
          user_id: string
          weeks?: string | null
        }
        Update: {
          created_at?: string
          dimension?: string
          id?: string
          order_index?: number
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
          weeks?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
