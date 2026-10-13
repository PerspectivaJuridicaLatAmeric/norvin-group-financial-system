# NORVIN GROUP LLC — Sistema financiero inicial

Esta es una primera interfaz web responsive para conectar con el proyecto Supabase existente. Incluye navegación para clientes, proyectos, facturas, pagos, gastos, empleados, nómina y contratistas.

## Importante
- No contiene datos reales de la empresa.
- No se ha publicado en internet todavía.
- No incluye una contraseña. El inicio de sesión requiere que el usuario de Supabase tenga una contraseña configurada.
- Las políticas de seguridad (RLS) de Supabase deben revisarse antes de usar datos reales. No desactives RLS para hacer que la aplicación funcione.
- Nómina, retenciones e impuestos deben ser revisados por un profesional antes de usarse para pagar empleados.

## Configuración
1. Instala Node.js en la computadora.
2. Descomprime el ZIP y abre una terminal en esta carpeta.
3. Ejecuta `npm install`.
4. Copia `.env.example` como `.env`.
5. En Supabase, abre Project Settings → API Keys y copia la Project URL y la publishable key. Pégalas en `.env`. Nunca uses una `service_role` o `secret` key en el navegador.
6. Ejecuta `npm run dev` para probar localmente.
7. Antes de publicar, configura en Supabase Authentication → URL Configuration la URL pública real y las URLs de redirección necesarias. No uses `localhost` como URL pública.
8. Publica el proyecto en un servicio de hosting estático y luego prueba inicio de sesión y acceso desde teléfono y computadora.

## Esquema
La interfaz usa las tablas existentes del proyecto: `clients`, `projects`, `invoices`, `payments`, `expenses`, `employees`, `payroll_entries`, `contractors` y `contractor_payments`.
