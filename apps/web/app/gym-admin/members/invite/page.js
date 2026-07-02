'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { inviteMemberAction } from './actions';

const initialState = { error: null, invited: null };

export default function InviteMemberPage() {
  const [state, formAction, pending] = useActionState(inviteMemberAction, initialState);

  return (
    <main className="flex flex-1 flex-col gap-4 bg-zinc-50 p-16 dark:bg-black">
      <Link className="text-sm text-blue-600 hover:underline dark:text-blue-400" href="/gym-admin/members">
        ← Back to members
      </Link>
      <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">Invite member</h1>

      {state.invited ? (
        <div className="flex max-w-sm flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-black dark:text-zinc-50">
            {state.invited.name} ({state.invited.email}) has been invited. Share this one-time temporary password with
            them — it will not be shown again:
          </p>
          <p className="rounded border border-zinc-300 bg-zinc-50 px-3 py-2 font-mono text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50">
            {state.invited.tempPassword}
          </p>
          <Link href="/gym-admin/members" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
            Done, back to roster
          </Link>
        </div>
      ) : (
        <form
          action={formAction}
          className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <input
            type="text"
            name="name"
            placeholder="Full name"
            required
            className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            required
            className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          />
          <input
            type="text"
            name="planName"
            placeholder="Plan (e.g. basic)"
            required
            className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          />
          {state.error && <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>}
          <button
            type="submit"
            disabled={pending}
            className="rounded bg-black px-3 py-2 text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-black"
          >
            {pending ? 'Inviting...' : 'Invite member'}
          </button>
        </form>
      )}
    </main>
  );
}
