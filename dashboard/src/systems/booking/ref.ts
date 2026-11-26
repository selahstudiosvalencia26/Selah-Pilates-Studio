// The short booking ID people can say or type: the first six characters of the booking's own id.
export const bookingRef = (id: string): string => id.slice(0, 6).toUpperCase();
