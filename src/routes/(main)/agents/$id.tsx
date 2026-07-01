import { getAgent, updateAgent, type Agent } from "@/api/agents";
import { LogsTable } from "@/components/logs-table";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { resolveServerMessage, textareaClass } from "@/lib/utils";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
    BookIcon,
    Check,
    Copy,
    LayoutGridIcon,
    Link,
    MessagesSquareIcon,
    Pencil,
    PlugIcon,
    ScrollText,
    SmilePlusIcon,
    TerminalSquare,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { z } from "zod";
import { ChatSanbox } from "./-ChatSandbox";
import { ChatWidget } from "./-ChatWidget";
import { Knowledges } from "./-Knowledges";
import { Mcps } from "./-Mcps";
import { Overview } from "./-Overview";
import { Persona } from "./-Persona";

export const Route = createFileRoute("/(main)/agents/$id")({
    component: RouteComponent,
});

const updateAgentSchema = z.object({
    name: z.string().trim().min(1, "Name is required"),
    description: z.string().trim(),
    is_active: z.boolean(),
    webhook_uri: z
        .string()
        .trim()
        .refine((value) => {
            if (value.length === 0) return true;

            try {
                new URL(value);
                return true;
            } catch {
                return false;
            }
        }, "Webhook URI must be a valid URL"),
});

type UpdateAgentValues = z.infer<typeof updateAgentSchema>;

export function EditAgentDialog({
    agent,
    trigger,
}: {
    agent: Agent;
    trigger?: ReactNode;
}) {
    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: (payload: UpdateAgentValues) =>
            updateAgent(agent.id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["agents"] });
            queryClient.invalidateQueries({ queryKey: ["agents", agent.id] });
            setOpen(false);
        },
    });

    const form = useForm({
        defaultValues: {
            name: agent.name,
            description: agent.description,
            is_active: agent.is_active,
            webhook_uri: agent.webhook_uri,
        },
        onSubmit: async ({ value }) => {
            const result = updateAgentSchema.safeParse(value);
            if (!result.success) return;

            await mutation.mutateAsync(result.data);
        },
    });

    function handleOpenChange(nextOpen: boolean) {
        setOpen(nextOpen);
        mutation.reset();
        form.reset({
            name: agent.name,
            description: agent.description,
            is_active: agent.is_active,
            webhook_uri: agent.webhook_uri,
        });
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                {trigger ?? (
                    <Button size="sm" variant="outline">
                        <Pencil className="size-3.5" />
                        Edit agent
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit agent</DialogTitle>
                    <DialogDescription>
                        Update this agent's public details and webhook target.
                    </DialogDescription>
                </DialogHeader>

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        form.handleSubmit();
                    }}
                    className="flex flex-col gap-4"
                >
                    {mutation.isError && (
                        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                            {resolveServerMessage(mutation.error)}
                        </p>
                    )}

                    <form.Field
                        name="name"
                        validators={{
                            onChange: ({ value }) => {
                                const result =
                                    updateAgentSchema.shape.name.safeParse(
                                        value,
                                    );
                                return result.success
                                    ? undefined
                                    : result.error.issues[0]?.message;
                            },
                            onSubmit: ({ value }) => {
                                const result =
                                    updateAgentSchema.shape.name.safeParse(
                                        value,
                                    );
                                return result.success
                                    ? undefined
                                    : result.error.issues[0]?.message;
                            },
                        }}
                    >
                        {(field) => (
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor={field.name}>Name</Label>
                                <Input
                                    id={field.name}
                                    name={field.name}
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => {
                                        field.handleChange(e.target.value);
                                        mutation.reset();
                                    }}
                                    aria-invalid={
                                        field.state.meta.errors.length > 0
                                    }
                                    autoFocus
                                />
                                {field.state.meta.errors.length > 0 && (
                                    <p className="text-xs text-destructive">
                                        {field.state.meta.errors[0]}
                                    </p>
                                )}
                            </div>
                        )}
                    </form.Field>

                    <form.Field
                        name="description"
                        validators={{
                            onChange: ({ value }) => {
                                const result =
                                    updateAgentSchema.shape.description.safeParse(
                                        value,
                                    );
                                return result.success
                                    ? undefined
                                    : result.error.issues[0]?.message;
                            },
                            onSubmit: ({ value }) => {
                                const result =
                                    updateAgentSchema.shape.description.safeParse(
                                        value,
                                    );
                                return result.success
                                    ? undefined
                                    : result.error.issues[0]?.message;
                            },
                        }}
                    >
                        {(field) => (
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor={field.name}>Detail</Label>
                                <textarea
                                    id={field.name}
                                    name={field.name}
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => {
                                        field.handleChange(e.target.value);
                                        mutation.reset();
                                    }}
                                    className={textareaClass}
                                    aria-invalid={
                                        field.state.meta.errors.length > 0
                                    }
                                />
                                {field.state.meta.errors.length > 0 && (
                                    <p className="text-xs text-destructive">
                                        {field.state.meta.errors[0]}
                                    </p>
                                )}
                            </div>
                        )}
                    </form.Field>

                    <form.Field
                        name="webhook_uri"
                        validators={{
                            onChange: ({ value }) => {
                                const result =
                                    updateAgentSchema.shape.webhook_uri.safeParse(
                                        value,
                                    );
                                return result.success
                                    ? undefined
                                    : result.error.issues[0]?.message;
                            },
                            onSubmit: ({ value }) => {
                                const result =
                                    updateAgentSchema.shape.webhook_uri.safeParse(
                                        value,
                                    );
                                return result.success
                                    ? undefined
                                    : result.error.issues[0]?.message;
                            },
                        }}
                    >
                        {(field) => (
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor={field.name}>Webhook URI</Label>
                                <Input
                                    id={field.name}
                                    name={field.name}
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => {
                                        field.handleChange(e.target.value);
                                        mutation.reset();
                                    }}
                                    placeholder="https://example.com/webhook"
                                    aria-invalid={
                                        field.state.meta.errors.length > 0
                                    }
                                />
                                {field.state.meta.errors.length > 0 && (
                                    <p className="text-xs text-destructive">
                                        {field.state.meta.errors[0]}
                                    </p>
                                )}
                            </div>
                        )}
                    </form.Field>

                    <form.Field name="is_active">
                        {(field) => (
                            <label className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => {
                                        field.handleChange(e.target.checked);
                                        mutation.reset();
                                    }}
                                    className="size-4 accent-primary"
                                />
                                Agent is active
                            </label>
                        )}
                    </form.Field>

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="outline">
                                Cancel
                            </Button>
                        </DialogClose>
                        <form.Subscribe
                            selector={(state) => [
                                state.canSubmit,
                                state.isSubmitting,
                            ]}
                        >
                            {([canSubmit, isSubmitting]) => (
                                <Button
                                    type="submit"
                                    disabled={
                                        !canSubmit ||
                                        isSubmitting ||
                                        mutation.isPending
                                    }
                                >
                                    {mutation.isPending ? "Saving..." : "Save"}
                                </Button>
                            )}
                        </form.Subscribe>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

