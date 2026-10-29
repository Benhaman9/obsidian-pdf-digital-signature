# Firma Digital PDF para Obsidian

## Firmar y comprobar en 1.1.1

Usa el menú contextual del archivo PDF o los comandos para el PDF activo para firmarlo o comprobarlo. Al firmar un PDF existente se revisan el archivo, el certificado y el modo; después se crea una copia .signed.pdf (con sufijo único si hace falta) y se conserva el original. Los PDFs exportados se firman después de exportar. Si el archivo cambia mientras espera en la cola, se rechaza el trabajo para evitar firmar el documento actual con ajustes anteriores. Si Windows bloquea el reemplazo de un PDF exportado, el plugin crea una copia firmada .signed.pdf sin forzar la escritura sobre el archivo bloqueado; el nombre mostrado y el PDF que se abre después corresponden a esa copia.

Los detalles del certificado muestran el titular, el emisor y la huella SHA-256 indicados en él, y si es autofirmado. Sirven para identificar el certificado configurado; no acreditan identidad ni confianza. Crear un certificado autofirmado es una acción expresa de Ajustes. Si el archivo configurado existe, se elige otro archivo y se conserva el anterior; esto no renueva un certificado de proveedor.

La entrada admite hasta 64 MiB por PDF y 4 MiB por certificado PKCS#12. La salida firmada también se limita a 64 MiB: un PDF cercano al límite de entrada puede rechazarse si al firmarlo aumenta su tamaño. Antes de guardar, toda firma generada debe superar las comprobaciones locales de criptografía y cobertura del archivo completo. Es una comprobación de integridad, no de confianza ni jurídica.


## Elegir cómo firmar

- **Certificar — sin cambios permitidos** es la opción predeterminada: incorpora una política DocMDP con permiso `P=1`. Los lectores compatibles pueden rechazar cambios posteriores según esa política. Los programas que la ignoren siguen pudiendo editar el PDF.
- **Firma de integridad** firma la revisión actual sin certificación. Un lector puede mostrar la firma original como criptográficamente válida y advertir de revisiones posteriores; comprueba el estado de modificación del documento actual.
- **País o contexto jurídico** solo cambia la orientación, no tu certificado, identidad, formato ni situación jurídica. Revisa los requisitos del destinatario.

Configura un `.pfx`/`.p12` existente y su contraseña, o crea expresamente un certificado autofirmado en Ajustes. Un certificado ausente no se sustituye silenciosamente. Los autofirmados pueden servir para comprobar integridad personal; el destinatario debe establecer la confianza por separado.

