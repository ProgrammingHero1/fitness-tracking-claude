import Link from 'next/link';
import { serverApiFetch } from '@/lib/serverFetch';
import { togglePaymentStatusAction, removeMemberAction } from './actions';

export default async function MembersPage() {
  const { members } = await serverApiFetch('/api/gym-admin/members');

  return (
    <main className="flex flex-1 flex-col gap-4 bg-zinc-50 p-16 dark:bg-black">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">Members</h1>
        <Link
          href="/gym-admin/members/invite"
          className="rounded bg-black px-4 py-2 text-sm font-medium text-white dark:bg-zinc-50 dark:text-black"
        >
          Invite member
        </Link>
      </div>

      {members.length === 0 ? (
        <p className="text-sm text-zinc-500">No active members yet.</p>
      ) : (
        <table className="w-full max-w-3xl rounded border border-zinc-200 bg-white text-sm dark:border-zinc-800 dark:bg-zinc-900">
          <thead>
            <tr className="border-b border-zinc-200 text-left dark:border-zinc-800">
              <th className="px-4 py-2 font-medium text-zinc-500">Name</th>
              <th className="px-4 py-2 font-medium text-zinc-500">Email</th>
              <th className="px-4 py-2 font-medium text-zinc-500">Plan</th>
              <th className="px-4 py-2 font-medium text-zinc-500">Payment</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {members.map((member) => {
              const nextPaymentStatus = member.paymentStatus === 'paid' ? 'unpaid' : 'paid';
              return (
                <tr key={member.userId} className="border-b border-zinc-100 last:border-0 dark:border-zinc-800">
                  <td className="px-4 py-2 text-black dark:text-zinc-50">{member.user.name}</td>
                  <td className="px-4 py-2 text-black dark:text-zinc-50">{member.user.email}</td>
                  <td className="px-4 py-2 text-black dark:text-zinc-50">{member.planName}</td>
                  <td className="px-4 py-2">
                    <span
                      className={
                        member.paymentStatus === 'paid'
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }
                    >
                      {member.paymentStatus}
                    </span>
                  </td>
                  <td className="flex gap-2 px-4 py-2">
                    <form action={togglePaymentStatusAction}>
                      <input type="hidden" name="userId" value={member.userId} />
                      <input type="hidden" name="nextPaymentStatus" value={nextPaymentStatus} />
                      <button type="submit" className="text-blue-600 hover:underline dark:text-blue-400">
                        Mark {nextPaymentStatus}
                      </button>
                    </form>
                    <form action={removeMemberAction}>
                      <input type="hidden" name="userId" value={member.userId} />
                      <button type="submit" className="text-red-600 hover:underline dark:text-red-400">
                        Remove
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </main>
  );
}
