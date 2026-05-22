import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import { useNotepad } from '../../hooks/useNotepad';

export const EditorArea: React.FC = () => {
  const {
    state,
    setContent,
    updateStats,
    setEditorInstance,
  } = useNotepad();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: {
          HTMLAttributes: {
            class: 'bg-[#f5f5f5] text-black border border-[#cccccc] rounded-none p-2 font-mono text-xs my-2',
          },
        },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Placeholder.configure({
        placeholder: 'Type document content here...',
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'focus:outline-none min-h-full font-inherit select-text',
      },
    },
    onUpdate: ({ editor }) => {
      const plainText = editor.getText();
      const htmlContent = editor.getHTML();
      
      const words = plainText.trim() ? plainText.trim().split(/\s+/).length : 0;
      const chars = plainText.length;
      
      setContent(htmlContent, true);
      updateStats({ wordCount: words, charCount: chars });
      calculateCursorPosition(editor);
    },
    onSelectionUpdate: ({ editor }) => {
      calculateCursorPosition(editor);
    },
  });

  const calculateCursorPosition = (editorInstance: any) => {
    if (!editorInstance) return;

    const { state: pmState } = editorInstance;
    const { doc, selection } = pmState;
    const { from } = selection;

    let line = 1;
    let column = 1;
    let charOffset = 0;

    doc.descendants((node: any, pos: number) => {
      if (pos >= from) return false;

      if (node.isBlock) {
        if (charOffset > 0) {
          line++;
          column = 1;
        }
        charOffset = pos;
      } else if (node.isText) {
        const nodeText = node.text || '';
        const nodeLen = nodeText.length;

        if (from >= pos && from <= pos + nodeLen) {
          column += (from - pos);
          return false;
        } else {
          column += nodeLen;
        }
      }
      return true;
    });

    updateStats({ line, column });
  };

  useEffect(() => {
    if (editor) {
      setEditorInstance(editor);
    }
    return () => {
      if (editor) {
        setEditorInstance(null);
      }
    };
  }, [editor, setEditorInstance]);

  useEffect(() => {
    if (editor && state.file.content === '' && editor.isEmpty) {
      editor.commands.setContent('<p></p>');
    }
  }, [editor, state.file.content]);

  // Dynamic zoom calculations
  const scaledFontSize = Math.round(state.font.size * (state.view.zoom / 100));

  // Determine font family styling mapping
  const getFontFamilyStyle = () => {
    switch (state.font.family) {
      case 'Arial':
        return 'Arial, Helvetica, sans-serif';
      case 'Times New Roman':
        return "'Times New Roman', Times, serif";
      case 'Courier New':
        return "'Courier New', Courier, monospace";
      case 'Georgia':
        return 'Georgia, serif';
      default:
        return 'Arial, Helvetica, sans-serif';
    }
  };

  return (
    <div 
      className="flex-1 w-full bg-[#f0f0f0] overflow-y-auto flex justify-center focus-within:ring-0 select-text"
      style={{ minHeight: 'calc(100vh - 85px)' }}
    >
      {/* Paper/Document container */}
      <div 
        className={`
          bg-white text-black border border-[#b0b0b0] shadow-sm select-text
          outline-none transition-all duration-150 font-inherit
          ${state.view.isFullscreen 
            ? 'w-full mx-2 my-2 p-8 min-h-[98%]' 
            : 'w-full max-w-[812px] min-h-[1056px] mx-4 my-8 p-12 md:p-16 rounded-none'
          }
        `}
        style={{
          fontFamily: getFontFamilyStyle(),
          fontSize: `${scaledFontSize}px`,
          lineHeight: '1.5',
        }}
      >
        <EditorContent 
          editor={editor} 
          className="h-full select-text"
        />
      </div>
    </div>
  );
};
