import { getServerSession } from '@/lib/session';

export default async function GymAdminHome() {
  const session = await getServerSession();

  return (
    <main className="flex flex-1 flex-col gap-4 bg-zinc-50 p-16 dark:bg-black">
      <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">Gym Admin</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Signed in as {session.user.email}. Manage your roster under Members and your schedule under Classes.
      </p>
    </main>
  );
}
