import ApiError from "../errors/ApiError";
import AuthError from "../errors/Auth";
import { UnitSSE } from "./sse";
import type { Route, RouteShape } from "../types";
import type {
  MiRutaAuthResponse,
  RouteShapeResponse,
  RouteResponse,
  UnitResponse,
} from "../types/responses";
import { Utils } from "./utils";

export class MiRutaClient {
  private token?: string;
  private apiVersion: string = "7d41d174"; // updated at 25-06
  private expiresAt?: Date;

  private apiURL = "https://miruta.siteur.gob.mx/api";
  public async auth(): Promise<MiRutaClient> {
    const url = `${this.apiURL}/auth/bootstrap`;
    const request = await fetch(url);
    const response = (await request.json()) as MiRutaAuthResponse;

    if (request.status !== 200 || !response.ok)
      throw new ApiError(response, []);

    this.token = response.token;
    this.expiresAt = new Date(Date.now() + response.expiresInSeconds * 1000);
    return this;
  }

  private async addAuth(req: RequestInit): Promise<RequestInit> {
    if (!this.token || !this.expiresAt) throw new AuthError();
    if (this.expiresAt <= new Date()) {
      await this.auth.bind(this)();
    }

    req.headers = {
      ...(req.headers ? req.headers : {}),
      Authorization: `Bearer ${this.token}`,
    };

    return req;
  }

  public async getRoutes(): Promise<Route[]> {
    const url = `${this.apiURL}/routes?v=${this.apiVersion}`;
    const request = await fetch(url, await this.addAuth.bind(this)({}));
    const response = (await request.json()) as RouteResponse;

    Utils.handleError(request, response);

    return response.routes;
  }

  public async getRouteShape(route: number | number[]): Promise<RouteShape[]> {
    const isNumber = typeof route === "number";
    const routes: number | string = isNumber ? route : route.join(",");
    const url = `${this.apiURL}/route-shapes?${isNumber ? "id" : "ids"}=${routes}`;

    const request = await fetch(url, await this.addAuth.bind(this)({}));
    const response = (await request.json()) as RouteShapeResponse;

    Utils.handleError(request, response);
    return response.results;
  }

  public async getRouteUnits(id: number | number[]) {
    const isNumber = typeof id === "number";
    const query = isNumber ? id : id.join(",");
    const url = `${this.apiURL}/units?${isNumber ? "id" : "ids"}=${query}`;

    const request = await fetch(url, await this.addAuth.bind(this)({}));
    const response = (await request.json()) as UnitResponse;

    Utils.handleError(request, response);

    return response.results;
  }

  public async getRealtime(route: number) {
    if (!this.token || !this.expiresAt) throw new AuthError();
    const url = `${this.apiURL}/units/stream?id=${route}&token=${this.token}`;
    const response = await fetch(url, await this.addAuth.bind(this)({}));
    if (!response.body) throw new ApiError(response, []);
    return new UnitSSE(response.body);
  }
}
