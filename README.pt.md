# Assinatura Digital de PDF para Obsidian

> **Idiomas / Languages / Lingue:**  
> 🇧🇷 **Português** | 🇬🇧 [English](README.md) | 🇪🇸 [Español](README.es.md) | 🇮🇹 [Italiano](README.it.md)

---

[![License: MIT](https://img.shields.io/badge/Licença-MIT-blue.svg)](LICENSE)
[![Obsidian Plugin](https://img.shields.io/badge/Obsidian-Plugin-purple.svg)](https://obsidian.md)
[![Zero Dependencies](https://img.shields.io/badge/Dependências-Zero%20(JS%20Puro)-brightgreen.svg)]()
[![Platform: Desktop](https://img.shields.io/badge/Plataforma-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)]()
[![Idiomas](https://img.shields.io/badge/Idiomas-PT%20%7C%20EN%20%7C%20ES%20%7C%20IT-orange.svg)]()

**PDF Digital Signature** é um plugin leve e **sem dependências externas** para o [Obsidian](https://obsidian.md) que integra de forma nativa assinaturas digitais criptográficas (padrão PAdES / PKCS#7 / X.509) e rodapés personalizados em documentos PDF exportados.

Quando abertos em visualizadores padrão como o **Adobe Acrobat Reader**, os documentos são reconhecidos como **«Assinado e todas as assinaturas são válidas»**, assegurando autenticidade, integridade e autoria.

---

## ✨ Recursos

- 🔏 **Assinaturas Criptográficas Reais (PAdES / PKCS#7):**  
  Utiliza certificados digitais padrão X.509 (`.pfx` / `.p12`). Garante a integridade inviolável do documento.
- 📄 **Rodapé Contínuo em Todas as Páginas:**  
  Insere seu nome (ou texto personalizado) no canto inferior esquerdo e o número da página (`página / total`) à direita em cada folha.
- ⚡ **100% Portátil e Sem Dependências Externas:**  
  Desenvolvido em TypeScript/JavaScript puro (`node-forge` + `pdf-lib` + `@signpdf`). Não requer Python, pip nem comandos de terminal.
- 🌐 **Suporte Multilíngue Nativo (i18n):**  
  Tradução completa em **Português (`pt`)**, **Inglês (`en`)**, **Espanhol (`es`)** e **Italiano (`it`)**, adaptando-se automaticamente ao idioma do seu Obsidian.
- ⏳ **Monitor de Validade e Alertas de Expiração (<= 30 dias):**  
  Avisa proativamente quando faltam **30 dias ou menos para o vencimento** do certificado, com botão de renovação em 1 clique.
- 🎛️ **Integração Nativa com o Obsidian:**  
  Aparece como uma opção na janela nativa **«Exportar para PDF»** e lembra sua preferência.
- ⏱️ **Pós-processamento Automatizado:**  
  Aguarda um tempo configurável (padrão: 5 segundos) para gravação segura em disco, aplica a assinatura e abre o PDF assinado no seu leitor padrão.
- 🔑 **Gerador de Certificados Integrado:**  
  Crie um certificado autoassinado válido por 3 anos diretamente nas configurações do plugin.
- 🛡️ **100% Privado e Offline:**  
  Toda a criptografia roda localmente na sua máquina. Sem telemetria ou chamadas para servidores externos.

---

## 🚀 Como Funciona

1. Abra qualquer nota no Obsidian e pressione `Ctrl + P` (ou `Cmd + P`) ➔ **Exportar para PDF**.
2. Marque a opção: **«Assinar com certificado digital»**.
3. Clique em **Exportar para PDF** e escolha onde salvar o arquivo.
4. O plugin automaticamente:
   - Exporta o documento com seu nome no rodapé de todas as páginas.
   - Aguarda a contagem regressiva de 5 segundos.
   - Sela o arquivo com seu certificado digital `.pfx`.
   - Abre o PDF assinado no visualizador com a assinatura válida.

---

## 🛠️ Instalação

### Método 1: Plugins da Comunidade do Obsidian (Recomendado após aprovação)
1. Abra **Configurações** ➔ **Plugins da comunidade**.
2. Busque por **PDF Digital Signature**.
3. Clique em **Instalar** e depois em **Ativar**.

### Método 2: Via BRAT (Beta Reviewer's Auto-update Tool)
1. Instale o plugin **BRAT** no Obsidian.
2. Em BRAT, selecione **Add Beta plugin**.
3. Cole a URL: `https://github.com/balca/obsidian-pdf-digital-signature`
4. Clique em **Add Plugin** e ative-o.

---

## 📄 Licença

Este projeto está licenciado sob a [Licença MIT](LICENSE).

Criado com ❤️ por [Benjamín Alcalde G.](https://github.com/balca)
