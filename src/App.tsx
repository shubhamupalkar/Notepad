import { useState, useEffect, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { Plus, Trash2, ArrowLeft, RefreshCw, Cloud, AlertCircle, Copy, Check } from 'lucide-react';
import { isSupabaseConfigured } from './lib/supabase';
import { notesService } from './services/notes';
import type { Note } from './services/notes';

// --- Custom Debounce Hook ---
function useDebouncedCallback<T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<any>(null);
  const callbackRef = useRef(callback);
  
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args);
    }, delay);
  }, [delay]);
}

// --- Helper to strip HTML tags for card content preview ---
function stripHtml(html: string): string {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

// --- Sub-component: Note Editor ---
interface NoteEditorProps {
  note: Note;
  saveStatus: 'saved' | 'saving' | 'error';
  onUpdateContent: (content: string) => void;
  onUpdateTitle: (title: string) => void;
  onBack: () => void;
  onDelete: () => void;
}

function NoteEditor({ note, saveStatus, onUpdateContent, onUpdateTitle, onBack, onDelete }: NoteEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      Placeholder.configure({
        placeholder: 'Start writing your thoughts...',
      }),
    ],
    content: note.content,
    editorProps: {
      attributes: {
        class: 'focus:outline-none min-h-full font-inherit select-text text-[18px] md:text-[22px]',
      },
    },
    onUpdate: ({ editor }) => {
      onUpdateContent(editor.getHTML());
    },
  });

  // Focus the editor at the end on mount
  useEffect(() => {
    if (editor) {
      editor.commands.focus('end');
    }
  }, [editor]);

  return (
    <div 
      className="min-h-screen w-full flex flex-col px-6 py-8 md:px-16 md:py-12 select-text relative cursor-text max-w-4xl mx-auto"
      onClick={() => editor?.commands.focus()}
    >
      {/* Header action bar */}
      <div className="flex items-center justify-between mb-8 md:mb-12 w-full select-none">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onBack();
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-[#6d3bbd] bg-white/40 hover:bg-[#e4d1fb] active:bg-[#dbbeff] transition-all cursor-pointer shadow-sm hover:shadow"
        >
          <ArrowLeft size={16} />
          <span>Notes</span>
        </button>

        {/* Real-time Visual Save Status Indicator */}
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/30 backdrop-blur-sm select-none border border-[#986ddb]/5">
          {saveStatus === 'saving' && (
            <div className="flex items-center gap-1.5 text-xs text-[#221733]/60 font-semibold">
              <RefreshCw size={12} className="animate-spin text-[#986ddb]" />
              <span>Saving...</span>
            </div>
          )}
          {saveStatus === 'saved' && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
              <Cloud size={13} className="text-emerald-600" />
              <span>Saved to cloud</span>
            </div>
          )}
          {saveStatus === 'error' && (
            <div className="flex items-center gap-1.5 text-xs text-rose-600 font-semibold">
              <AlertCircle size={13} className="text-rose-500" />
              <span>Offline / Error</span>
            </div>
          )}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm('Are you sure you want to delete this note?')) {
              onDelete();
            }
          }}
          className="flex items-center justify-center p-2.5 rounded-full text-[#c24b4b] bg-white/40 hover:bg-[#ffdede] active:bg-[#ffc9c9] transition-all cursor-pointer shadow-sm hover:shadow"
          title="Delete note"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Title Header Input */}
      <input
        type="text"
        value={note.title}
        onChange={(e) => onUpdateTitle(e.target.value)}
        placeholder="Untitled Note"
        className="w-full text-3xl md:text-4xl font-bold bg-transparent text-[#221733] border-none outline-none mb-6 placeholder-opacity-30 placeholder-[#221733] focus:ring-0 select-text"
        onClick={(e) => e.stopPropagation()}
      />

      {/* TipTap editable workspace */}
      <div className="w-full select-text">
        <EditorContent 
          editor={editor} 
          className="select-text"
        />
      </div>
    </div>
  );
}

