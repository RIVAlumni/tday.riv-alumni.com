<script lang="ts">
  import CheckIcon from '$lib/components/icons/CheckIcon.svelte';
  import { getCountdownState } from '$lib/data/countdown';
  import { TEACHER_OPTIONS } from '$lib/data/teachers';
  import {
    ArrowDown01Icon,
    ArrowLeft01Icon,
    ArrowUpRight01Icon,
    Cancel01Icon,
    Logout02Icon,
    Search01Icon,
  } from '$lib/icons';
  import * as Alert from '$lib/components/ui/alert';
  import * as Avatar from '$lib/components/ui/avatar';
  import * as Item from '$lib/components/ui/item';
  import { visitorAuth } from '$lib/firebase/auth.svelte';
  import { onMount, tick } from 'svelte';
  import { registrationFormFieldName, registrationFormSchema } from '$lib/util/registration.schema';
  import { createRegistrationRecord, RegistrationWriteError } from '$lib/firebase';
  import Button from '$lib/components/ui/button/button.svelte';

  const graduationYears = Array.from({ length: 28 }, (_, index) => 2026 - index);
  type WrittenTeacherSlot = 1 | 2;

  const userInitials = $derived.by(() => {
    const user = visitorAuth.user;
    if (!user) return '';
    const name = user.displayName?.trim();
    if (name) {
      const initials = name
        .split(/\s+/)
        .map((part) => part[0] ?? '')
        .join('')
        .slice(0, 2)
        .toUpperCase();
      if (initials) return initials;
    }
    return (user.email ?? '?').slice(0, 2).toUpperCase();
  });

  let countdown = $state(getCountdownState());
  let heroMotionReady = $state(false);
  let heroImageVisible = $state(false);
  let teacherMenuOpen = $state(false);
  let teacherSearch = $state('');
  let selectedTeachers = $state<string[]>([]);
  let teacherSearchInput = $state<HTMLInputElement | null>(null);
  let teacherSelectorElement = $state<HTMLElement | null>(null);
  let teacherSelectorTrigger = $state<HTMLButtonElement | null>(null);
  let writtenTeacherMenuOpen = $state<WrittenTeacherSlot | null>(null);
  let writtenTeacherSearches = $state<Record<WrittenTeacherSlot, string>>({ 1: '', 2: '' });
  let selectedWrittenTeachers = $state<Record<WrittenTeacherSlot, string>>({ 1: '', 2: '' });

  const filteredTeacherOptions = $derived(
    TEACHER_OPTIONS.filter((teacher) => teacher.includes(teacherSearch.trim().toUpperCase())),
  );
  const filteredTeacherOneOptions = $derived(
    TEACHER_OPTIONS.filter((teacher) =>
      teacher.includes(writtenTeacherSearches[1].trim().toUpperCase()),
    ),
  );
  const filteredTeacherTwoOptions = $derived(
    TEACHER_OPTIONS.filter((teacher) =>
      teacher.includes(writtenTeacherSearches[2].trim().toUpperCase()),
    ),
  );

  const registrationOpen = $derived(
    countdown.phase === 'pre-registration' || countdown.phase === 'vacate',
  );

  // ---- Zod validation state ---------------------------------------------
  type FieldErrors = Partial<Record<string, string>>;
  let fieldErrors = $state<FieldErrors>({});
  let submissionError = $state<string | null>(null);
  let submitting = $state(false);
  let submittedId = $state<string | null>(null);

  function clearFieldError(field: string) {
    if (fieldErrors[field]) {
      fieldErrors = { ...fieldErrors, [field]: undefined };
    }
  }

  async function toggleTeacherMenu() {
    teacherMenuOpen = !teacherMenuOpen;
    if (teacherMenuOpen) {
      closeWrittenTeacherMenu();
      await tick();
      teacherSearchInput?.focus();
    } else {
      teacherSearch = '';
    }
  }

  function toggleTeacherSelection(teacher: string) {
    selectedTeachers = selectedTeachers.includes(teacher)
      ? selectedTeachers.filter((selectedTeacher) => selectedTeacher !== teacher)
      : [...selectedTeachers, teacher];
    clearFieldError('visiting_teachers');
  }

  function removeTeacher(teacher: string) {
    selectedTeachers = selectedTeachers.filter((selectedTeacher) => selectedTeacher !== teacher);
    clearFieldError('visiting_teachers');
  }

  function writtenTeacherField(slot: WrittenTeacherSlot) {
    return `teacher${slot}_name` as const;
  }

  function closeWrittenTeacherMenu() {
    if (writtenTeacherMenuOpen) {
      writtenTeacherSearches[writtenTeacherMenuOpen] = '';
      writtenTeacherMenuOpen = null;
    }
  }

  async function toggleWrittenTeacherMenu(slot: WrittenTeacherSlot) {
    const opening = writtenTeacherMenuOpen !== slot;
    closeWrittenTeacherMenu();
    teacherMenuOpen = false;
    teacherSearch = '';
    if (!opening) return;

    writtenTeacherMenuOpen = slot;
    await tick();
    document.getElementById(`teacher-${slot}-search`)?.focus();
  }

  function selectWrittenTeacher(slot: WrittenTeacherSlot, teacher: string) {
    selectedWrittenTeachers[slot] = teacher;
    clearFieldError(writtenTeacherField(slot));
    closeWrittenTeacherMenu();
  }

  function removeWrittenTeacher(slot: WrittenTeacherSlot) {
    selectedWrittenTeachers[slot] = '';
    clearFieldError(writtenTeacherField(slot));
  }

  function handleDocumentPointerDown(event: PointerEvent) {
    if (
      teacherMenuOpen &&
      event.target instanceof Node &&
      !teacherSelectorElement?.contains(event.target)
    ) {
      teacherMenuOpen = false;
      teacherSearch = '';
    }

    if (writtenTeacherMenuOpen && event.target instanceof Node) {
      const selector = document.querySelector(
        `[data-written-teacher-selector="${writtenTeacherMenuOpen}"]`,
      );
      if (!selector?.contains(event.target)) {
        closeWrittenTeacherMenu();
      }
    }
  }

  function handleTeacherSelectorKeydown(event: KeyboardEvent) {
    if (event.key !== 'Escape') return;

    if (writtenTeacherMenuOpen) {
      event.preventDefault();
      const slot = writtenTeacherMenuOpen;
      closeWrittenTeacherMenu();
      document.getElementById(`teacher-${slot}-trigger`)?.focus();
      return;
    }

    if (!teacherMenuOpen) return;
    event.preventDefault();
    teacherMenuOpen = false;
    teacherSearch = '';
    teacherSelectorTrigger?.focus();
  }

  function scrollToElement(element: Element, block: ScrollLogicalPosition = 'center') {
    element.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block,
    });
  }

  function scrollToConfirmation(element: Element) {
    window.requestAnimationFrame(() => {
      const maximumScrollTop = Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight,
      );
      const elementTop = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: Math.min(elementTop, maximumScrollTop), behavior: 'auto' });
    });
  }

  function focusFormControl(control: HTMLElement) {
    const scrollTarget = control.closest('.form-field, .consent-confirmation') ?? control;
    control.focus({ preventScroll: true });
    scrollToElement(scrollTarget);
  }

  function handleInvalid(event: Event) {
    const form = event.currentTarget;
    const control = event.target;

    if (
      !(form instanceof HTMLFormElement) ||
      !(control instanceof HTMLElement) ||
      control !== form.querySelector(':invalid')
    ) {
      return;
    }

    window.requestAnimationFrame(() => focusFormControl(control));
  }

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    submissionError = null;

    const form = event.currentTarget as HTMLFormElement;
    const formData = new FormData(form);

    const raw = {
      email: visitorAuth.user?.email ?? '',
      full_name: (formData.get('full_name') as string) ?? '',
      contact_number: (formData.get('contact_number') as string) ?? '',
      graduating_year: (formData.get('graduating_year') as string) ?? '',
      visiting_teachers: formData.getAll('visiting_teachers').map((teacher) => String(teacher)),
      teacher1_name: (formData.get('teacher1_name') as string) ?? '',
      teacher1_message: (formData.get('teacher1_message') as string) ?? '',
      teacher2_name: (formData.get('teacher2_name') as string) ?? '',
      teacher2_message: (formData.get('teacher2_message') as string) ?? '',
    };

    const result = registrationFormSchema.safeParse(raw);

    if (!result.success) {
      const errors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const field = registrationFormFieldName(issue.path);
        if (!errors[field]) {
          errors[field] = issue.message;
        }
      }
      fieldErrors = errors;
      await tick();
      const firstInvalidField = Object.keys(errors)[0];
      const firstInvalidControl =
        firstInvalidField === 'visiting_teachers'
          ? teacherSelectorTrigger
          : firstInvalidField === 'teacher1_name'
            ? document.getElementById('teacher-1-trigger')
            : firstInvalidField === 'teacher2_name'
              ? document.getElementById('teacher-2-trigger')
              : form.elements.namedItem(firstInvalidField);
      if (firstInvalidControl instanceof HTMLElement) {
        focusFormControl(firstInvalidControl);
      }
      return;
    }

    fieldErrors = {};
    submitting = true;

    console.debug('[register] zod output', JSON.parse(JSON.stringify(result.data)));

    try {
      const id = await createRegistrationRecord(result.data);
      submittedId = id;
      await tick();
      const confirmation = document.getElementById('registration-success');
      if (confirmation) {
        scrollToConfirmation(confirmation);
      }
    } catch (err) {
      if (err instanceof RegistrationWriteError) {
        submissionError = err.message;
      } else {
        submissionError = 'An unexpected error occurred. Please try again.';
      }
    } finally {
      submitting = false;
    }
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

  async function handleSignOut() {
    authError = null;
    try {
      await visitorAuth.signOut();
    } catch (err) {
      console.error('Google sign-out failed:', err);
      authError = 'We could not sign you out. Please try again.';
    }
  }

  onMount(() => {
    visitorAuth.init();
    document.addEventListener('pointerdown', handleDocumentPointerDown);
    const countdownInterval = window.setInterval(() => {
      countdown = getCountdownState();
    }, 1_000);
    heroMotionReady = true;
    const heroAnimationFrame = window.requestAnimationFrame(() => {
      heroImageVisible = true;
    });

    return () => {
      document.removeEventListener('pointerdown', handleDocumentPointerDown);
      window.clearInterval(countdownInterval);
      window.cancelAnimationFrame(heroAnimationFrame);
    };
  });
