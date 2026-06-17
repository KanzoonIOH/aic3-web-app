import {
    createApiKey,
    getApiKeys,
    revokeApiKey,
    type ApiKey,
} from "@/api/api-keys";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import { resolveServerMessage } from "@/lib/utils";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Check, Copy, KeyRound, Trash2 } from "lucide-react";
import { useState } from "react";
import { z } from "zod";

export const Route = createFileRoute("/(main)/api-keys")({
    component: RouteComponent,
});

const createApiKeySchema = z.object({
    name: z.string().trim().min(1, "Name is required"),
});

type CreateApiKeyValues = z.infer<typeof createApiKeySchema>;

function CreateApiKeyDialog() {
    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: createApiKey,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["api-keys"] });
            setOpen(false);
            form.reset();
        },
    });

    const form = useForm({
        defaultValues: {
            name: "",
        } satisfies CreateApiKeyValues,
        onSubmit: async ({ value }) => {
            const result = createApiKeySchema.safeParse(value);
            if (!result.success) return;

            await mutation.mutateAsync(result.data);
        },
    });

    function handleOpenChange(nextOpen: boolean) {
        setOpen(nextOpen);
        if (!nextOpen) {
            mutation.reset();
            form.reset();
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button size="sm">
                    <KeyRound className="size-3.5" />
                    Create API key
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create API key</DialogTitle>
                    <DialogDescription>
                        Create a new API key for programmatic access.
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
                                    createApiKeySchema.shape.name.safeParse(
                                        value,
                                    );
                                return result.success
                                    ? undefined
                                    : result.error.issues[0]?.message;
                            },
                            onSubmit: ({ value }) => {
                                const result =
                                    createApiKeySchema.shape.name.safeParse(
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
                                    placeholder="Production integration"
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
                                    {mutation.isPending
                                        ? "Creating..."
                                        : "Create key"}
                                </Button>
                            )}
                        </form.Subscribe>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function ApiKeyRow({ apiKey }: { apiKey: ApiKey }) {
    const [copied, setCopied] = useState(false);
    const queryClient = useQueryClient();

    const maskedKey =
        apiKey.token.length > 8
            ? apiKey.token.slice(0, 8) +
              "•".repeat(Math.min(24, apiKey.token.length - 8))
            : apiKey.token;

    const formattedDate = new Date(apiKey.created_at).toLocaleDateString(
        undefined,
        { year: "numeric", month: "short", day: "numeric" },
    );

    function handleCopy() {
        navigator.clipboard.writeText(apiKey.token);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    const { mutate: revoke, isPending: isRevoking } = useMutation({
        mutationFn: () => revokeApiKey(apiKey.id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["api-keys"] });
        },
    });

    return (
        <div className="border rounded-lg flex items-center gap-4 px-4 py-3 hover:bg-muted/30 transition-colors">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary border">
                <KeyRound className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
                <span className="font-medium text-sm">{apiKey.name}</span>
                <div className="mt-0.5 flex items-center gap-1.5">
                    <p className="truncate text-xs text-muted-foreground font-mono">
                        {maskedKey}
                    </p>
                    <Button
                        variant="ghost"
                        size="icon-xs"
                        className="shrink-0 text-muted-foreground hover:text-foreground"
                        onClick={handleCopy}
                    >
                        {copied ? (
                            <Check className="size-3" />
                        ) : (
                            <Copy className="size-3" />
                        )}
                    </Button>
                </div>
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">
                {formattedDate}
            </span>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        className="shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                        <Trash2 className="size-4" />
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Revoke API key?</AlertDialogTitle>
                        <AlertDialogDescription>
                            <span className="font-medium text-foreground">
                                {apiKey.name}
                            </span>{" "}
                            will be permanently revoked. Any integrations using
                            this key will stop working immediately.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel variant={"ghost"}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            variant={"destructive"}
                            // className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={isRevoking}
                            onClick={() => revoke()}
                        >
                            {isRevoking ? "Revoking..." : "Revoke"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

function RouteComponent() {
    const {
        data: apiKeys,
        isPending,
        isError,
    } = useQuery({
        queryKey: ["api-keys"],
        queryFn: getApiKeys,
    });

    return (
        <div className="flex h-full flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto">
                <div className="sticky top-0 px-6 py-4 flex items-center gap-4 bg-background border-b">
                    <div className="min-w-0 flex-1">
                        <h1 className="font-heading text-2xl font-semibold">
                            API Keys
                        </h1>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            Manage your API keys for programmatic access.
                        </p>
                    </div>
                    <CreateApiKeyDialog />
                </div>

                <div className="p-6">
                    {isPending ? (
                        <div className="flex flex-col items-center justify-center gap-2 py-16">
                            <p className="text-sm text-muted-foreground">
                                Loading API keys...
                            </p>
                        </div>
                    ) : isError ? (
                        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-16 text-center">
                            <KeyRound className="size-8 text-muted-foreground/40" />
                            <p className="text-sm text-muted-foreground">
                                Failed to load API keys
                            </p>
                        </div>
                    ) : apiKeys.data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-16 text-center">
                            <KeyRound className="size-8 text-muted-foreground/40" />
                            <p className="text-sm text-muted-foreground">
                                No API keys found
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {apiKeys.data.map((apiKey) => (
                                <ApiKeyRow key={apiKey.id} apiKey={apiKey} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