Usa **Comprobar integridad de la firma de un PDF** desde la paleta de comandos o el menú del archivo PDF. Comprueba firmas compatibles y cobertura del archivo completo, detectando bytes añadidos. Las estructuras incompatibles reciben un resultado explícito de no compatibles. No valida cadenas de confianza, revocación, sellos de tiempo de confianza, modificaciones permitidas, cumplimiento PAdES ni suficiencia jurídica. Para validación independiente opcional y configuración de confianza, consulta la [guía de pyHanko](https://docs.pyhanko.eu/en/latest/cli-guide/validation.html).

No se admiten sellos de tiempo de confianza, PAdES T/LT/LTA, tokens de proveedores ni firma remota. No se afirma cumplimiento PAdES B. Los perfiles técnicos y las categorías jurídicas son distintos.

Fuentes: [ETSI PAdES](https://www.etsi.org/deliver/etsi_EN/319100_319199/31914201/01.02.01_60/en_31914201v010201p.pdf), [Comisión Europea FAQ](https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/880312429/eSignature%2BFAQ), [Chile — Ley 19.799](https://www.bcn.cl/leychile/navegar?idNorma=196640), [ICO británico](https://ico.org.uk/for-organisations/guide-to-eidas/qualified-trust-services/), [Estados Unidos — 15 USC 7001](https://uscode.house.gov/view.xhtml?req=%28title%3A15+section%3A7001%28c%29+edition%3Aprelim%29).

> **Idiomas / Languages / Lingue:**
> 🇪🇸 **Español** | 🇬🇧 [English](README.md) | 🇧🇷 [Português](README.pt.md) | 🇮🇹 [Italiano](README.it.md) | 🇫🇷 [Français](README.fr.md)

---

[![License: MIT](https://img.shields.io/badge/Licencia-MIT-blue.svg)](LICENSE)
[![Obsidian Plugin](https://img.shields.io/badge/Obsidian-Plugin-purple.svg)](https://obsidian.md)
**Sin herramientas externas**: JavaScript / TypeScript
[![Platform: Desktop](https://img.shields.io/badge/Plataforma-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)]()
[![Idiomas](https://img.shields.io/badge/Idiomas-ES%20%7C%20EN%20%7C%20PT%20%7C%20IT%20%7C%20FR-orange.svg)]()

**PDF Digital Signature** es un plugin ligero y **con bibliotecas JavaScript incluidas** para [Obsidian](https://obsidian.md) que integra de forma nativa firmas digitales criptográficas (estándar PKCS#7 / X.509) y membretes personalizados en el pie de página de tus PDFs exportados.

La firma permite comprobar si el contenido firmado ha cambiado. La confianza en el firmante depende del certificado y de la configuración del lector. Un certificado autofirmado no obtiene confianza automática.

---

## ✨ Características

- 🔏 **Firmas Criptográficas Reales (PKCS#7):**
  X.509 (`.pfx` / `.p12`). Detecta cambios en el contenido firmado; no impide editar el PDF.
- 📄 **Pie de Página en Todas las Páginas:**
  Estampa tu nombre (o texto personalizado) en la esquina inferior izquierda y la numeración (`página / total`) a la derecha en cada hoja.
- 🎛️ **Controles Independientes por Exportación:**
  Elige por separado la firma criptográfica, el nombre del firmante y la numeración de páginas. Tus elecciones quedan guardadas como valores predeterminados.
- ⚡ **Portable con bibliotecas incluidas:**
  Desarrollado en TypeScript/JavaScript puro (`node-forge` + `pdf-lib` + `@signpdf`). No requiere Python, pip, OpenSSL ni comandos en la terminal.
- 🌐 **Soporte Multiidioma Nativo (i18n):**
  Traducción completa en **Español (`es`)**, **Inglés (`en`)**, **Portugués (`pt`)**, **Italiano (`it`)** y **Francés (`fr`)**, adaptándose automáticamente al idioma de Obsidian.
- ⏳ **Monitor de Caducidad y Alertas Recurrentes (<= 30 días):**
  Calcula la vigencia del certificado y muestra advertencias proactivas si le quedan **30 días o menos para vencer**, para que puedas configurar un certificado vigente.
- 🎛️ **Integración Nativa con Obsidian:**
  Aparece como tres controles independientes dentro de la ventana oficial de **«Exportar a PDF»** y recuerda tu preferencia para futuras exportaciones.
- ⏱️ **Automatización Inteligente:**
  Espera un tiempo configurable (por defecto 5 segundos) para asegurar el guardado en disco, aplica la firma criptográfica y abre el PDF firmado en tu lector predeterminado.
- 🔑 **Generador de Certificados Integrado:**
  ¿No tienes un certificado comercial? Crea un certificado autofirmado válido por 3 años directamente con un botón en los ajustes del plugin.
- 🛡️ **100% Privado y Sin Conexión:**
  Todo el proceso criptográfico se ejecuta localmente en tu ordenador. Sin telemetría ni llamadas a la nube.

---

## 🚀 ¿Cómo Funciona?

1. Abre cualquier nota en Obsidian y pulsa `Ctrl + P` (o `Cmd + P`) ➔ **Exportar a PDF**.
2. Elige cualquier combinación de las tres opciones añadidas: firma criptográfica, nombre del firmante y numeración.
3. Pulsa **Exportar a PDF** y elige dónde guardar el archivo.
4. El plugin automáticamente:
   - Exporta la nota estampando tu nombre al pie de cada página.
   - Muestra un aviso flotante con la cuenta regresiva de 5 segundos.
   - Sella el archivo con tu certificado digital `.pfx`.
   - Abre el PDF final firmado en tu visor predeterminado si esa opción está activada.

---

## 🛠️ Instalación

### Método 1: Plugins Comunitarios de Obsidian (Recomendado tras su aprobación)
1. Ve a **Ajustes** ➔ **Community plugins** (Plugins de la comunidad).
2. Busca **PDF Digital Signature**.
3. Haz clic en **Instalar** y luego en **Activar**.

### Método 2: Mediante BRAT (Beta Reviewer's Auto-update Tool)
1. Instala el plugin comunitario **BRAT** en Obsidian.
2. En los ajustes de BRAT, selecciona **Add Beta plugin**.
3. Pega la URL: `https://github.com/Benhaman9/obsidian-pdf-digital-signature`
4. Haz clic en **Add Plugin** y actívalo.

### Método 3: Instalación Manual
1. Descarga `main.js`, `manifest.json` y `styles.css` desde la sección de [Releases](https://github.com/Benhaman9/obsidian-pdf-digital-signature/releases).
2. Crea una carpeta llamada `obsidian-pdf-digital-signature` en la ruta `.obsidian/plugins/` de tu bóveda.
3. Copia los 3 archivos dentro de esa carpeta.
4. Reinicia Obsidian y activa el plugin en **Community plugins**.

---

## ⚙️ Configuración

En Obsidian: **Ajustes** ➔ **Firma Digital PDF**:

| Ajuste | Descripción | Por defecto |
| :--- | :--- | :--- |
| **Firmar criptográficamente por defecto** | Aplica la firma PKCS#7 independientemente del contenido del pie. | `true` |
| **Mostrar nombre por defecto** | Define si aparece el nombre del firmante abajo a la izquierda. | `true` |
| **Nombre en el pie de página** | Texto utilizado cuando está activada la opción de mostrar el nombre. | `Nombre del Firmante` |
| **Mostrar número de página** | Muestra el indicador `página / total` a la derecha. | `true` |
| **Demora antes de firmar** | Segundos de espera tras el guardado antes de aplicar la firma. | `5` segundos |
| **Abrir PDF tras firmar** | Abre el visor predeterminado automáticamente al terminar. | `true` |
| **Ruta del certificado digital** | Ruta relativa a la bóveda o absoluta a tu archivo `.pfx` o `.p12`. | `Scripts/certificado.pfx` |
| **Contraseña del certificado** | Contraseña para descifrar la clave privada. | Aleatoria al iniciar por primera vez |
| **Motivo / Ubicación** | Metadatos que figuran en el panel de firma de Adobe Acrobat. | Valores genéricos |

### Uso con Certificados Oficiales
Si cuentas con una Firma Electrónica oficial (Firma Electrónica Simple o Avanzada en formato `.pfx` o `.p12`), solo debes ingresar su ruta y contraseña en los ajustes.

---

## 📄 Licencia

Este proyecto está bajo la [Licencia MIT](LICENSE).

Creado con ❤️ por [Benjamín Alcalde G.](https://github.com/Benhaman9)

## Limitaciones del certificado y la firma

Se genera una contraseña aleatoria al iniciar por primera vez. Puedes cambiarla antes de crear un certificado; no se permite crear certificados nuevos con contraseña vacía. Se requiere Obsidian 1.11.5 o posterior. La contraseña se guarda en el almacén local SecretStorage, fuera de `data.json`; las contraseñas anteriores se migran al cargar el plugin. Debe configurarse por separado en cada dispositivo. Crear un certificado autofirmado nunca sobrescribe el certificado configurado. No se puede firmar con certificados caducados o todavía no vigentes. Se rechazan PDFs ya firmados porque el plugin reescribe el documento en lugar de añadir una firma incremental. Usa `adbe.pkcs7.detached`; no se afirma conformidad completa con perfiles PAdES, sellado de tiempo de confianza ni validación a largo plazo.

[Adobe: certificate trust](https://helpx.adobe.com/acrobat/using/trusted-identities.html) · [Signing library](https://github.com/vbuch/node-signpdf)
