export interface Route {
  color?: string;
  develop: boolean;
  hasLiveData: boolean;
  id: number;
  image: string;
  ruta: string;
  service: string;
}

export interface RouteShape {
  routeId: number;
  routeName: string;
  lines: [number, number][];
}

export interface RouteUnit {
  fetchedAt: string;
  notModified: boolean;
  routeId: number;
  routeName: string;
  units: Unit[];

  removed: string[];
  delta?: boolean;
}

export interface Unit {
  direccion: number | null;
  distanceToRouteM: number;
  fecha: string;
  latitud: number;
  longitud: number;
  nombre: string;
  routeStatus: "inside" | "grace" | "outside";
  unitId: string;
  velocidad: string;
}
