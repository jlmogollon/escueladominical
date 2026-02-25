# Poner la app en línea con Firebase (gratis)

**Este proyecto usa Firebase Firestore + GitHub (o Netlify) para publicar. No usa Vercel ni Node.**

La app ya está preparada para guardar y **sincronizar datos en tiempo real** usando **Firebase Firestore**. Es gratuito dentro del plan "Spark" (sin tarjeta).

## 1. Crear proyecto en Firebase

1. Entra en [Firebase Console](https://console.firebase.google.com/).
2. **Añadir proyecto** → nombre (ej. "Escuela Dominical") → seguir pasos (Analytics opcional).
3. En el proyecto, entra en **Build → Firestore Database** → **Crear base de datos**.
4. Elige **empezar en modo de prueba** (para desarrollo). Luego puedes [ajustar reglas](https://firebase.google.com/docs/firestore/security/get-started) para producción.
5. En **Configuración del proyecto** (icono ⚙️ arriba a la izquierda) → **Tus apps** → pulsa el icono **</> (Web)** para añadir una app web.

### Registrar la app (solo para obtener la config)

6. **Nombre del proyecto (opcional):** escribe algo como "Escuela Dominical" o déjalo en blanco.
7. **No marques** "Firebase Hosting" por ahora (no lo necesitas para que la app funcione).
8. Pulsa **Registrar app**.
9. Firebase te mostrará un código con `firebaseConfig`. **Solo necesitas copiar ese objeto** (apiKey, authDomain, projectId, etc.). Puedes cerrar o ignorar los pasos que salen después (npm install, firebase init, etc.); esta app no los usa.

**Importante:** No hace falta configurar Firebase Hosting. La app solo usa **Firestore** (la base de datos). Puedes publicar en **GitHub Pages** o Netlify (ver más abajo).

### Reglas de Firestore (para que funcione siempre, no solo 30 días)

En **Build → Firestore Database** → pestaña **Reglas**, sustituye el contenido por:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /ed_data/{document=**} {
      allow read, write: if true;
    }
  }
}
```

Pulsa **Publicar**. Así la app podrá leer y escribir en Firestore sin límite de tiempo.  
(Solo quien tenga la URL de tu app podrá acceder a los datos; si más adelante quieres más seguridad, se puede añadir Firebase Auth o App Check.)

## 2. Pegar la config en la app

Abre `escuela_dominical_v15.jsx` y busca `FIREBASE_CONFIG`. Si está en `null` o quieres usar otro proyecto, sustituye por tu config, por ejemplo:

```js
const FIREBASE_CONFIG={
  apiKey: "AIza...",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

Guarda el archivo. A partir de ahí, todos los datos se guardan en Firestore y **cualquier dispositivo o pestaña que tenga la app abierta se actualiza en tiempo real**.

## 3. Publicar con GitHub

1. Sube el proyecto a un repositorio en **GitHub** (index.html, escuela_dominical_v15.jsx, etc.).
2. En el repo → **Settings** → **Pages** → en "Source" elige **GitHub Actions** o **Deploy from a branch** (rama `main`, carpeta `/root`).
3. La URL será `https://tu-usuario.github.io/escuela-dominical` (o la que indique GitHub).

Todos los que entren a esa URL verán los mismos datos en tiempo real (Firestore).

**Alternativa:** [Netlify](https://app.netlify.com/) — arrastrar la carpeta a "Deploy" y listo.

## Sin Firebase

Si dejas `FIREBASE_CONFIG=null`, la app sigue funcionando y guarda en el **almacenamiento local** del navegador (cada dispositivo tiene sus propios datos; no hay sincronización).
