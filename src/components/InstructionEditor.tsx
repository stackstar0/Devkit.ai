import { useState, useCallback } from "react";
import { Copy, Check, Sparkles, Edit2, Eye } from "lucide-react";
import { toast } from "sonner";

interface Props {
  content: string;
}

/**
 * Syntax-highlighted markdown viewer using CSS-only token colouring.
 * Falls back gracefully — no external syntax library required.
 * Supports a read-only / edit toggle for power users.
 */
export function InstructionEditor({ content }: Props) {
  const [copied, setCopied] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [localContent, setLocalContent] = useState(content);

  // Sync when parent streams in new content
  if (!editMode && content !== localContent) setLocalContent(content);

  const copy = useCallback(() => {
    navigator.clipboard.writeText(localContent);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 1500);
  }, [localContent]);

  function highlight(text: string): string {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      // Headers
      .replace(/^(#{1,6})\s(.+)$/gm, (_, h, t) =>
        `<span class="md-heading" style="color:oklch(0.78 0.16 285);font-weight:700;font-size:${1 - (h.length - 1) * 0.08}em">${h} ${t}</span>`
      )
      // Bold
      .replace(/\*\*(.+?)\*\*/g, '<strong style="color:oklch(0.88 0.06 260)">$1</strong>')
      // Inline code
      .replace(/`([^`]+)`/g, '<code style="color:oklch(0.75 0.18 200);background:oklch(0.16 0.025 270 / 0.8);padding:1px 5px;border-radius:4px;font-size:0.9em">$1</code>')
      // Bullets
      .replace(/^(\s*[-*+])\s/gm, '<span style="color:oklch(0.66 0.21 285)">$1</span> ')
      // Numbered lists
      .replace(/^(\s*\d+\.)\s/gm, '<span style="color:oklch(0.6 0.22 305)">$1</span> ')
      // Blockquotes
      .replace(/^(&gt;)\s(.+)$/gm,
        '<span style="color:oklch(0.65 0.04 265);border-left:3px solid oklch(0.66 0.21 285 / 0.5);padding-left:8px;display:inline-block">$1 $2</span>'
      );
  }

  return (
    <div className="glass rounded-2xl overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/60">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Sparkles className="size-3" />
          <span>instruction.md</span>
          {editMode && (
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/15 text-amber-300 border border-amber-500/25">
              Editing
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setEditMode((e) => !e)}
            className="text-xs inline-flex items-center gap-1 rounded-lg px-2 py-1 border border-border hover:bg-card transition-colors"
          >
            {editMode ? <Eye className="size-3" /> : <Edit2 className="size-3" />}
            {editMode ? "Preview" : "Edit"}
          </button>
          <button
            onClick={copy}
            className="text-xs inline-flex items-center gap-1.5 rounded-lg px-2 py-1 border border-border hover:bg-card transition-colors"
          >
            {copied ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      {/* Content */}
      {editMode ? (
        <textarea
          value={localContent}
          onChange={(e) => setLocalContent(e.target.value)}
          className="w-full bg-transparent p-4 text-xs leading-relaxed outline-none text-foreground/90 font-mono resize-none"
          style={{ minHeight: 480 }}
          spellCheck={false}
        />
      ) : (
        <div
          className="max-h-[520px] overflow-auto p-4 text-xs leading-7 text-foreground/90 font-mono scrollbar-none"
          dangerouslySetInnerHTML={{
            __html: localContent
              ? highlight(localContent)
              : '<span style="opacity:0.4"># Your instruction set will appear here once generation completes.</span>',
          }}
        />
      )}

      {/* Footer */}
      <div className="px-4 py-2 border-t border-border/40 flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">
          {localContent.split("\n").length} lines · {localContent.length} chars
        </span>
        <span className="text-[10px] text-muted-foreground">Markdown</span>
      </div>
    </div>
  );
}
