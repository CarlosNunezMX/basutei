import type { Route, RouteShape, RouteUnit } from ".";

export interface ResponseWithData<T> {
  ok: boolean;
  results: T[];
  errors: unknown[];
}

export type MiRutaAuthResponse = {
  authEnabled: boolean;
  expiresInSeconds: number;
  ok: boolean;
  token: string;
};

export type RouteShapeResponse = ResponseWithData<void> & { routes: RouteShape[] };
export interface UnitResponse extends ResponseWithData<RouteUnit> {
  timestamp: string;
}
export type RouteResponse = ResponseWithData<undefined> & { routes: Route[] };
