import { useContext } from 'react';
import { NotepadContext } from '../context/NotepadContext';

export const useNotepad = () => {
  const context = useContext(NotepadContext);
  if (!context) {
    throw new Error('useNotepad must be used within a NotepadProvider');
  }
  return context;
};