const API_BASE_URL = import.meta.env.VITE_API_URL as string;

function useCopyState() {
    const [copied, setCopied] = useState(false);
    function copy(text: string) {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }
    return { copied, copy };
}

// ponytail: self-contained widget snippet — vanilla JS, zero deps, zero build
// step. All colors live in one THEME block (oklch, copied from index.css) so
// re-theming = edit one place. Markdown is rendered by a tiny built-in parser
// (escape-first, then bold/italic/code/link/heading/list) — no markdown lib in
// a paste-in script. Mirrors the real contract: POST /chat/{id} with
// Authorization: Bearer, body { chatInput, sessionId }, response { reply }.
function buildWidgetSnippet(endpointUrl: string) {
    return `<!-- AIAC chat widget — paste before </body>, then set API_KEY below -->
<script>
(function () {
  var API_URL = ${JSON.stringify(endpointUrl)};
  var API_KEY = "PASTE_YOUR_API_KEY_HERE"; // <-- your API key

  // ── THEME — all colors in one place (oklch, from the console palette) ──────
  var THEME = {
    background: "oklch(1 0 0)",
    foreground: "oklch(0.141 0.005 285.823)",
    primary: "oklch(0.841 0.238 128.85)",
    primaryForeground: "oklch(0.405 0.101 131.063)",
    muted: "oklch(0.967 0.001 286.375)",
    mutedForeground: "oklch(0.552 0.016 285.938)",
    border: "oklch(0.92 0.004 286.32)",
    radius: "12px",
  };

  var sessionId = "web-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
  var open = false;

  var css = "" +
    ":root{--aic3-bg:" + THEME.background + ";--aic3-fg:" + THEME.foreground +
      ";--aic3-primary:" + THEME.primary + ";--aic3-primary-fg:" + THEME.primaryForeground +
      ";--aic3-muted:" + THEME.muted + ";--aic3-muted-fg:" + THEME.mutedForeground +
      ";--aic3-border:" + THEME.border + ";--aic3-radius:" + THEME.radius + "}" +
    ".aic3-btn{position:fixed;right:20px;bottom:20px;width:56px;height:56px;border-radius:50%;border:none;cursor:pointer;background:var(--aic3-primary);color:var(--aic3-primary-fg);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(0,0,0,.25);z-index:2147483000}" +
    ".aic3-panel{position:fixed;right:20px;bottom:88px;width:340px;max-width:calc(100vw - 40px);height:460px;max-height:calc(100vh - 120px);display:none;flex-direction:column;background:var(--aic3-bg);color:var(--aic3-fg);border:1px solid var(--aic3-border);border-radius:var(--aic3-radius);overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,.18);z-index:2147483000;font-family:system-ui,sans-serif}" +
    ".aic3-panel.open{display:flex}" +
    ".aic3-head{padding:12px 14px;background:var(--aic3-primary);color:var(--aic3-primary-fg);font-weight:600;font-size:14px}" +
    ".aic3-msgs{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:8px;background:var(--aic3-bg)}" +
    ".aic3-m{max-width:85%;padding:8px 10px;border-radius:10px;font-size:13px;line-height:1.45;word-break:break-word}" +
    ".aic3-m p{margin:0 0 6px}.aic3-m p:last-child{margin:0}.aic3-m ul,.aic3-m ol{margin:4px 0;padding-left:18px}.aic3-m code{background:rgba(0,0,0,.08);padding:1px 4px;border-radius:4px;font-size:.92em}.aic3-m a{color:inherit;text-decoration:underline}.aic3-m h1,.aic3-m h2,.aic3-m h3{margin:6px 0 4px;font-size:1em;font-weight:600}" +
    ".aic3-u{align-self:flex-end;background:var(--aic3-primary);color:var(--aic3-primary-fg)}" +
    ".aic3-a{align-self:flex-start;background:var(--aic3-muted);color:var(--aic3-fg)}" +
    ".aic3-form{display:flex;gap:6px;padding:10px;border-top:1px solid var(--aic3-border);background:var(--aic3-bg)}" +
    ".aic3-in{flex:1;border:1px solid var(--aic3-border);border-radius:8px;padding:8px;font-size:13px;outline:none;background:var(--aic3-bg);color:var(--aic3-fg)}" +
    ".aic3-send{border:none;background:var(--aic3-primary);color:var(--aic3-primary-fg);border-radius:8px;padding:0 14px;cursor:pointer;font-size:13px}" +
    ".aic3-send:disabled{opacity:.5;cursor:default}";

  var style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  // ── tiny markdown — escape FIRST (trust boundary), then format ─────────────
  function esc(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function mdToHtml(src) {
    var lines = esc(src).split(/\\r?\\n/);
    var html = "", inList = false;
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var li = line.match(/^\\s*[-*]\\s+(.*)$/);
      if (li) {
        if (!inList) { html += "<ul>"; inList = true; }
        html += "<li>" + inline(li[1]) + "</li>";
        continue;
      }
      if (inList) { html += "</ul>"; inList = false; }
      var h = line.match(/^(#{1,3})\\s+(.*)$/);
      if (h) { html += "<h" + h[1].length + ">" + inline(h[2]) + "</h" + h[1].length + ">"; continue; }
      if (line.trim() === "") continue;
      html += "<p>" + inline(line) + "</p>";
    }
    if (inList) html += "</ul>";
    return html;
  }
  function inline(s) {
    return s
      .replace(/\\*\\*([^*]+)\\*\\*/g, "<strong>$1</strong>")
      .replace(/\\*([^*]+)\\*/g, "<em>$1</em>")
      .replace(/\`([^\`]+)\`/g, "<code>$1</code>")
      .replace(/\\[([^\\]]+)\\]\\((https?:\\/\\/[^\\s)]+)\\)/g,
        '<a href="$2" target="_blank" rel="noopener">$1</a>');
  }

  var btn = document.createElement("button");
  btn.className = "aic3-btn";
  btn.setAttribute("aria-label", "Open chat");
  btn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>';

  var panel = document.createElement("div");
  panel.className = "aic3-panel";
  panel.innerHTML =
    '<div class="aic3-head">Chat</div>' +
    '<div class="aic3-msgs"></div>' +
    '<form class="aic3-form">' +
    '<input class="aic3-in" placeholder="Type a message..." autocomplete="off" />' +
    '<button class="aic3-send" type="submit">Send</button>' +
    "</form>";

  document.body.appendChild(btn);
  document.body.appendChild(panel);

  var msgs = panel.querySelector(".aic3-msgs");
  var form = panel.querySelector(".aic3-form");
  var input = panel.querySelector(".aic3-in");
  var send = panel.querySelector(".aic3-send");

  function addMsg(text, who) {
    var el = document.createElement("div");
    el.className = "aic3-m " + (who === "user" ? "aic3-u" : "aic3-a");
    if (who === "assistant") el.innerHTML = mdToHtml(text);
    else el.textContent = text;
    msgs.appendChild(el);
    msgs.scrollTop = msgs.scrollHeight;
    return el;
  }

  btn.addEventListener("click", function () {
    open = !open;
    panel.classList.toggle("open", open);
    if (open) input.focus();
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var text = input.value.trim();
    if (!text) return;
    input.value = "";
    addMsg(text, "user");
    send.disabled = true;
    var typing = addMsg("...", "assistant");

    fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + API_KEY,
      },
      body: JSON.stringify({ chatInput: text, sessionId: sessionId }),
    })
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(function (data) {
        typing.innerHTML = mdToHtml(data.reply || "(no reply)");
      })
      .catch(function () {
        typing.textContent = "Something went wrong. Try again.";
      })
      .finally(function () {
        send.disabled = false;
        msgs.scrollTop = msgs.scrollHeight;
      });
  });
})();
</script>`;
}

