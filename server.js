const express = require("express");
const app = express();

// permet de lire le JSON (utile pour le panier plus tard)
app.use(express.json());

// sert tes fichiers HTML/CSS/JS
app.use(express.static("public"));

// route test
app.get("/test", (req, res) => {
  res.send("Serveur fonctionne 🔥");
});

// démarrer serveur
app.listen(4242, () => {
  console.log("Serveur lancé sur http://localhost:4242");
});
