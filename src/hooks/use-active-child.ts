import { useEffect, useState } from "react";

import { useFamily, useChildren } from "@/hooks/use-family";
import type { Child } from "@/modules/family/api";

const STORAGE_KEY = "mma:active-child-id";

/**
 * Retorna a criança ativa selecionada pelo usuário no shell.
 * Fallback: primeira criança da família. Persistido em localStorage.
 */
export function useActiveChild(): {
  activeChild: Child | null;
  children: Child[];
  setActiveChildId: (id: string | null) => void;
  isLoading: boolean;
} {
  const { data: family } = useFamily();
  const { data: children = [], isLoading } = useChildren(family?.id);
  const [activeId, setActiveId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(STORAGE_KEY);
  });

  // Se o id salvo não está mais na lista, cai no primeiro
  useEffect(() => {
    if (children.length === 0) return;
    if (!activeId || !children.find((c) => c.id === activeId)) {
      const first = children[0].id;
      setActiveId(first);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, first);
      }
    }
  }, [children, activeId]);

  const setActiveChildId = (id: string | null) => {
    setActiveId(id);
    if (typeof window !== "undefined") {
      if (id) window.localStorage.setItem(STORAGE_KEY, id);
      else window.localStorage.removeItem(STORAGE_KEY);
    }
  };

  const activeChild = children.find((c) => c.id === activeId) ?? null;
  return { activeChild, children, setActiveChildId, isLoading };
}
