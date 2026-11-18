---
title: "Advanced terminal log analysis: can I trust this p95?"
description: "Compute per-route p95 latency with Bash, awk and sort. Test the pipeline against malformed records, misleading sort order and HTTP errors before trusting the result."
publishedAt: 2026-11-18
lang: en
translationKey: terminal-latency-pipeline
draft: false
category: ag-ve-linux
toc: true
tags: [Linux, Bash, awk, Log analysis, Performance]
cover: "/images/kageterm/latency-ranks.webp"
coverAlt: "The nineteenth of twenty sorted responses takes 80 ms for /notes and 900 ms for /search."
---

Two routes. The slowest successful request on each took 900 milliseconds. The median on both was 80. If someone asked me which route to investigate first, those two numbers wouldn’t get me very far.

Here’s the terminal exercise I want to try. First I’ll work out the answer on paper. Then I’ll build a shell pipeline and deliberately give it bad data. A neatly aligned report looks convincing, but `sort` is perfectly happy sorting an empty file.

## What question am I asking?

**For each route, how long did it take at least 95 percent of successful GET requests to finish?** I’m counting HTTP 2xx responses and measuring time in whole milliseconds. My definition of percentile is *nearest rank*. Sort the durations, then take observation number `ceil(0.95 × n)`, counting from one.

With 20 requests, I want observation 19. Suppose the first eighteen took 80 ms and the last two took 900 ms. An 80 ms cutoff covers only 18 out of 20 requests. Move to observation 19 and the answer jumps to 900 ms. Now let just one of those two slow requests finish in 80 ms. The maximum stays the same. The p95 drops to 80 ms.

<figure class="article-figure">
  <img src="/images/kageterm/latency-ranks.webp" width="1000" height="560" alt="Two rows of twenty requests sorted by duration. The outlined nineteenth request takes 80 ms on /notes and 900 ms on /search." loading="lazy" />
  <figcaption>Each square represents a successful request. The squares run from fastest to slowest within each route, rather than in arrival order.</figcaption>
</figure>

## A 41-line experiment

In an empty working directory, I generate a four-column TSV file. Each row contains the HTTP method, route, status and duration, separated by actual tabs. These routes are already suitable grouping keys. With paths such as `/users/42` and `/users/93`, I’d use the route template recorded by the application.

```bash
awk 'BEGIN {
  OFS = "\t"
  for (i = 1; i <= 20; i++) {
    print "GET", "/search", 200, (i <= 18 ? 80 : 900)
    print "GET", "/notes",  200, (i <= 19 ? 80 : 900)
  }
  print "GET", "/search", 503, 1200
}' > requests.tsv
```

The last request returns a 503 after 1200 ms. I put it there on purpose. There are 41 records, but the two groups in my report should add up to **40**. A success-only latency report can look healthy while requests are failing. That’s why I’d keep the error rate alongside it.

## What actually crosses the pipe?

I save the following as `latency.sh` and run `bash latency.sh requests.tsv`. The first stage validates and sorts the input. The second reads the sorted file twice.

```bash
#!/usr/bin/env bash
set -euo pipefail
export LC_ALL=C

input=${1:?usage: bash latency.sh requests.tsv}
work=$(mktemp -d)
trap 'rm -f -- "$work/sorted.tsv"; rmdir -- "$work"' EXIT

awk -F '\t' '
  NF != 4 || $1 == "" || $2 !~ /^\// ||
  $3 !~ /^[1-5][0-9][0-9]$/ || $4 !~ /^[0-9]+$/ {
    printf "Invalid record at line %d\n", NR > "/dev/stderr"
    exit 2
  }
  $1 == "GET" && $3 ~ /^2/ { print $2 "\t" $4 }
' "$input" |
  sort -t $'\t' -k1,1 -k2,2n > "$work/sorted.tsv"

awk -F '\t' '
  NR == FNR { total[$1]++; next }
  $1 != route { route = $1; rank = 0 }
  {
    rank++
    n = total[route]
    if (rank == int((95*n + 99)/100)) {
      printf "%s\t%d\t%d\n", route, n, $2
    }
  }
' "$work/sorted.tsv" "$work/sorted.tsv"
```

From left to right, the output gives the route, sample size and p95 in milliseconds:

```text
/notes	20	80
/search	20	900
```

The easiest detail to miss is `-k2,2n`. The second field is a duration. With a text sort, `100` comes before `80`. Worse, my first test uses only 80 and 900, where a text sort gives the right answer by accident. I want a second test that can tell the two implementations apart.

`LC_ALL=C` gives the stages a consistent locale. The first sort key keeps a route’s rows together. The second orders its durations numerically. I keep the fields tab-separated until the final output. Formatting the intermediate data for display would give the next command a different input contract.

## Why write a file and read it twice?

In `awk`, `NR` counts records across files and `FNR` counts records in the current file. I pass the same sorted file twice. During the first pass, `NR == FNR` and I count each route’s requests. On the second pass I already know the sample sizes. I restart the rank when the route changes and emit the duration at the target rank. For these integer counts, `int((95*n + 99)/100)` gives the required ceiling.

I could keep every observation in an array. Instead I’m paying for temporary disk space and another read so that the aggregation stage holds one counter per **distinct route**. External sorting can also need temporary disk space of its own. For continuous metrics I’d collect a histogram. For a finite log archive, I like being able to point to the exact record that determined the percentile.

## Three tests that can catch a wrong answer

1. **Expose a text sort.** Give one route just two successful durations, 80 and 100 ms. Its p95 is the second observation, so the answer must be 100. Remove the numeric sort flag and the test catches the mistake.
2. **Break a field.** In a copy of the fixture, change the last duration to `1200ms`. Even though the record is a 503, validation runs first. I expect a line number on standard error, a nonzero exit status and no report on standard output. Without `pipefail`, a successful `sort` can hide a failed earlier stage.
3. **Leave no matching requests.** Supply only valid 503 records. The pipeline now succeeds with empty output. That distinguishes a valid file containing no successful requests from an unreadable or malformed file.

One last trap: averaging percentiles. Put the two routes together and 37 of the 40 successes are fast. The 38th observation determines the combined p95, so the answer is 900 ms. Averaging the two route-level percentiles gives 490 ms. There wasn’t even a 490 ms request in the data.

## Where I practise the keystrokes

Understanding the pipeline and being able to type it comfortably the next day take different kinds of practice. I built KageTerm for the typing part. In Learn mode I can see what a command means while I enter it, then switch to Exam mode and test myself. On a Turkish keyboard, being able to practise the symbols on the layout I actually use makes a difference.

<figure class="article-figure">
  <img src="/images/kageterm/practice-en.webp" width="1020" height="780" alt="The real KageTerm Learn screen showing pwd, its explanation and the on-screen keyboard." loading="lazy" />
  <figcaption>This is the first directory-navigation exercise in KageTerm. The log analysis above runs in your own Bash session.</figcaption>
</figure>

<a href="https://kageterm.com/"><img src="/images/kageterm/mark.webp" width="28" height="28" style="display:inline-block;width:1.75rem;height:1.75rem;margin:0 .35rem 0 0;vertical-align:middle" alt="" loading="lazy" /> Practise the command line in KageTerm ↗</a>

For one more run, change only the number of slow requests. Before reaching for Enter, can you predict which duration will be sitting in position 19? That’s the point at which I start trusting a command I’ve learned.
