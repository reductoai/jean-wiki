# Jean's wiki

Jean's wiki and project tracker. The Todo page links every workstream. After it comes one chapter per system, starting with the inference router: an intro and status page, a workstreams and impact page, and one page per workstream.

## Edit

- **Pages:** `content/<chapter>/<page>.md`, in Markdown. `{{diagram:router}}` embeds the interactive router diagram (`public/diagram.js`).
- **Chapters and the sidebar:** `lib/site.ts`. Add a page there and add its Markdown file in `content/`. Each page's `sources` list (Notion pages and `reductoai/api` files) shows at the bottom of the page.
- **Style:** `public/wiki.css`, which uses Reducto's tokens (plum, honey, pine) and Geist.
- **In the browser:** Jean can use Edit and share, and New page in the sidebar. Those edits are saved in app storage (`$HOSTING_DATA_DIR/pages/`, plus `custom-pages.json`), not in git, and they override the git copy. Before you change a page in git, copy any newer browser edit of it into `content/` first.
- **Notion snapshots:** `notion/*.md` are read only. Never edit Jean's Notion pages.

Run `bun test`, then open a PR. Get Jean's approval before you merge.

## Live content edits (no deploy)

Page content lives in app storage, not git. A save shows on the next page load, with no deploy. Jean saves from the browser (Edit and share, New page). Agents save through the same API:

```sh
W=http://localhost:3200                          # the running wiki
TOK=$(cat $HOSTING_DATA_DIR/agent-token)         # created on first start, mode 600
H=(-H "Authorization: Bearer $TOK" -H "X-Agent-Name: <your session>")
curl "${H[@]}" $W/api/pages                                       # list pages
curl "${H[@]}" "$W/api/page?page=inference-router/eu-r1"           # read one page
curl "${H[@]}" -XPOST "$W/api/save?page=inference-router/eu-r1" -d '{"markdown":"# EU R-1 ..."}'
curl "${H[@]}" -XPOST $W/api/new-page -d '{"chapter":1,"title":"Router runbook"}'
```

Every save keeps a version in history, labeled with the agent's name. The Devin App URL rejects requests from outside Devin sign-in (HTTP 401), so an agent on another box can't call it. Instead, ask the session that manages the app (`devin_session_search`, `has_app`) to make the call. Once the wiki moves to Reducto Hosting, agents can call the hosted URL directly with the same token.

Agents on any box can also change pages in `content/` through a PR here (`main` requires one). Within 30 s of a merge, the running wiki pulls `main` (`WIKI_GIT_SYNC=github`), and open pages refresh on their own. A browser or API save of a page still wins over its git copy. Pulled CSS and browser JavaScript under `public/` go live at once, but server code (`server.ts`, `lib/`) only changes after a redeploy, so ship a change that touches both with a redeploy.

The repo holds only code and layout. Copy browser and agent edits from `$HOSTING_DATA_DIR/pages/` into `content/` when you want them in git.

## Run locally

```sh
bun install
WIKI_DEV_EMAIL=jean@reducto.ai PORT=3000 bun server.ts
```

## Redeploy

Today the site is the Devin App `jean-wiki` at https://jean-wiki--jk7mnqxh.preview.devinapps.com. Only the session that manages the app can deploy it.

1. Find that session with `devin_session_search` (`has_app`) and ask it to redeploy.
2. It pulls `main`, starts `HOSTING_DATA_DIR=/home/ubuntu/work/jean-wiki-data WIKI_DEV_EMAIL=jean@reducto.ai PORT=<free port> bun server.ts`, and runs `deploy_devin_app` with that command.
3. It alternates between ports 3200 and 3201, and stops the old server 15 s after the deploy.

The planned home is Reducto Hosting at `apps.reducto.ai/internal/jean-wiki`, configured in `reductoapp.toml`. There, a push to the app's Internal Git remote deploys the site. That push is blocked until Internal Access → Agents lets Devin sessions exchange credentials (today it returns HTTP 403).

## Access

Every page is private to the owners in `content/access.json`. An owner can share a page from the editor with anyone at Reducto or with listed emails. On the Devin App, every visitor counts as Jean (`WIKI_DEV_EMAIL`). Real per-user access needs Reducto Hosting, which sets `x-reducto-user-email`.
