import React from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes"

const themes = [
  { value: "light", icon: Sun },
  { value: "dark", icon: Moon },
  { value: "system", icon: Monitor },
] as const;

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  const currentIndex = themes.findIndex(t => t.value === theme) || 0;

  return (
    <div className={cn("relative p-1 bg-muted rounded-lg", className)}>
      {/* Sliding background */}
      <div
        className="absolute top-1 h-8 w-1/3 bg-primary rounded-md transition-transform duration-200 ease-out"
        style={{
          transform: `translateX(${currentIndex * 100}%)`,
        }}
      />
      
      {/* Options */}
      <div className="relative flex">
        {themes.map((themeOption, index) => {
          const Icon = themeOption.icon;
          const isActive = theme === themeOption.value;
          
          return (
            <button
              key={themeOption.value}
              onClick={() => setTheme(themeOption.value)}
              className={cn(
                "flex-1 flex items-center justify-center h-8 px-3 rounded-md transition-colors duration-200",
                "text-sm font-medium relative z-10 lg:px-6",
                isActive 
                  ? "text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
            </button>
          );
        })}
      </div>
    </div>
  );
}