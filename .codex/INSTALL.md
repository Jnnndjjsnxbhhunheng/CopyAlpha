# Installing CopyAlpha Skills for Codex

CopyAlpha can be installed as a native skill repository, similar to `okx/onchainos-skills`.

## Recommended

```bash
npx skills add Jnnndjjsnxbhhunheng/CopyAlpha
```

This installs the repository skill(s) from `skills/`, including:

- `copyalpha-kol-factory`

## What this gives you

- Codex can discover `copyalpha-kol-factory` as a native installed skill
- You can then ask Codex to harvest a KOL and generate a new local `kol-*` skill
- Generated `kol-*` skills are installed locally and do not need a separate publish step

## After install

Restart Codex, then try:

```text
Use $copyalpha-kol-factory to harvest @inversebrah and forge a new KOL skill.
```

## Alternative: install the CLI

If you want the standalone CLI instead of the repo skill collection:

```bash
npx copyalpha@latest install-skill
```

Or, before npm publication is available everywhere:

```bash
npx github:Jnnndjjsnxbhhunheng/CopyAlpha install-skill
```
