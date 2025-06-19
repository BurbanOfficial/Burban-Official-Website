const express = require('express');
const app = express();
const path = require('path');
const cors = require('cors');
const geoip = require('geoip-lite');
// La clé Stripe doit être définie dans Render via une variable d'environnement (STRIPE_SECRET_KEY)
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Route de test pour GeoIP (facultative)
app.get('/geoip', (req, res) => {
  const xForwardedFor = req.headers['x-forwarded-for'];
  const ip = xForwardedFor ? xForwardedFor.split(',')[0].trim() : req.connection.remoteAddress;
  const geo = geoip.lookup(ip);
  res.json({ ip, geo });
});

/**
 * Configuration des tarifs d'expédition par catégorie et par région.
 * Les régions acceptées (en minuscule) : "us", "europe", "uk", "efta", "canada",
 * "australia", "japan", "brazil" et "worldwide".
 */
const shippingRates = {
  category1: { // T-shirts, débardeurs, T-shirts manches 3/4, t-shirts manches longues, polos, crop-tops
    us:        { unique: 4.49, additional: 2.10 },
    europe:    { unique: 4.29, additional: 1.25 },
    uk:        { unique: 4.19, additional: 1.25 },
    efta:      { unique: 8.99, additional: 1.00 },
    canada:    { unique: 7.69, additional: 1.70 },
    australia: { unique: 6.19, additional: 1.15 },
    japan:     { unique: 3.99, additional: 1.25 },
    brazil:    { unique: 4.09, additional: 2.25 },
    worldwide: { unique: 10.59, additional: 5.30 }
  },
  category2: { // Sweats à capuche, sweats, pulls, vestes, pantalons de sport et de survêtement
    us:        { unique: 8.09, additional: 2.20 },
    europe:    { unique: 6.29, additional: 2.00 },
    uk:        { unique: 5.99, additional: 2.00 },
    efta:      { unique: 9.99, additional: 2.00 },
    canada:    { unique: 9.49, additional: 2.05 },
    australia: { unique: 9.79, additional: 1.80 },
    japan:     { unique: 5.99, additional: 2.00 },
    brazil:    { unique: 5.39, additional: 2.70 },
    worldwide: { unique: 6.29, additional: 2.00 }
  },
  category3: { // Troisième grille tarifaire (par défaut)
    us:        { unique: 9.79, additional: 4.90 },
    europe:    { unique: 10.19, additional: 5.10 },
    uk:        { unique: 9.79, additional: 4.90 },
    efta:      { unique: 15.79, additional: 8.35 },
    canada:    { unique: 9.79, additional: 4.90 },
    australia: { unique: 9.79, additional: 4.90 },
    japan:     { unique: 9.79, additional: 4.90 },
    worldwide: { unique: 12.49, additional: 5.80 }
  },
  category4: { // Hoodies, sweatshirts, jackets, pants, joggers
    us:        { unique: 7.09, additional: 2.20 },
    europe:    { unique: 5.99, additional: 2.00 },
    uk:        { unique: 5.99, additional: 2.00 },
    efta:      { unique: 9.99, additional: 2.00 },
    canada:    { unique: 8.19, additional: 2.05 },
    australia: { unique: 9.79, additional: 1.80 },
    japan:     { unique: 5.99, additional: 2.00 },
    brazil:    { unique: 5.39, additional: 2.70 },
    worldwide: { unique: 14.99, additional: 7.05 }
  },
  category5: { // Coupe-vent all over, pantalons de survêtement all over, pyjama all over
    us:        { unique: 7.09, additional: 7.09 },
    europe:    { unique: 7.99, additional: 7.99 },
    uk:        { unique: 7.99, additional: 7.99 },
    efta:      { unique: 7.99, additional: 7.99 },
    canada:    { unique: 7.09, additional: 7.09 },
    australia: { unique: 7.09, additional: 7.09 },
    japan:     { unique: 7.09, additional: 7.09 },
    worldwide: { unique: 7.99, additional: 7.99 }
  },
  category6: { // Casquettes, casquettes de baseball, casquettes snapback, casquettes en maille, bonnets, bobs, visières, bonnets all over
    us:        { unique: 3.59, additional: 1.80 },
    europe:    { unique: 3.99, additional: 1.25 },
    uk:        { unique: 3.69, additional: 1.25 },
    efta:      { unique: 8.99, additional: 1.00 },
    canada:    { unique: 6.09, additional: 1.70 },
    australia: { unique: 6.19, additional: 1.15 },
    japan:     { unique: 3.99, additional: 1.25 },
    brazil:    { unique: 4.09, additional: 2.25 },
    worldwide: { unique: 10.59, additional: 5.30 }
  }
};

/**
 * Détermine la catégorie d'un article en fonction de son nom.
 *  - Catégorie 1 : t-shirt, tshirt, débardeur, polo, crop-top
 *  - Catégorie 2 : sweat à capuche, pull, veste, pantalon de sport, pantalon de survêtement
 *  - Catégorie 4 : hoodie, sweatshirt, jacket, pants, joggers
 *  - Catégorie 5 : coupe-vent, pyjama
 *  - Catégorie 6 : casquette, bonnet, bob, visière
 *  - Par défaut : Catégorie 3
 * 
 * @param {Object} item - L'article (doit contenir au moins une propriété name)
 * @returns {string} La clé de catégorie ("category1", "category2", etc.)
 */
