import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiErrorMessage } from '../api/client';
import * as rosterApi from '../api/roster';
import * as rosterEngineApi from '../api/rosterEngine';
import * as departmentsApi from '../api/departments';
import { DEFAULT_RULES, DAYS, makeCell, positionsForDepartment, isEngineDepartment, departmentShowsOutlet } from '../data/constants';
import { generateRoster } from '../utils/generateRoster';
import { exportCSV } from '../utils/exportCSV';
import { exportPDF } from '../utils/exportPDF';
import StatsBar    from '../components/StatsBar';
import RosterTable from '../components/RosterTable';
import RulesPanel  from '../components/RulesPanel';
import AddStaffForm from '../components/AddStaffForm';
import StaffManagementPanel from '../components/StaffManagementPanel';
import RosterStatusBadge from '../components/roster/RosterStatusBadge';
import RosterApprovalPanel from '../components/roster/RosterApprovalPanel';
import ChangeRequestModal from '../components/roster/ChangeRequestModal';
import ChangeRequestsList from '../components/roster/ChangeRequestsList';
import FloorRosterTable from '../components/roster/FloorRosterTable';
import ValidationPanel from '../components/roster/ValidationPanel';
import FloorSettingsPanel from '../components/roster/FloorSettingsPanel';

const btn = (bg, color) => ({
  background: bg, color, border: 'none', borderRadius: 8,
  padding: '8px 15px', fontWeight: 700, fontSize: 13, cursor: 'pointer',
});

const GENERATOR_ROLES = ['admin', 'manager', 'supervisor'];
const APPROVER_ROLES = ['admin', 'manager'];

// Computes { start, end, label } for the Monday–Sunday week `offsetWeeks`
// away from the week containing today (0 = this week, 1 = next week, -1 =
// last week, ...). start/end are ISO date strings ("YYYY-MM-DD") for the
// API; label is the "Month D – D" display format used throughout.
function getWeek(offsetWeeks) {
  const today = new Date();
  const dow = today.getDay();
  const diffToMonday = dow === 0 ? -6 : 1 - dow;

  const monday = new Date(today);
  monday.setDate(today.getDate() + diffToMonday + offsetWeeks * 7);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const iso = (d) => d.toISOString().slice(0, 10);
  const startMonth = monday.toLocaleDateString('en-US', { month: 'long' });
  const endMonth = sunday.toLocaleDateString('en-US', { month: 'long' });
  const label = startMonth === endMonth
    ? `${startMonth} ${monday.getDate()} \u2013 ${sunday.getDate()}`
    : `${startMonth.slice(0, 3)} ${monday.getDate()} \u2013 ${endMonth.slice(0, 3)} ${sunday.getDate()}`;

  return { start: iso(monday), end: iso(sunday), label };
}

// period.entries (RosterEntryOut[]) -> the {staffId: {day: {shift,outlet}}} shape RosterTable/StatsBar expect.
function entriesToRoster(entries) {
  const roster = {};
  entries.forEach((e) => {
    if (!roster[e.roster_staff_id]) roster[e.roster_staff_id] = {};
    roster[e.roster_staff_id][e.day] = makeCell(e.shift, e.outlet);
  });
  return roster;
}

// RosterStaffOut[] -> the {id, name, position} shape generateRoster/RosterTable/AddStaffForm expect.
function staffFromApi(apiStaff) {
  return apiStaff.map((s) => ({ id: s.id, name: s.full_name, position: s.position }));
}

