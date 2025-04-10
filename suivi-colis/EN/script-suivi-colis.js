// Configuration Firebase – REMPLACE ces valeurs par celles de ton projet
const firebaseConfig = {
  apiKey: "AIzaSyBUS7vhnedR6z2bsZ4uMagnOh23WXVWf3M",
  authDomain: "burban-suivi-colis.firebaseapp.com",
  projectId: "burban-suivi-colis",
  storageBucket: "burban-suivi-colis.firebasestorage.app",
  messagingSenderId: "921458979454",
  appId: "1:921458979454:web:8a887ac603c31b1c34de2f",
  measurementId: "G-RTQER5MW7S"
};

// Initialisation de Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Objet de correspondance pour traduire directement le code ISO du pays en anglais
const countryNames = {
  "AF": "Afghanistan",
  "AX": "Åland Islands",
  "AL": "Albania",
  "DZ": "Algeria",
  "AS": "American Samoa",
  "AD": "Andorra",
  "AO": "Angola",
  "AI": "Anguilla",
  "AQ": "Antarctica",
  "AG": "Antigua and Barbuda",
  "AR": "Argentina",
  "AM": "Armenia",
  "AW": "Aruba",
  "AU": "Australia",
  "AT": "Austria",
  "AZ": "Azerbaijan",
  "BS": "Bahamas",
  "BH": "Bahrain",
  "BD": "Bangladesh",
  "BB": "Barbados",
  "BY": "Belarus",
  "BE": "Belgium",
  "BZ": "Belize",
  "BJ": "Benin",
  "BM": "Bermuda",
  "BT": "Bhutan",
  "BO": "Bolivia (Plurinational State of)",
  "BQ": "Bonaire, Sint Eustatius and Saba",
  "BA": "Bosnia and Herzegovina",
  "BW": "Botswana",
  "BV": "Bouvet Island",
  "BR": "Brazil",
  "IO": "British Indian Ocean Territory",
  "BN": "Brunei Darussalam",
  "BG": "Bulgaria",
  "BF": "Burkina Faso",
  "BI": "Burundi",
  "CV": "Cabo Verde",
  "KH": "Cambodia",
  "CM": "Cameroon",
  "CA": "Canada",
  "KY": "Cayman Islands",
  "CF": "Central African Republic",
  "TD": "Chad",
  "CL": "Chile",
  "CN": "China",
  "CX": "Christmas Island",
  "CC": "Cocos (Keeling) Islands",
  "CO": "Colombia",
  "KM": "Comoros",
  "CG": "Congo",
  "CD": "Congo (Democratic Republic of the)",
  "CK": "Cook Islands",
  "CR": "Costa Rica",
  "CI": "Côte d'Ivoire",
  "HR": "Croatia",
  "CU": "Cuba",
  "CW": "Curaçao",
  "CY": "Cyprus",
  "CZ": "Czechia",
  "DK": "Denmark",
  "DJ": "Djibouti",
  "DM": "Dominica",
  "DO": "Dominican Republic",
  "EC": "Ecuador",
  "EG": "Egypt",
  "SV": "El Salvador",
  "GQ": "Equatorial Guinea",
  "ER": "Eritrea",
  "EE": "Estonia",
  "SZ": "Eswatini",
  "ET": "Ethiopia",
  "FK": "Falkland Islands (Malvinas)",
  "FO": "Faroe Islands",
  "FJ": "Fiji",
  "FI": "Finland",
  "FR": "France",
  "GF": "French Guiana",
  "PF": "French Polynesia",
  "TF": "French Southern Territories",
  "GA": "Gabon",
  "GM": "Gambia",
  "GE": "Georgia",
  "DE": "Germany",
  "GH": "Ghana",
  "GI": "Gibraltar",
  "GR": "Greece",
  "GL": "Greenland",
  "GD": "Grenada",
  "GP": "Guadeloupe",
  "GU": "Guam",
  "GT": "Guatemala",
  "GG": "Guernsey",
  "GN": "Guinea",
  "GW": "Guinea-Bissau",
  "GY": "Guyana",
  "HT": "Haiti",
  "HM": "Heard Island and McDonald Islands",
  "VA": "Holy See",
  "HN": "Honduras",
  "HK": "Hong Kong",
  "HU": "Hungary",
  "IS": "Iceland",
  "IN": "India",
  "ID": "Indonesia",
  "IR": "Iran (Islamic Republic of)",
  "IQ": "Iraq",
  "IE": "Ireland",
  "IM": "Isle of Man",
  "IL": "Israel",
  "IT": "Italy",
  "JM": "Jamaica",
  "JP": "Japan",
  "JE": "Jersey",
  "JO": "Jordan",
  "KZ": "Kazakhstan",
  "KE": "Kenya",
  "KI": "Kiribati",
  "KP": "Korea (Democratic People's Republic of)",
  "KR": "Korea (Republic of)",
  "KW": "Kuwait",
  "KG": "Kyrgyzstan",
  "LA": "Lao People's Democratic Republic",
  "LV": "Latvia",
  "LB": "Lebanon",
  "LS": "Lesotho",
  "LR": "Liberia",
  "LY": "Libya",
  "LI": "Liechtenstein",
  "LT": "Lithuania",
  "LU": "Luxembourg",
  "MO": "Macao",
  "MG": "Madagascar",
  "MW": "Malawi",
  "MY": "Malaysia",
  "MV": "Maldives",
  "ML": "Mali",
  "MT": "Malta",
  "MH": "Marshall Islands",
  "MQ": "Martinique",
  "MR": "Mauritania",
  "MU": "Mauritius",
  "YT": "Mayotte",
  "MX": "Mexico",
  "FM": "Micronesia (Federated States of)",
  "MD": "Moldova (Republic of)",
  "MC": "Monaco",
  "MN": "Mongolia",
  "ME": "Montenegro",
  "MS": "Montserrat",
  "MA": "Morocco",
  "MZ": "Mozambique",
  "MM": "Myanmar",
  "NA": "Namibia",
  "NR": "Nauru",
  "NP": "Nepal",
  "NL": "Netherlands",
  "NC": "New Caledonia",
  "NZ": "New Zealand",
  "NI": "Nicaragua",
  "NE": "Niger",
  "NG": "Nigeria",
  "NU": "Niue",
  "NF": "Norfolk Island",
  "MK": "North Macedonia",
  "MP": "Northern Mariana Islands",
  "NO": "Norway",
  "OM": "Oman",
  "PK": "Pakistan",
  "PW": "Palau",
  "PS": "Palestine, State of",
  "PA": "Panama",
  "PG": "Papua New Guinea",
  "PY": "Paraguay",
  "PE": "Peru",
  "PH": "Philippines",
  "PN": "Pitcairn",
  "PL": "Poland",
  "PT": "Portugal",
  "PR": "Puerto Rico",
  "QA": "Qatar",
  "RE": "Réunion",
  "RO": "Romania",
  "RU": "Russian Federation",
  "RW": "Rwanda",
  "BL": "Saint Barthélemy",
  "SH": "Saint Helena, Ascension and Tristan da Cunha",
  "KN": "Saint Kitts and Nevis",
  "LC": "Saint Lucia",
  "MF": "Saint Martin (French part)",
  "PM": "Saint Pierre and Miquelon",
  "VC": "Saint Vincent and the Grenadines",
  "WS": "Samoa",
  "SM": "San Marino",
  "ST": "Sao Tome and Principe",
  "SA": "Saudi Arabia",
  "SN": "Senegal",
  "RS": "Serbia",
  "SC": "Seychelles",
  "SL": "Sierra Leone",
  "SG": "Singapore",
  "SX": "Sint Maarten (Dutch part)",
  "SK": "Slovakia",
  "SI": "Slovenia",
  "SB": "Solomon Islands",
  "SO": "Somalia",
  "ZA": "South Africa",
  "GS": "South Georgia and the South Sandwich Islands",
  "SS": "South Sudan",
  "ES": "Spain",
  "LK": "Sri Lanka",
  "SD": "Sudan",
  "SR": "Suriname",
  "SJ": "Svalbard and Jan Mayen",
  "SE": "Sweden",
  "CH": "Switzerland",
  "SY": "Syrian Arab Republic",
  "TW": "Taiwan, Province of China",
  "TJ": "Tajikistan",
  "TZ": "Tanzania, United Republic of",
  "TH": "Thailand",
  "TL": "Timor-Leste",
  "TG": "Togo",
  "TK": "Tokelau",
  "TO": "Tonga",
  "TT": "Trinidad and Tobago",
  "TN": "Tunisia",
  "TR": "Turkey",
  "TM": "Turkmenistan",
  "TC": "Turks and Caicos Islands",
  "TV": "Tuvalu",
  "UG": "Uganda",
  "UA": "Ukraine",
  "AE": "United Arab Emirates",
  "GB": "United Kingdom",
  "US": "United States of America",
  "UM": "United States Minor Outlying Islands",
  "UY": "Uruguay",
  "UZ": "Uzbekistan",
  "VU": "Vanuatu",
  "VE": "Venezuela (Bolivarian Republic of)",
  "VN": "Viet Nam",
  "VG": "Virgin Islands (British)",
  "VI": "Virgin Islands (U.S.)",
  "WF": "Wallis and Futuna",
  "EH": "Western Sahara",
  "YE": "Yemen",
  "ZM": "Zambia",
  "ZW": "Zimbabwe"
};

