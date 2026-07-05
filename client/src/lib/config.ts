// ─────────────────────────────────────────────────────────────────────────────
// Feature flags — toggle integrations for demo vs. standalone sale
// ─────────────────────────────────────────────────────────────────────────────

export const FEATURES = {
  /**
   * Tech & Journey Log integration.
   * true  → shows nav section + 8:45 widget + full iframe page
   * false → completely hidden (no sidebar entry, no widget, no route)
   *
   * IMPORTANT: Set to false before delivering Medivac.ai as a standalone product.
   */
  TECH_LOG: true,
} as const;
