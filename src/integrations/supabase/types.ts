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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      automation_sessions: {
        Row: {
          answers: Json
          created_at: string
          current_step: string
          id: string
          last_message_sid: string | null
          lead_id: string
          status: string
          type: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          answers?: Json
          created_at?: string
          current_step?: string
          id?: string
          last_message_sid?: string | null
          lead_id: string
          status?: string
          type?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          answers?: Json
          created_at?: string
          current_step?: string
          id?: string
          last_message_sid?: string | null
          lead_id?: string
          status?: string
          type?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_sessions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_sessions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      calls: {
        Row: {
          created_at: string
          direction: string
          duration: number | null
          id: string
          lead_id: string
          status: Database["public"]["Enums"]["call_status"]
          twilio_sid: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          direction: string
          duration?: number | null
          id?: string
          lead_id: string
          status?: Database["public"]["Enums"]["call_status"]
          twilio_sid?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          direction?: string
          duration?: number | null
          id?: string
          lead_id?: string
          status?: Database["public"]["Enums"]["call_status"]
          twilio_sid?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calls_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calls_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          channel: Database["public"]["Enums"]["conversation_channel"]
          content: string | null
          created_at: string
          direction: string
          id: string
          lead_id: string
          workspace_id: string
        }
        Insert: {
          channel: Database["public"]["Enums"]["conversation_channel"]
          content?: string | null
          created_at?: string
          direction: string
          id?: string
          lead_id: string
          workspace_id: string
        }
        Update: {
          channel?: Database["public"]["Enums"]["conversation_channel"]
          content?: string | null
          created_at?: string
          direction?: string
          id?: string
          lead_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_tickets: {
        Row: {
          assigned_to: string | null
          content: string
          created_at: string
          id: string
          priority: Database["public"]["Enums"]["ticket_priority"]
          resolved_at: string | null
          review_request_id: string
          status: Database["public"]["Enums"]["ticket_status"]
          workspace_id: string
        }
        Insert: {
          assigned_to?: string | null
          content: string
          created_at?: string
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          resolved_at?: string | null
          review_request_id: string
          status?: Database["public"]["Enums"]["ticket_status"]
          workspace_id: string
        }
        Update: {
          assigned_to?: string | null
          content?: string
          created_at?: string
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          resolved_at?: string | null
          review_request_id?: string
          status?: Database["public"]["Enums"]["ticket_status"]
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_tickets_review_request_id_fkey"
            columns: ["review_request_id"]
            isOneToOne: false
            referencedRelation: "review_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_tickets_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          config: Json | null
          connected_at: string | null
          created_at: string
          id: string
          provider: string
          status: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          config?: Json | null
          connected_at?: string | null
          created_at?: string
          id?: string
          provider: string
          status?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          config?: Json | null
          connected_at?: string | null
          created_at?: string
          id?: string
          provider?: string
          status?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "integrations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          id: string
          lead_id: string
          scheduled_at: string | null
          stage_id: string | null
          status: Database["public"]["Enums"]["job_status"]
          updated_at: string
          workspace_id: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          lead_id: string
          scheduled_at?: string | null
          stage_id?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          updated_at?: string
          workspace_id: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          lead_id?: string
          scheduled_at?: string | null
          stage_id?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "pipeline_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_to: string | null
          created_at: string
          email: string | null
          id: string
          location_id: string | null
          name: string
          normalized_phone: string | null
          phone: string | null
          source: string | null
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string
          workspace_id: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          email?: string | null
          id?: string
          location_id?: string | null
          name: string
          normalized_phone?: string | null
          phone?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
          workspace_id: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          email?: string | null
          id?: string
          location_id?: string | null
          name?: string
          normalized_phone?: string | null
          phone?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address: string | null
          created_at: string
          google_review_link: string | null
          id: string
          name: string
          phone: string | null
          service_area: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          google_review_link?: string | null
          id?: string
          name: string
          phone?: string | null
          service_area?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          google_review_link?: string | null
          id?: string
          name?: string
          phone?: string | null
          service_area?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      pipeline_stages: {
        Row: {
          created_at: string
          id: string
          name: string
          position: number
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          position: number
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          position?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_stages_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      review_requests: {
        Row: {
          created_at: string
          followup_count: number
          google_review_url: string | null
          id: string
          job_id: string
          outcome: Database["public"]["Enums"]["review_outcome"]
          rating_value: number | null
          responded_at: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["review_status"]
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          followup_count?: number
          google_review_url?: string | null
          id?: string
          job_id: string
          outcome?: Database["public"]["Enums"]["review_outcome"]
          rating_value?: number | null
          responded_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["review_status"]
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          followup_count?: number
          google_review_url?: string | null
          id?: string
          job_id?: string
          outcome?: Database["public"]["Enums"]["review_outcome"]
          rating_value?: number | null
          responded_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["review_status"]
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_requests_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_requests_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      websites: {
        Row: {
          config: Json | null
          created_at: string
          domain: string | null
          id: string
          type: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          domain?: string | null
          id?: string
          type: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          domain?: string | null
          id?: string
          type?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "websites_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_logs: {
        Row: {
          created_at: string
          event_type: string
          id: string
          payload: Json | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          payload?: Json | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_logs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          id: string
          invited_by: string | null
          joined_at: string
          role: Database["public"]["Enums"]["workspace_role"]
          status: Database["public"]["Enums"]["member_status"]
          user_id: string
          workspace_id: string
        }
        Insert: {
          id?: string
          invited_by?: string | null
          joined_at?: string
          role?: Database["public"]["Enums"]["workspace_role"]
          status?: Database["public"]["Enums"]["member_status"]
          user_id: string
          workspace_id: string
        }
        Update: {
          id?: string
          invited_by?: string | null
          joined_at?: string
          role?: Database["public"]["Enums"]["workspace_role"]
          status?: Database["public"]["Enums"]["member_status"]
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          id: string
          industry: string | null
          name: string
          slug: string
          timezone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          industry?: string | null
          name: string
          slug: string
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          industry?: string | null
          name?: string
          slug?: string
          timezone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["workspace_role"]
          _user_id: string
          _workspace_id: string
        }
        Returns: boolean
      }
      is_active_member: {
        Args: { _user_id: string; _workspace_id: string }
        Returns: boolean
      }
      is_owner_or_admin: {
        Args: { _user_id: string; _workspace_id: string }
        Returns: boolean
      }
    }
    Enums: {
      call_status: "missed" | "answered" | "voicemail"
      conversation_channel: "sms" | "call" | "form" | "email"
      job_status: "scheduled" | "in_progress" | "completed" | "cancelled"
      lead_status: "new" | "contacted" | "qualified" | "unqualified" | "lost"
      member_status: "active" | "invited" | "disabled"
      review_outcome:
        | "pending"
        | "public_redirected"
        | "private_recovery"
        | "no_response"
      review_status: "pending" | "sent" | "completed" | "declined"
      ticket_priority: "low" | "medium" | "high"
      ticket_status: "open" | "in_review" | "resolved"
      workspace_role: "owner" | "admin" | "staff" | "tech"
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
      call_status: ["missed", "answered", "voicemail"],
      conversation_channel: ["sms", "call", "form", "email"],
      job_status: ["scheduled", "in_progress", "completed", "cancelled"],
      lead_status: ["new", "contacted", "qualified", "unqualified", "lost"],
      member_status: ["active", "invited", "disabled"],
      review_outcome: [
        "pending",
        "public_redirected",
        "private_recovery",
        "no_response",
      ],
      review_status: ["pending", "sent", "completed", "declined"],
      ticket_priority: ["low", "medium", "high"],
      ticket_status: ["open", "in_review", "resolved"],
      workspace_role: ["owner", "admin", "staff", "tech"],
    },
  },
} as const