function getCategory(item) {
  const name = item.name.toLowerCase();
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
  return "category3"; // Par défaut
}

/**
 * Calcule le coût total d'expédition pour une liste d'articles.
 */
function getCombinedShippingCost(items, region) {
  const groups = {};
  items.forEach(item => {
    const cat = getCategory(item);
    groups[cat] = (groups[cat] || 0) + item.quantity;
  });

  const cats = Object.keys(groups);
  let total = 0;

  if (cats.length === 1) {
    const rates = shippingRates[cats[0]][region] || shippingRates[cats[0]].worldwide;
    total = rates.unique + (groups[cats[0]] - 1) * rates.additional;
  } else {
    let maxUnique = 0, maxCat = null;
    cats.forEach(cat => {
      const rates = shippingRates[cat][region] || shippingRates[cat].worldwide;
      if (rates.unique > maxUnique) {
        maxUnique = rates.unique;
        maxCat = cat;
      }
    });
    if (maxCat) {
      const rates = shippingRates[maxCat][region] || shippingRates[maxCat].worldwide;
      total += rates.unique + (groups[maxCat] - 1) * rates.additional;
    }
    cats.forEach(cat => {
      if (cat !== maxCat) {
        const rates = shippingRates[cat][region] || shippingRates[cat].worldwide;
        total += groups[cat] * rates.additional;
      }
    });
  }

  return Math.round(total * 100);
}

// Mapping des codes pays vers nos régions
const countryToRegion = { us:'us', ca:'canada', gb:'uk', uk:'uk', jp:'japan', au:'australia', br:'brazil' };
const euCountries = ['at','be','bg','cy','cz','dk','ee','fi','fr','de','gr','hr','hu','ie','it','lv','lt','lu','mt','nl','pl','pt','ro','sk','si','es','se'];

app.post('/create-checkout-session', async (req, res) => {
  try {
    const { items, voucher } = req.body;
    if (!items?.length) return res.status(400).json({ error: "Aucun article dans le panier." });

    // Détection région via GeoIP
    const xff = req.headers['x-forwarded-for'];
    const ip = xff ? xff.split(',')[0].trim() : req.connection.remoteAddress;
    const geo = geoip.lookup(ip);
    let region = 'worldwide';
    if (geo?.country) {
      const cc = geo.country.toLowerCase();
      if (countryToRegion[cc]) region = countryToRegion[cc];
      else if (euCountries.includes(cc)) region = 'europe';
    }

    // Ligne produits
    const productLineItems = items.map(item => ({
      price_data: {
        currency: 'eur',
        product_data: { name: item.name, description: "Size : " + item.size, images: [item.image] },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
      tax_rates: [process.env.TAX_RATE_ID]
    }));

    // Calcul total produits
    const totalProducts = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const totalInCents  = Math.round(totalProducts * 100);

    // Frais de port ou gratuité
    let shippingLine;
    if (totalInCents < 5000) {
      const shippingTotal = getCombinedShippingCost(items, region);
      shippingLine = {
        price_data: { currency: 'eur', product_data: { name: "Frais de port" }, unit_amount: shippingTotal },
        quantity: 1,
        tax_rates: [process.env.TAX_RATE_ID]
      };
    } else {
      shippingLine = {
        price_data: { currency: 'eur', product_data: { name: "Livraison gratuite à partir de 50 €" }, unit_amount: 0 },
        quantity: 1,
        tax_rates: [process.env.TAX_RATE_ID]
      };
    }

    const lineItems = [...productLineItems, shippingLine];

    // Coupons
    let discounts = [];
    if (voucher?.voucherValue) {
      const map = { "5":process.env.COUPON_5, "10":process.env.COUPON_10, "20":process.env.COUPON_20, "30":process.env.COUPON_30 };
      if (map[voucher.voucherValue]) discounts.push({ coupon: map[voucher.voucherValue] });
    }

    // Création session Checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card','link','revolut_pay','bancontact','blik','eps','ideal','billie','klarna'],
      billing_address_collection: 'required',
      shipping_address_collection: { allowed_countries: Object.keys(countryToRegion).map(c=>c.toUpperCase()).concat(euCountries.map(c=>c.toUpperCase())) },
      line_items: lineItems,
      ...(discounts.length ? { discounts } : { allow_promotion_codes: true }),
      mode: 'payment',
      success_url: 'https://burbanofficial.com/public/success.html',
      cancel_url:  'https://burbanofficial.com/public/cancel.html',
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error("Erreur:", error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur démarré sur le port ${PORT}`));

// Ping pour garder le serveur actif
const https = require('https');
const SERVER_URL = 'https://burban-stripe-service.onrender.com';
function pingSelf() {
  https.get(SERVER_URL, res => console.log(`Ping réussi: ${res.statusCode}`))
       .on('error', err => console.error('Ping erreur:', err.message));
}
setInterval(pingSelf, 180000);
pingSelf();
