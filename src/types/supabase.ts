/**
 * TypeScript types for Supabase Database Schema
 * Matching public schema defined in supabase/migrations/20261029000000_schema_and_rls.sql
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'student' | 'teacher' | 'admin';
export type SubjectDomain = 'hoa-hoc' | 'vat-li' | 'sinh-hoc' | 'trai-dat-vu-tru';
export type DifficultyLevel = 'Cơ bản' | 'Trung bình' | 'Nâng cao';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          avatar_url: string | null;
          grade: number | null;
          school: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          avatar_url?: string | null;
          grade?: number | null;
          school?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          avatar_url?: string | null;
          grade?: number | null;
          school?: string | null;
          updated_at?: string;
        };
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role: UserRole;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role?: UserRole;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: UserRole;
        };
      };
      topics: {
        Row: {
          id: string;
          grade: number;
          domain: SubjectDomain;
          title: string;
          code: string;
          description: string;
          order_index: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          grade: number;
          domain: SubjectDomain;
          title: string;
          code: string;
          description: string;
          order_index?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          grade?: number;
          domain?: SubjectDomain;
          title?: string;
          code?: string;
          description?: string;
          order_index?: number;
        };
      };
      lessons: {
        Row: {
          id: string;
          topic_id: string | null;
          grade: number;
          domain: SubjectDomain;
          code: string;
          slug: string | null;
          title: string;
          summary: string;
          content: string;
          duration_minutes: number;
          view_count: number;
          thumbnail_url: string | null;
          video_url: string | null;
          order_index: number;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          topic_id?: string | null;
          grade: number;
          domain: SubjectDomain;
          code: string;
          slug?: string | null;
          title: string;
          summary: string;
          content: string;
          duration_minutes?: number;
          view_count?: number;
          thumbnail_url?: string | null;
          video_url?: string | null;
          order_index?: number;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          topic_id?: string | null;
          grade?: number;
          domain?: SubjectDomain;
          code?: string;
          slug?: string | null;
          title?: string;
          summary?: string;
          content?: string;
          duration_minutes?: number;
          view_count?: number;
          thumbnail_url?: string | null;
          video_url?: string | null;
          order_index?: number;
          is_published?: boolean;
          updated_at?: string;
        };
      };
      lesson_assets: {
        Row: {
          id: string;
          lesson_id: string | null;
          title: string;
          format: string;
          type: string;
          file_size: string;
          file_url: string;
          storage_path: string | null;
          downloads_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          lesson_id?: string | null;
          title: string;
          format: string;
          type: string;
          file_size: string;
          file_url: string;
          storage_path?: string | null;
          downloads_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          lesson_id?: string | null;
          title?: string;
          format?: string;
          type?: string;
          file_size?: string;
          file_url?: string;
          storage_path?: string | null;
          downloads_count?: number;
        };
      };
      simulations: {
        Row: {
          id: string;
          slug: string;
          title: string;
          type: string;
          category: string;
          domain: SubjectDomain;
          grade: number;
          difficulty: DifficultyLevel;
          description: string;
          learning_goal: string;
          key_concepts: string[];
          thumbnail_url: string;
          is_published: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          type: string;
          category: string;
          domain: SubjectDomain;
          grade: number;
          difficulty: DifficultyLevel;
          description: string;
          learning_goal: string;
          key_concepts?: string[];
          thumbnail_url: string;
          is_published?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          type?: string;
          category?: string;
          domain?: SubjectDomain;
          grade?: number;
          difficulty?: DifficultyLevel;
          description?: string;
          learning_goal?: string;
          key_concepts?: string[];
          thumbnail_url?: string;
          is_published?: boolean;
        };
      };
      quizzes: {
        Row: {
          id: string;
          lesson_id: string | null;
          grade: number;
          domain: SubjectDomain;
          title: string;
          duration_minutes: number;
          pass_score: number;
          is_published: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          lesson_id?: string | null;
          grade: number;
          domain: SubjectDomain;
          title: string;
          duration_minutes?: number;
          pass_score?: number;
          is_published?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          lesson_id?: string | null;
          grade?: number;
          domain?: SubjectDomain;
          title?: string;
          duration_minutes?: number;
          pass_score?: number;
          is_published?: boolean;
        };
      };
      questions: {
        Row: {
          id: string;
          quiz_id: string;
          question_text: string;
          explanation: string | null;
          points: number;
          order_index: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          quiz_id: string;
          question_text: string;
          explanation?: string | null;
          points?: number;
          order_index?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          quiz_id?: string;
          question_text?: string;
          explanation?: string | null;
          points?: number;
          order_index?: number;
        };
      };
      question_options: {
        Row: {
          id: string;
          question_id: string;
          option_text: string;
          order_index: number;
        };
        Insert: {
          id?: string;
          question_id: string;
          option_text: string;
          order_index?: number;
        };
        Update: {
          id?: string;
          question_id?: string;
          option_text?: string;
          order_index?: number;
        };
      };
      quiz_attempts: {
        Row: {
          id: string;
          user_id: string;
          quiz_id: string;
          score: number;
          max_score: number;
          passed: boolean;
          started_at: string;
          completed_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          quiz_id: string;
          score?: number;
          max_score?: number;
          passed?: boolean;
          started_at?: string;
          completed_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          quiz_id?: string;
          score?: number;
          max_score?: number;
          passed?: boolean;
          completed_at?: string;
        };
      };
      attempt_answers: {
        Row: {
          id: string;
          attempt_id: string;
          question_id: string;
          selected_option_id: string | null;
          is_correct: boolean;
        };
        Insert: {
          id?: string;
          attempt_id: string;
          question_id: string;
          selected_option_id?: string | null;
          is_correct?: boolean;
        };
        Update: {
          id?: string;
          attempt_id?: string;
          question_id?: string;
          selected_option_id?: string | null;
          is_correct?: boolean;
        };
      };
      lesson_progress: {
        Row: {
          id: string;
          user_id: string;
          lesson_id: string;
          completed: boolean;
          bookmarked: boolean;
          last_accessed_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          lesson_id: string;
          completed?: boolean;
          bookmarked?: boolean;
          last_accessed_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          lesson_id?: string;
          completed?: boolean;
          bookmarked?: boolean;
          last_accessed_at?: string;
          completed_at?: string | null;
        };
      };
    };
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_teacher_or_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      get_user_role: {
        Args: { p_user_id: string };
        Returns: string;
      };
      submit_quiz_attempt: {
        Args: {
          p_quiz_id: string;
          p_answers: Json;
        };
        Returns: {
          attempt_id: string;
          score: number;
          max_score: number;
          correct_count: number;
          total_questions: number;
          passed: boolean;
          details: Array<{ question_id: string; is_correct: boolean }>;
        };
      };
    };
  };
}
