import { getLanguage as getObsidianLanguage } from "obsidian";

export type TranslationKey =
  | "cert_location_inside"
  | "cert_location_unknown"
  | "cert_private_path"
  | "signature_mode_choose"
  | "signature_choice_required"
  | "export_integration_unavailable"
  | "export_waiting"
  | "export_validating"
  | "export_timeout"
  | "export_invalid"
  | "export_cancelled"
  | "phase_verifying"
  | "verify_revision_valid"
  | "verify_revision_invalid"
  | "verify_revision_unknown"
  | "verify_coverage_full"
  | "verify_coverage_partial"
  | "verify_coverage_unknown"
  | "verify_trust_not_checked"
  | "verify_revocation_not_checked"
  | "verify_timestamp_not_checked"
  | "error_file_too_large"
  | "error_ambiguous_cert"
  | "error_weak_rsa"
  | "error_cert_key_usage"
  | "error_signing_verification"
  | "signing_review_title"
  | "signing_review_file"
  | "signing_review_certificate"
  | "signing_review_copy"
  | "signing_review_action"
  | "action_cancel"
  | "notice_pending_changed"
  | "verify_appended"
  | "verify_crypto_failed"
  | "verify_crypto_intact"
  | "verify_fingerprint"
  | "verify_issuer"
  | "verify_self_signed"
  | "certificate_new_path"
  | "certificate_self_signed_no"
  | "verify_command"
  | "verify_title"
  | "verify_intact"
  | "verify_modified"
  | "verify_unsigned"
  | "verify_unsupported"
  | "verify_limits"
  | "verify_certificate_current"
  | "verify_certificate_expired"
  | "verify_signer"
  | "verify_error"
  | "settings_signature_mode_name"
  | "settings_signature_mode_desc"
  | "signature_mode_approval"
  | "signature_mode_certify"
  | "settings_jurisdiction_name"
  | "jurisdiction_international"
  | "jurisdiction_cl"
  | "jurisdiction_eu"
  | "jurisdiction_uk"
  | "jurisdiction_us"
  | "jurisdiction_international_guidance"
  | "jurisdiction_cl_guidance"
  | "jurisdiction_eu_guidance"
  | "jurisdiction_uk_guidance"
  | "jurisdiction_us_guidance"
  | "settings_signature_levels_desc"
  | "default_signer_name"
  | "default_reason"
  | "default_location"
  | "settings_cert_status_invalid"
  | "error_invalid_cert"
  | "error_empty_cert_path"
  | "error_pdf_missing"
  | "error_cert_missing"
  | "error_already_signed"
  | "notice_already_pending"
  | "notice_open_error"
  | "notice_dialog_unavailable"
  | "notice_dialog_error"
  | "dialog_pdf_files"
  | "error_not_yet_valid"
  | "error_no_signing_cert"
  | "error_expired_cert"
  | "error_password_required"
  | "error_pdf_changed"
  | "plugin_loaded"
  | "modal_toggle_title"
  | "modal_toggle_desc"
  | "modal_options_title"
  | "modal_crypto_name"
  | "modal_crypto_desc"
  | "modal_signer_name"
  | "modal_signer_desc"
  | "modal_page_number_name"
  | "modal_page_number_desc"
  | "cmd_toggle_default"
  | "cmd_sign_existing"
  | "notice_saved_countdown"
  | "notice_signing_in_progress"
  | "notice_signing_success"
  | "notice_signing_error"
  | "notice_cert_generated"
  | "notice_cert_gen_error"
  | "notice_cert_expired"
  | "notice_cert_expiring_soon"
  | "notice_signature_toggled_on"
  | "notice_signature_toggled_off"
  | "settings_title"
  | "settings_desc"
  | "settings_default_toggle_name"
  | "settings_default_toggle_desc"
  | "settings_signer_toggle_name"
  | "settings_signer_toggle_desc"
  | "settings_signer_name_name"
  | "settings_signer_name_desc"
  | "settings_page_number_name"
  | "settings_page_number_desc"
  | "settings_delay_name"
  | "settings_delay_desc"
  | "settings_open_after_name"
  | "settings_open_after_desc"
  | "settings_cert_section_title"
  | "settings_cert_status_valid"
  | "settings_cert_status_expiring"
  | "settings_cert_status_expired"
  | "settings_cert_status_not_found"
  | "settings_cert_path_name"
  | "settings_cert_path_desc"
  | "settings_cert_password_name"
  | "settings_cert_password_desc"
  | "settings_reason_name"
  | "settings_reason_desc"
  | "settings_location_name"
  | "settings_location_desc"
  | "settings_btn_generate"
  | "settings_btn_generate_desc";

