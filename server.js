// server.js
const express = require('express');
const app = express();
const path = require('path');
const cors = require('cors');
const geoip = require('geoip-lite');
// La clé Stripe doit être définie dans Render via une variable d'environnement (STRIPE_SECRET_KEY)
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || '');

app.use(cors());
// NOTE: on garde express.json() pour la plupart des routes
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- Route de test GeoIP (facultative) ---
app.get('/geoip', (req, res) => {
  const xForwardedFor = req.headers['x-forwarded-for'];
  const ip = xForwardedFor ? xForwardedFor.split(',')[0].trim() : req.connection.remoteAddress;
  const geo = geoip.lookup(ip);
  res.json({ ip, geo });
});

/**
 * Configuration des tarifs d'expédition par catégorie et par région.
 * (Conserve ta structure d'origine)
 */
const shippingRates = {
  category1: { us:  { unique: 4.49, additional: 2.10 }, europe: { unique: 4.29, additional: 1.25 }, uk: { unique: 4.19, additional: 1.25 }, efta: { unique: 8.99, additional: 1.00 }, canada: { unique: 7.69, additional: 1.70 }, australia: { unique: 6.19, additional: 1.15 }, japan: { unique: 3.99, additional: 1.25 }, brazil: { unique: 4.09, additional: 2.25 }, worldwide: { unique: 10.59, additional: 5.30 } },
  category2: { us:  { unique: 8.09, additional: 2.20 }, europe: { unique: 6.29, additional: 2.00 }, uk: { unique: 5.99, additional: 2.00 }, efta: { unique: 9.99, additional: 2.00 }, canada: { unique: 9.49, additional: 2.05 }, australia: { unique: 9.79, additional: 1.80 }, japan: { unique: 5.99, additional: 2.00 }, brazil: { unique: 5.39, additional: 2.70 }, worldwide: { unique: 6.29, additional: 2.00 } },
  category3: { us:  { unique: 9.79, additional: 4.90 }, europe: { unique: 10.19, additional: 5.10 }, uk: { unique: 9.79, additional: 4.90 }, efta: { unique: 15.79, additional: 8.35 }, canada: { unique: 9.79, additional: 4.90 }, australia: { unique: 9.79, additional: 4.90 }, japan: { unique: 9.79, additional: 4.90 }, worldwide: { unique: 12.49, additional: 5.80 } },
  category4: { us:  { unique: 7.09, additional: 2.20 }, europe: { unique: 5.99, additional: 2.00 }, uk: { unique: 5.99, additional: 2.00 }, efta: { unique: 9.99, additional: 2.00 }, canada: { unique: 8.19, additional: 2.05 }, australia: { unique: 9.79, additional: 1.80 }, japan: { unique: 5.99, additional: 2.00 }, brazil: { unique: 5.39, additional: 2.70 }, worldwide: { unique: 14.99, additional: 7.05 } },
  category5: { us:  { unique: 7.09, additional: 7.09 }, europe: { unique: 7.99, additional: 7.99 }, uk: { unique: 7.99, additional: 7.99 }, efta: { unique: 7.99, additional: 7.99 }, canada: { unique: 7.09, additional: 7.09 }, australia: { unique: 7.09, additional: 7.09 }, japan: { unique: 7.09, additional: 7.09 }, worldwide: { unique: 7.99, additional: 7.99 } },
  category6: { us:  { unique: 3.59, additional: 1.80 }, europe: { unique: 3.99, additional: 1.25 }, uk: { unique: 3.69, additional: 1.25 }, efta: { unique: 8.99, additional: 1.00 }, canada: { unique: 6.09, additional: 1.70 }, australia: { unique: 6.19, additional: 1.15 }, japan: { unique: 3.99, additional: 1.25 }, brazil: { unique: 4.09, additional: 2.25 }, worldwide: { unique: 10.59, additional: 5.30 } }
};

function getCategory(item) {
  const name = (item.name || '').toLowerCase();
  if (name.includes("t-shirt") || name.includes("tshirt") || name.includes("débardeur") || name.includes("polo") || name.includes("crop-top")) return "category1";
  if (name.includes("sweat") || name.includes("crewneck sweatshirt") || name.includes("pull") || name.includes("veste") || name.includes("pantalon de sport") || name.includes("pantalon de survêtement")) return "category2";
  if (name.includes("hoodie") || name.includes("sweatshirt") || name.includes("jacket") || name.includes("pants") || name.includes("joggers")) return "category4";
  if (name.includes("coupe-vent") || name.includes("pyjama")) return "category5";
  if (name.includes("casquette") || name.includes("cap") || name.includes("bonnet") || name.includes("beanie") || name.includes("bob") || name.includes("visière")) return "category6";
  return "category3";
}

