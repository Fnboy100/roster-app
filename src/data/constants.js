// ─── roster-app/src/data/constants.js ────────────────────────────────────────

export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
export const WEEKEND_DAYS = ["Friday", "Saturday", "Sunday"];
export const SHIFTS = ["AM", "PM", "Off"];

// Outlet/location tags — T = Terraces, RST = Restaurant
// "none" means no outlet tag (plain AM or PM)
export const OUTLETS = ["none", "T", "RST"];

export const OUTLET_LABELS = {
  none: "",
  T:    "T",
  RST:  "RST",
};

// Departments that use the legacy AM/PM/Off + outlet system (Bar,
// Stewarding, Store, ...) don't all mean the same thing by "AM"/"PM", and
// not all of them use outlet tags at all. This is display-only — the
// underlying cell value is always { shift: "AM"|"PM"|"Off", outlet } for
// every one of them, so nothing about generateRoster.js/RosterTable's
// core logic branches on department; only the legend text shown (in the
// UI and in PDF/CSV exports) and whether the outlet picker appears at
// all change per department. Departments not listed here fall back to
// the Bar-style default.
export const DEPARTMENT_SHIFT_LEGEND = {
  STEWARDING: {
    am: "AM = 8:00 AM \u2013 6:00 PM (Morning)",
    pm: "PM = 5:00 PM \u2013 Close (Night \u2014 cleanup can run past midnight, until the last guest leaves)",
    showOutlet: false,
  },
};
const DEFAULT_SHIFT_LEGEND = {
  am: "AM = 11am\u20136pm",
  pm: "PM = 4pm\u201312am",
  showOutlet: true,
};

export function shiftLegendForDepartment(departmentCode) {
  return DEPARTMENT_SHIFT_LEGEND[departmentCode] || DEFAULT_SHIFT_LEGEND;
}

export function departmentShowsOutlet(departmentCode) {
  return shiftLegendForDepartment(departmentCode).showOutlet;
}

// A full shift cell value is: { shift: "AM"|"PM"|"Off", outlet: "none"|"T"|"RST" }
// Helpers
export function makeCell(shift = "Off", outlet = "none") {
  return { shift, outlet };
}

export function cellLabel(cell, showOutlet = true) {
  if (!cell || cell.shift === "Off") return "Off";
  if (!showOutlet || !cell.outlet || cell.outlet === "none") return cell.shift;
  return `${cell.shift} <${cell.outlet}>`;
}

export const INITIAL_STAFF = [
  { id: 1,  name: "Steven",    position: "Supervisor" },
  { id: 2,  name: "Kalu",      position: "Supervisor"  },
  { id: 3,  name: "Kizito",    position: "Bartender"  },
  { id: 4,  name: "Bassy",     position: "Bartender"  },
  { id: 5,  name: "Mustafa",   position: "Bartender"  },
  { id: 6,  name: "Simisi",    position: "Bartender"  },
  { id: 7,  name: "Timothy",   position: "Barback"    },
  { id: 8,  name: "Paul",  position: "Barback"    },
  { id: 9, name: "Isaac",     position: "Barback"    },
];