export default function RosterApp() {
  const { user } = useAuth();
  const role = user?.role?.name;
  const isGenerator = GENERATOR_ROLES.includes(role);
  const isApprover = APPROVER_ROLES.includes(role);
  const isMultiDept = role === 'admin';

  const [weekOffset, setWeekOffset] = useState(0); // 0 = this week, 1 = next week, -1 = last week
  const week = getWeek(weekOffset);

  const [departments, setDepartments] = useState([]);
  const [departmentId, setDepartmentId] = useState(undefined);
  const effectiveDepartmentId = isMultiDept ? departmentId : user?.department?.id;
  const currentDepartmentCode = isMultiDept
    ? departments.find((d) => d.id === effectiveDepartmentId)?.code
    : user?.department?.code;
  const availablePositions = positionsForDepartment(currentDepartmentCode);
  const isEngine = isEngineDepartment(currentDepartmentCode);
  const showOutlet = departmentShowsOutlet(currentDepartmentCode); // false for departments like Stewarding that don't use outlet tags

  const [staff, setStaff] = useState([]);
  const [rules, setRules] = useState(DEFAULT_RULES);
  const [roster, setRoster] = useState({});
  // Departments without outlet tags (see departmentShowsOutlet) must never
  // carry a leftover defaultOutlet from a previous department in this same
  // session — the picker that would let a manager fix it is hidden for
  // exactly those departments, so it's cleared automatically instead.
  useEffect(() => {
    if (!showOutlet && rules.defaultOutlet !== 'none') {
      setRules((prev) => ({ ...prev, defaultOutlet: 'none' }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showOutlet]);
  const [period, setPeriod] = useState(null);       // the backend RosterPeriodOut for this dept+week, or null
  const [isDraft, setIsDraft] = useState(false);     // true = freshly generated (client-side) or backend status='draft' (engine), not yet submitted
  const [changeRequests, setChangeRequests] = useState([]);
  const [showRules, setShowRules] = useState(false);
  const [showFloorSettings, setShowFloorSettings] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // Floor-engine-only state: the shift catalog + coverage rules driving
  // FloorRosterTable/FloorSettingsPanel, and the validation report for
  // whatever period is currently loaded.
  const [shiftTemplates, setShiftTemplates] = useState([]);
  const [coverageRules, setCoverageRules] = useState([]);
  const [validation, setValidation] = useState(null);
  const [exporting, setExporting] = useState(null); // 'csv' | 'pdf' | null — which export is in flight
  const [staffNotice, setStaffNotice] = useState(''); // e.g. "X was deactivated instead of deleted — has roster history"

  useEffect(() => {
    if (!isMultiDept) return;
    departmentsApi.listDepartments({}).then(setDepartments).catch(() => {});
  }, [isMultiDept]);

  const load = useCallback(async () => {
    if (!effectiveDepartmentId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const apiStaff = await rosterApi.listRosterStaff({ departmentId: effectiveDepartmentId });
      setStaff(staffFromApi(apiStaff));

      if (isEngine) {
        const [templates, rules] = await Promise.all([
          rosterEngineApi.listShiftTemplates({ departmentId: effectiveDepartmentId }),
          rosterEngineApi.listCoverageRules(effectiveDepartmentId),
        ]);
        setShiftTemplates(templates);
        setCoverageRules(rules);
      }

      const periods = await rosterApi.listRosterPeriods({ departmentId: effectiveDepartmentId });
      const current = periods.find((p) => p.week_start === week.start) || null;

      if (current) {
        const full = await rosterApi.getRosterPeriod(current.id);
        setPeriod(full);
        setRoster(entriesToRoster(full.entries));
        setIsDraft(full.status === 'draft');

        if (isEngine) {
          setValidation(await rosterEngineApi.getValidationReport(full.id));
        }

        if (full.status === 'approved') {
          const reqs = await rosterApi.listChangeRequests({ departmentId: effectiveDepartmentId });
          setChangeRequests(reqs.filter((r) => r.roster_period_id === full.id));
        } else {
          setChangeRequests([]);
        }
      } else {
        setPeriod(null);
        setRoster({});
        setIsDraft(false);
        setChangeRequests([]);
        setValidation(null);
      }
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load the roster.'));
    } finally {
      setLoading(false);
    }
  }, [effectiveDepartmentId, week.start, isEngine]);

  useEffect(() => {
    load();
  }, [load]);

  const canGenerate = isGenerator && (!period || period.status === 'rejected' || isDraft);
  const canSubmit = isGenerator && isDraft;
  const canRequestChange = isGenerator && period?.status === 'approved' && !isDraft;

  const handleGenerate = async () => {
    if (staff.length === 0) {
      setError('Add at least one staff member before generating a roster.');
      return;
    }
    setError('');

    if (isEngine) {
      try {
        const result = await rosterEngineApi.generateFloorRoster({
          department_id: isMultiDept ? effectiveDepartmentId : undefined,
          week_start: week.start,
          week_end: week.end,
          week_label: week.label,
        });
        setPeriod(result.period);
        setValidation(result.validation);
        setIsDraft(result.period.status === 'draft');
        setRoster(entriesToRoster(result.period.entries));
        // A fresh generation may have auto-seeded the catalog/rules for
        // this department the first time — reload them so
        // FloorSettingsPanel/FloorRosterTable reflect what was just created.
        const [templates, rules] = await Promise.all([
          rosterEngineApi.listShiftTemplates({ departmentId: effectiveDepartmentId }),
          rosterEngineApi.listCoverageRules(effectiveDepartmentId),
        ]);
        setShiftTemplates(templates);
        setCoverageRules(rules);
        setNotice('');
      } catch (err) {
        setError(apiErrorMessage(err, 'Could not generate the roster.'));
      }
      return;
    }

    setRoster(generateRoster(staff, rules));
    setIsDraft(true);
    setNotice('');
  };

  const handleSubmit = async () => {
    setError('');

    if (isEngine) {
      try {
        const submitted = await rosterEngineApi.submitDraftForApproval(period.id);
        setPeriod(submitted);
        setIsDraft(false);
        setNotice('Roster submitted — awaiting manager approval.');
      } catch (err) {
        setError(apiErrorMessage(err, 'Could not submit the roster.'));
      }
      return;
    }

    const entries = [];
    staff.forEach((s) => {
      DAYS.forEach((day) => {
        const cell = roster[s.id]?.[day] || makeCell('Off', 'none');
        entries.push({ roster_staff_id: s.id, day, shift: cell.shift, outlet: cell.outlet });
      });
    });
    try {
      const submitted = await rosterApi.submitRoster({
        department_id: isMultiDept ? effectiveDepartmentId : undefined,
        week_start: week.start,
        week_end: week.end,
        week_label: week.label,
        rules_snapshot: rules,
        entries,
      });
      setPeriod(submitted);
      setIsDraft(false);
      setNotice('Roster submitted — awaiting manager approval.');
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not submit the roster.'));
    }
  };

  const handleOverrideEntry = async (entryId, shiftCode) => {
    setError('');
    try {
      await rosterEngineApi.overrideEntry(period.id, entryId, shiftCode);
      const [full, freshValidation] = await Promise.all([
        rosterApi.getRosterPeriod(period.id),
        rosterEngineApi.getValidationReport(period.id),
      ]);
      setPeriod(full);
      setValidation(freshValidation);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not apply that override.'));
    }
  };

  const handleExport = async (format) => {
    if (!period) return;
    setError('');
    setExporting(format);
    try {
      // Same period.id whether this roster was just generated in this
      // session or is being reopened from a saved state — the backend
      // reloads and normalizes it fresh either way (see
      // app/services/roster_engine/service.py:export_roster).
      await rosterEngineApi.exportRoster(period.id, format);
    } catch (err) {
      setError(apiErrorMessage(err, `Could not export the ${format.toUpperCase()}.`));
    } finally {
      setExporting(null);
    }
  };

  const handleAddStaff = async (member) => {
    setError('');
    try {
      await rosterApi.createRosterStaff({
        department_id: isMultiDept ? effectiveDepartmentId : undefined,
        full_name: member.name,
        position: member.position,
      });
      const apiStaff = await rosterApi.listRosterStaff({ departmentId: effectiveDepartmentId });
      setStaff(staffFromApi(apiStaff));
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not add this staff member.'));
    }
  };

  const handleUpdateStaff = async (staffId, payload) => {
    setError('');
    try {
      await rosterApi.updateRosterStaff(staffId, payload);
      const apiStaff = await rosterApi.listRosterStaff({ departmentId: effectiveDepartmentId });
      setStaff(staffFromApi(apiStaff));
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not update this staff member.'));
      throw err; // let the row know the save didn't go through, so it stays in edit mode
    }
  };

  const handleDeleteStaff = async (staffId) => {
    setError('');
    setStaffNotice('');
    try {
      const result = await rosterApi.deleteRosterStaff(staffId);
      setStaffNotice(result.message);
      const apiStaff = await rosterApi.listRosterStaff({ departmentId: effectiveDepartmentId });
      setStaff(staffFromApi(apiStaff));
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not remove this staff member.'));
    }
  };

  const handleCellChange = (staffId, day, value) => {
    if (!isDraft) return; // protocol enforcement: no direct edits outside of a local, unsubmitted draft
    setRoster((prev) => ({ ...prev, [staffId]: { ...prev[staffId], [day]: value } }));
  };

  if (!effectiveDepartmentId && !isMultiDept) {
    return (
      <div style={{ maxWidth: 900, margin: '40px auto', padding: 20, textAlign: 'center', color: '#64748b' }}>
        Your account has no department assigned, so there's no roster to show. Contact an admin.
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px 60px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 6 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 2 }}>
            Auto Roster Generator
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Shift Roster {isMultiDept && departments.find((d) => d.id === effectiveDepartmentId) ? `— ${departments.find((d) => d.id === effectiveDepartmentId).name}` : ''}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button
                onClick={() => setWeekOffset((o) => o - 1)}
                title="Previous week"
                style={{ ...btn('#f1f5f9', '#334155'), padding: '4px 9px', fontSize: 13 }}
              >
                &#8249;
              </button>
              <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600, minWidth: 120, textAlign: 'center' }}>
                {week.label}
              </span>
              <button
                onClick={() => setWeekOffset((o) => o + 1)}
                title="Next week"
                style={{ ...btn('#f1f5f9', '#334155'), padding: '4px 9px', fontSize: 13 }}
              >
                &#8250;
              </button>
              {weekOffset !== 0 && (
                <button onClick={() => setWeekOffset(0)} style={{ ...btn('transparent', '#2563eb'), padding: '4px 8px', fontSize: 12 }}>
                  This week
                </button>
              )}
            </div>
            {period && !isDraft && <RosterStatusBadge status={period.status} />}
            {isDraft && <RosterStatusBadge status="draft" />}
          </div>
        </div>

        {isMultiDept && (
          <select
            value={departmentId ?? ''}
            onChange={(e) => setDepartmentId(e.target.value ? Number(e.target.value) : undefined)}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 13, fontWeight: 600 }}
          >
            <option value="">Select a department…</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        )}
      </div>

      {!isGenerator && (
        <div style={{ background: '#eff6ff', border: '1.5px solid #bfdbfe', color: '#1d4ed8', borderRadius: 10, padding: '10px 14px', fontSize: 13, margin: '14px 0' }}>
          View only — only supervisors and managers can generate or change a roster.
        </div>
      )}
      {error && (
        <div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', color: '#b91c1c', borderRadius: 10, padding: '10px 14px', fontSize: 13, margin: '14px 0' }}>
          {error}
        </div>
      )}
      {notice && (
        <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', color: '#15803d', borderRadius: 10, padding: '10px 14px', fontSize: 13, margin: '14px 0' }}>
          {notice}
        </div>
      )}

      {loading ? (
        <div style={{ color: '#94a3b8', fontSize: 14, padding: '30px 0' }}>Loading…</div>
      ) : !effectiveDepartmentId ? (
        <div style={{ color: '#94a3b8', fontSize: 14, padding: '30px 0' }}>Select a department to view its roster.</div>
      ) : (
        <>
          {period?.status === 'pending_approval' && isApprover && (
            <RosterApprovalPanel period={period} onDecided={(updated) => { setPeriod(updated); setRoster(entriesToRoster(updated.entries)); }} />
          )}

          {period?.status === 'rejected' && (
            <div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 14, color: '#b91c1c' }}>
              This roster was rejected{period.decided_by ? ` by ${period.decided_by.full_name}` : ''}
              {period.decision_comment ? `: "${period.decision_comment}"` : '.'} Generate a new one to resubmit.
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
            {canGenerate && <button onClick={handleGenerate} style={btn('#0f172a', '#fff')}>&#8635; Generate</button>}
            {canSubmit && <button onClick={handleSubmit} style={btn('#16a34a', '#fff')}>Submit for Approval</button>}
            {isGenerator && !isEngine && (
              <button onClick={() => setShowRules((v) => !v)} style={btn('#f1f5f9', '#334155')}>&#9881; Rules</button>
            )}
            {isGenerator && isEngine && (
              <button onClick={() => setShowFloorSettings((v) => !v)} style={btn('#f1f5f9', '#334155')}>&#9881; Shift & Coverage Rules</button>
            )}
            {isDraft && !isEngine && (
              <button onClick={() => setEditMode((v) => !v)} style={btn(editMode ? '#0f172a' : '#f1f5f9', editMode ? '#fff' : '#334155')}>
                {editMode ? 'Done Editing' : '\u2212 Edit'}
              </button>
            )}
            {canRequestChange && (
              <button onClick={() => setShowChangeModal(true)} style={btn('#f1f5f9', '#334155')}>Request Change</button>
            )}
            {period?.status === 'approved' && !isDraft && (
              <>
                <button
                  onClick={() => (isEngine ? handleExport('csv') : exportCSV(staff, roster, week.label, currentDepartmentCode))}
                  disabled={exporting === 'csv'}
                  style={btn('#16a34a', '#fff')}
                >
                  &#8595; {exporting === 'csv' ? 'Exporting…' : 'CSV'}
                </button>
                <button
                  onClick={() => (isEngine ? handleExport('pdf') : exportPDF(staff, roster, week.label, currentDepartmentCode))}
                  disabled={exporting === 'pdf'}
                  style={btn('#dc2626', '#fff')}
                >
                  &#8595; {exporting === 'pdf' ? 'Exporting…' : 'PDF'}
                </button>
              </>
            )}
          </div>

          {showRules && isGenerator && !isEngine && (
            <RulesPanel rules={rules} onChange={setRules} showOutlet={showOutlet} />
          )}

          {showFloorSettings && isGenerator && isEngine && (
            <FloorSettingsPanel
              shiftTemplates={shiftTemplates}
              coverageRules={coverageRules}
              departmentId={effectiveDepartmentId}
              onRulesChanged={setCoverageRules}
            />
          )}

          {isGenerator && canGenerate && (
            <>
              <AddStaffForm onAdd={handleAddStaff} positions={availablePositions} />
              <StaffManagementPanel
                staff={staff}
                positions={availablePositions}
                onUpdate={handleUpdateStaff}
                onDelete={handleDeleteStaff}
                message={staffNotice}
              />
            </>
          )}

          {staff.length === 0 ? (
            <div style={{ color: '#94a3b8', fontSize: 14, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 30, textAlign: 'center' }}>
              No staff on this roster yet.{isGenerator ? ' Add staff, then Generate.' : ''}
            </div>
          ) : isEngine ? (
            period ? (
              <>
                <ValidationPanel report={validation} />
                <FloorRosterTable
                  period={period}
                  staff={staff}
                  shiftTemplates={shiftTemplates}
                  coverageRules={coverageRules}
                  editable={isDraft}
                  onOverride={handleOverrideEntry}
                />
              </>
            ) : (
              <div style={{ color: '#94a3b8', fontSize: 14, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 30, textAlign: 'center' }}>
                {isGenerator ? `Click Generate to build this week\u2019s ${currentDepartmentCode === 'KITCHEN' ? 'Kitchen' : 'Floor'} roster.` : 'No roster generated for this week yet.'}
              </div>
            )
          ) : (
            <>
              <StatsBar staff={staff} roster={roster} showOutlet={showOutlet} />
              <RosterTable
                staff={staff}
                roster={roster}
                rules={rules}
                editMode={editMode && isDraft}
                showOutlet={showOutlet}
                onCellChange={handleCellChange}
                onRemove={(staffId) => {
                  if (window.confirm('Remove this staff member from the roster?')) handleDeleteStaff(staffId);
                }}
              />
            </>
          )}

          {period && period.status === 'approved' && (
            <div style={{ marginTop: 28 }}>
              <h2 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginBottom: 10 }}>Change Requests</h2>
              <ChangeRequestsList
                requests={changeRequests}
                canDecide={isApprover}
                onDecided={(updated) => {
                  setChangeRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
                  if (updated.status === 'approved') load();
                }}
              />
            </div>
          )}
        </>
      )}

      {showChangeModal && period && (
        <ChangeRequestModal
          period={period}
          entries={period.entries}
          onClose={() => setShowChangeModal(false)}
          onCreated={(created) => {
            setChangeRequests((prev) => [created, ...prev]);
            setShowChangeModal(false);
            setNotice('Change request sent to the manager for approval.');
          }}
        />
      )}
    </div>
  );
}
