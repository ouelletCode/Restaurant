// Panier partagé par toutes les pages, conservé dans le navigateur
const Panier = (() => {
  const CLE = "quebechine-panier";
  let memoire = {}; // repli si localStorage est bloqué

  function lire() {
    try {
      return JSON.parse(localStorage.getItem(CLE)) || {};
    } catch {
      return { ...memoire };
    }
  }

  function ecrire(contenu) {
    memoire = contenu;
    try {
      localStorage.setItem(CLE, JSON.stringify(contenu));
    } catch {}
    document.dispatchEvent(new CustomEvent("panier:change"));
  }

  function lignes() {
    const contenu = lire();
    return Catalogue.PLATS.filter((p) => contenu[p.id] > 0).map((p) => ({ id: p.id, qte: contenu[p.id], plat: p }));
  }

  function changer(id, qte) {
    const contenu = lire();
    if (qte > 0) contenu[id] = Math.min(qte, 50);
    else delete contenu[id];
    ecrire(contenu);
  }

  return {
    lignes,
    changer,
    ajouter: (id, qte = 1) => changer(id, (lire()[id] || 0) + qte),
    vider: () => ecrire({}),
    compte: () => lignes().reduce((somme, l) => somme + l.qte, 0),
  };
})();

const formatPrix = (montant) =>
  new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD" }).format(montant);

function majCompteur() {
  const n = Panier.compte();
  document.querySelectorAll("[data-compteur]").forEach((el) => {
    el.textContent = n;
    el.hidden = n === 0;
  });
}

let minuterieToast;
function afficherToast(texte) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    toast.setAttribute("role", "status");
    toast.innerHTML = '<span class="toast__texte"></span><a href="panier.html">Voir le panier</a>';
    document.body.appendChild(toast);
  }
  toast.querySelector(".toast__texte").textContent = texte;
  toast.classList.add("toast--visible");
  clearTimeout(minuterieToast);
  minuterieToast = setTimeout(() => toast.classList.remove("toast--visible"), 3500);
}

document.addEventListener("click", (e) => {
  const bouton = e.target.closest("[data-ajouter]");
  if (!bouton) return;
  const plat = Catalogue.PLATS.find((p) => p.id === bouton.dataset.ajouter);
  if (!plat) return;
  Panier.ajouter(plat.id);
  afficherToast(`${plat.nom} ajouté au panier`);
});

document.addEventListener("panier:change", majCompteur);
majCompteur();
