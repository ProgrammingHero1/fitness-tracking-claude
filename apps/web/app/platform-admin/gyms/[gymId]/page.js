import { notFound } from 'next/navigation';
import Link from 'next/link';
import { serverApiFetch } from '@/lib/serverFetch';
import { updateGymStatusAction } from './actions';

export default async function GymDetailPage({ params }) {
  const { gymId } = await params;

  let gym;
  try {
    ({ gym } = await serverApiFetch(`/api/platform-admin/gyms/${gymId}`));
  } catch (err) {
    if (err.status === 404 || err.status === 400) {
      notFound();
    }
    throw err;
  }

  const nextStatus = gym.status === 'active' ? 'suspended' : 'active';

  return (
    <main className="flex flex-1 flex-col gap-4 bg-zinc-50 p-16 dark:bg-black">
      <Link className="text-sm text-blue-600 hover:underline dark:text-blue-400" href="/platform-admin">
        ← Back to gyms
      </Link>
      <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">{gym.name}</h1>
      <dl className="grid max-w-md grid-cols-2 gap-x-4 gap-y-2 rounded border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900">
        <dt className="text-zinc-500">Slug</dt>
        <dd className="text-black dark:text-zinc-50">{gym.slug}</dd>
        <dt className="text-zinc-500">Status</dt>
        <dd className="text-black dark:text-zinc-50">{gym.status}</dd>
        <dt className="text-zinc-500">Subscription</dt>
        <dd className="text-black dark:text-zinc-50">{gym.subscription?.status ?? '—'}</dd>
        <dt className="text-zinc-500">Invite code</dt>
        <dd className="text-black dark:text-zinc-50">{gym.inviteCode}</dd>
      </dl>
      <form action={updateGymStatusAction}>
        <input type="hidden" name="gymId" value={gymId} />
        <input type="hidden" name="status" value={nextStatus} />
        <button
          type="submit"
          className="rounded bg-black px-4 py-2 text-sm font-medium text-white dark:bg-zinc-50 dark:text-black"
        >
          {nextStatus === 'suspended' ? 'Suspend gym' : 'Reactivate gym'}
        </button>
      </form>
    </main>
  );
}
