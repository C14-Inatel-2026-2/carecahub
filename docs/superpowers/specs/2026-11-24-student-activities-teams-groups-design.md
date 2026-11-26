# Student activity groups

## Intent

Present a student's activities in a Teams-inspired flow: pending work, overdue work without a submission, and submitted work. Within each section, show the nearest deadlines first and group cards under their due-date labels.

## Scope

- Applies only to students. Staff activity lists remain unchanged because a staff member has no single submission status.
- The activities list API includes the current student's group submission state for each visible activity.
- The web page derives `A fazer`, `Atrasadas/Não entregues`, and `Entregues` from that state and the deadline, then renders date groups using the existing activity cards.

## Status rules

- `Entregues`: the student's group has a submission.
- `Atrasadas/Não entregues`: the deadline has passed and the student's group has no submission.
- `A fazer`: all remaining activities.

## Chosen approach

Extend the existing `GET /activities` result for student callers with an optional per-group submission summary. This keeps the page to one list request and avoids issuing one submission request for every card.

The web type accepts the optional summary so staff responses retain their existing shape.

## Non-goals

- Changing activity visibility, deadlines, or submission authorization.
- Changing the staff activity list or the activity-details submission history.