function ApiTab({ agentId }: { agentId: string }) {
    const endpointUrl = `${API_BASE_URL}/chat/${agentId}`;

    const curlSnippet = `curl --request POST \\
  --url ${endpointUrl} \\
  --header 'authorization: Bearer [your token here]' \\
  --header 'content-type: application/json' \\
  --header 'x-session-id: [existing session id]' \\
  --data '{
  "sessionId": "string",
  "chatInput": "apa yg bagus untuk dibeli di tahun 2025"
}'`;

    const widgetSnippet = buildWidgetSnippet(endpointUrl);

    const curlCopy = useCopyState();
    const urlCopy = useCopyState();
    const widgetCopy = useCopyState();

    return (
        <div className="h-full overflow-y-auto px-6 py-6">
            <div className="max-w-2xl flex flex-col gap-6">
                <div>
                    <h2 className="text-base font-semibold mb-1">
                        Chat endpoint
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Send a{" "}
                        <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">
                            POST
                        </code>{" "}
                        request to chat with this agent programmatically.
                        Replace{" "}
                        <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">
                            [your token here]
                        </code>{" "}
                        with a valid API key. Include the{" "}
                        <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">
                            x-session-id
                        </code>{" "}
                        header only when continuing an existing session; omit it
                        to start a new one.
                    </p>
                </div>

                {/* Endpoint URL row */}
                <div className="flex flex-col gap-1.5">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Endpoint URL
                    </p>
                    <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
                        <code className="flex-1 text-sm font-mono break-all text-foreground">
                            {endpointUrl}
                        </code>
                        <Button
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => urlCopy.copy(endpointUrl)}
                            title="Copy URL"
                            className="shrink-0"
                        >
                            {urlCopy.copied ? (
                                <Check className="size-3.5 text-green-500" />
                            ) : (
                                <Link className="size-3.5" />
                            )}
                        </Button>
                    </div>
                </div>

                {/* cURL snippet */}
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            cURL example
                        </p>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => curlCopy.copy(curlSnippet)}
                            className="gap-1.5 h-7 text-xs"
                        >
                            {curlCopy.copied ? (
                                <>
                                    <Check className="size-3.5 text-green-500" />{" "}
                                    Copied
                                </>
                            ) : (
                                <>
                                    <Copy className="size-3.5" /> Copy cURL
                                </>
                            )}
                        </Button>
                    </div>
                    <pre className="overflow-x-auto rounded-lg border border-border bg-muted/40 px-4 py-3.5 text-xs font-mono leading-relaxed text-foreground whitespace-pre">
                        {curlSnippet}
                    </pre>
                </div>

                {/* Embeddable chat widget */}
                <div className="flex flex-col gap-1.5">
                    <div>
                        <h2 className="text-base font-semibold mb-1">
                            Embeddable chat widget
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Paste this snippet before{" "}
                            <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">
                                {"</body>"}
                            </code>{" "}
                            on any website, then replace{" "}
                            <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">
                                PASTE_YOUR_API_KEY_HERE
                            </code>{" "}
                            with a valid API key. A chat bubble appears in the
                            bottom-right corner — no build step or dependencies
                            required.
                        </p>
                    </div>
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Widget snippet
                        </p>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => widgetCopy.copy(widgetSnippet)}
                            className="gap-1.5 h-7 text-xs"
                        >
                            {widgetCopy.copied ? (
                                <>
                                    <Check className="size-3.5 text-green-500" />{" "}
                                    Copied
                                </>
                            ) : (
                                <>
                                    <Copy className="size-3.5" /> Copy widget
                                </>
                            )}
                        </Button>
                    </div>
                    <pre className="max-h-80 overflow-auto rounded-lg border border-border bg-muted/40 px-4 py-3.5 text-xs font-mono leading-relaxed text-foreground whitespace-pre">
                        {widgetSnippet}
                    </pre>
                </div>
            </div>
        </div>
    );
}

