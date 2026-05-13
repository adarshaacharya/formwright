import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import Editor from "@monaco-editor/react";
import type * as Monaco from "monaco-editor";
import type { SchemaIssue } from "../schema-tools";
import { buildSchemaMarkers } from "../schema-tools";

export interface MonacoJsonEditorHandle {
  format: () => void;
}

interface MonacoJsonEditorProps {
  value: string;
  onChange: (next: string) => void;
  readOnly?: boolean;
  height?: string;
  issues?: SchemaIssue[];
}

export const MonacoJsonEditor = forwardRef<MonacoJsonEditorHandle, MonacoJsonEditorProps>(function MonacoJsonEditor(
  { value, onChange, readOnly = false, height = "44vh", issues = [] },
  ref,
): React.JSX.Element {
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof Monaco | null>(null);

  useImperativeHandle(ref, () => ({
    format() {
      void editorRef.current?.getAction("editor.action.formatDocument")?.run();
    },
  }));

  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    const model = editor?.getModel();

    if (!editor || !monaco || !model) {
      return;
    }

    const markers = buildSchemaMarkers(value, issues).map((issue) => ({
      severity: monaco.MarkerSeverity.Error,
      message: issue.message,
      startLineNumber: issue.startLineNumber,
      startColumn: issue.startColumn,
      endLineNumber: issue.endLineNumber,
      endColumn: issue.endColumn,
    }));

    monaco.editor.setModelMarkers(model, "schema-lab", markers);
  }, [issues, value]);

  return (
    <Editor
      height={height}
      defaultLanguage="json"
      language="json"
      theme="vs-dark"
      value={value}
      onChange={(next) => onChange(next ?? "")}
      options={{
        readOnly,
        minimap: { enabled: false },
        fontSize: 14,
        lineHeight: 24,
        wordWrap: "on",
        scrollBeyondLastLine: false,
        automaticLayout: true,
        formatOnPaste: true,
        formatOnType: true,
        tabSize: 2,
      }}
      onMount={(editor, monaco) => {
        editorRef.current = editor;
        monacoRef.current = monaco;
        monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
          validate: true,
          allowComments: false,
          trailingCommas: "error",
          enableSchemaRequest: false,
        });
      }}
    />
  );
});
