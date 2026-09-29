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
      heartbeats: {
        Row: {
          app_version: string | null
          created_at: string
          device_id: string
          id: string
          status: string | null
          storage_available: string | null
        }
        Insert: {
          app_version?: string | null
          created_at?: string
          device_id: string
          id?: string
          status?: string | null
          storage_available?: string | null
        }
        Update: {
          app_version?: string | null
          created_at?: string
          device_id?: string
          id?: string
          status?: string | null
          storage_available?: string | null
        }
        Relationships: []
      }
      media: {
        Row: {
          created_at: string
          file_size: number | null
          file_url: string
          id: string
          title: string
          type: Database["public"]["Enums"]["media_type"]
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          file_size?: number | null
          file_url: string
          id?: string
          title: string
          type: Database["public"]["Enums"]["media_type"]
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          file_size?: number | null
          file_url?: string
          id?: string
          title?: string
          type?: Database["public"]["Enums"]["media_type"]
          uploaded_by?: string | null
        }
        Relationships: []
      }
      playlist_items: {
        Row: {
          created_at: string
          display_duration: number
          id: string
          media_id: string
          order_number: number
          playlist_id: string
        }
        Insert: {
          created_at?: string
          display_duration?: number
          id?: string
          media_id: string
          order_number?: number
          playlist_id: string
        }
        Update: {
          created_at?: string
          display_duration?: number
          id?: string
          media_id?: string
          order_number?: number
          playlist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlist_items_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playlist_items_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
        ]
      }
      playlists: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          version: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          version?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
        }
        Relationships: []
      }
      proof_of_play: {
        Row: {
          created_at: string
          device_id: string
          end_time: string | null
          id: string
          media_name: string
          start_time: string
        }
        Insert: {
          created_at?: string
          device_id: string
          end_time?: string | null
          id?: string
          media_name: string
          start_time: string
        }
        Update: {
          created_at?: string
          device_id?: string
          end_time?: string | null
          id?: string
          media_name?: string
          start_time?: string
        }
        Relationships: []
      }
      schedules: {
        Row: {
          active_days: number[]
          created_at: string
          end_time: string
          id: string
          playlist_id: string
          screen_id: string
          start_time: string
        }
        Insert: {
          active_days?: number[]
          created_at?: string
          end_time: string
          id?: string
          playlist_id: string
          screen_id: string
          start_time: string
        }
        Update: {
          active_days?: number[]
          created_at?: string
          end_time?: string
          id?: string
          playlist_id?: string
          screen_id?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedules_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_screen_id_fkey"
            columns: ["screen_id"]
            isOneToOne: false
            referencedRelation: "screens"
            referencedColumns: ["id"]
          },
        ]
      }
      screens: {
        Row: {
          app_version: string | null
          created_at: string
          current_playlist_id: string | null
          device_id: string
          id: string
          is_paired: boolean
          last_seen: string | null
          paired_at: string | null
          pairing_code: string | null
          pairing_code_expires_at: string | null
          screen_name: string
          screenshot_url: string | null
          status: Database["public"]["Enums"]["screen_status"]
          store_id: string | null
          updated_at: string
        }
        Insert: {
          app_version?: string | null
          created_at?: string
          current_playlist_id?: string | null
          device_id: string
          id?: string
          is_paired?: boolean
          last_seen?: string | null
          paired_at?: string | null
          pairing_code?: string | null
          pairing_code_expires_at?: string | null
          screen_name: string
          screenshot_url?: string | null
          status?: Database["public"]["Enums"]["screen_status"]
          store_id?: string | null
          updated_at?: string
        }
        Update: {
          app_version?: string | null
          created_at?: string
          current_playlist_id?: string | null
          device_id?: string
          id?: string
          is_paired?: boolean
          last_seen?: string | null
          paired_at?: string | null
          pairing_code?: string | null
          pairing_code_expires_at?: string | null
          screen_name?: string
          screenshot_url?: string | null
          status?: Database["public"]["Enums"]["screen_status"]
          store_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "screens_current_playlist_id_fkey"
            columns: ["current_playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "screens_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      screenshots: {
        Row: {
          created_at: string
          device_id: string
          id: string
          screenshot_url: string
        }
        Insert: {
          created_at?: string
          device_id: string
          id?: string
          screenshot_url: string
        }
        Update: {
          created_at?: string
          device_id?: string
          id?: string
          screenshot_url?: string
        }
        Relationships: []
      }
      stores: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          created_at: string
          id: string
          name: string
          timezone: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          name: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          name?: string
          timezone?: string
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_or_super: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "super_admin" | "admin" | "viewer"
      media_type: "video" | "image" | "pdf" | "url"
      screen_status: "online" | "offline" | "unknown" | "warning"
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
    Enums: {
      app_role: ["super_admin", "admin", "viewer"],
      media_type: ["video", "image", "pdf", "url"],
      screen_status: ["online", "offline", "unknown", "warning"],
    },
  },
} as const
