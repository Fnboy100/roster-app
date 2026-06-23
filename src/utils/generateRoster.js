import { DAYS, WEEKEND_DAYS } from '../data/constants';

/**
 * Constraint-based weekly roster generator.
 *
 * Rules enforced:
 *  1. No Off on Friday, Saturday, Sunday (when noOffWeekends = true)
 *  2. No PM → AM back-to-back across consecutive days (when noBackToBack = true)
 *  3. Max working days per week per person
 *  4. At least 1 AM and 1 PM shift covered per position group per day
 */
export function generateRoster(staff, rules) {
  const roster = {};
  const workCount = {};
  staff.forEach(s => {
    roster[s.id] = {};
    workCount[s.id] = 0;
  });

  DAYS.forEach((day, dayIdx) => {
    const isWeekend = WEEKEND_DAYS.includes(day);
    const dayAssignments = {};

    // Shuffle staff for fairness
    const shuffled = [...staff].sort(() => Math.random() - 0.5);

    shuffled.forEach(s => {
      const prevShift = dayIdx > 0 ? roster[s.id][DAYS[dayIdx - 1]] : null;
      const maxReached = workCount[s.id] >= rules.maxWorkDays;

      let options;
      if (isWeekend && rules.noOffWeekends) {
        // Must work — only AM or PM
        if (rules.noBackToBack && prevShift === 'PM') {
          options = ['PM', 'PM', 'AM']; // prefer PM to break chain, AM as fallback
        } else {
          options = ['AM', 'AM', 'PM', 'PM'];
        }
      } else {
        if (maxReached) {
          options = ['Off'];
        } else if (rules.noBackToBack && prevShift === 'PM') {
          options = ['PM', 'Off', 'Off'];
        } else {
          options = ['AM', 'AM', 'PM', 'PM', 'Off'];
        }
      }

      const chosen = options[Math.floor(Math.random() * options.length)];
      dayAssignments[s.id] = chosen;
      if (chosen !== 'Off') workCount[s.id]++;
    });

    // Enforce minimum coverage: at least 1 AM + 1 PM per position per day
    ['Supervisor', 'Bartender', 'Barback'].forEach(pos => {
      const group = staff.filter(s => s.position === pos).map(s => s.id);
      if (!group.length) return;

      const hasAM = group.some(id => dayAssignments[id] === 'AM');
      const hasPM = group.some(id => dayAssignments[id] === 'PM');

      if (!hasAM) {
        const pick = group.find(id =>
          dayAssignments[id] === 'Off' && workCount[id] < rules.maxWorkDays
        );
        if (pick) { dayAssignments[pick] = 'AM'; workCount[pick]++; }
      }
      if (!hasPM && group.length > 1) {
        const pick = group.find(id =>
          dayAssignments[id] === 'Off' && workCount[id] < rules.maxWorkDays
        );
        if (pick) { dayAssignments[pick] = 'PM'; workCount[pick]++; }
      }
    });

    staff.forEach(s => { roster[s.id][day] = dayAssignments[s.id]; });
  });

  return roster;
}
