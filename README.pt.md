# Assinatura Digital de PDF para Obsidian

## Assinar e verificar na versão 1.1.1

Use o menu de contexto do arquivo PDF ou os comandos do PDF ativo para assinar ou verificar. Ao assinar um PDF existente, são apresentados arquivo, certificado e modo para revisão; depois é criada uma cópia .signed.pdf (com sufixo único se necessário), preservando o original. PDFs exportados são assinados após a exportação. Se o arquivo mudar enquanto espera na fila, o trabalho será recusado para evitar assinar o documento atual com configurações anteriores. Se o Windows bloquear a substituição de um PDF exportado, o plugin cria uma cópia assinada .signed.pdf sem forçar a gravação no arquivo bloqueado; o nome exibido e o PDF aberto depois correspondem a essa cópia.

Os detalhes do certificado mostram titular, emissor e impressão digital SHA-256 indicados pelo certificado, além de informar se é autoassinado. Ajudam a identificar o certificado configurado sem estabelecer identidade ou confiança. Criar um certificado autoassinado é uma ação explícita nas configurações. Se o arquivo configurado existir, outro arquivo será escolhido e o certificado anterior será preservado; isso não renova um certificado de prestador.

Os limites de entrada são 64 MiB por PDF e 4 MiB por certificado PKCS#12. A saída assinada também é limitada a 64 MiB: um PDF próximo do limite de entrada poderá ser recusado se a assinatura aumentar o tamanho. Antes de salvar, toda assinatura gerada deve passar nas verificações locais criptográficas e de cobertura do arquivo inteiro. É uma verificação de integridade, não de confiança ou jurídica.


## Escolher como assinar

- **Certificar — sem alterações permitidas**, opção padrão, adiciona uma política DocMDP com permissão `P=1`. Leitores compatíveis podem rejeitar alterações posteriores conforme essa política. Programas que a ignoram ainda podem editar o PDF.
- **Assinatura de integridade** assina a revisão atual sem certificação. Um leitor pode mostrar a assinatura original como criptograficamente válida e informar revisões posteriores; verifique o estado de modificação do documento atual.
- **País ou contexto jurídico** muda apenas a orientação, não seu certificado, identidade, formato ou situação jurídica. Verifique os requisitos do destinatário.

Configure um `.pfx`/`.p12` existente e sua senha, ou crie explicitamente um certificado autoassinado nas configurações. Certificados ausentes não são substituídos silenciosamente. Os autoassinados podem servir a verificações pessoais de integridade; o destinatário deve estabelecer a confiança separadamente.

