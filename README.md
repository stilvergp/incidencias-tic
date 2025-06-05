# Aplicación de Gestión de Incidencias TIC

Aplicación web progresiva (PWA) desarrollada con [Angular](https://angular.io/) e [Ionic](https://ionicframework.com/) para la gestión de incidencias TIC en entornos educativos.
- Autenticación y base de datos: **Firebase**
- Almacenamiento de imágenes: **Supabase Store**

Los profesores pueden registrar incidencias informáticas, mientras que los técnicos TIC las revisan y resuelven.
La app está optimizada para dispositivos móviles y tablets.

---

## Manual de instalación

A continuación, se detallan todos los pasos necesarios para instalar y ejecutar el proyecto en tu entorno local.

### 1 Requisitos previos

Antes de comenzar, asegúrate de tener instalado lo siguiente:

- [Node.js](https://nodejs.org/)
- [npm](https://www.npmjs.com/)
- [Ionic CLI](https://ionicframework.com/docs/cli) (instalar con `npm install -g @ionic/cli`)
- Una cuenta en Firebase y en Supabase
- Git para la clonación del proyecto

---

### 2 Clonación del proyecto

Clona el repositorio en tu máquina local:

```
git clone https://github.com/stilvergp/incidencias-tic.git
cd incidencias-tic
```

---

### 3 Instalación de dependencias

Una vez dentro de la carpeta del proyecto, instala las dependencias de **Node.js**:
```
npm install
```
---

### 4 Configuración de entornos

El proyecto utiliza variables de entorno para conectarse a Firebase y Supabase.
En la carpeta clonada, encontrarás los archivos de entorno de ejemplo:

- **src/environments/environment.ts.dist**
- **src/environments/environment.prod.ts.dist**

Copia ambos archivos en la misma ubicación y quita la extensión .dist al final del archivo:
```
cp src/environments/environment.ts.dist src/environments/environment.ts
cp src/environments/environment.prod.ts.dist src/environments/environment.prod.ts
```
Edita los archivos `environment.ts` y `environment.prod.ts` según sea necesario para tu entorno. Estos archivos contienen las configuraciones específicas de Firebase y Supabase.

---

### 5 Ejecución de la aplicación

Para ejecutar la aplicación en tu entorno local:
```
ionic serve
```
Esto iniciará un servidor de desarrollo y abrirá la aplicación PWA en tu navegador predeterminado. Los cambios en el código se reflejarán automáticamente.

---

### 6 Generar build de producción

Cuando desees generar los archivos finales para producción:
```
ionic build --prod
```
Esto generará la carpeta **www** con los archivos listos para ser desplegados en un servidor web.

---

## Despliegue

Si quieres desplegar la aplicación en un servidor, puedes subir la carpeta www al servicio de hosting de tu elección (Firebase Hosting, Vercel, Netlify, etc.).

---
