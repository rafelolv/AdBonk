# AdBonk mascot

The mark is a mischievous purple creature bonking an AD tile with a golden mallet. Use the same character across the extension and README rather than introducing unrelated symbols.

- `adbonk-mascot.png`: full-resolution source artwork.
- `adbonk-banner.svg`: accessible wordmark and embedded 256-pixel mascot export. The embedded image keeps the banner self-contained on GitHub.
- `adbonk-icon.png`: transparent close-up of the same mascot with a mallet, designed for small extension icons. Keep the alpha channel when exporting; do not add a square background.
- `../extension/icons/16.png`, `32.png`, `48.png`, and `128.png`: resampled exports of the transparent icon for browser toolbars, popup, and extension details. The full scene stays in the README.

Artwork generated with the built-in image generation tool on 2026-10-11. PNG exports are resampled from the saved source; no changes to blocking code are required. Increment the extension version and rebuild both browser packages when publishing new icon exports.

## Generation prompt

### Transparent extension icon

Use case: identity-preserve / logo-brand. Edit the referenced AdBonk mascot into a compact browser extension icon with a genuinely TRANSPARENT background. Preserve the exact character identity: mischievous round purple head, two blunt pointy ears, confident playful eyebrows, white eyes and open smiling mouth, golden chunky mallet, thick dark plum outline. Change composition to a close-up mascot head taking most of the square, with a simplified golden mallet beside the cheek; no torso, legs, AD tile, debris or impact stars. The existing full scene will remain on the README; this asset is specifically the small toolbar and popup mark. Strong simple shapes, large expressive eyes, no tiny details, readable at 16px, minimal flat colors, reduce highlights and shading. Fill about 90% of the canvas but preserve clean padding around ears and mallet. All contours complete, no cut-off ears or hammer. No square backdrop, no gradient backdrop, no badge, no border frame, no drop shadow outside the silhouette, no text, no watermark, no checkerboard painted into the image. True alpha transparency in the PNG. One square icon only.

### Full mascot scene

Use case: logo-brand. Create ONE finished square app-icon illustration for AdBonk, an independent Twitch ad blocker. New mascot direction replacing an abstract hammer icon: a mischievous little purple bonk creature, oversized rounded head with two short blunt horn-like ears, confident expressive face, simple compact body, wielding a chunky golden cartoon mallet and visibly smashing a small advertising tile. The creature must be distinctive and memorable, with strong silhouette and readable eyes even in a browser toolbar. The ad tile has exactly the letters 'AD' in bold dark uppercase and a visibly squashed top edge at the point of impact; one small simple impact star ties the hammer and tile together. Friendly irreverent sticker illustration, professional cohesive brand mascot, thick dark outlines, minimal flat color shapes, no fine texture, no 3D, no gradients, no glossy generic AI gaming logo look. Use the existing AdBonk purple and warm golden-yellow brand colors on a solid very dark plum background. Keep the mascot face and hammer large; avoid a complex scene or tiny limbs, no borders or written wordmark, no Twitch glyph or logos, no watermark, no extra panels. Center a single bold compact composition with generous safe margins on all edges, suitable as one extension icon and later a README mascot. High-quality clean vector-like raster design. Output a single square image.
