export default class ApiError extends Error {
  constructor(
    public response: any,
    public errors: unknown[],
  ) {
    super("Error found on API response.");
  }
}
