import { css } from '@linaria/core'

export const globalTheme = css`
  :global() {
    :root {
      --color-background: #f3f0e8;
      --color-ink: #17231e;
      --color-accent: #49634e;
      --color-border: #c8c8bd;
      --color-surface: #d9d0c0;
      --color-surface-alt: #ece9e1;
      --color-surface-hover: #d7dec5;
      --color-danger: #8a3b3b;
      --font-display: Georgia, serif;
      --font-body: Inter, ui-sans-serif, system-ui, sans-serif;
    }

    body {
      margin: 0;
      background: var(--color-background);
      color: var(--color-ink);
      font-family: var(--font-body);
    }
  }
`
