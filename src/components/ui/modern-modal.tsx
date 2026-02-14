import * as React from 'react';
import { useState } from 'react';
import {
  Modal,
  ModalTrigger,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalTitle,
} from '@/components/ui/modal';

interface ModernModalProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  onSuccess?: () => void;
  children: React.ReactNode | ((props: { onSuccess: () => void }) => React.ReactNode);
  triggerButton?: React.ReactNode;
  maxWidth?: string;
}

interface ModernEditModalProps extends Omit<ModernModalProps, 'triggerButton'> {
  children: ((props: { onSuccess: () => void }) => React.ReactNode);
  triggerElement: React.ReactNode;
}

// Create Modal Component
export const ModernCreateModal = ({ 
  title, 
  description, 
  icon: Icon, 
  onSuccess, 
  children,
  triggerButton,
  maxWidth = "md:max-w-2xl"
}: ModernModalProps) => {
  const [open, setOpen] = useState(false);

  const handleSuccess = () => {
    onSuccess?.();
    setOpen(false);
  };

  return (
    <Modal open={open} onOpenChange={setOpen}>
      <ModalTrigger asChild>
        {triggerButton}
      </ModalTrigger>
      <ModalContent className={`${maxWidth} max-h-[90vh] overflow-hidden flex flex-col`}>
        <ModalHeader className="items-center py-6">
          <Icon className="size-8" />
          <div className="flex flex-col items-center space-y-1">
            <ModalTitle className="text-xl font-medium">{title}</ModalTitle>
            <p className="text-muted-foreground text-center text-sm">
              {description}
            </p>
          </div>
        </ModalHeader>
        <ModalBody className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-hide">
          {typeof children === 'function' ? children({ onSuccess: handleSuccess }) : children}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

// Edit Modal Component
export const ModernEditModal = ({ 
  title, 
  description, 
  icon: Icon, 
  onSuccess, 
  children,
  triggerElement,
  maxWidth = "md:max-w-2xl"
}: ModernEditModalProps) => {
  const [open, setOpen] = useState(false);

  const handleSuccess = () => {
    onSuccess?.();
    setOpen(false);
  };

  return (
    <Modal open={open} onOpenChange={setOpen}>
      <ModalTrigger asChild>
        {triggerElement}
      </ModalTrigger>
      <ModalContent className={`${maxWidth} max-h-[90vh] overflow-hidden flex flex-col`}>
        <ModalHeader className="items-center py-6">
          <Icon className="size-8" />
          <div className="flex flex-col items-center space-y-1">
            <ModalTitle className="text-xl font-medium">{title}</ModalTitle>
            <p className="text-muted-foreground text-center text-sm">
              {description}
            </p>
          </div>
        </ModalHeader>
        <ModalBody className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-hide">
          {children({ onSuccess: handleSuccess })}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};