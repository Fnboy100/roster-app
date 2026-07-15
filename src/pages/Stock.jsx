import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDepartmentScope } from '../hooks/useDepartmentScope';
import { apiErrorMessage } from '../api/client';
import { ROLES } from '../api/roles';
import * as itemsApi from '../api/items';
import * as stockApi from '../api/stock';
import { pageStyle, cardStyle, btn, inputStyle, labelStyle, selectStyle, errorBoxStyle } from '../components/inventory/ui';

const TABS = [
  { key: 'wastage', label: 'Wastage', roles: null }, // null = any authenticated user, backend scopes to their own dept
  { key: 'return', label: 'Return to store', roles: null },
  { key: 'restock', label: 'Restock', roles: [ROLES.ADMIN, ROLES.STOREKEEPER] },
  { key: 'adjustment', label: 'Adjustment', roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.OUTLET_MANAGER, ROLES.STOREKEEPER] },
];

function StockForm({ action, items, departments, isMultiDept, fixedDepartmentId, onSuccess }) {
  const [itemId, setItemId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isAdjustment = action === 'adjustment';
  const reasonRequired = action !== 'restock';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const deptId = isMultiDept ? Number(departmentId) : fixedDepartmentId;
    if (!deptId) {
      setError('Select a department.');
      return;
    }
    if (!itemId || !quantity) {
      setError('Select an item and enter a quantity.');
      return;
    }
    if (reasonRequired && !reason.trim()) {
      setError('A reason is required.');
      return;
    }

    const payload = {
      item_id: Number(itemId),
      department_id: deptId,
      ...(isAdjustment ? { quantity_delta: Number(quantity) } : { quantity: Number(quantity) }),
      ...(reason ? { reason } : {}),
    };

    setSubmitting(true);
    try {
      const fn = { restock: stockApi.restock, wastage: stockApi.recordWastage, return: stockApi.recordReturn, adjustment: stockApi.recordAdjustment }[action];
      await fn(payload);
      setSuccess('Recorded.');
      setItemId('');
      setQuantity('');
      setReason('');
      onSuccess?.();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not record this movement.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ ...cardStyle, padding: 18, maxWidth: 480 }}>
      {error && <div style={errorBoxStyle}>{error}</div>}
      {success && <div style={{ ...errorBoxStyle, background: '#f0fdf4', border: '1.5px solid #bbf7d0', color: '#15803d' }}>{success}</div>}

      {isMultiDept && (
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Department</label>
          <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} style={{ ...selectStyle, width: '100%' }}>
            <option value="">Select a department…</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Item</label>
        <select value={itemId} onChange={(e) => setItemId(e.target.value)} style={{ ...selectStyle, width: '100%' }}>
          <option value="">Select an item…</option>
          {items.map((it) => (
            <option key={it.id} value={it.id}>
              {it.name} ({it.unit})
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>{isAdjustment ? 'Adjustment (+/-)' : 'Quantity'}</label>
        <input
          type="number"
          step="0.01"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          style={{ ...inputStyle, width: '100%' }}
          placeholder={isAdjustment ? 'e.g. -2 or 5' : '0.00'}
        />
        {isAdjustment && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Positive corrects the count up, negative corrects it down.</div>}
      </div>

      <div style={{ marginBottom: 18 }}>
        <label style={labelStyle}>Reason{reasonRequired ? '' : ' (optional)'}</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          style={{ ...inputStyle, width: '100%', resize: 'vertical', fontFamily: 'inherit' }}
        />
      </div>

      <button type="submit" disabled={submitting} style={btn(submitting ? '#94a3b8' : '#0f172a', '#fff')}>
        {submitting ? 'Saving…' : 'Record'}
      </button>
    </form>
  );
}

export default function Stock() {
  const { user } = useAuth();
  const { isMultiDept, departments } = useDepartmentScope();
  const [items, setItems] = useState([]);
  const [activeTab, setActiveTab] = useState('wastage');

  useEffect(() => {
    itemsApi.listItems({ isActive: true }).then(setItems).catch(() => {});
  }, []);

  const availableTabs = TABS.filter((t) => !t.roles || t.roles.includes(user?.role?.name));

  return (
    <div style={pageStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 2 }}>
            Inventory
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a' }}>Stock</h1>
        </div>
        <Link to="/inventory/movements" style={{ fontSize: 13, fontWeight: 700, color: '#2563eb', textDecoration: 'none' }}>
          View movement history →
        </Link>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap' }}>
        {availableTabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            style={btn(activeTab === t.key ? '#0f172a' : '#f1f5f9', activeTab === t.key ? '#fff' : '#334155')}
          >
            {t.label}
          </button>
        ))}
      </div>

      <StockForm
        key={activeTab}
        action={activeTab}
        items={items}
        departments={departments}
        isMultiDept={isMultiDept}
        fixedDepartmentId={user?.department?.id}
      />
    </div>
  );
}
