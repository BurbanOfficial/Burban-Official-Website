// server.js
const cors = require('cors');
app.use(cors());
const express = require('express');
const app = express();
const path = require('path');
// Remplacez 'sk_test_...' par votre clé secrète Stripe
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
if (!process.env.STRIPE_SECRET_KEY) {
  console.error("Erreur : STRIPE_SECRET_KEY n'est pas défini.");
  process.exit(1);
}

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Point de terminaison pour créer la session Stripe Checkout
app.post('/create-checkout-session', async (req, res) => {
  // On attend un tableau d'articles au format : 
  // { id, name, price, quantity, image }
  try {
    const { items } = req.body;
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      billing_address_collection: 'required',
      // Création des line_items avec price_data directement
      line_items: items.map(item => ({
        price_data: {
          currency: 'eur',
          product_data: {
            name: item.name,
            description: "Taille : " + item.size,
            images: [item.image],
          },
          unit_amount: Math.round(item.price * 100), // montant en centimes
        },
        quantity: item.quantity,
      })),
      discounts: [],
      allow_promotion_codes: true, // ✅ Active le champ "Code Promo" sur Stripe
      mode: 'payment',
      success_url: 'https://burbanofficial.github.io/Burban-Official-Website/public/success.html',
      cancel_url: 'https://burbanofficial.github.io/Burban-Official-Website/public/cancel.html'
    });
    res.json({ sessionId: session.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Utilise le port défini par Render, ou 3000 en local
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur démarré sur le port ${PORT}`));
