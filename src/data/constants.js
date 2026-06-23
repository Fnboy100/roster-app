export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
export const WEEKEND_DAYS = ["Friday", "Saturday", "Sunday"];
export const SHIFTS = ["AM", "PM", "Off"];

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

export const DEFAULT_RULES = {
  maxWorkDays: 6,
  noBackToBack: true,
  noOffWeekends: true,
};

export const POSITIONS = ["Supervisor", "Bartender", "Barback"];
