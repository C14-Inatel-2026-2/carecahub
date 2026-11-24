import Link from "@tiptap/extension-link";
import { type Editor, EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
} from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const extensions = [
  StarterKit.configure({
    heading: { levels: [2, 3] },
  }),
  Link.configure({
    HTMLAttributes: {
      class: "text-primary underline underline-offset-4",
      rel: "noopener noreferrer",
      target: "_blank",
    },
    openOnClick: false,
  }),
];

type ActivityRichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
};

function ToolbarButton({
  active,
  disabled,
  label,
  onClick,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant={active ? "secondary" : "ghost"}
      size="icon-sm"
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

function ActivityRichTextToolbar({ editor }: { editor: Editor | null }) {
  function setLink() {
    if (!editor) return;
    const url = window.prompt(
      "Informe o endereço do link",
      editor.getAttributes("link").href ?? "",
    );
    if (url === null) return;
    if (!url.trim()) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url.trim() })
      .run();
  }

  return (
    <div
      className="flex flex-wrap gap-1 border-b px-3 py-2"
      aria-label="Formatação do texto"
    >
      <ToolbarButton
        label="Negrito"
        active={editor?.isActive("bold")}
        disabled={!editor}
        onClick={() => editor?.chain().focus().toggleBold().run()}
      >
        <Bold />
      </ToolbarButton>
      <ToolbarButton
        label="Itálico"
        active={editor?.isActive("italic")}
        disabled={!editor}
        onClick={() => editor?.chain().focus().toggleItalic().run()}
      >
        <Italic />
      </ToolbarButton>
      <ToolbarButton
        label="Lista com marcadores"
        active={editor?.isActive("bulletList")}
        disabled={!editor}
        onClick={() => editor?.chain().focus().toggleBulletList().run()}
      >
        <List />
      </ToolbarButton>
      <ToolbarButton
        label="Lista numerada"
        active={editor?.isActive("orderedList")}
        disabled={!editor}
        onClick={() => editor?.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered />
      </ToolbarButton>
      <ToolbarButton
        label="Adicionar link"
        active={editor?.isActive("link")}
        disabled={!editor}
        onClick={setLink}
      >
        <LinkIcon />
      </ToolbarButton>
    </div>
  );
}

export function ActivityRichTextEditor({
  value,
  onChange,
}: ActivityRichTextEditorProps) {
  const editor = useEditor({
    extensions,
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        "aria-label": "Instruções",
        class:
          "tiptap min-h-80 px-4 py-3 text-sm outline-none [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_h2]:mb-3 [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:font-medium [&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mb-3 [&_p:last-child]:mb-0 [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-6",
      },
    },
    onUpdate: ({ editor: currentEditor }) => onChange(currentEditor.getHTML()),
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML())
      editor.commands.setContent(value, { emitUpdate: false });
  }, [editor, value]);

  return (
    <div data-slot="activity-rich-text-editor" className="relative">
      <ActivityRichTextToolbar editor={editor} />
      {(!editor || editor.isEmpty) && (
        <p
          className="pointer-events-none font- absolute top-14 left-4 text-sm text-muted-foreground"
          aria-hidden
        >
          Escreva as instruções para os alunos
        </p>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}

export function ActivityRichTextContent({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  const editor = useEditor({
    extensions,
    content,
    editable: false,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: cn(
          "tiptap text-sm font-light [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_h2]:mb-3 [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:font-medium [&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mb-3 [&_p:last-child]:mb-0 [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-6",
          className,
        ),
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML())
      editor.commands.setContent(content, { emitUpdate: false });
  }, [content, editor]);

  return <EditorContent editor={editor} />;
}

export function activityRichTextToPlainText(content: string) {
  return content
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
