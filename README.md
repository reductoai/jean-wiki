# Jean's wiki

Jean's wiki and project tracker: a central todo page, then one chapter per system, each with an intro and current status page and a workstreams and impact page. Chapter 1 is the inference router.

## Where content lives

- `content/*.md`: the wiki's own pages. Edit them in the browser (Edit and share) or in git.
- `notion/*.md`: read-only snapshots of Jean's Notion Daily notes pages. Notion stays the source of truth; refresh a snapshot instead of editing it.
- In any page, `{{notion:<snapshot>}}` shows a whole Notion page and `{{notion:<snapshot>#<heading>}}` one section; `shift=N` demotes its headings. `{{diagram:router}}` shows the interactive router diagram.
- `lib/site.ts`: the chapters, their pages, and which Notion links stay inside the wiki.

## Access

Every page is private to the owners in `content/access.json` until an owner shares it from the editor: with anyone at Reducto, or with listed emails. Browser edits and sharing are saved in app storage (`/data`), with a history of every save; a browser edit replaces the git version of that page until restored from history.

## Run locally

```sh
bun install
WIKI_DEV_EMAIL=jean@reducto.ai bun server.ts   # http://localhost:3000
bun test
```
