'use client';

import { useAuth } from '@/providers/AuthProvider';
import { getUserRoleSlug } from '@/lib/roles';
import { isShiftIdle } from '@/lib/cash-register';
import { useTodayAttendance } from '@/hooks/useAttendance';
import { useCurrentShift } from '@/hooks/useCashRegister';

export type CashierWorkflowPhase =
  | 'loading'
  | 'check-in'
  | 'working'
  | 'close-shift'
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
  const hasOpenSession = isCheckedIn && !isCheckedOut;

  const isShiftOpen = !!shift && !shift.closedAt;
  const isShiftClosed = !!shift?.closedAt;
  const isIdleShift = isShiftOpen && isShiftIdle(shift);
  const hasShiftActivity = isShiftOpen && !!shift && !isShiftIdle(shift);

  const isLoading =
    isCashier &&
    ((attendanceLoading && !attendanceFetched) || (shiftLoading && !shiftFetched));

  /** No open attendance → can start a new session (opens caja on check-in) */
  const canCheckIn = isCashier && !hasOpenSession;
  const needsCheckIn = canCheckIn && !isLoading && attendanceFetched;

  /** Work only with open attendance AND open caja (opened on check-in) */
  const canWork = !isCashier ? true : hasOpenSession && isShiftOpen;

  const canCloseShift =
    isCashier && hasOpenSession && isShiftOpen && hasShiftActivity;

  /**
   * Exit: with open session. Idle caja (or already closed) can check out;
   * backend closes caja on check-out. If caja has activity, prefer cuadrar first.
   */
  const canCheckOut =
    isCashier &&
    hasOpenSession &&
    (isShiftClosed || isIdleShift || !isShiftOpen);

  const canLogout =
    !isCashier ||
    !hasOpenSession ||
    isShiftClosed ||
    isIdleShift ||
    !isShiftOpen;

  let phase: CashierWorkflowPhase = 'loading';
  if (!isCashier) {
    phase = 'done';
  } else if (isLoading) {
    phase = 'loading';
  } else if (canCheckIn) {
    phase = 'check-in';
  } else if (canWork) {
    phase = 'working';
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
    canWork,
    canCloseShift,
    canCheckOut,
    canLogout,
    phase,
  };
}
