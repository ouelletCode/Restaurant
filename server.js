const express = require("express");
const fs = require("fs");
const path = require("path");
const { PLATS, calculerTotaux } = require("./public/js/catalogue");

const app = express();
const PORT = process.env.PORT || 4242;
const DOSSIER_DONNEES = path.join(__dirname, "data");
const COURRIEL_VALIDE = /^\S+@\S+\.\S+$/;

// permet de lire le JSON envoyé par le panier et le formulaire de contact
app.use(express.json({ limit: "20kb" }));

// sert les fichiers HTML/CSS/JS
app.use(express.static(path.join(__dirname, "public")));

// ajoute une ligne JSON dans data/<fichier> (dossier ignoré par git)
function enregistrer(fichier, donnees) {
  fs.mkdirSync(DOSSIER_DONNEES, { recursive: true });
  fs.appendFileSync(path.join(DOSSIER_DONNEES, fichier), JSON.stringify(donnees) + "\n");
}

const texte = (valeur, max = 500) => String(valeur ?? "").trim().slice(0, max);

app.post("/api/commandes", (req, res) => {
  const { client = {}, lignes = [] } = req.body || {};

  // on ne fait jamais confiance aux prix du navigateur : seuls l'id et la quantité sont gardés
  const lignesValides = (Array.isArray(lignes) ? lignes : []).filter(
    (l) => PLATS.some((p) => p.id === l.id) && Number.isInteger(l.qte) && l.qte > 0 && l.qte <= 50
  );
  if (!lignesValides.length) return res.status(400).json({ erreur: "Le panier est vide." });

  const infos = {
    nom: texte(client.nom, 100),
    courriel: texte(client.courriel, 200),
    telephone: texte(client.telephone, 30),
    date: texte(client.date, 10),
    invites: texte(client.invites, 4),
    mode: client.mode === "cueillette" ? "cueillette" : "livraison",
    notes: texte(client.notes, 1000),
  };
  if (!infos.nom || !COURRIEL_VALIDE.test(infos.courriel) || !infos.telephone || !/^\d{4}-\d{2}-\d{2}$/.test(infos.date)) {
    return res.status(400).json({ erreur: "Il manque des informations pour la commande." });
  }

  const commande = {
    numero: "QC-" + Date.now().toString(36).toUpperCase(),
    recueLe: new Date().toISOString(),
    client: infos,
    lignes: lignesValides.map(({ id, qte }) => ({ id, qte })),
    ...calculerTotaux(lignesValides),
  };
  enregistrer("commandes.jsonl", commande);
  console.log(`Nouvelle commande ${commande.numero} : ${commande.total} $ pour ${infos.nom}`);

  res.status(201).json({ numero: commande.numero, total: commande.total });
});

app.post("/api/contact", (req, res) => {
  const corps = req.body || {};
  const demande = {
    recueLe: new Date().toISOString(),
    nom: texte(corps.nom, 100),
    courriel: texte(corps.courriel, 200),
    date: texte(corps.date, 10),
    invites: texte(corps.invites, 4),
    message: texte(corps.message, 3000),
  };
  if (!demande.nom || !COURRIEL_VALIDE.test(demande.courriel) || demande.message.length < 10) {
    return res.status(400).json({ erreur: "Il manque des informations dans la demande." });
  }

  enregistrer("contacts.jsonl", demande);
  console.log(`Nouvelle demande de contact de ${demande.nom}`);
  res.status(201).json({ ok: true });
});

// route test
app.get("/test", (req, res) => {
  res.send("Serveur fonctionne 🔥");
});

// démarrer serveur
app.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});
