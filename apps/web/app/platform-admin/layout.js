import { redirect } from 'next/navigation';
import { ROLES } from 'shared/src/roles';
import { getServerSession } from '@/lib/session';

export default async function PlatformAdminLayout({ children }) {
  const session = await getServerSession();

  if (!session?.user || session.user.role !== ROLES.PLATFORM_ADMIN) {
    redirect('/sign-in');
  }

  return <div className="flex flex-1 flex-col">{children}</div>;
}
