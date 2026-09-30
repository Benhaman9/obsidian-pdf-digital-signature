# Signature numérique des PDF pour Obsidian

> 🇫🇷 **Français** | 🇬🇧 [English](README.md) | 🇪🇸 [Español](README.es.md) | 🇧🇷 [Português](README.pt.md) | 🇮🇹 [Italiano](README.it.md)

**PDF Digital Signature** ajoute une signature cryptographique PKCS#7 et un pied de page personnalisable aux PDF exportés depuis Obsidian. Il fonctionne sur ordinateur (Windows, macOS et Linux), localement et sans Python ni OpenSSL. Les bibliothèques JavaScript sont incluses dans le plugin.

## Fonctionnalités

- Trois options indépendantes : signature cryptographique, nom du signataire et numérotation « page / total ».
- Certificats X.509 au format `.pfx` ou `.p12`, avec clé privée RSA chiffrée.
- Création d’un certificat autosigné valable trois ans ; avertissement à l’approche de l’expiration.
- Signature différée (1 à 15 secondes) et ouverture facultative dans le lecteur PDF par défaut.
- Interface en anglais, espagnol, portugais, italien et français, selon la langue d’Obsidian.
- Commande pour signer un PDF existant. Si le sélecteur système est indisponible, elle propose les PDF du coffre.

## Installation

Téléchargez `main.js`, `manifest.json` et `styles.css` depuis les [versions publiées](https://github.com/Benhaman9/obsidian-pdf-digital-signature/releases). Copiez-les dans `.obsidian/plugins/obsidian-pdf-digital-signature/`, rechargez Obsidian et activez le plugin dans les paramètres des plugins communautaires. Vous pouvez aussi ajouter ce dépôt avec BRAT.

## Utilisation

1. Ouvrez une note et lancez **Exporter au format PDF** depuis la palette de commandes.
2. Choisissez les options de signature et de pied de page. Vos choix sont mémorisés.
3. Exportez le document. Si la signature est activée, le plugin attend le délai choisi, signe le PDF et l’ouvre si vous le souhaitez.

## Configuration

| Paramètre | Valeur par défaut |
| --- | --- |
| Signature cryptographique | Activée |
| Nom du signataire dans le pied de page | Activé |
| Numéro de page | Activé |
| Délai avant la signature | 5 secondes |
| Ouverture après la signature | Activée |
| Chemin du certificat | `Scripts/certificado.pfx` |
| Mot de passe | Généré aléatoirement au premier lancement |

Le chemin du certificat peut être relatif au coffre ou absolu. Le nom, le motif et le lieu de la signature sont configurables. Le renouvellement conserve le certificat précédent dans un fichier `.bak` adjacent.

## Limites du certificat et de la signature

La signature permet de détecter les modifications du contenu signé ; elle n’empêche pas l’édition du PDF. La confiance dans le signataire dépend du certificat et du lecteur : un certificat autosigné n’est pas automatiquement approuvé. Un mot de passe aléatoire est généré au premier lancement et peut être modifié avant la création du certificat. Le plugin conserve le mot de passe en clair dans ses paramètres locaux ; protégez le coffre et ses sauvegardes.

Les PDF déjà signés sont refusés, car le plugin réécrit le document au lieu d’ajouter une signature incrémentale. Il utilise `adbe.pkcs7.detached` ; aucune conformité complète aux profils PAdES, aucun horodatage de confiance ni aucune validation à long terme ne sont revendiqués.

[Adobe : confiance des certificats](https://helpx.adobe.com/acrobat/using/trusted-identities.html) · [Bibliothèque de signature](https://github.com/vbuch/node-signpdf)

## Licence

[MIT](LICENSE) — Benjamín Alcalde G.
