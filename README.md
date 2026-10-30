# Leak Lock · 0.3.5

A local Chrome extension that hides individual posts, reels, comments and news sections. Six editable starter filters, custom phrases, manual hiding, and learning from posts you choose. No account, server, analytics or API key.

## Install

```sh
git clone https://github.com/mnhng1/leak-lock.git
cd leak-lock
npm ci
npm run build
```

Requires Node.js 22+. Open `chrome://extensions`, enable **Developer mode**, choose **Load unpacked**, and select the built `dist` directory. Open **Leak Lock → Your filters** and enable the filters you want. Refresh website tabs after installing or reloading.

For updates, run `git pull`, `npm ci`, and `npm run build`, then click **Reload** on the same extension card in Chrome. Local preferences remain compatible when the unpacked directory stays the same.

### Existing unpacked installation

An optional, gitignored `build.local.json` keeps an existing unpacked installation at its current path:

```json
{"outputDirectory":"/path/to/your/leak-lock-extension"}
```

Builds, browser tests and the preview server all use that destination. Without the override they use `dist/`. Generated bundles, dependencies, local settings and test screenshots are excluded from Git. No ZIP packaging is used.

### Golf filter (temporary built-in)

Version 0.3.7 adds **Golf content** to existing installations, initially off. Turn it on in **Your filters**. Its editable phrases cover golf/golfers/golfing, PGA/LPGA, tee times, driving ranges, putting greens, fairways and common golf hashtags. It can also receive phrases through **Hide → Add to filter**. Previously edited filters are preserved. A deleted Golf filter stays deleted after this migration.

This is a hard-coded starter requested for testing, not universal semantic AI. Text without one of its phrases can pass; video-only golf cannot be recognized. Explanations show the actual matching phrase.

### Dune movie spoilers

A disabled, editable **Dune movie spoilers** starter catches a Dune reference together with spoiler cues such as “ending”, “plot leak” or “final scene”. Spoiler-free/no-spoilers reviews are exempt. It covers title variants for Parts Two/Three; it does not infer unmarked plot disclosures or analyze video/audio. The single Filter content field includes matching text and its `Only with:` context requirement. This is best-effort text matching, not semantic detection. General Dune trailers and unrelated movie endings remain visible unless another filter matches.

For a quick demo, **Hide** immediately blurs a supported post without saving or learning anything; **Undo hide** restores it. The overlay labels it “Hidden by you” to distinguish manual actions from actual rule matches.

## The simple flow

- **Turn a filter on/off:** its checkbox.
- **Edit a starter or custom filter:** click its name, edit **Name** and **Filter content**, then **Save**. There is no nested editor or separate add-phrase box. Existing blur/collapse style remains unchanged.
- **Add a filter:** enter a name and filter content. A blank name is generated from the content. Match text can be separated by commas or lines. Existing exceptions appear as `Keep: ...`; context requirements appear as `Only with: ...` in the same content box, so editing does not silently lose them. These are text matching rules, not semantic AI.
- **Hide a missed post:** use **Hide** injected into each supported content unit. This immediately blurs it; **Undo hide** restores it. No rule match is invented.
- **Teach an existing filter:** after manually hiding a post or comment, choose **Add to filter**, select a filter, review/edit the suggested phrase, and choose **Add & enable**. This appends one phrase to that filter and enables it. Automatically filtered items already belong to a filter, so they show Reveal and Always allow instead. Future content matching that phrase is categorized under the selected filter.
- **Reveal** automatic matches for 30 seconds. Navigation, changed content and preferences can end the reveal early.
- **Always allow…** saves an author scoped to the current hostname, or an exact source domain. **Allowed & paused** lets you remove allowances and resume sites.
- The popup offers **Pause this site**. The options page has a global on/off control. Pauses and allowances persist. Manual hides are per-page session and reset on changed/recycled content or navigation.

Learning is transparent phrase matching, **not semantic AI**. It does not infer a category from video footage or arbitrary examples. A shorter distinctive phrase usually generalizes better than an entire headline; the suggested phrase is only a starting point. All phrases are visible/editable. Exceptions still apply to learned phrases. Saving a phrase never silently removes exceptions or allowances. A manual hide stays hidden until undone even if its text is exempt from automatic filtering.

Matching is literal, Unicode-aware, case-insensitive whole-word/phrase matching. The first enabled matching filter wins. Starter phrases can miss content or hide factual material: “casino” matches a factual casino story, while a spoiler without configured text can pass. Adjust the phrases and exceptions to your preferences. This is a user-controlled browsing aid, not enforcement or parental control.

## Coverage and privacy

