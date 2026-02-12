"use client"

import { cn } from "@/lib/utils"
import { useState } from "react"
import { ChevronDown } from "lucide-react"

export interface ExpandableGuideSectionProps {
  title: string
  icon?: React.ReactNode
  content: string[]
  index?: number
}

export function ExpandableGuideSection({
  title,
  icon,
  content,
  index = 0
}: ExpandableGuideSectionProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false)

  const toggleDetails = (): void => {
    setIsOpen(!isOpen)
  }

  return (
    <div 
      className="animate-fade-in"
      style={{ 
        animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`
      }}
    >
      <div className="relative">
        <div
          className={cn(
            "relative rounded-xl border bg-card shadow-sm transition-all duration-300 cursor-pointer overflow-hidden",
            "hover:shadow-md hover:border-primary/50",
            isOpen && "shadow-lg border-primary/50"
          )}
          onClick={toggleDetails}
          style={{
            animation: isOpen ? "pulseGlow 2s infinite" : undefined
          }}
        >
          {/* Shimmer overlay */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.05), transparent)",
              backgroundSize: "200% 100%",
              animation: "shimmer 3s infinite"
            }}
          />

          {/* Main content */}
          <div className="relative p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                {icon && (
                  <div 
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
                    style={{
                      animation: isOpen ? "bounce-gentle 2s infinite" : undefined
                    }}
                  >
                    {icon}
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-card-foreground">
                    {title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {content.length} item{content.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  Click to expand
                </div>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 text-muted-foreground transition-transform duration-300",
                    isOpen && "rotate-180"
                  )}
                />
              </div>
            </div>
          </div>

          {/* Animated border */}
          <svg 
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ 
              opacity: isOpen ? 1 : 0,
              transition: "opacity 0.3s"
            }}
          >
            <rect
              x="1"
              y="1"
              width="calc(100% - 2px)"
              height="calc(100% - 2px)"
              rx="12"
              ry="12"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="2"
              strokeDasharray="1"
              strokeDashoffset="1"
              style={{
                animation: isOpen ? "slidingLine 1s ease-out forwards" : undefined
              }}
            />
          </svg>
        </div>

        {/* Expandable details section */}
        <div
          className={cn(
            "overflow-hidden transition-all duration-500 ease-in-out",
            isOpen ? "max-h-[2000px] opacity-100 mt-4" : "max-h-0 opacity-0"
          )}
        >
          <div className="rounded-xl border bg-card/50 backdrop-blur-sm p-6 space-y-4">
            {content.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-4 p-4 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors"
                style={{
                  animation: isOpen ? `slideIn 0.4s ease-out ${idx * 0.1}s both` : undefined
                }}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary font-semibold text-sm">
                  {idx + 1}
                </div>
                <div className="flex-1 pt-1">
                  <p className="text-foreground leading-relaxed">{item}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
