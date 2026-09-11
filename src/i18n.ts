import { moment } from "obsidian";

export type TranslationKey =
  | "plugin_loaded"
  | "modal_toggle_title"
  | "modal_toggle_desc"
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
  plugin_loaded: "PDF Digital Signature loaded.",
  modal_toggle_title: "Sign with digital certificate",
  modal_toggle_desc: 'Add running footer on the left and sign cryptographically (PAdES / PKCS#7).',
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
  settings_desc: "Configure the automatic running footer and cryptographic digital certificates (PAdES / PKCS#7 / X.509).",
  settings_default_toggle_name: "Enable signing by default on export",
  settings_default_toggle_desc: "When enabled, 'Sign with digital certificate' will be pre-checked in the export modal.",
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
  plugin_loaded: "Plugin Firma Digital PDF cargado.",
  modal_toggle_title: "Firmar con certificado digital",
  modal_toggle_desc: 'Pie de página con tu nombre a la izq. y firma criptográfica (PAdES / PKCS#7).',
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
  settings_desc: "Configuración del membrete de pie de página y del certificado digital criptográfico (PAdES / PKCS#7 / X.509).",
  settings_default_toggle_name: "Activar firma por defecto al exportar",
  settings_default_toggle_desc: "Si está activo, la opción vendrá marcada por defecto en el diálogo 'Exportar a PDF'.",
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
  plugin_loaded: "Plugin Assinatura Digital de PDF carregado.",
  modal_toggle_title: "Assinar com certificado digital",
  modal_toggle_desc: 'Adiciona rodapé com seu nome à esquerda e assinatura criptográfica (PAdES / PKCS#7).',
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
  settings_desc: "Configure o rodapé automático e o certificado digital criptográfico (PAdES / PKCS#7 / X.509).",
  settings_default_toggle_name: "Ativar assinatura por padrão ao exportar",
  settings_default_toggle_desc: "Quando ativado, a opção virá marcada por padrão na janela 'Exportar para PDF'.",
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
  plugin_loaded: "Plugin Firma Digitale PDF caricato.",
  modal_toggle_title: "Firma con certificato digitale",
  modal_toggle_desc: 'Aggiunge piè di pagina a sinistra e firma crittografica (PAdES / PKCS#7).',
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
  settings_desc: "Configura il piè di pagina continuo e il certificato digitale crittografico (PAdES / PKCS#7 / X.509).",
  settings_default_toggle_name: "Attiva firma come predefinita all'esportazione",
  settings_default_toggle_desc: "Se attivo, l'opzione sarà selezionata per impostazione predefinita nella finestra 'Esporta in PDF'.",
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
  settings_cert_path_desc: "Percorso relativo alla cassaforte o assoluto al file .pfx o .p12.",
  settings_cert_password_name: "Password del certificato",
  settings_cert_password_desc: "Password per decrittografare la chiave privata del certificato.",
  settings_reason_name: "Motivo della firma (Reason)",
  settings_reason_desc: "Metadati visualizzati nel pannello firme di Adobe Acrobat / Foxit.",
  settings_location_name: "Posizione (Location)",
  settings_location_desc: "Posizione geografica del firmatario.",
  settings_btn_generate: "Genera o Rinnova Certificato (.pfx)",
  settings_btn_generate_desc: "Crea un nuovo certificato autofirmato X.509 valido per 3 anni direttamente in JavaScript puro.",
};

const locales: Record<string, Record<TranslationKey, string>> = {
  en,
  es,
  pt,
  it,
};

export function getLanguage(): string {
  const obsidianLang = (window.localStorage.getItem("language") || "en").toLowerCase();
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
      str = str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
  }

  return str;
}
