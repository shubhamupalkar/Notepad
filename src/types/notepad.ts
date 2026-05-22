export interface FileMetadata {
  name: string;
  isDirty: boolean;
  content: string;
}

export interface EditorStats {
  line: number;
  column: number;
  wordCount: number;
  charCount: number;
}

export interface ViewOptions {
  statusBarVisible: boolean;
  wordWrap: boolean;
  zoom: number; // percentage, e.g. 100
  isFullscreen: boolean;
}

export interface FontSettings {
  family: string;
  size: number; // in pixels, e.g. 16
}

export interface DialogStates {
  about: boolean;
  findReplace: boolean;
  goToLine: boolean;
}

export interface NotepadState {
  file: FileMetadata;
  stats: EditorStats;
  view: ViewOptions;
  font: FontSettings;
  dialogs: DialogStates;
}

export interface NotepadContextProps {
  state: NotepadState;
  
  // File operations
  newDocument: () => void;
  openFile: (name: string, content: string) => void;
  saveFile: () => void;
  exportHtml: () => void;
  printDocument: () => void;
  
  // State setters & updates
  setFileName: (name: string) => void;
  setContent: (content: string, isDirty?: boolean) => void;
  updateStats: (stats: Partial<EditorStats>) => void;
  
  // View operations
  setStatusBarVisible: (visible: boolean) => void;
  setWordWrap: (wrap: boolean) => void;
  setZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomReset: () => void;
  toggleFullscreen: () => void;
  
  // Font settings
  setFontFamily: (family: string) => void;
  setFontSize: (size: number) => void;
  
  // Dialog operations
  openDialog: (dialog: keyof DialogStates) => void;
  closeDialog: (dialog: keyof DialogStates) => void;
  
  // Formatting helper triggers from toolbar
  editorInstance: any; // TipTap editor instance, updated dynamically
  setEditorInstance: (editor: any) => void;
}
