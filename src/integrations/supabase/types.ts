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
      blocked_slots: {
        Row: {
          block_date: string
          created_at: string
          end_time: string
          id: string
          reason: string
          start_time: string
        }
        Insert: {
          block_date: string
          created_at?: string
          end_time: string
          id?: string
          reason?: string
          start_time: string
        }
        Update: {
          block_date?: string
          created_at?: string
          end_time?: string
          id?: string
          reason?: string
          start_time?: string
        }
        Relationships: []
      }
      gallery_images: {
        Row: {
          caption: string
          created_at: string
          id: string
          image_url: string
          sort_order: number
        }
        Insert: {
          caption?: string
          created_at?: string
          id?: string
          image_url: string
          sort_order?: number
        }
        Update: {
          caption?: string
          created_at?: string
          id?: string
          image_url?: string
          sort_order?: number
        }
        Relationships: []
      }
      reservations: {
        Row: {
          created_at: string
          customer_name: string
          id: string
          notes: string
          phone: string
          reservation_date: string
          reservation_time: string
          service_id: string | null
          service_name: string
          status: Database["public"]["Enums"]["reservation_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_name: string
          id?: string
          notes?: string
          phone: string
          reservation_date: string
          reservation_time: string
          service_id?: string | null
          service_name?: string
          status?: Database["public"]["Enums"]["reservation_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_name?: string
          id?: string
          notes?: string
          phone?: string
          reservation_date?: string
          reservation_time?: string
          service_id?: string | null
          service_name?: string
          status?: Database["public"]["Enums"]["reservation_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string
          created_at: string
          customer_name: string
          id: string
          is_published: boolean
          rating: number
          sort_order: number
        }
        Insert: {
          comment?: string
          created_at?: string
          customer_name: string
          id?: string
          is_published?: boolean
          rating?: number
          sort_order?: number
        }
        Update: {
          comment?: string
          created_at?: string
          customer_name?: string
          id?: string
          is_published?: boolean
          rating?: number
          sort_order?: number
        }
        Relationships: []
      }
      services: {
        Row: {
          created_at: string
          description: string
          duration_minutes: number
          id: string
          is_active: boolean
          name: string
          price: number
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string
          duration_minutes?: number
          id?: string
          is_active?: boolean
          name: string
          price?: number
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string
          duration_minutes?: number
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          sort_order?: number
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          about_text: string
          address: string
          barber_name: string
          hero_image_url: string | null
          id: number
          instagram_url: string
          logo_url: string | null
          map_url: string
          phone: string
          slogan: string
          slot_minutes: number
          updated_at: string
          whatsapp: string
        }
        Insert: {
          about_text?: string
          address?: string
          barber_name?: string
          hero_image_url?: string | null
          id?: number
          instagram_url?: string
          logo_url?: string | null
          map_url?: string
          phone?: string
          slogan?: string
          slot_minutes?: number
          updated_at?: string
          whatsapp?: string
        }
        Update: {
          about_text?: string
          address?: string
          barber_name?: string
          hero_image_url?: string | null
          id?: number
          instagram_url?: string
          logo_url?: string | null
          map_url?: string
          phone?: string
          slogan?: string
          slot_minutes?: number
          updated_at?: string
          whatsapp?: string
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
      working_hours: {
        Row: {
          break_end: string | null
          break_start: string | null
          close_time: string
          day_of_week: number
          is_closed: boolean
          open_time: string
        }
        Insert: {
          break_end?: string | null
          break_start?: string | null
          close_time?: string
          day_of_week: number
          is_closed?: boolean
          open_time?: string
        }
        Update: {
          break_end?: string | null
          break_start?: string | null
          close_time?: string
          day_of_week?: number
          is_closed?: boolean
          open_time?: string
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
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin"
      reservation_status: "pending" | "confirmed" | "completed" | "cancelled"
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
      app_role: ["admin"],
      reservation_status: ["pending", "confirmed", "completed", "cancelled"],
    },
  },
} as const
