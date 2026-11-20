# Snapshotting on the cluster

Goal: an fpp-35b worker on uss1 restores from a GPU checkpoint instead of a 3 to 17 min cold start. Restore takes about 24 s today; the target is 10 s.

{{dashboard:snapshotting-on-the-cluster}}

Full notes and logs: [Snapshotting on the cluster in Notion](https://app.notion.com/p/41a4a78a1c8780f09346e07d418df2ee). Restore numbers: [Restore toward 10 s](https://app.notion.com/p/4174a78a1c878110b429c03cf77d1007).