export const POSITION_COLORS = {
  // --- Bar (amber / sky / violet family) ---
  Supervisor: { bg: "#fff7ed", border: "#f59e42", text: "#7c3500" },
  Bartender:  { bg: "#f0f9ff", border: "#38bdf8", text: "#0c4a6e" },
  Barback:    { bg: "#f5f3ff", border: "#a78bfa", text: "#3b0764" },

  // --- Kitchen (red / orange family) ---
  "Hot Section":       { bg: "#fef2f2", border: "#ef4444", text: "#7f1d1d" },
  "Salad & Dessert":   { bg: "#fff7ed", border: "#fb923c", text: "#7c2d12" },
  "Bakery":            { bg: "#fffbeb", border: "#fbbf24", text: "#78350f" },
  "Chinese Section":   { bg: "#fef2f2", border: "#f87171", text: "#991b1b" },
  "Sushi Section":     { bg: "#fdf4ff", border: "#e879f9", text: "#701a75" },
  "Butcher":           { bg: "#fefce8", border: "#eab308", text: "#713f12" },

  // --- Floor (green family) ---
  "Floor Supervisor": { bg: "#f0fdf4", border: "#22c55e", text: "#14532d" },
  "Butler":            { bg: "#ecfccb", border: "#84cc16", text: "#365314" },
  "Waiter":            { bg: "#f0fdfa", border: "#2dd4bf", text: "#134e4a" },
  "Host":               { bg: "#ecfdf5", border: "#34d399", text: "#065f46" },
  "Runner":             { bg: "#f7fee7", border: "#a3e635", text: "#3f6212" },
  "Cashier":            { bg: "#f0fdf4", border: "#4ade80", text: "#166534" },
  "CRM Officer":        { bg: "#ecfdf5", border: "#10b981", text: "#064e3b" },
  "Hostess":            { bg: "#f0fdfa", border: "#5eead4", text: "#115e59" },

  // --- Stewarding (teal / cyan family) ---
  "Steward Supervisor": { bg: "#ecfeff", border: "#22d3ee", text: "#164e63" },
  "Steward":             { bg: "#f0fdfa", border: "#2dd4bf", text: "#115e59" },
  "Dishwasher":          { bg: "#eff6ff", border: "#60a5fa", text: "#1e3a8a" },

  // --- Store (indigo / slate family) ---
  "Store Supervisor": { bg: "#eef2ff", border: "#6366f1", text: "#312e81" },
  "Storekeeper":        { bg: "#f5f3ff", border: "#8b5cf6", text: "#4c1d95" },
  "Store Assistant":    { bg: "#f8fafc", border: "#94a3b8", text: "#334155" },
};

export const SHIFT_STYLES = {
  AM:  { bg: "#fef9c3", text: "#854d0e", border: "#fbbf24" },
  PM:  { bg: "#dbeafe", text: "#1e3a8a", border: "#60a5fa" },
  Off: { bg: "#f1f5f9", text: "#94a3b8", border: "#cbd5e1" },
};

export const OUTLET_BADGE_STYLES = {
  none: { bg: "transparent",  text: "transparent", border: "transparent" },
  T:    { bg: "#f0fdf4", text: "#166534", border: "#86efac" },
  RST:  { bg: "#fdf4ff", text: "#6b21a8", border: "#d8b4fe" },
};

export const DEFAULT_RULES = {
  maxWorkDays: 6,
  noBackToBack: true,
  noOffWeekends: true,
  defaultOutlet:  "none",   // auto-generation outlet default: "none" | "T" | "RST" | "random"
};

// Which job roles are available when adding roster staff, per department
// code — each department gets its own position set (and, via
// POSITION_COLORS above, its own distinct badge styling) instead of every
// department sharing the Bar's Supervisor/Bartender/Barback list.
export const DEPARTMENT_POSITIONS = {
  BAR:         ["Supervisor", "Bartender", "Barback"],
  KITCHEN:     ["Hot Section", "Salad & Dessert", "Bakery", "Chinese Section", "Sushi Section", "Butcher"],
  FLOOR:       ["Floor Supervisor", "Butler", "Waiter", "Host", "Runner", "Cashier", "CRM Officer", "Hostess"],
  STEWARDING:  ["Steward Supervisor", "Steward"],
  STORE:       ["Store Supervisor", "Storekeeper", "Store Assistant"],
};

// Departments whose roster is generated by the backend scheduling engine
// (app/services/roster_engine/ — structured shift catalog, coverage-first/
// fairness-second, deterministic) instead of the client-side generator in
// utils/generateRoster.js. RosterApp.jsx branches on this to swap in
// FloorRosterTable + the generate/validate/submit-draft flow; every other
// department's flow is unchanged. Kitchen uses the exact same engine as
// Floor with its own shift catalog and coverage rules (see
// app/services/roster_engine/catalog.py) — nothing in the engine itself
// is Floor-specific.
export const ENGINE_DEPARTMENT_CODES = ["FLOOR", "KITCHEN"];

export function isEngineDepartment(departmentCode) {
  return ENGINE_DEPARTMENT_CODES.includes(departmentCode);
}

// Backward-compatible default (Bar's list) for anywhere a department code
// isn't known yet.
export const POSITIONS = DEPARTMENT_POSITIONS.BAR;

export function positionsForDepartment(departmentCode) {
  return DEPARTMENT_POSITIONS[departmentCode] || POSITIONS;
}
