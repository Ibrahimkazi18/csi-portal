"use client"

import { CheckCircle2, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { PasswordChecks } from "../../../utils/password"

type Props = {
  checks: PasswordChecks
  className?: string
}

export function PasswordChecklist({ checks, className }: Props) {
  const Row = ({
    ok,
    label,
  }: {
    ok: boolean
    label: string
  }) => (
    <div className={cn("flex items-center gap-2 text-sm transition-colors duration-200", ok ? "text-emerald-400" : "text-gray-500")}>
      {ok ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
      <span>{label}</span>
    </div>
  )

  return (
    <div className={cn("rounded-lg border border-gray-700 bg-gray-800/50 backdrop-blur-sm p-4 space-y-2", className)}>
      <Row ok={checks.length} label="At least 8 characters" />
      <Row ok={checks.lowercase} label="At least 1 lowercase letter" />
      <Row ok={checks.uppercase} label="At least 1 uppercase letter" />
      <Row ok={checks.digit} label="At least 1 digit" />
      <Row ok={checks.symbol} label="At least 1 symbol" />
    </div>
  )
}
