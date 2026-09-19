# ORF design tokens

Shared CSS custom properties for `apps/web` and `apps/admin`.

Source of truth: `tokens.css` in this package.

Language: Liquid Glass / iOS HIG fashion — frosted chrome, large radii, pill CTAs, soft shadows. Glass is for chrome surfaces only; product imagery stays opaque.

Turbopack cannot resolve CSS across the monorepo `file:` symlink yet. After editing here, mirror into both apps:

```bash
cp packages/design-tokens/tokens.css apps/web/src/styles/tokens.css
cp packages/design-tokens/tokens.css apps/admin/src/styles/tokens.css
```

Do not redefine brand colors in feature CSS.
