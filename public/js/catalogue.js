// Plats et calcul des taxes, partagés par le navigateur et par server.js
(function (racine) {
  const PLATS = [
    {
      id: "table-gourmande",
      nom: "Table asiatique gourmande",
      prix: 29.99,
      image: "images/001.jpg",
      alt: "Table garnie de petits plats asiatiques colorés",
      etiquette: "À partager",
      description:
        "Un bol de légumes croquants et de vermicelles aux herbes fraîches et au sésame, du poulet laqué à la sauce sucrée-salée, des bouchées vapeur avec leur sauce soja relevée et une salade aux agrumes et à la coriandre.",
    },
    {
      id: "salade-croquante",
      nom: "Salade croquante aux crevettes",
      prix: 19.99,
      image: "images/002.jpg",
      alt: "Salade de légumes émincés, vermicelles et crevettes",
      etiquette: "Entrée",
      description:
        "Légumes finement émincés, vermicelles, radis, coriandre et basilic, crevettes tendres. Vinaigrette légère au sésame et au gingembre.",
    },
    {
      id: "nouilles-sautees",
      nom: "Nouilles sautées sésame et lime",
      prix: 24.99,
      image: "images/003.jpg",
      alt: "Bol de nouilles sautées aux légumes et à la lime",
      etiquette: "Plat",
      description:
        "Nouilles sautées avec légumes croquants, poisson ou fruits de mer, coriandre et sésame. Sauce légèrement sucrée-salée aux notes grillées, relevée de lime.",
    },
    {
      id: "general-tao",
      nom: "Poulet Général Tao",
      prix: 34.99,
      image: "images/general-tao.jpg",
      alt: "Poulet Général Tao croustillant avec graines de sésame et oignons verts",
      etiquette: "Le classique",
      description:
        "Poulet croustillant enrobé d'une sauce brillante à l'ail et au gingembre, à la fois sucrée, acidulée et épicée. Servi avec des légumes sautés, du sésame et des oignons verts.",
    },
  ];

  const TAXES = [
    { nom: "TPS", taux: 0.05 },
    { nom: "TVQ", taux: 0.09975 },
  ];

  // lignes : [{ id, qte }] ; les montants sont calculés en cents pour éviter les erreurs d'arrondi
  function calculerTotaux(lignes) {
    const sousTotalCents = lignes.reduce((somme, ligne) => {
      const plat = PLATS.find((p) => p.id === ligne.id);
      return plat ? somme + Math.round(plat.prix * 100) * ligne.qte : somme;
    }, 0);
    const taxes = TAXES.map((t) => ({ ...t, montant: Math.round(sousTotalCents * t.taux) / 100 }));
    const taxesCents = taxes.reduce((somme, t) => somme + Math.round(t.montant * 100), 0);
    return {
      sousTotal: sousTotalCents / 100,
      taxes,
      total: (sousTotalCents + taxesCents) / 100,
    };
  }

  const api = { PLATS, TAXES, calculerTotaux };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else racine.Catalogue = api;
})(this);
