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
    PostgrestVersion: "17.1"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          code: string
          created_at: string
          description: string
          icon: string
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          description: string
          icon: string
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string
          icon?: string
          name?: string
        }
        Relationships: []
      }
      activity_log: {
        Row: {
          actor_id: string | null
          created_at: string
          event_type: string
          id: string
          resource_id: string | null
          resource_type: string | null
          summary: Json
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          resource_id?: string | null
          resource_type?: string | null
          summary?: Json
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          resource_id?: string | null
          resource_type?: string | null
          summary?: Json
        }
        Relationships: []
      }
      albums: {
        Row: {
          created_at: string
          created_by: string | null
          description: string
          id: string
          is_default: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          is_default?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          is_default?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      brownie_balances: {
        Row: {
          balance: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      brownie_transactions: {
        Row: {
          created_at: string
          id: string
          idempotency_key: string
          message: string
          points: number
          reason: string
          recipient_id: string
          redemption_request_id: string | null
          sender_id: string
          transaction_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          idempotency_key: string
          message?: string
          points: number
          reason?: string
          recipient_id: string
          redemption_request_id?: string | null
          sender_id: string
          transaction_type: string
        }
        Update: {
          created_at?: string
          id?: string
          idempotency_key?: string
          message?: string
          points?: number
          reason?: string
          recipient_id?: string
          redemption_request_id?: string | null
          sender_id?: string
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "brownie_transactions_redemption_request_id_fkey"
            columns: ["redemption_request_id"]
            isOneToOne: true
            referencedRelation: "redemption_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      bucket_list_items: {
        Row: {
          added_by: string
          category: string
          completed_at: string | null
          completed_by: string | null
          completion_note: string
          completion_photo_path: string | null
          created_at: string
          description: string
          id: string
          image_path: string | null
          is_completed: boolean
          priority: string
          title: string
          updated_at: string
        }
        Insert: {
          added_by: string
          category: string
          completed_at?: string | null
          completed_by?: string | null
          completion_note?: string
          completion_photo_path?: string | null
          created_at?: string
          description?: string
          id?: string
          image_path?: string | null
          is_completed?: boolean
          priority?: string
          title: string
          updated_at?: string
        }
        Update: {
          added_by?: string
          category?: string
          completed_at?: string | null
          completed_by?: string | null
          completion_note?: string
          completion_photo_path?: string | null
          created_at?: string
          description?: string
          id?: string
          image_path?: string | null
          is_completed?: boolean
          priority?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      daily_surprise_prompts: {
        Row: {
          content: string
          created_at: string
          prompt_type: string
          sequence_no: number
        }
        Insert: {
          content: string
          created_at?: string
          prompt_type: string
          sequence_no: number
        }
        Update: {
          content?: string
          created_at?: string
          prompt_type?: string
          sequence_no?: number
        }
        Relationships: []
      }
      daily_surprises: {
        Row: {
          created_at: string
          memory_id: string | null
          prompt_sequence: number
          surprise_date: string
        }
        Insert: {
          created_at?: string
          memory_id?: string | null
          prompt_sequence: number
          surprise_date: string
        }
        Update: {
          created_at?: string
          memory_id?: string | null
          prompt_sequence?: number
          surprise_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_surprises_memory_id_fkey"
            columns: ["memory_id"]
            isOneToOne: false
            referencedRelation: "memories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_surprises_prompt_sequence_fkey"
            columns: ["prompt_sequence"]
            isOneToOne: false
            referencedRelation: "daily_surprise_prompts"
            referencedColumns: ["sequence_no"]
          },
        ]
      }
      game_answers: {
        Row: {
          answer_text: string
          created_at: string
          id: string
          selected_index: number | null
          session_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          answer_text?: string
          created_at?: string
          id?: string
          selected_index?: number | null
          session_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          answer_text?: string
          created_at?: string
          id?: string
          selected_index?: number | null
          session_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_answers_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      game_question_secrets: {
        Row: {
          answer_text: string
          created_at: string
          created_by: string
          lie_index: number | null
          question_id: string
          truth_one: string | null
          truth_three: string | null
          truth_two: string | null
          updated_at: string
        }
        Insert: {
          answer_text: string
          created_at?: string
          created_by: string
          lie_index?: number | null
          question_id: string
          truth_one?: string | null
          truth_three?: string | null
          truth_two?: string | null
          updated_at?: string
        }
        Update: {
          answer_text?: string
          created_at?: string
          created_by?: string
          lie_index?: number | null
          question_id?: string
          truth_one?: string | null
          truth_three?: string | null
          truth_two?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_question_secrets_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: true
            referencedRelation: "game_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      game_questions: {
        Row: {
          created_at: string
          created_by: string
          id: string
          is_active: boolean
          prompt: string
          question_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          is_active?: boolean
          prompt: string
          question_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean
          prompt?: string
          question_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      game_sessions: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string
          game_type: string
          id: string
          opponent_id: string
          prompt: string
          question_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by: string
          game_type: string
          id?: string
          opponent_id: string
          prompt?: string
          question_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string
          game_type?: string
          id?: string
          opponent_id?: string
          prompt?: string
          question_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_sessions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "game_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      happiness_notes: {
        Row: {
          category: string
          content: string
          created_at: string
          created_by: string
          id: string
          updated_at: string
        }
        Insert: {
          category: string
          content: string
          created_at?: string
          created_by: string
          id?: string
          updated_at?: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      letter_contents: {
        Row: {
          body: string
          created_at: string
          letter_id: string
          title: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          letter_id: string
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          letter_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "letter_contents_letter_id_fkey"
            columns: ["letter_id"]
            isOneToOne: true
            referencedRelation: "letters"
            referencedColumns: ["id"]
          },
        ]
      }
      letters: {
        Row: {
          attachment_path: string | null
          created_at: string
          id: string
          letter_type: string
          read_at: string | null
          recipient_id: string
          sender_id: string
          sent_at: string | null
          status: string
          unlock_at: string
          unlock_notification_sent: boolean
          updated_at: string
        }
        Insert: {
          attachment_path?: string | null
          created_at?: string
          id?: string
          letter_type: string
          read_at?: string | null
          recipient_id: string
          sender_id: string
          sent_at?: string | null
          status?: string
          unlock_at?: string
          unlock_notification_sent?: boolean
          updated_at?: string
        }
        Update: {
          attachment_path?: string | null
          created_at?: string
          id?: string
          letter_type?: string
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
          sent_at?: string | null
          status?: string
          unlock_at?: string
          unlock_notification_sent?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      memories: {
        Row: {
          album_id: string | null
          caption: string
          created_at: string
          id: string
          is_featured: boolean
          location: string
          memory_date: string
          occasion: string
          photo_path: string
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          album_id?: string | null
          caption?: string
          created_at?: string
          id?: string
          is_featured?: boolean
          location?: string
          memory_date?: string
          occasion?: string
          photo_path: string
          updated_at?: string
          uploaded_by: string
        }
        Update: {
          album_id?: string | null
          caption?: string
          created_at?: string
          id?: string
          is_featured?: boolean
          location?: string
          memory_date?: string
          occasion?: string
          photo_path?: string
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "memories_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "albums"
            referencedColumns: ["id"]
          },
        ]
      }
      memory_capsule_contents: {
        Row: {
          capsule_id: string
          created_at: string
          message: string
          updated_at: string
        }
        Insert: {
          capsule_id: string
          created_at?: string
          message?: string
          updated_at?: string
        }
        Update: {
          capsule_id?: string
          created_at?: string
          message?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "memory_capsule_contents_capsule_id_fkey"
            columns: ["capsule_id"]
            isOneToOne: true
            referencedRelation: "memory_capsules"
            referencedColumns: ["id"]
          },
        ]
      }
      memory_capsules: {
        Row: {
          created_at: string
          id: string
          photo_path: string | null
          recipient_id: string
          sender_id: string
          unlock_at: string
          unlock_notification_sent: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          photo_path?: string | null
          recipient_id: string
          sender_id: string
          unlock_at: string
          unlock_notification_sent?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          photo_path?: string | null
          recipient_id?: string
          sender_id?: string
          unlock_at?: string
          unlock_notification_sent?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      memory_favourites: {
        Row: {
          created_at: string
          memory_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          memory_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          memory_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memory_favourites_memory_id_fkey"
            columns: ["memory_id"]
            isOneToOne: false
            referencedRelation: "memories"
            referencedColumns: ["id"]
          },
        ]
      }
      memory_tags: {
        Row: {
          created_at: string
          created_by: string
          id: string
          memory_id: string
          tag: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          memory_id: string
          tag: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          memory_id?: string
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "memory_tags_memory_id_fkey"
            columns: ["memory_id"]
            isOneToOne: false
            referencedRelation: "memories"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: string | null
          body: string
          created_at: string
          id: string
          notification_type: string
          read_at: string | null
          recipient_id: string
          resource_id: string | null
          resource_type: string | null
          title: string
        }
        Insert: {
          actor_id?: string | null
          body?: string
          created_at?: string
          id?: string
          notification_type: string
          read_at?: string | null
          recipient_id: string
          resource_id?: string | null
          resource_type?: string | null
          title: string
        }
        Update: {
          actor_id?: string | null
          body?: string
          created_at?: string
          id?: string
          notification_type?: string
          read_at?: string | null
          recipient_id?: string
          resource_id?: string | null
          resource_type?: string | null
          title?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_path: string | null
          bio: string
          birthday: string | null
          created_at: string
          display_name: string
          notification_preferences: Json
          theme_preferences: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_path?: string | null
          bio?: string
          birthday?: string | null
          created_at?: string
          display_name: string
          notification_preferences?: Json
          theme_preferences?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_path?: string | null
          bio?: string
          birthday?: string | null
          created_at?: string
          display_name?: string
          notification_preferences?: Json
          theme_preferences?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      redemption_requests: {
        Row: {
          accepted_at: string | null
          completed_at: string | null
          created_at: string
          id: string
          idempotency_key: string
          message: string
          points_cost: number
          requester_id: string
          response: string
          reward_id: string
          reward_owner_id: string
          status: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          idempotency_key: string
          message?: string
          points_cost: number
          requester_id: string
          response?: string
          reward_id: string
          reward_owner_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          idempotency_key?: string
          message?: string
          points_cost?: number
          requester_id?: string
          response?: string
          reward_id?: string
          reward_owner_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "redemption_requests_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      relationship_members: {
        Row: {
          created_at: string
          display_name: string
          email: string
          slot: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          display_name: string
          email: string
          slot: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          display_name?: string
          email?: string
          slot?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      rewards: {
        Row: {
          category: string
          cover_path: string | null
          created_at: string
          created_by: string
          description: string
          id: string
          is_active: boolean
          points_cost: number
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          cover_path?: string | null
          created_at?: string
          created_by: string
          description?: string
          id?: string
          is_active?: boolean
          points_cost: number
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          cover_path?: string | null
          created_at?: string
          created_by?: string
          description?: string
          id?: string
          is_active?: boolean
          points_cost?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      timeline_events: {
        Row: {
          category: string
          created_at: string
          created_by: string
          description: string
          event_date: string
          id: string
          location: string
          photo_path: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          created_by: string
          description?: string
          event_date: string
          id?: string
          location?: string
          photo_path?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string
          description?: string
          event_date?: string
          id?: string
          location?: string
          photo_path?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_code: string
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_code: string
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_code?: string
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_code_fkey"
            columns: ["achievement_code"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["code"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_reward_request: { Args: { p_request_id: string }; Returns: string }
      award_brownies: {
        Args: {
          p_idempotency_key: string
          p_message: string
          p_points: number
          p_reason: string
          p_recipient_id: string
        }
        Returns: string
      }
      can_read_private_storage_object: {
        Args: { p_bucket_id: string; p_name: string }
        Returns: boolean
      }
      complete_reward: { Args: { p_request_id: string }; Returns: string }
      create_memory_capsule: {
        Args: {
          p_message: string
          p_photo_path: string
          p_recipient_id: string
          p_unlock_at: string
        }
        Returns: string
      }
      decline_reward_request: {
        Args: { p_request_id: string; p_response?: string }
        Returns: string
      }
      get_daily_surprise: {
        Args: never
        Returns: {
          content: string
          memory_id: string
          prompt_type: string
          surprise_date: string
        }[]
      }
      get_pair_member_display_names: {
        Args: never
        Returns: {
          display_name: string
          user_id: string
        }[]
      }
      is_relationship_member: { Args: never; Returns: boolean }
      process_due_content_unlocks: { Args: never; Returns: number }
      refresh_pair_achievements: { Args: never; Returns: undefined }
      reset_brownie_bank: { Args: never; Returns: undefined }
      request_reward: {
        Args: {
          p_idempotency_key: string
          p_message: string
          p_reward_id: string
        }
        Returns: string
      }
      save_letter_draft: {
        Args: {
          p_body: string
          p_letter_id: string
          p_letter_type: string
          p_recipient_id: string
          p_title: string
          p_unlock_at: string
        }
        Returns: string
      }
      send_letter: { Args: { p_letter_id: string }; Returns: string }
      unlock_achievement: {
        Args: { p_code: string; p_user_id: string }
        Returns: undefined
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
