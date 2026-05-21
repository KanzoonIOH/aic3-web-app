import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import axios from "axios";
import { register } from "@/api/auth";
import type { ApiError } from "@/api/auth";
import { useAuthStore } from "@/stores/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthTitle } from "./-components";

export const Route = createFileRoute("/(auth)/signup")({
    component: RouteComponent,
});

const signupSchema = z.object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    email: z
        .string()
        .min(1, "Email is required")
        .email("Enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
});

type SignupValues = z.infer<typeof signupSchema>;

function resolveServerMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
        const data = error.response?.data as ApiError | undefined;
        return data?.message ?? error.message;
    }
    return "An unexpected error occurred.";
}

function RouteComponent() {
    const router = useRouter();
    const setAuth = useAuthStore((s) => s.setAuth);

    const mutation = useMutation({
        mutationFn: register,
        onSuccess: (data) => {
            setAuth(data.data);
            void router.navigate({ to: "/dashboard" });
        },
    });

    const form = useForm({
        defaultValues: {
            username: "",
            email: "",
            password: "",
        } satisfies SignupValues,
        onSubmit: async ({ value }) => {
            await mutation.mutateAsync(value);
        },
    });

    return (
        <>
            <AuthTitle
                title="Create an account"
                subtitle="Fill in the details below to get started"
            />

            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    form.handleSubmit();
                }}
                className="flex flex-col gap-4"
            >
                {/* Server-level error banner */}
                {mutation.isError && (
                    <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                        {resolveServerMessage(mutation.error)}
                    </p>
                )}

                <form.Field
                    name="username"
                    validators={{
                        onChange: ({ value }) => {
                            const result =
                                signupSchema.shape.username.safeParse(value);
                            return result.success
                                ? undefined
                                : result.error.issues[0]?.message;
                        },
                    }}
                >
                    {(field) => (
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor={field.name}>Username</Label>
                            <Input
                                id={field.name}
                                name={field.name}
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                onChange={(e) => {
                                    field.handleChange(e.target.value);
                                    mutation.reset();
                                }}
                                placeholder="Choose a username"
                                aria-invalid={
                                    field.state.meta.errors.length > 0
                                }
                                autoComplete="username"
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
                    name="email"
                    validators={{
                        onChange: ({ value }) => {
                            const result =
                                signupSchema.shape.email.safeParse(value);
                            return result.success
                                ? undefined
                                : result.error.issues[0]?.message;
                        },
                    }}
                >
                    {(field) => (
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor={field.name}>Email</Label>
                            <Input
                                id={field.name}
                                name={field.name}
                                type="email"
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                onChange={(e) => {
                                    field.handleChange(e.target.value);
                                    mutation.reset();
                                }}
                                placeholder="you@example.com"
                                aria-invalid={
                                    field.state.meta.errors.length > 0
                                }
                                autoComplete="email"
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
                    name="password"
                    validators={{
                        onChange: ({ value }) => {
                            const result =
                                signupSchema.shape.password.safeParse(value);
                            return result.success
                                ? undefined
                                : result.error.issues[0]?.message;
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
                                aria-invalid={
                                    field.state.meta.errors.length > 0
                                }
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
                            className="w-full mt-1"
                        >
                            {mutation.isPending
                                ? "Creating account..."
                                : "Create account"}
                        </Button>
                    )}
                </form.Subscribe>
            </form>

            <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                    to="/login"
                    className="text-foreground font-medium underline-offset-4 hover:underline"
                >
                    Sign in
                </Link>
            </p>
        </>
    );
}
