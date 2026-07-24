import { redirect } from 'next/navigation';

/**
 * Unknown routes → valid app root.
 * Middleware then sends `/` to `/login` or `/sistema` based on auth.
 */
export default function NotFound() {
  redirect('/');
}
