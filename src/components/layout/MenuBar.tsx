import React, { useState, useRef, useEffect } from 'react';
import { useNotepad } from '../../hooks/useNotepad';
import { 
  Dropdown, 
  DropdownItem, 
  DropdownDivider 
} from '../ui/dropdown';
import { 
  FolderOpen, 
  File, 
  Save, 
  Download, 
  Printer, 
  Undo2, 
  Redo2, 
  Search, 
  Compass, 
  Calendar, 
  WrapText, 
  ZoomIn, 
  ZoomOut, 
  RefreshCw, 
  HelpCircle, 
  Info,
  Maximize,
  Minimize,
  Minus,
  Table,
  Terminal
} from 'lucide-react';

export const MenuBar: React.FC = () => {
  const {
    state,
    newDocument,
    openFile,
    saveFile,
    exportHtml,
    printDocument,
    setWordWrap,
    setStatusBarVisible,
    zoomIn,
    zoomOut,
    zoomReset,
    toggleFullscreen,
    openDialog,
    editorInstance,
  } = useNotepad();

  const [activeMenu, setActiveMenu] = useState<'file' | 'edit' | 'insert' | 'view' | 'help' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Close menu on clicks anywhere
  const handleMenuClose = () => setActiveMenu(null);

  // Dynamic Hover switching (Desktop feel)
  const handleMenuHover = (menu: 'file' | 'edit' | 'insert' | 'view' | 'help') => {
    if (activeMenu !== null) {
      setActiveMenu(menu);
    }
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      
      if (isCmdOrCtrl && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        newDocument();
      }
      if (isCmdOrCtrl && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        fileInputRef.current?.click();
      }
      if (isCmdOrCtrl && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveFile();
      }
      if (isCmdOrCtrl && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        printDocument();
      }
      if (isCmdOrCtrl && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        openDialog('findReplace');
      }
      if (isCmdOrCtrl && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        openDialog('goToLine');
      }
      if (e.key === 'F5') {
        e.preventDefault();
        insertDateTime();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [newDocument, saveFile, printDocument, openDialog, editorInstance]);

  // Read local file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      openFile(file.name, text);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Helper formatting toggles
  const runEditorCommand = (commandName: string) => {
    if (!editorInstance) return;
    editorInstance.commands.focus();
    
    if (commandName === 'bold') editorInstance.commands.toggleBold();
    if (commandName === 'italic') editorInstance.commands.toggleItalic();
    if (commandName === 'underline') editorInstance.commands.toggleUnderline();
    if (commandName === 'undo') editorInstance.commands.undo();
    if (commandName === 'redo') editorInstance.commands.redo();
    if (commandName === 'selectAll') editorInstance.commands.selectAll();
    if (commandName === 'clear') editorInstance.commands.clearContent();
    if (commandName === 'horizontalRule') editorInstance.commands.setHorizontalRule();
    if (commandName === 'codeBlock') editorInstance.commands.toggleCodeBlock();
  };

  const insertDateTime = () => {
    if (!editorInstance) return;
    const now = new Date().toLocaleString();
    editorInstance.commands.focus();
    editorInstance.commands.insertContent(now);
  };

  const insertMockTable = () => {
    if (!editorInstance) return;
    editorInstance.commands.focus();
    editorInstance.commands.insertContent(
      `<table border="1" style="width: 100%; border-collapse: collapse; border: 1px solid #cccccc; margin: 10px 0;">
        <thead>
          <tr style="background-color: #f3f3f3;">
            <th style="padding: 6px; border: 1px solid #cccccc; text-align: left;">Header 1</th>
            <th style="padding: 6px; border: 1px solid #cccccc; text-align: left;">Header 2</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 6px; border: 1px solid #cccccc;">Data cell A</td>
            <td style="padding: 6px; border: 1px solid #cccccc;">Data cell B</td>
          </tr>
        </tbody>
      </table>`
    );
  };

  const triggerViewHelp = () => {
    alert(
      "Notepad Online Classic Help:\n\n" +
      "• File -> Open: Load text, markdown, or HTML from your computer.\n" +
      "• File -> Save: Download current note as a text file.\n" +
      "• Format options can be selected from the menu or compact icon toolbar.\n" +
      "• Insert -> Time/Date (F5): Append current time directly into your notes.\n" +
      "• View -> Fullscreen: Toggle full document writing width.\n" +
      "• Support shortcuts: Ctrl+S (Save), Ctrl+O (Open), Ctrl+F (Find & Replace), Ctrl+P (Print)."
    );
  };

  return (
    <div className="flex items-center justify-between border-b border-[#cccccc] bg-[#f3f3f3] px-3 py-1 select-none w-full no-print">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".txt,.html,.md,.json,.css,.js,.ts"
        className="hidden"
      />

      <div className="flex items-center gap-1">
        {/* Brand Label */}
        <div className="flex items-center gap-1.5 mr-6 py-0.5 select-none">
          <span className="text-xs font-bold tracking-wide text-black font-sans uppercase">
            Document Editor
          </span>
        </div>

        {/* Menu Buttons Group */}
        <div className="flex items-center gap-0.5 relative">
          
          {/* FILE MENU */}
          <div className="relative">
            <button
              onClick={() => setActiveMenu(activeMenu === 'file' ? null : 'file')}
              onMouseEnter={() => handleMenuHover('file')}
              className={`px-2 py-0.5 text-xs font-sans rounded-none border border-transparent cursor-default select-none ${
                activeMenu === 'file' 
                  ? 'bg-white border-[#999999] border-b-white z-20 text-black' 
                  : 'hover:bg-[#e2e2e2] text-black'
              }`}
            >
              File
            </button>
            <Dropdown isOpen={activeMenu === 'file'} onClose={handleMenuClose} align="left">
              <DropdownItem label="New" shortcut="Ctrl+N" icon={<File className="w-3 h-3" />} onClick={() => { newDocument(); handleMenuClose(); }} />
              <DropdownItem label="Open..." shortcut="Ctrl+O" icon={<FolderOpen className="w-3 h-3" />} onClick={() => { fileInputRef.current?.click(); handleMenuClose(); }} />
              <DropdownItem label="Save" shortcut="Ctrl+S" icon={<Save className="w-3 h-3" />} onClick={() => { saveFile(); handleMenuClose(); }} />
              <DropdownItem label="Export HTML" icon={<Download className="w-3 h-3" />} onClick={() => { exportHtml(); handleMenuClose(); }} />
              <DropdownDivider />
              <DropdownItem label="Print..." shortcut="Ctrl+P" icon={<Printer className="w-3 h-3" />} onClick={() => { printDocument(); handleMenuClose(); }} />
            </Dropdown>
          </div>

          {/* EDIT MENU */}
          <div className="relative">
            <button
              onClick={() => setActiveMenu(activeMenu === 'edit' ? null : 'edit')}
              onMouseEnter={() => handleMenuHover('edit')}
              className={`px-2 py-0.5 text-xs font-sans rounded-none border border-transparent cursor-default select-none ${
                activeMenu === 'edit' 
                  ? 'bg-white border-[#999999] border-b-white z-20 text-black' 
                  : 'hover:bg-[#e2e2e2] text-black'
              }`}
            >
              Edit
            </button>
            <Dropdown isOpen={activeMenu === 'edit'} onClose={handleMenuClose} align="left">
              <DropdownItem label="Undo" shortcut="Ctrl+Z" icon={<Undo2 className="w-3 h-3" />} disabled={editorInstance ? !editorInstance.can().undo() : true} onClick={() => { runEditorCommand('undo'); handleMenuClose(); }} />
              <DropdownItem label="Redo" shortcut="Ctrl+Y" icon={<Redo2 className="w-3 h-3" />} disabled={editorInstance ? !editorInstance.can().redo() : true} onClick={() => { runEditorCommand('redo'); handleMenuClose(); }} />
              <DropdownDivider />
              <DropdownItem label="Find & Replace..." shortcut="Ctrl+F" icon={<Search className="w-3 h-3" />} onClick={() => { openDialog('findReplace'); handleMenuClose(); }} />
              <DropdownItem label="Go to Line..." shortcut="Ctrl+G" icon={<Compass className="w-3 h-3" />} onClick={() => { openDialog('goToLine'); handleMenuClose(); }} />
              <DropdownDivider />
              <DropdownItem label="Select All" shortcut="Ctrl+A" onClick={() => { runEditorCommand('selectAll'); handleMenuClose(); }} />
              <DropdownItem label="Clear Content" onClick={() => { runEditorCommand('clear'); handleMenuClose(); }} />
            </Dropdown>
          </div>

          {/* INSERT MENU */}
          <div className="relative">
            <button
              onClick={() => setActiveMenu(activeMenu === 'insert' ? null : 'insert')}
              onMouseEnter={() => handleMenuHover('insert')}
              className={`px-2 py-0.5 text-xs font-sans rounded-none border border-transparent cursor-default select-none ${
                activeMenu === 'insert' 
                  ? 'bg-white border-[#999999] border-b-white z-20 text-black' 
                  : 'hover:bg-[#e2e2e2] text-black'
              }`}
            >
              Insert
            </button>
            <Dropdown isOpen={activeMenu === 'insert'} onClose={handleMenuClose} align="left">
              <DropdownItem label="Time/Date" shortcut="F5" icon={<Calendar className="w-3 h-3" />} onClick={() => { insertDateTime(); handleMenuClose(); }} />
              <DropdownItem label="Horizontal Line" icon={<Minus className="w-3 h-3" />} onClick={() => { runEditorCommand('horizontalRule'); handleMenuClose(); }} />
              <DropdownItem label="Table Grid" icon={<Table className="w-3 h-3" />} onClick={() => { insertMockTable(); handleMenuClose(); }} />
              <DropdownItem label="Code Block" icon={<Terminal className="w-3 h-3" />} onClick={() => { runEditorCommand('codeBlock'); handleMenuClose(); }} />
            </Dropdown>
          </div>

          {/* VIEW MENU */}
          <div className="relative">
            <button
              onClick={() => setActiveMenu(activeMenu === 'view' ? null : 'view')}
              onMouseEnter={() => handleMenuHover('view')}
              className={`px-2 py-0.5 text-xs font-sans rounded-none border border-transparent cursor-default select-none ${
                activeMenu === 'view' 
                  ? 'bg-white border-[#999999] border-b-white z-20 text-black' 
                  : 'hover:bg-[#e2e2e2] text-black'
              }`}
            >
              View
            </button>
            <Dropdown isOpen={activeMenu === 'view'} onClose={handleMenuClose} align="left">
              <DropdownItem label="Zoom In" icon={<ZoomIn className="w-3 h-3" />} onClick={zoomIn} />
              <DropdownItem label="Zoom Out" icon={<ZoomOut className="w-3 h-3" />} onClick={zoomOut} />
              <DropdownItem label="Restore 100%" icon={<RefreshCw className="w-3 h-3" />} onClick={zoomReset} />
              <DropdownDivider />
              <DropdownItem label="Status Bar" checked={state.view.statusBarVisible} onClick={() => setStatusBarVisible(!state.view.statusBarVisible)} />
              <DropdownItem label="Word Wrap" checked={state.view.wordWrap} icon={<WrapText className="w-3 h-3" />} onClick={() => setWordWrap(!state.view.wordWrap)} />
              <DropdownItem label="Full Page Width" checked={state.view.isFullscreen} icon={state.view.isFullscreen ? <Minimize className="w-3 h-3" /> : <Maximize className="w-3 h-3" />} onClick={() => toggleFullscreen()} />
            </Dropdown>
          </div>

          {/* HELP MENU */}
          <div className="relative">
            <button
              onClick={() => setActiveMenu(activeMenu === 'help' ? null : 'help')}
              onMouseEnter={() => handleMenuHover('help')}
              className={`px-2 py-0.5 text-xs font-sans rounded-none border border-transparent cursor-default select-none ${
                activeMenu === 'help' 
                  ? 'bg-white border-[#999999] border-b-white z-20 text-black' 
                  : 'hover:bg-[#e2e2e2] text-black'
              }`}
            >
              Help
            </button>
            <Dropdown isOpen={activeMenu === 'help'} onClose={handleMenuClose} align="left">
              <DropdownItem label="View Help" icon={<HelpCircle className="w-3 h-3" />} onClick={() => { triggerViewHelp(); handleMenuClose(); }} />
              <DropdownItem label="About Document Editor" icon={<Info className="w-3 h-3" />} onClick={() => { openDialog('about'); handleMenuClose(); }} />
            </Dropdown>
          </div>

        </div>
      </div>

      {/* Dirty indicator / Filename display */}
      <div className="text-[10px] font-mono text-zinc-500 select-none">
        {state.file.name}{state.file.isDirty ? ' *' : ''}
      </div>
    </div>
  );
};
