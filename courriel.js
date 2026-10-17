// Envoi des courriels par Gmail (mot de passe d'application, voir README)
const nodemailer = require("nodemailer");
const { PLATS } = require("./public/js/catalogue");

const { GMAIL_USER, GMAIL_APP_PASSWORD } = process.env;
const COURRIEL_RESTAURANT = process.env.COURRIEL_RESTAURANT || GMAIL_USER;

const transport =
  GMAIL_USER && GMAIL_APP_PASSWORD
    ? nodemailer.createTransport({ service: "gmail", auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD } })
    : null;

if (!transport) console.warn("Courriels désactivés : GMAIL_USER ou GMAIL_APP_PASSWORD manquant dans .env");

const prix = (montant) => new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD" }).format(montant);
const echapper = (texte) =>
  String(texte).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// envoie sans jamais faire échouer la requête : la commande est déjà enregistrée dans data/
async function envoyer(options) {
  if (!transport) return;
  try {
    await transport.sendMail({ from: `"QuébeChine" <${GMAIL_USER}>`, ...options });
  } catch (err) {
    console.error(`Échec de l'envoi du courriel « ${options.subject} » :`, err.message);
  }
}

function resumeCommande(commande) {
  const lignes = commande.lignes.map(({ id, qte }) => {
    const plat = PLATS.find((p) => p.id === id);
    return `${qte} × ${plat.nom} — ${prix(plat.prix * qte)}`;
  });
  const taxes = commande.taxes.map((t) => `${t.nom} : ${prix(t.montant)}`);
  return [...lignes, "", `Sous-total : ${prix(commande.sousTotal)}`, ...taxes, `Total : ${prix(commande.total)}`].join("\n");
}

function detailsClient({ nom, courriel, telephone, date, invites, mode, notes }) {
  return [
    `Nom : ${nom}`,
    `Courriel : ${courriel}`,
    `Téléphone : ${telephone}`,
    `Date de l'événement : ${date}`,
    `Invités : ${invites || "non précisé"}`,
    `Réception : ${mode}`,
    `Précisions : ${notes || "aucune"}`,
  ].join("\n");
}

// texte brut + la même chose en HTML échappé, pour que les clients courriel l'affichent bien
const enHTML = (texte) => `<pre style="font-family:inherit;white-space:pre-wrap">${echapper(texte)}</pre>`;

function courrielsCommande(commande) {
  const { client } = commande;
  const pourRestaurant = `Nouvelle commande ${commande.numero}\n\n${detailsClient(client)}\n\n${resumeCommande(commande)}`;
  const pourClient =
    `Bonjour ${client.nom},\n\nMerci pour votre commande ${commande.numero}. ` +
    `Nous vous contacterons sous peu pour confirmer les détails.\n\n` +
    `${resumeCommande(commande)}\n\nDate de l'événement : ${client.date} (${client.mode})\n\n` +
    `QuébeChine · 514 885-9312`;

  return Promise.all([
    envoyer({
      to: COURRIEL_RESTAURANT,
      replyTo: client.courriel,
      subject: `Nouvelle commande ${commande.numero} : ${prix(commande.total)}`,
      text: pourRestaurant,
      html: enHTML(pourRestaurant),
    }),
    envoyer({
      to: client.courriel,
      replyTo: COURRIEL_RESTAURANT,
      subject: `Votre commande QuébeChine ${commande.numero}`,
      text: pourClient,
      html: enHTML(pourClient),
    }),
  ]);
}

function courrielContact(demande) {
  const texte = [
    `Nom : ${demande.nom}`,
    `Courriel : ${demande.courriel}`,
    `Date de l'événement : ${demande.date || "non précisée"}`,
    `Invités : ${demande.invites || "non précisé"}`,
    "",
    demande.message,
  ].join("\n");
  return envoyer({
    to: COURRIEL_RESTAURANT,
    replyTo: demande.courriel,
    subject: `Demande de contact de ${demande.nom}`,
    text: texte,
    html: enHTML(texte),
  });
}

module.exports = { courrielsCommande, courrielContact };
