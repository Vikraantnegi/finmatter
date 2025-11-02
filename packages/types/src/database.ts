/**
 * Supabase Database Types
 * Generated types for database schema
 */

import { DatabaseUser } from './user';
import { DatabaseCard, DatabaseCardBenefit } from './card';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: DatabaseUser;
        Insert: Omit<DatabaseUser, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<DatabaseUser>;
        Relationships: [];
      };
      cards: {
        Row: DatabaseCard;
        Insert: Omit<DatabaseCard, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<DatabaseCard>;
        Relationships: [
          {
            foreignKeyName: 'cards_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      card_benefits: {
        Row: DatabaseCardBenefit;
        Insert: Omit<
          DatabaseCardBenefit,
          'id' | 'created_at' | 'updated_at'
        > & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<DatabaseCardBenefit>;
        Relationships: [
          {
            foreignKeyName: 'card_benefits_card_id_fkey';
            columns: ['card_id'];
            referencedRelation: 'cards';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
}
