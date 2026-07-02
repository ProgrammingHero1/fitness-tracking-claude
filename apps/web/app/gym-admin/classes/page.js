import Link from 'next/link';
import { serverApiFetch } from '@/lib/serverFetch';
import { cancelClassAction } from './actions';
import NewClassForm from './NewClassForm';

export default async function ClassesPage() {
  const { classes } = await serverApiFetch('/api/gym-admin/classes?includeCanceled=true');

  return (
    <main className="flex flex-1 flex-col gap-8 bg-zinc-50 p-16 dark:bg-black">
      <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">Classes</h1>

      <div className="flex flex-wrap gap-8">
        <NewClassForm />

        <div className="flex flex-1 flex-col gap-2">
          {classes.length === 0 ? (
            <p className="text-sm text-zinc-500">No classes scheduled yet.</p>
          ) : (
            <table className="w-full max-w-2xl rounded border border-zinc-200 bg-white text-sm dark:border-zinc-800 dark:bg-zinc-900">
              <thead>
                <tr className="border-b border-zinc-200 text-left dark:border-zinc-800">
                  <th className="px-4 py-2 font-medium text-zinc-500">Title</th>
                  <th className="px-4 py-2 font-medium text-zinc-500">Instructor</th>
                  <th className="px-4 py-2 font-medium text-zinc-500">Start</th>
                  <th className="px-4 py-2 font-medium text-zinc-500">Capacity</th>
                  <th className="px-4 py-2 font-medium text-zinc-500">Status</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {classes.map((classDoc) => (
                  <tr key={classDoc._id} className="border-b border-zinc-100 last:border-0 dark:border-zinc-800">
                    <td className="px-4 py-2 text-black dark:text-zinc-50">
                      <Link
                        href={`/gym-admin/classes/${classDoc._id}`}
                        className="text-blue-600 hover:underline dark:text-blue-400"
                      >
                        {classDoc.title}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-black dark:text-zinc-50">{classDoc.instructorName}</td>
                    <td className="px-4 py-2 text-black dark:text-zinc-50">
                      {new Date(classDoc.startTime).toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-black dark:text-zinc-50">{classDoc.capacity}</td>
                    <td className="px-4 py-2">
                      <span
                        className={
                          classDoc.status === 'canceled'
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-green-600 dark:text-green-400'
                        }
                      >
                        {classDoc.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      {classDoc.status !== 'canceled' && (
                        <form action={cancelClassAction}>
                          <input type="hidden" name="classId" value={classDoc._id} />
                          <button type="submit" className="text-red-600 hover:underline dark:text-red-400">
                            Cancel
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  );
}
