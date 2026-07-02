import Link from 'next/link';
import { serverApiFetch } from '@/lib/serverFetch';

export default async function PlatformAdminHome() {
  const { gyms } = await serverApiFetch('/api/platform-admin/gyms');

  return (
    <main className="flex flex-1 flex-col gap-4 bg-zinc-50 p-16 dark:bg-black">
      <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">Gyms</h1>
      <div className="overflow-hidden rounded border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-100 dark:bg-zinc-900">
            <tr>
              <th className="px-4 py-2 font-medium text-zinc-600 dark:text-zinc-400">Name</th>
              <th className="px-4 py-2 font-medium text-zinc-600 dark:text-zinc-400">Status</th>
              <th className="px-4 py-2 font-medium text-zinc-600 dark:text-zinc-400">Subscription</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {gyms.map((gym) => (
              <tr key={gym._id} className="border-t border-zinc-200 dark:border-zinc-800">
                <td className="px-4 py-2 text-black dark:text-zinc-50">{gym.name}</td>
                <td className="px-4 py-2 text-black dark:text-zinc-50">{gym.status}</td>
                <td className="px-4 py-2 text-black dark:text-zinc-50">
                  {gym.subscription?.status ?? '—'}
                </td>
                <td className="px-4 py-2">
                  <Link
                    className="text-blue-600 hover:underline dark:text-blue-400"
                    href={`/platform-admin/gyms/${gym._id}`}
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {gyms.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-zinc-500" colSpan={4}>
                  No gyms yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
