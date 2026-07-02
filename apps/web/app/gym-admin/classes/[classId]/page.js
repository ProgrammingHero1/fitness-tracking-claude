import { notFound } from 'next/navigation';
import Link from 'next/link';
import { serverApiFetch } from '@/lib/serverFetch';
import EditClassForm from './EditClassForm';
import { cancelClassAction } from './actions';

export default async function ClassDetailPage({ params }) {
  const { classId } = await params;

  let classDoc;
  try {
    ({ class: classDoc } = await serverApiFetch(`/api/gym-admin/classes/${classId}`));
  } catch (err) {
    if (err.status === 404 || err.status === 400) {
      notFound();
    }
    throw err;
  }

  return (
    <main className="flex flex-1 flex-col gap-4 bg-zinc-50 p-16 dark:bg-black">
      <Link className="text-sm text-blue-600 hover:underline dark:text-blue-400" href="/gym-admin/classes">
        ← Back to classes
      </Link>
      <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">{classDoc.title}</h1>
      <p className="text-sm text-zinc-500">Status: {classDoc.status}</p>

      <EditClassForm classDoc={classDoc} />

      {classDoc.status !== 'canceled' && (
        <form action={cancelClassAction} className="max-w-sm">
          <input type="hidden" name="classId" value={classDoc._id} />
          <button
            type="submit"
            className="rounded border border-red-600 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-400 dark:text-red-400 dark:hover:bg-red-950"
          >
            Cancel class
          </button>
        </form>
      )}
    </main>
  );
}
