import type { FSRegistration } from '$lib/models';

import { query, where, orderBy, limit, getDocs } from 'firebase/firestore';

import { colRegistrationsRef } from '$lib/firebase/firestore';

export async function querySearchMask(mask: string) {
  const currentYear = new Date().getFullYear().toString();
  const registrationQuery = query(
    colRegistrationsRef(currentYear),
    where('nric', '==', mask.substring(0, 4)),
    where('contact_number_short', '==', mask.substring(4, 8)),
    orderBy('registration_id', 'desc'),
    limit(5),
  );

  const querySnapshot = getDocs(registrationQuery);
  const queryDocs = (await querySnapshot).docs;
  const docs = queryDocs.map((doc) => doc.data() as FSRegistration);

  return docs;
}
