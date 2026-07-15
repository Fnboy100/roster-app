import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiErrorMessage } from '../api/client';
import * as requisitionsApi from '../api/requisitions';
import {
  pageStyle,
  cardStyle,
  btn,
  inputStyle,
  errorBoxStyle,
  formatQty,
  formatDateTime,
  RequisitionStatusBadge,
} from '../components/inventory/ui';
import {
  canDecideRequisition,
  canIssueRequisition,
  canCompleteRequisition,
  canCancelRequisition,
  isDecidable,
  isIssuable,
  isCompletable,
  isCancellable,
} from '../utils/requisitionPermissions';

export default function RequisitionDetail() {
  const { requisitionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [requisition, setRequisition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false);
  const [comment, setComment] = useState('');
  const [issueLines, setIssueLines] = useState(null); // null = "issue in full"; array = partial

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await requisitionsApi.getRequisition(requisitionId);
      setRequisition(data);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load this requisition.'));
    } finally {
      setLoading(false);
    }
  }, [requisitionId]);

  useEffect(() => {
    load();
  }, [load]);

  const runAction = async (fn) => {
    setActionError('');
    setBusy(true);
    try {
      const updated = await fn();
      setRequisition(updated);
    } catch (err) {
      setActionError(apiErrorMessage(err, 'That action could not be completed.'));
    } finally {
      setBusy(false);
    }
  };

  const startPartialIssue = () => {
    setIssueLines(
      requisition.items
        .filter((line) => Number(line.quantity_issued) < Number(line.quantity_requested))
        .map((line) => ({
          requisition_item_id: line.id,
          label: line.item.name,
          max: Number(line.quantity_requested) - Number(line.quantity_issued),
          quantity: Number(line.quantity_requested) - Number(line.quantity_issued),
        }))
    );
  };

  if (loading) return <div style={pageStyle}>Loading…</div>;
  if (error) return <div style={pageStyle}><div style={errorBoxStyle}>{error}</div></div>;
  if (!requisition) return null;

  const canDecide = canDecideRequisition(user) && isDecidable(requisition);
  const canIssue = canIssueRequisition(user) && isIssuable(requisition);
  const canComplete = canCompleteRequisition(user, requisition) && isCompletable(requisition);
  const canCancel = canCancelRequisition(user, requisition) && isCancellable(requisition);

  return (
    <div style={pageStyle}>
      <button onClick={() => navigate('/inventory/requisitions')} style={{ ...btn('transparent', '#64748b'), padding: '4px 0', marginBottom: 12 }}>
        ← Back to requisitions
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>Requisition #{requisition.id}</h1>
          <div style={{ fontSize: 13, color: '#64748b' }}>
            {requisition.requested_by.full_name} ({requisition.requested_by.email}) · {formatDateTime(requisition.created_at)}
          </div>
        </div>
        <RequisitionStatusBadge status={requisition.status} />
      </div>

      {requisition.note && (
        <div style={{ ...cardStyle, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#334155' }}>
          <strong>Note:</strong> {requisition.note}
        </div>
      )}

      {actionError && <div style={errorBoxStyle}>{actionError}</div>}

      <div style={{ ...cardStyle, overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', padding: '10px 16px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9' }}>
          <span>Item</span>
          <span>Requested</span>
          <span>Issued</span>
        </div>
        {requisition.items.map((line) => (
          <div key={line.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', padding: '10px 16px', fontSize: 13, borderTop: '1px solid #f8fafc' }}>
            <span style={{ color: '#0f172a', fontWeight: 600 }}>
              {line.item.name} <span style={{ color: '#94a3b8', fontWeight: 400 }}>({line.item.unit})</span>
            </span>
            <span>{formatQty(line.quantity_requested)}</span>
            <span>{formatQty(line.quantity_issued)}</span>
          </div>
        ))}
      </div>

      {canDecide && (
        <div style={{ ...cardStyle, padding: 16, marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 10 }}>Approve or reject</h3>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Optional comment"
            rows={2}
            style={{ ...inputStyle, width: '100%', resize: 'vertical', fontFamily: 'inherit', marginBottom: 10 }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              disabled={busy}
              onClick={() => runAction(() => requisitionsApi.decideRequisition(requisition.id, { decision: 'approved', comment: comment || undefined }))}
              style={btn('#16a34a', '#fff')}
            >
              Approve
            </button>
            <button
              disabled={busy}
              onClick={() => runAction(() => requisitionsApi.decideRequisition(requisition.id, { decision: 'rejected', comment: comment || undefined }))}
              style={btn('#dc2626', '#fff')}
            >
              Reject
            </button>
          </div>
        </div>
      )}

      {canIssue && (
        <div style={{ ...cardStyle, padding: 16, marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 10 }}>Issue stock</h3>

          {issueLines === null ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <button disabled={busy} onClick={() => runAction(() => requisitionsApi.issueRequisition(requisition.id))} style={btn('#0f172a', '#fff')}>
                Issue everything in full
              </button>
              <button onClick={startPartialIssue} style={btn('#f1f5f9', '#334155')}>
                Issue partial quantities…
              </button>
            </div>
          ) : (
            <>
              {issueLines.map((line, i) => (
                <div key={line.requisition_item_id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{ flex: 1, fontSize: 13, color: '#334155' }}>{line.label}</span>
                  <input
                    type="number"
                    min="0"
                    max={line.max}
                    step="0.01"
                    value={line.quantity}
                    onChange={(e) =>
                      setIssueLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, quantity: e.target.value } : l)))
                    }
                    style={{ ...inputStyle, width: 100 }}
                  />
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>of {formatQty(line.max)}</span>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button
                  disabled={busy}
                  onClick={() =>
                    runAction(() =>
                      requisitionsApi.issueRequisition(requisition.id, {
                        lines: issueLines
                          .filter((l) => Number(l.quantity) > 0)
                          .map((l) => ({ requisition_item_id: l.requisition_item_id, quantity: Number(l.quantity) })),
                      })
                    ).then(() => setIssueLines(null))
                  }
                  style={btn('#0f172a', '#fff')}
                >
                  Confirm issue
                </button>
                <button onClick={() => setIssueLines(null)} style={btn('#f1f5f9', '#334155')}>
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        {canComplete && (
          <button disabled={busy} onClick={() => runAction(() => requisitionsApi.completeRequisition(requisition.id))} style={btn('#16a34a', '#fff')}>
            Confirm receipt
          </button>
        )}
        {canCancel && (
          <button disabled={busy} onClick={() => runAction(() => requisitionsApi.cancelRequisition(requisition.id))} style={btn('#fef2f2', '#b91c1c')}>
            Cancel requisition
          </button>
        )}
      </div>
    </div>
  );
}
