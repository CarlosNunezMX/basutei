import ApiError from "../errors/ApiError";
import AuthError from "../errors/Auth";
import RateLimitError from "../errors/Ratelimit";
import type { ResponseWithData } from "../types/responses";

export class Utils {
  static handleError<T>(request: Response, response: ResponseWithData<T>) {
    if (request.status === 401) throw new AuthError();
    if (request.status === 419) throw new RateLimitError();
    if (
      request.status !== 200 ||
      (response.errors && response.errors.length !== 0) ||
      !response.ok
    )
      throw new ApiError(response, response.errors ?? []);
  }
}