const en: Record<TranslationKey, string> = {
  cert_location_inside: "This certificate is inside the vault or linked into it; it may be copied by sync and backups. Choose an external path if you want to avoid this.",
  cert_location_unknown: "The certificate location could not be confirmed. Choose a local path outside the vault and check any links, sync and backup settings.",
  cert_private_path: "Local path outside the vault",
  signature_mode_choose: "Choose how to sign…",
  signature_choice_required: "Choose a signature mode before signing.",
  export_integration_unavailable: "Automatic PDF export integration is unavailable in this Obsidian version. You can still use the manual PDF signing and checking commands.",
  export_waiting: "Waiting for PDF export: {name}",
  export_validating: "Validating exported PDF: {name}",
  export_timeout: "The PDF export did not finish within the allowed time. Check the exported file and try again.",
  export_invalid: "The exported file is incomplete or could not be validated as a supported PDF. No signature was applied.",
  export_cancelled: "PDF signing was cancelled.",
  phase_verifying: "Checking the generated signature: {name}",
  verify_revision_valid: "Signed revision: cryptographic signature verified.",
  verify_revision_invalid: "Signed revision: cryptographic signature verification failed.",
  verify_revision_unknown: "Signed revision: could not be checked.",
  verify_coverage_full: "Coverage: the signature covers the complete current file.",
  verify_coverage_partial: "Coverage: the current file contains data beyond the signed revision.",
  verify_coverage_unknown: "Coverage: could not be established.",
  verify_trust_not_checked: "Certificate trust: not checked.",
  verify_revocation_not_checked: "Certificate revocation: not checked.",
  verify_timestamp_not_checked: "Trusted timestamps: not checked.",
  error_file_too_large: "File too large. The maximum input size is 64 MiB for PDFs and 4 MiB for PKCS#12 certificates.",
  error_ambiguous_cert: "The certificate file contains multiple signing keys or matching certificates. Use an unambiguous signing identity.",
  error_weak_rsa: "RSA signing keys must have at least 2048 bits.",
  error_cert_key_usage: "The certificate key usage does not permit digital signatures.",
  error_signing_verification: "The generated signature did not pass the local integrity check. The original PDF was preserved.",
  signing_review_title: "Review PDF signing",
  signing_review_file: "File: {name}",
  signing_review_certificate: "Signing certificate: {name}",
  signing_review_copy: "A signed copy will be created; the original will be preserved.",
  signing_review_action: "Create signed copy",
  action_cancel: "Cancel",
  notice_pending_changed: "The PDF changed while waiting to be signed. No signature was applied; review the current file and try again.",
  verify_appended: "There are {bytes} bytes after the signed revision. The current file is not fully covered by the signature.",
  verify_crypto_failed: "The cryptographic signature could not be verified.",
  verify_crypto_intact: "The cryptographic signature of the signed revision is correct. This does not establish that the current document is unchanged.",
  verify_fingerprint: "Certificate fingerprint (SHA-256): {fingerprint}",
  verify_issuer: "Issuer stated in the certificate: {issuer}",
  verify_self_signed: "Self-signed certificate: yes. Its identity is not independently verified by this checker.",
  certificate_new_path: "A new self-signed certificate was created at {path}; the previous certificate was preserved.",
  certificate_self_signed_no: "Self-signed certificate: no. This alone does not establish trust or verify the identity.",
  verify_command: "Check PDF signature integrity",
  verify_title: "PDF signature integrity",
  verify_intact: "The signature is cryptographically correct and covers the entire file. No later bytes were detected.",
  verify_modified: "The file has changed, contains later data, or its signature could not be verified. Do not treat the current document as intact.",
  verify_unsigned: "No compatible signature was detected.",
  verify_unsupported: "This signature or PDF structure is not supported by the local checker. Use an independent PDF signature validator.",
  verify_limits: "Local integrity check. It does not verify trust, revocation, timestamps, PAdES compliance or legal sufficiency.",
  verify_certificate_current: "The signing certificate is within its validity period today.",
  verify_certificate_expired: "The signing certificate is outside its validity period today. This does not establish its status at signing time.",
  verify_signer: "Certificate subject: {name}",
  verify_error: "Could not check the PDF: {error}",
  settings_signature_mode_name: "Signature purpose",
  settings_signature_mode_desc: "Integrity signatures protect the signed revision. Certification declares that no later changes are allowed (DocMDP). Compatible readers enforce and report this policy; it cannot make a PDF impossible to edit.",
  signature_mode_approval: "Integrity signature",
  signature_mode_certify: "Certify — no changes allowed",
  settings_jurisdiction_name: "Country or legal context (guidance)",
  jurisdiction_international: "General / international",
  jurisdiction_cl: "Chile",
  jurisdiction_eu: "European Union",
  jurisdiction_uk: "United Kingdom",
  jurisdiction_us: "United States",
  jurisdiction_international_guidance: "This choice only changes guidance. It does not change your certificate, certify your identity or establish legal acceptance. Self-signed certificates can be useful for personal integrity checks; recipients must establish trust separately.",
  jurisdiction_cl_guidance: "Chile: Law 19,799 distinguishes electronic and advanced electronic signatures. Advanced signatures require the applicable accredited certification and legal conditions. Choosing Chile or generating a self-signed certificate does not provide that status. Check the recipient's requirements.",
  jurisdiction_eu_guidance: "EU: a qualified electronic signature requires a qualified certificate and a qualified signature creation device or service, under eIDAS. A PDF signature or a self-signed certificate alone does not confer qualified status. Check the provider, service and recipient's requirements.",
  jurisdiction_uk_guidance: "UK: check the recipient's requirements and the applicable UK trust framework. Choosing this context does not establish a qualified signature or automatic recognition of a provider.",
  jurisdiction_us_guidance: "US: requirements depend on the transaction, consent, applicable law and recipient. This setting does not establish compliance or universal acceptance of a certificate.",
  settings_signature_levels_desc: "Available: local certificate signing, with optional certification against later changes. Trusted timestamps and PAdES T/LT/LTA are not yet supported. These technical levels differ from legal signature categories. Provider tokens and remote signing are not supported by the current .pfx/.p12 flow.",
  error_pdf_changed: "The PDF changed while it was being signed. The current file was preserved.",
  default_signer_name: "Signer name",
  default_reason: "Signature reason",
  default_location: "Location",
  settings_cert_status_invalid: "⚠️ Certificate error: {error}",
  error_invalid_cert: "Invalid certificate or incorrect password",
  error_empty_cert_path: "The certificate path cannot be empty.",
  error_pdf_missing: "The PDF file does not exist: {path}",
  error_cert_missing: "The certificate file does not exist: {path}",
  error_already_signed: "This PDF already contains a signature. Signing it again would invalidate the existing signature.",
  notice_already_pending: "This PDF is already waiting to be signed.",
  notice_open_error: "The PDF was signed, but could not be opened: {error}",
  notice_dialog_unavailable: "The system file picker is unavailable.",
  notice_dialog_error: "Error opening the file picker: {error}",
  dialog_pdf_files: "PDF files",
  error_not_yet_valid: "The certificate is not yet valid.",
  error_no_signing_cert: "No RSA certificate matching the encrypted private key was found.",
  error_expired_cert: "The certificate has expired. Renew it before signing.",
  error_password_required: "Set a certificate password before creating a private key.",

  plugin_loaded: "PDF Digital Signature loaded.",
  modal_toggle_title: "Sign with digital certificate",
  modal_toggle_desc: 'Add running footer on the left and sign cryptographically (PKCS#7).',
  modal_options_title: "Options for this PDF",
  modal_crypto_name: "Cryptographically sign the PDF",
  modal_crypto_desc: "Apply a PKCS#7 digital signature with your certificate.",
  modal_signer_name: "Show signer name",
  modal_signer_desc: "Place it in the bottom-left corner of every page.",
  modal_page_number_name: "Show page number",
  modal_page_number_desc: "Place it in the bottom-right corner as current page / total pages.",
  cmd_toggle_default: "Toggle default PDF digital signing",
  cmd_sign_existing: "Digitally sign an existing PDF...",
  notice_saved_countdown: "⏳ PDF saved: {name}\nSigning digitally in {delay} seconds...",
  notice_signing_in_progress: "🔏 Signing with digital certificate:\n{name}...",
  notice_signing_success: "✅ PDF digitally signed successfully:\n{name}",
  notice_signing_error: "❌ Error digitally signing {name}:\n{error}",
  notice_cert_generated: "✅ Digital certificate successfully generated at:\n{path}",
  notice_cert_gen_error: "❌ Error generating certificate: {error}",
  notice_cert_expired: "⚠️ Your digital certificate expired on {date}. Renew it in Settings before signing more PDFs.",
  notice_cert_expiring_soon: "⚠️ Reminder: Your digital certificate expires in {days} days (on {date}). Please renew it in Settings -> PDF Digital Signature.",
  notice_signature_toggled_on: "PDF digital signature: Enabled",
  notice_signature_toggled_off: "PDF digital signature: Disabled",
  settings_title: "PDF Digital Signature — Settings",
  settings_desc: "Configure the automatic running footer and cryptographic digital certificates (PKCS#7 / X.509).",
  settings_default_toggle_name: "Cryptographically sign by default",
  settings_default_toggle_desc: "Apply a PKCS#7 signature on export, independently from the footer content.",
  settings_signer_toggle_name: "Show signer name by default",
  settings_signer_toggle_desc: "Place the signer name in the bottom-left corner of exported PDFs.",
  settings_signer_name_name: "Signer name (Running footer)",
  settings_signer_name_desc: "Name displayed at the bottom-left of every page.",
  settings_page_number_name: "Display page number",
  settings_page_number_desc: "Show 'page / total' on the bottom-right of every page.",
  settings_delay_name: "Maximum export wait (seconds)",
  settings_delay_desc: "Maximum time to wait for a complete, stable PDF before validation and signing. This is a deadline, not a fixed delay.",
  settings_open_after_name: "Open PDF after signing",
  settings_open_after_desc: "Automatically open the signed PDF in your default viewer.",
  settings_cert_section_title: "Digital Certificate (.pfx / .p12)",
  settings_cert_status_valid: "🟢 Certificate within its validity period until {date} ({days} days remaining). Trust and revocation have not been checked.",
  settings_cert_status_expiring: "🟡 Certificate status: Expiring soon! Only {days} days remaining (expires on {date}).",
  settings_cert_status_expired: "🔴 Certificate expired on {date}. Configure a current certificate from your provider, or create a new self-signed certificate for personal use.",
  settings_cert_status_not_found: "⚪ Certificate status: Certificate file not found yet. Click below to generate one.",
  settings_cert_path_name: "Certificate file path",
  settings_cert_path_desc: "Relative to vault root or absolute path to your .pfx or .p12 file.",
  settings_cert_password_name: "Certificate password",
  settings_cert_password_desc: "Password used to decrypt your private key.",
  settings_reason_name: "Reason for signing",
  settings_reason_desc: "Metadata displayed in the Adobe Acrobat / Foxit signature panel.",
  settings_location_name: "Location",
  settings_location_desc: "Geographic location of the signer.",
  settings_btn_generate: "Create self-signed certificate",
  settings_btn_generate_desc: "Creates a new self-signed certificate. If the configured file exists, a different file is created and the previous certificate is preserved. This does not renew a provider-issued certificate.",
};

