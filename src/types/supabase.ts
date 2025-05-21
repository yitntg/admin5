export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: number
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: number
          name: string
          description: string
          price: number
          category: number
          inventory?: number
          rating?: number
          reviews?: number
          created_at: string
          brand?: string
          model?: string
          specifications?: string
          free_shipping?: boolean
          returnable?: boolean
          warranty?: boolean
        }
        Insert: {
          id?: number
          name: string
          description: string
          price: number
          category: number
          inventory?: number
          rating?: number
          reviews?: number
          created_at?: string
          brand?: string
          model?: string
          specifications?: string
          free_shipping?: boolean
          returnable?: boolean
          warranty?: boolean
        }
        Update: {
          id?: number
          name?: string
          description?: string
          price?: number
          category?: number
          inventory?: number
          rating?: number
          reviews?: number
          created_at?: string
          brand?: string
          model?: string
          specifications?: string
          free_shipping?: boolean
          returnable?: boolean
          warranty?: boolean
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 