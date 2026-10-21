"use client";

import { useEffect, useState } from "react";
import type { ModuleId } from "./types";

/**
 * Client view of hidden modules. Until the list loads nothing is hidden-
 * flagged, so the first paint may briefly include a hidden module.
 */
export function useModuleVisibility() {
  const [state, setState] = useState<{ hidden: ModuleId[]; admin: boolean; loaded: boolean }>({
    hidden: [],
    admin: false,
    loaded: false,
  });
  useEffect(() => {
    fetch("/api/modules/visibility")
      .then((r) => r.json())
      .then((d: { hidden?: ModuleId[]; admin?: boolean }) =>
        setState({ hidden: d.hidden ?? [], admin: !!d.admin, loaded: true }),
      )
      .catch(() => setState((s) => ({ ...s, loaded: true })));
  }, []);
  const isHidden = (id: ModuleId) => state.hidden.includes(id);
  return {
    ...state,
    isHidden,
    /** Shown to this viewer: everything for the admin, non-hidden for everyone else. */
    isVisible: (id: ModuleId) => state.admin || !isHidden(id),
  };
}
