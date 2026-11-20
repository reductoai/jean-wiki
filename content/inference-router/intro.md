# Inference router

The inference router decides where each model call runs, so a burst waits a moment for a warm GPU instead of landing on cold Modal containers.

## Problem

Traffic bursts overflow our own GPU clusters onto cold Modal containers. Cold starts cause retries and long tail latency. Keeping spare Modal containers warm avoids that, but we pay for them all day.

## Solution

App workers ask the router for a seat before each call. The router admits the call when a Reducto GPU or a ready Modal container has room, and queues it otherwise. A controller reads capacity, writes the caps the router admits against, and sets the Modal floors.

## Why it fits

- One service decides capacity, so app workers stop managing inference infrastructure.
- A short queue absorbs a burst that would otherwise start cold containers.
- Modal floors can drop toward 1, because the queue absorbs bursts instead of a spare pool.

## How a call flows

Click a part to see what it does, or play a scenario.

{{diagram:router}}

## Terms

| Term | Meaning |
| --- | --- |
| Seat | One call a GPU or Modal container can run at a time. |
| Share | Percent of an app's calls sent through the router, set per app and region by a PostHog flag such as `inference_router_au_fpp_2b_pct`. |
| Floor | Fewest Modal containers kept warm for an app. |
| Slots mode | The controller sets Modal targets from seats in use and holds the floor as `min` containers, because idle Modal pools drop `buffer_containers`. |
| Admit deadline | Longest a call waits in the router queue; 23 s for R-1. |
| Fallback | A call that skips the router and goes straight to Modal, for example after the admit deadline. |

## Current status

- [More apps on the router](more-apps): R-1, R-1 mini, Magpie and the EU Triton apps on the router; R-1 cost per 1,000 pages down from $3.73 to $2.21.
- EU R-1 and R-1 mini: 100% of calls go through the router, with Modal floors at 1 ([#15004](https://github.com/reductoai/api/pull/15004)).

## In this chapter

- [Workstreams and impact](workstreams): every router workstream with its goal and impact.

## Impact of finished workstreams

- [EU R-1 through the router](eu-r1): EU R-1 and R-1 mini floors went from 6 and 5 to 1 ([#15004](https://github.com/reductoai/api/pull/15004)).
- [us-west-3 cluster](../workstreams/us-west-3-cluster): cost per 1,000 pages fell 18%. Modal spend fell while pages rose 20%.
- [Overshoot 1112 R-1 35B package](../workstreams/overshoot-1112-r1-35b): US 35B p99 per page went from 7.69 to 3.38 s. EU Modal GPU cost per 1,000 pages went from $16.10 to $4.65, partly because EU floors also fell to 1 on Nov 16.
