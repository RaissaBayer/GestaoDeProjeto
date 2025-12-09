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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      administrators: {
        Row: {
          created_at: string
          email: string | null
          full_name: string
          id: string
          password_hash: string
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          password_hash: string
          updated_at?: string
          username: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          password_hash?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      class_registrations: {
        Row: {
          attended: boolean | null
          class_id: string
          confirmed_presence: boolean | null
          created_at: string
          donation_amount: string | null
          donation_type: string | null
          id: string
          payment_method: string | null
          payment_proof_url: string | null
          student_email: string
          student_name: string
          student_phone: string | null
          student_registration_number: string
          updated_at: string
        }
        Insert: {
          attended?: boolean | null
          class_id: string
          confirmed_presence?: boolean | null
          created_at?: string
          donation_amount?: string | null
          donation_type?: string | null
          id?: string
          payment_method?: string | null
          payment_proof_url?: string | null
          student_email: string
          student_name: string
          student_phone?: string | null
          student_registration_number?: string
          updated_at?: string
        }
        Update: {
          attended?: boolean | null
          class_id?: string
          confirmed_presence?: boolean | null
          created_at?: string
          donation_amount?: string | null
          donation_type?: string | null
          id?: string
          payment_method?: string | null
          payment_proof_url?: string | null
          student_email?: string
          student_name?: string
          student_phone?: string | null
          student_registration_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_registrations_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "scheduled_classes"
            referencedColumns: ["id"]
          },
        ]
      }
      donations: {
        Row: {
          amount: number | null
          class_id: string | null
          created_at: string
          description: string | null
          donation_date: string | null
          food_weight_kg: number | null
          id: string
          institution_donated_to: string | null
          institution_id: string | null
          registration_id: string | null
          type: string
          updated_at: string
        }
        Insert: {
          amount?: number | null
          class_id?: string | null
          created_at?: string
          description?: string | null
          donation_date?: string | null
          food_weight_kg?: number | null
          id?: string
          institution_donated_to?: string | null
          institution_id?: string | null
          registration_id?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          amount?: number | null
          class_id?: string | null
          created_at?: string
          description?: string | null
          donation_date?: string | null
          food_weight_kg?: number | null
          id?: string
          institution_donated_to?: string | null
          institution_id?: string | null
          registration_id?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "donations_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "scheduled_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donations_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donations_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "class_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      donations_institutions: {
        Row: {
          amount: number | null
          created_at: string
          description: string | null
          donation_date: string | null
          food_weight_kg: number | null
          id: string
          institution_id: string | null
          type: string
          updated_at: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          description?: string | null
          donation_date?: string | null
          food_weight_kg?: number | null
          id?: string
          institution_id?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          description?: string | null
          donation_date?: string | null
          food_weight_kg?: number | null
          id?: string
          institution_id?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "donations_institutions_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          body: string
          created_at: string
          id: string
          signature: string
          subject: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          signature: string
          subject: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          signature?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      institutions: {
        Row: {
          address: string | null
          contact_info: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_info?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          type: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_info?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      payment_details: {
        Row: {
          admin_notes: string | null
          amount: number | null
          created_at: string | null
          id: string
          payment_date: string | null
          payment_type: string
          proof_file_name: string | null
          proof_file_url: string | null
          registration_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          amount?: number | null
          created_at?: string | null
          id?: string
          payment_date?: string | null
          payment_type: string
          proof_file_name?: string | null
          proof_file_url?: string | null
          registration_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          amount?: number | null
          created_at?: string | null
          id?: string
          payment_date?: string | null
          payment_type?: string
          proof_file_name?: string | null
          proof_file_url?: string | null
          registration_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_details_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "class_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_statistics: {
        Row: {
          created_at: string
          id: string
          total_classes: number
          total_students: number
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          id?: string
          total_classes?: number
          total_students?: number
          updated_at?: string
          year: number
        }
        Update: {
          created_at?: string
          id?: string
          total_classes?: number
          total_students?: number
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      scheduled_classes: {
        Row: {
          created_at: string
          date: string
          end_time: string
          file_url: string | null
          id: string
          location: string
          materials_needed: string | null
          max_participants: number
          start_time: string
          status: string | null
          subject_id: string
          teacher_id: string | null
          title: string
          topics: string[] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          end_time: string
          file_url?: string | null
          id?: string
          location: string
          materials_needed?: string | null
          max_participants?: number
          start_time: string
          status?: string | null
          subject_id: string
          teacher_id?: string | null
          title: string
          topics?: string[] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          end_time?: string
          file_url?: string | null
          id?: string
          location?: string
          materials_needed?: string | null
          max_participants?: number
          start_time?: string
          status?: string | null
          subject_id?: string
          teacher_id?: string | null
          title?: string
          topics?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_classes_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_classes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "volunteer_teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_scheduled: boolean | null
          is_seeking_teachers: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_scheduled?: boolean | null
          is_seeking_teachers?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_scheduled?: boolean | null
          is_seeking_teachers?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      volunteer_teachers: {
        Row: {
          academic_history_url: string
          approved: boolean | null
          availability: string | null
          course: string | null
          created_at: string
          email: string
          experience_level: string | null
          full_name: string
          id: string
          motivation: string | null
          phone: string | null
          photo_url: string | null
          registration_number: string
          status: string | null
          subjects_can_teach: string[]
          university: string | null
          updated_at: string
        }
        Insert: {
          academic_history_url: string
          approved?: boolean | null
          availability?: string | null
          course?: string | null
          created_at?: string
          email: string
          experience_level?: string | null
          full_name: string
          id?: string
          motivation?: string | null
          phone?: string | null
          photo_url?: string | null
          registration_number: string
          status?: string | null
          subjects_can_teach: string[]
          university?: string | null
          updated_at?: string
        }
        Update: {
          academic_history_url?: string
          approved?: boolean | null
          availability?: string | null
          course?: string | null
          created_at?: string
          email?: string
          experience_level?: string | null
          full_name?: string
          id?: string
          motivation?: string | null
          phone?: string | null
          photo_url?: string | null
          registration_number?: string
          status?: string | null
          subjects_can_teach?: string[]
          university?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_create_institution: {
        Args: {
          p_address?: string
          p_admin_id: string
          p_contact_info?: string
          p_description?: string
          p_name: string
          p_type: string
        }
        Returns: string
      }
      admin_delete_institution: {
        Args: { p_admin_id: string; p_institution_id: string }
        Returns: undefined
      }
      admin_update_institution: {
        Args: {
          p_address?: string
          p_admin_id: string
          p_contact_info?: string
          p_description?: string
          p_institution_id: string
          p_name: string
          p_type: string
        }
        Returns: undefined
      }
      hash_password: {
        Args: { password: string }
        Returns: string
      }
      set_current_admin: {
        Args: { admin_username: string }
        Returns: undefined
      }
      set_current_username: {
        Args: { username_param: string }
        Returns: undefined
      }
      simple_hash: {
        Args: { input_text: string }
        Returns: string
      }
      verify_password: {
        Args: { hash: string; password: string }
        Returns: boolean
      }
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
    Enums: {},
  },
} as const
