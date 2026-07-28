<script lang="ts">
  interface Props {
    name?: string;
    email?: string;
  }

  let { name = '', email = '' }: Props = $props();

  const escapeXml = (value: string) =>
    value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const TILE_W = 360;
  const TILE_H = 220;
  const ROTATE_DEG = -30;

  const buildTileUrl = (displayName: string, mail: string): string => {
    const safeName = escapeXml(displayName);
    const safeEmail = escapeXml(mail);
    const cx = TILE_W / 2;
    const nameY = TILE_H / 2 - 6;
    const emailY = TILE_H / 2 + 20;

    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" width="${TILE_W}" height="${TILE_H}">` +
      `<g transform="rotate(${ROTATE_DEG} ${cx} ${TILE_H / 2})" text-anchor="middle" fill="#ffffff">` +
      (safeName
        ? `<text x="${cx}" y="${nameY}" font-family="Inter, sans-serif" font-size="30" font-weight="600">${safeName}</text>`
        : '') +
      (safeEmail
        ? `<text x="${cx}" y="${emailY}" font-family="Inter, sans-serif" font-size="17">${safeEmail}</text>`
        : '') +
      `</g></svg>`;

    return `url('data:image/svg+xml,${encodeURIComponent(svg)}')`;
  };

  const tileUrl = $derived(buildTileUrl(name, email));
</script>

<div class="watermark" style:--wm-url={tileUrl} aria-hidden="true"></div>

<style>
  .watermark {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 30;

    background-color: var(--foreground);
    opacity: var(--riv-watermark-opacity, 0.08);

    -webkit-mask-image: var(--wm-url);
    mask-image: var(--wm-url);
    -webkit-mask-repeat: repeat;
    mask-repeat: repeat;
    -webkit-mask-size: 360px 220px;
    mask-size: 360px 220px;
  }
</style>
