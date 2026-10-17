const zonePanier = document.querySelector("[data-panier]");
const zoneVide = document.querySelector("[data-vide]");
const zoneLignes = document.querySelector("[data-lignes]");
const zoneTotaux = document.querySelector("[data-totaux]");
const zoneConfirmation = document.querySelector("[data-confirmation]");
const formCommande = document.getElementById("form-commande");
const messageCommande = formCommande.querySelector("[data-message]");
const boutonCommande = formCommande.querySelector("button[type=submit]");

let commandeEnvoyee = false;

function afficherPanier() {
  const lignes = Panier.lignes();
  zonePanier.hidden = commandeEnvoyee || lignes.length === 0;
  zoneVide.hidden = commandeEnvoyee || lignes.length > 0;
  if (!lignes.length) return;

  // garde le focus sur le bouton +/− après le nouveau rendu
  const focus = document.activeElement?.dataset;
  const cleFocus = focus?.action && `[data-action="${focus.action}"][data-id="${focus.id}"]`;

  zoneLignes.innerHTML = lignes
    .map(
      ({ id, qte, plat }) => `
      <li class="ligne">
        <img class="ligne__image" src="${plat.image}" alt="" />
        <div class="ligne__infos">
          <h3 class="ligne__nom">${plat.nom}</h3>
          <span class="ligne__unitaire">${formatPrix(plat.prix)} l'unité</span>
          <button class="lien-discret" type="button" data-action="retirer" data-id="${id}">Retirer</button>
        </div>
        <div class="quantite" role="group" aria-label="Quantité de ${plat.nom}">
          <button type="button" data-action="moins" data-id="${id}" aria-label="Retirer un">−</button>
          <span aria-live="polite">${qte}</span>
          <button type="button" data-action="plus" data-id="${id}" aria-label="Ajouter un">+</button>
        </div>
        <span class="ligne__total">${formatPrix(plat.prix * qte)}</span>
      </li>`
    )
    .join("");

  const { sousTotal, taxes, total } = Catalogue.calculerTotaux(lignes);
  zoneTotaux.innerHTML = `
    <div><dt>Sous-total</dt><dd>${formatPrix(sousTotal)}</dd></div>
    ${taxes
      .map((t) => `<div><dt>${t.nom} (${(t.taux * 100).toLocaleString("fr-CA")} %)</dt><dd>${formatPrix(t.montant)}</dd></div>`)
      .join("")}
    <div class="totaux__total"><dt>Total</dt><dd>${formatPrix(total)}</dd></div>`;

  if (cleFocus) zoneLignes.querySelector(cleFocus)?.focus();
}

zoneLignes.addEventListener("click", (e) => {
  const bouton = e.target.closest("[data-action]");
  if (!bouton) return;
  const ligne = Panier.lignes().find((l) => l.id === bouton.dataset.id);
  if (!ligne) return;
  if (bouton.dataset.action === "plus") Panier.changer(ligne.id, ligne.qte + 1);
  if (bouton.dataset.action === "moins") Panier.changer(ligne.id, ligne.qte - 1);
  if (bouton.dataset.action === "retirer") Panier.changer(ligne.id, 0);
});

formCommande.date.min = aujourdhui();

formCommande.addEventListener("submit", async (e) => {
  e.preventDefault();
  const client = Object.fromEntries(new FormData(formCommande));

  let erreur = "";
  if (!client.nom.trim()) erreur = "Indiquez votre nom.";
  else if (!COURRIEL_VALIDE.test(client.courriel)) erreur = "Vérifiez votre courriel, il semble incomplet.";
  else if (client.telephone.replace(/\D/g, "").length < 10) erreur = "Indiquez un numéro de téléphone à 10 chiffres.";
  else if (!client.date || client.date < aujourdhui()) erreur = "Choisissez la date de votre événement.";
  if (erreur) return afficherMessage(messageCommande, erreur, true);

  boutonCommande.disabled = true;
  boutonCommande.textContent = "Envoi en cours…";
  try {
    const lignes = Panier.lignes().map(({ id, qte }) => ({ id, qte }));
    const { numero, total } = await envoyerJSON("/api/commandes", { client, lignes });
    commandeEnvoyee = true;
    Panier.vider();
    zoneConfirmation.querySelector("[data-numero]").textContent = numero;
    zoneConfirmation.querySelector("[data-total]").textContent = formatPrix(total);
    zoneConfirmation.querySelector("[data-courriel]").textContent = client.courriel;
    zoneConfirmation.hidden = false;
    zoneConfirmation.focus();
  } catch (err) {
    afficherMessage(messageCommande, `${err.message} Vous pouvez aussi nous appeler au 514 885-9312.`, true);
  } finally {
    boutonCommande.disabled = false;
    boutonCommande.textContent = "Envoyer la commande";
  }
});

document.addEventListener("panier:change", afficherPanier);
afficherPanier();
