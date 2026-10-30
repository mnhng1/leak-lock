# Interaction review · Leak Lock 0.3.7

| Control | Behavior |
|---|---|
| Filter list | One list of editable starter and custom filters; defaults initially off. |
| Toggle | Enables/disables one filter immediately; global state is explicitly On/Off. |
| Filter editor | One animated disclosure with only Name and Filter content, Save and Delete. No nested editor, chips or separate add-phrase form. |
| Content | Commas/lines define matches; existing Keep: exceptions and Only with: context remain editable in the same field. Text matching is not presented as semantic AI. |
| New filter | Same two fields; empty name can derive from content. |
| Manual Hide | Immediate, local to a reliable post boundary, reversible Undo hide. |
| Automatically filtered | Filter name + Reveal; Always allow stays secondary. No redundant Add to filter. |
| Manually hidden | Undo hide + optional Add to filter. No allowance menu. Existing filter + editable phrase; failed saves preserve the hide. |
| Reddit comments | Hide only the comment body; keep replies readable and independently filterable. |
| Reveal | Automatic matches return after 30 seconds. |
| Always allow | Secondary disclosure for author/domain allowances. |
| Pause | Current site only; global off disables this control with guidance. |
| Settings | Rare default-style and import/export actions stay out of the core filter flow. |
| Motion/accessibility | Short native disclosure transitions, reduced-motion override, keyboard labels/focus and retained learning forms during rescans. |

Browser MCP verified the supplied design reference, two-field editing/saving and manual Hide→Add to filter→new matching post. Real extension tests verify settings and behavior independently in Chromium. Export/import and current live authenticated variants remain manual release checks. The design uses rounded green controls and tactile borders without copying branded artwork or proprietary fonts.