- **Instagram desktop:** Reels use captions, hashtags and accessible metadata within bounded single-video units. Semantic image/feed articles also get post controls. Missing useful metadata means insufficient evidence; the item stays visible but can be hidden manually. No video downloading, capture, OCR, audio analysis or transcription. Playback is unchanged.
- **Reddit:** modern post components use their outer article boundary; source author/permalink/domain metadata is retained. Modern comment text and old Reddit entries are filtered separately from their reply trees. Replies remain visible when a parent comment is hidden. Comments without a reliable body boundary are skipped if they contain replies. Nested comments are evaluated independently without adding their text to the parent’s evidence.
- **Forums:** schema.org post/comment markup, Discourse posts and explicit structural boundaries.
- **News:** article cards, sections or paragraph boundaries rather than an entire long article.
- **Other sites:** conservative short article/role=article units only. Manual controls require a safe discoverable unit; arbitrary page containers are not treated as posts.

Site redesigns, closed shadow DOM, iframes and missing metadata can limit support. Universal compatibility is not claimed. Dynamic content may appear briefly before processing. Hidden videos may keep playing. The extension is not an exposure-prevention security boundary.

Processing happens in the content script. Only serializable preference mutations/status cross extension messaging; DOM elements never do. `chrome.storage.local` saves preferences. Broad HTTP(S) content-script access is necessary to inspect/treat individual items; `activeTab` identifies the popup’s current site and `storage` stores settings. No content is uploaded. No backend or external fonts/code. Browser-internal and Chrome Web Store pages are unsupported. Export/import is under **Settings**.

## Run and verify

Requires Node.js 22+.

```sh
npm ci
npm run check
npx playwright install chromium
npm run test:browser
```

`check` runs strict TypeScript, DOM/unit tests and the MV3 production build. The Chromium smoke test installs the real unpacked extension in an isolated temporary profile, uses intercepted HTTPS fixtures, and checks automatic/manual treatment, saved edits to a starter, learning to an existing filter, later automatic matching, independent comments, Reels boundaries, reveal, allowances, pause and cleanup. Screenshots are in `evidence/`.

For the interactive HTML demo:

```sh
npm run preview
```

Open `http://127.0.0.1:4178/demo.html`: **Hide → Add to filter → Gambling promotions → “jackpot club” → Add & enable**, then **Add a similar post**. The second post is automatically hidden by the learned phrase. **Reset demo** starts over. `/options.html` and `/popup.html` preview the UI. These clearly labeled previews use separate sample preferences and the same real engine; no installed-extension data is accessed. Development files are excluded from the installed folder.

Browser MCP inspected the supplied [Duolingo design-system reference](https://www.figma.com/community/file/1460744749282136015/duolingo-design-system). The interface uses its general rounded, dimensional, green-control language with system rounded fonts; no proprietary fonts, owl artwork or copied assets are bundled. This app is not affiliated with Duolingo.

Browser MCP cannot access installed `chrome-extension:` pages, so it tested the HTTP sample UI/demo; the actual extension package was tested independently in Chromium. Current live authenticated site variants still need manual checks: Reels next/previous, missing captions, expanded Reddit replies, infinite scrolling, keyboard reveal, and pause/reload behavior.

## Implementation map

`model.ts` defines serializable content, preferences and the adapter contract; `adapters/` discovers/extracts content; `classifier.ts` matches text; `engine.ts` handles mutations, SPA navigation, fingerprints and cleanup; `treatment.ts` and `manual.ts` own reversible shadow-DOM controls; `learning.ts` validates phrase additions; `background.ts` serializes preference mutations; `ui.ts` implements popup/options.

Default migration preserves old user filters/edits and installs missing disabled starter categories once. Deleted defaults are not recreated after migration. In-page learning forms preserve edits/focus/pending status across unchanged rescans. Recycled content loses old manual state. Cleanup restores prior inline styles, inert state and focus.

Dropdown panels use a short 220 ms size transition with a subtle fade, including nested settings and in-page allowance controls. Reduced-motion preferences disable these transitions; older browsers keep native instant disclosure behavior.

### Instagram stability fix (0.3.5)

Hide controls now sit outside normal layout flow; unchanged controls stay in the DOM during rescans. Hidden posts treat newly inserted children without rebuilding the overlay. Stable post links preserve manual hides across timestamp/caption updates, while a new permalink resets recycled content. Extraction separates adjacent text nodes and recognizes Instagram /p/ and /reels/ links, excluding audio-track titles from post evidence. Hovering Hide shows whether active rules found text evidence or an allowance applies.

### Reddit and simpler controls (0.3.6)

Automatically filtered posts show the matched rule, Reveal, and secondary Always allow. Add to filter appears only after a manual hide, alongside Undo hide. Comment bodies are treated independently from their replies on modern and old Reddit. A parent comment with no reliable body boundary is skipped rather than covering its whole reply tree.

### Community context and cleaner overlays (0.3.7)

Each Reddit post/comment carries its own community context from metadata or its canonical permalink. Any filter can use that context; separator/camel-case community names are normalized without topic lists. For example, r/dune supplies the Dune context for a spoiler cue, while an ordinary trailer stays visible under the default spoiler rule. Sidebars and other posts never supply community context. The overlay shows only the filter name and actions; matched-word quotes have been removed. This UI change does not add semantic AI.
