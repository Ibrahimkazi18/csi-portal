"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { LucideIcon, ChevronDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface ProfileFolderProps {
  title: string
  icon: LucideIcon
  count?: number
  gradient?: string
  children: React.ReactNode
  defaultOpen?: boolean
}

export function ProfileFolder({ 
  title, 
  icon: Icon, 
  count,
  gradient,
  children,
  defaultOpen = false
}: ProfileFolderProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative"
    >
      {/* Folder Container */}
      <div
        className={cn(
          "relative rounded-xl border bg-card transition-all duration-500 cursor-pointer overflow-hidden",
          "hover:shadow-lg hover:border-primary/50",
          isOpen && "shadow-xl border-primary/50"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => setIsOpen(!isOpen)}
      >
        {/* Gradient overlay on hover */}
        <div 
          className="absolute inset-0 opacity-0 transition-opacity duration-500 pointer-events-none"
          style={{
            background: gradient || "radial-gradient(circle at 50% 0%, hsl(var(--primary) / 0.1), transparent 70%)",
            opacity: isHovered || isOpen ? 0.5 : 0
          }}
        />

        {/* Folder Tab */}
        <div 
          className={cn(
            "absolute -top-3 left-6 px-4 py-1 rounded-t-lg border border-b-0 bg-card transition-all duration-500",
            isOpen && "bg-primary/10 border-primary/30"
          )}
        >
          <span className="text-xs font-semibold text-muted-foreground">
            {isOpen ? "Opened" : "Closed"}
          </span>
        </div>

        {/* Folder Header */}
        <div className="relative p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.div
                animate={{
                  scale: isHovered ? 1.1 : 1,
                  rotate: isOpen ? 5 : 0
                }}
                transition={{ duration: 0.3 }}
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-xl border transition-colors",
                  isOpen ? "bg-primary/20 border-primary/50 text-primary" : "bg-muted/50 border-border text-muted-foreground"
                )}
              >
                <Icon className="h-6 w-6" />
              </motion.div>
              <div>
                <h3 className="text-lg font-semibold">{title}</h3>
                {count !== undefined && (
                  <p className="text-sm text-muted-foreground">
                    {count} {count === 1 ? 'item' : 'items'}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {count !== undefined && (
                <Badge variant={isOpen ? "default" : "secondary"}>
                  {count}
                </Badge>
              )}
              <motion.div
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              </motion.div>
            </div>
          </div>
        </div>

        {/* Folder line decoration */}
        <div 
          className={cn(
            "absolute bottom-0 left-0 h-1 bg-linear-to-r from-primary/50 to-transparent transition-all duration-500",
            isOpen ? "w-full" : "w-0"
          )}
        />
      </div>

      {/* Expandable Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-4 rounded-xl border bg-card/50 backdrop-blur-sm p-6">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
