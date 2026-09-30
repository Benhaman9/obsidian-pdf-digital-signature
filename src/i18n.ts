import { getLanguage as getObsidianLanguage } from "obsidian";

export type TranslationKey =
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
  notice_cert_expired: "⚠️ Attention: Your digital certificate expired on {date}. New PDFs will be signed with an expired certificate. Please renew it in Settings.",
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
  settings_delay_name: "Delay before signing (seconds)",
  settings_delay_desc: "Time to wait after file creation before applying the digital signature.",
  settings_open_after_name: "Open PDF after signing",
  settings_open_after_desc: "Automatically open the signed PDF in your default viewer.",
  settings_cert_section_title: "Digital Certificate (.pfx / .p12)",
  settings_cert_status_valid: "🟢 Certificate status: Valid until {date} ({days} days remaining).",
  settings_cert_status_expiring: "🟡 Certificate status: Expiring soon! Only {days} days remaining (expires on {date}).",
  settings_cert_status_expired: "🔴 Certificate status: EXPIRED on {date}. Please renew it below.",
  settings_cert_status_not_found: "⚪ Certificate status: Certificate file not found yet. Click below to generate one.",
  settings_cert_path_name: "Certificate file path",
  settings_cert_path_desc: "Relative to vault root or absolute path to your .pfx or .p12 file.",
  settings_cert_password_name: "Certificate password",
  settings_cert_password_desc: "Password used to decrypt your private key.",
  settings_reason_name: "Reason for signing",
  settings_reason_desc: "Metadata displayed in the Adobe Acrobat / Foxit signature panel.",
  settings_location_name: "Location",
  settings_location_desc: "Geographic location of the signer.",
  settings_btn_generate: "Generate or Renew Certificate (.pfx)",
  settings_btn_generate_desc: "Creates a new 3-year self-signed X.509 certificate with your current password directly in pure JavaScript.",
};

const es: Record<TranslationKey, string> = {
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
  notice_cert_expired: "⚠️ Atención: Tu certificado digital expiró el {date}. Los PDFs nuevos se firmarán con certificado vencido. Renuévalo en Ajustes.",
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
  settings_delay_name: "Demora antes de firmar (segundos)",
  settings_delay_desc: "Tiempo de espera tras el guardado del archivo antes de ejecutar el proceso criptográfico.",
  settings_open_after_name: "Abrir PDF tras firmar",
  settings_open_after_desc: "Abre el archivo PDF en tu visor predeterminado una vez finalizada la firma criptográfica.",
  settings_cert_section_title: "Certificado Digital (.pfx / .p12)",
  settings_cert_status_valid: "🟢 Estado del certificado: Válido hasta el {date} (quedan {days} días).",
  settings_cert_status_expiring: "🟡 Estado del certificado: ¡Por caducar! Quedan {days} días (vence el {date}).",
  settings_cert_status_expired: "🔴 Estado del certificado: CADUCADO el {date}. Por favor renuévalo abajo.",
  settings_cert_status_not_found: "⚪ Estado del certificado: Archivo no encontrado. Haz clic abajo para crearlo.",
  settings_cert_path_name: "Ruta del certificado digital",
  settings_cert_path_desc: "Ruta relativa a la bóveda o absoluta a tu archivo .pfx o .p12.",
  settings_cert_password_name: "Contraseña del certificado",
  settings_cert_password_desc: "Contraseña para descifrar la clave privada del certificado digital.",
  settings_reason_name: "Motivo de la firma (Reason)",
  settings_reason_desc: "Metadato que figurará en el panel de firma de Adobe Acrobat / Foxit.",
  settings_location_name: "Lugar / Ubicación (Location)",
  settings_location_desc: "Ubicación geográfica del firmante (ej. Chile).",
  settings_btn_generate: "Generar o Renovar Certificado (.pfx)",
  settings_btn_generate_desc: "Crea un nuevo certificado autofirmado X.509 válido por 3 años con tu contraseña actual, directamente en JavaScript puro.",
};

const pt: Record<TranslationKey, string> = {
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
  notice_cert_expired: "⚠️ Atenção: Seu certificado digital expirou em {date}. Novos PDFs serão assinados com certificado vencido. Renove-o nas Configurações.",
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
  settings_delay_name: "Atraso antes de assinar (segundos)",
  settings_delay_desc: "Tempo de espera após salvar o arquivo antes de aplicar a assinatura digital.",
  settings_open_after_name: "Abrir PDF após assinar",
  settings_open_after_desc: "Abre o arquivo PDF no leitor padrão após a conclusão da assinatura.",
  settings_cert_section_title: "Certificado Digital (.pfx / .p12)",
  settings_cert_status_valid: "🟢 Status do certificado: Válido até {date} (restam {days} dias).",
  settings_cert_status_expiring: "🟡 Status do certificado: Expirando em breve! Restam {days} dias (expira em {date}).",
  settings_cert_status_expired: "🔴 Status do certificado: EXPIRADO em {date}. Renove-o abaixo.",
  settings_cert_status_not_found: "⚪ Status do certificado: Arquivo não encontrado. Clique abaixo para gerar.",
  settings_cert_path_name: "Caminho do certificado digital",
  settings_cert_path_desc: "Caminho relativo ao cofre ou absoluto para seu arquivo .pfx ou .p12.",
  settings_cert_password_name: "Senha do certificado",
  settings_cert_password_desc: "Senha para descriptografar a chave privada do certificado.",
  settings_reason_name: "Motivo da assinatura (Reason)",
  settings_reason_desc: "Metadados exibidos no painel de assinaturas do Adobe Acrobat / Foxit.",
  settings_location_name: "Localização (Location)",
  settings_location_desc: "Localização geográfica do signatário.",
  settings_btn_generate: "Gerar ou Renovar Certificado (.pfx)",
  settings_btn_generate_desc: "Cria um novo certificado autoassinado X.509 válido por 3 anos diretamente em JavaScript puro.",
};

