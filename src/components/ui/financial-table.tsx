"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { ArrowUp, ArrowDown, Minus } from "lucide-react"

interface Column<T> {
  key: keyof T | string
  header: string
  render?: (value: any, row: T) => React.ReactNode
  align?: "left" | "center" | "right"
  sortable?: boolean
}

interface FinancialTableProps<T> {
  data: T[]
  columns: Column<T>[]
  className?: string
  onRowClick?: (row: T) => void
  showSparklines?: boolean
}

export function FinancialTable<T extends Record<string, any>>({
  data,
  columns,
  className,
  onRowClick,
  showSparklines = false
}: FinancialTableProps<T>) {
  const [sortKey, setSortKey] = React.useState<string | null>(null)
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("asc")

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortDirection("asc")
    }
  }

  const sortedData = React.useMemo(() => {
    if (!sortKey) return data

    return [...data].sort((a, b) => {
      const aVal = a[sortKey]
      const bVal = b[sortKey]

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal
      }

      const aStr = String(aVal).toLowerCase()
      const bStr = String(bVal).toLowerCase()
      
      if (sortDirection === "asc") {
        return aStr.localeCompare(bStr)
      } else {
        return bStr.localeCompare(aStr)
      }
    })
  }, [data, sortKey, sortDirection])

  return (
    <div className={cn("rounded-xl border bg-card overflow-hidden", className)}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/20">
              {columns.map((column, index) => (
                <th
                  key={String(column.key)}
                  className={cn(
                    "px-4 py-3 text-sm font-medium",
                    column.align === "right" && "text-right",
                    column.align === "center" && "text-center",
                    column.align === "left" && "text-left",
                    !column.align && "text-left",
                    column.sortable && "cursor-pointer hover:bg-muted/40 transition-colors"
                  )}
                  onClick={() => column.sortable && handleSort(String(column.key))}
                >
                  <div className="flex items-center gap-2">
                    {column.header}
                    {column.sortable && sortKey === column.key && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                      >
                        {sortDirection === "asc" ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : (
                          <ArrowDown className="h-3 w-3" />
                        )}
                      </motion.div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, rowIndex) => (
              <motion.tr
                key={rowIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  delay: rowIndex * 0.03,
                  duration: 0.3
                }}
                className={cn(
                  "border-b last:border-0 hover:bg-muted/20 transition-colors",
                  onRowClick && "cursor-pointer"
                )}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((column) => {
                  const value = row[column.key as keyof T]
                  const content = column.render ? column.render(value, row) : value

                  return (
                    <td
                      key={String(column.key)}
                      className={cn(
                        "px-4 py-3 text-sm",
                        column.align === "right" && "text-right",
                        column.align === "center" && "text-center",
                        column.align === "left" && "text-left",
                        !column.align && "text-left"
                      )}
                    >
                      {content}
                    </td>
                  )
                })}
              </motion.tr>
            ))}
          </tbody>
        </table>

        {sortedData.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No data available</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Helper component for trend indicators
export function TrendIndicator({ 
  value, 
  className 
}: { 
  value: number
  className?: string 
}) {
  const isPositive = value > 0
  const isNeutral = value === 0

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-sm font-medium",
        isPositive && "text-green-500",
        value < 0 && "text-red-500",
        isNeutral && "text-muted-foreground",
        className
      )}
    >
      {isPositive && <ArrowUp className="h-3 w-3" />}
      {value < 0 && <ArrowDown className="h-3 w-3" />}
      {isNeutral && <Minus className="h-3 w-3" />}
      {Math.abs(value)}
    </span>
  )
}

// Helper component for sparklines (simple line chart)
export function Sparkline({ 
  data, 
  className 
}: { 
  data: number[]
  className?: string 
}) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100
    const y = 100 - ((value - min) / range) * 100
    return `${x},${y}`
  }).join(" ")

  return (
    <svg 
      viewBox="0 0 100 30" 
      className={cn("w-20 h-8", className)}
      preserveAspectRatio="none"
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="text-primary"
      />
    </svg>
  )
}
