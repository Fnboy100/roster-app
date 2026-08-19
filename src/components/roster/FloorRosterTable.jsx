import { useMemo, useState } from 'react';
import { DAYS } from '../../data/constants';

const FALLBACK_COLOR = '#E5E7EB';

// Groups a period's entries by role (staff position), preserving the
// staff list's own ordering within each group rather than re-sorting —
// so the table's row order matches whatever order staff were added in.
function groupByRole(staff, entriesByStaffId) {
  const order = [];
  const groups = {};
  staff.forEach((s) => {
    if (!groups[s.position]) {
      groups[s.position] = [];
      order.push(s.position);
    }
    groups[s.position].push({ staff: s, entries: entriesByStaffId[s.id] || {} });
  });
  return order.map((role) => ({ role, rows: groups[role] }));
}

function BalancePill({ balance }) {
  const rounded = Math.round(balance * 10) / 10;
  const isZero = Math.abs(rounded) < 0.05;
  const tone = isZero
    ? { bg: '#f1f5f9', color: '#64748b' }
    : rounded > 0
      ? { bg: '#fef3c7', color: '#92400e' }
      : { bg: '#fee2e2', color: '#b91c1c' };
  const label = isZero ? '0' : rounded > 0 ? `+${rounded}` : `${rounded}`;
  return (
    <span style={{ display: 'inline-block', minWidth: 34, padding: '2px 8px', borderRadius: 999, background: tone.bg, color: tone.color, fontWeight: 800, fontSize: 12 }}>
      {label}
    </span>
  );
}

function ShiftCell({ entry, template, editable, onOverride, options }) {
  const [editing, setEditing] = useState(false);
  if (!entry) {
    return <td style={{ padding: '6px 4px', textAlign: 'center', color: '#cbd5e1', fontSize: 11 }}>—</td>;
  }

  const color = template?.color || FALLBACK_COLOR;
  const label = entry.shift_code || entry.shift;

  if (editable && editing) {
    return (
      <td style={{ padding: '4px', textAlign: 'center' }}>
        <select
          autoFocus
          defaultValue={entry.shift_code || ''}
          onBlur={() => setEditing(false)}
          onChange={(e) => {
            onOverride(entry.id, e.target.value);
            setEditing(false);
          }}
          style={{ width: '100%', fontSize: 11, padding: '3px', borderRadius: 6, border: '1.5px solid #94a3b8' }}
        >
          {options.map((o) => (
            <option key={o.code} value={o.code}>{o.label}</option>
          ))}
        </select>
      </td>
    );
  }

  return (
    <td
      onClick={editable ? () => setEditing(true) : undefined}
      title={editable ? 'Click to override this shift' : undefined}
      style={{ padding: '5px 4px', textAlign: 'center', cursor: editable ? 'pointer' : 'default' }}
    >
      <div
        style={{
          background: color, borderRadius: 6, padding: '4px 2px', fontWeight: 800, fontSize: 11.5,
          color: '#1f2937', border: entry.is_manual_override ? '2px solid #7c3aed' : '1px solid rgba(0,0,0,0.06)',
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2, fontWeight: 600 }}>
        {entry.hours != null ? `${entry.hours}h` : ''}
        {entry.is_manual_override && <span title="Manually overridden" style={{ color: '#7c3aed' }}> ✎</span>}
      </div>
    </td>
  );
}