// --- Main App Component ---
export default function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [copiedText, setCopiedText] = useState<'env' | 'sql' | null>(null);

  // References to track unsaved content/title changes in real-time
  const pendingContentRef = useRef<{ id: string; content: string } | null>(null);
  const pendingTitleRef = useRef<{ id: string; title: string } | null>(null);

  // Scroll to top on first mount / refresh
  useEffect(() => {
    window.scrollTo(0, 0);
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  // Fetch all notes from Supabase on mount
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    async function loadNotes() {
      try {
        setIsLoading(true);
        const data = await notesService.fetchAll();
        setNotes(data);
      } catch (err) {
        console.error('Failed to load notes from Supabase:', err);
        setSaveStatus('error');
      } finally {
        setIsLoading(false);
      }
    }

    loadNotes();
  }, []);

  // Reset scroll to top when active note selection changes
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [activeNoteId]);

  // --- Synchronize & Flush Unsaved Changes Synchronously ---
  const flushPendingSaves = async () => {
    const promises = [];
    if (pendingContentRef.current) {
      const { id, content } = pendingContentRef.current;
      // Prevent saving if it's still an active temporary note (will be saved when swapped)
      if (!id.startsWith('temp-')) {
        promises.push(notesService.update(id, { content }));
        pendingContentRef.current = null;
      }
    }
    if (pendingTitleRef.current) {
      const { id, title } = pendingTitleRef.current;
      if (!id.startsWith('temp-')) {
        promises.push(notesService.update(id, { title }));
        pendingTitleRef.current = null;
      }
    }
    
    if (promises.length > 0) {
      try {
        setSaveStatus('saving');
        await Promise.all(promises);
        setSaveStatus('saved');
      } catch (err) {
        console.error('Failed flushing pending saves:', err);
        setSaveStatus('error');
      }
    }
  };

  // --- Debounced Database Writes ---
  const debouncedSaveContent = useDebouncedCallback(async (id: string, content: string) => {
    if (id.startsWith('temp-')) return; // Skip saving temp notes; handled during creation finish
    try {
      await notesService.update(id, { content });
      setSaveStatus('saved');
      pendingContentRef.current = null;
    } catch (err) {
      console.error('Failed debounced content save:', err);
      setSaveStatus('error');
    }
  }, 1000);

  const debouncedSaveTitle = useDebouncedCallback(async (id: string, title: string) => {
    if (id.startsWith('temp-')) return;
    try {
      await notesService.update(id, { title });
      setSaveStatus('saved');
      pendingTitleRef.current = null;
    } catch (err) {
      console.error('Failed debounced title save:', err);
      setSaveStatus('error');
    }
  }, 1000);

  // --- CRUD Operations ---
  const handleUpdateContent = (id: string, content: string) => {
    // 1. Instantly update UI state for zero-latency editing
    setNotes(prev => prev.map(n => n.id === id ? { ...n, content } : n));
    
    // 2. Queue the save
    pendingContentRef.current = { id, content };
    setSaveStatus('saving');
    debouncedSaveContent(id, content);
  };

  const handleUpdateTitle = (id: string, title: string) => {
    // 1. Instantly update UI state
    setNotes(prev => prev.map(n => n.id === id ? { ...n, title } : n));
    
    // 2. Queue the save
    pendingTitleRef.current = { id, title };
    setSaveStatus('saving');
    debouncedSaveTitle(id, title);
  };

  // OPTIMISTIC Note Creation
  const handleCreateNote = async () => {
    const tempId = 'temp-' + Math.random().toString(36).substring(2, 9);
    const tempNote: Note = {
      id: tempId,
      title: 'Untitled Note',
      content: '',
      updated_at: new Date().toISOString(),
    };

    // 1. Render temp card in UI immediately
    setNotes(prev => [tempNote, ...prev]);
    setActiveNoteId(tempId);
    setSaveStatus('saving');

    try {
      // 2. Perform background database write
      const newNote = await notesService.create({
        title: 'Untitled Note',
        content: '',
      });

      // 3. Swap temp note with real record, merging any text written during creation delay
      setNotes(prev => {
        const currentTemp = prev.find(n => n.id === tempId);
        const mergedNote = currentTemp 
          ? { ...newNote, title: currentTemp.title, content: currentTemp.content }
          : newNote;
        return prev.map(n => n.id === tempId ? mergedNote : n);
      });

      // 4. Update references to prevent pointer loss during active debouncing
      if (activeNoteId === tempId || tempId) {
        setActiveNoteId(prevActiveId => prevActiveId === tempId ? newNote.id : prevActiveId);
      }

      if (pendingContentRef.current && pendingContentRef.current.id === tempId) {
        pendingContentRef.current.id = newNote.id;
        // Run database write for any text added mid-delay
        notesService.update(newNote.id, { content: pendingContentRef.current.content });
      }

      if (pendingTitleRef.current && pendingTitleRef.current.id === tempId) {
        pendingTitleRef.current.id = newNote.id;
        notesService.update(newNote.id, { title: pendingTitleRef.current.title });
      }

      setSaveStatus('saved');
    } catch (err) {
      console.error('Failed to create note on cloud:', err);
      setSaveStatus('error');
      
      // Revert UI on database failure
      setNotes(prev => prev.filter(n => n.id !== tempId));
      setActiveNoteId(prevActiveId => prevActiveId === tempId ? null : prevActiveId);
      alert('Could not sync note with cloud. Reverting creation.');
    }
  };

  // OPTIMISTIC Note Deletion
  const handleDeleteNote = async (id: string) => {
    const noteToDelete = notes.find(n => n.id === id);
    if (!noteToDelete) return;

    // 1. Instantly remove note from UI list
    setNotes(prev => prev.filter(n => n.id !== id));
    const wasActive = activeNoteId === id;
    if (wasActive) {
      setActiveNoteId(null);
    }
    setSaveStatus('saving');

    try {
      // 2. Attempt database delete
      if (!id.startsWith('temp-')) {
        await notesService.delete(id);
      }
      setSaveStatus('saved');
    } catch (err) {
      console.error('Failed to delete note:', err);
      setSaveStatus('error');

      // 3. Revert UI state on network failure
      setNotes(prev => {
        const restored = [...prev, noteToDelete];
        // Sort by last updated
        return restored.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
      });

      if (wasActive) {
        setActiveNoteId(id);
      }
      alert('Could not complete deletion on Supabase. Note restored.');
    }
  };

  const handleBackToDashboard = async () => {
    await flushPendingSaves();
    setActiveNoteId(null);
  };

  const handleCopyClipboard = (text: string, type: 'env' | 'sql') => {
    navigator.clipboard.writeText(text);
    setCopiedText(type);
    setTimeout(() => setCopiedText(null), 2500);
  };

  const activeNote = notes.find(n => n.id === activeNoteId);

  // --- Beautiful Setup Guide for Missing Env Credentials ---
  if (!isSupabaseConfigured) {
    const envTemplate = `# Supabase Cloud Credentials\nVITE_SUPABASE_URL=https://your-project-ref.supabase.co\nVITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`;
    const sqlTemplate = `-- Create the notes table\ncreate table notes (\n  id uuid default gen_random_uuid() primary key,\n  title text not null default 'Untitled Note',\n  content text not null default '',\n  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,\n  user_id uuid default null\n);\n\n-- Enable Row Level Security\nalter table notes enable row level security;\n\n-- Allow development public access\ncreate policy "Allow public access for dev" on notes\n  for all using (true) with check (true);`;

    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center p-6 select-text max-w-4xl mx-auto py-16 md:py-24">
        <div className="w-full bg-white/70 backdrop-blur-md border border-[#986ddb]/15 rounded-[32px] p-8 md:p-12 shadow-[0_16px_48px_rgba(152,109,219,0.12)]">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-[#f1e5fe] flex items-center justify-center text-[#986ddb] mx-auto mb-4 border border-[#986ddb]/10 shadow-sm animate-pulse">
              <Cloud size={30} />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#221733] tracking-tight mb-2">
              Cloud Sync Integration
            </h1>
            <p className="text-sm md:text-base text-[#221733]/60 max-w-lg mx-auto font-medium">
              This application has been upgraded to utilize **Supabase Cloud Storage**. Please configure your local environment credentials to begin synchronization.
            </p>
          </div>

          <div className="space-y-6">
            {/* Step 1: Environment File */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-[#221733] flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#986ddb] text-white flex items-center justify-center text-xs">1</span>
                  Create `.env` in project root
                </h3>
                <button 
                  onClick={() => handleCopyClipboard(envTemplate, 'env')}
                  className="flex items-center gap-1.5 text-xs text-[#986ddb] font-semibold hover:underline cursor-pointer"
                >
                  {copiedText === 'env' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                  <span>{copiedText === 'env' ? 'Copied!' : 'Copy Template'}</span>
                </button>
              </div>
              <pre className="w-full p-4 rounded-2xl bg-[#f1e5fe]/50 border border-[#986ddb]/10 text-xs font-mono text-[#221733]/85 overflow-x-auto">
                {envTemplate}
              </pre>
            </div>

            {/* Step 2: SQL Script */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-[#221733] flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#986ddb] text-white flex items-center justify-center text-xs">2</span>
                  Run SQL in Supabase Dashboard
                </h3>
                <button 
                  onClick={() => handleCopyClipboard(sqlTemplate, 'sql')}
                  className="flex items-center gap-1.5 text-xs text-[#986ddb] font-semibold hover:underline cursor-pointer"
                >
                  {copiedText === 'sql' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                  <span>{copiedText === 'sql' ? 'Copied!' : 'Copy Script'}</span>
                </button>
              </div>
              <p className="text-xs text-[#221733]/55 mb-2 font-medium">
                Open the **SQL Editor** in your Supabase dashboard and run this command to build the note schemas:
              </p>
              <pre className="w-full max-h-[160px] p-4 rounded-2xl bg-[#f1e5fe]/50 border border-[#986ddb]/10 text-xs font-mono text-[#221733]/75 overflow-y-auto whitespace-pre">
                {sqlTemplate}
              </pre>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-[#986ddb]/10 text-center">
            <span className="text-xs text-[#221733]/40 font-medium">
              After adding variables to `.env`, restart your Vite dev server to apply configuration.
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen">
      {activeNote ? (
        <NoteEditor
          key={activeNote.id}
          note={activeNote}
          saveStatus={saveStatus}
          onUpdateContent={(content) => handleUpdateContent(activeNote.id, content)}
          onUpdateTitle={(title) => handleUpdateTitle(activeNote.id, title)}
          onBack={handleBackToDashboard}
          onDelete={() => handleDeleteNote(activeNote.id)}
        />
      ) : (
        /* Notes Dashboard / Grid View */
        <div className="w-full max-w-7xl mx-auto px-6 py-16 md:py-24 select-none">
          {/* Cards Grid */}
          <div className="flex flex-wrap justify-center gap-8 md:gap-10">
            {/* "New Note" Card */}
            {!isLoading && (
              <div
                onClick={handleCreateNote}
                className="flex flex-col items-center justify-center w-[220px] h-[280px] bg-white/40 border-2 border-dashed border-[#986ddb]/40 rounded-[32px] cursor-pointer hover:bg-white/60 hover:border-[#986ddb]/70 hover:scale-[1.03] transition-all duration-300 shadow-[0_8px_30px_rgba(0,0,0,0.02)] group"
              >
                <div className="p-4 rounded-full bg-[#f1e5fe] text-[#986ddb] group-hover:scale-110 transition-transform duration-300 shadow-sm">
                  <Plus size={28} />
                </div>
                <span className="mt-4 font-semibold text-[#221733]/70 text-sm">
                  New Note
                </span>
              </div>
            )}

            {/* Skeleton Loading Grid */}
            {isLoading && (
              <div className="flex flex-wrap justify-center gap-8 md:gap-10 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div 
                    key={i} 
                    className="w-[220px] h-[280px] bg-[#eddffb]/40 rounded-[32px] flex flex-col p-6 border border-[#986ddb]/5"
                  >
                    <div className="w-2/3 h-5 bg-[#221733]/10 rounded-full mx-auto mb-5"></div>
                    <div className="w-5/6 h-3 bg-[#221733]/5 rounded-full mx-auto mb-2.5"></div>
                    <div className="w-full h-3 bg-[#221733]/5 rounded-full mx-auto mb-2.5"></div>
                    <div className="w-4/5 h-3 bg-[#221733]/5 rounded-full mx-auto mb-2.5"></div>
                    <div className="w-full h-3 bg-[#221733]/5 rounded-full mx-auto mb-2.5"></div>
                  </div>
                ))}
              </div>
            )}

            {/* Note Cards */}
            {!isLoading && notes.map((note) => {
              const textPreview = stripHtml(note.content).trim();
              return (
                <div
                  key={note.id}
                  onClick={() => setActiveNoteId(note.id)}
                  className="flex flex-col p-6 w-[220px] h-[280px] bg-[#eddffb] rounded-[32px] cursor-pointer hover:scale-[1.03] hover:shadow-[0_12px_36px_rgba(152,109,219,0.18)] transition-all duration-300 shadow-[0_8px_30px_rgba(0,0,0,0.04)] relative group overflow-hidden border border-[#986ddb]/10"
                >
                  {/* Note Name on top, centered */}
                  <h3 className="text-center text-lg font-bold text-[#221733] line-clamp-2 mb-3 leading-tight select-none px-2">
                    {note.title || 'Untitled Note'}
                  </h3>

                  {/* Note Content preview, centered */}
                  <p className="text-center text-sm text-[#221733]/60 leading-relaxed line-clamp-6 px-1 select-none overflow-hidden whitespace-pre-wrap break-words">
                    {textPreview || <span className="italic text-[#221733]/30">Empty note</span>}
                  </p>

                  {/* Corner quick delete button (visible on hover) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Are you sure you want to delete this note?')) {
                        handleDeleteNote(note.id);
                      }
                    }}
                    className="absolute bottom-4 right-4 p-2 rounded-full bg-white/80 hover:bg-[#ffdede] hover:text-[#c24b4b] text-[#221733]/40 transition-all opacity-0 group-hover:opacity-100 shadow-sm border border-[#986ddb]/10"
                    title="Delete note"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}

            {/* Zero Notes Fallback */}
            {!isLoading && notes.length === 0 && (
              <div className="text-center py-20 w-full select-none">
                <p className="text-[#221733]/40 font-semibold mb-2">No notes found on the cloud.</p>
                <p className="text-xs text-[#221733]/35">Click the plus card to start your first journal entry.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
