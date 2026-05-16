type AuthTitleProps = {
    title: string;
    subtitle?: string;
};

export function AuthTitle({ title, subtitle }: AuthTitleProps) {
    return (
        <div className="flex flex-col gap-1">
            <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
            {subtitle && (
                <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
        </div>
    );
}