function getShippingCost(item, region) {
  const category = getCategory(item);
  const rates = (shippingRates[category] && (shippingRates[category][region] || shippingRates[category]["worldwide"])) || shippingRates['category3']['worldwide'];
  const uniqueCost = rates.unique;
  const additionalCost = rates.additional;
  const cost = uniqueCost + (Math.max(0, item.quantity - 1)) * additionalCost;
  return Math.round(cost * 100); // en centimes
}

function getCombinedShippingCost(items, region) {
  const groups = {};
  items.forEach(item => {
    const category = getCategory(item);
    groups[category] = (groups[category] || 0) + (item.quantity || 1);
  });

  const categories = Object.keys(groups);
  let totalCost = 0;

  if (categories.length === 1) {
    const category = categories[0];
    const rates = shippingRates[category][region] || shippingRates[category]['worldwide'];
    totalCost = rates.unique + (groups[category] - 1) * rates.additional;
  } else {
    let maxUnique = 0;
    let maxCategory = null;
    categories.forEach(category => {
      const rates = shippingRates[category][region] || shippingRates[category]['worldwide'];
      if (rates.unique > maxUnique) {
        maxUnique = rates.unique;
        maxCategory = category;
      }
    });
    if (maxCategory) {
      const rates = shippingRates[maxCategory][region] || shippingRates[maxCategory]['worldwide'];
      totalCost += rates.unique + (groups[maxCategory] - 1) * rates.additional;
    }
    categories.forEach(category => {
      if (category !== maxCategory) {
        const rates = shippingRates[category][region] || shippingRates[category]['worldwide'];
        totalCost += groups[category] * rates.additional;
      }
    });
  }

  return Math.round(totalCost * 100);
}

// Mapping des pays
const countryToRegion = { us: 'us', ca: 'canada', gb: 'uk', uk: 'uk', jp: 'japan', au: 'australia', br: 'brazil' };
// Liste pays EU
const euCountries = ['at','be','bg','cy','cz','dk','ee','fi','fr','de','gr','hr','hu','ie','it','lv','lt','lu','mt','nl','pl','pt','ro','sk','si','es','se'];

