// server.js
const express = require('express');
const app = express();
const path = require('path');
// Remplacez 'sk_test_...' par votre clé secrète Stripe
const stripe = require('stripe')('sk_test_51Q9ORzRwel3656rYCv3vUCOZm5eKMS2KjlqbOcbI3MXLVFy5TZDQFth7DUwCSP5HlIBRrslN2NplWwHfLfaWarL900J9Q4Ns99');

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
      success_url: 'http://localhost:3000/success.html',
      cancel_url: 'http://localhost:3000/cancel.html'
    });
    res.json({ sessionId: session.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => console.log('Serveur démarré sur le port 3000'));
