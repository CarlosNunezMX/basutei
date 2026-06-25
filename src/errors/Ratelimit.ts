export default class RateLimitError extends Error {
  constructor() {
    super("Rate limit reached, try again later.");
  }
}