// IMPORTANT: Webhook route (raw body) — doit être accessible pour que tu reçoives les events Stripe.
// Défini STRIPE_WEBHOOK_SECRET dans tes env (obligatoire si tu veux vérifier la signature)
app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.warn('STRIPE_WEBHOOK_SECRET non défini: webhook non vérifié (recommande de définir la variable ENV).');
  }

  let event;
  try {
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } else {
      // En dev sans secret, on parse quand même (non sécurisé)
      event = JSON.parse(req.body.toString());
    }
  } catch (err) {
    console.error('⚠️ Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Gère les événements importants
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      console.log('Checkout session completed:', session.id);
      // TODO: enregistre la commande dans ta BDD, envoie email, etc.
      break;
    case 'payment_intent.succeeded':
      console.log('PaymentIntent succeeded:', event.data.object.id);
      break;
    case 'payment_intent.payment_failed':
      console.log('Payment failed:', event.data.object.last_payment_error);
      break;
    default:
      // console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

// Route principale: création d'une session Checkout
app.post('/create-checkout-session', async (req, res) => {
  try {
    const { items, voucher } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Aucun article dans le panier." });
    }

    // Détection région via GeoIP
    const xForwardedFor = req.headers['x-forwarded-for'];
    const ip = xForwardedFor ? xForwardedFor.split(',')[0].trim() : req.connection.remoteAddress;
    const geo = geoip.lookup(ip);
    let region = 'worldwide';
    if (geo && geo.country) {
      const countryCode = geo.country.toLowerCase();
      console.log("Détection GeoIP :", countryCode);
      if (countryToRegion[countryCode]) region = countryToRegion[countryCode];
      else if (euCountries.includes(countryCode)) region = 'europe';
    }

    // Création des line_items pour les produits
    const productLineItems = items.map(item => ({
      price_data: {
        currency: 'eur',
        product_data: {
          name: item.name,
          description: "Size : " + (item.size || ''),
          images: item.image ? [item.image] : [],
        },
        unit_amount: Math.round((item.price || 0) * 100),
      },
      quantity: item.quantity || 1,
      tax_rates: process.env.TAX_RATE_ID ? [process.env.TAX_RATE_ID] : []
    }));

    // Total des articles (en euros) pour règle de livraison gratuite
    const itemsTotal = items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);

    // Calcul shipping global (en centimes)
    let shippingTotal = getCombinedShippingCost(items, region);
    if (itemsTotal >= 50) shippingTotal = 0; // livraison gratuite dès 50€

    // Ajout line item frais de livraison si applicable
    let lineItems = [...productLineItems];
    if (shippingTotal > 0) {
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: { name: "Shipping Cost" },
          unit_amount: shippingTotal,
        },
        quantity: 1,
        tax_rates: process.env.TAX_RATE_ID ? [process.env.TAX_RATE_ID] : []
      });
    }

    // Gestion des vouchers / coupons (correction des bugs)
    let discounts = [];
    if (voucher && voucher.voucherValue) {
      const v = String(voucher.voucherValue).trim();
      // Les variables d'env doivent contenir l'ID du coupon Stripe (ex: "co_...")
      if (['5','10','20','30'].includes(v)) {
        const envMap = { '5': 'COUPON_5', '10': 'COUPON_10', '20': 'COUPON_20', '30': 'COUPON_30' };
        const envName = envMap[v];
        if (process.env[envName]) discounts.push({ coupon: process.env[envName] });
        else console.warn(`Variable d'environnement ${envName} introuvable.`);
      } else if (v.toUpperCase() === 'WELCOME10') {
        if (process.env.WELCOME10) discounts.push({ coupon: process.env.WELCOME10 });
        else console.warn('ENV WELCOME10 absent — vérifie la variable d\'environnement.');
      } else {
        // Si tu veux chercher dynamiquement un coupon par code, tu peux appeler l'API Stripe ici pour récupérer l'ID du coupon.
        console.log('Voucher non reconnu localement:', v);
      }
    }

    // Création de la session Checkout
    const sessionParams = {
      payment_method_types: ['card', 'link', 'revolut_pay', 'amazon_pay', 'billie', 'klarna'],
      billing_address_collection: 'required',
      shipping_address_collection: {
        allowed_countries: [ 'US','CA','AC','AD','AE','AG','AI','AL','AM','AO','AQ','AR','AT','AU','AW','AZ','BA','BB','BD','BE','BF','BG','BH','BI','BJ','BM','BN','BO','BR','BS','BV','BW','BZ','CD','CF','CG','CH','CI','CK','CL','CM','CN','CO','CR','CV','CW','CY','CZ','DE','DJ','DK','DM','DO','DZ','EE','EG','EH','ER','ES','ET','FI','FJ','FK','FO','FR','GA','GB','GD','GE','GF','GG','GH','GI','GL','GM','GN','GP','GQ','GR','GS','GT','GW','GY','HK','HN','HR','HT','HU','ID','IE','IL','IM','IN','IO','IQ','IS','IT','JE','JM','JO','JP','KE','KG','KH','KI','KM','KN','KR','KW','KY','KZ','LB','LC','LI','LK','LR','LS','LT','LU','LV','MA','MC','MD','ME','MF','MG','MK','ML','MM','MO','MQ','MR','MS','MT','MU','MV','MW','MX','MY','MZ','NA','NC','NE','NG','NI','NL','NO','NP','NR','NU','NZ','OM','PA','PE','PF','PG','PH','PK','PL','PM','PN','PS','PT','PY','QA','RE','RO','RS','RW','SA','SB','SC','SD','SE','SG','SH','SI','SJ','SK','SL','SM','SN','SO','SR','ST','SV','SZ','TA','TF','TG','TH','TK','TL','TN','TO','TR','TT','TV','TW','TZ','UA','UG','UY','UZ','VA','VC','VE','VG','VN','VU','WF','XK','YT','ZA','ZM','ZW','ZZ' ],
      },
      line_items: lineItems,
      mode: 'payment',
      success_url: 'https://burbanofficial.com/public/success.html?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://burbanofficial.com/public/cancel.html'
    };

    // Si discounts trouvés, on les injecte, sinon on permet les promotion_codes
    if (discounts.length > 0) sessionParams.discounts = discounts;
    else sessionParams.allow_promotion_codes = true;

    // --- AJOUT pour 3D Secure (demander 3DS si disponible) ---
    // On place l'option dans payment_intent_data -> payment_method_options -> card -> request_three_d_secure = 'any'
    // Cela demande 3DS quand la banque le supporte ; Stripe l'appliquera automatiquement si nécessaire.
    sessionParams.payment_intent_data = {
      // setup_future_usage: 'off_session', // décommenter si tu veux enregistrer la carte pour paiements off-session
      payment_method_options: {
        card: {
          request_three_d_secure: 'any'
        }
      }
    };

    // Création de la session via l'API Stripe
    const session = await stripe.checkout.sessions.create(sessionParams);

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error("Erreur lors de la création de la session:", error);
    res.status(500).json({ error: error.message || 'Erreur interne' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur démarré sur le port ${PORT}`));

// Code pingSelf (si tu veux garder)
const https = require('https');
const SERVER_URL = process.env.SERVER_URL || 'https://burban-stripe-service.onrender.com';
function pingSelf() {
  https.get(SERVER_URL, (res) => {
    console.log(`Ping: statut ${res.statusCode}`);
  }).on('error', (err) => {
    console.error('Erreur ping:', err.message);
  });
}
setInterval(pingSelf, 180000);
pingSelf();
