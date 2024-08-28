import type { WhereFilterOp } from 'firebase/firestore';
import type { FSConsensus, FSRegistration } from '$lib/models';

import {
  doc,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  or,
  getCountFromServer,
} from 'firebase/firestore';

import { colConsensusRef, colRegistrationsRef } from '$lib/firebase/firestore';

const currentYear = new Date().getFullYear().toString();

export async function queryCount(opStr: WhereFilterOp, status: string) {
  const countQuery = query(
    colRegistrationsRef(currentYear),
    where('status', opStr, status),
  );

  const countSnapshot = await getCountFromServer(countQuery);
  const { count } = countSnapshot.data();
  return count;
}

export async function queryConsensus(
  graduating_year: string,
  graduating_class: string,
) {
  const consensusRef = doc(
    colConsensusRef(currentYear),
    `${graduating_year}${graduating_class}`,
  );
  const consensusSnapshot = getDoc(consensusRef);
  const consensusDoc = (await consensusSnapshot).data() as FSConsensus;

  return consensusDoc.form_teachers ?? '';
}

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
    limit(15),
    orderBy('registration_id', 'desc'),
  );

  const querySnapshot = getDocs(queryBuilder);
  const queryDocs = (await querySnapshot).docs;
  const docs = queryDocs.map((doc) => doc.data() as FSRegistration);

  return docs;
}
