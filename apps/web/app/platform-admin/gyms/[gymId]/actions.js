'use server';

import { revalidatePath } from 'next/cache';
import { serverApiFetch } from '@/lib/serverFetch';

export async function updateGymStatusAction(formData) {
  const gymId = formData.get('gymId');
  const status = formData.get('status');

  await serverApiFetch(`/api/platform-admin/gyms/${gymId}/status`, {
    method: 'PATCH',
    body: { status },
  });

  revalidatePath(`/platform-admin/gyms/${gymId}`);
  revalidatePath('/platform-admin');
}
