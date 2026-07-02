'use server';

import { revalidatePath } from 'next/cache';
import { serverApiFetch } from '@/lib/serverFetch';

export async function togglePaymentStatusAction(formData) {
  const userId = formData.get('userId');
  const nextPaymentStatus = formData.get('nextPaymentStatus');

  await serverApiFetch(`/api/gym-admin/members/${userId}`, {
    method: 'PATCH',
    body: { paymentStatus: nextPaymentStatus },
  });

  revalidatePath('/gym-admin/members');
}

export async function removeMemberAction(formData) {
  const userId = formData.get('userId');

  await serverApiFetch(`/api/gym-admin/members/${userId}`, { method: 'DELETE' });

  revalidatePath('/gym-admin/members');
}