const es: Record<TranslationKey, string> = {
  cert_location_inside: "Este certificado está dentro de la bóveda o enlazado a ella; puede copiarse con sincronizaciones y respaldos. Elige una ruta externa si deseas evitarlo.",
  cert_location_unknown: "No se pudo confirmar la ubicación del certificado. Elige una ruta local fuera de la bóveda y revisa los enlaces y la configuración de sincronizaciones y respaldos.",
  cert_private_path: "Ruta local fuera de la bóveda",
  signature_mode_choose: "Elige cómo firmar…",
  signature_choice_required: "Elige un modo de firma antes de firmar.",
  export_integration_unavailable: "La integración automática con la exportación PDF no está disponible en esta versión de Obsidian. Puedes usar los comandos manuales para firmar y comprobar PDFs.",
  export_waiting: "Esperando la exportación PDF: {name}",
  export_validating: "Validando el PDF exportado: {name}",
  export_timeout: "La exportación PDF no terminó dentro del plazo permitido. Revisa el archivo exportado e inténtalo de nuevo.",
  export_invalid: "El archivo exportado está incompleto o no pudo validarse como PDF compatible. No se aplicó ninguna firma.",
  export_cancelled: "Se canceló la firma del PDF.",
  phase_verifying: "Comprobando la firma generada: {name}",
  verify_revision_valid: "Revisión firmada: firma criptográfica verificada.",
  verify_revision_invalid: "Revisión firmada: falló la verificación de la firma criptográfica.",
  verify_revision_unknown: "Revisión firmada: no se pudo comprobar.",
  verify_coverage_full: "Cobertura: la firma abarca el archivo actual completo.",
  verify_coverage_partial: "Cobertura: el archivo actual contiene datos posteriores a la revisión firmada.",
  verify_coverage_unknown: "Cobertura: no se pudo determinar.",
  verify_trust_not_checked: "Confianza en el certificado: no comprobada.",
  verify_revocation_not_checked: "Revocación del certificado: no comprobada.",
  verify_timestamp_not_checked: "Sellos de tiempo de confianza: no comprobados.",
  error_file_too_large: "Archivo demasiado grande. El máximo de entrada es 64 MiB para PDFs y 4 MiB para certificados PKCS#12.",
  error_ambiguous_cert: "El archivo del certificado contiene varias claves firmantes o certificados coincidentes. Usa una identidad firmante inequívoca.",
  error_weak_rsa: "Las claves RSA de firma deben tener al menos 2048 bits.",
  error_cert_key_usage: "El uso de clave del certificado no permite firmas digitales.",
  error_signing_verification: "La firma generada no superó la comprobación local de integridad. Se conservó el PDF original.",
  signing_review_title: "Revisar firma del PDF",
  signing_review_file: "Archivo: {name}",
  signing_review_certificate: "Certificado firmante: {name}",
  signing_review_copy: "Se creará una copia firmada; el original se conserva.",
  signing_review_action: "Crear copia firmada",
  action_cancel: "Cancelar",
  notice_pending_changed: "El PDF cambió mientras esperaba la firma. No se aplicó ninguna firma; revisa el archivo actual e inténtalo de nuevo.",
  verify_appended: "Hay {bytes} bytes posteriores a la revisión firmada. La firma no abarca el archivo actual completo.",
  verify_crypto_failed: "No se pudo verificar la firma criptográfica.",
  verify_crypto_intact: "La firma criptográfica de la revisión firmada es correcta. Esto no establece que el documento actual siga sin cambios.",
  verify_fingerprint: "Huella del certificado (SHA-256): {fingerprint}",
  verify_issuer: "Emisor indicado en el certificado: {issuer}",
  verify_self_signed: "Certificado autofirmado: sí. Este comprobador no verifica su identidad de forma independiente.",
  certificate_new_path: "Se creó un certificado autofirmado nuevo en {path}; se conservó el certificado anterior.",
  certificate_self_signed_no: "Certificado autofirmado: no. Esto por sí solo no establece confianza ni verifica la identidad.",
  verify_command: "Comprobar integridad de la firma de un PDF",
  verify_title: "Integridad de la firma PDF",
  verify_intact: "La firma es criptográficamente correcta y abarca el archivo completo. No se detectaron bytes posteriores.",
  verify_modified: "El archivo cambió, contiene datos posteriores o no pudo verificarse su firma. No consideres íntegro el documento actual.",
  verify_unsigned: "No se detectó una firma compatible.",
  verify_unsupported: "El comprobador local no admite esta firma o estructura PDF. Usa un validador independiente de firmas PDF.",
  verify_limits: "Comprobación local de integridad. No verifica confianza, revocación, sellos de tiempo, cumplimiento PAdES ni suficiencia jurídica.",
  verify_certificate_current: "El certificado firmante está dentro de su vigencia hoy.",
  verify_certificate_expired: "El certificado firmante está fuera de su vigencia hoy. Esto no establece su estado al momento de firmar.",
  verify_signer: "Titular indicado en el certificado: {name}",
  verify_error: "No se pudo comprobar el PDF: {error}",
  settings_signature_mode_name: "Finalidad de la firma",
  settings_signature_mode_desc: "La firma de integridad protege la revisión firmada. La certificación declara que no se permiten cambios posteriores (DocMDP). Los lectores compatibles aplican e informan esta política; no hace imposible editar un PDF.",
  signature_mode_approval: "Firma de integridad",
  signature_mode_certify: "Certificar — sin cambios permitidos",
  settings_jurisdiction_name: "País o contexto jurídico (orientación)",
  jurisdiction_international: "General / internacional",
  jurisdiction_cl: "Chile",
  jurisdiction_eu: "Unión Europea",
  jurisdiction_uk: "Reino Unido",
  jurisdiction_us: "Estados Unidos",
  jurisdiction_international_guidance: "Esta elección solo cambia la orientación. No modifica tu certificado, acredita tu identidad ni establece aceptación jurídica. Un certificado autofirmado puede servir para comprobar la integridad personal; el destinatario debe establecer la confianza por separado.",
  jurisdiction_cl_guidance: "Chile: la Ley 19.799 distingue firma electrónica y firma electrónica avanzada. La avanzada requiere la certificación acreditada y las condiciones legales aplicables. Elegir Chile o generar un certificado autofirmado no otorga ese carácter. Revisa los requisitos del destinatario.",
  jurisdiction_eu_guidance: "UE: la firma electrónica cualificada requiere un certificado cualificado y un dispositivo o servicio cualificado de creación de firma, conforme a eIDAS. Una firma PDF o un certificado autofirmado por sí solos no otorgan esa condición. Comprueba el proveedor, el servicio y los requisitos del destinatario.",
  jurisdiction_uk_guidance: "Reino Unido: comprueba los requisitos del destinatario y el marco británico de confianza aplicable. Elegir este contexto no establece una firma cualificada ni el reconocimiento automático de un proveedor.",
  jurisdiction_us_guidance: "Estados Unidos: los requisitos dependen de la operación, el consentimiento, la legislación aplicable y el destinatario. Este ajuste no establece cumplimiento normativo ni aceptación universal de un certificado.",
  settings_signature_levels_desc: "Disponible: firma con certificado local y certificación opcional contra cambios posteriores. Aún no se admiten sellos de tiempo de confianza ni PAdES T/LT/LTA. Estos niveles técnicos son distintos de las categorías jurídicas. El flujo actual .pfx/.p12 no admite tokens de proveedores ni firma remota.",
  error_pdf_changed: "El PDF cambió mientras se firmaba. Se conservó el archivo actual.",
  default_signer_name: "Nombre del firmante",
  default_reason: "Motivo de la firma",
  default_location: "Ubicación",
  settings_cert_status_invalid: "⚠️ Error del certificado: {error}",
  error_invalid_cert: "Certificado no válido o contraseña incorrecta",
  error_empty_cert_path: "La ruta del certificado no puede estar vacía.",
  error_pdf_missing: "El archivo PDF no existe: {path}",
  error_cert_missing: "El certificado digital no existe: {path}",
  error_already_signed: "Este PDF ya contiene una firma. Volver a firmarlo invalidaría la firma existente.",
  notice_already_pending: "Este PDF ya está pendiente de firma.",
  notice_open_error: "El PDF se firmó, pero no se pudo abrir: {error}",
  notice_dialog_unavailable: "El selector de archivos del sistema no está disponible.",
  notice_dialog_error: "Error al abrir el selector de archivos: {error}",
  dialog_pdf_files: "Archivos PDF",
  error_not_yet_valid: "El certificado todavía no es válido.",
  error_no_signing_cert: "No se encontró un certificado RSA que corresponda a la clave privada cifrada.",
  error_expired_cert: "El certificado caducó. Renuévalo antes de firmar.",
  error_password_required: "Establece una contraseña antes de crear la clave privada.",

  plugin_loaded: "Plugin Firma Digital PDF cargado.",
  modal_toggle_title: "Firmar con certificado digital",
  modal_toggle_desc: 'Pie de página con tu nombre a la izq. y firma criptográfica (PKCS#7).',
  modal_options_title: "Opciones para este PDF",
  modal_crypto_name: "Firmar criptográficamente el PDF",
  modal_crypto_desc: "Aplica una firma digital PKCS#7 con tu certificado.",
  modal_signer_name: "Mostrar nombre del firmante",
  modal_signer_desc: "Lo coloca en la esquina inferior izquierda de cada página.",
  modal_page_number_name: "Mostrar número de página",
  modal_page_number_desc: "Lo coloca en la esquina inferior derecha con el formato N/T.",
  cmd_toggle_default: "Alternar firma digital por defecto al exportar a PDF",
  cmd_sign_existing: "Firmar digitalmente un PDF existente...",
  notice_saved_countdown: "⏳ PDF guardado: {name}\nSe firmará digitalmente en {delay} segundos...",
  notice_signing_in_progress: "🔏 Firmando digitalmente con certificado:\n{name}...",
  notice_signing_success: "✅ PDF firmado digitalmente con éxito:\n{name}",
  notice_signing_error: "❌ Error al firmar digitalmente {name}:\n{error}",
  notice_cert_generated: "✅ Certificado digital generado con éxito en:\n{path}",
  notice_cert_gen_error: "❌ Error al generar certificado: {error}",
  notice_cert_expired: "⚠️ Tu certificado digital expiró el {date}. Renuévalo en Ajustes antes de firmar más PDFs.",
  notice_cert_expiring_soon: "⚠️ Aviso: A tu certificado digital le quedan {days} días de vigencia (vence el {date}). Renuévalo en Ajustes -> Firma Digital PDF.",
  notice_signature_toggled_on: "Firma digital PDF: Activada",
  notice_signature_toggled_off: "Firma digital PDF: Desactivada",
  settings_title: "Firma Digital PDF — Ajustes",
  settings_desc: "Configuración del membrete de pie de página y del certificado digital criptográfico (PKCS#7 / X.509).",
  settings_default_toggle_name: "Firmar criptográficamente por defecto",
  settings_default_toggle_desc: "Aplica una firma digital PKCS#7 al exportar; es independiente de los textos del pie de página.",
  settings_signer_toggle_name: "Mostrar nombre del firmante por defecto",
  settings_signer_toggle_desc: "Coloca el nombre en la esquina inferior izquierda de los PDFs exportados.",
  settings_signer_name_name: "Nombre en el pie de página",
  settings_signer_name_desc: "Texto que aparecerá en el pie de página a la izquierda de todas las hojas.",
  settings_page_number_name: "Mostrar número de página",
  settings_page_number_desc: "Muestra 'página / total' a la derecha en el pie de página.",
  settings_delay_name: "Espera máxima de exportación (segundos)",
  settings_delay_desc: "Plazo máximo para esperar un PDF completo y estable antes de validarlo y firmarlo. Es un límite de espera, no una demora fija.",
  settings_open_after_name: "Abrir PDF tras firmar",
  settings_open_after_desc: "Abre el archivo PDF en tu visor predeterminado una vez finalizada la firma criptográfica.",
  settings_cert_section_title: "Certificado Digital (.pfx / .p12)",
  settings_cert_status_valid: "🟢 Certificado dentro de su vigencia hasta el {date} (quedan {days} días). No se han comprobado la confianza ni la revocación.",
  settings_cert_status_expiring: "🟡 Estado del certificado: ¡Por caducar! Quedan {days} días (vence el {date}).",
  settings_cert_status_expired: "🔴 Certificado caducado el {date}. Configura un certificado vigente de tu proveedor o crea uno autofirmado nuevo para uso personal.",
  settings_cert_status_not_found: "⚪ Estado del certificado: Archivo no encontrado. Haz clic abajo para crearlo.",
  settings_cert_path_name: "Ruta del certificado digital",
  settings_cert_path_desc: "Ruta relativa a la bóveda o absoluta a tu archivo .pfx o .p12.",
  settings_cert_password_name: "Contraseña del certificado",
  settings_cert_password_desc: "Contraseña para descifrar la clave privada del certificado digital.",
  settings_reason_name: "Motivo de la firma (Reason)",
  settings_reason_desc: "Metadato que figurará en el panel de firma de Adobe Acrobat / Foxit.",
  settings_location_name: "Lugar / Ubicación (Location)",
  settings_location_desc: "Ubicación geográfica del firmante (ej. Chile).",
  settings_btn_generate: "Crear certificado autofirmado",
  settings_btn_generate_desc: "Crea un certificado autofirmado nuevo. Si el archivo configurado existe, se crea otro y se conserva el certificado anterior. Esto no renueva un certificado emitido por un proveedor.",
};

