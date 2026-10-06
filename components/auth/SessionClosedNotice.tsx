'use client';

import { useSearchParams } from 'next/navigation';
import { SESSION_CLOSED_REASON } from '@/lib/auth';

/** Shown on /login when the server rejected the session (admin revoke or expiry). */
export function SessionClosedNotice() {
  const searchParams = useSearchParams();
  if (searchParams.get('reason') !== SESSION_CLOSED_REASON) return null;

  return (
    <div
      className="mb-5 rounded-[10px] bg-amber-50 px-3.5 py-3 text-sm font-medium text-amber-800"
      role="status"
    >
      Tu sesión fue cerrada (por un administrador o porque expiró). Inicia sesión nuevamente.
    </div>
  );
}
