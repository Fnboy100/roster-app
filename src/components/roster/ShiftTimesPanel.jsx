import { useRef, useState } from 'react';
import * as shiftTimesApi from '../../api/shiftTimes';
import { apiErrorMessage } from '../../api/client';
import { SHIFT_STYLES, shiftLegendForDepartment } from '../../data/constants';
import {
  formatRange, formToPayload, formsEqual, isOvernight, timesToForm, validateShiftTimesForm,
} from '../../utils/shiftTimes';

const card = { background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: 14, marginBottom: 16 };
const inputBase = { padding: '6px 9px', borderRadius: 7, border: '1.5px solid #cbd5e1', fontSize: 13, color: '#0f172a', minWidth: 110 };
const btnBase = { border: 'none', borderRadius: 8, padding: '7px 14px', fontWeight: 700, fontSize: 12, cursor: 'pointer' };

function TimeField({ id, label, value, onChange, error, disabled }) {
  const errId = `${id}-error`;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <label htmlFor={id} style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>{label}</label>
      <input
        id={id}
        type="time"
        step={60}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? errId : undefined}
        style={{ ...inputBase, borderColor: error ? '#f87171' : '#cbd5e1', opacity: disabled ? 0.5 : 1 }}
      />
      {error && <span id={errId} style={{ fontSize: 11, color: '#b91c1c', maxWidth: 190 }}>{error}</span>}
    </div>
  );
}

/**
 * The department's AM / PM clock times — shown to everyone as the rota's
 * legend, editable by managers/admins (`canEdit`). Times come from the
 * backend (GET /roster/shift-times) and are saved with PUT, so they
 * persist across refreshes and restarts and are what the exports and shift
 * reports use.
 *
 * Props:
 *  departmentCode / departmentId
 *  shiftTimes   – the API response, or null while loading / if it couldn't be loaded
 *  status       – 'loading' | 'ready' | 'error'
 *  canEdit      – boolean
 *  onSaved      – (updatedShiftTimes) => void
 */
