import assert from 'node:assert/strict';
import test from 'node:test';

import { Timestamp } from 'firebase-admin/firestore';

import { authBeforeUserCreated, buildUserDocument, userDocumentSchema } from './user.js';

const CREATED_AT = Timestamp.fromMillis(1_750_000_000_000);

test('builds the complete default user document', () => {
  const document = buildUserDocument(
    {
      uid: 'user-123',
      email: ' Operator@Example.com ',
      displayName: ' Example Operator ',
    },
    CREATED_AT,
  );

  assert.deepEqual(document, {
    uid: 'user-123',
    email: 'operator@example.com',
    display_name: 'Example Operator',
    access_level: 0,
    access_expires: CREATED_AT,
    updated_at: CREATED_AT,
    created_at: CREATED_AT,
  });
});

test('uses the email when the auth account has no display name', () => {
  const document = buildUserDocument(
    {
      uid: 'user-456',
      email: 'user@example.com',
      displayName: null,
    },
    CREATED_AT,
  );

  assert.equal(document.display_name, 'user@example.com');
});

test('requires an email that fits the user model', () => {
  assert.throws(() => buildUserDocument({ uid: 'missing-email' }, CREATED_AT));
  assert.throws(() =>
    buildUserDocument({ uid: 'invalid-email', email: 'not-an-email' }, CREATED_AT),
  );
});

test('exports a blocking beforeCreate trigger', () => {
  const endpoint = authBeforeUserCreated.__endpoint;

  assert.equal(endpoint.platform, 'gcfv2');
  assert.deepEqual(endpoint.region, ['asia-southeast1']);
  assert.equal(
    endpoint.blockingTrigger?.eventType,
    'providers/cloud.auth/eventTypes/user.beforeCreate',
  );
});

test('keeps the persisted user schema strict', () => {
  const validDocument = buildUserDocument(
    {
      uid: 'user-789',
      email: 'user@example.com',
      displayName: 'User',
    },
    CREATED_AT,
  );

  assert.equal(userDocumentSchema.safeParse({ ...validDocument, unexpected: true }).success, false);
  assert.equal(userDocumentSchema.safeParse({ ...validDocument, access_level: 4 }).success, false);
});
