# Verification · Leak Lock 0.3.7 · 2026-10-29

- Strict TypeScript: passed.
- Unit / DOM tests: 50 passed across five suites.
- MV3 production build: passed.
- Real unpacked extension in isolated Chromium: passed.
- Browser MCP: inspected the supplied Figma reference; verified the sample HTML demo end to end: unmatched post → Hide → Add to filter → edit phrase → save → new similar post automatically hidden under the selected filter. Adjacent safe post remains visible.
- Visual review: compact default filter list, edit disclosure, post controls and demo. Fixed a nested disclosure incorrectly showing “Close” while closed. Rounded green controls and concise copy align with the reference's general UI language.

The extension smoke test checks local settings/service-worker behavior, reversible blur/collapse, exceptions, author/domain allowances, reveal, recycled units, dynamic insertion, pause/resume, scoped Reddit comments/shadow components, Reels boundaries, image-post manual controls, edits to a default name/exception, custom filters and learning from a manually hidden post into an existing default, followed by automatic treatment of a new matching sibling.

Unit regressions cover disabled stable defaults, once-only migration and deletion preservation, deduplication/normalization, invalid phrases, failed saves, retained form/focus across rescans and manual state reset on recycled DOM.

Browser MCP blocks extension protocol URLs. Its checks used the clearly labeled HTTP sample-data preview with the actual filtering engine and isolated preview preferences. The packaged extension was independently exercised through Chromium. Live site layouts remain best effort; no semantic AI or video/audio understanding is claimed.

Run `npm ci`, `npm run check`, `npx playwright install chromium`, `npm run test:browser`. Use `npm run preview` and `/demo.html` for the repeatable manual-hide demo. See UX-REVIEW.md for the interaction audit.

Golf update: unit tests verify v1→v2 migration preserves edits/deletions, defaults off, PGA/hashtag matches and unrelated content. Chromium checks enabling Golf content, hiding a PGA Tour post, preserving the safe film review, and restoring the post when Golf is disabled. Builds now update only outputs/leak-lock-extension in place; no ZIP packaging.

Dune update: disabled starter requires both Dune context and spoiler cues. Unit and Chromium checks verify matching Dune ending posts, keeping normal Dune trailers and unrelated endings visible, and restoring posts when disabled. Migration adds Dune once without altering prior filters. Manual Hide remains a reversible immediate demo action with no learning/save requirement.

Motion update: shared native disclosure transitions, including nested panels and shadow-DOM allowances, with reduced-motion override and an auto-size support guard. Browser MCP verified open/nested/close interaction and computed 220/160 ms transition timing. All 35 unit tests, TypeScript/build and Chromium smoke checks pass.

Two-field UI: removed nested filter editor, chips, add-phrase form and per-rule style/context/exception controls. Name and Filter content are the only editing fields. Parser regressions round-trip all starter constraints and reject empty hide content. Chromium asserts exactly two fields/no nested details, edits/saves content, and verifies learning still appears in that field. Browser MCP verified and saved the simplified Golf editor. All 37 tests and extension smoke checks pass.

Instagram stability: reproduced manual Hide moving the user’s live feed. Replaced whole-feed teardown with persistent per-post controls; Hide is absolute-positioned. New unit regressions cover permalink identity, caption word boundaries/Golf evidence, control identity across repeated rescans, stable manual state and newly inserted hidden children. Chromium’s Instagram-style layout fixture asserts no post-height change, less than 2px scroll change after Hide plus noisy mutations, retained controls and a correctly hidden Golf caption. Browser MCP verified the 0.3.5 controls in the user’s live Reddit feed: manual hide remained stable through repeated observations and Undo restored the target card. The Instagram tab was no longer open; its rebuilt behavior is covered by the browser layout regression.

Reddit and contextual controls (0.3.6): automatic matches have Reveal and secondary Always allow, with no Add to filter. Manual hides offer Undo hide and Add to filter, with no allowance menu. Live inspection found parent comment shells include their replies; extraction/treatment now targets each modern comment body or old Reddit entry. Five new unit regressions and Chromium checks cover independent replies, metadata, manual comment hide/undo, retained forms across timestamp updates, and conservative skipping of unbounded parent comments. Chromium screenshots: evidence/reddit-controls.png and evidence/reddit-replies.png. Live 0.3.6 confirmation is pending reload.

Community context and cleaner overlays (0.3.7): Reddit metadata/canonical permalinks supply each item’s subreddit. Four new unit tests cover r/dune spoiler context, comments, arbitrary community names and sidebar isolation. Chromium covers a title without Dune text in r/dune matching, a safe trailer remaining visible and an unrelated community remaining visible. Overlays omit the matched-word line. Automatically filtered overlays omit Add to filter. These checks use the actual unpacked extension in an isolated profile; live 0.3.7 verification is pending extension reload.
