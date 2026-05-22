import { useState, useEffect, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { Plus, Trash2, ArrowLeft, RefreshCw, Cloud, Copy, Check, RotateCcw } from 'lucide-react';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import { notesService } from './services/notes';
import type { Note } from './services/notes';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import { Login } from './components/auth/Login';
import { Signup } from './components/auth/Signup';

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

// --- Helper to extract first name or clean email name ---
function getFirstName(user: any): string {
  if (!user || !user.email) return 'User';
  const emailLocalPart = user.email.split('@')[0];
  const namePart = emailLocalPart.split(/[^a-zA-Z]/)[0];
  if (namePart) {
    return namePart.charAt(0).toUpperCase() + namePart.slice(1);
  }
  return emailLocalPart;
}

// --- Sub-component: Note Editor ---
interface NoteEditorProps {
  note: Note;
  saveStatus: 'saved' | 'saving' | 'error';
  onUpdateContent: (content: string) => void;
  onUpdateTitle: (title: string) => void;
  onBack: () => void;
}

function NoteEditor({ note, saveStatus, onUpdateContent, onUpdateTitle, onBack }: NoteEditorProps) {
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
      data-save-status={saveStatus}
    >
      {/* Header action bar */}
      <div className="flex items-center justify-between mb-8 md:mb-12 w-full select-none">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onBack();
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-[#6d3bbd] bg-white/40 hover:bg-[#e4d1fb] active:bg-[#dbbeff] transition-all cursor-pointer shadow-sm hover:shadow"
        >
          <ArrowLeft size={14} />
          <span>Back</span>
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

// --- App Content Render Wrapper ---
function AppContent() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState<boolean>(true);
  const [currentTab, setCurrentTab] = useState<'notes' | 'trash'>(() => {
    const saved = localStorage.getItem('purple_notes_current_tab');
    return (saved === 'notes' || saved === 'trash') ? saved : 'notes';
  });

  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(() => {
    return localStorage.getItem('purple_notes_active_note_id');
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [copiedText, setCopiedText] = useState<'env' | 'sql' | null>(null);

  // References to track unsaved content/title changes in real-time
  const pendingContentRef = useRef<{ id: string; content: string } | null>(null);
  const pendingTitleRef = useRef<{ id: string; title: string } | null>(null);

  // Track whether the history API stack has been prepopulated/initialized on load
  const isHistoryInitializedRef = useRef<boolean>(false);

  // References to track newly created notes and discard them if exited pristine
  const createdNoteIdRef = useRef<string | null>(null);
  const previousActiveNoteIdRef = useRef<string | null>(null);
  const pendingDiscardNoteIdRef = useRef<string | null>(null);

  // Persist Tab & Note ID across page refreshes
  useEffect(() => {
    localStorage.setItem('purple_notes_current_tab', currentTab);
  }, [currentTab]);

  useEffect(() => {
    if (activeNoteId) {
      localStorage.setItem('purple_notes_active_note_id', activeNoteId);
    } else {
      localStorage.removeItem('purple_notes_active_note_id');
    }
  }, [activeNoteId]);

  // Clean stored session layout on logout
  useEffect(() => {
    if (!user) {
      localStorage.removeItem('purple_notes_current_tab');
      localStorage.removeItem('purple_notes_active_note_id');
      isHistoryInitializedRef.current = false;
    }
  }, [user]);

  // Scroll to top on first mount / tab transition / note opening / page refresh
  useEffect(() => {
    window.scrollTo(0, 0);
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, [activeNoteId, currentTab]);

  // Set/Replace initial history state so we can navigate back to it
  useEffect(() => {
    if (user && !isHistoryInitializedRef.current) {
      isHistoryInitializedRef.current = true;

      // If we load directly onto a sub-view (trash or a specific note),
      // we prepopulate the history stack with the homepage so that the browser's
      // "Back" button successfully returns us to the active notes grid homepage.
      if (currentTab !== 'notes' || activeNoteId !== null) {
        window.history.replaceState({ tab: 'notes', noteId: null }, '');
        window.history.pushState({ tab: currentTab, noteId: activeNoteId }, '');
      } else {
        window.history.replaceState({ tab: 'notes', noteId: null }, '');
      }
    }
  }, [user]);

  // Push new history state when currentTab or activeNoteId changes programmatically
  useEffect(() => {
    if (!user || !isHistoryInitializedRef.current) return;
    const historyState = window.history.state;
    const currentTabState = historyState?.tab;
    const currentNoteIdState = historyState?.noteId;

    if (currentTabState !== currentTab || currentNoteIdState !== activeNoteId) {
      window.history.pushState({ tab: currentTab, noteId: activeNoteId }, '');
    }
  }, [currentTab, activeNoteId, user]);

  // Listen to popstate event (browser back and forward buttons)
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (!user) return;
      const state = event.state;
      if (state) {
        if (state.tab === 'notes' || state.tab === 'trash') {
          setCurrentTab(state.tab);
        }
        setActiveNoteId(state.noteId);
      } else {
        // Fallback to default homepage state if state is null
        setCurrentTab('notes');
        setActiveNoteId(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [user]);

  // Fetch all notes from Supabase when user authenticates
  useEffect(() => {
    if (!isSupabaseConfigured || !user) {
      setIsLoading(false);
      return;
    }

    async function loadNotes() {
      try {
        setIsLoading(true);
        // RLS limits data, fetch both active & trashed for clean client-side navigation
        const { data, error } = await supabase
          .from('notes')
          .select('*')
          .order('updated_at', { ascending: false });

        if (error) throw error;
        setNotes(data || []);
      } catch (err) {
        console.error('Failed to load notes from Supabase:', err);
        setSaveStatus('error');
      } finally {
        setIsLoading(false);
      }
    }

    loadNotes();
  }, [user]);

  // Reset scroll to top when active note selection changes
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [activeNoteId]);

  // Monitor when the user exits the note editor to discard pristine newly-created notes
  useEffect(() => {
    const prevActiveNoteId = previousActiveNoteIdRef.current;
    previousActiveNoteIdRef.current = activeNoteId;

    if (prevActiveNoteId && prevActiveNoteId !== activeNoteId) {
      // Check if the exited note was newly created in this session
      if (prevActiveNoteId === createdNoteIdRef.current) {
        const note = notes.find(n => n.id === prevActiveNoteId);
        if (note) {
          const isTitleUnchanged = note.title.trim() === '' || note.title === 'Untitled Note';
          const isContentEmpty = stripHtml(note.content).trim() === '';

          if (isTitleUnchanged && isContentEmpty) {
            // Silently discard from local React state
            setNotes(prev => prev.filter(n => n.id !== prevActiveNoteId));

            if (prevActiveNoteId.startsWith('temp-')) {
              // The note is still creating; mark it for discard
              pendingDiscardNoteIdRef.current = prevActiveNoteId;
            } else {
              // Delete directly from Supabase
              notesService.delete(prevActiveNoteId).catch(err => {
                console.error('Failed to delete pristine note from cloud:', err);
              });
            }
            createdNoteIdRef.current = null;
          }
        }
      }
    }
  }, [activeNoteId, notes]);

  // --- Synchronize & Flush Unsaved Changes Synchronously ---
  const flushPendingSaves = async () => {
    const promises = [];
    if (pendingContentRef.current) {
      const { id, content } = pendingContentRef.current;
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
    if (id.startsWith('temp-')) return;
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

  // --- CRUD & Soft Delete Actions ---
  const handleUpdateContent = (id: string, content: string) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, content } : n));
    pendingContentRef.current = { id, content };
    setSaveStatus('saving');
    debouncedSaveContent(id, content);
  };

  const handleUpdateTitle = (id: string, title: string) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, title } : n));
    pendingTitleRef.current = { id, title };
    setSaveStatus('saving');
    debouncedSaveTitle(id, title);
  };

  // OPTIMISTIC Note Creation linked to user_id
  const handleCreateNote = async () => {
    if (!user) return;

    const tempId = 'temp-' + Math.random().toString(36).substring(2, 9);
    const tempNote: Note = {
      id: tempId,
      title: 'Untitled Note',
      content: '',
      updated_at: new Date().toISOString(),
      user_id: user.id,
      is_trashed: false,
    };

    createdNoteIdRef.current = tempId;
    setNotes(prev => [tempNote, ...prev]);
    setActiveNoteId(tempId);
    setSaveStatus('saving');

    try {
      const newNote = await notesService.create({
        title: 'Untitled Note',
        content: '',
        user_id: user.id,
      });

      // If the user already exited and marked this temp note for discard during the async call:
      if (pendingDiscardNoteIdRef.current === tempId) {
        notesService.delete(newNote.id).catch(err => console.error('Failed to delete pending-discard note:', err));
        pendingDiscardNoteIdRef.current = null;
        createdNoteIdRef.current = null;
        setNotes(prev => prev.filter(n => n.id !== tempId && n.id !== newNote.id));
        setSaveStatus('saved');
        return;
      }

      createdNoteIdRef.current = newNote.id;

      setNotes(prev => {
        const currentTemp = prev.find(n => n.id === tempId);
        const mergedNote = currentTemp 
          ? { ...newNote, title: currentTemp.title, content: currentTemp.content }
          : newNote;
        return prev.map(n => n.id === tempId ? mergedNote : n);
      });

      if (activeNoteId === tempId || tempId) {
        setActiveNoteId(prevActiveId => prevActiveId === tempId ? newNote.id : prevActiveId);
      }

      if (pendingContentRef.current && pendingContentRef.current.id === tempId) {
        pendingContentRef.current.id = newNote.id;
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
      
      setNotes(prev => prev.filter(n => n.id !== tempId));
      setActiveNoteId(prevActiveId => prevActiveId === tempId ? null : prevActiveId);
      alert('Could not sync note with cloud. Reverting creation.');
    }
  };

  // OPTIMISTIC Soft Deletion (Move to Trash)
  const handleTrashNote = async (id: string) => {
    const noteToTrash = notes.find(n => n.id === id);
    if (!noteToTrash) return;

    // 1. UI change immediately
    setNotes(prev => prev.map(n => n.id === id ? { ...n, is_trashed: true } : n));
    if (activeNoteId === id) {
      setActiveNoteId(null);
    }
    setSaveStatus('saving');

    try {
      if (!id.startsWith('temp-')) {
        await notesService.trash(id);
      }
      setSaveStatus('saved');
    } catch (err) {
      console.error('Failed to trash note:', err);
      setSaveStatus('error');

      // Revert UI state on failure
      setNotes(prev => prev.map(n => n.id === id ? { ...n, is_trashed: false } : n));
      alert('Could not move note to Trash. Restoring active note.');
    }
  };

  // OPTIMISTIC Restoration from Trash
  const handleRestoreNote = async (id: string) => {
    const noteToRestore = notes.find(n => n.id === id);
    if (!noteToRestore) return;

    setNotes(prev => prev.map(n => n.id === id ? { ...n, is_trashed: false } : n));
    setSaveStatus('saving');

    try {
      await notesService.restore(id);
      setSaveStatus('saved');
    } catch (err) {
      console.error('Failed to restore note:', err);
      setSaveStatus('error');

      // Revert UI state on failure
      setNotes(prev => prev.map(n => n.id === id ? { ...n, is_trashed: true } : n));
      alert('Could not restore note from Trash.');
    }
  };

  // OPTIMISTIC Permanent Deletion
  const handlePermanentDeleteNote = async (id: string) => {
    const noteToDelete = notes.find(n => n.id === id);
    if (!noteToDelete) return;

    setNotes(prev => prev.filter(n => n.id !== id));
    setSaveStatus('saving');

    try {
      await notesService.delete(id);
      setSaveStatus('saved');
    } catch (err) {
      console.error('Failed to permanently delete note:', err);
      setSaveStatus('error');

      // Revert UI state on failure
      setNotes(prev => {
        const restored = [...prev, noteToDelete];
        return restored.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
      });
      alert('Could not complete permanent deletion. Restoring back to Trash.');
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

  // Divide notes list for fast client-side tab indexing
  const activeNotes = notes.filter(n => !n.is_trashed);
  const trashedNotes = notes.filter(n => n.is_trashed);

  // --- Beautiful Setup Guide for Missing Env Credentials ---
  if (!isSupabaseConfigured) {
    const envTemplate = `# Supabase Cloud Credentials\nVITE_SUPABASE_URL=https://your-project-ref.supabase.co\nVITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`;
    const sqlTemplate = `-- Create the notes table with Auth relationships\ncreate table if not exists notes (\n  id uuid default gen_random_uuid() primary key,\n  title text not null default 'Untitled Note',\n  content text not null default '',\n  is_trashed boolean default false,\n  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,\n  user_id uuid default auth.uid() references auth.users(id) on delete cascade\n);\n\n-- Enable Row Level Security\nalter table notes enable row level security;\n\n-- Drop existing policies if they exist\ndrop policy if exists "Users can insert their own notes" on notes;\ndrop policy if exists "Users can select their own notes" on notes;\ndrop policy if exists "Users can update their own notes" on notes;\ndrop policy if exists "Users can delete their own notes" on notes;\n\n-- Create granular RLS policies for strict user isolation\ncreate policy "Users can insert their own notes" on notes\n  for insert with check (auth.uid() = user_id);\n\ncreate policy "Users can select their own notes" on notes\n  for select using (auth.uid() = user_id);\n\ncreate policy "Users can update their own notes" on notes\n  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);\n\ncreate policy "Users can delete their own notes" on notes\n  for delete using (auth.uid() = user_id);`;

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
              This application has been upgraded to utilize **Supabase Cloud Storage & Auth**. Please configure your local environment credentials to begin synchronization.
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
                Open the **SQL Editor** in your Supabase dashboard and run this command to build the notes schema and user-isolation policies:
              </p>
              <pre className="w-full max-h-[180px] p-4 rounded-2xl bg-[#f1e5fe]/50 border border-[#986ddb]/10 text-xs font-mono text-[#221733]/75 overflow-y-auto whitespace-pre">
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

  // --- Auth Flow Center Spinner ---
  if (authLoading || (isLoading && activeNoteId)) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-transparent">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw size={26} className="animate-spin text-[#986ddb]" />
          <span className="text-xs text-[#221733]/55 font-bold tracking-wider">
            {authLoading ? 'Securing connection...' : 'Loading note...'}
          </span>
        </div>
      </div>
    );
  }

  // --- Authenticate / Router ---
  if (!user) {
    return isLoginMode ? (
      <Login onToggleAuthMode={() => setIsLoginMode(false)} />
    ) : (
      <Signup onToggleAuthMode={() => setIsLoginMode(true)} />
    );
  }

  return (
    <div className="w-full min-h-screen flex flex-col bg-transparent text-[#221733]">
      {/* Main Panel Content Area */}
      <main className="flex-grow w-full min-h-screen overflow-y-auto">
        {activeNote ? (
          <NoteEditor
            key={activeNote.id}
            note={activeNote}
            saveStatus={saveStatus}
            onUpdateContent={(content) => handleUpdateContent(activeNote.id, content)}
            onUpdateTitle={(title) => handleUpdateTitle(activeNote.id, title)}
            onBack={handleBackToDashboard}
          />
        ) : (
          <div className="w-full">
            {/* Top Navigation Header for Homepage */}
            <header className="w-full max-w-7xl mx-auto px-6 pt-8 pb-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-[#986ddb]/10 select-none">
              <div 
                className="flex items-center gap-3 cursor-pointer select-none"
                onClick={() => setCurrentTab('notes')}
              >
                <div className="text-left">
                  <h1 className="text-xl font-extrabold tracking-tight text-[#221733]">Notes</h1>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Trash Bin Toggle Button */}
                <button
                  onClick={() => setCurrentTab(prev => prev === 'notes' ? 'trash' : 'notes')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer border shadow-sm ${
                    currentTab === 'trash'
                      ? 'bg-[#986ddb] text-white border-[#986ddb] shadow-md hover:bg-[#8557c7]'
                      : 'bg-white/50 text-[#986ddb] border-[#986ddb]/20 hover:bg-[#f1e5fe]/50'
                  }`}
                >
                  <Trash2 size={14} />
                  <span>{currentTab === 'notes' ? `Trash Bin (${trashedNotes.length})` : 'Active Notes'}</span>
                </button>

                {/* User profile and logout */}
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/50 border border-[#986ddb]/10 text-xs text-[#221733] font-semibold">
                  <span className="max-w-[155px] truncate">Welcome, {getFirstName(user)}</span>
                  <div className="w-px h-3.5 bg-[#986ddb]/20"></div>
                  <button
                    onClick={signOut}
                    className="text-[#986ddb] hover:text-[#7446b5] font-bold transition-all cursor-pointer"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </header>

            {/* Notes Grid View (Toggled by Header Switcher) */}
            <div className="w-full max-w-7xl mx-auto px-6 py-12 md:py-16 select-none">
              
              {/* Header Title */}
              {currentTab === 'trash' && (
                <div className="mb-10 text-center md:text-left select-none">
                  <h2 className="text-2xl font-bold tracking-tight text-[#221733]">
                    Trash Bin
                  </h2>
                </div>
              )}

              <div className="flex flex-wrap justify-center md:justify-start gap-8 md:gap-10">
                
                {/* "New Note" Card - Rendered ONLY in Notes Tab */}
                {currentTab === 'notes' && !isLoading && (
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
                  <div className="flex flex-wrap justify-center md:justify-start gap-8 md:gap-10 animate-pulse">
                    {[1, 2, 3].map((i) => (
                      <div 
                        key={i} 
                        className="w-[220px] h-[280px] bg-[#eddffb]/40 rounded-[32px] flex flex-col p-6 border border-[#986ddb]/5"
                      >
                        <div className="w-2/3 h-5 bg-[#221733]/10 rounded-full mx-auto mb-5"></div>
                        <div className="w-5/6 h-3 bg-[#221733]/5 rounded-full mx-auto mb-2.5"></div>
                        <div className="w-full h-3 bg-[#221733]/5 rounded-full mx-auto mb-2.5"></div>
                        <div className="w-4/5 h-3 bg-[#221733]/5 rounded-full mx-auto mb-2.5"></div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Note Cards Rendering */}
                {!isLoading && (currentTab === 'notes' ? activeNotes : trashedNotes).map((note) => {
                  const textPreview = stripHtml(note.content).trim();
                  return (
                    <div
                      key={note.id}
                      onClick={() => {
                        // Only allow opening active notes for editing
                        if (currentTab === 'notes') {
                          setActiveNoteId(note.id);
                        }
                      }}
                      className={`flex flex-col p-6 w-[220px] h-[280px] bg-[#eddffb] rounded-[32px] transition-all duration-300 shadow-[0_8px_30px_rgba(0,0,0,0.04)] relative group overflow-hidden border border-[#986ddb]/10 ${
                        currentTab === 'notes' ? 'cursor-pointer hover:scale-[1.03] hover:shadow-[0_12px_36px_rgba(152,109,219,0.18)]' : ''
                      }`}
                    >
                      {/* Note Title */}
                      <h3 className="text-center text-lg font-bold text-[#221733] line-clamp-2 mb-3 leading-tight select-none px-2">
                        {note.title || 'Untitled Note'}
                      </h3>

                      {/* Note Content Preview */}
                      <p className="text-center text-sm text-[#221733]/60 leading-relaxed line-clamp-6 px-1 select-none overflow-hidden whitespace-pre-wrap break-words">
                        {textPreview || <span className="italic text-[#221733]/30">Empty note</span>}
                      </p>

                      {/* Active Tab Hover Trash Trigger */}
                      {currentTab === 'notes' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTrashNote(note.id);
                          }}
                          className="absolute bottom-4 right-4 p-2 rounded-full bg-white/80 hover:bg-[#ffdede] hover:text-[#c24b4b] text-[#221733]/40 transition-all opacity-0 group-hover:opacity-100 shadow-sm border border-[#986ddb]/10 cursor-pointer"
                          title="Move to trash"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}

                      {/* Trash Tab Hover Restore & Purge Controls */}
                      {currentTab === 'trash' && (
                        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all select-none">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRestoreNote(note.id);
                            }}
                            className="p-2 rounded-full bg-white/80 hover:bg-emerald-50 hover:text-emerald-600 text-[#221733]/50 transition-all shadow-sm border border-[#986ddb]/10 cursor-pointer"
                            title="Restore note"
                          >
                            <RotateCcw size={13} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm('Are you sure you want to permanently delete this note? This action cannot be undone.')) {
                                handlePermanentDeleteNote(note.id);
                              }
                            }}
                            className="p-2 rounded-full bg-white/80 hover:bg-rose-50 hover:text-rose-600 text-[#221733]/55 transition-all shadow-sm border border-[#986ddb]/10 cursor-pointer"
                            title="Delete permanently"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}

                    </div>
                  );
                })}

                {/* Zero Notes Tab Fallback */}
                {!isLoading && (currentTab === 'notes' ? activeNotes : trashedNotes).length === 0 && (
                  <div className="text-center py-24 w-full select-none">
                    <p className="text-[#221733]/40 font-semibold mb-2">
                      {currentTab === 'notes' ? 'No notes found on the cloud.' : 'Your Trash Bin is empty.'}
                    </p>
                    <p className="text-xs text-[#221733]/35">
                      {currentTab === 'notes' 
                        ? 'Click the plus card to start your first journal entry.' 
                        : 'Notes moved here can be restored or deleted permanently.'}
                    </p>
                  </div>
                )}

              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// --- Main App Wrapper Rendering global AuthContext Provider ---
export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
