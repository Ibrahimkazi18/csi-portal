"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface StatCardProps {
  title: string
  value: string | number
  description: string
  icon: LucideIcon
  index: number
  gradient?: string
  onClick?: () => void
}

export function StatCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  index,
  gradient,
  onClick 
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.4, 
        delay: index * 0.1,
        ease: [0.25, 0.1, 0.25, 1]
      }}
      className={cn(
        "group relative overflow-visible rounded-xl border border-border bg-card p-0 transition-all duration-300 hover:border-primary/50 cursor-pointer",
        onClick && "cursor-pointer"
      )}
      onClick={onClick}
    >
      {/* Subtle gradient on hover */}
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div 
          className="absolute -inset-px rounded-xl"
          style={{
            background: gradient || "linear-gradient(135deg, hsl(var(--primary) / 0.1), hsl(var(--primary) / 0.05))"
          }}
        />
      </div>

      {/* Faint inner glow on hover */}
      <div 
        className="pointer-events-none absolute inset-0 rounded-xl transition-colors"
        style={{
          background: "linear-gradient(to bottom right, hsl(var(--primary) / 0), hsl(var(--primary) / 0))"
        }}
      />

      {/* White corner squares on hover */}
      <div className="pointer-events-none absolute inset-0 hidden group-hover:block">
        <div className="absolute -left-1 -top-1 h-2 w-2 bg-primary" />
        <div className="absolute -right-1 -top-1 h-2 w-2 bg-primary" />
        <div className="absolute -left-1 -bottom-1 h-2 w-2 bg-primary" />
        <div className="absolute -right-1 -bottom-1 h-2 w-2 bg-primary" />
      </div>

      <div className="relative z-10 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-muted/50 text-primary group-hover:bg-primary/10 transition-colors">
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
            </div>
            <div className="text-3xl font-bold text-foreground mb-1">{value}</div>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
      </div>

      {/* Focus ring accent on hover */}
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-xl ring-0 ring-primary/0"
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.25 }}
      />
    </motion.div>
  )
}
