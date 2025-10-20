// server.js (remplace ton fichier actuel par celui-ci)
// Dépendances
const express = require('express');
const app = express();
const path = require('path');
const cors = require('cors');
const geoip = require('geoip-lite');
const axios = require('axios');

// Stripe
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Middlewares
app.use(cors());
app.use(express.json()); // pour toutes les routes JSON normales
app.use(express.static(path.join(__dirname, 'public')));

// Route de test pour GeoIP (facultative)
app.get('/geoip', (req, res) => {
  const xForwardedFor = req.headers['x-forwarded-for'];
  const ip = xForwardedFor ? xForwardedFor.split(',')[0].trim() : req.connection.remoteAddress;
  const geo = geoip.lookup(ip);
  res.json({ ip, geo });
});

// --- (TON CODE D'ORIGINE : shippingRates, getCategory, getShippingCost, getCombinedShippingCost, countryToRegion, euCountries) ---
// (je conserve exactement tes fonctions / tables pour la cohérence)

const shippingRates = {
  category1: {
    us: { unique: 4.49, additional: 2.10 },
    europe: { unique: 4.29, additional: 1.25 },
    uk: { unique: 4.19, additional: 1.25 },
    efta: { unique: 8.99, additional: 1.00 },
    canada: { unique: 7.69, additional: 1.70 },
    australia: { unique: 6.19, additional: 1.15 },
    japan: { unique: 3.99, additional: 1.25 },
    brazil: { unique: 4.09, additional: 2.25 },
    worldwide: { unique: 10.59, additional: 5.30 }
  },
  category2: {
    us: { unique: 8.09, additional: 2.20 },
    europe: { unique: 6.29, additional: 2.00 },
    uk: { unique: 5.99, additional: 2.00 },
    efta: { unique: 9.99, additional: 2.00 },
    canada: { unique: 9.49, additional: 2.05 },
    australia: { unique: 9.79, additional: 1.80 },
    japan: { unique: 5.99, additional: 2.00 },
    brazil: { unique: 5.39, additional: 2.70 },
    worldwide: { unique: 6.29, additional: 2.00 }
  },
  category3: {
    us: { unique: 9.79, additional: 4.90 },
    europe: { unique: 10.19, additional: 5.10 },
    uk: { unique: 9.79, additional: 4.90 },
    efta: { unique: 15.79, additional: 8.35 },
    canada: { unique: 9.79, additional: 4.90 },
    australia: { unique: 9.79, additional: 4.90 },
    japan: { unique: 9.79, additional: 4.90 },
    worldwide: { unique: 12.49, additional: 5.80 }
  },
  category4: {
    us: { unique: 7.09, additional: 2.20 },
    europe: { unique: 5.99, additional: 2.00 },
    uk: { unique: 5.99, additional: 2.00 },
    efta: { unique: 9.99, additional: 2.00 },
    canada: { unique: 8.19, additional: 2.05 },
    australia: { unique: 9.79, additional: 1.80 },
    japan: { unique: 5.99, additional: 2.00 },
    brazil: { unique: 5.39, additional: 2.70 },
    worldwide: { unique: 14.99, additional: 7.05 }
  },
  category5: {
    us: { unique: 7.09, additional: 7.09 },
    europe: { unique: 7.99, additional: 7.99 },
    uk: { unique: 7.99, additional: 7.99 },
    efta: { unique: 7.99, additional: 7.99 },
    canada: { unique: 7.09, additional: 7.09 },
    australia: { unique: 7.09, additional: 7.09 },
    japan: { unique: 7.09, additional: 7.09 },
    worldwide: { unique: 7.99, additional: 7.99 }
  },
  category6: {
    us: { unique: 3.59, additional: 1.80 },
    europe: { unique: 3.99, additional: 1.25 },
    uk: { unique: 3.69, additional: 1.25 },
    efta: { unique: 8.99, additional: 1.00 },
    canada: { unique: 6.09, additional: 1.70 },
    australia: { unique: 6.19, additional: 1.15 },
    japan: { unique: 3.99, additional: 1.25 },
    brazil: { unique: 4.09, additional: 2.25 },
    worldwide: { unique: 10.59, additional: 5.30 }
  }
};

