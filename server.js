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
 * Calcule le coût de livraison pour un article, en fonction de sa catégorie, de sa quantité et de la région.
 * Méthode standard utilisée lorsque tous les articles appartiennent à la même catégorie.
 * @param {Object} item - L'article du panier (doit contenir name et quantity)
 * @param {string} region - La région de livraison (en minuscule)
 * @returns {number} Le coût en centimes.
 */
function getShippingCost(item, region) {
  const category = getCategory(item);
  const rates = shippingRates[category][region] || shippingRates[category]["worldwide"];
  const uniqueCost = rates.unique;
  const additionalCost = rates.additional;
  const cost = uniqueCost + (item.quantity - 1) * additionalCost;
  return Math.round(cost * 100);
}

/**
 * Calcule le coût total d'expédition pour une liste d'articles, en tenant compte
 * des règles spécifiques pour les produits de catégories différentes.
 * 
 * Si tous les articles sont de la même catégorie, la formule habituelle est utilisée.
 * Si plusieurs catégories sont présentes, le coût de livraison sera :
 *    - Le tarif unique le plus élevé parmi les catégories pour un article.
 *    - Le tarif supplémentaire de chaque catégorie pour les autres articles.
 *
 * @param {Array} items - Liste des articles du panier.
 * @param {string} region - La région de livraison (en minuscule).
 * @returns {number} Le coût total en centimes.
 */
function getCombinedShippingCost(items, region) {
  // Regrouper les articles par catégorie et cumuler les quantités
  const groups = {};
  items.forEach(item => {
    const category = getCategory(item);
    if (!groups[category]) {
      groups[category] = 0;
    }
    groups[category] += item.quantity;
  });

  const categories = Object.keys(groups);
  let totalCost = 0;
  
  // Si tous les articles appartiennent à une seule catégorie, utiliser la méthode standard
  if (categories.length === 1) {
    const category = categories[0];
    const rates = shippingRates[category][region] || shippingRates[category]["worldwide"];
    totalCost = rates.unique + (groups[category] - 1) * rates.additional;
  } else {
    // Plusieurs catégories : déterminer le tarif unique le plus élevé
    let maxUnique = 0;
    let maxCategory = null;
    categories.forEach(category => {
      const rates = shippingRates[category][region] || shippingRates[category]["worldwide"];
      if (rates.unique > maxUnique) {
        maxUnique = rates.unique;
        maxCategory = category;
      }
    });
    // Pour la catégorie qui offre le tarif unique maximum, on compte un tarif unique
    // et pour le reste de ses articles, le tarif additionnel
    if (maxCategory) {
      const rates = shippingRates[maxCategory][region] || shippingRates[maxCategory]["worldwide"];
      totalCost += rates.unique + (groups[maxCategory] - 1) * rates.additional;
    }
    // Pour les autres catégories, on applique le tarif additionnel pour chacun des articles
    categories.forEach(category => {
      if (category !== maxCategory) {
        const rates = shippingRates[category][region] || shippingRates[category]["worldwide"];
        totalCost += groups[category] * rates.additional;
      }
    });
  }
  
  return Math.round(totalCost * 100);
}

// Mapping des codes pays vers nos régions
const countryToRegion = {
  us: 'us',
  ca: 'canada',
  gb: 'uk',
  uk: 'uk',
  jp: 'japan',
  au: 'australia',
  br: 'brazil'
};