const it: Record<TranslationKey, string> = {
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
  notice_cert_expired: "⚠️ Attenzione: Il tuo certificato digitale è scaduto il {date}. I nuovi PDF verranno firmati con un certificato scaduto. Rinnovalo nelle Impostazioni.",
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
  settings_delay_name: "Ritardo prima della firma (secondi)",
  settings_delay_desc: "Tempo di attesa dopo il salvataggio del file prima dell'applicazione della firma digitale.",
  settings_open_after_name: "Apri PDF dopo la firma",
  settings_open_after_desc: "Apre automaticamente il file PDF nel visualizzatore predefinito dopo la firma.",
  settings_cert_section_title: "Certificato Digitale (.pfx / .p12)",
  settings_cert_status_valid: "🟢 Stato certificato: Valido fino al {date} ({days} giorni rimanenti).",
  settings_cert_status_expiring: "🟡 Stato certificato: In scadenza! Mancano {days} giorni (scade il {date}).",
  settings_cert_status_expired: "🔴 Stato certificato: SCADUTO il {date}. Rinnovalo qui sotto.",
  settings_cert_status_not_found: "⚪ Stato certificato: File non trovato. Clicca qui sotto per generarlo.",
  settings_cert_path_name: "Percorso del certificato digitale",
  settings_cert_path_desc: "Percorso relativo al vault o assoluto al file .pfx o .p12.",
  settings_cert_password_name: "Password del certificato",
  settings_cert_password_desc: "Password per decrittografare la chiave privata del certificato.",
  settings_reason_name: "Motivo della firma (Reason)",
  settings_reason_desc: "Metadati visualizzati nel pannello firme di Adobe Acrobat / Foxit.",
  settings_location_name: "Posizione (Location)",
  settings_location_desc: "Posizione geografica del firmatario.",
  settings_btn_generate: "Genera o Rinnova Certificato (.pfx)",
  settings_btn_generate_desc: "Crea un nuovo certificato autofirmato X.509 valido per 3 anni direttamente in JavaScript puro.",
};

const fr: Record<TranslationKey, string> = {
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
  notice_cert_expired: "⚠️ Votre certificat numérique a expiré le {date}. Les nouveaux PDF seront signés avec un certificat expiré. Renouvelez-le dans les paramètres.",
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
  settings_delay_name: "Délai avant la signature (secondes)",
  settings_delay_desc: "Temps d’attente après l’enregistrement du fichier avant la signature numérique.",
  settings_open_after_name: "Ouvrir le PDF après la signature",
  settings_open_after_desc: "Ouvrir automatiquement le PDF signé dans le lecteur par défaut.",
  settings_cert_section_title: "Certificat numérique (.pfx / .p12)",
  settings_cert_status_valid: "🟢 État du certificat : valide jusqu’au {date} ({days} jours restants).",
  settings_cert_status_expiring: "🟡 État du certificat : expiration prochaine ! Il reste {days} jours (expiration le {date}).",
  settings_cert_status_expired: "🔴 État du certificat : EXPIRÉ le {date}. Renouvelez-le ci-dessous.",
  settings_cert_status_not_found: "⚪ État du certificat : fichier introuvable. Cliquez ci-dessous pour en créer un.",
  settings_cert_path_name: "Chemin du certificat",
  settings_cert_path_desc: "Chemin relatif à la racine du coffre ou chemin absolu vers le fichier .pfx ou .p12.",
  settings_cert_password_name: "Mot de passe du certificat",
  settings_cert_password_desc: "Mot de passe utilisé pour déchiffrer votre clé privée.",
  settings_reason_name: "Motif de la signature",
  settings_reason_desc: "Métadonnée affichée dans le panneau des signatures d’Adobe Acrobat ou Foxit.",
  settings_location_name: "Lieu",
  settings_location_desc: "Lieu géographique du signataire.",
  settings_btn_generate: "Créer ou renouveler le certificat (.pfx)",
  settings_btn_generate_desc: "Créer un certificat X.509 autosigné valable trois ans avec le mot de passe actuel, en JavaScript.",
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
