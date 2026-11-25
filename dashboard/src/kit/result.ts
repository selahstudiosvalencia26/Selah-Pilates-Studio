import { AppError, safeMessage } from "./errors";

// One answer shape for every action (docs/rules/rules.md, "Backend"): success with data, or failure with a plain message.
// The message is always safe to show. The detail of a failure goes to the log, never into this.

export type Result<T = undefined> = { ok: true; data: T } | { ok: false; message: string };

export const ok = <T>(data: T): Result<T> => ({ ok: true, data });
export const err = (message: string): Result<never> => ({ ok: false, message });

// Run an action and turn anything that goes wrong into a failure a person can read. Only our own plain messages
// (AppError) get through; anything else becomes the generic message, and the real error is handed to `onError` for the log.
export async function attempt<T>(run: () => Promise<T>, onError: (error: unknown) => void = () => {}): Promise<Result<T>> {
  try {
    return ok(await run());
  } catch (error) {
    if (!(error instanceof AppError)) onError(error);
    else if (error.detail) onError(error);
    return err(safeMessage(error));
  }
}
