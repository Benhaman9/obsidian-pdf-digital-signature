# Assinatura Digital de PDF para Obsidian

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
  Avisa proativamente quando faltam **30 dias ou menos para o vencimento** do certificado, com botão de renovação em 1 clique.
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

Uma senha aleatória é gerada na primeira inicialização. Você pode alterá-la antes de criar um certificado. O plugin a salva em texto simples nas configurações locais; proteja o cofre e os backups. A renovação preserva o certificado anterior em um arquivo `.bak` ao lado dele. PDFs já assinados são rejeitados, pois o plugin reescreve o documento em vez de adicionar uma assinatura incremental. Usa `adbe.pkcs7.detached`; não se declara conformidade completa com perfis PAdES, carimbos de tempo confiáveis ou validação de longo prazo.

[Adobe: certificate trust](https://helpx.adobe.com/acrobat/using/trusted-identities.html) · [Signing library](https://github.com/vbuch/node-signpdf)
