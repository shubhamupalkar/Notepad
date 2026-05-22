import React, { useState, useEffect } from 'react';
import { Dialog } from '../ui/dialog';
import { Button } from '../ui/button';
import { useNotepad } from '../../hooks/useNotepad';

export const GoToLineDialog: React.FC = () => {
  const { state, closeDialog, editorInstance } = useNotepad();
  const [lineNumber, setLineNumber] = useState('1');
  const [totalLines, setTotalLines] = useState(1);
  const [errorMsg, setErrorMsg] = useState('');

  // Calculate total lines in editor
  useEffect(() => {
    if (state.dialogs.goToLine && editorInstance) {
      setErrorMsg('');
      setLineNumber(String(state.stats.line));
      
      let count = 0;
      editorInstance.state.doc.descendants((node: any) => {
        if (node.type.name === 'paragraph') {
          count++;
        }
        return true;
      });

      // Default to at least 1 line
      setTotalLines(Math.max(1, count));
    }
  }, [state.dialogs.goToLine, editorInstance, state.stats.line]);

  const handleGoTo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editorInstance) return;

    const lineVal = parseInt(lineNumber, 10);
    if (isNaN(lineVal) || lineVal < 1 || lineVal > totalLines) {
      setErrorMsg(`Line number must be between 1 and ${totalLines}.`);
      return;
    }

    try {
      editorInstance.commands.focus();
      
      let currentParagraphIndex = 0;
      let targetPos = -1;
      
      editorInstance.state.doc.descendants((node: any, pos: number) => {
        if (node.type.name === 'paragraph') {
          currentParagraphIndex++;
          if (currentParagraphIndex === lineVal) {
            // Found target paragraph node start position
            // Add 1 to put selection inside paragraph content if it has text, or keep at start
            targetPos = pos + 1;
            return false; // stop traversal
          }
        }
        return true;
      });

      if (targetPos !== -1) {
        // Clamp position to valid document bounds
        const maxPos = editorInstance.state.doc.content.size;
        const resolvedPos = Math.min(maxPos, Math.max(0, targetPos));
        
        editorInstance.commands.setTextSelection(resolvedPos);
        
        // Scroll target paragraph into view
        const element = editorInstance.view.domAtPos(resolvedPos).node as HTMLElement;
        if (element && element.scrollIntoView) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        
        closeDialog('goToLine');
      } else {
        setErrorMsg('Could not find target line position.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error jumping to target line.');
    }
  };

  return (
    <Dialog
      isOpen={state.dialogs.goToLine}
      onClose={() => closeDialog('goToLine')}
      title="Go to Line"
      size="sm"
    >
      <form onSubmit={handleGoTo} className="space-y-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="line-number-input" className="text-sm text-zinc-700 select-none">
            Line number (1 - {totalLines}):
          </label>
          <input
            id="line-number-input"
            type="number"
            min="1"
            max={totalLines}
            className="w-full px-3 py-1.5 border border-[#999999] bg-white text-black focus:outline-none focus:border-zinc-800 font-mono text-sm"
            value={lineNumber}
            onChange={(e) => {
              setLineNumber(e.target.value);
              setErrorMsg('');
            }}
            placeholder="Enter line..."
            required
            autoFocus
          />
        </div>

        {errorMsg && (
          <p className="text-xs text-rose-600 font-medium select-none">
            {errorMsg}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-3 border-t border-[#cccccc]">
          <Button
            type="button"
            variant="ghost"
            onClick={() => closeDialog('goToLine')}
            className="text-xs px-3"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="text-xs px-4"
          >
            Go To
          </Button>
        </div>
      </form>
    </Dialog>
  );
};

