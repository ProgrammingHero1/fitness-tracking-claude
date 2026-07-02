import { getServerSession } from '@/lib/session';

export default async function PlatformAdminHome() {
  const session = await getServerSession();

  return (
    <main className="flex flex-1 flex-col gap-4 bg-zinc-50 p-16 dark:bg-black">
      <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">Platform Admin</h1>
      <pre className="rounded border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50">
        {JSON.stringify(session.user, null, 2)}
      </pre>
    </main>
  );
}
