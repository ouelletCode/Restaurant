// charge .env s'il existe (identifiants Gmail, voir README)
try {
  process.loadEnvFile();
} catch {}

const express = require("express");
const fs = require("fs");
const path = require("path");
const { PLATS, calculerTotaux } = require("./public/js/catalogue");
const { courrielsCommande, courrielContact } = require("./courriel");

const app = express();
const PORT = process.env.PORT || 4242;
const DOSSIER_DONNEES = path.join(__dirname, "data");
const COURRIEL_VALIDE = /^\S+@\S+\.\S+$/;
const QTE_MAX = 50;
const DELAI_MIN_JOURS = 1; // un traiteur a besoin d'au moins un jour de préavis

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

// AAAA-MM-JJ dans le fuseau du restaurant, décalé de `jours`
function dateDans(jours) {
  const d = new Date();
  d.setDate(d.getDate() + jours);
  return d.toLocaleDateString("en-CA", { timeZone: "America/Toronto" });
}

// regroupe les doublons d'un même plat pour que la limite par plat ne puisse pas être contournée
function regrouperLignes(lignes) {
  const qtes = new Map();
  for (const l of Array.isArray(lignes) ? lignes : []) {
    if (!PLATS.some((p) => p.id === l?.id) || !Number.isInteger(l.qte) || l.qte <= 0) continue;
    qtes.set(l.id, (qtes.get(l.id) || 0) + l.qte);
  }
  return [...qtes].map(([id, qte]) => ({ id, qte }));
}

app.post("/api/commandes", async (req, res) => {
  const { client = {}, lignes = [] } = req.body || {};

  // on ne fait jamais confiance aux prix du navigateur : seuls l'id et la quantité sont gardés
  const lignesValides = regrouperLignes(lignes);
  if (!lignesValides.length) return res.status(400).json({ erreur: "Le panier est vide." });
  if (lignesValides.some((l) => l.qte > QTE_MAX)) {
    return res.status(400).json({ erreur: `Maximum ${QTE_MAX} portions par plat. Appelez-nous pour les grosses commandes.` });
  }

  const infos = {
    nom: texte(client.nom, 100),
    courriel: texte(client.courriel, 200),
    telephone: texte(client.telephone, 30),
    date: texte(client.date, 10),
    invites: texte(client.invites, 4),
    mode: client.mode === "cueillette" ? "cueillette" : "livraison",
    notes: texte(client.notes, 1000),
  };
  if (!infos.nom || !COURRIEL_VALIDE.test(infos.courriel) || infos.telephone.replace(/\D/g, "").length < 10 || !/^\d{4}-\d{2}-\d{2}$/.test(infos.date)) {
    return res.status(400).json({ erreur: "Il manque des informations pour la commande." });
  }
  // les dates AAAA-MM-JJ se comparent comme du texte
  if (infos.date < dateDans(DELAI_MIN_JOURS)) {
    return res.status(400).json({ erreur: "Les commandes doivent être passées au moins un jour à l'avance." });
  }

  const commande = {
    numero: "QC-" + Date.now().toString(36).toUpperCase(),
    recueLe: new Date().toISOString(),
    client: infos,
    lignes: lignesValides,
    ...calculerTotaux(lignesValides),
  };
  enregistrer("commandes.jsonl", commande);
  console.log(`Nouvelle commande ${commande.numero} : ${commande.total} $ pour ${infos.nom}`);
  await courrielsCommande(commande);

  res.status(201).json({ numero: commande.numero, total: commande.total });
});

app.post("/api/contact", async (req, res) => {
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
  await courrielContact(demande);
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
