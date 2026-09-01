# Zero Silent Failures: Shadow Path Checklist

A CEO cares about **trust**. Every plan must account for these shadow paths to prevent silent failures.

## 1. The Happy Path (Control)

- The system works exactly as intended under normal conditions.
- _Audit:_ Is this the most direct and efficient way to achieve the goal?

## 2. The Nil/Empty Path (Input)

- **Missing Input:** What happens if the input is `nil`, `null`, or `undefined`?
- **Empty String:** What happens if the input is an empty string `""`?
- **Zero Count:** What happens if a list or collection has 0 items?
- _CEO Check:_ Does the user get a clear "Empty State" or a confusing 500 error?

## 3. The Error Path (Dependencies)

- **Network Failure:** What happens if an API call or database query times out?
- **Downstream Error:** What if a third-party service returns an error?
- **Auth Failure:** What if the user's token expires mid-action?
- _CEO Check:_ Does the error propagate gracefully, or does it leave the user in a "broken" state?

## 4. The Stale Path (State)

- **Race Conditions:** What if the user acts on old data (e.g., they click "Edit" while someone else is deleting the record)?
- **Offline Handling:** What if the user loses connection while the action is in-flight?
- _CEO Check:_ Is the data consistent? Does the system handle concurrent updates safely?

## 5. The Scaling Path (Volume)

- **High Volume:** What if 1,000 users do this at the same time?
- **Large Data:** What if the data set is 100x larger than expected?
- _CEO Check:_ Is there a clear bottleneck? Does this plan create a future "nightmare" for the engineering team?