const pt: Record<TranslationKey, string> = {
  cert_location_inside: "Este certificado está dentro do cofre ou vinculado a ele; pode ser copiado pela sincronização e por backups. Escolha um caminho externo para evitar isso.",
  cert_location_unknown: "Não foi possível confirmar a localização do certificado. Escolha um caminho local fora do cofre e verifique os vínculos e as configurações de sincronização e backup.",
  cert_private_path: "Caminho local fora do cofre",
  signature_mode_choose: "Escolha como assinar…",
  signature_choice_required: "Escolha um modo de assinatura antes de assinar.",
  export_integration_unavailable: "A integração automática com a exportação PDF não está disponível nesta versão do Obsidian. Você pode usar os comandos manuais para assinar e verificar PDFs.",
  export_waiting: "Aguardando a exportação PDF: {name}",
  export_validating: "Validando o PDF exportado: {name}",
  export_timeout: "A exportação PDF não terminou dentro do prazo permitido. Verifique o arquivo exportado e tente novamente.",
  export_invalid: "O arquivo exportado está incompleto ou não pôde ser validado como PDF compatível. Nenhuma assinatura foi aplicada.",
  export_cancelled: "A assinatura do PDF foi cancelada.",
  phase_verifying: "Verificando a assinatura gerada: {name}",
  verify_revision_valid: "Revisão assinada: assinatura criptográfica verificada.",
  verify_revision_invalid: "Revisão assinada: falha na verificação da assinatura criptográfica.",
  verify_revision_unknown: "Revisão assinada: não foi possível verificar.",
  verify_coverage_full: "Cobertura: a assinatura abrange o arquivo atual inteiro.",
  verify_coverage_partial: "Cobertura: o arquivo atual contém dados posteriores à revisão assinada.",
  verify_coverage_unknown: "Cobertura: não foi possível determinar.",
  verify_trust_not_checked: "Confiança no certificado: não verificada.",
  verify_revocation_not_checked: "Revogação do certificado: não verificada.",
  verify_timestamp_not_checked: "Carimbos de tempo confiáveis: não verificados.",
  error_file_too_large: "Arquivo muito grande. O tamanho máximo de entrada é de 64 MiB para PDFs e 4 MiB para certificados PKCS#12.",
  error_ambiguous_cert: "O arquivo do certificado contém várias chaves de assinatura ou certificados correspondentes. Use uma identidade de assinatura inequívoca.",
  error_weak_rsa: "As chaves RSA de assinatura devem ter pelo menos 2048 bits.",
  error_cert_key_usage: "O uso de chave do certificado não permite assinaturas digitais.",
  error_signing_verification: "A assinatura gerada não passou na verificação local de integridade. O PDF original foi preservado.",
  signing_review_title: "Revisar assinatura do PDF",
  signing_review_file: "Arquivo: {name}",
  signing_review_certificate: "Certificado do signatário: {name}",
  signing_review_copy: "Uma cópia assinada será criada; o original será preservado.",
  signing_review_action: "Criar cópia assinada",
  action_cancel: "Cancelar",
  notice_pending_changed: "O PDF mudou enquanto aguardava a assinatura. Nenhuma assinatura foi aplicada; revise o arquivo atual e tente novamente.",
  verify_appended: "Há {bytes} bytes após a revisão assinada. A assinatura não cobre o arquivo atual inteiro.",
  verify_crypto_failed: "Não foi possível verificar a assinatura criptográfica.",
  verify_crypto_intact: "A assinatura criptográfica da revisão assinada está correta. Isso não estabelece que o documento atual esteja inalterado.",
  verify_fingerprint: "Impressão digital do certificado (SHA-256): {fingerprint}",
  verify_issuer: "Emissor indicado no certificado: {issuer}",
  verify_self_signed: "Certificado autoassinado: sim. Este verificador não verifica sua identidade de forma independente.",
  certificate_new_path: "Um novo certificado autoassinado foi criado em {path}; o certificado anterior foi preservado.",
  certificate_self_signed_no: "Certificado autoassinado: não. Isso, por si só, não estabelece confiança nem verifica a identidade.",
  verify_command: "Verificar a integridade da assinatura de um PDF",
  verify_title: "Integridade da assinatura PDF",
  verify_intact: "A assinatura está criptograficamente correta e abrange o arquivo inteiro. Nenhum byte posterior foi detectado.",
  verify_modified: "O arquivo mudou, contém dados posteriores ou sua assinatura não pôde ser verificada. Não considere o documento atual íntegro.",
  verify_unsigned: "Nenhuma assinatura compatível foi detectada.",
  verify_unsupported: "O verificador local não suporta esta assinatura ou estrutura PDF. Use um validador independente de assinaturas PDF.",
  verify_limits: "Verificação local de integridade. Não verifica confiança, revogação, carimbos de tempo, conformidade PAdES ou suficiência jurídica.",
  verify_certificate_current: "O certificado do signatário está dentro do prazo de validade hoje.",
  verify_certificate_expired: "O certificado do signatário está fora do prazo de validade hoje. Isso não estabelece sua situação no momento da assinatura.",
  verify_signer: "Titular indicado no certificado: {name}",
  verify_error: "Não foi possível verificar o PDF: {error}",
  settings_signature_mode_name: "Finalidade da assinatura",
  settings_signature_mode_desc: "A assinatura de integridade protege a revisão assinada. A certificação declara que alterações posteriores não são permitidas (DocMDP). Leitores compatíveis aplicam e informam esta política; ela não torna impossível editar um PDF.",
  signature_mode_approval: "Assinatura de integridade",
  signature_mode_certify: "Certificar — sem alterações permitidas",
  settings_jurisdiction_name: "País ou contexto jurídico (orientação)",
  jurisdiction_international: "Geral / internacional",
  jurisdiction_cl: "Chile",
  jurisdiction_eu: "União Europeia",
  jurisdiction_uk: "Reino Unido",
  jurisdiction_us: "Estados Unidos",
  jurisdiction_international_guidance: "Esta escolha apenas altera a orientação. Não modifica o certificado, comprova a identidade ou estabelece aceitação jurídica. Certificados autoassinados podem ser úteis para verificar a integridade pessoal; o destinatário deve estabelecer a confiança separadamente.",
  jurisdiction_cl_guidance: "Chile: a Lei 19.799 distingue assinaturas eletrônicas e avançadas. As avançadas exigem a certificação acreditada e as condições legais aplicáveis. Escolher Chile ou gerar um certificado autoassinado não concede esse status. Verifique os requisitos do destinatário.",
  jurisdiction_eu_guidance: "UE: uma assinatura eletrônica qualificada exige certificado qualificado e dispositivo ou serviço qualificado de criação de assinatura, conforme o eIDAS. Uma assinatura PDF ou certificado autoassinado isoladamente não concede esse status. Verifique o prestador, o serviço e os requisitos do destinatário.",
  jurisdiction_uk_guidance: "Reino Unido: verifique os requisitos do destinatário e o regime britânico de confiança aplicável. Esta escolha não estabelece uma assinatura qualificada nem o reconhecimento automático de um prestador.",
  jurisdiction_us_guidance: "Estados Unidos: os requisitos dependem da transação, do consentimento, da legislação aplicável e do destinatário. Esta opção não estabelece conformidade nem aceitação universal de um certificado.",
  settings_signature_levels_desc: "Disponível: assinatura com certificado local e certificação opcional contra alterações posteriores. Carimbos de tempo confiáveis e PAdES T/LT/LTA ainda não são suportados. Esses níveis técnicos diferem das categorias jurídicas. O fluxo atual .pfx/.p12 não suporta tokens de prestadores nem assinatura remota.",
  error_pdf_changed: "O PDF mudou durante a assinatura. O arquivo atual foi preservado.",
  default_signer_name: "Nome do signatário",
  default_reason: "Motivo da assinatura",
  default_location: "Localização",
  settings_cert_status_invalid: "⚠️ Erro do certificado: {error}",
  error_invalid_cert: "Certificado inválido ou senha incorreta",
  error_empty_cert_path: "O caminho do certificado não pode estar vazio.",
  error_pdf_missing: "O arquivo PDF não existe: {path}",
  error_cert_missing: "O certificado digital não existe: {path}",
  error_already_signed: "Este PDF já contém uma assinatura. Assiná-lo novamente invalidaria a assinatura existente.",
  notice_already_pending: "Este PDF já está aguardando assinatura.",
  notice_open_error: "O PDF foi assinado, mas não pôde ser aberto: {error}",
  notice_dialog_unavailable: "O seletor de arquivos do sistema não está disponível.",
  notice_dialog_error: "Erro ao abrir o seletor de arquivos: {error}",
  dialog_pdf_files: "Arquivos PDF",
  error_not_yet_valid: "O certificado ainda não é válido.",
  error_no_signing_cert: "Nenhum certificado RSA correspondente à chave privada criptografada foi encontrado.",
  error_expired_cert: "O certificado expirou. Renove-o antes de assinar.",
  error_password_required: "Defina uma senha para o certificado antes de criar a chave privada.",

  plugin_loaded: "Plugin Assinatura Digital de PDF carregado.",
  modal_toggle_title: "Assinar com certificado digital",
  modal_toggle_desc: 'Adiciona rodapé com seu nome à esquerda e assinatura criptográfica (PKCS#7).',
  modal_options_title: "Opções para este PDF",
  modal_crypto_name: "Assinar criptograficamente o PDF",
  modal_crypto_desc: "Aplica uma assinatura digital PKCS#7 com seu certificado.",
  modal_signer_name: "Mostrar nome do signatário",
  modal_signer_desc: "Coloca o nome no canto inferior esquerdo de cada página.",
  modal_page_number_name: "Mostrar número da página",
  modal_page_number_desc: "Coloca-o no canto inferior direito como página atual / total.",
  cmd_toggle_default: "Alternar assinatura digital padrão na exportação para PDF",
  cmd_sign_existing: "Assinar digitalmente um PDF existente...",
  notice_saved_countdown: "⏳ PDF salvo: {name}\nAssinando digitalmente em {delay} segundos...",
  notice_signing_in_progress: "🔏 Assinando com certificado digital:\n{name}...",
  notice_signing_success: "✅ PDF assinado digitalmente com sucesso:\n{name}",
  notice_signing_error: "❌ Erro ao assinar digitalmente {name}:\n{error}",
  notice_cert_generated: "✅ Certificado digital gerado com sucesso em:\n{path}",
  notice_cert_gen_error: "❌ Erro ao gerar certificado: {error}",
  notice_cert_expired: "⚠️ Seu certificado digital expirou em {date}. Renove-o nas Configurações antes de assinar mais PDFs.",
  notice_cert_expiring_soon: "⚠️ Aviso: Seu certificado digital expira em {days} dias (em {date}). Renove-o nas Configurações -> Assinatura Digital de PDF.",
  notice_signature_toggled_on: "Assinatura digital de PDF: Ativada",
  notice_signature_toggled_off: "Assinatura digital de PDF: Desativada",
  settings_title: "Assinatura Digital de PDF — Configurações",
  settings_desc: "Configure o rodapé automático e o certificado digital criptográfico (PKCS#7 / X.509).",
  settings_default_toggle_name: "Assinar criptograficamente por padrão",
  settings_default_toggle_desc: "Aplica uma assinatura PKCS#7 na exportação, independentemente do rodapé.",
  settings_signer_toggle_name: "Mostrar nome do signatário por padrão",
  settings_signer_toggle_desc: "Coloca o nome do signatário no canto inferior esquerdo dos PDFs exportados.",
  settings_signer_name_name: "Nome no rodapé",
  settings_signer_name_desc: "Texto exibido no rodapé à esquerda em todas as páginas.",
  settings_page_number_name: "Exibir número da página",
  settings_page_number_desc: "Exibe 'página / total' no rodapé à direita.",
  settings_delay_name: "Espera máxima da exportação (segundos)",
  settings_delay_desc: "Tempo máximo de espera por um PDF completo e estável antes de validar e assinar. É um prazo, não um atraso fixo.",
  settings_open_after_name: "Abrir PDF após assinar",
  settings_open_after_desc: "Abre o arquivo PDF no leitor padrão após a conclusão da assinatura.",
  settings_cert_section_title: "Certificado Digital (.pfx / .p12)",
  settings_cert_status_valid: "🟢 Certificado dentro do prazo de validade até {date} (restam {days} dias). Confiança e revogação não foram verificadas.",
  settings_cert_status_expiring: "🟡 Status do certificado: Expirando em breve! Restam {days} dias (expira em {date}).",
  settings_cert_status_expired: "🔴 Certificado expirado em {date}. Configure um certificado vigente do seu prestador ou crie um novo autoassinado para uso pessoal.",
  settings_cert_status_not_found: "⚪ Status do certificado: Arquivo não encontrado. Clique abaixo para gerar.",
  settings_cert_path_name: "Caminho do certificado digital",
  settings_cert_path_desc: "Caminho relativo ao cofre ou absoluto para seu arquivo .pfx ou .p12.",
  settings_cert_password_name: "Senha do certificado",
  settings_cert_password_desc: "Senha para descriptografar a chave privada do certificado.",
  settings_reason_name: "Motivo da assinatura (Reason)",
  settings_reason_desc: "Metadados exibidos no painel de assinaturas do Adobe Acrobat / Foxit.",
  settings_location_name: "Localização (Location)",
  settings_location_desc: "Localização geográfica do signatário.",
  settings_btn_generate: "Criar certificado autoassinado",
  settings_btn_generate_desc: "Cria um novo certificado autoassinado. Se o arquivo configurado existir, outro arquivo será criado e o certificado anterior será preservado. Isso não renova um certificado emitido por um prestador.",
};