</script>

<svelte:window onkeydown={handleTeacherSelectorKeydown} />

<svelte:head>
  <title>Teachers' Day Alumni Visitations 2026 - RIVA x RIVPS</title>
  <meta
    name="description"
    content="RIVA Teachers' Day 2026 event details and pre-registration. Reconnect and thank the teachers who helped shape your life." />
  <meta
    name="robots"
    content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
  <meta
    name="keywords"
    content="Teachers' Day 2026, alumni visitations, Rivervale Primary School, RIVPS, RIVA, alumni event, Teachers' Day registration" />
  <meta
    name="publisher"
    content="Rivervale Primary School Alumni Association" />
  <link
    rel="canonical"
    href="https://tday.riv-alumni.com/register" />
  <meta
    property="og:site_name"
    content="RIVA" />
  <meta
    property="og:title"
    content="Teachers' Day Alumni Visitations 2026 - RIVA x RIVPS" />
  <meta
    property="og:description"
    content="RIVA Teachers' Day 2026 event details and pre-registration. Reconnect and thank the teachers who helped shape your life." />
  <meta
    property="og:type"
    content="website" />
  <meta
    property="og:url"
    content="https://tday.riv-alumni.com/register" />
  <meta
    property="og:image"
    content="https://tday.riv-alumni.com/images/registration-hero-d55-0081.webp" />
  <meta
    property="og:image:type"
    content="image/webp" />
  <meta
    property="og:image:width"
    content="1600" />
  <meta
    property="og:image:height"
    content="1066" />
  <meta
    property="og:image:alt"
    content="RIVA volunteers welcoming visitors during a previous school event" />
  <meta
    name="twitter:card"
    content="summary_large_image" />
  <meta
    name="twitter:title"
    content="Teachers' Day Alumni Visitations 2026 - RIVA x RIVPS" />
  <meta
    name="twitter:description"
    content="RIVA Teachers' Day 2026 event details and pre-registration. Reconnect and thank the teachers who helped shape your life." />
  <meta
    name="twitter:image"
    content="https://tday.riv-alumni.com/images/registration-hero-d55-0081.webp" />
  <meta
    name="twitter:image:alt"
    content="RIVA volunteers welcoming visitors during a previous school event" />
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
            -
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
      {:else if submittedId}
        <section
          id="registration-success"
          class="confirmation"
          aria-live="polite">
          <p
            class="confirmation-mark"
            aria-hidden="true">
            ✓
          </p>
          <p class="section-kicker"><span aria-hidden="true"></span> Registration complete</p>
          <h3>You're all set.</h3>
          <p>
            Your registration has been recorded. We will send your event ticket to
            <strong>{visitorAuth.user?.email}</strong>.
          </p>
          <p class="text-xs text-muted-foreground">
            Reference: <code class="font-mono">{submittedId}</code>
          </p>
          <a href="/#the-visit">
            View event details
            <ArrowUpRight01Icon
              size={16}
              strokeWidth={1.8} />
          </a>
        </section>
      {:else}
        <form
          onsubmit={handleSubmit}
          oninvalidcapture={handleInvalid}>
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
                <p class="google-auth-status">Checking your Google account...</p>
              {:else if visitorAuth.user?.email}
                <div class="flex items-center gap-3">
                  <Item.Root variant="outline">
                    <Item.Media>
                      <Avatar.Root class="size-10">
                        <Avatar.Image
                          src={visitorAuth.user.photoURL ?? undefined}
                          alt={visitorAuth.user.displayName ?? 'Visitor'} />
                        <Avatar.Fallback>{userInitials}</Avatar.Fallback>
                      </Avatar.Root>
                    </Item.Media>

                    <Item.Content>
                      <Item.Title>
                        {`You are signed in as ${visitorAuth.user.displayName}` ||
                          'You are signed in'}
                      </Item.Title>
                      <Item.Description class="line-clamp-none wrap-break-word">
                        We will send the event ticket to
                        <strong>{visitorAuth.user.email}.</strong>
                      </Item.Description>
                      <Item.Description>Use the logout button to switch accounts.</Item.Description>
                    </Item.Content>
                    <Item.Actions>
                      <Button
                        size="icon"
                        variant="outline"
                        class="rounded-full cursor-pointer"
                        aria-label="Sign out"
                        onclick={handleSignOut}>
                        <Logout02Icon />
                      </Button>
                    </Item.Actions>
                  </Item.Root>
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
                  name="full_name"
                  autocomplete="name"
                  maxlength="120"
                  aria-describedby="full-name-note"
                  oninput={() => clearFieldError('full_name')}
                  required />
                {#if fieldErrors['full_name']}
                  <small class="field-error">{fieldErrors['full_name']}</small>
                {/if}
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
                  type="text"
                  name="contact_number"
                  autocomplete="tel"
                  inputmode="numeric"
                  placeholder="81234567"
                  maxlength="8"
                  aria-describedby="contact-number-note"
                  oninput={() => clearFieldError('contact_number')}
                  required />
                {#if fieldErrors['contact_number']}
                  <small class="field-error">{fieldErrors['contact_number']}</small>
                {/if}
                <small
                  id="contact-number-note"
                  class="field-note">
                  Enter your mobile phone number contactable via WhatsApp.
                </small>
              </label>

              <label class="form-field">
                <span>Graduating year</span>
                <div class="select-control">
                  <select
                    name="graduating_year"
                    onchange={() => clearFieldError('graduating_year')}
                    required>
                    <option value="">Select year</option>
                    {#each graduationYears as year (year)}
                      <option value={String(year)}>{year}</option>
                    {/each}
                  </select>
                  <ArrowDown01Icon
                    size={18}
                    strokeWidth={1.8} />
                </div>
                {#if fieldErrors['graduating_year']}
                  <small class="field-error">{fieldErrors['graduating_year']}</small>
                {/if}
              </label>

              <fieldset class="form-field teacher-field">
                <legend>Which teacher(s) would you like to meet?</legend>
                <div
                  bind:this={teacherSelectorElement}
                  class="teacher-selector"
                  data-invalid={fieldErrors['visiting_teachers'] ? 'true' : undefined}>
                  <button
                    bind:this={teacherSelectorTrigger}
                    class="teacher-selector-trigger"
                    type="button"
                    aria-expanded={teacherMenuOpen}
                    aria-controls="visiting-teacher-menu"
                    aria-describedby={fieldErrors['visiting_teachers']
                      ? 'teachers-disclaimer teachers-help visiting-teachers-error'
                      : 'teachers-disclaimer teachers-help'}
                    onclick={toggleTeacherMenu}>
                    <span>
                      {selectedTeachers.length === 0
                        ? 'Select teachers'
                        : `${selectedTeachers.length} teacher${selectedTeachers.length === 1 ? '' : 's'} selected`}
                    </span>
                    <ArrowDown01Icon
                      size={18}
                      strokeWidth={1.8} />
                  </button>

                  {#if selectedTeachers.length > 0}
                    <ul
                      class="selected-teachers"
                      aria-label="Selected teachers">
                      {#each selectedTeachers as teacher (teacher)}
                        <li>
                          <span>{teacher}</span>
                          <button
                            type="button"
                            aria-label={`Remove ${teacher}`}
                            onclick={() => removeTeacher(teacher)}>
                            <Cancel01Icon
                              size={14}
                              strokeWidth={2} />
                          </button>
                        </li>
                      {/each}
                    </ul>
                  {/if}

                  {#if teacherMenuOpen}
                    <div
                      id="visiting-teacher-menu"
                      class="teacher-menu">
                      <label class="teacher-search">
                        <span class="sr-only">Search teachers</span>
                        <Search01Icon
                          size={18}
                          strokeWidth={1.8} />
                        <input
                          bind:this={teacherSearchInput}
                          type="search"
                          value={teacherSearch}
                          placeholder="Search teachers"
                          autocomplete="off"
                          oninput={(event) => (teacherSearch = event.currentTarget.value)} />
                      </label>

                      <div
                        class="teacher-options"
                        aria-label="Teacher options">
                        {#each filteredTeacherOptions as teacher (teacher)}
                          <label class="teacher-option">
                            <input
                              type="checkbox"
                              checked={selectedTeachers.includes(teacher)}
                              onchange={() => toggleTeacherSelection(teacher)} />
                            <span
                              class="teacher-option-checkbox"
                              aria-hidden="true">
                              <CheckIcon
                                size={15}
                                strokeWidth={2.4} />
                            </span>
                            <span>{teacher}</span>
                          </label>
                        {:else}
                          <p class="teacher-empty">No teachers match your search.</p>
                        {/each}
                      </div>
                    </div>
                  {/if}
                </div>

                {#each selectedTeachers as teacher (teacher)}
                  <input
                    type="hidden"
                    name="visiting_teachers"
                    value={teacher} />
                {/each}
                {#if fieldErrors['visiting_teachers']}
                  <small
                    id="visiting-teachers-error"
                    class="field-error">{fieldErrors['visiting_teachers']}</small>
                {/if}
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
              </fieldset>
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
              <fieldset class="form-field teacher-field written-teacher-field">
                <legend>Name of Teacher 1</legend>
                <div
                  class="teacher-selector"
                  data-written-teacher-selector="1"
                  data-invalid={fieldErrors['teacher1_name'] ? 'true' : undefined}>
                  <button
                    id="teacher-1-trigger"
                    class="teacher-selector-trigger"
                    type="button"
                    aria-expanded={writtenTeacherMenuOpen === 1}
                    aria-controls="teacher-1-menu"
                    aria-describedby={fieldErrors['teacher1_name']
                      ? 'teacher-one-help teacher-one-error'
                      : 'teacher-one-help'}
                    onclick={() => toggleWrittenTeacherMenu(1)}>
                    <span>{selectedWrittenTeachers[1] || 'Select a teacher'}</span>
                    <ArrowDown01Icon
                      size={18}
                      strokeWidth={1.8} />
                  </button>

                  {#if selectedWrittenTeachers[1]}
                    <ul
                      class="selected-teachers"
                      aria-label="Selected teacher for message one">
                      <li>
                        <span>{selectedWrittenTeachers[1]}</span>
                        <button
                          type="button"
                          aria-label={`Remove ${selectedWrittenTeachers[1]}`}
                          onclick={() => removeWrittenTeacher(1)}>
                          <Cancel01Icon
                            size={14}
                            strokeWidth={2} />
                        </button>
                      </li>
                    </ul>
                  {/if}

                  {#if writtenTeacherMenuOpen === 1}
                    <div
                      id="teacher-1-menu"
                      class="teacher-menu">
                      <label class="teacher-search">
                        <span class="sr-only">Search teachers for message one</span>
                        <Search01Icon
                          size={18}
                          strokeWidth={1.8} />
                        <input
                          id="teacher-1-search"
                          type="search"
                          value={writtenTeacherSearches[1]}
                          placeholder="Search teachers"
                          autocomplete="off"
                          oninput={(event) =>
                            (writtenTeacherSearches[1] = event.currentTarget.value)} />
                      </label>

                      <div
                        class="teacher-options"
                        aria-label="Teacher options for message one">
                        {#each filteredTeacherOneOptions as teacher (teacher)}
                          <label class="teacher-option">
                            <input
                              type="radio"
                              name="teacher1_option"
                              checked={selectedWrittenTeachers[1] === teacher}
                              onchange={() => selectWrittenTeacher(1, teacher)} />
                            <span
                              class="teacher-option-checkbox"
                              aria-hidden="true">
                              <CheckIcon
                                size={15}
                                strokeWidth={2.4} />
                            </span>
                            <span>{teacher}</span>
                          </label>
                        {:else}
                          <p class="teacher-empty">No teachers match your search.</p>
                        {/each}
                      </div>
                    </div>
                  {/if}
                </div>

                <input
                  type="hidden"
                  name="teacher1_name"
                  value={selectedWrittenTeachers[1]} />
                {#if fieldErrors['teacher1_name']}
                  <small
                    id="teacher-one-error"
                    class="field-error">{fieldErrors['teacher1_name']}</small>
                {/if}
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
              </fieldset>

              <label class="form-field">
                <span>Message for Teacher 1</span>
                <textarea
                  name="teacher1_message"
                  rows="6"
                  maxlength="10000"
                  oninput={() => clearFieldError('teacher1_message')}
                  placeholder="Write your message"></textarea>
                {#if fieldErrors['teacher1_message']}
                  <small class="field-error">{fieldErrors['teacher1_message']}</small>
                {/if}
              </label>

              <fieldset class="form-field teacher-field written-teacher-field">
                <legend>Name of Teacher 2</legend>
                <div
                  class="teacher-selector"
                  data-written-teacher-selector="2"
                  data-invalid={fieldErrors['teacher2_name'] ? 'true' : undefined}>
                  <button
                    id="teacher-2-trigger"
                    class="teacher-selector-trigger"
                    type="button"
                    aria-expanded={writtenTeacherMenuOpen === 2}
                    aria-controls="teacher-2-menu"
                    aria-describedby={fieldErrors['teacher2_name']
                      ? 'teacher-two-help teacher-two-error'
                      : 'teacher-two-help'}
                    onclick={() => toggleWrittenTeacherMenu(2)}>
                    <span>{selectedWrittenTeachers[2] || 'Select a teacher'}</span>
                    <ArrowDown01Icon
                      size={18}
                      strokeWidth={1.8} />
                  </button>

                  {#if selectedWrittenTeachers[2]}
                    <ul
                      class="selected-teachers"
                      aria-label="Selected teacher for message two">
                      <li>
                        <span>{selectedWrittenTeachers[2]}</span>
                        <button
                          type="button"
                          aria-label={`Remove ${selectedWrittenTeachers[2]}`}
                          onclick={() => removeWrittenTeacher(2)}>
                          <Cancel01Icon
                            size={14}
                            strokeWidth={2} />
                        </button>
                      </li>
                    </ul>
                  {/if}

                  {#if writtenTeacherMenuOpen === 2}
                    <div
                      id="teacher-2-menu"
                      class="teacher-menu">
                      <label class="teacher-search">
                        <span class="sr-only">Search teachers for message two</span>
                        <Search01Icon
                          size={18}
                          strokeWidth={1.8} />
                        <input
                          id="teacher-2-search"
                          type="search"
                          value={writtenTeacherSearches[2]}
                          placeholder="Search teachers"
                          autocomplete="off"
                          oninput={(event) =>
                            (writtenTeacherSearches[2] = event.currentTarget.value)} />
                      </label>

                      <div
                        class="teacher-options"
                        aria-label="Teacher options for message two">
                        {#each filteredTeacherTwoOptions as teacher (teacher)}
                          <label class="teacher-option">
                            <input
                              type="radio"
                              name="teacher2_option"
                              checked={selectedWrittenTeachers[2] === teacher}
                              onchange={() => selectWrittenTeacher(2, teacher)} />
                            <span
                              class="teacher-option-checkbox"
                              aria-hidden="true">
                              <CheckIcon
                                size={15}
                                strokeWidth={2.4} />
                            </span>
                            <span>{teacher}</span>
                          </label>
                        {:else}
                          <p class="teacher-empty">No teachers match your search.</p>
                        {/each}
                      </div>
                    </div>
                  {/if}
                </div>

                <input
                  type="hidden"
                  name="teacher2_name"
                  value={selectedWrittenTeachers[2]} />
                {#if fieldErrors['teacher2_name']}
                  <small
                    id="teacher-two-error"
                    class="field-error">{fieldErrors['teacher2_name']}</small>
                {/if}
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
              </fieldset>

              <label class="form-field">
                <span>Message for Teacher 2</span>
                <textarea
                  name="teacher2_message"
                  rows="6"
                  maxlength="10000"
                  oninput={() => clearFieldError('teacher2_message')}
                  placeholder="Write your message"></textarea>
                {#if fieldErrors['teacher2_message']}
                  <small class="field-error">{fieldErrors['teacher2_message']}</small>
                {/if}
              </label>
            </div>
          </section>

          {#if submissionError}
            <Alert.Root variant="destructive">
              <Alert.Description>{submissionError}</Alert.Description>
            </Alert.Root>
          {/if}
          <button
            class="submit-button"
            type="submit"
            disabled={submitting}>
            <span>{submitting ? 'Submitting...' : 'Submit registration'}</span>
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

  .teacher-field {
    margin: 0;
    padding: 0;
    border: 0;
  }

  .teacher-field > legend {
    margin-bottom: 0.7rem;
  }

  .select-control {
    position: relative;
  }

  .select-control select {
    padding-right: 3rem;
    appearance: none;
  }

  .select-control > :global(svg) {
    position: absolute;
    top: 50%;
    right: 1rem;
    pointer-events: none;
    transform: translateY(-50%);
  }

  .teacher-selector {
    display: grid;
    gap: 0.7rem;
  }

  .teacher-selector-trigger {
    width: 100%;
    min-height: 3.5rem;
    padding: 0 1rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    border: 1px solid rgba(255, 255, 255, 0.13);
    border-radius: 0;
    background: var(--surface);
    color: var(--paper);
    text-align: left;
    font: inherit;
    font-size: 1rem;
    cursor: pointer;
    transition:
      border-color 180ms ease,
      background 180ms ease;
  }

  .teacher-selector-trigger[aria-expanded='true'],
  .teacher-selector-trigger:focus-visible,
  .teacher-selector[data-invalid='true'] .teacher-selector-trigger {
    border-color: var(--red);
    background: rgba(235, 47, 6, 0.07);
    outline: 2px solid var(--red);
    outline-offset: -2px;
  }

  .teacher-selector-trigger :global(svg) {
    flex: 0 0 auto;
    transition: transform 180ms ease;
  }

  .teacher-selector-trigger[aria-expanded='true'] :global(svg) {
    transform: rotate(180deg);
  }

  .selected-teachers {
    margin: 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    list-style: none;
  }

  .selected-teachers li {
    min-height: 2rem;
    padding: 0.35rem 0.45rem 0.35rem 0.65rem;
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    border: 1px solid rgba(235, 47, 6, 0.45);
    background: rgba(235, 47, 6, 0.1);
    font-size: 0.72rem;
    font-weight: 650;
  }

  .selected-teachers button {
    width: 1.35rem;
    height: 1.35rem;
    padding: 0;
    display: grid;
    place-items: center;
    border: 0;
    background: transparent;
    color: var(--paper);
    cursor: pointer;
  }

  .selected-teachers button:focus-visible {
    outline: 2px solid var(--red);
    outline-offset: 2px;
  }

  .teacher-menu {
    border: 1px solid rgba(255, 255, 255, 0.18);
    background: #111;
  }

  .teacher-search {
    min-height: 3.5rem;
    padding-inline: 1rem;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
    gap: 0.75rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.14);
    color: var(--muted);
  }

  .teacher-search input {
    min-height: 3.4rem;
    padding: 0;
    border: 0;
    background: transparent;
  }

  .teacher-search input:focus,
  .teacher-search input:focus-visible {
    border: 0;
    background: transparent;
    outline: 0;
  }

  .teacher-search:has(input:focus-visible) {
    outline: 2px solid var(--red);
    outline-offset: -2px;
  }

  .teacher-options {
    max-height: 18rem;
    padding: 0.4rem;
    display: grid;
    gap: 0.2rem;
    overflow-y: auto;
  }

  .teacher-option {
    position: relative;
    min-height: 2.85rem;
    padding: 0.65rem 0.75rem;
    display: grid;
    grid-template-columns: 1.2rem minmax(0, 1fr);
    align-items: center;
    gap: 0.75rem;
    color: #e7e7e2;
    font-size: 0.78rem;
    font-weight: 600;
    cursor: pointer;
  }

  .teacher-option:hover,
  .teacher-option:has(input:checked) {
    background: rgba(235, 47, 6, 0.1);
  }

  .teacher-option:has(input:focus-visible) {
    outline: 2px solid var(--red);
    outline-offset: -2px;
  }

  .teacher-option input {
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

  .teacher-option-checkbox {
    width: 1.2rem;
    height: 1.2rem;
    display: grid;
    place-items: center;
    border: 1px solid rgba(255, 255, 255, 0.36);
    color: #fff;
  }

  .teacher-option-checkbox :global(svg) {
    opacity: 0;
  }

  .teacher-option input:checked + .teacher-option-checkbox {
    border-color: var(--red);
    background: var(--red);
  }

  .teacher-option input:checked + .teacher-option-checkbox :global(svg) {
    opacity: 1;
  }

  .teacher-empty {
    margin: 0;
    padding: 1.2rem 0.75rem;
    color: var(--muted);
    font-size: 0.78rem;
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
    color-scheme: dark;
  }

  .form-field.is-disabled {
    opacity: 0.42;
  }

  .field-error {
    color: var(--red);
    font-size: 0.72rem;
    font-weight: 600;
    line-height: 1.4;
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
    min-height: 0;
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
    overflow-wrap: anywhere;
    word-break: break-word;
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
