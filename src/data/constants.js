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

// A full shift cell value is: { shift: "AM"|"PM"|"Off", outlet: "none"|"T"|"RST" }
// Helpers
export function makeCell(shift = "Off", outlet = "none") {
  return { shift, outlet };
}

export function cellLabel(cell) {
  if (!cell || cell.shift === "Off") return "Off";
  if (!cell.outlet || cell.outlet === "none") return cell.shift;
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
  { id: 10, name: "Emmanuel",  position: "Barback"    },
];

export const POSITION_COLORS = {
  Supervisor: { bg: "#fff7ed", border: "#f59e42", text: "#7c3500" },
  Bartender:  { bg: "#f0f9ff", border: "#38bdf8", text: "#0c4a6e" },
  Barback:    { bg: "#f5f3ff", border: "#a78bfa", text: "#3b0764" },
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

export const POSITIONS = ["Supervisor", "Bartender", "Barback"];
