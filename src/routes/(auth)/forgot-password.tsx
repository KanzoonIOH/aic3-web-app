import { forgotPassword } from "@/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resolveServerMessage } from "@/lib/utils";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { AuthTitle } from "./-components";

export const Route = createFileRoute("/(auth)/forgot-password")({
    component: RouteComponent,
});

const schema = z.object({
    login_id: z.string().min(1, "Login ID is required"),
});

function RouteComponent() {
    const mutation = useMutation({
        mutationFn: (login_id: string) => forgotPassword(login_id),
    });

    const form = useForm({
        defaultValues: { login_id: "" } satisfies z.infer<typeof schema>,
        onSubmit: async ({ value }) => {
            await mutation.mutateAsync(value.login_id);
        },
    });

    if (mutation.isSuccess) {
        return (
            <>
                <AuthTitle
                    title="Check your email"
                    subtitle="If an account exists for that login, a password reset link has been sent."
                />
                <p className="text-center text-sm text-muted-foreground">
                    <Link
                        to="/login"
                        className="font-medium text-foreground underline-offset-4 hover:underline"
                    >
                        Back to sign in
                    </Link>
                </p>
            </>
        );
    }

    return (
        <>
            <AuthTitle
                title="Forgot password"
                subtitle="Enter your login ID and we'll email you a reset link."
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
                    name="login_id"
                    validators={{
                        onChange: ({ value }) => {
                            const r = schema.shape.login_id.safeParse(value);
                            return r.success
                                ? undefined
                                : r.error.issues[0]?.message;
                        },
                    }}
                >
                    {(field) => (
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor={field.name}>Login ID</Label>
                            <Input
                                id={field.name}
                                name={field.name}
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                onChange={(e) => {
                                    field.handleChange(e.target.value);
                                    mutation.reset();
                                }}
                                placeholder="Enter your login ID"
                                aria-invalid={field.state.meta.errors.length > 0}
                                autoComplete="username"
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
                            {mutation.isPending ? "Sending..." : "Send reset link"}
                        </Button>
                    )}
                </form.Subscribe>
            </form>

            <p className="text-center text-sm text-muted-foreground">
                Remembered it?{" "}
                <Link
                    to="/login"
                    className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                    Sign in
                </Link>
            </p>
        </>
    );
}