Use **Verificar a integridade da assinatura de um PDF** na paleta de comandos ou no menu do arquivo PDF. Verifica assinaturas compatíveis e cobertura do arquivo inteiro, detectando bytes acrescentados. Estruturas incompatíveis recebem um resultado explícito. Não valida cadeias de confiança, revogação, carimbos de tempo confiáveis, alterações permitidas, conformidade PAdES ou suficiência jurídica. Para validação independente opcional e configuração de confiança, consulte o [guia pyHanko](https://docs.pyhanko.eu/en/latest/cli-guide/validation.html).

Carimbos de tempo confiáveis, PAdES T/LT/LTA, tokens de prestadores e assinatura remota não são suportados. Não se declara conformidade PAdES B. Os perfis técnicos diferem das categorias jurídicas.

Fontes: [ETSI PAdES](https://www.etsi.org/deliver/etsi_EN/319100_319199/31914201/01.02.01_60/en_31914201v010201p.pdf), [Comissão Europeia FAQ](https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/880312429/eSignature%2BFAQ), [Chile — Lei 19.799](https://www.bcn.cl/leychile/navegar?idNorma=196640), [ICO britânico](https://ico.org.uk/for-organisations/guide-to-eidas/qualified-trust-services/), [Estados Unidos — 15 USC 7001](https://uscode.house.gov/view.xhtml?req=%28title%3A15+section%3A7001%28c%29+edition%3Aprelim%29).

> **Idiomas / Languages / Lingue:**
> 🇧🇷 **Português** | 🇬🇧 [English](README.md) | 🇪🇸 [Español](README.es.md) | 🇮🇹 [Italiano](README.it.md) | 🇫🇷 [Français](README.fr.md)

---

[![License: MIT](https://img.shields.io/badge/Licença-MIT-blue.svg)](LICENSE)
[![Obsidian Plugin](https://img.shields.io/badge/Obsidian-Plugin-purple.svg)](https://obsidian.md)
**Sem ferramentas externas**: JavaScript / TypeScript
[![Platform: Desktop](https://img.shields.io/badge/Plataforma-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)]()
[![Idiomas](https://img.shields.io/badge/Idiomas-PT%20%7C%20EN%20%7C%20ES%20%7C%20IT%20%7C%20FR-orange.svg)]()

**PDF Digital Signature** é um plugin leve e **com bibliotecas JavaScript incluídas** para o [Obsidian](https://obsidian.md) que integra de forma nativa assinaturas digitais criptográficas (padrão PKCS#7 / X.509) e rodapés personalizados em documentos PDF exportados.

A assinatura permite verificar se o conteúdo assinado foi alterado. A confiança no signatário depende do certificado e das configurações do leitor. Um certificado autoassinado não é automaticamente confiável.

---

## ✨ Recursos

- 🔏 **Assinaturas Criptográficas Reais (PKCS#7):**
  X.509 (`.pfx` / `.p12`). Detecta alterações no conteúdo assinado; não impede a edição do PDF.
- 📄 **Rodapé Contínuo em Todas as Páginas:**
  Insere seu nome (ou texto personalizado) no canto inferior esquerdo e o número da página (`página / total`) à direita em cada folha.
- 🎛️ **Controles Independentes por Exportação:**
  Escolha separadamente a assinatura criptográfica, o nome do signatário e a numeração de páginas. As escolhas ficam salvas como padrões.
- ⚡ **Portátil com bibliotecas incluídas:**
  Desenvolvido em TypeScript/JavaScript puro (`node-forge` + `pdf-lib` + `@signpdf`). Não requer Python, pip nem comandos de terminal.
- 🌐 **Suporte Multilíngue Nativo (i18n):**
  Tradução completa em **Português (`pt`)**, **Inglês (`en`)**, **Espanhol (`es`)**, **Italiano (`it`)** e **Francês (`fr`)**, seguindo automaticamente o idioma do Obsidian.
- ⏳ **Monitor de Validade e Alertas de Expiração (<= 30 dias):**
  Avisa proativamente quando faltam **30 dias ou menos para o vencimento** do certificado, para que você possa configurar um certificado vigente.
- 🎛️ **Integração Nativa com o Obsidian:**
  Aparece como três controles independentes na janela nativa **«Exportar para PDF»** e lembra sua preferência.
- ⏱️ **Pós-processamento Automatizado:**
  Aguarda um tempo configurável (padrão: 5 segundos) para gravação segura em disco, aplica a assinatura e abre o PDF assinado no seu leitor padrão.
- 🔑 **Gerador de Certificados Integrado:**
  Crie um certificado autoassinado válido por 3 anos diretamente nas configurações do plugin.
- 🛡️ **100% Privado e Offline:**
  Toda a criptografia roda localmente na sua máquina. Sem telemetria ou chamadas para servidores externos.

---

## 🚀 Como Funciona

1. Abra qualquer nota no Obsidian e pressione `Ctrl + P` (ou `Cmd + P`) ➔ **Exportar para PDF**.
2. Escolha qualquer combinação das três opções: assinatura criptográfica, nome do signatário e numeração.
3. Clique em **Exportar para PDF** e escolha onde salvar o arquivo.
4. O plugin automaticamente:
   - Exporta o documento com seu nome no rodapé de todas as páginas.
   - Aguarda a contagem regressiva de 5 segundos.
   - Sela o arquivo com seu certificado digital `.pfx`.
   - Abre o PDF assinado no visualizador quando essa opção está ativada.

---

## 🛠️ Instalação

### Método 1: Plugins da Comunidade do Obsidian (Recomendado após aprovação)
1. Abra **Configurações** ➔ **Plugins da comunidade**.
2. Busque por **PDF Digital Signature**.
3. Clique em **Instalar** e depois em **Ativar**.

### Método 2: Via BRAT (Beta Reviewer's Auto-update Tool)
1. Instale o plugin **BRAT** no Obsidian.
2. Em BRAT, selecione **Add Beta plugin**.
3. Cole a URL: `https://github.com/Benhaman9/obsidian-pdf-digital-signature`
4. Clique em **Add Plugin** e ative-o.

---

## 📄 Licença

Este projeto está licenciado sob a [Licença MIT](LICENSE).

Criado com ❤️ por [Benjamín Alcalde G.](https://github.com/Benhaman9)

## Limitações do certificado e da assinatura

Uma senha aleatória é gerada na primeira inicialização. Você pode alterá-la antes de criar um certificado; senhas vazias são recusadas para certificados novos. É necessário Obsidian 1.11.5 ou posterior. A senha é mantida no SecretStorage local, fora de `data.json`; as senhas anteriores são migradas ao carregar o plugin. Ela deve ser configurada separadamente em cada dispositivo. Criar um certificado autoassinado nunca sobrescreve o certificado configurado. Certificados expirados ou ainda não válidos não podem ser usados para assinar. PDFs já assinados são rejeitados, pois o plugin reescreve o documento em vez de adicionar uma assinatura incremental. Usa `adbe.pkcs7.detached`; não se declara conformidade completa com perfis PAdES, carimbos de tempo confiáveis ou validação de longo prazo.

[Adobe: certificate trust](https://helpx.adobe.com/acrobat/using/trusted-identities.html) · [Signing library](https://github.com/vbuch/node-signpdf)
