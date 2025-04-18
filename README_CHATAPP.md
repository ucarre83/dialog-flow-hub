
# ChatApp - Asistente de Chat con OpenAI

Una aplicación móvil completa y funcional que permite a los usuarios interactuar con un chatbot impulsado por la API de OpenAI, con características de autenticación, historial de conversaciones y panel de administración.

## Características principales

### Autenticación de usuarios
- Registro con nombre de usuario, correo electrónico y contraseña segura
- Inicio de sesión con correo y contraseña
- Recuperación de contraseñas olvidadas
- Manejo de errores y validaciones

### Interfaz de chat
- Conversaciones con OpenAI (usando gpt-4o)
- Indicador de carga mientras se procesa la respuesta
- Opciones para copiar, compartir o eliminar mensajes individuales
- Diseño responsivo para móviles y escritorio

### Historial de conversaciones
- Guardado automático de todas las conversaciones
- Organización por fecha y hora
- Opciones para eliminar conversaciones
- Búsqueda de conversaciones

### Panel de administración
- Gestión completa de usuarios
- Aprobación o rechazo de usuarios registrados
- Bloqueo y desbloqueo de usuarios
- Asignación de permisos de administrador

## Requisitos previos

Para utilizar esta aplicación necesitas:

1. Node.js (versión 16 o superior)
2. Una cuenta en Supabase (https://supabase.io)
3. Una API Key de OpenAI (https://platform.openai.com)

## Guía de instalación

### 1. Configuración de Supabase

1. Crea una nueva aplicación en Supabase
2. En la sección de SQL Editor, ejecuta el script `database_schema.sql` incluido en este proyecto
3. En Authentication > Settings, habilita el proveedor de email y contraseña
4. Copia la URL y la API Key anónima de tu proyecto (Settings > API)

### 2. Configuración del proyecto

1. Clona este repositorio
2. Instala las dependencias ejecutando:
   ```
   npm install
   ```
3. Edita el archivo `src/lib/supabase.ts` y actualiza las variables:
   ```typescript
   const supabaseUrl = 'TU_URL_DE_SUPABASE';
   const supabaseAnonKey = 'TU_API_KEY_ANÓNIMA_DE_SUPABASE';
   ```
4. Inicia la aplicación en modo desarrollo:
   ```
   npm run dev
   ```

### 3. Creación del usuario administrador

1. Regístrate en la aplicación utilizando el formulario de registro
2. En Supabase, ve a la tabla `users` y encuentra tu usuario
3. Actualiza el campo `is_admin` a `true` para convertirte en administrador
4. Actualiza el campo `status` a `active` para activar tu cuenta

### 4. Configuración de OpenAI

Cuando inicies sesión en la aplicación, se te pedirá una API Key de OpenAI. Debes obtenerla en:
https://platform.openai.com/api-keys

## Uso de la aplicación

### Inicio de sesión y registro
- Usa la página de autenticación para crear una cuenta o iniciar sesión
- Si olvidaste tu contraseña, usa la opción "Olvidé mi contraseña"

### Chatbot
- Escribe tus mensajes en el cuadro de texto inferior
- Espera a que el asistente responda
- Usa los botones en cada mensaje para copiar, compartir o eliminar

### Historial de conversaciones
- Tus conversaciones se guardan automáticamente
- Usa la barra lateral para navegar entre ellas
- Crea una nueva conversación con el botón "+" en la barra lateral

### Panel de administración
- Accede al panel desde el ícono de administrador en la barra lateral
- Gestiona usuarios: activar, bloquear, hacer administrador, etc.
- Edita la información de los usuarios o elimínalos por completo

## Seguridad

La aplicación implementa:
- Hashing seguro de contraseñas (gestionado por Supabase)
- Políticas de Row Level Security (RLS) en la base de datos
- Validación de formularios para prevenir inyección de datos maliciosos
- Tokens JWT para la autenticación
- APIs protegidas con autenticación

## Solución de problemas

### No puedo iniciar sesión
- Verifica que tu correo y contraseña sean correctos
- Asegúrate de que tu cuenta haya sido activada por un administrador
- Usa la opción "Olvidé mi contraseña" si no recuerdas tu contraseña

### El chat no responde
- Verifica que tu API Key de OpenAI sea válida
- Asegúrate de tener una conexión a internet estable
- Comprueba tu saldo en la cuenta de OpenAI

### No puedo acceder al panel de administración
- Solo los usuarios con privilegios de administrador pueden acceder
- Verifica que tu cuenta tenga el campo `is_admin` establecido como `true`

## Tecnologías utilizadas

- **Frontend**: React, TypeScript, TailwindCSS, ShadcnUI
- **Backend**: Supabase (PostgreSQL, Autenticación)
- **IA**: OpenAI API (gpt-4o)
- **Herramientas**: Vite, React Router, Lucide Icons
