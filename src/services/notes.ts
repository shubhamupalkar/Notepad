import { supabase } from '../lib/supabase';

// Fully typed interface matching the Supabase notes schema
export interface Note {
  id: string;
  title: string;
  content: string; // HTML content from Tiptap
  updated_at: string; // ISO String from PostgreSQL
  user_id?: string | null; // Links to auth.users.id
  is_trashed: boolean;
}

export const notesService = {
  /**
   * Fetches all active (non-trashed) notes ordered by last updated timestamp
   */
  async fetchAll(): Promise<Note[]> {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('is_trashed', false)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching notes from Supabase:', error);
      throw error;
    }

    return data || [];
  },

  /**
   * Fetches all trashed notes ordered by last updated timestamp
   */
  async fetchTrash(): Promise<Note[]> {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('is_trashed', true)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching trash notes from Supabase:', error);
      throw error;
    }

    return data || [];
  },

  /**
   * Creates a new note record
   */
  async create(note: Omit<Note, 'id' | 'updated_at' | 'is_trashed'> & { id?: string; user_id?: string }): Promise<Note> {
    const payload: Record<string, any> = {
      title: note.title,
      content: note.content,
      is_trashed: false,
    };

    if (note.user_id) {
      payload.user_id = note.user_id;
    }

    if (note.id) {
      payload.id = note.id;
    }

    const { data, error } = await supabase
      .from('notes')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error('Error creating note in Supabase:', error);
      throw error;
    }

    return data;
  },

  /**
   * Updates an existing note record
   */
  async update(id: string, updates: Partial<Omit<Note, 'id' | 'updated_at'>>): Promise<Note> {
    const { data, error } = await supabase
      .from('notes')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating note in Supabase:', error);
      throw error;
    }

    return data;
  },

  /**
   * Soft deletes a note by setting is_trashed to true
   */
  async trash(id: string): Promise<Note> {
    return this.update(id, { is_trashed: true });
  },

  /**
   * Restores a note by setting is_trashed to false
   */
  async restore(id: string): Promise<Note> {
    return this.update(id, { is_trashed: false });
  },

  /**
   * Permanently deletes a note record by ID from the database
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting note in Supabase:', error);
      throw error;
    }
  }
};
