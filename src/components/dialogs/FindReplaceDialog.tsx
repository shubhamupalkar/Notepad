import React, { useState, useEffect } from 'react';
import { Dialog } from '../ui/dialog';
import { Button } from '../ui/button';
import { useNotepad } from '../../hooks/useNotepad';

export const FindReplaceDialog: React.FC = () => {
  const { state, closeDialog, editorInstance } = useNotepad();
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [matchCase, setMatchCase] = useState(false);
  const [searchIndex, setSearchIndex] = useState(-1);
  const [matches, setMatches] = useState<{ start: number; end: number }[]>([]);
  const [message, setMessage] = useState('');

  // Reset states when opening dialog
  useEffect(() => {
    if (state.dialogs.findReplace) {
      setFindText('');
      setReplaceText('');
      setSearchIndex(-1);
      setMatches([]);
      setMessage('');
    }
  }, [state.dialogs.findReplace]);

  // Find all matches of findText in editor plain text
  const performSearch = (selectNext = true) => {
    if (!editorInstance || !findText) return;

    const text = editorInstance.getText();
    const query = findText;
    const flags = matchCase ? 'g' : 'gi';
    
    // Escape regex special chars
    const escapedQuery = query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(escapedQuery, flags);
    
    const foundMatches: { start: number; end: number }[] = [];
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      foundMatches.push({
        start: match.index,
        end: match.index + query.length,
      });
    }

    setMatches(foundMatches);

    if (foundMatches.length === 0) {
      setMessage('No matches found.');
      setSearchIndex(-1);
      return;
    }

    setMessage(`Found ${foundMatches.length} match(es).`);

    if (selectNext) {
      const nextIndex = (searchIndex + 1) % foundMatches.length;
      setSearchIndex(nextIndex);
      highlightMatch(foundMatches[nextIndex]);
    }
  };

  const highlightMatch = (match: { start: number; end: number }) => {
    if (!editorInstance) return;

    try {
      editorInstance.commands.focus();
      
      const { state: pmState, view } = editorInstance;
      
      let currentOffset = 0;
      let targetStart = -1;
      let targetEnd = -1;

      pmState.doc.descendants((node: any, pos: number) => {
        if (node.isText) {
          const nodeText = node.text || '';
          const nodeStart = currentOffset;
          const nodeEnd = currentOffset + nodeText.length;

          if (match.start >= nodeStart && match.start <= nodeEnd) {
            targetStart = pos + (match.start - nodeStart);
          }
          if (match.end >= nodeStart && match.end <= nodeEnd) {
            targetEnd = pos + (match.end - nodeStart);
          }
          currentOffset += nodeText.length;
        } else {
          if (node.type.name === 'paragraph' && currentOffset > 0) {
            currentOffset += 1; // paragraph break (newline equivalent)
          }
        }
        return true;
      });

      // If we resolved coordinates, select!
      if (targetStart !== -1 && targetEnd !== -1) {
        editorInstance.commands.setTextSelection({ from: targetStart, to: targetEnd });
        
        // Scroll the selection into view
        const element = view.domAtPos(targetStart).node as HTMLElement;
        if (element && element.scrollIntoView) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    } catch (e) {
      console.warn('Selection error, falling back to simple search', e);
    }
  };

  const handleReplace = () => {
    if (!editorInstance || matches.length === 0 || searchIndex === -1) {
      performSearch(true);
      return;
    }

    // Replace text inside the TipTap editor
    editorInstance.commands.focus();
    editorInstance.commands.insertContent(replaceText);

    // Re-index matches after editing content
    setTimeout(() => {
      performSearch(false);
      // Keep search index adjusted
      setSearchIndex(prev => {
        if (matches.length <= 1) return -1;
        return prev % (matches.length - 1);
      });
    }, 50);
  };

  const handleReplaceAll = () => {
    if (!editorInstance || !findText) return;

    const query = findText;
    const flags = matchCase ? 'g' : 'gi';
    
    // Escape regex special chars
    const escapedQuery = query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(escapedQuery, flags);

    let matchCount = 0;
    
    try {
      editorInstance.commands.focus();
      
      const { state: pmState } = editorInstance;
      let tr = pmState.tr;
      let currentOffset = 0;
      
      const matchPositions: { start: number; end: number }[] = [];
      const text = editorInstance.getText();
      let match;
      
      while ((match = regex.exec(text)) !== null) {
        matchPositions.push({
          start: match.index,
          end: match.index + query.length,
        });
      }

      if (matchPositions.length === 0) {
        setMessage('No matches found.');
        return;
      }

      // Convert to absolute PM positions in reverse order to prevent position shifts!
      const pmPositions: { start: number; end: number }[] = [];
      pmState.doc.descendants((node: any, pos: number) => {
        if (node.isText) {
          const nodeText = node.text || '';
          const nodeStart = currentOffset;
          
          matchPositions.forEach(m => {
            if (m.start >= nodeStart && m.start <= nodeStart + nodeText.length) {
              const start = pos + (m.start - nodeStart);
              const end = pos + (m.end - nodeStart);
              // ensure we don't push duplicates
              if (!pmPositions.some(p => p.start === start)) {
                pmPositions.push({ start, end });
              }
            }
          });
          currentOffset += nodeText.length;
        } else if (node.type.name === 'paragraph' && currentOffset > 0) {
          currentOffset += 1;
        }
        return true;
      });

      // Sort descending by position to replace from end to beginning!
      pmPositions.sort((a, b) => b.start - a.start);

      pmPositions.forEach(p => {
        tr = tr.insertText(replaceText, p.start, p.end);
        matchCount++;
      });

      editorInstance.view.dispatch(tr);
      setMessage(`Successfully replaced ${matchCount} occurrence(s).`);
      setMatches([]);
      setSearchIndex(-1);
    } catch (e) {
      console.error(e);
      setMessage('Error replacing occurrences.');
    }
  };

  return (
    <Dialog
      isOpen={state.dialogs.findReplace}
      onClose={() => closeDialog('findReplace')}
      title="Find and Replace"
      size="md"
    >
      <div className="space-y-4">
        {/* Find Input */}
        <div className="grid grid-cols-4 items-center gap-3">
          <label htmlFor="find-input" className="text-sm text-zinc-700 select-none">
            Find what:
          </label>
          <input
            id="find-input"
            type="text"
            className="col-span-3 px-3 py-1.5 border border-[#999999] bg-white text-black focus:outline-none focus:border-zinc-800 font-sans text-sm"
            value={findText}
            onChange={(e) => {
              setFindText(e.target.value);
              setMessage('');
              setMatches([]);
              setSearchIndex(-1);
            }}
            placeholder="Text to search..."
          />
        </div>

        {/* Replace Input */}
        <div className="grid grid-cols-4 items-center gap-3">
          <label htmlFor="replace-input" className="text-sm text-zinc-700 select-none">
            Replace with:
          </label>
          <input
            id="replace-input"
            type="text"
            className="col-span-3 px-3 py-1.5 border border-[#999999] bg-white text-black focus:outline-none focus:border-zinc-800 font-sans text-sm"
            value={replaceText}
            onChange={(e) => setReplaceText(e.target.value)}
            placeholder="Replacement text..."
          />
        </div>

        {/* Options */}
        <div className="flex items-center gap-2 pt-1 select-none">
          <input
            id="match-case"
            type="checkbox"
            className="w-4 h-4 border-[#999999] accent-zinc-800 cursor-pointer"
            checked={matchCase}
            onChange={(e) => {
              setMatchCase(e.target.checked);
              setMatches([]);
              setSearchIndex(-1);
              setMessage('');
            }}
          />
          <label htmlFor="match-case" className="text-xs text-zinc-700 cursor-pointer select-none">
            Match case sensitive
          </label>
        </div>

        {/* Status Message */}
        {message && (
          <p className={`text-xs select-none font-medium ${message.includes('No') ? 'text-amber-700' : 'text-emerald-700'}`}>
            {message}
          </p>
        )}

        {/* Action Triggers */}
        <div className="flex justify-end gap-2 pt-3 border-t border-[#cccccc]">
          <Button
            variant="ghost"
            onClick={() => closeDialog('findReplace')}
            className="text-xs px-3"
          >
            Cancel
          </Button>
          <Button
            variant="secondary"
            onClick={() => performSearch(true)}
            disabled={!findText}
            className="text-xs px-3.5"
          >
            Find Next
          </Button>
          <Button
            variant="secondary"
            onClick={handleReplace}
            disabled={!findText}
            className="text-xs px-3.5"
          >
            Replace
          </Button>
          <Button
            variant="primary"
            onClick={handleReplaceAll}
            disabled={!findText}
            className="text-xs px-3.5"
          >
            Replace All
          </Button>
        </div>
      </div>
    </Dialog>
  );
};

