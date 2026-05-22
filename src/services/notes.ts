import { supabase } from '../lib/supabase';

// Fully typed interface matching the Supabase notes schema
export interface Note {
  id: string;
  title: string;
  content: string; // HTML content from Tiptap
  updated_at: string; // ISO String from PostgreSQL
  user_id?: string | null; // For future Authentication support
}

export const notesService = {
  /**
   * Fetches all notes ordered by last updated timestamp
   */
  async fetchAll(): Promise<Note[]> {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching notes from Supabase:', error);
      throw error;
    }

    return data || [];
  },

  /**
   * Creates a new note record
   */
  async create(note: Omit<Note, 'id' | 'updated_at'> & { id?: string }): Promise<Note> {
    const payload: Record<string, any> = {
      title: note.title,
      content: note.content,
      user_id: note.user_id || null,
    };

    // If client passes an ID (e.g. newly generated UUID on client side), use it
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
   * Deletes a note record by ID
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