// Forcer la saisie en majuscules en temps réel (en plus du CSS)
document.getElementById('order-input').addEventListener('input', function() {
  this.value = this.value.toUpperCase();
});

// Écoute du clic sur le bouton "Follow"
document.getElementById('track-btn').addEventListener('click', async function() {
  const orderInput = document.getElementById('order-input').value.trim();
  const errorMessageEl = document.getElementById('error-message');
  errorMessageEl.style.display = 'none';
  
  if (orderInput === '') {
    displayError("Please enter an ORDER NUMBER.");
    return;
  }
  
  try {
    const ordersRef = db.collection('orders');
    const querySnapshot = await ordersRef.where('orderNumber', '==', orderInput).get();
    
    if (querySnapshot.empty) {
      displayError("Order not found. Please check the NUMBER.");
      return;
    }
    
    let orderData;
    querySnapshot.forEach(doc => {
      orderData = doc.data();
    });
    
    const progressStep = orderData.step || 0;
    updateProgress(progressStep, orderData);
    
  } catch (error) {
    console.error("Error retrieving the order:", error);
    displayError("An error occurred. Please try again later.");
  }
});

/**
 * Met à jour l'affichage de la barre de progression et affiche :
 * - Les dates associées à chaque étape,
 * - L'estimation de livraison (possiblement avec deux dates),
 * - Les informations de suivi transporteur,
 * - Et la ou les origines de la commande.
 * @param {number} step - L'étape atteinte (entre 1 et 5)
 * @param {object} orderData - Les données de la commande récupérées depuis Firestore.
 */
