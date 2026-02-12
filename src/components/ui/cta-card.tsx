"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface CtaCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  variant?: "default" | "accent" | "muted"
}

export function CtaCard({ 
  children, 
  className, 
  variant = "default",
  ...props 
}: CtaCardProps) {
  const gradientClass = variant === "accent" 
    ? "bg-radial-gradient-accent" 
    : variant === "muted"
    ? "bg-muted/20"
    : "bg-radial-gradient"

  return (
    <div
      className={cn(
        "relative rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md",
        "decorative-border",
        gradientClass,
        className
      )}
      {...props}
    >
      {/* Decorative plus icons at corners */}
      <div className="absolute -top-[1px] -left-[1px] w-3 h-3 flex items-center justify-center">
        <svg width="8" height="8" viewBox="0 0 8 8" className="text-border">
          <path d="M4 0v8M0 4h8" stroke="currentColor" strokeWidth="1" strokeDasharray="1,1" />
        </svg>
      </div>
      <div className="absolute -bottom-[1px] -right-[1px] w-3 h-3 flex items-center justify-center">
        <svg width="8" height="8" viewBox="0 0 8 8" className="text-border">
          <path d="M4 0v8M0 4h8" stroke="currentColor" strokeWidth="1" strokeDasharray="1,1" />
        </svg>
      </div>
      
      {children}
    </div>
  )
}

export function CtaCardHeader({ 
  className, 
  ...props 
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col space-y-1.5 mb-4", className)}
      {...props}
    />
  )
}

export function CtaCardTitle({ 
  className, 
  ...props 
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-xl font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  )
}

export function CtaCardDescription({ 
  className, 
  ...props 
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export function CtaCardContent({ 
  className, 
  ...props 
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("", className)} {...props} />
  )
}

export function CtaCardFooter({ 
  className, 
  ...props 
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-center pt-4 mt-4 border-t border-dashed", className)}
      {...props}
    />
  )
}
