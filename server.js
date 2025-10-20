// server.js (modifié pour Klaviyo + gestion statuts via metadata Stripe)
const express = require('express');
const app = express();
const path = require('path');
const cors = require('cors');
const geoip = require('geoip-lite');
const axios = require('axios');

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- (ton code shippingRates, getCategory, getShippingCost, getCombinedShippingCost, countryToRegion, euCountries) ---
// (Je garde intact tout ce que tu as déjà dans ton fichier, y compris la logique de tarification.)
// Copie-colle ici tes fonctions shippingRates/getCategory/getCombinedShippingCost...

/* ------------------ UTILS POUR KLAVIYO ------------------ */
const KLAVIYO_TRACK_URL = 'https://a.klaviyo.com/api/track';

async function sendEventToKlaviyo(eventName, email, properties = {}) {
  if (!process.env.KLAVIYO_PUBLIC_TOKEN) {
    console.warn('KLAVIYO_PUBLIC_TOKEN absent — impossible d’envoyer l’événement.');
    return;
  }
  const payload = {
    token: process.env.KLAVIYO_PUBLIC_TOKEN,
    event: eventName,
    customer_properties: { $email: email },
    properties
  };
  try {
    await axios.post(KLAVIYO_TRACK_URL, payload, { headers: { 'Content-Type': 'application/json' } });
    console.log(`Event ${eventName} envoyé à Klaviyo pour ${email}`);
  } catch (err) {
    console.error('Erreur envoi Klaviyo:', err.response ? err.response.data : err.message);
  }
}

/* ------------------ ROUTE GEOIP (ton code) ------------------ */
app.get('/geoip', (req, res) => {
  const xForwardedFor = req.headers['x-forwarded-for'];
  const ip = xForwardedFor ? xForwardedFor.split(',')[0].trim() : req.connection.remoteAddress;
  const geo = geoip.lookup(ip);
  res.json({ ip, geo });
});

