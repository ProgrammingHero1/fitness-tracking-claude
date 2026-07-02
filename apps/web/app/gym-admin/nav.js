import Link from 'next/link';

export default function GymAdminNav() {
  return (
    <nav className="flex gap-4 border-b border-zinc-200 bg-white px-16 py-4 text-sm font-medium dark:border-zinc-800 dark:bg-zinc-900">
      <Link className="text-black hover:underline dark:text-zinc-50" href="/gym-admin">
        Dashboard
      </Link>
      <Link className="text-black hover:underline dark:text-zinc-50" href="/gym-admin/members">
        Members
      </Link>
      <Link className="text-black hover:underline dark:text-zinc-50" href="/gym-admin/classes">
        Classes
      </Link>
    </nav>
  );
}
