'use client';

import { useActionState } from 'react';
import { createClassAction } from './actions';

const initialState = { error: null, success: false };

export default function NewClassForm() {
  const [state, formAction, pending] = useActionState(createClassAction, initialState);

  return (
    <form
      action={formAction}
      className="flex w-full max-w-sm flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <h2 className="text-lg font-semibold text-black dark:text-zinc-50">Schedule a class</h2>
      <input
        type="text"
        name="title"
        placeholder="Title"
        required
        className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
      />
      <input
        type="text"
        name="instructorName"
        placeholder="Instructor name"
        required
        className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
      />
      <label className="text-xs text-zinc-500">
        Start time
        <input
          type="datetime-local"
          name="startTime"
          required
          className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
        />
      </label>
      <label className="text-xs text-zinc-500">
        End time
        <input
          type="datetime-local"
          name="endTime"
          required
          className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
        />
      </label>
      <input
        type="number"
        name="capacity"
        placeholder="Capacity"
        min="1"
        required
        className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
      />
      {state.error && <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-black px-3 py-2 text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-black"
      >
        {pending ? 'Scheduling...' : 'Schedule class'}
      </button>
    </form>
  );
}
