'use client';

import { useAuth } from '@/providers/AuthProvider';
import { getUserRoleSlug } from '@/lib/roles';
import { useTodayAttendance } from '@/hooks/useAttendance';
import { useCurrentShift } from '@/hooks/useCashRegister';

export type CashierWorkflowPhase =
  | 'loading'
  | 'check-in'
  | 'working'
  | 'close-shift'
  | 'check-out'
  | 'done';

export function useCashierWorkflow() {
  const { user, isAdmin } = useAuth();
  const isCashier = !!user && !isAdmin && getUserRoleSlug(user) === 'cashier';

  const { data: attendance, isLoading: attendanceLoading } =
    useTodayAttendance(isCashier);
  const { data: shift, isLoading: shiftLoading } = useCurrentShift(isCashier);

  const isCheckedIn = !!attendance?.checkedInAt;
  const isCheckedOut = !!attendance?.checkedOutAt;
  const isShiftOpen = !!shift && !shift.closedAt;
  const isShiftClosed = !!shift?.closedAt;

  const isLoading = isCashier && (attendanceLoading || shiftLoading);

  const needsCheckIn = isCashier && !attendanceLoading && !isCheckedIn;
  const canCheckIn = needsCheckIn;
  const canWork = isCashier && isCheckedIn && !isCheckedOut && isShiftOpen;
  const canCloseShift = isCashier && isCheckedIn && !isCheckedOut && isShiftOpen;
  const canCheckOut = isCashier && isCheckedIn && !isCheckedOut && isShiftClosed;
  const canLogout =
    !isCashier || (isShiftClosed && (!isCheckedIn || isCheckedOut));

  let phase: CashierWorkflowPhase = 'loading';
  if (!isCashier) {
    phase = 'done';
  } else if (isLoading) {
    phase = 'loading';
  } else if (needsCheckIn) {
    phase = 'check-in';
  } else if (canWork) {
    phase = 'working';
  } else if (canCloseShift) {
    phase = 'close-shift';
  } else if (canCheckOut) {
    phase = 'check-out';
  } else if (isCheckedOut) {
    phase = 'done';
  }

  return {
    isCashier,
    isLoading,
    attendance,
    shift,
    isCheckedIn,
    isCheckedOut,
    isShiftOpen,
    isShiftClosed,
    needsCheckIn,
    canCheckIn,
    canWork,
    canCloseShift,
    canCheckOut,
    canLogout,
    phase,
  };
}
