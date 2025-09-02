<script lang="ts">
  export let displayName: string = '';
  export let email: string = '';
</script>

<div class="watermark-container">
  <!-- Scattered watermarks across the screen -->
  <div class="watermark-text watermark-1">
    <div class="watermark-name">{displayName}</div>
    <div class="watermark-email">{email}</div>
  </div>

  <div class="watermark-text watermark-2">
    <div class="watermark-name">{displayName}</div>
    <div class="watermark-email">{email}</div>
  </div>

  <div class="watermark-text watermark-3">
    <div class="watermark-name">{displayName}</div>
    <div class="watermark-email">{email}</div>
  </div>

  <div class="watermark-text watermark-4">
    <div class="watermark-name">{displayName}</div>
    <div class="watermark-email">{email}</div>
  </div>

  <div class="watermark-text watermark-5">
    <div class="watermark-name">{displayName}</div>
    <div class="watermark-email">{email}</div>
  </div>

  <div class="watermark-text watermark-6">
    <div class="watermark-name">{displayName}</div>
    <div class="watermark-email">{email}</div>
  </div>

  <div class="watermark-text watermark-7">
    <div class="watermark-name">{displayName}</div>
    <div class="watermark-email">{email}</div>
  </div>

  <div class="watermark-text watermark-8">
    <div class="watermark-name">{displayName}</div>
    <div class="watermark-email">{email}</div>
  </div>

  <div class="watermark-text watermark-9">
    <div class="watermark-name">{displayName}</div>
    <div class="watermark-email">{email}</div>
  </div>

  <div class="watermark-text watermark-10">
    <div class="watermark-name">{displayName}</div>
    <div class="watermark-email">{email}</div>
  </div>

  <div class="watermark-text watermark-11">
    <div class="watermark-name">{displayName}</div>
    <div class="watermark-email">{email}</div>
  </div>

  <div class="watermark-text watermark-12">
    <div class="watermark-name">{displayName}</div>
    <div class="watermark-email">{email}</div>
  </div>
</div>

<style>
  .watermark-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
    z-index: 9999;
    overflow: hidden;
  }

  .watermark-text {
    position: absolute;
    transform: rotate(-45deg);
    font-family: 'Geist Sans', sans-serif;
    font-weight: 300;
    color: rgba(255, 255, 255, 0.15);
    text-align: center;
    user-select: none;
    white-space: nowrap;
  }

  .watermark-1 {
    top: 15%;
    left: 8%;
    transform: translate(-50%, -50%) rotate(-35deg);
  }

  .watermark-2 {
    top: 35%;
    right: 12%;
    transform: translate(50%, -50%) rotate(-55deg);
  }

  .watermark-3 {
    bottom: 20%;
    left: 18%;
    transform: translate(-50%, 50%) rotate(-25deg);
  }

  .watermark-4 {
    top: 65%;
    right: 25%;
    transform: translate(50%, -50%) rotate(-40deg);
  }

  .watermark-5 {
    top: 10%;
    left: 45%;
    transform: translate(-50%, -50%) rotate(-50deg);
  }

  .watermark-6 {
    bottom: 35%;
    right: 8%;
    transform: translate(50%, 50%) rotate(-30deg);
  }

  .watermark-7 {
    top: 80%;
    left: 35%;
    transform: translate(-50%, -50%) rotate(-45deg);
  }

  .watermark-8 {
    top: 25%;
    left: 70%;
    transform: translate(-50%, -50%) rotate(-38deg);
  }

  .watermark-9 {
    bottom: 10%;
    right: 40%;
    transform: translate(50%, 50%) rotate(-42deg);
  }

  .watermark-10 {
    top: 50%;
    left: 5%;
    transform: translate(-50%, -50%) rotate(-48deg);
  }

  .watermark-11 {
    top: 75%;
    right: 15%;
    transform: translate(50%, -50%) rotate(-33deg);
  }

  .watermark-12 {
    bottom: 50%;
    left: 60%;
    transform: translate(-50%, 50%) rotate(-52deg);
  }

  .watermark-name {
    font-size: clamp(1.5rem, 6vw, 4rem);
    line-height: 1;
    margin-bottom: 0.5rem;
    font-weight: 400;
  }

  .watermark-email {
    font-size: clamp(0.8rem, 3vw, 2rem);
    line-height: 1;
    opacity: 0.7;
    font-weight: 300;
  }

  /* Mobile adjustments */
  @media (max-width: 768px) {
    .watermark-name {
      font-size: clamp(1rem, 8vw, 2.5rem);
    }

    .watermark-email {
      font-size: clamp(0.6rem, 4vw, 1.5rem);
    }
  }
</style>
