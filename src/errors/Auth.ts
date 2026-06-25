export default class AuthError extends Error {
  constructor() {
    super("You need to authenticate first.");
  }
}
