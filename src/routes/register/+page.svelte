<script lang="ts">
  import CheckIcon from '$lib/components/icons/CheckIcon.svelte';
  import CrossIcon from '$lib/components/icons/Cancel01Icon.svelte';
  import { getCountdownState } from '$lib/data/countdown';
  import { ArrowLeft01Icon, ArrowUpRight01Icon } from '$lib/icons';
  import * as Alert from '$lib/components/ui/alert/index.js';
  import { visitorAuth } from '$lib/firebase/auth.svelte';
  import { onMount } from 'svelte';

  const graduationYears = Array.from({ length: 28 }, (_, index) => 2026 - index);
  const teacherOptions = [
    'Mdm Chan',
    'Mdm Chiah',
    'Mdm Li',
    'Mr Firdaus',
    'Mr Ho',
    'Mr Khair',
    'Mr Lim',
    'Mr Razif',
    'Mr Riduan',
    'Mr Seah',
    'Mr Yee',
    'Mr Zakir',
    'Mrs Thomas',
    'Ms Fronia',
    'Ms Sakina',
  ].sort((first, second) => first.localeCompare(second));
  let exRiverlite = $state('');
  let countdown = $state(getCountdownState());
  let heroMotionReady = $state(false);
  let heroImageVisible = $state(false);

  const registrationOpen = $derived(countdown.phase === 'pre-registration');

  function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
  }

  let authError = $state<string | null>(null);

  async function handleGoogleSignIn() {
    authError = null;
    try {
      await visitorAuth.signInWithGoogle();
    } catch (err) {
      console.error('Google sign-in failed:', err);
      authError = 'Please try again.';
    }
  }

  async function handleChangeEmail() {
    authError = null;
    try {
      await visitorAuth.signOut();
    } catch (err) {
      console.error('Google sign-out failed:', err);
      authError = 'We could not change your Google account. Please try again.';
    }
  }

  onMount(() => {
    visitorAuth.init();
    const countdownInterval = window.setInterval(() => {
      countdown = getCountdownState();
    }, 1_000);
    heroMotionReady = true;
    const heroAnimationFrame = window.requestAnimationFrame(() => {
      heroImageVisible = true;
    });

    return () => {
      window.clearInterval(countdownInterval);
      window.cancelAnimationFrame(heroAnimationFrame);
    };
  });
</script>

<svelte:head>
  <title>Attendance Registration — Teachers’ Day 2026</title>
  <meta
    name="description"
    content="Pre-register your visit to Rivervale Primary School for Teachers’ Day on 3 September 2026." />
  <meta
    name="theme-color"
    content="#050505" />
</svelte:head>

