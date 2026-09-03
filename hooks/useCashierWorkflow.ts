'use client';

import { useAuth } from '@/providers/AuthProvider';
import { getUserRoleSlug } from '@/lib/roles';
import { isShiftIdle } from '@/lib/cash-register';
import { useTodayAttendance } from '@/hooks/useAttendance';
import { useCurrentShift } from '@/hooks/useCashRegister';

/**
 * Phases of the cashier workflow (PLAYA-301 redesign):
 *
 *  loading     — data still loading
 *  check-in    — no open attendance today → show "Marcar asistencia" (header)
 *  open-shift  — attendance open, but no caja open → show "Abrir caja"
 *  working     — attendance + caja both open → normal operation
 *  check-out   — attendance open, caja closed/absent → show "Marcar salida" (header)
 *  done        — non-cashier / admin
 */
export type CashierWorkflowPhase =
  | 'loading'
  | 'check-in'
  | 'open-shift'
  | 'working'
  | 'check-out'
  | 'done';

function resolveIsCashier(
  user: ReturnType<typeof useAuth>['user'],
  isAdmin: boolean,
): boolean {
  if (!user || isAdmin) return false;
  const slug = getUserRoleSlug(user);
  if (slug === 'cashier') return true;
  if (user.roleDetail?.slug === 'cashier') return true;
  return slug !== 'admin';
}

export function useCashierWorkflow() {
  const { user, isAdmin } = useAuth();
  const isCashier = resolveIsCashier(user, isAdmin);

  const {
    data: attendance,
    isLoading: attendanceLoading,
    isFetched: attendanceFetched,
  } = useTodayAttendance(isCashier);
  const {
    data: shift,
    isLoading: shiftLoading,
    isFetched: shiftFetched,
  } = useCurrentShift(isCashier);

  const isCheckedIn = !!attendance?.checkedInAt;
  const isCheckedOut = !!attendance?.checkedOutAt;
  /** Attendance is open (checked-in, not yet checked-out). */
  const hasOpenSession = isCheckedIn && !isCheckedOut;

  const isShiftOpen = !!shift && !shift.closedAt;
  const isShiftClosed = !!shift?.closedAt;
  const isIdleShift = isShiftOpen && isShiftIdle(shift);
  const hasShiftActivity = isShiftOpen && !!shift && !isShiftIdle(shift);

  const isLoading =
    isCashier &&
    ((attendanceLoading && !attendanceFetched) || (shiftLoading && !shiftFetched));

  // ── Per-action capabilities ──────────────────────────────────────────────

  /** No open attendance → can check in (button is in AppHeader only). */
  const canCheckIn = isCashier && !hasOpenSession;
  const needsCheckIn = canCheckIn && !isLoading && attendanceFetched;

  /**
   * Has open attendance but no open caja → can open a caja (PLAYA-301/304).
   * This is also true after closing a shift (worker may open another one).
   */
  const canOpenShift = isCashier && hasOpenSession && !isShiftOpen;

  /**
   * Full operation: attendance + caja open.
   * Non-cashiers (admins) always get true.
   */
  const canWork = !isCashier ? true : hasOpenSession && isShiftOpen;

  /** Caja has activity and is open → must cuadrar before checking out. */
  const canCloseShift = isCashier && hasOpenSession && isShiftOpen && hasShiftActivity;

  /**
   * Has open attendance, caja is either absent, closed, or idle.
   * Button is in AppHeader only (PLAYA-302).
   */
  const canCheckOut =
    isCashier &&
    hasOpenSession &&
    (isShiftClosed || isIdleShift || !isShiftOpen);

  /**
   * Logout is always allowed (PLAYA-303: logout ≠ check-out).
   * If caja has activity, system warns to cuadrar first.
   */
  const canLogout = true;

  // ── Derive phase ─────────────────────────────────────────────────────────
  let phase: CashierWorkflowPhase = 'loading';
  if (!isCashier) {
    phase = 'done';
  } else if (isLoading) {
    phase = 'loading';
  } else if (canCheckIn) {
    phase = 'check-in';
  } else if (canWork) {
    phase = 'working';
  } else if (canOpenShift) {
    phase = 'open-shift';
  } else if (canCheckOut) {
    phase = 'check-out';
  }

  return {
    isCashier,
    isAdmin,
    isLoading,
    attendance,
    shift,
    isCheckedIn,
    isCheckedOut,
    hasOpenSession,
    isShiftOpen,
    isShiftClosed,
    isIdleShift,
    hasShiftActivity,
    needsCheckIn,
    canCheckIn,
    canOpenShift,
    canWork,
    canCloseShift,
    canCheckOut,
    canLogout,
    phase,
  };
}
