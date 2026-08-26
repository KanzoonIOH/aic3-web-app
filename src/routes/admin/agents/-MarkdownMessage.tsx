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
    // into paragraph breaks and space out headings/quotes.
    //
    // We deliberately DON'T force blank lines between ordered-list items:
    // a blank line makes CommonMark treat each `1.`/`2.`/`3.` as its own
    // single-item list, so every item restarts at 1. (the "all shows as 1" bug).
    return normalizeCitations(text)
        .replace(/---(?=#{1,6}\s)/g, "---\n\n")
        .replace(/([^\n])(?=#{1,6}\s)/g, "$1\n\n")
        .replace(/([^\n])(?=>\s)/g, "$1\n\n")
        // Widen single newlines into paragraph breaks, but leave block
        // structures whose lines MUST stay contiguous untouched:
        //  - ordered lists `1. ` / bullets `- `,`* ` (blank lines reset
        //    numbering to 1 and loosen the list — the "all shows as 1" bug)
        //  - GFM table rows `| ... |` and divider rows `|---|` (a blank line
        //    between rows breaks the table into plain paragraphs)
        // Skip if EITHER the line ending here or the next line is such a line.
        .replace(
            /^(.*[^\n])\n(?!\n|\d+\. |[-*] |\|)/gm,
            (m, line: string) =>
                /^(\s*(\d+\.|[-*])\s|\s*\|)/.test(line) ? m : `${line}\n\n`,
        )
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
                    table: ({ children }) => (
                        <div className="mb-2 overflow-x-auto last:mb-0">
                            <table className="w-full border-collapse text-sm">
                                {children}
                            </table>
                        </div>
                    ),
                    thead: ({ children }) => (
                        <thead className="border-b border-border">
                            {children}
                        </thead>
                    ),
                    th: ({ children }) => (
                        <th className="border border-border px-2 py-1 text-left font-semibold">
                            {children}
                        </th>
                    ),
                    td: ({ children }) => (
                        <td className="border border-border px-2 py-1 align-top">
                            {children}
                        </td>
                    ),
                }}
            >
                {normalizeMarkdown(text)}
            </ReactMarkdown>
        </div>
    );
}
