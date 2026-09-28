export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      bodyweight_logs: {
        Row: {
          created_at: string
          id: string
          logged_at: string
          updated_at: string
          user_id: string
          weight_kg: number
        }
        Insert: {
          created_at?: string
          id?: string
          logged_at?: string
          updated_at?: string
          user_id: string
          weight_kg: number
        }
        Update: {
          created_at?: string
          id?: string
          logged_at?: string
          updated_at?: string
          user_id?: string
          weight_kg?: number
        }
        Relationships: []
      }
      exercise_prs: {
        Row: {
          created_at: string
          exercise_id: string
          id: string
          one_rep_max: number
          reps: number
          session_date: string
          user_id: string
          weight_kg: number
        }
        Insert: {
          created_at?: string
          exercise_id: string
          id?: string
          one_rep_max: number
          reps: number
          session_date: string
          user_id: string
          weight_kg: number
        }
        Update: {
          created_at?: string
          exercise_id?: string
          id?: string
          one_rep_max?: number
          reps?: number
          session_date?: string
          user_id?: string
          weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "exercise_prs_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_sets: {
        Row: {
          created_at: string
          difficulty: Database["public"]["Enums"]["set_difficulty"]
          execution_type: Database["public"]["Enums"]["execution_type"]
          exercise_id: string
          id: string
          reps: number
          session_date: string
          set_number: number
          updated_at: string
          user_id: string
          weight_kg: number | null
        }
        Insert: {
          created_at?: string
          difficulty?: Database["public"]["Enums"]["set_difficulty"]
          execution_type?: Database["public"]["Enums"]["execution_type"]
          exercise_id: string
          id?: string
          reps: number
          session_date?: string
          set_number: number
          updated_at?: string
          user_id: string
          weight_kg?: number | null
        }
        Update: {
          created_at?: string
          difficulty?: Database["public"]["Enums"]["set_difficulty"]
          execution_type?: Database["public"]["Enums"]["execution_type"]
          exercise_id?: string
          id?: string
          reps?: number
          session_date?: string
          set_number?: number
          updated_at?: string
          user_id?: string
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "exercise_sets_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          created_at: string
          id: string
          muscle_group: Database["public"]["Enums"]["muscle_group"]
          name: string
          position: number
          reps: number
          routine_id: string
          sets: number
          track_1rm: boolean
          tracks_load: boolean
          unit: Database["public"]["Enums"]["exercise_unit"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          muscle_group: Database["public"]["Enums"]["muscle_group"]
          name: string
          position?: number
          reps: number
          routine_id: string
          sets: number
          track_1rm?: boolean
          tracks_load?: boolean
          unit?: Database["public"]["Enums"]["exercise_unit"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          muscle_group?: Database["public"]["Enums"]["muscle_group"]
          name?: string
          position?: number
          reps?: number
          routine_id?: string
          sets?: number
          track_1rm?: boolean
          tracks_load?: boolean
          unit?: Database["public"]["Enums"]["exercise_unit"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercises_routine_id_fkey"
            columns: ["routine_id"]
            isOneToOne: false
            referencedRelation: "routines"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          goals: Database["public"]["Enums"]["training_goal"][]
          id: string
          modalities: Database["public"]["Enums"]["modality"][]
          onboarding_completed: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          goals?: Database["public"]["Enums"]["training_goal"][]
          id: string
          modalities?: Database["public"]["Enums"]["modality"][]
          onboarding_completed?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          goals?: Database["public"]["Enums"]["training_goal"][]
          id?: string
          modalities?: Database["public"]["Enums"]["modality"][]
          onboarding_completed?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      routines: {
        Row: {
          created_at: string
          id: string
          muscle_group: Database["public"]["Enums"]["muscle_group"]
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          muscle_group: Database["public"]["Enums"]["muscle_group"]
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          muscle_group?: Database["public"]["Enums"]["muscle_group"]
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      runs: {
        Row: {
          created_at: string
          distance_km: number
          duration_seconds: number
          id: string
          session_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          distance_km: number
          duration_seconds: number
          id?: string
          session_date?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          distance_km?: number
          duration_seconds?: number
          id?: string
          session_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      swim_goals: {
        Row: {
          created_at: string
          distance_m: number
          id: string
          stroke: Database["public"]["Enums"]["swim_stroke"]
          target_seconds: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          distance_m: number
          id?: string
          stroke: Database["public"]["Enums"]["swim_stroke"]
          target_seconds: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          distance_m?: number
          id?: string
          stroke?: Database["public"]["Enums"]["swim_stroke"]
          target_seconds?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      swim_times: {
        Row: {
          created_at: string
          distance_m: number
          id: string
          session_date: string
          stroke: Database["public"]["Enums"]["swim_stroke"]
          time_seconds: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          distance_m: number
          id?: string
          session_date?: string
          stroke: Database["public"]["Enums"]["swim_stroke"]
          time_seconds: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          distance_m?: number
          id?: string
          session_date?: string
          stroke?: Database["public"]["Enums"]["swim_stroke"]
          time_seconds?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      volume_milestones: {
        Row: {
          achieved_at: string
          created_at: string
          id: string
          threshold_kg: number
          user_id: string
        }
        Insert: {
          achieved_at: string
          created_at?: string
          id?: string
          threshold_kg: number
          user_id: string
        }
        Update: {
          achieved_at?: string
          created_at?: string
          id?: string
          threshold_kg?: number
          user_id?: string
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
      execution_type: "straight" | "mini_pause" | "rest_pause"
      exercise_unit: "reps" | "seconds"
      modality: "gym" | "swimming" | "running"
      muscle_group:
        | "back"
        | "chest"
        | "legs"
        | "shoulders"
        | "biceps"
        | "triceps"
        | "core"
      set_difficulty: "easy" | "medium" | "hard"
      swim_stroke: "freestyle" | "backstroke" | "breaststroke" | "butterfly"
      training_goal:
        | "build_muscle"
        | "lose_weight"
        | "improve_endurance"
        | "general_fitness"
        | "performance"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      execution_type: ["straight", "mini_pause", "rest_pause"],
      exercise_unit: ["reps", "seconds"],
      modality: ["gym", "swimming", "running"],
      muscle_group: [
        "back",
        "chest",
        "legs",
        "shoulders",
        "biceps",
        "triceps",
        "core",
      ],
      set_difficulty: ["easy", "medium", "hard"],
      swim_stroke: ["freestyle", "backstroke", "breaststroke", "butterfly"],
      training_goal: [
        "build_muscle",
        "lose_weight",
        "improve_endurance",
        "general_fitness",
        "performance",
      ],
    },
  },
} as const