// Liste de codes pays européens (en minuscule)
const euCountries = [
  'at','be','bg','cy','cz','dk','ee','fi','fr','de','gr','hr','hu',
  'ie','it','lv','lt','lu','mt','nl','pl','pt','ro','sk','si','es','se'
];

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
    
    // Création des line_items pour les produits avec application de la taxe
    const productLineItems = items.map(item => ({
      price_data: {
        currency: 'eur',
        product_data: {
          name: item.name,
          description: "Taille : " + item.size,
          images: [item.image],
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
      tax_rates: [process.env.TAX_RATE_ID] // Application de la TVA à 20%
    }));

    // Calcul global des frais de livraison pour tous les articles en fonction de la région détectée
    const shippingTotal = getCombinedShippingCost(items, region);

    // Création du line_item pour les frais de livraison (si applicable) avec application de la taxe
    let lineItems = productLineItems;
    if (shippingTotal > 0) {
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: { name: "Frais de Livraison" },
          unit_amount: shippingTotal,
        },
        quantity: 1,
        tax_rates: [process.env.TAX_RATE_ID]
      });
    }

    // Préparation des coupons (discounts) en fonction du voucher envoyé
    let discounts = [];
    if (voucher && voucher.voucherValue) {
      if (voucher.voucherValue === "5") {
        discounts.push({ coupon: process.env.COUPON_5 });
      } else if (voucher.voucherValue === "10") {
        discounts.push({ coupon: process.env.COUPON_10 });
      } else if (voucher.voucherValue === "20") {
        discounts.push({ coupon: process.env.COUPON_20 });
      } else if (voucher.voucherValue === "30") {
        discounts.push({ coupon: process.env.COUPON_30 });
      }
    }

    // Création de la session Checkout (sans default_tax_rates, les taxes sont appliquées par line_item)
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      billing_address_collection: 'required',
      shipping_address_collection: {
        allowed_countries: [ 
          'US','CA','AC','AD','AE','AF','AG','AI','AL','AM','AO','AQ','AR','AT','AU','AW','AX','AZ','BA','BB','BD','BE','BF','BG','BH','BI','BJ','BL','BM','BN','BO','BQ','BR','BS','BT','BV','BW','BY','BZ','CD','CF','CG','CH','CI','CK','CL','CM','CN','CO','CR','CV','CW','CY','CZ','DE','DJ','DK','DM','DO','DZ','EC','EE','EG','EH','ER','ES','ET','FI','FJ','FK','FO','FR','GA','GB','GD','GE','GF','GG','GH','GI','GL','GM','GN','GP','GQ','GR','GS','GT','GU','GW','GY','HK','HN','HR','HT','HU','ID','IE','IL','IM','IN','IO','IQ','IS','IT','JE','JM','JO','JP','KE','KG','KH','KI','KM','KN','KR','KW','KY','KZ','LA','LB','LC','LI','LK','LR','LS','LT','LU','LV','LY','MA','MC','MD','ME','MF','MG','MK','ML','MM','MN','MO','MQ','MR','MS','MT','MU','MV','MW','MX','MY','MZ','NA','NC','NE','NG','NI','NL','NO','NP','NR','NU','NZ','OM','PA','PE','PF','PG','PH','PK','PL','PM','PN','PR','PS','PT','PY','QA','RE','RO','RS','RU','RW','SA','SB','SC','SD','SE','SG','SH','SI','SJ','SK','SL','SM','SN','SO','SR','SS','ST','SV','SX','SZ','TA','TC','TD','TF','TG','TH','TJ','TK','TL','TM','TN','TO','TR','TT','TV','TW','TZ','UA','UG','UY','UZ','VA','VC','VE','VG','VN','VU','WF','WS','XK','YE','YT','ZA','ZM','ZW','ZZ'
        ],
      },
      line_items: lineItems,
      discounts: discounts,
      allow_promotion_codes: true,
      mode: 'payment',
      success_url: 'https://burbanofficial.com/public/success.html',
      cancel_url: 'https://burbanofficial.com/public/cancel.html'
    });
    
    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error("Erreur:", error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur démarré sur le port ${PORT}`));

// Code pour garder le serveur actif en se pinguant régulièrement
const https = require('https'); // Utilisation du module https pour les requêtes sécurisées
const SERVER_URL = 'https://burban-stripe-service.onrender.com'; // Remplacez par l'URL publique de votre app

function pingSelf() {
  https.get(SERVER_URL, (res) => {
    console.log(`Ping effectué avec succès. Statut: ${res.statusCode}`);
  }).on('error', (err) => {
    console.error('Erreur lors du ping :', err.message);
  });
}

// Ping toutes les 3 minutes (180000 millisecondes)
setInterval(pingSelf, 180000);

// Ping initial au démarrage
pingSelf();