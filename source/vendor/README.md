# Browser authentication dependency

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
