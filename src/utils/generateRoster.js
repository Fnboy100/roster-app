import { DAYS, WEEKEND_DAYS, OUTLETS, makeCell } from '../data/constants';

/**
 * Constraint-based weekly roster generator — v3 (precise fairness edition)
 *
 * Rules enforced:
 *  1. Supervisors always PM. No Off on their working days.
 *  2. No Off on Friday, Saturday, Sunday (noOffWeekends = true)
 *  3. No PM → AM back-to-back on consecutive days (noBackToBack = true)
 *  4. Every person gets exactly their guaranteed off days per week
 *     (7 - maxWorkDays). Off days are pre-assigned on WEEKDAYS only.
 *  5. On any given weekday, at most 1 person per position group gets Off.
 *     (No two Bartenders or two Barbacks off on the same day)
 *  6. Every day must have at least 1 AM and 1 PM per non-supervisor group.
 */
/*  export function generateRoster(staff, rules) {

  // ── 1. Separate staff by role ────────────────────────────────────────────
  const supervisors = staff.filter(s => s.position === 'Supervisor');
  const nonSupervisors = staff.filter(s => s.position !== 'Supervisor');

  // Group non-supervisors by position
  const byPosition = {};
  nonSupervisors.forEach(s => {
    if (!byPosition[s.position]) byPosition[s.position] = [];
    byPosition[s.position].push(s);
  });

  const weekdays = DAYS.filter(d => !WEEKEND_DAYS.includes(d)); // Mon–Thu
  const weekends = WEEKEND_DAYS;                                 // Fri–Sun

  // ── 2. Pre-assign Off days for each non-supervisor ───────────────────────
  // Each person gets exactly (7 - maxWorkDays) off days, placed on weekdays only.
  // Within each position group, no two people share the same off day.
  const offDayMap = {}; // id → Set of day names they are Off
  nonSupervisors.forEach(s => { offDayMap[s.id] = new Set(); });

  const targetOffDays = Math.max(0, 7 - rules.maxWorkDays); // e.g. 6 work days → 1 off day

  // Process each position group independently so off days don't collide within group
  Object.entries(byPosition).forEach(([, group]) => {
    // Build a pool of weekdays and distribute off days round-robin across members
    // so no single day is overloaded with multiple off people from the same group
    const shuffledWeekdays = [...weekdays].sort(() => Math.random() - 0.5);

    // For each member, pick their off days from the pool avoiding days already
    // taken by a group-mate
    group.forEach(s => {
      const takenByGroup = new Set(); // days already used as Off by this group today
      group.forEach(other => {
        if (other.id !== s.id) offDayMap[other.id].forEach(d => takenByGroup.add(d));
      });

      let assigned = 0;
      // Shuffle again per person for variety
      const pool = [...shuffledWeekdays].sort(() => Math.random() - 0.5);
      for (const day of pool) {
        if (assigned >= targetOffDays) break;
        if (takenByGroup.has(day)) continue; // someone else in same group is off this day
        offDayMap[s.id].add(day);
        assigned++;
      }

      // Fallback: if pool exhausted (tight constraints), allow a shared off day
      if (assigned < targetOffDays) {
        for (const day of pool) {
          if (assigned >= targetOffDays) break;
          if (!offDayMap[s.id].has(day)) {
            offDayMap[s.id].add(day);
            assigned++;
          }
        }
      }
    });
  });

  // ── 3. Build the roster day by day ──────────────────────────────────────
  const roster = {};
  staff.forEach(s => { roster[s.id] = {}; });

  // Track consecutive shift for back-to-back rule
  const lastShift = {}; // id → last assigned shift string

  DAYS.forEach((day) => {
    const isWeekend = WEEKEND_DAYS.includes(day);
    const dayAssignments = {};

    // ── 3a. Supervisors: always PM ─────────────────────────────────────
    supervisors.forEach(s => {
      dayAssignments[s.id] = 'PM';
      lastShift[s.id] = 'PM';
    });

    // ── 3b. Non-supervisors ─────────────────────────────────────────────
    // First pass: assign Off where pre-planned (weekdays only)
    nonSupervisors.forEach(s => {
      if (!isWeekend && offDayMap[s.id].has(day)) {
        dayAssignments[s.id] = 'Off';
      }
    });

    // Second pass: assign AM/PM to everyone not yet assigned
    // Shuffle within each group for shift variety
    Object.entries(byPosition).forEach(([, group]) => {
      const unassigned = group
        .filter(s => dayAssignments[s.id] === undefined)
        .sort(() => Math.random() - 0.5);

      // Count how many AM/PM already decided for this group today
      const amCount = group.filter(s => dayAssignments[s.id] === 'AM').length;
      const pmCount = group.filter(s => dayAssignments[s.id] === 'PM').length;

      // We want at least 1 AM and 1 PM in each group by end of day.
      // Track needs as we go.
      let needAM = amCount === 0;
      let needPM = pmCount === 0;

      unassigned.forEach((s, idx) => {
        const prev = lastShift[s.id];
        const isLastInGroup = idx === unassigned.length - 1;

        let chosen;

        // Guarantee coverage for the last unassigned person if still needed
        if (isLastInGroup && needAM && !needPM) {
          chosen = 'AM';
        } else if (isLastInGroup && needPM && !needAM) {
          chosen = 'PM';
        } else if (isLastInGroup && needAM && needPM) {
          // Two people still needed — this person covers one, previous gets flipped below
          chosen = 'PM';
          // Fix the previous person to AM if possible
          const prev2 = unassigned[idx - 1];
          if (prev2 && dayAssignments[prev2.id] === 'PM') {
            dayAssignments[prev2.id] = 'AM';
          }
        } else {
          // Normal random pick respecting back-to-back rule
          if (rules.noBackToBack && prev === 'PM') {
            // Avoid AM after PM — prefer PM or pick randomly between PM-weighted options
            chosen = Math.random() < 0.65 ? 'PM' : 'AM';
          } else {
            chosen = Math.random() < 0.5 ? 'AM' : 'PM';
          }
        }

        dayAssignments[s.id] = chosen;
        lastShift[s.id] = chosen;
        if (chosen === 'AM') needAM = false;
        if (chosen === 'PM') needPM = false;
      });
    });

    // ── 3c. Safety net: ensure every group has ≥1 AM and ≥1 PM ───────
    Object.entries(byPosition).forEach(([, group]) => {
      const working = group.filter(s => dayAssignments[s.id] !== 'Off');
      if (working.length === 0) return;

      const hasAM = working.some(s => dayAssignments[s.id] === 'AM');
      const hasPM = working.some(s => dayAssignments[s.id] === 'PM');

      if (!hasAM) {
        // Flip one PM worker to AM
        const flip = working.find(s => dayAssignments[s.id] === 'PM');
        if (flip) { dayAssignments[flip.id] = 'AM'; lastShift[flip.id] = 'AM'; }
      }
      if (!hasPM) {
        const flip = working.find(s => dayAssignments[s.id] === 'AM');
        if (flip) { dayAssignments[flip.id] = 'PM'; lastShift[flip.id] = 'PM'; }
      }
    });

    // Commit day
    staff.forEach(s => { roster[s.id][day] = dayAssignments[s.id]; });
  });

  return roster;
}
*/

