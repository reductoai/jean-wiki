# Lower priority calls to the cluster

Problem. We pay for Modal dev and staging inference while production GPUs sit partly idle by day: decode pools averaged 11% to 36% GPU busy time from 09:00 to 18:00 PT over the measured week. Some evaluation calls could use models already on the clusters, but…

{{dashboard:lower-priority-calls}}

Full notes and logs: [lower priority calls in Notion](https://app.notion.com/p/41b4a78a1c878080b5c2c23c0a1e7661)