function updateProgress(step, orderData) {
  // Masquer les messages d'erreur
  document.getElementById('error-message').style.display = 'none';
  const progressContainer = document.getElementById('tracking-progress-container');
  progressContainer.style.display = 'block';
  
  // Mise à jour de la barre de progression
  const steps = document.querySelectorAll('.step');
  steps.forEach(s => {
    const stepNum = parseInt(s.getAttribute('data-step'));
    if (stepNum <= step) {
      s.classList.add('active');
    } else {
      s.classList.remove('active');
    }
  });

  // Mise à jour des dates pour chaque étape
  for (let i = 1; i <= 5; i++) {
    const dateElem = document.getElementById(`step${i}-date`);
    const field = `step${i}Date`;
    if (orderData[field]) {
      dateElem.textContent = formatDate(orderData[field]);
    } else {
      dateElem.textContent = '';
    }
  }

  // Gestion de l'estimation de livraison avec deux dates (si disponibles)
  const deliveryEstimateSection = document.getElementById('delivery-estimate-section');
  deliveryEstimateSection.style.display = 'block';
  const deliveryEstimateElem = document.getElementById('delivery-estimate');
  if (orderData.estimatedDeliveryStart && orderData.estimatedDeliveryEnd) {
    const startDate = formatDate(orderData.estimatedDeliveryStart);
    const endDate = formatDate(orderData.estimatedDeliveryEnd);
    deliveryEstimateElem.textContent = `${startDate} - ${endDate}`;
  } else if (orderData.estimatedDelivery) {
    deliveryEstimateElem.textContent = formatDate(orderData.estimatedDelivery);
  } else {
    deliveryEstimateElem.textContent = 'Non disponible';
  }

  // Affichage du bouton de suivi transporteur (étape 4 ou plus)
  const carrierBtn = document.getElementById('carrier-btn');
  const carrier = orderData.carrier || "";
  const trackingNumber = orderData.trackingNumber || "";
  const trackingUrl = getCarrierTrackingUrl(carrier, trackingNumber);
  if (step >= 4 && trackingUrl) {
    carrierBtn.style.display = "inline-block";
    carrierBtn.onclick = () => window.open(trackingUrl, "_blank");
  } else {
    carrierBtn.style.display = "none";
  }
  
  // Affichage des origines (potentiellement multiples, chacune alignée horizontalement)
  displayOrigin(orderData);
}

