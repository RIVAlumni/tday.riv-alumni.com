import type { FSRegistration } from '$lib/models';

import { query, where, orderBy, limit, getDocs, or } from 'firebase/firestore';

import { colRegistrationsRef } from '$lib/firebase/firestore';

const currentYear = new Date().getFullYear().toString();

export async function querySearchMask(mask: string) {
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

type FilterByParameters = Pick<
  FSRegistration,
  'full_name' | 'nric' | 'contact_number'
>;
export async function queryAllWithFilter(
  filterBy: Partial<FilterByParameters>,
) {
  let queryBuilder = query(colRegistrationsRef(currentYear));

  if (filterBy.full_name)
    queryBuilder = query(
      queryBuilder,
      where('full_name', '>=', filterBy.full_name),
      where('full_name', '<=', filterBy.full_name + '\uf8ff'),
    );

  if (filterBy.nric)
    queryBuilder = query(queryBuilder, where('nric', '==', filterBy.nric));

  if (filterBy.contact_number)
    queryBuilder = query(
      queryBuilder,
      or(
        where('contact_number', '==', filterBy.contact_number),
        where('contact_number_short', '==', filterBy.contact_number),
      ),
    );

  queryBuilder = query(
    queryBuilder,
    limit(10),
    orderBy('registration_id', 'desc'),
  );

  const querySnapshot = getDocs(queryBuilder);
  const queryDocs = (await querySnapshot).docs;
  const docs = queryDocs.map((doc) => doc.data() as FSRegistration);

  return docs;
}
