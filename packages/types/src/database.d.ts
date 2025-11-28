/**
 * Supabase Database Types
 * Generated types for database schema
 */
import { DatabaseUser } from './user';
import {
  DatabaseCard,
  DatabaseCardBenefit,
  DatabaseBank,
  DatabaseNetwork,
  DatabaseCardMetadata,
  DatabaseBinLookup,
} from './card';
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
      banks: {
        Row: DatabaseBank;
        Insert: Omit<DatabaseBank, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<DatabaseBank>;
        Relationships: [];
      };
      networks: {
        Row: DatabaseNetwork;
        Insert: Omit<DatabaseNetwork, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<DatabaseNetwork>;
        Relationships: [];
      };
      cards_metadata: {
        Row: DatabaseCardMetadata;
        Insert: Omit<
          DatabaseCardMetadata,
          'id' | 'created_at' | 'updated_at'
        > & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<DatabaseCardMetadata>;
        Relationships: [
          {
            foreignKeyName: 'cards_metadata_bank_id_fkey';
            columns: ['bank_id'];
            referencedRelation: 'banks';
            referencedColumns: ['id'];
          },
        ];
      };
      bin_lookup: {
        Row: DatabaseBinLookup;
        Insert: Omit<DatabaseBinLookup, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<DatabaseBinLookup>;
        Relationships: [
          {
            foreignKeyName: 'bin_lookup_bank_id_fkey';
            columns: ['bank_id'];
            referencedRelation: 'banks';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'bin_lookup_card_metadata_id_fkey';
            columns: ['card_metadata_id'];
            referencedRelation: 'cards_metadata';
            referencedColumns: ['id'];
          },
        ];
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
          {
            foreignKeyName: 'cards_bank_id_fkey';
            columns: ['bank_id'];
            referencedRelation: 'banks';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'cards_card_metadata_id_fkey';
            columns: ['card_metadata_id'];
            referencedRelation: 'cards_metadata';
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
//# sourceMappingURL=database.d.ts.map