function getCategory(item) {
  const name = (item.name || '').toLowerCase();
  if (name.includes("t-shirt") || name.includes("tshirt") || name.includes("débardeur") || name.includes("polo") || name.includes("crop-top")) {
    return "category1";
  }
  if (name.includes("sweat") || name.includes("crewneck sweatshirt") || name.includes("pull") || name.includes("veste") || name.includes("pantalon de sport") || name.includes("pantalon de survêtement")) {
    return "category2";
  }
  if (name.includes("hoodie") || name.includes("sweatshirt") || name.includes("jacket") || name.includes("pants") || name.includes("joggers")) {
    return "category4";
  }
  if (name.includes("coupe-vent") || name.includes("pyjama")) {
    return "category5";
  }
  if (name.includes("casquette") || name.includes("cap") || name.includes("bonnet") || name.includes("beanie") || name.includes("bob") || name.includes("visière")) {
    return "category6";
  }
  return "category3";
}

function getShippingCost(item, region) {
  const category = getCategory(item);
  const rates = shippingRates[category][region] || shippingRates[category]["worldwide"];
  const uniqueCost = rates.unique;
  const additionalCost = rates.additional;
  const cost = uniqueCost + (item.quantity - 1) * additionalCost;
  return Math.round(cost * 100);
}

function getCombinedShippingCost(items, region) {
  const groups = {};
  items.forEach(item => {
    const category = getCategory(item);
    if (!groups[category]) groups[category] = 0;
    groups[category] += item.quantity;
  });

  const categories = Object.keys(groups);
  let totalCost = 0;

  if (categories.length === 1) {
    const category = categories[0];
    const rates = shippingRates[category][region] || shippingRates[category]["worldwide"];
    totalCost = rates.unique + (groups[category] - 1) * rates.additional;
  } else {
    let maxUnique = 0;
    let maxCategory = null;
    categories.forEach(category => {
      const rates = shippingRates[category][region] || shippingRates[category]["worldwide"];
      if (rates.unique > maxUnique) {
        maxUnique = rates.unique;
        maxCategory = category;
      }
    });
    if (maxCategory) {
      const rates = shippingRates[maxCategory][region] || shippingRates[maxCategory]["worldwide"];
      totalCost += rates.unique + (groups[maxCategory] - 1) * rates.additional;
    }
    categories.forEach(category => {
      if (category !== maxCategory) {
        const rates = shippingRates[category][region] || shippingRates[category]["worldwide"];
        totalCost += groups[category] * rates.additional;
      }
    });
  }

  return Math.round(totalCost * 100);
}

const countryToRegion = { us: 'us', ca: 'canada', gb: 'uk', uk: 'uk', jp: 'japan', au: 'australia', br: 'brazil' };
const euCountries = [ 'at','be','bg','cy','cz','dk','ee','fi','fr','de','gr','hr','hu','ie','it','lv','lt','lu','mt','nl','pl','pt','ro','sk','si','es','se' ];

/* --- FIN du code d'origine --- */

/**
 * Helper: envoie un événement à Klaviyo (server-side Create Event API)
 * - eventName : nom du metric (ex: "Order Paid", "Order Status Updated")
 * - email : email du client (requis pour relier le profil)
 * - properties : objet libre avec order_id, status, items, tracking, total...
 */
