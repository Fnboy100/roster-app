import { useEffect, useState } from 'react';
import Modal from './Modal';
import { btn, errorBoxStyle, inputStyle, labelStyle, selectStyle } from './ui';
import { useAuth } from '../../context/AuthContext';
import { MULTI_DEPARTMENT_ROLES } from '../../api/roles';
import { apiErrorMessage } from '../../api/client';
import * as itemsApi from '../../api/items';
import * as requisitionsApi from '../../api/requisitions';

export default function RequisitionFormModal({ departments, onClose, onCreated }) {
  const { user } = useAuth();
  const showDeptPicker = MULTI_DEPARTMENT_ROLES.includes(user?.role?.name);

  const [items, setItems] = useState([]);
  const [departmentId, setDepartmentId] = useState('');
  const [note, setNote] = useState('');
  const [lines, setLines] = useState([{ item_id: '', quantity_requested: '' }]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    itemsApi.listItems({ isActive: true }).then(setItems).catch(() => {});
  }, []);

  const updateLine = (index, patch) => {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  };

  const addLine = () => setLines((prev) => [...prev, { item_id: '', quantity_requested: '' }]);
  const removeLine = (index) => setLines((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanLines = lines
      .filter((l) => l.item_id && l.quantity_requested)
      .map((l) => ({ item_id: Number(l.item_id), quantity_requested: Number(l.quantity_requested) }));

    if (cleanLines.length === 0) {
      setError('Add at least one item with a quantity.');
      return;
    }
    if (showDeptPicker && !departmentId) {
      setError('Select a department for this requisition.');
      return;
    }

    setSubmitting(true);
    try {
      const created = await requisitionsApi.createRequisition({
        department_id: showDeptPicker ? Number(departmentId) : undefined,
        note: note || undefined,
        items: cleanLines,
      });
      onCreated(created);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not create the requisition.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title="New requisition" onClose={onClose} width={560}>
      <form onSubmit={handleSubmit}>
        {error && <div style={errorBoxStyle}>{error}</div>}

        {showDeptPicker && (
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Department</label>
            <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} style={{ ...selectStyle, width: '100%' }} required>
              <option value="">Select a department…</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <label style={labelStyle}>Items</label>
        {lines.map((line, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <select
              value={line.item_id}
              onChange={(e) => updateLine(i, { item_id: e.target.value })}
              style={{ ...selectStyle, flex: 2 }}
              required
            >
              <option value="">Select item…</option>
              {items.map((it) => (
                <option key={it.id} value={it.id}>
                  {it.name} ({it.unit})
                </option>
              ))}
            </select>
            <input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="Qty"
              value={line.quantity_requested}
              onChange={(e) => updateLine(i, { quantity_requested: e.target.value })}
              style={{ ...inputStyle, flex: 1 }}
              required
            />
            {lines.length > 1 && (
              <button type="button" onClick={() => removeLine(i)} style={btn('#fef2f2', '#b91c1c')}>
                ×
              </button>
            )}
          </div>
        ))}
        <button type="button" onClick={addLine} style={{ ...btn('#f1f5f9', '#334155'), marginBottom: 16 }}>
          + Add item
        </button>

        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>Note (optional)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            style={{ ...inputStyle, width: '100%', resize: 'vertical', fontFamily: 'inherit' }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" onClick={onClose} style={btn('#f1f5f9', '#334155')}>
            Cancel
          </button>
          <button type="submit" disabled={submitting} style={btn(submitting ? '#94a3b8' : '#0f172a', '#fff')}>
            {submitting ? 'Creating…' : 'Create requisition'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
