# DBFZ Team Lab Assets

## Character Portrait Workflow

Put official raw character art here:

`public/characters/raw`

Then run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools\process_portraits.ps1
node tools\build_asset_manifest.js
```

The processor trims transparent borders, centers each fighter, and exports square `512 x 512` portraits here:

`public/characters/portraits`

Current script output is `.png` because this machine does not have a WebP encoder installed. The app accepts `.png` and `.webp`. If you later add a WebP-capable processor such as `sharp`, keep the same ids and export files like:

`public/characters/portraits/frieza.webp`

## Naming

The app uses character ids like:

- `frieza`
- `android-18`
- `dbs-broly`
- `ssj-goku`
- `goku-blue`
- `adult-gohan`

Some of your official filenames are mapped in `tools/build_asset_manifest.js`, for example:

- `Freeza.png` maps to `frieza`
- `A-Gohan.png` maps to `adult-gohan`
- `Z-Broly.png` maps to `dbz-broly`
- `Lab-coat.png` maps to `android-21-lab-coat`

If a portrait does not show, check that mapping first.

## Background

Hero/background image:

`assets/backgrounds/background.webp`

Recommended size: `1920 x 900` or wider.
