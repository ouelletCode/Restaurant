# QuébeChine

Site du service traiteur QuébeChine : menu, panier, commande et formulaire de contact, servis par Express.

## Lancer le site

```bash
npm install
cp .env.example .env   # puis remplissez .env
npm start              # http://localhost:4242
```

Les commandes et les demandes de contact sont enregistrées dans `data/` (ignoré par git) et envoyées par courriel.

## Courriels avec Gmail

À chaque commande, le restaurant reçoit le détail et le client reçoit une confirmation. Chaque demande de contact est aussi envoyée au restaurant.

Gmail refuse le mot de passe normal du compte. Il faut un **mot de passe d'application** :

1. Activez la validation en deux étapes sur le compte Google : https://myaccount.google.com/security
2. Créez un mot de passe d'application : https://myaccount.google.com/apppasswords
3. Copiez les 16 caractères dans `GMAIL_APP_PASSWORD` du fichier `.env`.

Sans ces identifiants, le site fonctionne quand même : les commandes sont enregistrées, mais aucun courriel n'est envoyé (un avertissement s'affiche au démarrage). Si un envoi échoue, la commande reste enregistrée et l'erreur est écrite dans le terminal.
