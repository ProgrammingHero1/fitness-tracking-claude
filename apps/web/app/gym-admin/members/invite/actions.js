'use server';

import { revalidatePath } from 'next/cache';
import { serverApiFetch } from '@/lib/serverFetch';

export async function inviteMemberAction(prevState, formData) {
  const email = formData.get('email');
  const name = formData.get('name');
  const planName = formData.get('planName');

  try {
    const { tempPassword } = await serverApiFetch('/api/gym-admin/members/invite', {
      method: 'POST',
      body: { email, name, planName },
    });

    revalidatePath('/gym-admin/members');
    return { error: null, invited: { email, name, tempPassword } };
  } catch (err) {
    return { error: err.message, invited: null };
  }
}