/**
 * Affiche dynamiquement la ou les origines de la commande.
 * Pour la première origine, les champs sont "originName" et "originFlagUrl".
 * Pour les suivantes, ils seront nommés "originName2", "originFlagUrl2", etc.
 * Chaque origine est affichée dans un conteneur en flex (alignement horizontal du drapeau et du nom)
 * Le nom est traduit en anglais directement via l'objet "countryNames".
 * @param {object} orderData - Les données de la commande.
 */
function displayOrigin(orderData) {
  const orderOriginSection = document.getElementById('order-origin');
  const orderOriginContainer = document.getElementById('order-origin-container');
  
  // Vider le conteneur pour éviter de conserver d'anciennes données
  orderOriginContainer.innerHTML = '';
  
  let i = 1;
  let keyName, keyFlag;
  while (true) {
    if (i === 1) {
      keyName = 'originName';
      keyFlag = 'originFlagUrl';
    } else {
      keyName = 'originName' + i;
      keyFlag = 'originFlagUrl' + i;
    }
    
    if (orderData[keyName] && orderData[keyFlag]) {
      // Création d'un conteneur pour chaque origine, en affichage flex
      const originDiv = document.createElement('div');
      originDiv.classList.add('origin-container');
      originDiv.style.display = 'flex';
      originDiv.style.alignItems = 'center';
      originDiv.style.marginBottom = '8px'; // Pour espacer les origines verticalement
      
      // Création de l'image du drapeau avec bords arrondis
      const flagImage = document.createElement('img');
      flagImage.src = orderData[keyFlag];
      flagImage.classList.add('flag-icon');
      flagImage.alt = orderData[keyName];
      flagImage.style.marginRight = '8px'; // Espace entre le drapeau et le nom
      
      // Traduction directe du code ISO en nom du pays
      const code = orderData[keyName].toUpperCase();
      const translatedName = countryNames[code] || orderData[keyName];
      const originText = document.createElement('span');
      originText.textContent = translatedName;
      
      originDiv.appendChild(flagImage);
      originDiv.appendChild(originText);
      orderOriginContainer.appendChild(originDiv);
      
      i++;
    } else {
      break;
    }
  }
  
  // Afficher ou masquer la section selon la présence d'origines
  if (orderOriginContainer.innerHTML !== '') {
    orderOriginSection.style.display = 'block';
  } else {
    orderOriginSection.style.display = 'none';
  }
}

/**
 * Affiche un message d'erreur élégant.
 * @param {string} message - Le message d'erreur à afficher.
 */
function displayError(message) {
  console.log("Affichage de l'erreur :", message);
  const errorMessageEl = document.getElementById('error-message');
  errorMessageEl.textContent = message;
  errorMessageEl.style.display = 'block';
  document.getElementById('tracking-progress-container').style.display = 'none';
  document.getElementById('delivery-estimate-section').style.display = 'none';
}

/**
 * Formate un timestamp (Firestore ou Date) en une chaîne lisible en anglais.
 * @param {object|Date|string} timestamp - Un Firestore Timestamp, un objet Date ou une chaîne.
 * @returns {string} La date formatée, par exemple "March 15, 2023".
 */
function formatDate(timestamp) {
  let date;
  if (timestamp.toDate) {
    date = timestamp.toDate();
  } else {
    date = new Date(timestamp);
  }
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
}

/**
 * Génère l'URL de suivi selon le transporteur et le numéro de suivi.
 * @param {string} carrier - Le nom du transporteur.
 * @param {string} trackingNumber - Le numéro de suivi.
 * @returns {string|null} L'URL de suivi ou null si le transporteur est inconnu.
 */
function getCarrierTrackingUrl(carrier, trackingNumber) {
  const upperCarrier = carrier.toLowerCase();
  switch (upperCarrier) {
    case "la poste":
      return `https://www.laposte.fr/outils/suivre-vos-envois?code=${trackingNumber}`;
    case "ups":
      return `https://www.ups.com/track?loc=fr_FR&tracknum=${trackingNumber}`;
    case "dhl":
      return `https://www.dhl.com/fr-fr/home/suivi.html?tracking-id=${trackingNumber}`;
    case "colissimo":
      return `https://www.laposte.fr/outil/suivi-colissimo?code=${trackingNumber}`;
    case "chronopost":
      return `https://www.chronopost.fr/tracking-no/${trackingNumber}`;
    case "myorders":
      return `https://myorders.co/fr/tracking/${trackingNumber}`;
    default:
      return null;
  }
}