function RouteComponent() {
    const { id } = Route.useParams();

    const {
        data: agent,
        isPending,
        isError,
    } = useQuery({
        queryKey: ["agents", id],
        queryFn: () => getAgent(id),
    });

    if (isPending) {
        return (
            <div className="flex h-full items-center justify-center">
                <p className="text-sm text-muted-foreground">
                    Loading agent...
                </p>
            </div>
        );
    }

    if (isError || !agent) {
        return (
            <div className="flex h-full items-center justify-center">
                <p className="text-sm text-muted-foreground">
                    Failed to load agent
                </p>
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col overflow-hidden">
            <div className="px-6 py-4 bg-background border-b shrink-0 flex items-start gap-4">
                <div className="min-w-0 flex-1">
                    <h1 className="font-heading text-2xl font-semibold">
                        {agent.data.name}
                    </h1>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                        {agent.data.description}
                    </p>
                </div>
                <EditAgentDialog agent={agent.data} />
            </div>

            <Tabs
                defaultValue="chat"
                className="flex-1 grid grid-rows-[auto_1fr] overflow-hidden gap-0"
            >
                <div className="border-b">
                    <TabsList variant="line">
                        <TabsTrigger value="overview">
                            <LayoutGridIcon />
                            Overview
                        </TabsTrigger>
                        <TabsTrigger value="persona">
                            <SmilePlusIcon />
                            Persona
                        </TabsTrigger>
                        <TabsTrigger value="knowledge">
                            <BookIcon />
                            Knowledges
                        </TabsTrigger>
                        <TabsTrigger value="mcp">
                            <PlugIcon />
                            MCPs
                        </TabsTrigger>
                        <TabsTrigger value="chat">
                            <MessagesSquareIcon />
                            Chat Sandbox
                        </TabsTrigger>
                        <TabsTrigger value="logs">
                            <ScrollText />
                            Logs
                        </TabsTrigger>
                        <TabsTrigger value="api">
                            <TerminalSquare />
                            Integration
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="persona" className="overflow-hidden">
                    <Persona agentId={id} />
                </TabsContent>
                <TabsContent value="overview" className="overflow-hidden">
                    <Overview agentId={id} />
                </TabsContent>
                <TabsContent value="knowledge" className="overflow-hidden">
                    <Knowledges agentId={id} />
                </TabsContent>
                <TabsContent value="mcp" className="overflow-hidden">
                    <Mcps agentId={id} />
                </TabsContent>
                <TabsContent value="chat" className="overflow-hidden">
                    <ChatSanbox agentId={id} agentName={agent.data.name} />
                </TabsContent>
                <TabsContent value="logs" className="overflow-y-auto">
                    <div className="p-6">
                        <LogsTable agentId={id} />
                    </div>
                </TabsContent>
                <TabsContent value="api" className="overflow-hidden">
                    <ApiTab agentId={id} />
                </TabsContent>
            </Tabs>

            <ChatWidget agentId={id} agentName={agent.data.name} />
        </div>
    );
}
