import { useRef, useState } from "react";

interface CelEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function CelEditor({ value, onChange, placeholder = "Enter CEL expressions..." }: CelEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);

  // CEL keywords and common expressions for autocompletion
  const celKeywords = [
    "true",
    "false",
    "null",
    "size",
    "has",
    "in",
    "exists",
    "matches",
    "startsWith",
    "endsWith",
    "duration",
    "timestamp",
    "user",
    "request",
    "resource",
    "auth",
    "token",
  ];

  const celFunctions = [
    "size()",
    "has()",
    "exists()",
    "matches()",
    "startsWith()",
    "endsWith()",
    "user.roles.exists()",
    "request.auth != null",
    "resource.owner == user.id",
  ];

  // Get line numbers
  const lines = value.split("\n");
  const lineNumbers = Array.from({ length: Math.max(lines.length, 1) }, (_, i) => i + 1);

  // Syntax highlighting patterns
  const highlightSyntax = (text: string): string => {
    return (
      text
        // Keywords
        .replace(
          /\b(true|false|null|has|in|exists|size|matches|startsWith|endsWith)\b/g,
          '<span class="text-blue-600 font-medium">$1</span>',
        )
        // Strings
        .replace(/"([^"\\]|\\.)*"/g, '<span class="text-green-600">$&</span>')
        .replace(/'([^'\\]|\\.)*'/g, '<span class="text-green-600">$&</span>')
        // Numbers
        .replace(/\b\d+(\.\d+)?\b/g, '<span class="text-purple-600">$&</span>')
        // Operators
        .replace(/[&|!<>=+\-*/]+/g, '<span class="text-orange-600 font-medium">$&</span>')
        // Comments
        .replace(/(\/\/.*$)/gm, '<span class="text-gray-500 italic">$1</span>')
        // Common objects
        .replace(/\b(user|request|resource|auth|token)\b/g, '<span class="text-indigo-600 font-medium">$1</span>')
    );
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setCursorPosition(e.target.selectionStart);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = `${value.substring(0, start)}  ${value.substring(end)}`;
      onChange(newValue);

      // Set cursor position after the inserted spaces
      setTimeout(() => {
        textarea.setSelectionRange(start + 2, start + 2);
      }, 0);
    }
  };

  const insertSuggestion = (suggestion: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newValue = value.substring(0, start) + suggestion + value.substring(end);
    onChange(newValue);
    setShowSuggestions(false);

    // Focus back to textarea and set cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + suggestion.length, start + suggestion.length);
    }, 0);
  };

  return (
    <div className="overflow-hidden rounded-md-sys-shape-corner-md border border-md-sys-color-outline bg-md-sys-color-surface font-mono text-sm">
      <div className="flex">
        {/* Line Numbers */}
        <div className="select-none border-md-sys-color-outline border-r bg-md-sys-color-surface-container-low px-3 py-2 text-right text-md-sys-color-on-surface-variant">
          {lineNumbers.map((num) => (
            <div key={num} className="min-h-[24px] leading-6">
              {num}
            </div>
          ))}
        </div>

        {/* Editor Area */}
        <div className="relative flex-1">
          {/* Syntax Highlighted Background */}
          <div
            className="pointer-events-none absolute inset-0 select-none overflow-hidden whitespace-pre-wrap break-words p-3 text-transparent"
            style={{
              fontFamily: "inherit",
              fontSize: "inherit",
              lineHeight: "1.5",
              tabSize: 2,
            }}
            dangerouslySetInnerHTML={{
              __html: highlightSyntax(value || " "), // Ensure non-empty for proper height
            }}
          />

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="relative z-10 h-full w-full resize-none bg-transparent p-3 text-md-sys-color-on-surface outline-none"
            style={{
              fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
              fontSize: "14px",
              lineHeight: "1.5",
              tabSize: 2,
              minHeight: "120px",
            }}
            spellCheck={false}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          />

          {/* Auto-completion Suggestions */}
          {showSuggestions && (
            <div className="absolute top-full right-0 left-0 z-20 max-h-48 overflow-y-auto rounded-md-sys-shape-corner-md border border-md-sys-color-outline bg-md-sys-color-surface shadow-lg">
              <div className="p-2">
                <div className="mb-2 px-2 text-md-sys-color-on-surface-variant text-xs">Common CEL Expressions:</div>
                {celFunctions.map((func, index) => (
                  <div
                    key={index}
                    onClick={() => insertSuggestion(func)}
                    className="cursor-pointer rounded px-2 py-1 text-sm hover:bg-md-sys-color-surface-container-high"
                  >
                    {func}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Help Text */}
      <div className="border-md-sys-color-outline border-t bg-md-sys-color-surface-container-low px-3 py-2 text-md-sys-color-on-surface-variant text-xs">
        <div className="mb-1">
          <strong>CEL Examples:</strong>
        </div>
        <div>
          • <code>user.roles.exists(r, r == 'admin')</code> - Check user roles
        </div>
        <div>
          • <code>request.auth != null</code> - Require authentication
        </div>
        <div>
          • <code>resource.owner == user.id</code> - Owner-only access
        </div>
        <div>
          • <code>true</code> - Allow all (use sparingly)
        </div>
      </div>
    </div>
  );
}
