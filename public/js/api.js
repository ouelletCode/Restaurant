// Envoie des données JSON au serveur Express et renvoie sa réponse, ou lance une erreur lisible
async function envoyerJSON(url, donnees) {
  let reponse;
  try {
    reponse = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(donnees),
    });
  } catch {
    throw new Error("Impossible de joindre le serveur. Vérifiez votre connexion.");
  }
  const resultat = await reponse.json().catch(() => ({}));
  if (!reponse.ok) throw new Error(resultat.erreur || "Le serveur n'a pas pu traiter la demande.");
  return resultat;
}

function afficherMessage(el, texte, estErreur) {
  el.textContent = texte;
  el.classList.toggle("message--erreur", estErreur);
  el.hidden = false;
}

const COURRIEL_VALIDE = /^\S+@\S+\.\S+$/;
const aujourdhui = () => new Date().toLocaleDateString("en-CA"); // AAAA-MM-JJ, heure locale
// première date commandable : un jour de préavis, comme DELAI_MIN_JOURS dans server.js
const demain = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toLocaleDateString("en-CA");
};
