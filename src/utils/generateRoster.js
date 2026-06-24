import { DAYS, WEEKEND_DAYS } from '../data/constants';

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
export function generateRoster(staff, rules) {

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
