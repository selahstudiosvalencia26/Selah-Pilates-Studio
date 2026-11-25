// Errors. People see a short, plain message. The detail goes to the log, never to the screen (docs/rules/security.md, section 5).

export class AppError extends Error {
  // `message` is safe to show. `detail` is for the server log only and must hold no personal details.
  constructor(
    message: string,
    readonly detail?: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const fail = (message: string, detail?: string): never => {
  throw new AppError(message, detail);
};

const GENERIC = "That did not work. Try again, and if it keeps happening, tell the builder.";

// What to show a person about any error. Only our own plain messages get through.
export const safeMessage = (error: unknown): string => (error instanceof AppError ? error.message : GENERIC);