const it: Record<TranslationKey, string> = {
  cert_location_inside: "Questo certificato si trova nella cassaforte o è collegato ad essa; sincronizzazione e backup possono copiarlo. Scegli un percorso esterno per evitarlo.",
  cert_location_unknown: "Impossibile confermare la posizione del certificato. Scegli un percorso locale fuori dalla cassaforte e verifica collegamenti e impostazioni di sincronizzazione e backup.",
  cert_private_path: "Percorso locale fuori dalla cassaforte",
  signature_mode_choose: "Scegli come firmare…",
  signature_choice_required: "Scegli una modalità di firma prima di firmare.",
  export_integration_unavailable: "L’integrazione automatica con l’esportazione PDF non è disponibile in questa versione di Obsidian. Puoi usare i comandi manuali per firmare e verificare i PDF.",
  export_waiting: "In attesa dell’esportazione PDF: {name}",
  export_validating: "Validazione del PDF esportato: {name}",
  export_timeout: "L’esportazione PDF non è terminata entro il tempo consentito. Controlla il file esportato e riprova.",
  export_invalid: "Il file esportato è incompleto o non è stato validato come PDF compatibile. Nessuna firma è stata applicata.",
  export_cancelled: "La firma del PDF è stata annullata.",
  phase_verifying: "Verifica della firma generata: {name}",
  verify_revision_valid: "Revisione firmata: firma crittografica verificata.",
  verify_revision_invalid: "Revisione firmata: verifica della firma crittografica non riuscita.",
  verify_revision_unknown: "Revisione firmata: impossibile verificare.",
  verify_coverage_full: "Copertura: la firma copre l’intero file attuale.",
  verify_coverage_partial: "Copertura: il file attuale contiene dati successivi alla revisione firmata.",
  verify_coverage_unknown: "Copertura: impossibile determinarla.",
  verify_trust_not_checked: "Fiducia nel certificato: non verificata.",
  verify_revocation_not_checked: "Revoca del certificato: non verificata.",
  verify_timestamp_not_checked: "Marche temporali attendibili: non verificate.",
  error_file_too_large: "File troppo grande. La dimensione massima in ingresso è di 64 MiB per i PDF e 4 MiB per i certificati PKCS#12.",
  error_ambiguous_cert: "Il file del certificato contiene più chiavi di firma o certificati corrispondenti. Usa un’identità di firma univoca.",
  error_weak_rsa: "Le chiavi RSA di firma devono avere almeno 2048 bit.",
  error_cert_key_usage: "L’uso della chiave del certificato non consente firme digitali.",
  error_signing_verification: "La firma generata non ha superato la verifica locale d’integrità. Il PDF originale è stato conservato.",
  signing_review_title: "Rivedi la firma del PDF",
  signing_review_file: "File: {name}",
  signing_review_certificate: "Certificato del firmatario: {name}",
  signing_review_copy: "Verrà creata una copia firmata; l’originale sarà conservato.",
  signing_review_action: "Crea copia firmata",
  action_cancel: "Annulla",
  notice_pending_changed: "Il PDF è cambiato durante l’attesa della firma. Nessuna firma è stata applicata; rivedi il file attuale e riprova.",
  verify_appended: "Ci sono {bytes} byte dopo la revisione firmata. La firma non copre l’intero file attuale.",
  verify_crypto_failed: "Impossibile verificare la firma crittografica.",
  verify_crypto_intact: "La firma crittografica della revisione firmata è corretta. Ciò non stabilisce che il documento attuale sia inalterato.",
  verify_fingerprint: "Impronta del certificato (SHA-256): {fingerprint}",
  verify_issuer: "Emittente indicato nel certificato: {issuer}",
  verify_self_signed: "Certificato autofirmato: sì. Questo verificatore non ne verifica l’identità in modo indipendente.",
  certificate_new_path: "È stato creato un nuovo certificato autofirmato in {path}; il precedente è stato conservato.",
  certificate_self_signed_no: "Certificato autofirmato: no. Questo da solo non stabilisce fiducia né verifica l’identità.",
  verify_command: "Verifica l'integrità della firma di un PDF",
  verify_title: "Integrità della firma PDF",
  verify_intact: "La firma è crittograficamente corretta e copre l'intero file. Non sono stati rilevati byte successivi.",
  verify_modified: "Il file è cambiato, contiene dati successivi o la sua firma non è stata verificata. Non considerare integro il documento attuale.",
  verify_unsigned: "Non è stata rilevata una firma compatibile.",
  verify_unsupported: "Il verificatore locale non supporta questa firma o struttura PDF. Usa un validatore indipendente di firme PDF.",
  verify_limits: "Verifica locale di integrità. Non verifica fiducia, revoca, marche temporali, conformità PAdES o sufficienza giuridica.",
  verify_certificate_current: "Il certificato del firmatario è nel periodo di validità oggi.",
  verify_certificate_expired: "Il certificato del firmatario è fuori dal periodo di validità oggi. Ciò non stabilisce il suo stato al momento della firma.",
  verify_signer: "Titolare indicato nel certificato: {name}",
  verify_error: "Impossibile verificare il PDF: {error}",
  settings_signature_mode_name: "Finalità della firma",
  settings_signature_mode_desc: "La firma di integrità protegge la revisione firmata. La certificazione dichiara che non sono consentite modifiche successive (DocMDP). I lettori compatibili applicano e segnalano questa regola; non rende impossibile modificare un PDF.",
  signature_mode_approval: "Firma di integrità",
  signature_mode_certify: "Certifica — nessuna modifica consentita",
  settings_jurisdiction_name: "Paese o contesto giuridico (orientamento)",
  jurisdiction_international: "Generale / internazionale",
  jurisdiction_cl: "Cile",
  jurisdiction_eu: "Unione europea",
  jurisdiction_uk: "Regno Unito",
  jurisdiction_us: "Stati Uniti",
  jurisdiction_international_guidance: "Questa scelta cambia solo l'orientamento. Non modifica il certificato, attesta l'identità o stabilisce l'accettazione giuridica. I certificati autofirmati possono servire a verificare l'integrità personale; il destinatario deve stabilire separatamente la fiducia.",
  jurisdiction_cl_guidance: "Cile: la legge 19.799 distingue firme elettroniche e avanzate. Le avanzate richiedono la certificazione accreditata e le condizioni legali applicabili. Scegliere Cile o generare un certificato autofirmato non conferisce tale status. Verifica i requisiti del destinatario.",
  jurisdiction_eu_guidance: "UE: una firma elettronica qualificata richiede un certificato qualificato e un dispositivo o servizio qualificato di creazione della firma, secondo eIDAS. Una firma PDF o un certificato autofirmato da soli non conferiscono tale status. Verifica il prestatore, il servizio e i requisiti del destinatario.",
  jurisdiction_uk_guidance: "Regno Unito: verifica i requisiti del destinatario e il quadro britannico di fiducia applicabile. Questa scelta non stabilisce una firma qualificata o il riconoscimento automatico di un prestatore.",
  jurisdiction_us_guidance: "Stati Uniti: i requisiti dipendono dalla transazione, dal consenso, dalla legge applicabile e dal destinatario. Questa impostazione non stabilisce conformità o accettazione universale di un certificato.",
  settings_signature_levels_desc: "Disponibile: firma con certificato locale e certificazione facoltativa contro modifiche successive. Marche temporali attendibili e PAdES T/LT/LTA non sono ancora supportati. Questi livelli tecnici differiscono dalle categorie giuridiche. Il flusso attuale .pfx/.p12 non supporta token di prestatori o firma remota.",
  error_pdf_changed: "Il PDF è cambiato durante la firma. Il file attuale è stato conservato.",
  default_signer_name: "Nome del firmatario",
  default_reason: "Motivo della firma",
  default_location: "Posizione",
  settings_cert_status_invalid: "⚠️ Errore del certificato: {error}",
  error_invalid_cert: "Certificato non valido o password errata",
  error_empty_cert_path: "Il percorso del certificato non può essere vuoto.",
  error_pdf_missing: "Il file PDF non esiste: {path}",
  error_cert_missing: "Il certificato digitale non esiste: {path}",
  error_already_signed: "Questo PDF contiene già una firma. Firmarlo nuovamente invaliderebbe la firma esistente.",
  notice_already_pending: "Questo PDF è già in attesa di firma.",
  notice_open_error: "Il PDF è stato firmato, ma non è stato possibile aprirlo: {error}",
  notice_dialog_unavailable: "Il selettore di file del sistema non è disponibile.",
  notice_dialog_error: "Errore durante l’apertura del selettore di file: {error}",
  dialog_pdf_files: "File PDF",
  error_not_yet_valid: "Il certificato non è ancora valido.",
  error_no_signing_cert: "Nessun certificato RSA corrispondente alla chiave privata cifrata trovato.",
  error_expired_cert: "Il certificato è scaduto. Rinnovalo prima di firmare.",
  error_password_required: "Imposta una password per il certificato prima di creare la chiave privata.",

  plugin_loaded: "Plugin Firma Digitale PDF caricato.",
  modal_toggle_title: "Firma con certificato digitale",
  modal_toggle_desc: 'Aggiunge piè di pagina a sinistra e firma crittografica (PKCS#7).',
  modal_options_title: "Opzioni per questo PDF",
  modal_crypto_name: "Firma crittograficamente il PDF",
  modal_crypto_desc: "Applica una firma digitale PKCS#7 con il tuo certificato.",
  modal_signer_name: "Mostra il nome del firmatario",
  modal_signer_desc: "Lo inserisce nell'angolo inferiore sinistro di ogni pagina.",
  modal_page_number_name: "Mostra il numero di pagina",
  modal_page_number_desc: "Lo inserisce nell'angolo inferiore destro come pagina corrente / totale.",
  cmd_toggle_default: "Attiva/disattiva firma digitale predefinita nell'esportazione PDF",
  cmd_sign_existing: "Firma digitalmente un PDF esistente...",
  notice_saved_countdown: "⏳ PDF salvato: {name}\nFirma digitale in corso tra {delay} secondi...",
  notice_signing_in_progress: "🔏 Firma con certificato digitale in corso:\n{name}...",
  notice_signing_success: "✅ PDF firmato digitalmente con successo:\n{name}",
  notice_signing_error: "❌ Errore durante la firma digitale di {name}:\n{error}",
  notice_cert_generated: "✅ Certificato digitale generato con successo in:\n{path}",
  notice_cert_gen_error: "❌ Errore durante la generazione del certificato: {error}",
  notice_cert_expired: "⚠️ Il tuo certificato digitale è scaduto il {date}. Rinnovalo nelle Impostazioni prima di firmare altri PDF.",
  notice_cert_expiring_soon: "⚠️ Avviso: Il tuo certificato digitale scade tra {days} giorni (il {date}). Rinnovalo nelle Impostazioni -> Firma Digitale PDF.",
  notice_signature_toggled_on: "Firma digitale PDF: Attivata",
  notice_signature_toggled_off: "Firma digitale PDF: Disattivata",
  settings_title: "Firma Digitale PDF — Impostazioni",
  settings_desc: "Configura il piè di pagina automatico e il certificato digitale crittografico (PKCS#7 / X.509).",
  settings_default_toggle_name: "Firma crittograficamente per impostazione predefinita",
  settings_default_toggle_desc: "Applica una firma PKCS#7 durante l'esportazione, indipendentemente dal piè di pagina.",
  settings_signer_toggle_name: "Mostra il nome del firmatario per impostazione predefinita",
  settings_signer_toggle_desc: "Inserisce il nome del firmatario nell'angolo inferiore sinistro dei PDF esportati.",
  settings_signer_name_name: "Nome nel piè di pagina",
  settings_signer_name_desc: "Testo visualizzato in basso a sinistra su tutte le pagine.",
  settings_page_number_name: "Mostra numero di pagina",
  settings_page_number_desc: "Mostra 'pagina / totale' in basso a destra.",
  settings_delay_name: "Attesa massima dell’esportazione (secondi)",
  settings_delay_desc: "Tempo massimo per attendere un PDF completo e stabile prima di validarlo e firmarlo. È un limite, non un ritardo fisso.",
  settings_open_after_name: "Apri PDF dopo la firma",
  settings_open_after_desc: "Apre automaticamente il file PDF nel visualizzatore predefinito dopo la firma.",
  settings_cert_section_title: "Certificato Digitale (.pfx / .p12)",
  settings_cert_status_valid: "🟢 Certificato nel periodo di validità fino al {date} ({days} giorni rimanenti). Fiducia e revoca non sono state verificate.",
  settings_cert_status_expiring: "🟡 Stato certificato: In scadenza! Mancano {days} giorni (scade il {date}).",
  settings_cert_status_expired: "🔴 Certificato scaduto il {date}. Configura un certificato valido del tuo prestatore o creane uno autofirmato per uso personale.",
  settings_cert_status_not_found: "⚪ Stato certificato: File non trovato. Clicca qui sotto per generarlo.",
  settings_cert_path_name: "Percorso del certificato digitale",
  settings_cert_path_desc: "Percorso relativo al vault o assoluto al file .pfx o .p12.",
  settings_cert_password_name: "Password del certificato",
  settings_cert_password_desc: "Password per decrittografare la chiave privata del certificato.",
  settings_reason_name: "Motivo della firma (Reason)",
  settings_reason_desc: "Metadati visualizzati nel pannello firme di Adobe Acrobat / Foxit.",
  settings_location_name: "Posizione (Location)",
  settings_location_desc: "Posizione geografica del firmatario.",
  settings_btn_generate: "Crea certificato autofirmato",
  settings_btn_generate_desc: "Crea un nuovo certificato autofirmato. Se il file configurato esiste, viene creato un altro file e il certificato precedente viene conservato. Non rinnova un certificato emesso da un prestatore.",
};