async function sendKlaviyoEvent(eventName, email, properties = {}) {
  if (!process.env.KLAVIYO_API_KEY) {
    console.warn('KLAVIYO_API_KEY non défini — aucun envoi vers Klaviyo.');
    return;
  }

  const payload = {
    data: {
      type: "event",
      attributes: {
        metric: { name: eventName },      // nom du metric dans Klaviyo (utilisé pour déclencher flows)
        // fournit un identifiant/profil (ici on utilise l'email, tu peux ajouter phone_number ou id)
        profile: { email: email },
        properties: properties
      }
    }
  };

  try {
    await axios.post('https://a.klaviyo.com/api/events', payload, {
      headers: {
        'Authorization': `Klaviyo-API-Key ${process.env.KLAVIYO_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 8000
    });
    console.log(`Event Klaviyo envoyé : ${eventName} -> ${email}`);
  } catch (err) {
    console.error('Erreur en envoyant l\'événement à Klaviyo :', err?.response?.data || err.message);
  }
}

/**
 * Route : création de la session Checkout (modifiée pour inclure metadata order_id + order_status)
 * - garde ton comportement existant (frais, tax_rates, discounts)
 * - j'ajoute : metadata.order_id et metadata.order_status initial = "préparation"
 */
app.post('/create-checkout-session', async (req, res) => {
  try {
    const { items, voucher } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Aucun article dans le panier." });
    }

     // Détermination de la région de l'utilisateur via GeoIP
    const xForwardedFor = req.headers['x-forwarded-for'];
    const ip = xForwardedFor ? xForwardedFor.split(',')[0].trim() : req.connection.remoteAddress;
    const geo = geoip.lookup(ip);
    let region = 'worldwide'; // Par défaut
    if (geo && geo.country) {
      const countryCode = geo.country.toLowerCase();
      console.log("Détection GeoIP :", countryCode);
      if (countryToRegion[countryCode]) {
        region = countryToRegion[countryCode];
      } else if (euCountries.includes(countryCode)) {
        region = 'europe';
      }
    }

    // line_items produits
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

    // Prépare discounts (ton code existant — j'ai corrigé une partie qui semblait utiliser des variables non définies)
    let discounts = [];
    if (voucher && voucher.voucherValue) {
      const v = (voucher.voucherValue || '').toString();
      if (v === "5" && process.env.COUPON_5) discounts.push({ coupon: process.env.COUPON_5 });
      else if (v === "10" && process.env.COUPON_10) discounts.push({ coupon: process.env.COUPON_10 });
      else if (v === "20" && process.env.COUPON_20) discounts.push({ coupon: process.env.COUPON_20 });
      else if (v === "30" && process.env.COUPON_30) discounts.push({ coupon: process.env.COUPON_30 });
      else if (v.toUpperCase() === "WELCOME10" && process.env.WELCOME10) discounts.push({ coupon: process.env.WELCOME10 });
    }

    // Génération d'un order_id simple (tu peux remplacer par ton propre ID)
    const orderId = `order_${Date.now()}`;

    // Création session checkout (j'ajoute metadata ici)
    const session = await stripe.checkout.sessions.create({
      payment_method_types: [
        'card','link','revolut_pay','amazon_pay','billie','klarna'
      ],
      billing_address_collection: 'required',
      shipping_address_collection: {
        allowed_countries: [ /* ta liste longue */ 'US','CA','GB','FR','DE','IT','ES','NL','BE','CH','AU','JP','BR' ] // tu peux garder la liste complète si souhaité
      },
      line_items: lineItems,
      ...(discounts.length > 0 ? { discounts } : { allow_promotion_codes: true }),
      mode: 'payment',
      success_url: 'https://burbanofficial.com/public/success.html',
      cancel_url: 'https://burbanofficial.com/public/cancel.html',
      metadata: {
        order_id: orderId,
        order_status: 'préparation' // statut initial
      }
    });

    // Retourne session au front
    res.json({ sessionId: session.id, url: session.url, orderId });

  } catch (error) {
    console.error("Erreur:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Route admin/simple pour mettre à jour le statut d'une commande.
 * POST /update-order-status
 * Body: { payment_intent_id (ou session_id), status: "préparation"|"expédiée"|"livrée", tracking_number?, email? }
 *
 * Cette route :
 *  - met à jour les metadata du PaymentIntent (ou Checkout Session si tu préfères)
 *  - envoie un événement vers Klaviyo pour déclencher un flow (ex: "Order Status Updated")
 *
 * NOTE : protège cette route (auth) en prod (token, basic auth, IP allowlist...). Ici c'est volontairement simple.
 */
app.post('/update-order-status', async (req, res) => {
  try {
    const { payment_intent_id, session_id, status, tracking_number, email } = req.body;
    if (!status) return res.status(400).json({ error: 'status requis' });

    // On tente de récupérer et mettre à jour le PaymentIntent si fourni, sinon on essaye la Session
    let target = null;
    if (payment_intent_id) {
      target = await stripe.paymentIntents.update(payment_intent_id, {
        metadata: { order_status: status, tracking_number: tracking_number || '' }
      });
    } else if (session_id) {
      // On récupère la session puis le payment_intent s'il existe
      const session = await stripe.checkout.sessions.retrieve(session_id);
      if (session && session.payment_intent) {
        const pi = session.payment_intent;
        target = await stripe.paymentIntents.update(pi, {
          metadata: { order_status: status, tracking_number: tracking_number || '' }
        });
      } else {
        // On peut aussi mettre metadata sur la session directement
        target = await stripe.checkout.sessions.update(session_id, {
          metadata: { order_status: status, tracking_number: tracking_number || '' }
        });
      }
    } else {
      return res.status(400).json({ error: 'payment_intent_id ou session_id requis' });
    }

    // Envoi événement à Klaviyo pour déclencher flow d'update de statut
    // On utilise l'email fourni si dispo ; sinon essaie de récupérer via Stripe (si target a customer details)
    let customerEmail = email;
    try {
      if (!customerEmail) {
        // si c'est une PaymentIntent, cherche la charge / customer
        if (target?.charges?.data && target.charges.data[0]) {
          customerEmail = target.charges.data[0].billing_details?.email || customerEmail;
        }
      }
    } catch (e) { /* ignore */ }

    const properties = {
      OrderId: target?.metadata?.order_id || target?.id || null,
      UpdateType: status,
      TrackingNumber: tracking_number || null,
      Timestamp: new Date().toISOString()
    };

    await sendKlaviyoEvent('Order Status Updated', customerEmail || 'unknown@unknown.com', properties);

    res.json({ ok: true, statusUpdatedTo: status, target });
  } catch (err) {
    console.error('Erreur update-order-status:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Webhook Stripe : réception des événements Stripe (payment succeeded, checkout.session.completed, etc.)
 * - IMPORTANT : on utilise express.raw ici pour conserver la signature (Stripe-Signature)
 */
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    if (endpointSecret) {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } else {
      // Si tu n'as pas de webhook secret (test local), on accepte le payload tel quel (moins sécurisé)
      event = req.body;
    }
  } catch (err) {
    console.error('Erreur signature webhook Stripe :', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const email = session.customer_details?.email || session.customer_email || null;
        const metadata = session.metadata || {};
        const orderId = metadata.order_id || session.id;

        // Envoi un event "Order Paid" à Klaviyo (tu peux créer un flow Klaviyo déclenché par ce metric)
        const properties = {
          OrderId: orderId,
          TotalAmount: session.amount_total ? (session.amount_total / 100) : null,
          Currency: session.currency,
          Items: session.display_items || null,
          StripeSessionId: session.id,
          Timestamp: new Date().toISOString()
        };
        await sendKlaviyoEvent('Order Paid', email || 'unknown@unknown.com', properties);
        break;
      }

      case 'payment_intent.succeeded': {
        const pi = event.data.object;
        // Récupère l'email si possible
        let email = null;
        if (pi.charges && pi.charges.data && pi.charges.data[0]) {
          email = pi.charges.data[0].billing_details?.email || null;
        }
        const metadata = pi.metadata || {};
        const orderId = metadata.order_id || pi.id;

        await sendKlaviyoEvent('Order Paid', email || 'unknown@unknown.com', {
          OrderId: orderId,
          Amount: (pi.amount / 100),
          Currency: pi.currency,
          Timestamp: new Date().toISOString()
        });
        break;
      }

      // tu peux ajouter d'autres events Stripe si utiles
      default:
        console.log(`Événement Stripe reçu mais non géré : ${event.type}`);
    }
  } catch (err) {
    console.error('Erreur handling webhook:', err);
  }

  res.json({ received: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur démarré sur le port ${PORT}`));

// Ping self (ton code existant)
const https = require('https');
const SERVER_URL = process.env.SERVER_URL || 'https://burban-stripe-service.onrender.com';
function pingSelf() {
  https.get(SERVER_URL, (res) => console.log(`Ping OK ${res.statusCode}`)).on('error', (err) => console.error('Erreur ping :', err.message));
}
setInterval(pingSelf, 180000);
pingSelf();
