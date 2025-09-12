import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Paper,
  Typography,
} from "@mui/material";
import { type ReactNode } from "react";

export type SectionItem = {
  id: string | number;
  party: string;
  amount: number | string; // supports "₹32,000" or 32000
  stock?: string; // optional subtext (e.g., 2.5 Carat Diamond)
  extraNote?: string;
  type?: string;
  dueText?: string;
  // e.g., "Due in 5 days" / "7 days overdue"
};

type ColorKey =
  | "red"
  | "blue"
  | "green"
  | "orange"
  | "yellow"
  | "cyan"
  | "slate";

const PALETTE: Record<
  ColorKey,
  { border: string; bg: string; text: string; chip: string }
> = {
  red: {
    border: "border-red-200",
    bg: "bg-red-50/50",
    text: "text-red-700",
    chip: "bg-red-100 text-red-700",
  },
  blue: {
    border: "border-blue-200",
    bg: "bg-blue-50/50",
    text: "text-blue-700",
    chip: "bg-blue-100 text-blue-700",
  },
  green: {
    border: "border-green-200",
    bg: "bg-green-50/50",
    text: "text-green-700",
    chip: "bg-green-100 text-green-700",
  },
  orange: {
    border: "border-orange-200",
    bg: "bg-orange-50/50",
    text: "text-orange-700",
    chip: "bg-orange-100 text-orange-700",
  },
  yellow: {
    border: "border-yellow-200",
    bg: "bg-yellow-50/50",
    text: "text-yellow-700",
    chip: "bg-yellow-100 text-yellow-700",
  },
  cyan: {
    border: "border-cyan-200",
    bg: "bg-cyan-50/50",
    text: "text-cyan-700",
    chip: "bg-cyan-100 text-cyan-700",
  },
  slate: {
    border: "border-slate-200",
    bg: "bg-slate-50/50",
    text: "text-slate-700",
    chip: "bg-slate-100 text-slate-700",
  },
};

const toNumber = (v: number | string) =>
  typeof v === "number" ? v : Number(String(v).replace(/[^\d.-]/g, "")) || 0;

const inr = (n: number) =>
  n.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });

export interface SectionCardProps {
  title: string;
  icon?: ReactNode;
  color?: ColorKey;
  items: SectionItem[];
  totalLabel?: string; // default: "Total"
  totalOverride?: number; // pass a ready-made total (optional)
  countOverride?: number; // custom count (optional)
  className?: string;
}
const CardComponent = ({
  title,
  icon,
  color = "slate",
  items,
  totalLabel = "Total",
  totalOverride,
  countOverride,
  className,
}: SectionCardProps) => {
  const theme = PALETTE[color];
  const total =
    totalOverride ?? items.reduce((s, r) => s + toNumber(r.amount), 0);
  const count = countOverride ?? items.length;

  return (
    <Card
      className={`h-full border-2 ${theme.border} ${theme.bg} ${
        className ?? ""
      } flex flex-col`}
    >
      {/* Make CardContent a flex column with full height */}
      <CardContent className="!py-3 !px-4 flex-1 flex flex-col">
        {/* Header */}
        <Box className="flex items-center gap-2 mb-3">
          {icon}
          <Box className={`font-semibold ${theme.text} text-lg text-[#333333]`}>
            {title}
          </Box>
          <Chip label={count} size="small" className={theme.chip} />
        </Box>

        {/* LIST - grows and can scroll when tall */}
        <Box className="flex-1 space-y-2 overflow-y-auto">
          {items?.map((item) => (
            <Paper
              key={item.id}
              className="p-2 bg-white/80 border border-slate-300 !shadow-none !rounded-lg"
            >
              <Box className="flex justify-between items-start">
                <Box className="flex items-end gap-x-4">
                  <Typography
                    variant="subtitle2"
                    className="!font-semibold text-slate-800"
                  >
                    {item.party}
                  </Typography>

                  {!!item?.stock && (
                    <Typography variant="caption" className="text-[#666] block">
                      {`${item.stock} CT`}
                    </Typography>
                  )}

                  {item?.type === "broker" && (
                    <Chip
                      label="Broker Commission"
                      size="small"
                      className="bg-purple-100 text-purple-700"
                    />
                  )}
                </Box>

                {!!item.extraNote && (
                  <Typography
                    variant="caption"
                    className={`${theme.text} block font-medium`}
                  >
                    {item.extraNote}
                  </Typography>
                )}

                <Box className="flex items-center gap-x-3">
                  {item?.dueText && (
                    <Chip
                      size="small"
                      label={item?.dueText}
                      color="warning"
                      sx={{
                        fontWeight: "bold",
                        backgroundColor: "#fff3cd",
                        color: "#856404",
                        border: "1px solid #ffeeba",
                      }}
                    />
                  )}
                  <Box className={`font-bold ${theme.text} text-[#2E7D32]`}>
                    {typeof item.amount === "number"
                      ? inr(item.amount)
                      : item.amount}
                  </Box>
                </Box>
              </Box>
            </Paper>
          ))}
        </Box>

        {/* FOOTER - pinned to bottom */}
        <Box className="mt-3">
          <Divider className="my-2" />
          <Box className="flex justify-between items-center">
            <Typography
              variant="subtitle1"
              className={`font-semibold ${theme.text}`}
            >
              {totalLabel}:
            </Typography>
            <Typography variant="h6" className={`font-bold ${theme.text}`}>
              {inr(total)}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default CardComponent;
