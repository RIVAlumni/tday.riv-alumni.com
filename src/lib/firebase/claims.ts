import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';

import type { ClaimIdentity, TeacherClaim } from '$lib/util/teacher-claims';
import { isClaimStale, normalizeTeacherKey } from '$lib/util/teacher-claims';

import { getInternalFirestore } from './firestore';

function claimRef(teacher: string) {
  return doc(getInternalFirestore(), 'claims', normalizeTeacherKey(teacher));
}

function isHeldByOther(claim: TeacherClaim, email: string): boolean {
  return (
    claim.status === 'CLAIMED' &&
    claim.claimed_by.email !== email &&
    !isClaimStale(claim, Date.now())
  );
}

export function subscribeClaims(
  onNext: (claims: Record<string, TeacherClaim>) => void,
  onError?: (error: Error) => void,
): () => void {
  return onSnapshot(
    collection(getInternalFirestore(), 'claims'),
    (snapshot) => {
      const claims: Record<string, TeacherClaim> = {};
      snapshot.forEach((entry) => {
        claims[entry.id] = entry.data() as TeacherClaim;
      });
      onNext(claims);
    },
    (error) => onError?.(error as Error),
  );
}

export async function claimTeacher(teacher: string, by: ClaimIdentity): Promise<void> {
  await runTransaction(getInternalFirestore(), async (transaction) => {
    const reference = claimRef(teacher);
    const snapshot = await transaction.get(reference);
    const existing = snapshot.data() as TeacherClaim | undefined;
    if (existing && isHeldByOther(existing, by.email)) {
      throw new Error(`${existing.claimed_by.name} is currently emailing ${teacher}`);
    }
    // Always write the full document; rules hasOnly validation requires it.
    transaction.set(reference, {
      teacher,
      status: 'CLAIMED',
      claimed_by: by,
      claimed_at: serverTimestamp(),
      completed_by: null,
      completed_at: null,
      updated_at: serverTimestamp(),
    });
  });
}

export async function completeTeacher(teacher: string, by: ClaimIdentity): Promise<void> {
  await runTransaction(getInternalFirestore(), async (transaction) => {
    const reference = claimRef(teacher);
    const snapshot = await transaction.get(reference);
    const existing = snapshot.data() as TeacherClaim | undefined;
    if (existing && isHeldByOther(existing, by.email)) {
      throw new Error(`${existing.claimed_by.name} is currently emailing ${teacher}`);
    }
    // Preserve the original claim only when the completer is the claimer;
    // rules require claimed_by.email to match the caller on every write, so
    // taking over a stale claim must stamp the completer instead.
    const preserve = existing?.claimed_by.email === by.email;
    transaction.set(reference, {
      teacher,
      status: 'COMPLETED',
      claimed_by: preserve && existing ? existing.claimed_by : by,
      claimed_at: preserve && existing ? existing.claimed_at : serverTimestamp(),
      completed_by: by,
      completed_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
  });
}

export async function uncompleteTeacher(teacher: string, by: ClaimIdentity): Promise<void> {
  await runTransaction(getInternalFirestore(), async (transaction) => {
    const reference = claimRef(teacher);
    const snapshot = await transaction.get(reference);
    if (!snapshot.exists()) throw new Error('No claim to un-complete');
    const existing = snapshot.data() as TeacherClaim;
    if (existing.status !== 'COMPLETED') throw new Error('Claim is not completed');
    // Re-claims to the un-completer so the teacher is actively held again.
    transaction.set(reference, {
      teacher,
      status: 'CLAIMED',
      claimed_by: by,
      claimed_at: serverTimestamp(),
      completed_by: null,
      completed_at: null,
      updated_at: serverTimestamp(),
    });
  });
}

export async function releaseClaim(teacher: string): Promise<void> {
  await deleteDoc(claimRef(teacher));
}