function RoleGroup({ role, rows, templateByCode, editable, onOverride, overrideOptions, groupBandStyle, targetHoursForRole }) {
  const dayWorkingCounts = DAYS.map((day) =>
    rows.reduce((count, r) => {
      const e = r.entries[day];
      return count + (e && e.shift !== 'Off' && !templateByCode[e.shift_code]?.counts_as_off ? 1 : 0);
    }, 0)
  );
  const target = targetHoursForRole(role);

  return (
    <>
      <tr>
        <td colSpan={DAYS.length + 3} style={groupBandStyle}>{role}</td>
      </tr>
      {rows.map(({ staff: s, entries }) => {
        const totalHours = DAYS.reduce((sum, day) => sum + (entries[day]?.hours || 0), 0);
        return (
          <tr key={s.id}>
            <td style={{ padding: '8px 14px', borderBottom: '1px solid #f1f5f9', fontWeight: 600, fontSize: 13, color: '#1e293b' }}>
              {s.full_name || s.name}
            </td>
            {DAYS.map((day) => (
              <ShiftCell
                key={day}
                entry={entries[day]}
                template={entries[day] ? templateByCode[entries[day].shift_code] : null}
                editable={editable}
                onOverride={onOverride}
                options={overrideOptions}
              />
            ))}
            <td style={{ padding: '6px 4px', textAlign: 'center', fontWeight: 800, fontSize: 13, color: '#0f172a', borderBottom: '1px solid #f1f5f9' }}>
              {totalHours}
            </td>
            <td style={{ padding: '6px 4px', textAlign: 'center', borderBottom: '1px solid #f1f5f9' }}>
              {target != null ? <BalancePill balance={totalHours - target} /> : <span style={{ color: '#cbd5e1', fontSize: 11 }}>—</span>}
            </td>
          </tr>
        );
      })}
      <tr style={{ background: '#f8fafc' }}>
        <td style={{ padding: '5px 14px', fontSize: 11, fontWeight: 700, color: '#64748b' }}>Working today</td>
        {dayWorkingCounts.map((count, i) => (
          <td key={DAYS[i]} style={{ padding: '5px 4px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#64748b' }}>
            {count}
          </td>
        ))}
        <td colSpan={2} />
      </tr>
    </>
  );
}

/**
 * Renders one roster period the way the reference manual rosters looked
 * (Floor and Kitchen both use this): dates across the top, staff grouped by role with a colored
 * band header per group, one colored cell per day showing the shift code
 * + its hours, then Total Hours and Balance (vs. that role's configured
 * target_weekly_hours) columns, plus a per-day "working" total row under
 * each group for a quick manager scan.
 *
 * `editable` (only true while the period is a 'draft') turns each cell
 * into a click-to-change shift-code picker calling `onOverride(entryId, shiftCode)`.
 */
export default function FloorRosterTable({ period, staff, shiftTemplates, coverageRules, editable, onOverride }) {
  const templateByCode = useMemo(() => {
    const map = {};
    shiftTemplates.forEach((t) => { map[t.code] = t; });
    return map;
  }, [shiftTemplates]);

  const ruleByRole = useMemo(() => {
    const map = {};
    (coverageRules || []).forEach((r) => { map[r.role] = r; });
    return map;
  }, [coverageRules]);
  const targetHoursForRole = (role) => ruleByRole[role]?.target_weekly_hours ?? null;

  const entriesByStaffId = useMemo(() => {
    const map = {};
    (period?.entries || []).forEach((e) => {
      if (!map[e.roster_staff_id]) map[e.roster_staff_id] = {};
      map[e.roster_staff_id][e.day] = e;
    });
    return map;
  }, [period]);

  const groups = useMemo(() => groupByRole(staff, entriesByStaffId), [staff, entriesByStaffId]);

  const overrideOptions = useMemo(
    () => shiftTemplates.filter((t) => t.is_active).map((t) => ({ code: t.code, label: t.label })),
    [shiftTemplates]
  );

  const th = (bg, color, w) => ({
    background: bg, color, padding: '10px 6px', textAlign: 'center',
    fontWeight: 700, fontSize: 11, letterSpacing: 0.5, minWidth: w, textTransform: 'uppercase',
    borderBottom: '2px solid #1e293b',
  });

  const groupBandStyle = { background: '#fdba74', color: '#7c2d12', fontWeight: 800, fontSize: 12, padding: '6px 12px', letterSpacing: 0.5, textTransform: 'uppercase' };

  return (
    <div style={{ overflowX: 'auto', borderRadius: 14, boxShadow: '0 2px 16px rgba(0,0,0,0.07)', background: '#fff', marginBottom: 20 }}>
      <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 920 }}>
        <thead>
          <tr>
            <th style={th('#0f172a', '#fff', 170)}>Role / Name</th>
            {DAYS.map((d) => (
              <th key={d} style={th('#0f172a', '#fff', 78)}>{d.slice(0, 3)}</th>
            ))}
            <th style={th('#0f172a', '#fff', 70)}>Total Hrs</th>
            <th style={th('#0f172a', '#fff', 60)}>Balance</th>
          </tr>
        </thead>
        <tbody>
          {groups.map(({ role, rows }) => (
            <RoleGroup
              key={role}
              role={role}
              rows={rows}
              templateByCode={templateByCode}
              editable={editable}
              onOverride={onOverride}
              overrideOptions={overrideOptions}
              groupBandStyle={groupBandStyle}
              targetHoursForRole={targetHoursForRole}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
