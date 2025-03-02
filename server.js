// server.js
const express = require('express');
const app = express();
const path = require('path');
const cors = require('cors');
// La clé Stripe doit être définie dans Render via une variable d'environnement (STRIPE_SECRET_KEY)
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

app.use(cors()); // Autorise toutes les origines (ou vous pouvez restreindre à votre domaine si nécessaire)
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Définition de la route en mode POST avec un chemin relatif
app.post('/create-checkout-session', async (req, res) => {
  try {
    const { items } = req.body; // On attend que le client envoie { items: [...] }
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
      allow_promotion_codes: true, // Active le champ "Code Promo" natif de Stripe
      mode: 'payment',
      // Remplacez ces URLs par vos URLs de succès et d'annulation en production
      success_url: 'https://burbanofficial.com/public/success.html',
      cancel_url: 'https://burbanofficial.com/public/cancel.html'
    });
    // On renvoie l'URL de la session Stripe pour rediriger l'utilisateur
    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur démarré sur le port ${PORT}`));