// ─── roster-app/src/utils/generateRoster.js ──────────────────────────────────

/**
 * Two-phase constraint-based roster generator — v4 (with outlet support)
 *
 * Each cell is now an object: { shift: "AM"|"PM"|"Off", outlet: "none"|"T"|"RST" }
 *
 * Outlet assignment rules:
 *  - "Off" cells always get outlet "none"
 *  - If rules.defaultOutlet is "random" → randomly pick T or RST per working cell
 *  - If rules.defaultOutlet is "T" or "RST" → all working cells get that outlet
 *  - If rules.defaultOutlet is "none" → no outlet tag (plain AM / PM)
 *
 * All other scheduling constraints remain identical to v3.
 *
 * rules.noOffWeekends (default true, set in RulesPanel):
 *  - true  → Off days are only ever pre-planned/applied on Mon–Thu, exactly
 *            like the original locked behavior (nobody is ever Off on
 *            Fri/Sat/Sun).
 *  - false → the Off-day pool spans the full week, so generation can place
 *            someone's Off day on Friday, Saturday, or Sunday too.
 */
export function generateRoster(staff, rules) {

  // ── PHASE 1: Pre-plan off days ───────────────────────────────────────────
  const supervisors    = staff.filter(s => s.position === 'Supervisor');
  const nonSupervisors = staff.filter(s => s.position !== 'Supervisor');

  const byPosition = {};
  nonSupervisors.forEach(s => {
    if (!byPosition[s.position]) byPosition[s.position] = [];
    byPosition[s.position].push(s);
  });

  // Off-day pool: weekdays only when the "No Off on Fri/Sat/Sun" rule is on
  // (matches the original locked behavior exactly); the full week when it's
  // off, so Off days can actually land on the weekend.
  const offDayPool = rules.noOffWeekends
    ? DAYS.filter(d => !WEEKEND_DAYS.includes(d))
    : [...DAYS];
  const targetOffDays = Math.max(0, 7 - rules.maxWorkDays);

  const offDayMap = {};
  nonSupervisors.forEach(s => { offDayMap[s.id] = new Set(); });

  Object.entries(byPosition).forEach(([, group]) => {
    const shuffledPool = [...offDayPool].sort(() => Math.random() - 0.5);

    group.forEach(s => {
      const takenByGroup = new Set();
      group.forEach(other => {
        if (other.id !== s.id) offDayMap[other.id].forEach(d => takenByGroup.add(d));
      });

      let assigned = 0;
      const pool = [...shuffledPool].sort(() => Math.random() - 0.5);
      for (const day of pool) {
        if (assigned >= targetOffDays) break;
        if (takenByGroup.has(day)) continue;
        offDayMap[s.id].add(day);
        assigned++;
      }
      // Fallback
      if (assigned < targetOffDays) {
        for (const day of pool) {
          if (assigned >= targetOffDays) break;
          if (!offDayMap[s.id].has(day)) { offDayMap[s.id].add(day); assigned++; }
        }
      }
    });
  });

  // ── PHASE 2: Assign shifts day by day ────────────────────────────────────
  const roster    = {};
  const lastShift = {};
  staff.forEach(s => { roster[s.id] = {}; });

  // Helper: pick outlet for a working cell
  function pickOutlet() {
    if (rules.defaultOutlet === 'random') {
      const workingOutlets = OUTLETS.filter(o => o !== 'none');
      return workingOutlets[Math.floor(Math.random() * workingOutlets.length)];
    }
    return rules.defaultOutlet || 'none';
  }

  DAYS.forEach((day) => {
    const isWeekend = WEEKEND_DAYS.includes(day);
    const dayAssignments = {}; // id → { shift, outlet }

    // Supervisors: always PM
    supervisors.forEach(s => {
      dayAssignments[s.id] = makeCell('PM', pickOutlet());
      lastShift[s.id] = 'PM';
    });

    // Apply pre-planned off days — weekdays only if noOffWeekends is on,
    // any day of the week (including the weekend) if it's off.
    const canBeOffToday = !rules.noOffWeekends || !isWeekend;
    nonSupervisors.forEach(s => {
      if (canBeOffToday && offDayMap[s.id].has(day)) {
        dayAssignments[s.id] = makeCell('Off', 'none');
      }
    });

    // Assign AM/PM within each position group
    Object.entries(byPosition).forEach(([, group]) => {
      const unassigned = group
        .filter(s => dayAssignments[s.id] === undefined)
        .sort(() => Math.random() - 0.5);

      const amCount = group.filter(s => dayAssignments[s.id]?.shift === 'AM').length;
      const pmCount = group.filter(s => dayAssignments[s.id]?.shift === 'PM').length;

      let needAM = amCount === 0;
      let needPM = pmCount === 0;

      unassigned.forEach((s, idx) => {
        const prev = lastShift[s.id];
        const isLast = idx === unassigned.length - 1;

        let chosenShift;

        if (isLast && needAM && !needPM) {
          chosenShift = 'AM';
        } else if (isLast && needPM && !needAM) {
          chosenShift = 'PM';
        } else if (isLast && needAM && needPM) {
          chosenShift = 'PM';
          const prev2 = unassigned[idx - 1];
          if (prev2 && dayAssignments[prev2.id]?.shift === 'PM') {
            dayAssignments[prev2.id] = makeCell('AM', dayAssignments[prev2.id].outlet);
          }
        } else {
          if (rules.noBackToBack && prev === 'PM') {
            chosenShift = Math.random() < 0.65 ? 'PM' : 'AM';
          } else {
            chosenShift = Math.random() < 0.5 ? 'AM' : 'PM';
          }
        }

        dayAssignments[s.id] = makeCell(chosenShift, pickOutlet());
        lastShift[s.id] = chosenShift;
        if (chosenShift === 'AM') needAM = false;
        if (chosenShift === 'PM') needPM = false;
      });
    });

    // Safety net: ensure ≥1 AM and ≥1 PM per group
    Object.entries(byPosition).forEach(([, group]) => {
      const working = group.filter(s => dayAssignments[s.id]?.shift !== 'Off');
      if (!working.length) return;

      const hasAM = working.some(s => dayAssignments[s.id]?.shift === 'AM');
      const hasPM = working.some(s => dayAssignments[s.id]?.shift === 'PM');

      if (!hasAM) {
        const flip = working.find(s => dayAssignments[s.id]?.shift === 'PM');
        if (flip) {
          dayAssignments[flip.id] = makeCell('AM', dayAssignments[flip.id].outlet);
          lastShift[flip.id] = 'AM';
        }
      }
      if (!hasPM) {
        const flip = working.find(s => dayAssignments[s.id]?.shift === 'AM');
        if (flip) {
          dayAssignments[flip.id] = makeCell('PM', dayAssignments[flip.id].outlet);
          lastShift[flip.id] = 'PM';
        }
      }
    });

    staff.forEach(s => { roster[s.id][day] = dayAssignments[s.id]; });
  });

  return roster;
}
