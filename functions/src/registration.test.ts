import assert from "node:assert/strict";
import test from "node:test";

import {
  generateRegistrationId,
  getVerifiedEmail,
  registrationSubmissionSchema,
} from "./registration.js";

const VALID_SUBMISSION = {
  full_name: " Example Visitor ",
  contact_number: "91234567",
  graduating_year: "2021",
  visiting_teachers: [" Mdm Chan ", "Mr Lim"],
  written_messages: [{
    teacher_name: " Mr Lim ",
    message: " Thank you! ",
  }],
};

/**
 * Builds callable authentication data for a verified Google account.
 * @return {object} Callable authentication data.
 */
function verifiedAuth() {
  return {
    token: {
      email: " Visitor@Example.com ",
      email_verified: true,
      firebase: {sign_in_provider: "google.com"},
    },
  };
}

test("normalizes valid registration submissions", () => {
  const result = registrationSubmissionSchema.parse(VALID_SUBMISSION);

  assert.deepEqual(result, {
    full_name: "EXAMPLE VISITOR",
    contact_number: "91234567",
    graduating_year: "2021",
    visiting_teachers: ["Mdm Chan", "Mr Lim"],
    written_messages: [{
      teacher_name: "Mr Lim",
      message: "Thank you!",
    }],
  });
});

test("accepts the maximum bounded lists", () => {
  const result = registrationSubmissionSchema.safeParse({
    ...VALID_SUBMISSION,
    visiting_teachers: Array.from(
      {length: 20},
      (_, index) => `Teacher ${index}`,
    ),
    written_messages: [
      {teacher_name: "Teacher 1", message: "Thank you!"},
      {teacher_name: "Teacher 2", message: "Thank you again!"},
    ],
  });

  assert.equal(result.success, true);
});

test("rejects invalid and unexpected submission data", () => {
  const invalidContact = registrationSubmissionSchema.safeParse({
    ...VALID_SUBMISSION,
    contact_number: "71234567",
  });
  const duplicateTeachers = registrationSubmissionSchema.safeParse({
    ...VALID_SUBMISSION,
    visiting_teachers: ["Mr Lim", "Mr Lim"],
  });
  const extraField = registrationSubmissionSchema.safeParse({
    ...VALID_SUBMISSION,
    email: "spoofed@example.com",
  });

  assert.equal(invalidContact.success, false);
  assert.equal(duplicateTeachers.success, false);
  assert.equal(extraField.success, false);
});

test("generates valid registration IDs", () => {
  for (let index = 0; index < 100; index++) {
    assert.match(generateRegistrationId(), /^[A-HJ-NP-Z]{6}$/);
  }
});

test("uses only verified Google account emails", () => {
  assert.equal(getVerifiedEmail(verifiedAuth()), "visitor@example.com");

  assert.throws(() => getVerifiedEmail(undefined));
  assert.throws(() => getVerifiedEmail({
    ...verifiedAuth(),
    token: {...verifiedAuth().token, email_verified: false},
  }));
  assert.throws(() => getVerifiedEmail({
    ...verifiedAuth(),
    token: {
      ...verifiedAuth().token,
      firebase: {sign_in_provider: "password"},
    },
  }));
});