const fr: Record<TranslationKey, string> = {
  cert_location_inside: "Ce certificat est dans le coffre ou lui est lié ; la synchronisation et les sauvegardes peuvent le copier. Choisissez un chemin externe pour éviter cela.",
  cert_location_unknown: "La localisation du certificat n’a pas pu être confirmée. Choisissez un chemin local hors du coffre et vérifiez les liens et les paramètres de synchronisation et de sauvegarde.",
  cert_private_path: "Chemin local hors du coffre",
  signature_mode_choose: "Choisissez comment signer…",
  signature_choice_required: "Choisissez un mode de signature avant de signer.",
  export_integration_unavailable: "L’intégration automatique à l’exportation PDF n’est pas disponible dans cette version d’Obsidian. Vous pouvez utiliser les commandes manuelles pour signer et vérifier les PDF.",
  export_waiting: "En attente de l’exportation PDF : {name}",
  export_validating: "Validation du PDF exporté : {name}",
  export_timeout: "L’exportation PDF n’a pas terminé dans le délai autorisé. Vérifiez le fichier exporté et réessayez.",
  export_invalid: "Le fichier exporté est incomplet ou n’a pas pu être validé comme PDF compatible. Aucune signature n’a été appliquée.",
  export_cancelled: "La signature du PDF a été annulée.",
  phase_verifying: "Vérification de la signature créée : {name}",
  verify_revision_valid: "Révision signée : signature cryptographique vérifiée.",
  verify_revision_invalid: "Révision signée : échec de la vérification de la signature cryptographique.",
  verify_revision_unknown: "Révision signée : vérification impossible.",
  verify_coverage_full: "Couverture : la signature couvre le fichier actuel entier.",
  verify_coverage_partial: "Couverture : le fichier actuel contient des données après la révision signée.",
  verify_coverage_unknown: "Couverture : impossible à déterminer.",
  verify_trust_not_checked: "Confiance dans le certificat : non vérifiée.",
  verify_revocation_not_checked: "Révocation du certificat : non vérifiée.",
  verify_timestamp_not_checked: "Horodatages de confiance : non vérifiés.",
  error_file_too_large: "Fichier trop volumineux. La taille maximale en entrée est de 64 MiB pour les PDF et de 4 MiB pour les certificats PKCS#12.",
  error_ambiguous_cert: "Le fichier du certificat contient plusieurs clés de signature ou certificats correspondants. Utilisez une identité de signature non ambiguë.",
  error_weak_rsa: "Les clés RSA de signature doivent comporter au moins 2048 bits.",
  error_cert_key_usage: "L’usage de clé du certificat n’autorise pas les signatures numériques.",
  error_signing_verification: "La signature créée n’a pas passé la vérification locale d’intégrité. Le PDF original a été conservé.",
  signing_review_title: "Vérifier les options de signature du PDF",
  signing_review_file: "Fichier : {name}",
  signing_review_certificate: "Certificat du signataire : {name}",
  signing_review_copy: "Une copie signée sera créée ; l’original sera conservé.",
  signing_review_action: "Créer une copie signée",
  action_cancel: "Annuler",
  notice_pending_changed: "Le PDF a changé pendant l’attente de signature. Aucune signature n’a été appliquée ; vérifiez le fichier actuel et réessayez.",
  verify_appended: "Il y a {bytes} octets après la révision signée. La signature ne couvre pas le fichier actuel entier.",
  verify_crypto_failed: "La signature cryptographique n’a pas pu être vérifiée.",
  verify_crypto_intact: "La signature cryptographique de la révision signée est correcte. Cela n’établit pas que le document actuel est inchangé.",
  verify_fingerprint: "Empreinte du certificat (SHA-256) : {fingerprint}",
  verify_issuer: "Émetteur indiqué dans le certificat : {issuer}",
  verify_self_signed: "Certificat autosigné : oui. Ce vérificateur ne vérifie pas son identité de façon indépendante.",
  certificate_new_path: "Un nouveau certificat autosigné a été créé dans {path} ; le certificat précédent a été conservé.",
  certificate_self_signed_no: "Certificat autosigné : non. Cela seul n’établit pas la confiance et ne vérifie pas l’identité.",
  verify_command: "Vérifier l'intégrité de la signature d'un PDF",
  verify_title: "Intégrité de la signature PDF",
  verify_intact: "La signature est cryptographiquement correcte et couvre le fichier entier. Aucun octet ultérieur n'a été détecté.",
  verify_modified: "Le fichier a changé, contient des données ultérieures ou sa signature n'a pas pu être vérifiée. Ne considérez pas le document actuel comme intact.",
  verify_unsigned: "Aucune signature compatible n'a été détectée.",
  verify_unsupported: "Le vérificateur local ne prend pas en charge cette signature ou structure PDF. Utilisez un validateur indépendant de signatures PDF.",
  verify_limits: "Vérification locale d'intégrité. Ne vérifie pas la confiance, la révocation, les horodatages, la conformité PAdES ou la suffisance juridique.",
  verify_certificate_current: "Le certificat du signataire est dans sa période de validité aujourd'hui.",
  verify_certificate_expired: "Le certificat du signataire est hors de sa période de validité aujourd'hui. Cela n'établit pas son état au moment de la signature.",
  verify_signer: "Titulaire indiqué dans le certificat : {name}",
  verify_error: "Impossible de vérifier le PDF : {error}",
  settings_signature_mode_name: "Finalité de la signature",
  settings_signature_mode_desc: "La signature d'intégrité protège la révision signée. La certification déclare qu'aucune modification ultérieure n'est autorisée (DocMDP). Les lecteurs compatibles appliquent et signalent cette règle ; elle ne rend pas un PDF impossible à modifier.",
  signature_mode_approval: "Signature d'intégrité",
  signature_mode_certify: "Certifier — aucune modification autorisée",
  settings_jurisdiction_name: "Pays ou contexte juridique (orientation)",
  jurisdiction_international: "Général / international",
  jurisdiction_cl: "Chili",
  jurisdiction_eu: "Union européenne",
  jurisdiction_uk: "Royaume-Uni",
  jurisdiction_us: "États-Unis",
  jurisdiction_international_guidance: "Ce choix modifie uniquement l'orientation. Il ne modifie pas le certificat, n'atteste pas l'identité et n'établit pas l'acceptation juridique. Un certificat autosigné peut servir à vérifier l'intégrité personnelle ; le destinataire doit établir la confiance séparément.",
  jurisdiction_cl_guidance: "Chili : la loi 19.799 distingue les signatures électroniques et avancées. Les signatures avancées exigent la certification accréditée et les conditions légales applicables. Choisir Chili ou créer un certificat autosigné ne confère pas ce statut. Vérifiez les exigences du destinataire.",
  jurisdiction_eu_guidance: "UE : une signature électronique qualifiée nécessite un certificat qualifié et un dispositif ou service qualifié de création de signature, selon eIDAS. Une signature PDF ou un certificat autosigné seuls ne confèrent pas ce statut. Vérifiez le prestataire, le service et les exigences du destinataire.",
  jurisdiction_uk_guidance: "Royaume-Uni : vérifiez les exigences du destinataire et le cadre britannique de confiance applicable. Ce choix n'établit pas une signature qualifiée ni la reconnaissance automatique d'un prestataire.",
  jurisdiction_us_guidance: "États-Unis : les exigences dépendent de la transaction, du consentement, du droit applicable et du destinataire. Ce réglage n'établit ni conformité ni acceptation universelle d'un certificat.",
  settings_signature_levels_desc: "Disponible : signature avec certificat local et certification facultative contre les modifications ultérieures. Les horodatages de confiance et PAdES T/LT/LTA ne sont pas encore pris en charge. Ces niveaux techniques diffèrent des catégories juridiques. Le flux actuel .pfx/.p12 ne prend pas en charge les jetons de prestataires ni la signature à distance.",
  error_pdf_changed: "Le PDF a changé pendant la signature. Le fichier actuel a été conservé.",
  plugin_loaded: "PDF Digital Signature chargé.",
  modal_toggle_title: "Signer avec un certificat numérique",
  modal_toggle_desc: "Ajouter un pied de page et une signature cryptographique (PKCS#7).",
  modal_options_title: "Options pour ce PDF",
  modal_crypto_name: "Signer le PDF cryptographiquement",
  modal_crypto_desc: "Appliquer une signature numérique PKCS#7 avec votre certificat.",
  modal_signer_name: "Afficher le nom du signataire",
  modal_signer_desc: "Placer le nom en bas à gauche de chaque page.",
  modal_page_number_name: "Afficher le numéro de page",
  modal_page_number_desc: "Placer le numéro en bas à droite au format page actuelle / total.",
  cmd_toggle_default: "Activer ou désactiver la signature numérique des PDF par défaut",
  cmd_sign_existing: "Signer numériquement un PDF existant…",
  notice_saved_countdown: "⏳ PDF enregistré : {name}\nSignature numérique dans {delay} secondes…",
  notice_signing_in_progress: "🔏 Signature avec le certificat numérique :\n{name}…",
  notice_signing_success: "✅ PDF signé numériquement avec succès :\n{name}",
  notice_signing_error: "❌ Erreur lors de la signature numérique de {name} :\n{error}",
  notice_cert_generated: "✅ Certificat numérique créé avec succès :\n{path}",
  notice_cert_gen_error: "❌ Erreur lors de la création du certificat : {error}",
  notice_cert_expired: "⚠️ Votre certificat numérique a expiré le {date}. Renouvelez-le dans les paramètres avant de signer d’autres PDF.",
  notice_cert_expiring_soon: "⚠️ Votre certificat numérique expire dans {days} jours (le {date}). Renouvelez-le dans Paramètres → PDF Digital Signature.",
  notice_signature_toggled_on: "Signature numérique des PDF : activée",
  notice_signature_toggled_off: "Signature numérique des PDF : désactivée",
  settings_title: "PDF Digital Signature — Paramètres",
  settings_desc: "Configurer le pied de page automatique et le certificat numérique (PKCS#7 / X.509).",
  settings_default_toggle_name: "Signer cryptographiquement par défaut",
  settings_default_toggle_desc: "Appliquer une signature PKCS#7 à l’exportation, indépendamment du pied de page.",
  settings_signer_toggle_name: "Afficher le nom du signataire par défaut",
  settings_signer_toggle_desc: "Placer le nom du signataire en bas à gauche des PDF exportés.",
  settings_signer_name_name: "Nom dans le pied de page",
  settings_signer_name_desc: "Texte affiché en bas à gauche de chaque page.",
  settings_page_number_name: "Afficher le numéro de page",
  settings_page_number_desc: "Afficher « page / total » en bas à droite de chaque page.",
  settings_delay_name: "Attente maximale de l’exportation (secondes)",
  settings_delay_desc: "Délai maximal pour attendre un PDF complet et stable avant validation et signature. Il s’agit d’une limite, pas d’une attente fixe.",
  settings_open_after_name: "Ouvrir le PDF après la signature",
  settings_open_after_desc: "Ouvrir automatiquement le PDF signé dans le lecteur par défaut.",
  settings_cert_section_title: "Certificat numérique (.pfx / .p12)",
  settings_cert_status_valid: "🟢 Certificat dans sa période de validité jusqu’au {date} ({days} jours restants). La confiance et la révocation n’ont pas été vérifiées.",
  settings_cert_status_expiring: "🟡 État du certificat : expiration prochaine ! Il reste {days} jours (expiration le {date}).",
  settings_cert_status_expired: "🔴 Certificat expiré le {date}. Configurez un certificat valide de votre prestataire ou créez un nouveau certificat autosigné pour un usage personnel.",
  settings_cert_status_not_found: "⚪ État du certificat : fichier introuvable. Cliquez ci-dessous pour en créer un.",
  settings_cert_path_name: "Chemin du certificat",
  settings_cert_path_desc: "Chemin relatif à la racine du coffre ou chemin absolu vers le fichier .pfx ou .p12.",
  settings_cert_password_name: "Mot de passe du certificat",
  settings_cert_password_desc: "Mot de passe utilisé pour déchiffrer votre clé privée.",
  settings_reason_name: "Motif de la signature",
  settings_reason_desc: "Métadonnée affichée dans le panneau des signatures d’Adobe Acrobat ou Foxit.",
  settings_location_name: "Lieu",
  settings_location_desc: "Lieu géographique du signataire.",
  settings_btn_generate: "Créer un certificat autosigné",
  settings_btn_generate_desc: "Crée un nouveau certificat autosigné. Si le fichier configuré existe, un autre fichier est créé et le certificat précédent est conservé. Cela ne renouvelle pas un certificat émis par un prestataire.",
  default_signer_name: "Nom du signataire",
  default_reason: "Motif de la signature",
  default_location: "Lieu",
  settings_cert_status_invalid: "⚠️ Erreur du certificat : {error}",
  error_invalid_cert: "Certificat non valide ou mot de passe incorrect",
  error_empty_cert_path: "Le chemin du certificat ne peut pas être vide.",
  error_pdf_missing: "Le fichier PDF n’existe pas : {path}",
  error_cert_missing: "Le certificat numérique n’existe pas : {path}",
  error_already_signed: "Ce PDF contient déjà une signature. Le signer à nouveau invaliderait la signature existante.",
  notice_already_pending: "Ce PDF est déjà en attente de signature.",
  notice_open_error: "Le PDF a été signé, mais n’a pas pu être ouvert : {error}",
  notice_dialog_unavailable: "Le sélecteur de fichiers du système n’est pas disponible.",
  notice_dialog_error: "Erreur lors de l’ouverture du sélecteur de fichiers : {error}",
  dialog_pdf_files: "Fichiers PDF",
  error_not_yet_valid: "Le certificat n’est pas encore valide.",
  error_no_signing_cert: "Aucun certificat RSA correspondant à la clé privée chiffrée n’a été trouvé.",
  error_expired_cert: "Le certificat a expiré. Renouvelez-le avant de signer.",
  error_password_required: "Définissez un mot de passe pour le certificat avant de créer la clé privée.",
};

const locales: Record<string, Record<TranslationKey, string>> = {
  fr,
  en,
  es,
  pt,
  it,
};

export function getLanguage(): string {
  const obsidianLang = (getObsidianLanguage() || "en").toLowerCase();
  if (obsidianLang.startsWith("fr")) return "fr";
  if (obsidianLang.startsWith("es")) return "es";
  if (obsidianLang.startsWith("pt")) return "pt";
  if (obsidianLang.startsWith("it")) return "it";
  return "en";
}

export function t(key: TranslationKey, params?: Record<string, string | number>): string {
  const lang = getLanguage();
  const dict = locales[lang] || locales["en"];
  let str = dict[key] || locales["en"][key] || key;

  if (params) {
    for (const [k, v] of Object.entries(params)) {
      str = str.split(`{${k}}`).join(String(v));
    }
  }

  return str;
}
