import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// Define the props for the main component
interface ModernFormProps {
  className?: string;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  loading?: boolean;
  submitText?: string;
  children: React.ReactNode;
}

interface FormSectionProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  className?: string;
}

// Animation variants for Framer Motion
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

// Form Section Component
export const FormSection = ({ title, icon: Icon, children, className }: FormSectionProps) => (
  <motion.div variants={itemVariants} className={cn("space-y-3", className)}>
    <h3 className="font-medium text-card-foreground flex items-center gap-2 text-sm">
      <Icon className="h-4 w-4" />
      {title}
    </h3>
    <div className="space-y-3">
      {children}
    </div>
  </motion.div>
);

// Main ModernForm component
export const ModernForm = React.forwardRef<HTMLDivElement, ModernFormProps>(
  ({
    className,
    onSubmit,
    loading = false,
    submitText = "Submit",
    children,
  }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('w-full space-y-4', className)}
      >
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          <form onSubmit={onSubmit} className="space-y-4">
            {children}
            
            {/* Submit Button */}
            <motion.div variants={itemVariants} className="pt-2">
              <Button
                type="submit"
                disabled={loading}
                className="h-10 w-full rounded-lg text-sm font-medium"
                asChild
              >
                <motion.button whileTap={{ scale: 0.98 }}>
                  {loading ? "Processing..." : submitText}
                </motion.button>
              </Button>
            </motion.div>
          </form>
        </motion.div>
      </div>
    );
  }
);

ModernForm.displayName = 'ModernForm';