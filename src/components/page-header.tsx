import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  action?: string;
  onAction?: () => void;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  onAction,
}: PageHeaderProps) {
  return (
    <section className="flex flex-col gap-3 rounded-lg border border-white/80 bg-white/84 p-4 shadow-sm backdrop-blur sm:flex-row sm:items-end sm:justify-between sm:p-5">
      <div className="max-w-3xl">
        <Badge variant="secondary" className="mb-3 rounded-md">
          {eyebrow}
        </Badge>
        <h2 className="text-3xl font-semibold leading-tight sm:text-4xl">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
          {description}
        </p>
      </div>
      {action ? (
        <Button className="sm:self-center" onClick={onAction}>
          {action}
        </Button>
      ) : null}
    </section>
  );
}
