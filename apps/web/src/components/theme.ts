import { css } from '@linaria/core'

/**
 * The palette and the display face follow the brand banner in `src/assets/Banners/`: a white
 * geometric wordmark over near black fabric. The store is therefore monochrome, and colour only
 * appears in the product photography and in the error state.
 */
export const globalTheme = css`
  :global() {
    :root {
      --color-background: #f5f4f2;
      --color-ink: #121212;
      --color-accent: #6f6d69;
      --color-border: #d3d1cd;
      --color-surface: #e4e2de;
      --color-surface-alt: #eceae6;
      --color-surface-hover: #dbd8d3;
      --color-danger: #a03232;
      --font-display: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      --font-body: Inter, ui-sans-serif, system-ui, sans-serif;
      /* The wordmark is bold and tightly set; display headings borrow both traits. */
      --font-display-weight: 700;
      --font-display-tracking: -0.04em;
    }

    body {
      margin: 0;
      background: var(--color-background);
      color: var(--color-ink);
      font-family: var(--font-body);
    }
  }
`
