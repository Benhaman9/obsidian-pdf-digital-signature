# Signature numérique des PDF pour Obsidian

## Signer et vérifier dans la version 1.1.1

Utilisez le menu contextuel du fichier PDF ou les commandes du PDF actif pour le signer ou le vérifier. La signature d'un PDF existant affiche le fichier, le certificat et le mode à vérifier, puis crée une copie .signed.pdf (avec suffixe unique si nécessaire) en conservant l'original. Les PDF exportés sont signés après l'exportation. Si un fichier change dans la file d'attente, la tâche est refusée afin de ne pas le signer avec des paramètres anciens. Si Windows bloque le remplacement d’un PDF exporté, le plugin crée une copie signée .signed.pdf sans forcer l’écriture dans le fichier verrouillé ; le nom affiché et le PDF ouvert ensuite correspondent à cette copie.

Les détails du certificat affichent le titulaire, l'émetteur et l'empreinte SHA-256 indiqués par le certificat, ainsi que son caractère autosigné. Ils permettent d'identifier le certificat configuré sans établir l'identité ou la confiance. La création d'un certificat autosigné est une action explicite dans les paramètres. Si le fichier configuré existe, un autre fichier est choisi et l'ancien certificat est conservé ; cela ne renouvelle pas un certificat émis par un prestataire.

Les limites d'entrée sont de 64 MiB par PDF et de 4 MiB par certificat PKCS#12. La sortie signée est également limitée à 64 MiB : un PDF proche de la limite d'entrée peut être refusé si la signature augmente sa taille. Avant l'enregistrement, chaque signature créée doit passer les contrôles locaux de cryptographie et de couverture du fichier entier. Il s'agit d'un contrôle d'intégrité, pas d'une évaluation de confiance ou juridique.


## Choisir comment signer

- **Certifier — aucune modification autorisée**, par défaut, ajoute une politique DocMDP avec permission `P=1`. Les lecteurs compatibles peuvent rejeter les modifications ultérieures selon cette règle. Les logiciels qui l'ignorent peuvent toujours modifier le PDF.
- **Signature d'intégrité** signe la révision actuelle sans certification. Un lecteur peut indiquer que la signature originale reste cryptographiquement valide tout en signalant des révisions ultérieures ; vérifiez l'état de modification du document actuel.
- **Pays ou contexte juridique** change uniquement l'orientation, pas votre certificat, identité, format ou statut juridique. Vérifiez les exigences du destinataire.

Configurez un `.pfx`/`.p12` existant et son mot de passe, ou créez explicitement un certificat autosigné dans les paramètres. Aucun certificat absent n'est remplacé silencieusement. Les certificats autosignés peuvent servir aux contrôles personnels d'intégrité ; le destinataire doit établir la confiance séparément.

Utilisez **Vérifier l'intégrité de la signature d'un PDF** depuis la palette de commandes ou le menu du fichier PDF. Le contrôle vérifie les signatures compatibles et la couverture du fichier entier, en détectant les octets ajoutés. Les structures incompatibles reçoivent un résultat explicite. Il ne valide pas les chaînes de confiance, révocations, horodatages de confiance, modifications autorisées, conformité PAdES ou suffisance juridique. Pour une validation indépendante facultative et sa configuration de confiance, consultez le [guide pyHanko](https://docs.pyhanko.eu/en/latest/cli-guide/validation.html).

Les horodatages de confiance, PAdES T/LT/LTA, jetons de prestataires et signatures à distance ne sont pas pris en charge. Aucune conformité PAdES B n'est revendiquée. Les profils techniques diffèrent des catégories juridiques.

Références : [ETSI PAdES](https://www.etsi.org/deliver/etsi_EN/319100_319199/31914201/01.02.01_60/en_31914201v010201p.pdf), [Commission européenne FAQ](https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/880312429/eSignature%2BFAQ), [Chili — loi 19.799](https://www.bcn.cl/leychile/navegar?idNorma=196640), [ICO britannique](https://ico.org.uk/for-organisations/guide-to-eidas/qualified-trust-services/), [États-Unis — 15 USC 7001](https://uscode.house.gov/view.xhtml?req=%28title%3A15+section%3A7001%28c%29+edition%3Aprelim%29).

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

Le chemin du certificat peut être relatif au coffre ou absolu. Le nom, le motif et le lieu de la signature sont configurables. La création d’un certificat autosigné n’écrase jamais le certificat configuré.

## Limites du certificat et de la signature

La signature permet de détecter les modifications du contenu signé ; elle n’empêche pas l’édition du PDF. La confiance dans le signataire dépend du certificat et du lecteur : un certificat autosigné n’est pas automatiquement approuvé. Un mot de passe aléatoire est généré au premier lancement et peut être modifié avant la création du certificat ; un mot de passe vide est refusé pour les nouveaux certificats. Obsidian 1.11.5 ou une version ultérieure est requis. Le mot de passe est conservé dans le SecretStorage local, hors de `data.json` ; les anciens mots de passe sont migrés au chargement du plugin. Il doit être configuré séparément sur chaque appareil. Les certificats expirés ou pas encore valides ne peuvent pas être utilisés pour signer.

Les PDF déjà signés sont refusés, car le plugin réécrit le document au lieu d’ajouter une signature incrémentale. Il utilise `adbe.pkcs7.detached` ; aucune conformité complète aux profils PAdES, aucun horodatage de confiance ni aucune validation à long terme ne sont revendiqués.

[Adobe : confiance des certificats](https://helpx.adobe.com/acrobat/using/trusted-identities.html) · [Bibliothèque de signature](https://github.com/vbuch/node-signpdf)

## Licence

[MIT](LICENSE) — Benjamín Alcalde G.
