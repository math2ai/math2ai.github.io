# Bundled dependencies

## Browser authentication

`supabase-2.105.0.js` is the unmodified UMD browser build of
`@supabase/supabase-js` 2.105.0, downloaded from:

https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.105.0/dist/umd/supabase.js

SHA-256: `24e8c00dc25da420ee741068b60bcdb5f62cb3598d8834058acf37ec6ee1a724`

Its MIT license is in `supabase-LICENSE`, retrieved from:
https://raw.githubusercontent.com/supabase/supabase-js/v2.105.0/LICENSE

The builder embeds this pinned dependency only when authentication is configured.
No CDN requests or npm installation are needed to use or rebuild the website.
Updates should replace the pinned file, update the hash/version and license,
and run both the authentication and course checks.

`../assets/google-signin.png` is Google's unmodified, pre-approved light,
rectangular Android/Web sign-in button at 2x resolution (rendered at 180x40).
Source: https://developers.google.com/static/identity/images/signin-assets.zip
Asset: `Android + Web/PNG @2x/Light/Theme=Light, Show text=Yes, Shape=Square, Platform=Android+Web@2x.png`
Google's branding guidelines govern this asset:
https://developers.google.com/identity/branding-guidelines

## Build-time mathematical notation

`katex-0.18.7/` contains unmodified assets from the official KaTeX npm package:

https://registry.npmjs.org/katex/-/katex-0.18.7.tgz

The npm archive integrity was verified before extraction:
`sha512-h+UCwkZ+4Jz8WQ7MLGfj7UVFrRCizGb912fwF4luGdYsC5paYG1vx+jy+KRcC/XkpjGva/P7nAWuxNnPzRvzHw==`

The selected files are the CommonJS renderer (`dist/katex.js`), minified CSS,
WOFF2 fonts and MIT license. `manifest.json` records the source and SHA-256 of
each file. The builder checks these hashes before loading the renderer.
No package installation or lifecycle scripts are needed.

Only generated HTML/MathML and CSS/fonts are included in the website; the
renderer stays a build dependency. `build_math.mjs` embeds WOFF2 font bytes in
the stylesheet and removes external/alternative font URLs. The display helper
shows original text if the fonts cannot load. Upgrades must update the pinned
directory, version references, manifest and license, then run the documented
course, math, quiz and persistence checks.
