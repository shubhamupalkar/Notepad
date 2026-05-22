import React from 'react';
import { useNotepad } from '../../hooks/useNotepad';
import { Button } from '../ui/button';
import { 
  FileText, 
  FolderOpen, 
  Save, 
  Printer,
  Undo, 
  Redo, 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  Code,
  List, 
  ListOrdered, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify, 
  Search, 
  ZoomIn, 
  ZoomOut,
  Maximize,
  Minimize
} from 'lucide-react';

export const Toolbar: React.FC = () => {
  const {
    state,
    newDocument,
    saveFile,
    printDocument,
    zoomIn,
    zoomOut,
    zoomReset,
    toggleFullscreen,
    setFontFamily,
    setFontSize,
    openDialog,
    editorInstance,
  } = useNotepad();

  const handleOpenClick = () => {
    const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    hiddenInput?.click();
  };

  const runFormat = (command: string, value?: string) => {
    if (!editorInstance) return;
    editorInstance.commands.focus();

    if (command === 'bold') editorInstance.commands.toggleBold();
    if (command === 'italic') editorInstance.commands.toggleItalic();
    if (command === 'underline') editorInstance.commands.toggleUnderline();
    if (command === 'strike') editorInstance.commands.toggleStrike();
    if (command === 'code') editorInstance.commands.toggleCode();
    if (command === 'bulletList') editorInstance.commands.toggleBulletList();
    if (command === 'orderedList') editorInstance.commands.toggleOrderedList();
    if (command === 'undo') editorInstance.commands.undo();
    if (command === 'redo') editorInstance.commands.redo();
    
    if (command === 'align') {
      if (value) {
        editorInstance.commands.setTextAlign(value);
      } else {
        editorInstance.commands.unsetTextAlign();
      }
    }
  };

  const isFormatActive = (name: string | { textAlign: string }, attributes?: any) => {
    if (!editorInstance) return false;
    if (typeof name === 'object') {
      return editorInstance.isActive(name);
    }
    return editorInstance.isActive(name as string, attributes);
  };

  const canUndo = editorInstance ? editorInstance.can().undo() : false;
  const canRedo = editorInstance ? editorInstance.can().redo() : false;

  const fontFamilies = [
    { label: 'Arial', value: 'Arial, sans-serif' },
    { label: 'Times New Roman', value: "'Times New Roman', serif" },
    { label: 'Courier New', value: "'Courier New', monospace" },
    { label: 'Georgia', value: 'Georgia, serif' }
  ];

  const fontSizes = [12, 14, 16, 18, 20, 24, 28, 32, 36, 48];

  return (
    <div className="flex items-center gap-1 px-3 py-1.5 border-b border-[#cccccc] bg-[#f3f3f3] w-full overflow-x-auto select-none no-print">
      
      {/* File Controls */}
      <div className="flex items-center gap-0.5">
        <Button variant="ghost" size="icon" onClick={newDocument} title="New Document (Ctrl+N)">
          <FileText className="w-3.5 h-3.5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleOpenClick} title="Open File (Ctrl+O)">
          <FolderOpen className="w-3.5 h-3.5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={saveFile} title="Save File (Ctrl+S)">
          <Save className="w-3.5 h-3.5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={printDocument} title="Print Document (Ctrl+P)">
          <Printer className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="h-4 w-[1px] bg-[#cccccc] mx-1" />

      {/* History Controls */}
      <div className="flex items-center gap-0.5">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => runFormat('undo')} 
          disabled={!canUndo} 
          title="Undo (Ctrl+Z)"
        >
          <Undo className="w-3.5 h-3.5" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => runFormat('redo')} 
          disabled={!canRedo} 
          title="Redo (Ctrl+Y)"
        >
          <Redo className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="h-4 w-[1px] bg-[#cccccc] mx-1" />

      {/* Font Family Selector Dropdown */}
      <div className="flex items-center gap-1">
        <select
          title="Font Family"
          className="px-1.5 py-0.5 text-xs bg-white border border-[#cccccc] rounded-none outline-none font-sans focus:border-[#999999] h-6 cursor-default"
          value={state.font.family}
          onChange={(e) => setFontFamily(e.target.value)}
        >
          {fontFamilies.map(f => (
            <option key={f.label} value={f.label}>
              {f.label}
            </option>
          ))}
        </select>

        {/* Font Size Selector Dropdown */}
        <select
          title="Font Size"
          className="px-1.5 py-0.5 text-xs bg-white border border-[#cccccc] rounded-none outline-none font-sans focus:border-[#999999] h-6 cursor-default w-14"
          value={state.font.size}
          onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
        >
          {fontSizes.map(size => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>

      <div className="h-4 w-[1px] bg-[#cccccc] mx-1" />

      {/* Character Formats */}
      <div className="flex items-center gap-0.5">
        <Button 
          variant="ghost" 
          size="icon" 
          active={isFormatActive('bold')} 
          onClick={() => runFormat('bold')} 
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-3.5 h-3.5" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          active={isFormatActive('italic')} 
          onClick={() => runFormat('italic')} 
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-3.5 h-3.5" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          active={isFormatActive('underline')} 
          onClick={() => runFormat('underline')} 
          title="Underline (Ctrl+U)"
        >
          <Underline className="w-3.5 h-3.5" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          active={isFormatActive('strike')} 
          onClick={() => runFormat('strike')} 
          title="Strikethrough"
        >
          <Strikethrough className="w-3.5 h-3.5" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          active={isFormatActive('code')} 
          onClick={() => runFormat('code')} 
          title="Inline Code"
        >
          <Code className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="h-4 w-[1px] bg-[#cccccc] mx-1" />

      {/* Lists */}
      <div className="flex items-center gap-0.5">
        <Button 
          variant="ghost" 
          size="icon" 
          active={isFormatActive('bulletList')} 
          onClick={() => runFormat('bulletList')} 
          title="Bulleted List"
        >
          <List className="w-3.5 h-3.5" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          active={isFormatActive('orderedList')} 
          onClick={() => runFormat('orderedList')} 
          title="Numbered List"
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="h-4 w-[1px] bg-[#cccccc] mx-1" />

      {/* Alignments */}
      <div className="flex items-center gap-0.5">
        <Button 
          variant="ghost" 
          size="icon" 
          active={isFormatActive({ textAlign: 'left' })} 
          onClick={() => runFormat('align', 'left')} 
          title="Align Left"
        >
          <AlignLeft className="w-3.5 h-3.5" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          active={isFormatActive({ textAlign: 'center' })} 
          onClick={() => runFormat('align', 'center')} 
          title="Align Center"
        >
          <AlignCenter className="w-3.5 h-3.5" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          active={isFormatActive({ textAlign: 'right' })} 
          onClick={() => runFormat('align', 'right')} 
          title="Align Right"
        >
          <AlignRight className="w-3.5 h-3.5" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          active={isFormatActive({ textAlign: 'justify' })} 
          onClick={() => runFormat('align', 'justify')} 
          title="Align Justify"
        >
          <AlignJustify className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="h-4 w-[1px] bg-[#cccccc] mx-1" />

      {/* Find/Search */}
      <div className="flex items-center gap-0.5">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => openDialog('findReplace')} 
          title="Find and Replace (Ctrl+F)"
        >
          <Search className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Fullscreen & Zoom (Right Aligned) */}
      <div className="flex items-center gap-1 ml-auto">
        <Button variant="ghost" size="icon" onClick={zoomOut} title="Zoom Out">
          <ZoomOut className="w-3.5 h-3.5" />
        </Button>
        <button 
          onClick={zoomReset}
          title="Reset Zoom to 100%"
          className="text-[10px] font-mono font-medium text-zinc-650 w-9 text-center select-none cursor-default hover:bg-[#eaeaea] py-0.5"
        >
          {state.view.zoom}%
        </button>
        <Button variant="ghost" size="icon" onClick={zoomIn} title="Zoom In">
          <ZoomIn className="w-3.5 h-3.5" />
        </Button>
        
        <div className="h-4 w-[1px] bg-[#cccccc] mx-1" />

        <Button 
          variant="ghost" 
          size="icon" 
          active={state.view.isFullscreen}
          onClick={toggleFullscreen} 
          title="Toggle Fullscreen Document Width"
        >
          {state.view.isFullscreen ? (
            <Minimize className="w-3.5 h-3.5" />
          ) : (
            <Maximize className="w-3.5 h-3.5" />
          )}
        </Button>
      </div>

    </div>
  );
};
