// Affiche les plats dans chaque conteneur [data-menu] (data-limite pour n'en montrer que quelques-uns)
document.querySelectorAll("[data-menu]").forEach((conteneur) => {
  const limite = Number(conteneur.dataset.limite) || Catalogue.PLATS.length;
  conteneur.innerHTML = Catalogue.PLATS.slice(0, limite)
    .map(
      (p) => `
      <article class="plat">
        <img class="plat__image" src="${p.image}" alt="${p.alt}" loading="lazy" />
        <div class="plat__corps">
          <span class="plat__etiquette">${p.etiquette}</span>
          <h3 class="plat__nom">${p.nom}</h3>
          <p class="plat__description">${p.description}</p>
          <div class="plat__pied">
            <span class="prix">${formatPrix(p.prix)}</span>
            <button class="bouton bouton--plein bouton--petit" type="button" data-ajouter="${p.id}">
              Ajouter au panier
            </button>
          </div>
        </div>
      </article>`
    )
    .join("");
});
