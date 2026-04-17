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
      bureau_queries: {
        Row: {
          approved: boolean
          approved_limit: number | null
          cpf: string
          created_at: string
          event_id: string
          id: string
          phone: string | null
          promoter_token_id: string
          reason: string | null
          sms_link_expires_at: string | null
          sms_link_token: string | null
          sms_sent_at: string | null
        }
        Insert: {
          approved: boolean
          approved_limit?: number | null
          cpf: string
          created_at?: string
          event_id: string
          id?: string
          phone?: string | null
          promoter_token_id: string
          reason?: string | null
          sms_link_expires_at?: string | null
          sms_link_token?: string | null
          sms_sent_at?: string | null
        }
        Update: {
          approved?: boolean
          approved_limit?: number | null
          cpf?: string
          created_at?: string
          event_id?: string
          id?: string
          phone?: string | null
          promoter_token_id?: string
          reason?: string | null
          sms_link_expires_at?: string | null
          sms_link_token?: string | null
          sms_sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bureau_queries_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bureau_queries_promoter_token_id_fkey"
            columns: ["promoter_token_id"]
            isOneToOne: false
            referencedRelation: "event_promoter_tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      event_promoter_tokens: {
        Row: {
          active: boolean
          created_at: string
          event_id: string
          expires_at: string | null
          id: string
          promoter_name: string | null
          token: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          event_id: string
          expires_at?: string | null
          id?: string
          promoter_name?: string | null
          token: string
        }
        Update: {
          active?: boolean
          created_at?: string
          event_id?: string
          expires_at?: string | null
          id?: string
          promoter_name?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_promoter_tokens_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          created_by: string | null
          event_date: string
          id: string
          name: string
          status: Database["public"]["Enums"]["event_status"]
          updated_at: string
          venue: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          event_date: string
          id?: string
          name: string
          status?: Database["public"]["Enums"]["event_status"]
          updated_at?: string
          venue: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          event_date?: string
          id?: string
          name?: string
          status?: Database["public"]["Enums"]["event_status"]
          updated_at?: string
          venue?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          event_id: string | null
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          created_at?: string
          event_id?: string | null
          full_name?: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          created_at?: string
          event_id?: string | null
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: [
          {
            foreignKeyName: "profiles_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_events: {
        Row: {
          actor_id: string | null
          actor_role: string
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          transaction_id: string
        }
        Insert: {
          actor_id?: string | null
          actor_role: string
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          transaction_id: string
        }
        Update: {
          actor_id?: string | null
          actor_role?: string
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaction_events_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          activated_at: string | null
          activated_by_cashier_id: string | null
          activated_by_promoter_token_id: string | null
          bureau_query_id: string
          cancellation_reason: string | null
          cancelled_at: string | null
          cep: string | null
          chosen_amount: number | null
          city: string | null
          complement: string | null
          cpf: string
          created_at: string
          document_photo_url: string | null
          email: string | null
          event_id: string
          first_due_date: string | null
          full_name: string | null
          id: string
          installment_value: number | null
          installments: number | null
          neighborhood: string | null
          number: string | null
          phone: string | null
          pin_attempts: number
          pin_hash: string | null
          pin_locked_until: string | null
          qr_code: string | null
          selfie_url: string | null
          state: string | null
          status: Database["public"]["Enums"]["transaction_status"]
          street: string | null
          terms_accepted_at: string | null
          updated_at: string
        }
        Insert: {
          activated_at?: string | null
          activated_by_cashier_id?: string | null
          activated_by_promoter_token_id?: string | null
          bureau_query_id: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cep?: string | null
          chosen_amount?: number | null
          city?: string | null
          complement?: string | null
          cpf: string
          created_at?: string
          document_photo_url?: string | null
          email?: string | null
          event_id: string
          first_due_date?: string | null
          full_name?: string | null
          id?: string
          installment_value?: number | null
          installments?: number | null
          neighborhood?: string | null
          number?: string | null
          phone?: string | null
          pin_attempts?: number
          pin_hash?: string | null
          pin_locked_until?: string | null
          qr_code?: string | null
          selfie_url?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          street?: string | null
          terms_accepted_at?: string | null
          updated_at?: string
        }
        Update: {
          activated_at?: string | null
          activated_by_cashier_id?: string | null
          activated_by_promoter_token_id?: string | null
          bureau_query_id?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cep?: string | null
          chosen_amount?: number | null
          city?: string | null
          complement?: string | null
          cpf?: string
          created_at?: string
          document_photo_url?: string | null
          email?: string | null
          event_id?: string
          first_due_date?: string | null
          full_name?: string | null
          id?: string
          installment_value?: number | null
          installments?: number | null
          neighborhood?: string | null
          number?: string | null
          phone?: string | null
          pin_attempts?: number
          pin_hash?: string | null
          pin_locked_until?: string | null
          qr_code?: string | null
          selfie_url?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          street?: string | null
          terms_accepted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_activated_by_promoter_token_id_fkey"
            columns: ["activated_by_promoter_token_id"]
            isOneToOne: false
            referencedRelation: "event_promoter_tokens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_bureau_query_id_fkey"
            columns: ["bureau_query_id"]
            isOneToOne: false
            referencedRelation: "bureau_queries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
    }
    Enums: {
      event_status: "draft" | "active" | "closed"
      transaction_status:
        | "pending_onboarding"
        | "awaiting_activation"
        | "activated"
        | "cancelled"
        | "expired"
      user_role: "admin" | "cashier"
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
      event_status: ["draft", "active", "closed"],
      transaction_status: [
        "pending_onboarding",
        "awaiting_activation",
        "activated",
        "cancelled",
        "expired",
      ],
      user_role: ["admin", "cashier"],
    },
  },
} as const
