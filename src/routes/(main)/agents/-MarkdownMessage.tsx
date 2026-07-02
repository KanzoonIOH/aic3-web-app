import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Collapse the model's inline provenance tags
//   [source_file: Foo.xlsx • row=1996 • Title: Bar]
// into a compact, readable citation: (source: Foo.xlsx, row 1996).
// The raw tag is unreadable when repeated after every list item.
function normalizeCitations(text: string) {
    return text.replace(
        /\[source_file:\s*([^•\]]+?)\s*•\s*row=([^•\]]+?)\s*(?:•[^\]]*)?\]/gi,
        (_m, file: string, row: string) =>
            ` _(source: ${file.trim()}, row ${row.trim()})_`,
    );
}

function normalizeMarkdown(text: string) {
    // NOTE: do NOT inject newlines before `* ` or `- ` — those match the second
    // `*` in `**bold:** text`, splitting bold markers and mangling the message.
    // The model already emits proper `\n\n` breaks; we only widen single `\n`
    // into paragraph breaks and space out headings/ordered lists/quotes.
    return normalizeCitations(text)
        .replace(/---(?=#{1,6}\s)/g, "---\n\n")
        .replace(/([^\n])(?=#{1,6}\s)/g, "$1\n\n")
        .replace(/([^\n])(?=\d+\. )/g, "$1\n\n")
        .replace(/([^\n])(?=>\s)/g, "$1\n\n")
        .replace(/\n/g, "\n\n")
        .replace(/\n{3,}/g, "\n\n");
}

export function MarkdownMessage({
    text,
    className,
}: {
    text: string;
    className?: string;
}) {
    return (
        <div className={className}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    h1: ({ children }) => (
                        <h1 className="mb-2 mt-4 text-lg font-semibold first:mt-0">
                            {children}
                        </h1>
                    ),
                    h2: ({ children }) => (
                        <h2 className="mb-2 mt-4 text-base font-semibold first:mt-0">
                            {children}
                        </h2>
                    ),
                    h3: ({ children }) => (
                        <h3 className="mb-1.5 mt-3 font-semibold first:mt-0">
                            {children}
                        </h3>
                    ),
                    p: ({ children }) => (
                        <p className="mb-2 last:mb-0">{children}</p>
                    ),
                    ul: ({ children }) => (
                        <ul className="mb-2 ml-5 list-disc space-y-1 last:mb-0">
                            {children}
                        </ul>
                    ),
                    ol: ({ children }) => (
                        <ol className="mb-2 ml-5 list-decimal space-y-1 last:mb-0">
                            {children}
                        </ol>
                    ),
                    blockquote: ({ children }) => (
                        <blockquote className="mb-2 border-l-2 border-muted-foreground/40 pl-3 text-muted-foreground last:mb-0">
                            {children}
                        </blockquote>
                    ),
                    hr: () => <hr className="my-3 border-border/70" />,
                    code: ({ children }) => (
                        <code className="rounded bg-muted px-1 py-0.5 text-[0.9em]">
                            {children}
                        </code>
                    ),
                    pre: ({ children }) => (
                        <pre className="mb-2 overflow-x-auto rounded-md bg-muted p-3 text-xs last:mb-0">
                            {children}
                        </pre>
                    ),
                }}
            >
                {normalizeMarkdown(text)}
            </ReactMarkdown>
        </div>
    );
}
