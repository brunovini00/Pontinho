import { useId, useLayoutEffect, useRef } from "react";
import type { ReactNode } from "react";

export default function Dialog({ title, description, visual, children, onClose, className = "" }: {
  title: string;
  description: ReactNode;
  visual?: ReactNode;
  children: ReactNode;
  onClose: () => void;
  className?: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const id = useId();

  useLayoutEffect(() => {
    const element = dialog.current;
    if (!element) return;
    const returnFocus = document.activeElement;
    element.showModal();
    return () => {
      element.close();
      if (returnFocus instanceof HTMLElement && returnFocus.isConnected) {
        returnFocus.focus({ preventScroll: true });
      }
    };
  }, []);

  return (
    <dialog
      ref={dialog}
      className={`dialog ${className}`}
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-description`}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      {visual}
      <h2 id={`${id}-title`}>{title}</h2>
      <p id={`${id}-description`}>{description}</p>
      {children}
    </dialog>
  );
}
