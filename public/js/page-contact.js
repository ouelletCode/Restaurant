const formContact = document.getElementById("form-contact");
const messageContact = formContact.querySelector("[data-message]");
const boutonContact = formContact.querySelector("button[type=submit]");

formContact.date.min = aujourdhui();

formContact.addEventListener("submit", async (e) => {
  e.preventDefault();
  const donnees = Object.fromEntries(new FormData(formContact));

  let erreur = "";
  if (!donnees.nom.trim()) erreur = "Indiquez votre nom.";
  else if (!COURRIEL_VALIDE.test(donnees.courriel)) erreur = "Vérifiez votre courriel, il semble incomplet.";
  else if (donnees.message.trim().length < 10) erreur = "Décrivez votre événement en quelques mots.";
  if (erreur) return afficherMessage(messageContact, erreur, true);

  boutonContact.disabled = true;
  try {
    await envoyerJSON("/api/contact", donnees);
    formContact.reset();
    afficherMessage(messageContact, `Merci ${donnees.nom.trim()}, votre demande est envoyée. Nous vous répondons par courriel.`, false);
  } catch (err) {
    afficherMessage(messageContact, `${err.message} Vous pouvez aussi nous appeler au 514 885-9312.`, true);
  } finally {
    boutonContact.disabled = false;
  }
});
