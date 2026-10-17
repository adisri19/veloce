"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { IconButton } from "./button";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = "max-w-md",
}: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`relative w-full ${maxWidth} bg-panel border border-hairline rounded-lg shadow-2xl overflow-hidden z-10 flex flex-col`}
          >
            {title && (
              <div className="flex items-center justify-between px-5 py-4 border-b border-hairline">
                <div>
                  <h3 className="text-sm font-semibold text-fg">{title}</h3>
                  {subtitle && <p className="text-xs text-fg-muted mt-0.5">{subtitle}</p>}
                </div>
                <IconButton icon={<X className="w-4 h-4" />} onClick={onClose} />
              </div>
            )}
            <div className="p-5 overflow-y-auto max-h-[85vh]">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
