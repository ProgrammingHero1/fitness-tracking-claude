import { redirect } from 'next/navigation';
import { ROLES } from 'shared/src/roles';
import { getServerSession } from '@/lib/session';
import GymAdminNav from './nav';

export default async function GymAdminLayout({ children }) {
  const session = await getServerSession();

  if (!session?.user || session.user.role !== ROLES.GYM_ADMIN) {
    redirect('/sign-in');
  }

  return (
    <div className="flex flex-1 flex-col">
      <GymAdminNav />
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
