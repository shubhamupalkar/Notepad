import React, { createContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { 
  NotepadState, 
  NotepadContextProps, 
  EditorStats, 
  DialogStates 
} from '../types/notepad';

export const NotepadContext = createContext<NotepadContextProps | undefined>(undefined);

const DEFAULT_STATE: NotepadState = {
  file: {
    name: 'Untitled.txt',
    isDirty: false,
    content: '',
  },
  stats: {
    line: 1,
    column: 1,
    wordCount: 0,
    charCount: 0,
  },
  view: {
    statusBarVisible: true,
    wordWrap: true,
    zoom: 100,
    isFullscreen: false,
  },
  font: {
    family: 'Arial',
    size: 16,
  },
  dialogs: {
    about: false,
    findReplace: false,
    goToLine: false,
  },
};

interface NotepadProviderProps {
  children: ReactNode;
}

export const NotepadProvider: React.FC<NotepadProviderProps> = ({ children }) => {
  const [state, setState] = useState<NotepadState>(DEFAULT_STATE);
  const [editorInstance, setEditorInstance] = useState<any>(null);

  // File Operations
  const newDocument = () => {
    if (state.file.isDirty) {
      const confirmClear = window.confirm('You have unsaved changes. Do you want to create a new document anyway?');
      if (!confirmClear) return;
    }
    
    if (editorInstance) {
      editorInstance.commands.clearContent();
    }
    
    setState(prev => ({
      ...prev,
      file: {
        name: 'Untitled.txt',
        isDirty: false,
        content: '',
      },
      stats: {
        ...prev.stats,
        line: 1,
        column: 1,
        wordCount: 0,
        charCount: 0,
      }
    }));
  };

  const openFile = (name: string, content: string) => {
    if (state.file.isDirty) {
      const confirmClear = window.confirm('You have unsaved changes. Do you want to open another file anyway?');
      if (!confirmClear) return;
    }

    if (editorInstance) {
      // If content looks like HTML, load as HTML, otherwise load as text paragraphs
      if (content.trim().startsWith('<') && content.trim().endsWith('>')) {
        editorInstance.commands.setContent(content);
      } else {
        // Convert plain text double-newlines to paragraph blocks
        const paragraphs = content
          .split(/\n\n+/)
          .map(p => `<p>${p.replace(/\n/g, '<br />')}</p>`)
          .join('');
        editorInstance.commands.setContent(paragraphs || '<p></p>');
      }
    }

    // Parse counts
    const words = content.trim() ? content.trim().split(/\s+/).length : 0;
    const chars = content.length;

    setState(prev => ({
      ...prev,
      file: {
        name,
        isDirty: false,
        content,
      },
      stats: {
        ...prev.stats,
        wordCount: words,
        charCount: chars,
        line: 1,
        column: 1,
      }
    }));
  };

  const saveFile = () => {
    // Generate text content from editor
    const textContent = editorInstance ? editorInstance.getText() : state.file.content;
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Ensure filename ends in .txt if not already
    let filename = state.file.name;
    if (!filename.toLowerCase().endsWith('.txt') && !filename.toLowerCase().endsWith('.html') && !filename.toLowerCase().endsWith('.md')) {
      filename += '.txt';
    }
    
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setState(prev => ({
      ...prev,
      file: {
        ...prev.file,
        isDirty: false,
      }
    }));
  };

  const exportHtml = () => {
    const htmlContent = editorInstance ? editorInstance.getHTML() : `<html><body>${state.file.content}</body></html>`;
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    let filename = state.file.name;
    // Replace extension with .html
    const dotIndex = filename.lastIndexOf('.');
    if (dotIndex !== -1) {
      filename = filename.substring(0, dotIndex) + '.html';
    } else {
      filename += '.html';
    }

    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const printDocument = () => {
    window.print();
  };

  // State setters
  const setFileName = (name: string) => {
    setState(prev => ({
      ...prev,
      file: {
        ...prev.file,
        name,
      }
    }));
  };

  const setContent = (content: string, isDirty = true) => {
    setState(prev => ({
      ...prev,
      file: {
        ...prev.file,
        content,
        isDirty: prev.file.content !== content ? isDirty : prev.file.isDirty,
      }
    }));
  };

  const updateStats = (statsUpdate: Partial<EditorStats>) => {
    setState(prev => ({
      ...prev,
      stats: {
        ...prev.stats,
        ...statsUpdate,
      }
    }));
  };

  // View settings
  const setStatusBarVisible = (visible: boolean) => {
    setState(prev => ({
      ...prev,
      view: {
        ...prev.view,
        statusBarVisible: visible,
      }
    }));
  };

  const setWordWrap = (wrap: boolean) => {
    setState(prev => ({
      ...prev,
      view: {
        ...prev.view,
        wordWrap: wrap,
      }
    }));
  };

  const setZoom = (zoom: number) => {
    const clamped = Math.max(50, Math.min(200, zoom));
    setState(prev => ({
      ...prev,
      view: {
        ...prev.view,
        zoom: clamped,
      }
    }));
  };

  const zoomIn = () => {
    setZoom(state.view.zoom + 10);
  };

  const zoomOut = () => {
    setZoom(state.view.zoom - 10);
  };

  const zoomReset = () => {
    setZoom(100);
  };

  const toggleFullscreen = () => {
    setState(prev => ({
      ...prev,
      view: {
        ...prev.view,
        isFullscreen: !prev.view.isFullscreen,
      }
    }));
  };

  // Font Settings
  const setFontFamily = (family: string) => {
    setState(prev => ({
      ...prev,
      font: {
        ...prev.font,
        family,
      }
    }));
  };

  const setFontSize = (size: number) => {
    const clamped = Math.max(10, Math.min(72, size));
    setState(prev => ({
      ...prev,
      font: {
        ...prev.font,
        size: clamped,
      }
    }));
  };

  // Dialog controls
  const openDialog = (dialog: keyof DialogStates) => {
    setState(prev => ({
      ...prev,
      dialogs: {
        ...prev.dialogs,
        [dialog]: true,
      }
    }));
  };

  const closeDialog = (dialog: keyof DialogStates) => {
    setState(prev => ({
      ...prev,
      dialogs: {
        ...prev.dialogs,
        [dialog]: false,
      }
    }));
  };

  return (
    <NotepadContext.Provider value={{
      state,
      newDocument,
      openFile,
      saveFile,
      exportHtml,
      printDocument,
      setFileName,
      setContent,
      updateStats,
      setStatusBarVisible,
      setWordWrap,
      setZoom,
      zoomIn,
      zoomOut,
      zoomReset,
      toggleFullscreen,
      setFontFamily,
      setFontSize,
      openDialog,
      closeDialog,
      editorInstance,
      setEditorInstance,
    }}>
      {children}
    </NotepadContext.Provider>
  );
};