/* ------------------ CREATE CHECKOUT SESSION (modifié pour metadata) ------------------ */
app.post('/create-checkout-session', async (req, res) => {
  try {
    const { items, voucher } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Aucun article dans le panier." });
    }

    // --- DETECTION REGION (ton code) ---
    const xForwardedFor = req.headers['x-forwarded-for'];
    const ip = xForwardedFor ? xForwardedFor.split(',')[0].trim() : req.connection.remoteAddress;
    const geo = geoip.lookup(ip);
    let region = 'worldwide';
    if (geo && geo.country) {
      const countryCode = geo.country.toLowerCase();
      if (countryToRegion[countryCode]) {
        region = countryToRegion[countryCode];
      } else if (euCountries.includes(countryCode)) {
        region = 'europe';
      }
    }

    // --- line_items (ton code) ---
    const productLineItems = items.map(item => ({
      price_data: {
        currency: 'eur',
        product_data: {
          name: item.name,
          description: "Size : " + item.size,
          images: [item.image],
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
      tax_rates: [process.env.TAX_RATE_ID]
    }));

    const itemsTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    let shippingTotal = getCombinedShippingCost(items, region);
    if (itemsTotal >= 50) shippingTotal = 0;

    let lineItems = productLineItems;
    if (shippingTotal > 0) {
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: { name: "Shipping Cost" },
          unit_amount: shippingTotal,
        },
        quantity: 1,
        tax_rates: [process.env.TAX_RATE_ID]
      });
    }

    // Générer un order_id simple et unique (timestamp + random)
    const orderId = `BURBAN-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;

    // Préparer les discounts (ton code)...
    let discounts = [];
    // ... ta logique de voucher (corrige les variables si besoin) ...

    /* --- IMPORTANT: on ajoute des metadata structurés --- */
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card','link','revolut_pay','amazon_pay','billie','klarna'],
      billing_address_collection: 'required',
      shipping_address_collection: { allowed_countries: [ /* ta liste */ ] },
      line_items: lineItems,
      ...(discounts.length > 0 ? { discounts } : { allow_promotion_codes: true }),
      mode: 'payment',
      success_url: 'https://burbanofficial.com/public/success.html',
      cancel_url: 'https://burbanofficial.com/public/cancel.html',
      // METADATA initiale : on note l'order_id et un statut initial
      metadata: {
        order_id: orderId,
        order_status: 'checkout_created' // statut initial
      }
    });

    // Renvoie la session au client
    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error("Erreur:", error);
    res.status(500).json({ error: error.message });
  }
});

/* ------------------ WEBHOOK STRIPE : réception des événements ------------------ */
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    if (endpointSecret) {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } else {
      // En dev si pas de signature configurée
      event = JSON.parse(req.body.toString());
    }
  } catch (err) {
    console.error('Erreur signature webhook:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Gérer les événements qui nous intéressent
  (async () => {
    try {
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const email = session.customer_details ? session.customer_details.email : session.customer_email;
        const orderId = (session.metadata && session.metadata.order_id) ? session.metadata.order_id : null;

        // Mettre à jour la metadata pour indiquer que le paiement est effectué
        try {
          await stripe.checkout.sessions.update(session.id, {
            metadata: {
              ...session.metadata,
              order_status: 'paid' // ou "paid" / "payment_succeeded"
            }
          });
        } catch (err) {
          console.warn('Impossible de mettre à jour la session (non critique) :', err.message);
        }

        // Envoyer un événement à Klaviyo — "Order Placed"
        const items = session.display_items || []; // fallback
        await sendEventToKlaviyo('Order Placed', email, {
          order_id: orderId,
          amount_total: session.amount_total,
          currency: session.currency,
          items
        });

        console.log('checkout.session.completed traité pour', email);
      }
      // Tu peux ajouter d'autres events Stripe si nécessaire
    } catch (err) {
      console.error('Erreur traitement webhook:', err);
    }
  })();

  res.json({ received: true });
});

/* ------------------ ENDPOINT ADMIN : mettre à jour le statut de commande ------------------ */
/**
 * POST /admin/update-order-status
 * Headers: x-admin-key: <ADMIN_API_KEY>
 * Body: { sessionId: 'cs_test_...', status: 'preparation'|'shipped'|'delivered', tracking_number: '...' , email: 'client@ex.com' }
 */
app.post('/admin/update-order-status', async (req, res) => {
  try {
    // Auth simple
    const adminKey = req.headers['x-admin-key'];
    if (!adminKey || adminKey !== process.env.ADMIN_API_KEY) {
      return res.status(401).json({ error: 'Non autorisé' });
    }

    const { sessionId, status, tracking_number, email, order_id } = req.body;
    if (!sessionId && !order_id) {
      return res.status(400).json({ error: 'sessionId ou order_id requis' });
    }

    // On préfère utiliser sessionId. Si tu passes order_id seulement, tu peux rechercher la session via l'API Stripe (coûteux)
    if (!sessionId) {
      // Optionnel : recherche par metadata (non optimisée) - tu peux utiliser Stripe Search si besoin.
      return res.status(400).json({ error: 'Pour l’instant, fournis sessionId' });
    }

    // Mise à jour de la metadata sur la Checkout Session
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const newMetadata = {
      ...session.metadata,
      order_status: status
    };
    if (tracking_number) newMetadata.tracking_number = tracking_number;

    await stripe.checkout.sessions.update(sessionId, { metadata: newMetadata });

    // Envoi d'un événement à Klaviyo correspondant au statut
    // Map du statut -> nom d'événement Klaviyo (tu peux adapter les noms)
    const statusEventNameMap = {
      preparation: 'Order Prepared',
      prepared: 'Order Prepared',
      shipped: 'Order Shipped',
      expédie: 'Order Shipped',
      delivered: 'Order Delivered',
      delivered_fr: 'Order Delivered'
    };
    const eventName = statusEventNameMap[status] || `Order ${status}`;

    // If email not provided, try to get from session
    const customerEmail = email || (session.customer_details ? session.customer_details.email : session.customer_email);

    await sendEventToKlaviyo(eventName, customerEmail, {
      order_id: newMetadata.order_id || order_id,
      status,
      tracking_number,
      amount_total: session.amount_total
    });

    return res.json({ ok: true, sessionId, status });
  } catch (err) {
    console.error('Erreur update-order-status:', err);
    return res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur démarré sur le port ${PORT}`));

/* --- Ton pingSelf / self-ping si tu veux (laisse ou supprime) --- */
const https = require('https');
const SERVER_URL = process.env.SELF_PING_URL || 'https://burban-stripe-service.onrender.com';
function pingSelf() {
  https.get(SERVER_URL, (res) => {
    console.log(`Ping effectué. Statut: ${res.statusCode}`);
  }).on('error', (err) => {
    console.error('Erreur ping :', err.message);
  });
}
setInterval(pingSelf, 180000);
pingSelf();
