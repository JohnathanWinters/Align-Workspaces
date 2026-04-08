import { useEffect, useCallback, useRef } from "react";
import type { UsePipelineReturn } from "./use-pipeline";

interface UseKeyboardOptions {
  pipeline: UsePipelineReturn;
  containerRef: React.RefObject<HTMLDivElement | null>;
  searchRef: React.RefObject<HTMLInputElement | null>;
}

export function usePipelineKeyboard({ pipeline, containerRef, searchRef }: UseKeyboardOptions) {
  const {
    flatContactList, focusedIndex, setFocusedIndex,
    selectContact, selectedContactId,
    quickLogContactId, setQuickLogContactId,
    openAddForm,
  } = pipeline;

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Skip if user is typing in an input/textarea
    const tag = (document.activeElement?.tagName || "").toLowerCase();
    if (tag === "input" || tag === "textarea" || tag === "select") return;

    switch (e.key) {
      case "j":
      case "ArrowDown": {
        e.preventDefault();
        const newIdx = Math.min(focusedIndex + 1, flatContactList.length - 1);
        setFocusedIndex(newIdx);
        // Scroll focused row into view
        const row = containerRef.current?.querySelector(`[data-contact-id="${flatContactList[newIdx]?.id}"]`);
        row?.scrollIntoView({ block: "nearest" });
        break;
      }
      case "k":
      case "ArrowUp": {
        e.preventDefault();
        const newIdx = Math.max(focusedIndex - 1, 0);
        setFocusedIndex(newIdx);
        const row = containerRef.current?.querySelector(`[data-contact-id="${flatContactList[newIdx]?.id}"]`);
        row?.scrollIntoView({ block: "nearest" });
        break;
      }
      case "Enter": {
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < flatContactList.length) {
          selectContact(flatContactList[focusedIndex].id);
        }
        break;
      }
      case "Escape": {
        e.preventDefault();
        if (quickLogContactId) {
          setQuickLogContactId(null);
        } else if (selectedContactId) {
          selectContact(null);
        }
        break;
      }
      case "l": {
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < flatContactList.length) {
          const contactId = flatContactList[focusedIndex].id;
          setQuickLogContactId(quickLogContactId === contactId ? null : contactId);
        }
        break;
      }
      case "n": {
        e.preventDefault();
        openAddForm();
        break;
      }
      case "/": {
        e.preventDefault();
        searchRef.current?.focus();
        break;
      }
    }
  }, [focusedIndex, flatContactList, selectedContactId, quickLogContactId, containerRef, searchRef, selectContact, setFocusedIndex, setQuickLogContactId, openAddForm]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("keydown", handleKeyDown);
    return () => el.removeEventListener("keydown", handleKeyDown);
  }, [containerRef, handleKeyDown]);
}
