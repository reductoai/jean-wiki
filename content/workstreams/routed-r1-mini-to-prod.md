# Routed R-1 mini to prod

Redeploy the autoeval-replay cron from current main (Jean): git fetch origin && git checkout origin/main, then uv run rd modal deploy cron prod autoeval-replay. Starts the judged auto_route leg from PR 15021.

{{dashboard:routed-r1-mini-to-prod}}

Full notes and logs: [routed r1 mini to prod in Notion](https://app.notion.com/p/41a4a78a1c8780be9c83d3f02a810d07)