<main
  class="attendance-page"
  class:motion-ready={heroMotionReady}>
  <header class="attendance-header">
    <a href="/#home">
      <ArrowLeft01Icon
        size={15}
        strokeWidth={1.8} />
      Event home
    </a>
    <p>Attendance registration</p>
    <time datetime="2026-09-03">03 / Sept / 26</time>
  </header>

  <section
    id="register"
    class="attendance-hero"
    aria-labelledby="registration-title">
    <h1 id="registration-title">
      <span>Let's</span>
      <span
        class="hero-photo"
        class:is-visible={heroImageVisible}
        role="img"
        aria-label="RIVA volunteers welcoming visitors during a previous school event"></span>
      <span>register.</span>
    </h1>
  </section>

  <section
    id="registration-form"
    class="form-layout"
    aria-labelledby="form-heading">
    <div class="form-intro">
      <p class="section-kicker"><span aria-hidden="true"></span> Pre-registration</p>
      <h2 id="form-heading">From Little Hearts, With Big Thanks.</h2>
      <dl
        class="registration-schedule"
        aria-label="Teachers’ Day registration schedule">
        <div>
          <dt>Well-wish letters closes</dt>
          <dd>
            <time datetime="2026-08-14T23:59:00+08:00">14 Aug 2026 • 11:59 PM</time>
          </dd>
        </div>
        <div>
          <dt>Pre-registration closes</dt>
          <dd>
            <time datetime="2026-08-28T23:59:00+08:00">28 Aug 2026 • 11:59 PM</time>
          </dd>
        </div>
        <div>
          <dt>Check-in starts</dt>
          <dd>
            <time datetime="2026-09-03T11:00:00+08:00">3 Sep 2026 • 11:00 AM</time>
          </dd>
        </div>
        <div>
          <dt>Last check-in</dt>
          <dd>
            <time datetime="2026-09-03T12:00:00+08:00">3 Sep 2026 • 12:00 PM</time>
          </dd>
        </div>
      </dl>
    </div>

    <div class="form-panel">
      {#if !registrationOpen}
        <section
          class="confirmation confirmation--closed"
          aria-live="polite">
          <p
            class="confirmation-mark"
            aria-hidden="true">
            —
          </p>
          <p class="section-kicker"><span aria-hidden="true"></span> Pre-registration closed</p>
          <h3>The form is now closed.</h3>
          <p>
            Walk-ins are subject to availability.
            <a href="https://go.riv-alumni.com/outreach"
              >Contact our RIVA Community Outreach Team to check.</a>
          </p>
          <a href="/#the-visit">
            View event details
            <ArrowUpRight01Icon
              size={16}
              strokeWidth={1.8} />
          </a>
        </section>
      {:else}
        <form onsubmit={handleSubmit}>
          <section
            id="verify-email"
            class="form-section google-section"
            aria-labelledby="email-heading">
            <div class="field-heading">
              <span>01</span>
              <div>
                <h3 id="email-heading">Verify your email</h3>
              </div>
            </div>

            <div
              class="google-button-wrap"
              aria-live="polite">
              {#if visitorAuth.loading}
                <p class="google-auth-status">Checking your Google account…</p>
              {:else if visitorAuth.user?.email}
                <div class="verified-email">
                  <p>
                    We will send the event ticket to
                    <strong>{visitorAuth.user.email}</strong>.
                  </p>
                  <p>
                    Incorrect?
                    <button
                      class="change-email-button"
                      type="button"
                      onclick={handleChangeEmail}>Change email</button>
                  </p>
                </div>
              {:else}
                <button
                  class="google-fallback"
                  type="button"
                  onclick={handleGoogleSignIn}>
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24">
                    <path
                      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                      fill="currentColor" />
                  </svg>
                  Sign in with Google
                </button>
              {/if}
              {#if authError}
                <Alert.Root variant="destructive">
                  <Alert.Title>Google account error</Alert.Title>
                  <Alert.Description>{authError}</Alert.Description>
                </Alert.Root>
              {/if}
            </div>
          </section>

          <section
            id="privacy-and-consent"
            class="form-section consent-section"
            aria-labelledby="consent-heading">
            <div class="field-heading">
              <span>02</span>
              <div>
                <h3 id="consent-heading">Privacy and Consent Notice</h3>
              </div>
            </div>

            <div class="section-content consent-notice">
              <p>
                I declare that the personal information I have provided on this form has been
                surrendered to Rivervale Primary School (RIVPS) and Rivervale Primary School Alumni
                Association (RIVA) voluntarily, for the sole purpose of the stated event and
                membership tracking. I understand that the information may or may not be held by
                RIVPS or RIVA after the conclusion of the event.
              </p>
              <p>
                I understand that the information I have provided will not be used for any other
                occasion other than for the purpose of the event, and will not be circulated beyond
                RIVPS and RIVA without further consent being sought from me.
              </p>
              <p>
                I understand that photographs may be taken during the event and may be used on
                platforms operated by RIVA and RIVPS for event documentation, communications, and
                publicity.
              </p>
              <p>
                More information can be found here:
                <a
                  href="https://ops.riv-alumni.com/privacy"
                  target="_blank"
                  rel="noreferrer">RIVAlumni Privacy Policy</a
                >.
              </p>
              <label class="consent-confirmation">
                <input
                  type="checkbox"
                  name="privacyConsent"
                  required />
                <span
                  class="consent-checkbox"
                  aria-hidden="true">
                  <CheckIcon
                    size={18}
                    strokeWidth={2.4} />
                </span>
                <span>I have read and agree to the Privacy and Consent Notice.</span>
              </label>
            </div>
          </section>

          <section
            id="your-details"
            class="form-section details-section"
            aria-labelledby="details-heading">
            <div class="field-heading">
              <span>03</span>
              <div>
                <h3 id="details-heading">Your details</h3>
                <p>Use the same name shown on your identification.</p>
              </div>
            </div>

            <div class="section-fields">
              <label class="form-field">
                <span>Full name</span>
                <input
                  type="text"
                  name="fullName"
                  autocomplete="name"
                  maxlength="120"
                  aria-describedby="full-name-note"
                  required />
                <small
                  id="full-name-note"
                  class="field-note">
                  Please type letter-by-letter exactly as shown in your NRIC/EZ-Link Card. Failure
                  to do so will result in processing delays.
                </small>
              </label>

              <label class="form-field">
                <span>Contact number</span>
                <input
                  type="tel"
                  name="contactNumber"
                  autocomplete="tel"
                  inputmode="numeric"
                  placeholder="81234567"
                  pattern="[89][0-9]{7}"
                  minlength="8"
                  maxlength="8"
                  aria-describedby="contact-number-note"
                  title="Enter an 8-digit Singapore mobile number starting with 8 or 9."
                  required />
                <small
                  id="contact-number-note"
                  class="field-note">
                  Enter your mobile phone number contactable via WhatsApp.
                </small>
              </label>

              <fieldset class="form-field form-field--choice">
                <legend>Are you an Ex-Riverlite?</legend>
                <div class="choice-grid">
                  <label>
                    <input
                      type="radio"
                      name="exRiverlite"
                      value="yes"
                      bind:group={exRiverlite}
                      required />
                    <span
                      class="choice-icon choice-icon--yes"
                      aria-hidden="true">
                      <CheckIcon
                        size={28}
                        strokeWidth={2} />
                    </span>
                    <span class="choice-copy"
                      >Yes <small>I graduated from Rivervale Primary School</small></span>
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="exRiverlite"
                      value="no"
                      bind:group={exRiverlite} />
                    <span
                      class="choice-icon choice-icon--no"
                      aria-hidden="true">
                      <CrossIcon
                        size={28}
                        strokeWidth={2} />
                    </span>
                    <span class="choice-copy"
                      >No <small>I DID NOT graduate from Rivervale Primary School</small></span>
                  </label>
                </div>
              </fieldset>

              <label
                class="form-field"
                class:is-disabled={exRiverlite !== 'yes'}>
                <span>Graduating year</span>
                <select
                  name="graduatingYear"
                  disabled={exRiverlite !== 'yes'}
                  required={exRiverlite === 'yes'}>
                  <option value="">Select year</option>
                  {#each graduationYears as year (year)}
                    <option value={String(year)}>{year}</option>
                  {/each}
                </select>
              </label>

              <label class="form-field">
                <span>Which teacher(s) would you like to meet?</span>
                <textarea
                  name="teachers"
                  rows="5"
                  maxlength="1000"
                  placeholder="Enter one or more teacher names"
                  aria-describedby="teachers-disclaimer teachers-help"
                  required></textarea>
                <span class="field-notes">
                  <small
                    id="teachers-disclaimer"
                    class="field-note">
                    ⚠️ Disclaimer: This section is a survey to help the school better plan for
                    visiting students on Teachers' Day. The teachers you hope to visit might not be
                    available on the day itself.
                  </small>
                  <small
                    id="teachers-help"
                    class="field-note">
                    Can't find your teacher? Drop our
                    <a href="https://go.riv-alumni.com/outreach"
                      >RIVA Community Outreach Team a text</a>
                    and we will let you know if your teacher is still with us!
                  </small>
                </span>
              </label>
            </div>
          </section>

          <section
            id="personalised-messages"
            class="form-section messages-section"
            aria-labelledby="messages-heading">
            <div class="field-heading">
              <span>04</span>
              <div>
                <h3 id="messages-heading">Personalised Messages</h3>
                <p>
                  Your personalised messages will be printed by RIVA and handed over to your teacher
                  before Teachers' Day. Please ensure that you fill up this section before 14 August
                  2026 (Friday), 11:59 PM.
                </p>
              </div>
            </div>

            <div class="section-fields">
              <datalist id="teacher-options">
                {#each teacherOptions as teacher (teacher)}
                  <option value={teacher}></option>
                {/each}
              </datalist>

              <label class="form-field">
                <span>Name of Teacher 1</span>
                <input
                  type="text"
                  name="messageTeacher1"
                  list="teacher-options"
                  maxlength="120"
                  placeholder="Enter or search for a teacher"
                  aria-describedby="teacher-one-help" />
                <small
                  id="teacher-one-help"
                  class="field-note">
                  Teacher's names are sorted in alphabetical order. If you do not see your teacher's
                  name in this list, please contact us immediately via
                  <a
                    href="https://www.instagram.com/riv.alumni"
                    target="_blank"
                    rel="noreferrer">@riv.alumni on Instagram</a
                  >, or via our
                  <a href="https://go.riv-alumni.com/outreach"
                    >RIVA Community Outreach WhatsApp number</a
                  >.
                </small>
              </label>

              <label class="form-field">
                <span>Message for Teacher 1</span>
                <textarea
                  name="messageForTeacher1"
                  rows="6"
                  maxlength="2000"
                  placeholder="Write your message"></textarea>
              </label>

              <label class="form-field">
                <span>Name of Teacher 2</span>
                <input
                  type="text"
                  name="messageTeacher2"
                  list="teacher-options"
                  maxlength="120"
                  placeholder="Enter or search for a teacher"
                  aria-describedby="teacher-two-help" />
                <small
                  id="teacher-two-help"
                  class="field-note">
                  Teacher's names are sorted in alphabetical order. If you do not see your teacher's
                  name in this list, please contact us immediately via
                  <a
                    href="https://www.instagram.com/riv.alumni"
                    target="_blank"
                    rel="noreferrer">@riv.alumni on Instagram</a
                  >, or via our
                  <a href="https://go.riv-alumni.com/outreach"
                    >RIVA Community Outreach WhatsApp number</a
                  >.
                </small>
              </label>

              <label class="form-field">
                <span>Message for Teacher 2</span>
                <textarea
                  name="messageForTeacher2"
                  rows="6"
                  maxlength="2000"
                  placeholder="Write your message"></textarea>
              </label>
            </div>
          </section>

          <button
            class="submit-button"
            type="submit">
            <span>Submit registration</span>
            <ArrowUpRight01Icon
              size={18}
              strokeWidth={1.8} />
          </button>

          <p class="privacy-note">
            Registrations are subject to review at RIVAlumni's discretion and may be rejected
            without cause. Your event ticket will be emailed to your Google-verified email address.
          </p>
        </form>
      {/if}
    </div>
  </section>

  <footer class="attendance-footer">
    <p>Rivervale Primary School Alumni Association</p>
    <p>Thursday, 3 September 2026 · 11:00 AM–12:30 PM</p>
    <a href="/auth/login">Staff sign in</a>
  </footer>
</main>

<style>
  :global(html) {
    background: #050505;
  }

  :global(body) {
    margin: 0;
  }

  :global(body:has(.attendance-page)) {
    background: #050505;
    color: #f5f5f2;
  }

  :global(::selection) {
    background: #eb2f06;
    color: #fff;
  }

  .attendance-page {
    --paper: #f5f5f2;
    --ink: #050505;
    --muted: #989894;
    --line: rgba(255, 255, 255, 0.16);
    --surface: rgba(255, 255, 255, 0.05);
    --red: #eb2f06;
    --red-deep: #c92705;
    min-width: 0;
    overflow: clip;
    background: var(--ink);
    color: var(--paper);
    font-family: 'Inter Variable', 'Helvetica Neue', Arial, sans-serif;
  }

  .attendance-page :global(*) {
    box-sizing: border-box;
  }

  .attendance-page a {
    color: inherit;
    text-decoration: none;
  }

  .attendance-header {
    min-height: 4.75rem;
    padding-inline: clamp(1.25rem, 2.8vw, 3rem);
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 1rem;
    border-bottom: 1px solid var(--line);
    text-transform: uppercase;
    font-size: 0.68rem;
    font-weight: 650;
    letter-spacing: 0.01em;
  }

  .attendance-header a {
    justify-self: start;
    display: inline-flex;
    align-items: center;
    gap: 0.65rem;
  }

  .attendance-header a :global(svg),
  .confirmation > a :global(svg),
  .submit-button :global(svg) {
    flex: 0 0 auto;
  }

  .attendance-header p {
    margin: 0;
  }

  .attendance-header time {
    justify-self: end;
  }

  .attendance-header a,
  .attendance-footer a,
  .confirmation > a {
    padding-bottom: 0.25rem;
    border-bottom: 1px solid currentColor;
  }

  .attendance-header a:focus-visible,
  .attendance-footer a:focus-visible,
  .confirmation > a:focus-visible,
  .google-fallback:focus-visible,
  .change-email-button:focus-visible,
  .submit-button:focus-visible {
    outline: 2px solid var(--red);
    outline-offset: 4px;
  }

  .attendance-hero {
    --hero-image-width: clamp(12rem, 23vw, 25rem);
    --hero-image-height: clamp(5rem, 10.2vw, 10rem);
    --hero-image-gap: clamp(1rem, 2.5vw, 2.5rem);
    min-height: clamp(25rem, 52svh, 42rem);
    padding: clamp(2.5rem, 5vw, 5rem) clamp(1.25rem, 2.8vw, 3rem);
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 3rem;
  }

  .attendance-hero h1 {
    margin: 0;
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    font-size: clamp(5.7rem, 13.1vw, 12.9rem);
    line-height: 0.78;
    letter-spacing: -0.085em;
    font-weight: 510;
    white-space: nowrap;
  }

  .hero-photo {
    width: var(--hero-image-width);
    height: var(--hero-image-height);
    margin-inline: var(--hero-image-gap);
    flex: 0 0 auto;
    display: block;
    background-image:
      linear-gradient(rgba(31, 76, 199, 0.16), rgba(231, 58, 50, 0.12)),
      url('/images/registration-hero-d55-0081.webp');
    background-position: 50% 58%;
    background-size: cover;
    filter: saturate(0.92) contrast(1.04);
    opacity: 1;
    overflow: hidden;
    transition:
      width 2.5s cubic-bezier(0.4, 0, 0.2, 1),
      margin 2.5s cubic-bezier(0.4, 0, 0.2, 1),
      opacity 900ms ease;
    will-change: width, margin, opacity;
  }

  .attendance-page.motion-ready .hero-photo {
    width: 0;
    margin-inline: 0;
    opacity: 0;
  }

  .attendance-page.motion-ready .hero-photo:global(.is-visible) {
    width: var(--hero-image-width);
    margin-inline: var(--hero-image-gap);
    opacity: 1;
  }

  .form-layout {
    padding: clamp(6rem, 10vw, 10rem) clamp(1.25rem, 2.8vw, 3rem);
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: clamp(2.5rem, 4vw, 5.5rem);
    border-top: 1px solid var(--line);
  }

  .form-intro {
    align-self: start;
    position: sticky;
    top: 2rem;
  }

  .section-kicker {
    margin: 0 0 clamp(2rem, 4vw, 3.5rem);
    display: flex;
    align-items: center;
    gap: 0.8rem;
    color: var(--muted);
    font-size: 0.82rem;
  }

  .section-kicker > span {
    width: 0.42rem;
    height: 0.42rem;
    display: inline-block;
    background: var(--red);
  }

  .form-intro h2 {
    max-width: 11ch;
    margin: 0;
    font-size: clamp(3.5rem, 6.2vw, 6.2rem);
    line-height: 0.91;
    letter-spacing: -0.071em;
    font-weight: 520;
    text-wrap: balance;
  }

  .registration-schedule {
    max-width: 37rem;
    margin-top: clamp(3rem, 6vw, 5rem);
    margin-bottom: 0;
    text-transform: uppercase;
    font-size: 0.72rem;
    font-weight: 650;
  }

  .registration-schedule > div {
    padding-block: 1rem;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 2rem;
    border-top: 1px solid var(--line);
  }

  .registration-schedule dt,
  .registration-schedule dd {
    margin: 0;
  }

  .registration-schedule dt {
    color: var(--muted);
  }

  .registration-schedule dd {
    text-align: right;
  }

  .form-panel {
    min-width: 0;
  }

  form {
    display: grid;
    gap: 2.65rem;
  }

  .form-section {
    padding-bottom: 2.65rem;
    display: grid;
    gap: 1.5rem;
    border-bottom: 1px solid var(--line);
  }

  .section-content,
  .section-fields {
    min-width: 0;
    margin-left: 3.4rem;
  }

  .section-fields {
    display: grid;
    gap: 2.65rem;
  }

  .field-heading {
    display: grid;
    grid-template-columns: 2.4rem 1fr;
    gap: 1rem;
  }

  .field-heading > span {
    padding-top: 0.2rem;
    color: var(--red);
    font-size: 0.75rem;
    font-weight: 700;
  }

  .field-heading h3 {
    margin: 0;
  }

  .field-heading h3 {
    font-size: clamp(1.9rem, 3vw, 2.8rem);
    line-height: 0.95;
    letter-spacing: -0.055em;
    font-weight: 520;
  }

  .field-heading p {
    max-width: 52rem;
    margin: 0.8rem 0 0;
    color: var(--muted);
    font-size: 0.82rem;
    line-height: 1.5;
  }

  .google-button-wrap {
    min-height: 2.75rem;
    padding-left: 3.4rem;
    display: grid;
    gap: 0.85rem;
  }

  .google-fallback {
    min-width: min(100%, 20rem);
    min-height: 2.75rem;
    padding-inline: 1rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.8rem;
    border: 1px solid rgba(255, 255, 255, 0.26);
    border-radius: 0.2rem;
    background: #fff;
    color: #222;
    font: inherit;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition:
      transform 180ms ease,
      box-shadow 180ms ease;
  }

  .google-fallback:hover {
    transform: translateY(-2px);
    box-shadow: 0 0.75rem 2rem rgba(0, 0, 0, 0.28);
  }

  .google-fallback svg {
    width: 1.1rem;
    height: 1.1rem;
  }

  .google-auth-status {
    min-height: 2.75rem;
    margin: 0;
    display: flex;
    align-items: center;
    color: var(--muted);
    font-size: 0.82rem;
  }

  .verified-email {
    min-height: 2.75rem;
    padding: 1rem 1.1rem;
    display: grid;
    gap: 0.55rem;
    border-left: 0.2rem solid var(--red);
    background: rgba(235, 47, 6, 0.08);
  }

  .verified-email p {
    margin: 0;
    color: #c9c9c4;
    font-size: 0.85rem;
    line-height: 1.5;
  }

  .verified-email strong {
    color: var(--paper);
    font-weight: 650;
    overflow-wrap: anywhere;
  }

  .change-email-button {
    margin-left: 0.15rem;
    padding: 0;
    border: 0;
    border-bottom: 1px solid currentColor;
    background: transparent;
    color: #ff8165;
    font: inherit;
    font-weight: 700;
    cursor: pointer;
  }

  .change-email-button:hover {
    color: var(--paper);
  }

  .consent-notice {
    min-width: 0;
    padding: clamp(1.25rem, 2.5vw, 2rem);
    display: grid;
    gap: 1.25rem;
    border-left: 0.22rem solid var(--red);
    background: rgba(255, 255, 255, 0.045);
  }

  .consent-notice p {
    margin: 0;
    color: #c9c9c4;
    font-size: 0.82rem;
    line-height: 1.58;
  }

  .consent-notice a {
    color: var(--paper);
    text-decoration: underline;
    text-underline-offset: 0.2em;
  }

  .consent-confirmation {
    position: relative;
    margin-top: 0.35rem;
    padding-top: 1.25rem;
    display: flex;
    align-items: flex-start;
    gap: 0.8rem;
    border-top: 1px solid var(--line);
    color: var(--paper);
    font-size: 0.8rem;
    font-weight: 650;
    line-height: 1.4;
    cursor: pointer;
  }

  .consent-confirmation input {
    position: absolute;
    width: 1px;
    height: 1px;
    min-height: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
    border: 0;
  }

  .consent-checkbox {
    width: 1.35rem;
    height: 1.35rem;
    flex: 0 0 1.35rem;
    display: grid;
    place-items: center;
    border: 1px solid rgba(255, 255, 255, 0.36);
    color: #fff;
    background: transparent;
  }

  .consent-checkbox :global(svg) {
    opacity: 0;
    transform: scale(0.72);
    transition:
      opacity 140ms ease,
      transform 140ms ease;
  }

  .consent-confirmation input:checked + .consent-checkbox {
    border-color: var(--red);
    background: var(--red);
  }

  .consent-confirmation input:checked + .consent-checkbox :global(svg) {
    opacity: 1;
    transform: scale(1);
  }

  .consent-confirmation:has(input:focus-visible) .consent-checkbox {
    outline: 2px solid var(--red);
    outline-offset: 3px;
  }

  .form-field {
    min-width: 0;
    display: grid;
    gap: 0.7rem;
  }

  .form-field > span,
  .form-field legend {
    padding: 0;
    color: #e7e7e2;
    text-transform: uppercase;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .form-field > span small {
    color: var(--muted);
    text-transform: none;
    font-weight: 450;
  }

  input,
  select,
  textarea {
    width: 100%;
    border: 1px solid rgba(255, 255, 255, 0.13);
    border-radius: 0;
    background: var(--surface);
    color: var(--paper);
    font: inherit;
    font-size: 1rem;
    outline: 0;
    box-shadow: none !important;
    transition:
      border-color 180ms ease,
      background 180ms ease;
  }

  input,
  select {
    min-height: 3.5rem;
    padding: 0 1rem;
  }

  textarea {
    min-height: 9rem;
    padding: 1rem;
    resize: vertical;
  }

  input::placeholder,
  textarea::placeholder {
    color: #747471;
  }

  input:focus,
  select:focus,
  textarea:focus {
    border-color: var(--red);
    background: rgba(235, 47, 6, 0.07);
    outline: 2px solid var(--red);
    outline-offset: -2px;
    box-shadow: none !important;
  }

  input:focus-visible,
  select:focus-visible,
  textarea:focus-visible {
    outline: 2px solid var(--red);
    outline-offset: -2px;
    box-shadow: none !important;
  }

  select {
    appearance: auto;
    color-scheme: dark;
  }

  .form-field.is-disabled {
    opacity: 0.42;
  }

  .form-field--choice {
    margin: 0;
    padding: 0 0 0.65rem;
    border: 0;
  }

  .form-field--choice legend {
    margin-bottom: 0.7rem;
  }

  .choice-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.8rem;
  }

  .choice-grid label {
    position: relative;
    min-height: 6.5rem;
    padding: 1rem;
    display: flex;
    align-items: flex-start;
    gap: 0.8rem;
    border: 1px solid rgba(255, 255, 255, 0.13);
    background: var(--surface);
    cursor: pointer;
  }

  .choice-grid label:has(input:checked) {
    background: rgba(235, 47, 6, 0.11);
  }

  .choice-grid label:first-child:has(input:checked) {
    border-color: var(--red);
  }

  .choice-grid label:last-child:has(input:checked) {
    border-color: var(--red);
  }

  .choice-grid label:has(input:focus-visible) {
    outline: 2px solid var(--red);
    outline-offset: 4px;
  }

  .choice-grid input {
    position: absolute;
    width: 1px;
    height: 1px;
    min-height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
    border: 0;
  }

  .choice-grid .choice-icon {
    width: 2.3rem;
    height: 2.3rem;
    flex: 0 0 2.3rem;
    display: grid;
    place-items: center;
    border: 1px solid rgba(255, 255, 255, 0.22);
    border-radius: 50%;
    color: #fff;
  }

  .choice-grid .choice-icon--yes {
    color: #ff8165;
  }

  .choice-grid .choice-icon--no {
    color: #ff8165;
  }

  .choice-grid label:has(input:checked) .choice-icon--yes {
    border-color: var(--red);
    background: var(--red);
    color: #fff;
  }

  .choice-grid label:has(input:checked) .choice-icon--no {
    border-color: var(--red);
    background: var(--red);
    color: #fff;
  }

  .choice-grid .choice-copy {
    display: grid;
    gap: 0.45rem;
    font-size: 0.92rem;
    font-weight: 650;
  }

  .choice-grid label small {
    color: var(--muted);
    font-size: 0.75rem;
    font-weight: 450;
    line-height: 1.35;
  }

  .field-note,
  .privacy-note {
    color: var(--muted);
    font-size: 0.72rem;
    line-height: 1.45;
  }

  .field-notes {
    display: grid;
    gap: 0.55rem;
  }

  .field-note a,
  .confirmation > p a {
    color: #f5f5f2;
    text-decoration: underline;
    text-underline-offset: 0.2em;
  }

  .field-note a:hover,
  .consent-notice a:hover,
  .confirmation > p a:hover {
    color: #ff6c4c;
  }

  .submit-button {
    min-height: 4.5rem;
    padding: 0 1.2rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border: 1px solid #fff;
    border-radius: 0;
    background: #fff;
    color: #050505;
    text-transform: uppercase;
    font: inherit;
    font-size: 0.78rem;
    font-weight: 700;
    cursor: pointer;
    transition:
      background 200ms ease,
      color 200ms ease,
      opacity 200ms ease;
  }

  .submit-button:hover:not(:disabled) {
    border-color: var(--red);
    background: var(--red);
    color: #fff;
  }

  .privacy-note {
    max-width: 43rem;
    margin: -1.2rem 0 0;
  }

  .confirmation {
    min-height: 48rem;
    padding: clamp(2rem, 4vw, 4rem);
    display: flex;
    flex-direction: column;
    justify-content: center;
    border: 1px solid var(--line);
    background: rgba(43, 85, 217, 0.1);
  }

  .confirmation--closed {
    background: rgba(255, 255, 255, 0.04);
  }

  .confirmation-mark {
    width: 4rem;
    height: 4rem;
    margin: 0 0 3rem;
    display: grid;
    place-items: center;
    border: 1px solid currentColor;
    border-radius: 50%;
    font-size: 1.6rem;
  }

  .confirmation h3 {
    max-width: 8ch;
    margin: 0;
    font-size: clamp(4rem, 8vw, 8rem);
    line-height: 0.84;
    letter-spacing: -0.08em;
    font-weight: 520;
  }

  .confirmation > p:not(.section-kicker):not(.confirmation-mark) {
    max-width: 34rem;
    margin: 2.5rem 0;
    color: #bbb;
    font-size: 1.05rem;
    line-height: 1.5;
  }

  .confirmation > a {
    align-self: flex-start;
    margin-top: 1rem;
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    text-transform: uppercase;
    font-size: 0.75rem;
    font-weight: 700;
  }

  .attendance-footer {
    min-height: 5.5rem;
    margin-inline: clamp(1.25rem, 2.8vw, 3rem);
    padding-block: 1.4rem;
    display: grid;
    grid-template-columns: 1fr auto auto;
    align-items: center;
    gap: 2rem;
    border-top: 1px solid var(--line);
    text-transform: uppercase;
    font-size: 0.68rem;
    font-weight: 650;
  }

  .attendance-footer p {
    margin: 0;
  }

  @media (max-width: 1000px) {
    .attendance-hero h1 {
      flex-wrap: wrap;
      justify-content: start;
    }

    .attendance-hero h1 > span:last-child {
      flex-basis: 100%;
      margin-top: 0.12em;
    }

    .form-layout {
      grid-template-columns: 1fr;
    }

    .form-intro {
      position: static;
    }

    .form-intro h2,
    .registration-schedule {
      max-width: 46rem;
    }
  }

  @media (max-width: 650px) {
    .attendance-header {
      grid-template-columns: 1fr auto;
    }

    .attendance-header p {
      display: none;
    }

    .attendance-hero {
      --hero-image-width: min(30vw, 8rem);
      --hero-image-height: clamp(4rem, 20vw, 6rem);
      --hero-image-gap: 0.75rem;
      min-height: clamp(24rem, 58svh, 32rem);
      padding-block: 3rem;
    }

    .attendance-hero h1 {
      font-size: clamp(4.6rem, 22vw, 7rem);
    }

    .form-layout {
      padding-block: 5.5rem;
      gap: 5rem;
    }

    .form-intro h2 {
      font-size: clamp(3.4rem, 15vw, 5rem);
    }

    .registration-schedule > div {
      grid-template-columns: minmax(0, 1fr) minmax(8.5rem, auto);
      gap: 1rem;
    }

    .google-button-wrap,
    .section-content,
    .section-fields {
      padding-left: 0;
      margin-left: 0;
    }

    .consent-notice {
      padding: 1.25rem;
      gap: 1.1rem;
      border: 1px solid var(--line);
      border-top: 0.25rem solid var(--red);
    }

    .verified-email {
      border: 1px solid var(--line);
      border-top: 0.2rem solid var(--red);
    }

    .consent-notice p {
      overflow-wrap: anywhere;
      font-size: 0.86rem;
      line-height: 1.55;
    }

    .consent-confirmation {
      display: grid;
      grid-template-columns: 1.35rem minmax(0, 1fr);
      gap: 0.9rem;
      font-size: 0.82rem;
    }

    .choice-grid {
      grid-template-columns: 1fr;
    }

    .attendance-footer {
      grid-template-columns: 1fr;
      align-items: start;
      gap: 0.65rem;
    }

    .attendance-footer a {
      justify-self: start;
      margin-top: 0.8rem;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .hero-photo,
    .submit-button,
    input,
    select,
    textarea {
      transition: none;
    }

    .attendance-page.motion-ready .hero-photo {
      width: var(--hero-image-width);
      margin-inline: var(--hero-image-gap);
      opacity: 1;
    }
  }
</style>
