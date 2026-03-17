"use client";
import Editor from "@monaco-editor/react";

export default function CodeEditor({ code, onChange, language = "javascript" }) {
  return (
    <div className="h-full w-full border border-zinc-800 rounded-lg overflow-hidden">
      <Editor
        height="100%"
        defaultLanguage={language}
        theme="vs-dark"
        value={code}
        onChange={onChange}
        options={{
          fontSize: 14,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          lineNumbers: "on",
          automaticLayout: true,
          backgroundColor: "#1E1E2E",
        }}
      />
    </div>
  );
}
