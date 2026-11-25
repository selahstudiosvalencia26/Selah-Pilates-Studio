# <system>: API

Written <date>. The doors this system opens. Shared rules are in `../../architecture/api.md`.

## Public connection

Say "None" if there is none. Otherwise a table: address, what it does, what it accepts, what it returns. Say which checks run, and that it never reads the staff session.

## Staff actions (signed in)

| Action | Needs | Does |
|---|---|---|

## Offered to other systems

Named functions in the description file (`provides`), what each returns, and the permission checked for the caller.

## Used from other systems

Functions this system calls from others, and what it does when the answer is "not allowed".

## Emails and jobs

The emails it sends (each optional) and any scheduled work. "None" if none.
