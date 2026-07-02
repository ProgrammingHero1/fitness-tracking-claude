'use server';

import { revalidatePath } from 'next/cache';
import { serverApiFetch } from '@/lib/serverFetch';

export async function createClassAction(prevState, formData) {
  const title = formData.get('title');
  const instructorName = formData.get('instructorName');
  const startTime = formData.get('startTime');
  const endTime = formData.get('endTime');
  const capacity = formData.get('capacity');

  try {
    await serverApiFetch('/api/gym-admin/classes', {
      method: 'POST',
      body: {
        title,
        instructorName,
        capacity: Number(capacity),
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
      },
    });

    revalidatePath('/gym-admin/classes');
    return { error: null, success: true };
  } catch (err) {
    return { error: err.message, success: false };
  }
}

export async function cancelClassAction(formData) {
  const classId = formData.get('classId');

  await serverApiFetch(`/api/gym-admin/classes/${classId}/cancel`, { method: 'POST' });

  revalidatePath('/gym-admin/classes');
}
