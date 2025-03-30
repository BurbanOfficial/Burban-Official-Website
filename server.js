// server.js
const express = require('express');
const app = express();
const path = require('path');
const cors = require('cors');
const geoip = require('geoip-lite');

app.get('/geoip', (req, res) => {
  // Extraire la première adresse IP de la liste dans x-forwarded-for
  const ip = req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0] : req.connection.remoteAddress;

  const geo = geoip.lookup(ip); // Chercher l'information GeoIP
  res.json({ ip, geo }); // Retourner l'IP et la localisation
});

// La clé Stripe doit être définie dans Render via une variable d'environnement (STRIPE_SECRET_KEY)
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

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
    worldwide: { unique: 6.29, additional: 2.00 } // Valeur par défaut identique à Europe
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
 * La hiérarchie des conditions est la suivante :
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
  if (name.includes("sweat à capuche") || name.includes("pull") || name.includes("veste") || name.includes("pantalon de sport") || name.includes("pantalon de survêtement")) {
    return "category2";
  }
  if (name.includes("hoodie") || name.includes("sweatshirt") || name.includes("jacket") || name.includes("pants") || name.includes("joggers")) {
    return "category4";
  }
  if (name.includes("coupe-vent") || name.includes("pyjama")) {
    return "category5";
  }
  if (name.includes("casquette") || name.includes("bonnet") || name.includes("bob") || name.includes("visière")) {
    return "category6";
  }
  return "category3"; // Par défaut
}

/**
 * Calcule le coût de livraison pour un article, en fonction de sa catégorie, sa quantité et la région.
 * @param {Object} item - L'article du panier (doit contenir name et quantity)
 * @param {string} region - La région de livraison (en minuscule)
 * @returns {number} Le coût en centimes.
 */
function getShippingCost(item, region) {
  const category = getCategory(item);
  // Utiliser les tarifs de la région spécifiée ou "worldwide" par défaut
  const rates = shippingRates[category][region] || shippingRates[category]["worldwide"];
  const uniqueCost = rates.unique;
  const additionalCost = rates.additional;
  const cost = uniqueCost + (item.quantity - 1) * additionalCost;
  return Math.round(cost * 100);
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
    const { items } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Aucun article dans le panier." });
    }
    
    // Détermination de la région de l'utilisateur via GeoIP
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const geo = geoip.lookup(ip);
    let region = 'worldwide'; // Par défaut
    if (geo && geo.country) {
      const countryCode = geo.country.toLowerCase();
      if (countryToRegion[countryCode]) {
        region = countryToRegion[countryCode];
      } else if (euCountries.includes(countryCode)) {
        region = 'europe';
      }
    }
    
    // Création des line_items pour les produits
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
    }));

    // Calcul global des frais de livraison pour tous les articles en fonction de la région détectée
    const shippingTotal = items.reduce((total, item) => total + getShippingCost(item, region), 0);

    // Création du tableau des line_items à envoyer à Stripe
    let lineItems = productLineItems;
    if (shippingTotal > 0) {
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: { name: "Frais de Livraison" },
          unit_amount: shippingTotal,
        },
        quantity: 1,
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      billing_address_collection: 'required',
      shipping_address_collection: {
        allowed_countries: ['US','CA','AC','AD','AE','AF','AG','AI','AL','AM','AO','AQ','AR','AT','AU','AW','AX','AZ','BA','BB','BD','BE','BF','BG','BH','BI','BJ','BL','BM','BN','BO','BQ','BR','BS','BT','BV','BW','BY','BZ','CD','CF','CG','CH','CI','CK','CL','CM','CN','CO','CR','CV','CW','CY','CZ','DE','DJ','DK','DM','DO','DZ','EC','EE','EG','EH','ER','ES','ET','FI','FJ','FK','FO','FR','GA','GB','GD','GE','GF','GG','GH','GI','GL','GM','GN','GP','GQ','GR','GS','GT','GU','GW','GY','HK','HN','HR','HT','HU','ID','IE','IL','IM','IN','IO','IQ','IS','IT','JE','JM','JO','JP','KE','KG','KH','KI','KM','KN','KR','KW','KY','KZ','LA','LB','LC','LI','LK','LR','LS','LT','LU','LV','LY','MA','MC','MD','ME','MF','MG','MK','ML','MM','MN','MO','MQ','MR','MS','MT','MU','MV','MW','MX','MY','MZ','NA','NC','NE','NG','NI','NL','NO','NP','NR','NU','NZ','OM','PA','PE','PF','PG','PH','PK','PL','PM','PN','PR','PS','PT','PY','QA','RE','RO','RS','RU','RW','SA','SB','SC','SD','SE','SG','SH','SI','SJ','SK','SL','SM','SN','SO','SR','SS','ST','SV','SX','SZ','TA','TC','TD','TF','TG','TH','TJ','TK','TL','TM','TN','TO','TR','TT','TV','TW','TZ','UA','UG','UY','UZ','VA','VC','VE','VG','VN','VU','WF','WS','XK','YE','YT','ZA','ZM','ZW','ZZ'],
      },
      line_items: lineItems,
      discounts: [],
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
