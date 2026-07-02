'use client';

import { useActionState } from 'react';
import { updateClassAction } from './actions';

const initialState = { error: null, success: false };

function toDatetimeLocalValue(isoString) {
  const date = new Date(isoString);
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function EditClassForm({ classDoc }) {
  const [state, formAction, pending] = useActionState(updateClassAction, initialState);

  return (
    <form
      action={formAction}
      className="flex w-full max-w-sm flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <input type="hidden" name="classId" value={classDoc._id} />
      <input
        type="text"
        name="title"
        defaultValue={classDoc.title}
        required
        className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
      />
      <input
        type="text"
        name="instructorName"
        defaultValue={classDoc.instructorName}
        required
        className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
      />
      <label className="text-xs text-zinc-500">
        Start time
        <input
          type="datetime-local"
          name="startTime"
          defaultValue={toDatetimeLocalValue(classDoc.startTime)}
          required
          className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
        />
      </label>
      <label className="text-xs text-zinc-500">
        End time
        <input
          type="datetime-local"
          name="endTime"
          defaultValue={toDatetimeLocalValue(classDoc.endTime)}
          required
          className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
        />
      </label>
      <input
        type="number"
        name="capacity"
        defaultValue={classDoc.capacity}
        min="1"
        required
        className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
      />
      {state.error && <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>}
      {state.success && <p className="text-sm text-green-600 dark:text-green-400">Saved.</p>}
      <button
        type="submit"
        disabled={pending || classDoc.status === 'canceled'}
        className="rounded bg-black px-3 py-2 text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-black"
      >
        {pending ? 'Saving...' : 'Save changes'}
      </button>
    </form>
  );
}
