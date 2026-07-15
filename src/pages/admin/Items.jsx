import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useDepartmentScope } from '../../hooks/useDepartmentScope';
import { apiErrorMessage } from '../../api/client';
import { ROLES } from '../../api/roles';
import * as itemsApi from '../../api/items';
import { pageStyle, cardStyle, btn, inputStyle, labelStyle, selectStyle, errorBoxStyle, emptyStateStyle, formatQty } from '../../components/inventory/ui';

const emptyItemForm = { name: '', sku: '', unit: '', category: '' };
const emptyThresholdForm = { item_id: '', department_id: '', min_quantity: '', reorder_quantity: '' };

export default function AdminItems() {
  const { user } = useAuth();
  const { departments } = useDepartmentScope();
  const canManageItems = [ROLES.ADMIN, ROLES.STOREKEEPER].includes(user?.role?.name);
  const canManageThresholds = [ROLES.ADMIN, ROLES.MANAGER, ROLES.OUTLET_MANAGER, ROLES.STOREKEEPER].includes(user?.role?.name);

  const [items, setItems] = useState([]);
  const [thresholds, setThresholds] = useState([]);
  const [itemForm, setItemForm] = useState(emptyItemForm);
  const [thresholdForm, setThresholdForm] = useState(emptyThresholdForm);
  const [itemError, setItemError] = useState('');
  const [thresholdError, setThresholdError] = useState('');
  const [error, setError] = useState('');
  const [submittingItem, setSubmittingItem] = useState(false);
  const [submittingThreshold, setSubmittingThreshold] = useState(false);

  const load = useCallback(async () => {
    try {
      const [i, t] = await Promise.all([itemsApi.listItems({ isActive: true }), itemsApi.listThresholds()]);
      setItems(i);
      setThresholds(t);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load items.'));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreateItem = async (e) => {
    e.preventDefault();
    setItemError('');
    setSubmittingItem(true);
    try {
      await itemsApi.createItem({ ...itemForm, category: itemForm.category || undefined });
      setItemForm(emptyItemForm);
      load();
    } catch (err) {
      setItemError(apiErrorMessage(err, 'Could not create the item.'));
    } finally {
      setSubmittingItem(false);
    }
  };

  const handleSetThreshold = async (e) => {
    e.preventDefault();
    setThresholdError('');
    if (Number(thresholdForm.reorder_quantity) < Number(thresholdForm.min_quantity)) {
      setThresholdError('Reorder quantity must be at least the minimum quantity.');
      return;
    }
    setSubmittingThreshold(true);
    try {
      await itemsApi.upsertThreshold({
        item_id: Number(thresholdForm.item_id),
        department_id: Number(thresholdForm.department_id),
        min_quantity: Number(thresholdForm.min_quantity),
        reorder_quantity: Number(thresholdForm.reorder_quantity),
      });
      setThresholdForm(emptyThresholdForm);
      load();
    } catch (err) {
      setThresholdError(apiErrorMessage(err, 'Could not save this threshold.'));
    } finally {
      setSubmittingThreshold(false);
    }
  };

  const itemName = (id) => items.find((i) => i.id === id)?.name || `Item ${id}`;
  const departmentName = (id) => departments.find((d) => d.id === id)?.name || `Department ${id}`;

  return (
    <div style={pageStyle}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 2 }}>Admin</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a' }}>Items & thresholds</h1>
      </div>

      {error && <div style={errorBoxStyle}>{error}</div>}

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 28 }}>
        {canManageItems && (
          <form onSubmit={handleCreateItem} style={{ ...cardStyle, padding: 18, flex: '1 1 320px' }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>New item</h3>
            {itemError && <div style={errorBoxStyle}>{itemError}</div>}
            <div style={{ marginBottom: 10 }}>
              <label style={labelStyle}>Name</label>
              <input value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} style={{ ...inputStyle, width: '100%' }} required />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={labelStyle}>SKU</label>
              <input value={itemForm.sku} onChange={(e) => setItemForm({ ...itemForm, sku: e.target.value })} style={{ ...inputStyle, width: '100%' }} required />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={labelStyle}>Unit</label>
              <input value={itemForm.unit} onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })} placeholder="bottle, kg, litre…" style={{ ...inputStyle, width: '100%' }} required />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Category (optional)</label>
              <input value={itemForm.category} onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })} style={{ ...inputStyle, width: '100%' }} />
            </div>
            <button type="submit" disabled={submittingItem} style={btn(submittingItem ? '#94a3b8' : '#0f172a', '#fff')}>
              {submittingItem ? 'Creating…' : 'Create item'}
            </button>
          </form>
        )}

        {canManageThresholds && (
          <form onSubmit={handleSetThreshold} style={{ ...cardStyle, padding: 18, flex: '1 1 320px' }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>Set threshold</h3>
            {thresholdError && <div style={errorBoxStyle}>{thresholdError}</div>}
            <div style={{ marginBottom: 10 }}>
              <label style={labelStyle}>Item</label>
              <select value={thresholdForm.item_id} onChange={(e) => setThresholdForm({ ...thresholdForm, item_id: e.target.value })} style={{ ...selectStyle, width: '100%' }} required>
                <option value="">Select an item…</option>
                {items.map((it) => (
                  <option key={it.id} value={it.id}>
                    {it.name}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={labelStyle}>Department</label>
              <select value={thresholdForm.department_id} onChange={(e) => setThresholdForm({ ...thresholdForm, department_id: e.target.value })} style={{ ...selectStyle, width: '100%' }} required>
                <option value="">Select a department…</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Min quantity</label>
                <input type="number" min="0" step="0.01" value={thresholdForm.min_quantity} onChange={(e) => setThresholdForm({ ...thresholdForm, min_quantity: e.target.value })} style={{ ...inputStyle, width: '100%' }} required />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Reorder quantity</label>
                <input type="number" min="0" step="0.01" value={thresholdForm.reorder_quantity} onChange={(e) => setThresholdForm({ ...thresholdForm, reorder_quantity: e.target.value })} style={{ ...inputStyle, width: '100%' }} required />
              </div>
            </div>
            <button type="submit" disabled={submittingThreshold} style={btn(submittingThreshold ? '#94a3b8' : '#0f172a', '#fff')}>
              {submittingThreshold ? 'Saving…' : 'Save threshold'}
            </button>
          </form>
        )}
      </div>

      <h2 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginBottom: 10 }}>Item catalog</h2>
      {items.length === 0 ? (
        <div style={{ ...emptyStateStyle, marginBottom: 28 }}>No items yet.</div>
      ) : (
        <div style={{ ...cardStyle, overflow: 'hidden', marginBottom: 28 }}>
          {items.map((it, i) => (
            <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', borderTop: i === 0 ? 'none' : '1px solid #f8fafc', fontSize: 13 }}>
              <span style={{ fontWeight: 700, color: '#0f172a' }}>
                {it.name} <span style={{ color: '#94a3b8', fontWeight: 400 }}>({it.sku})</span>
              </span>
              <span style={{ color: '#64748b' }}>
                {it.unit} · {it.category}
              </span>
            </div>
          ))}
        </div>
      )}

      <h2 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginBottom: 10 }}>Configured thresholds</h2>
      {thresholds.length === 0 ? (
        <div style={emptyStateStyle}>No thresholds configured yet.</div>
      ) : (
        <div style={{ ...cardStyle, overflow: 'hidden' }}>
          {thresholds.map((t, i) => (
            <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', borderTop: i === 0 ? 'none' : '1px solid #f8fafc', fontSize: 13 }}>
              <span style={{ fontWeight: 700, color: '#0f172a' }}>
                {itemName(t.item_id)} <span style={{ color: '#94a3b8', fontWeight: 400 }}>· {departmentName(t.department_id)}</span>
              </span>
              <span style={{ color: '#64748b' }}>
                min {formatQty(t.min_quantity)} · reorder {formatQty(t.reorder_quantity)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
