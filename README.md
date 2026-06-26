<p align="center"><img src="banner.png" alt="Jericayapp/basutei banner"/></p>

<h1 align="center">Jericayapp Basutei</h1>

Cliente HTTP y SSE **no oficial** del API Interna de [Mi Ruta - SITEUR](https:///miruta.sitren.gob.mx). Hecho para Bun y NodeJS con capacidades de usarse en React Native.

## Instalación

El unico requerimiento para hacer la instalación de este paquete es tener Bun o NodeJS instalado en el equipo. Para instalar puede ejecutar el siguiente comando.

```sh
bunx/npx jsr install @carlosnunezmx/basutei
```

## Uso

Instanciación y configuración del cliente.

```ts
import { MiRutaClient } from "@carlosnunezmx/basutei";
// Declarative way
const client = new MiRutaClient();
await client.auth(); // Este metodo obtiene un Token desde los Servidores de MiRuta

// Forma corta, instancía el cliente y lo autentica.
const client = await new MiRutaClient().auth();
```

### Obtener Rutas

Con un cliente configurado solo se necesita llamar al metodo getRoutes.

```typescript
// Este metodo obtiene todas las rutas que estan inscritas en MiRuta
const routes = await client.getRoutes();
routes.forEach(console.log);
```

### Obtener derroteos

La forma recomendada de obtener derroteos es enviar streamuna petición con todas las rutas, aunque tambien es posible obtener el derroteo de solo una.

El metodo es capaz de aceptar una sola ruta o un arreglo con los ids de las rutas

```typescript
// Una sola ruta
// 4 es el id de la Línea 4
const shapes = await client.getRouteShape(4);

// Forma recomendada, obtiene el derroteo de TODAS las rutas
// Esto equivale a enviar un arreglo con los ids de las rutas
const shapes = await client.getRouteShape(routes.map((route) => route.id));
```

### Obtener unidades

Para esta sección hay dos cosas que nos interesa, la API de MiRuta permite dos formas de preguntar rutas, una clasica request http la cual nos daría todas las rutas, o un stream con actualizaciones de esta.

**Request HTTP**
Esta es la más facil de hacer, solo llamamos al metodo y listo.

```typescript
const units = await client.getRouteUnits(4); // Una sola ruta
const units = await client.getRouteUnits([1, 2, 3, 4]); // Varias rutas
```

**Stream (Realtime)**
Esta es un poco más limitada, por el momento esta limitada a una sola ruta por consulta. Pero esta nos da actualizaciones constantes de la ubicación de la ruta.

```typescript
// Esto nos regresara una clase UnitStream que tiene un parecido al
// SSE
const routeStream = await client.getRouteStream(4);
routeStream.on("units", (units) => {});
routeStream.on("end", () => {});
// El stream tiende a cerrarse, por lo tanto debemos captarlo para reabrirlo
```
