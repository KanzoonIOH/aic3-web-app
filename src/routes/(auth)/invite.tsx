import { acceptInvite } from "@/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resolveServerMessage } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { z } from "zod";
import { AuthTitle } from "./-components";

export const Route = createFileRoute("/(auth)/invite")({
    validateSearch: (search: Record<string, unknown>) => ({
        key: typeof search.key === "string" ? search.key : "",
    }),
    component: RouteComponent,
});

const acceptSchema = z.object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirm: z.string(),
});

type AcceptValues = z.infer<typeof acceptSchema>;

function RouteComponent() {
    const { key } = Route.useSearch();
    const router = useRouter();
    const setAuth = useAuthStore((s) => s.setAuth);

    const mutation = useMutation({
        mutationFn: (password: string) => acceptInvite({ token: key, password }),
        onSuccess: (data) => {
            setAuth(data.data);
            void router.navigate({ to: "/dashboard" });
        },
    });

    const form = useForm({
        defaultValues: { password: "", confirm: "" } satisfies AcceptValues,
        onSubmit: async ({ value }) => {
            await mutation.mutateAsync(value.password);
        },
    });

    if (!key) {
        return (
            <>
                <AuthTitle
                    title="Invalid invite"
                    subtitle="This invite link is missing its key."
                />
                <p className="text-center text-sm text-muted-foreground">
                    Ask an administrator to resend your invite, or{" "}
                    <Link
                        to="/login"
                        className="font-medium text-foreground underline-offset-4 hover:underline"
                    >
                        sign in
                    </Link>
                    .
                </p>
            </>
        );
    }

    return (
        <>
            <AuthTitle
                title="Set your password"
                subtitle="Choose a password to activate your account."
            />
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
                    name="password"
                    validators={{
                        onChange: ({ value }) => {
                            const r = acceptSchema.shape.password.safeParse(
                                value,
                            );
                            return r.success
                                ? undefined
                                : r.error.issues[0]?.message;
                        },
                    }}
                >
                    {(field) => (
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor={field.name}>Password</Label>
                            <Input
                                id={field.name}
                                name={field.name}
                                type="password"
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                onChange={(e) => {
                                    field.handleChange(e.target.value);
                                    mutation.reset();
                                }}
                                placeholder="At least 8 characters"
                                aria-invalid={field.state.meta.errors.length > 0}
                                autoComplete="new-password"
                                autoFocus
                            />
                            {field.state.meta.isTouched &&
                                field.state.meta.errors.length > 0 && (
                                    <p className="text-xs text-destructive">
                                        {field.state.meta.errors[0]}
                                    </p>
                                )}
                        </div>
                    )}
                </form.Field>

                <form.Field
                    name="confirm"
                    validators={{
                        onChangeListenTo: ["password"],
                        onChange: ({ value, fieldApi }) =>
                            value !== fieldApi.form.getFieldValue("password")
                                ? "Passwords do not match"
                                : undefined,
                    }}
                >
                    {(field) => (
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor={field.name}>Confirm password</Label>
                            <Input
                                id={field.name}
                                name={field.name}
                                type="password"
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                onChange={(e) => {
                                    field.handleChange(e.target.value);
                                    mutation.reset();
                                }}
                                placeholder="Re-enter password"
                                aria-invalid={field.state.meta.errors.length > 0}
                                autoComplete="new-password"
                            />
                            {field.state.meta.isTouched &&
                                field.state.meta.errors.length > 0 && (
                                    <p className="text-xs text-destructive">
                                        {field.state.meta.errors[0]}
                                    </p>
                                )}
                        </div>
                    )}
                </form.Field>

                <form.Subscribe
                    selector={(state) => [state.canSubmit, state.isSubmitting]}
                >
                    {([canSubmit, isSubmitting]) => (
                        <Button
                            type="submit"
                            disabled={
                                !canSubmit || isSubmitting || mutation.isPending
                            }
                            className="mt-1 w-full"
                        >
                            {mutation.isPending
                                ? "Activating..."
                                : "Activate account"}
                        </Button>
                    )}
                </form.Subscribe>
            </form>
        </>
    );
}