export default function ShiftTimesPanel({ departmentCode, departmentId, shiftTimes, status, canEdit, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(() => timesToForm(shiftTimes));
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState('');
  const submitting = useRef(false); // blocks double-submits even before React re-renders the disabled button

  const legend = shiftLegendForDepartment(departmentCode, shiftTimes);
  const original = timesToForm(shiftTimes);
  const errors = validateShiftTimesForm(form);
  const invalid = Object.keys(errors).length > 0;
  const dirty = !formsEqual(form, original);
  const editable = canEdit && status === 'ready';

  const startEdit = () => {
    setForm(timesToForm(shiftTimes));
    setServerError('');
    setSuccess('');
    setEditing(true);
  };
  const cancel = () => {
    setEditing(false);
    setServerError('');
  };
  const set = (field) => (value) => {
    setSuccess('');
    setServerError('');
    setForm((f) => ({ ...f, [field]: value }));
  };

  const save = async () => {
    if (submitting.current || invalid || !dirty) return;
    submitting.current = true;
    setSaving(true);
    setServerError('');
    setSuccess('');
    try {
      const updated = await shiftTimesApi.saveShiftTimes(departmentId, formToPayload(form));
      onSaved(updated);
      setEditing(false);
      setSuccess('Shift times saved.');
    } catch (err) {
      setServerError(apiErrorMessage(err, 'Could not save the shift times.'));
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  };

  const chip = (shift, text) => (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700,
        background: SHIFT_STYLES[shift].bg, color: SHIFT_STYLES[shift].text, border: `1.5px solid ${SHIFT_STYLES[shift].border}`,
      }}
    >
      {text}
    </span>
  );

  return (
    <section aria-labelledby="shift-times-heading" style={card}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <h2 id="shift-times-heading" style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', margin: 0 }}>Shift times</h2>

        {status === 'loading' && <span style={{ fontSize: 12, color: '#94a3b8' }} role="status">Loading shift times…</span>}

        {status !== 'loading' && !editing && (
          <>
            {chip('AM', legend.am)}
            {chip('PM', legend.pm)}
            {status === 'ready' && shiftTimes?.is_default && (
              <span style={{ fontSize: 11, color: '#94a3b8' }}>default</span>
            )}
            {status === 'ready' && shiftTimes && isOvernight(shiftTimes.pm.start_time, shiftTimes.pm.end_time) && (
              <span style={{ fontSize: 11, color: '#64748b' }}>PM ends after midnight / at close</span>
            )}
            {editable && (
              <button type="button" onClick={startEdit} style={{ ...btnBase, background: '#f1f5f9', color: '#334155', marginLeft: 'auto' }}>
                Edit times
              </button>
            )}
          </>
        )}
      </div>

      {status === 'error' && (
        <div role="alert" style={{ marginTop: 8, fontSize: 12, color: '#92400e', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '6px 10px' }}>
          Couldn&rsquo;t load the saved shift times, so the standard times are shown. Reload the page to try again.
        </div>
      )}

      {success && !editing && (
        <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 12, color: '#15803d', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '6px 10px' }}>
          {success}
        </div>
      )}

      {editing && (
        <form
          onSubmit={(e) => { e.preventDefault(); save(); }}
          noValidate
          style={{ marginTop: 12, display: 'grid', gap: 14 }}
        >
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <fieldset style={{ border: 'none', margin: 0, padding: 0, display: 'flex', gap: 12, flexWrap: 'wrap' }} disabled={saving}>
              <legend style={{ fontSize: 12, fontWeight: 800, color: SHIFT_STYLES.AM.text, padding: 0, marginBottom: 6 }}>AM shift</legend>
              <TimeField id="shift-am-start" label="AM start" value={form.amStart} onChange={set('amStart')} error={errors.amStart} />
              <TimeField id="shift-am-end" label="AM end" value={form.amEnd} onChange={set('amEnd')} error={errors.amEnd} />
            </fieldset>

            <fieldset style={{ border: 'none', margin: 0, padding: 0, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }} disabled={saving}>
              <legend style={{ fontSize: 12, fontWeight: 800, color: SHIFT_STYLES.PM.text, padding: 0, marginBottom: 6 }}>PM shift</legend>
              <TimeField id="shift-pm-start" label="PM start" value={form.pmStart} onChange={set('pmStart')} error={errors.pmStart} />
              <TimeField id="shift-pm-end" label="PM end" value={form.pmEnd} onChange={set('pmEnd')} error={errors.pmEnd} disabled={form.pmUntilClose} />
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#334155', fontWeight: 600, marginTop: 22 }}>
                <input type="checkbox" checked={form.pmUntilClose} onChange={(e) => set('pmUntilClose')(e.target.checked)} />
                Runs until close
              </label>
            </fieldset>
          </div>

          <div style={{ fontSize: 12, color: '#64748b' }}>
            A PM end earlier than its start (e.g. 16:00 &rarr; 00:00) means the shift finishes the next day.
            {!invalid && dirty && (
              <> New legend: <strong>AM {formatRange(form.amStart, form.amEnd)}</strong>, <strong>PM {formatRange(form.pmStart, form.pmUntilClose ? null : form.pmEnd)}</strong>.</>
            )}
          </div>

          {serverError && (
            <div role="alert" style={{ fontSize: 12, color: '#b91c1c', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '6px 10px' }}>
              {serverError}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="submit"
              disabled={saving || invalid || !dirty}
              aria-busy={saving}
              style={{ ...btnBase, background: saving || invalid || !dirty ? '#e2e8f0' : '#0f172a', color: saving || invalid || !dirty ? '#94a3b8' : '#fff', cursor: saving || invalid || !dirty ? 'default' : 'pointer' }}
            >
              {saving ? 'Saving…' : 'Save times'}
            </button>
            <button type="button" onClick={cancel} disabled={saving} style={{ ...btnBase, background: 'transparent', color: '#64748b' }}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
