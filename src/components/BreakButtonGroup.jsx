import { btn } from './inventory/ui';

const bigBtn = (bg, color) => ({
  ...btn(bg, color),
  padding: '22px 12px',
  fontSize: 17,
  borderRadius: 14,
  width: '100%',
  minHeight: 72,
});

/**
 * Renders exactly the actions valid for the staff member's current status —
 * hard to misuse by construction, rather than by disabling buttons the
 * person could still tap. `onAction` is called with one of:
 * 'clock_in' | 'clock_out' | 'break_start' | 'break_end' | 'post_check_in' | 'post_check_out'.
 */
export default function BreakButtonGroup({ status, onAction, busy, showPostCheck = false }) {
  if (status === 'off_duty') {
    return (
      <button style={bigBtn('#16a34a', '#fff')} disabled={busy} onClick={() => onAction('clock_in')}>
        Clock In
      </button>
    );
  }

  if (status === 'on_shift_on_break') {
    return (
      <button style={bigBtn('#d97706', '#fff')} disabled={busy} onClick={() => onAction('break_end')}>
        End Break
      </button>
    );
  }

  // on_shift_at_post / unknown — treat as on shift so staff can always get back to a clean state.
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <button style={bigBtn('#d97706', '#f8fafc')} disabled={busy} onClick={() => onAction('break_start')}>
        Start Break
      </button>
      {showPostCheck && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button style={{ ...bigBtn('#eff6ff', '#1d4ed8'), minHeight: 56, fontSize: 14 }} disabled={busy} onClick={() => onAction('post_check_in')}>
            Check In at Post
          </button>
          <button style={{ ...bigBtn('#eff6ff', '#1d4ed8'), minHeight: 56, fontSize: 14 }} disabled={busy} onClick={() => onAction('post_check_out')}>
            Check Out from Post
          </button>
        </div>
      )}
      <button style={bigBtn('#b91c1c', '#fff')} disabled={busy} onClick={() => onAction('clock_out')}>
        Clock Out
      </button>
    </div>
  );
}
