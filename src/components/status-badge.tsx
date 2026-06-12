import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS, type EssayStatus } from "@/lib/types";

const VARIANT_BY_STATUS = {
  pending: "warning",
  in_review: "info",
  complete: "success",
} as const;

export function StatusBadge({ status }: { status: EssayStatus }) {
  return (
    <Badge variant={VARIANT_BY_STATUS[status]}>{STATUS_LABELS[status]}</Badge>
  );
}
