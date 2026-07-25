"use client";

import { Toaster } from "sonner";
import { useTheme } from "./ThemeProvider";

export function ToastProvider() {
  const { theme } = useTheme();

  return (
    <Toaster
      theme={theme}
      position="bottom-right"
      duration={2800}
      visibleToasts={3}
      gap={10}
      offset={20}
      richColors
      closeButton
    />
  );
}
