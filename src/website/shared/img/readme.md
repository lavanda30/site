# Curtain Background Images

Place the following image files here for the canvas curtain renderer:

| File | Used when |
|------|-----------|
| `curtainLAVANDA.png`      | HeightPoint = "від краю до краю" (full curtain) |
| `curtainLAVANDA_niz.png`  | HeightPoint = "до тасьми" (short, tape-level) |
| `curtainLAVANDA_centr.png`| All other cases (default) |

## Canvas size
850 × 600 px (PNG recommended)

## Where to get them
Export from Salesforce Static Resources:
- `Setup → Static Resources → curtainLAVANDA → View File`

Or use any 850×600 curtain reference photo.

## Fallback
If image files are not found, `curtain-image.js` automatically draws
a procedural curtain sketch so the canvas still functions.

