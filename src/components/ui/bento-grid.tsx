"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface BentoGridProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function BentoGrid({ children, className, ...props }: BentoGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

interface BentoCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  span?: "1" | "2" | "3" | "full"
  rowSpan?: "1" | "2"
  delay?: number
}

export function BentoCard({ 
  children, 
  className, 
  span = "1",
  rowSpan = "1",
  delay = 0,
  ...props 
}: BentoCardProps) {
  const spanClass = {
    "1": "md:col-span-1",
    "2": "md:col-span-2",
    "3": "lg:col-span-3",
    "full": "col-span-full"
  }[span]

  const rowSpanClass = {
    "1": "row-span-1",
    "2": "md:row-span-2"
  }[rowSpan]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.4, 
        delay,
        ease: [0.25, 0.1, 0.25, 1]
      }}
      className={cn(
        "relative rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md",
        "bg-radial-gradient",
        spanClass,
        rowSpanClass,
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export function BentoCardHeader({ 
  className, 
  ...props 
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-center justify-between mb-4", className)}
      {...props}
    />
  )
}

export function BentoCardTitle({ 
  className, 
  ...props 
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-lg font-semibold leading-none", className)}
      {...props}
    />
  )
}

export function BentoCardContent({ 
  className, 
  ...props 
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("", className)} {...props} />
  )
}
