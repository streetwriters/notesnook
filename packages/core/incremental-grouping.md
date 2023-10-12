# Incremental grouping of list items

## Requirements

1. We do not want to bring all the items to the client side as that would take a lot of memory
2. We want to preserve & customize sorting
3. We want to avoid creating duplicate groups
4. Each batch of items should append and add groups as necesary

## Approach

1. Get all the IDs of all the items sorted using the required configuration
2. Request the first batch of `n` items.
3. Group the first batch
4. Bring the second batch and similarly group it.
5. If the last group of the previous batch & the first group of the new batch match up, we can remove the new group, otherwise keep it.

Example:

Items: A, Aa, B, Ba, Bb, C, Ca, Cb, Cc, Cd
Batch size: 2

Batch 1: [A, Aa]
Grouped: [A, [A, Aa]]

Batch 2: [B, Ba]
Grouped: [B, [B, Ba]]

Merged: [A, [A, Aa], B, [B, Ba]]

Batch 3: [Bb, C]
Grouped: [B, [Bb], C, [C]]

Merged: [A, [A, Aa], B, [B, Ba, Bb], C, [C]]

This is a simple incremental grouping. However, what we require is windowed grouping.

## Windowed incremental grouping of list items

Windowed grouping means that we only keep `n` number of items in memory at any point in time.
As the user scrolls up & down, we fetch only the batch that is needed for rendering the items
in the current window.

Requirements:

1. Only keep N items in memory
2. Remove the previous window's items as soon as we don't need them
3. Respect sorting & grouping while doing append/prepend

Approach:

1. Get all the IDs of all the items sorted using the required configuration
2. Request the first batch of `n` items.
3. Group the first batch
4. If user is moving downward:
   1. When user moves closer to the the end of the first batch, load the next batch & group it accordingly
   2. Compare last & first groups of both batches
   3. If last & first groups are the same, remove the first group of the new batch
   4. Otherwise keep it & do nothing
   5. If user reaches the end of the second batch, remove the first batch
5. If user is moving upward:
   Suppose we have batches 2 & 3 in memory, user is at the end of batch 2 and starts scrolling upwards:
   1. When user reaches closer to the start of the batch 2, load batch 1 & remove batch 3
   2. For grouping compare the last & first groups of batch 1 & 2 respectively
   3. Remove first group of batch 2 if both match, otherwise do nothing

Questions:

1. What if new items are added at random places during sync or something else?

The naive but stable approach would be to refetch everything and recalculate the current batch.
Another approach would be to diff the new & old set of IDs and determine which batches have
changed.

We can then reload the batches only if they are currently cached, otherwise do nothing.

2. What will be the responsibility of the core module?

The core module will only manage the cache. It will also be responsible for loading the appropriate
batch based on if the item is found in the cache or not. This should be automatic for maximum
optimization opportunities.
