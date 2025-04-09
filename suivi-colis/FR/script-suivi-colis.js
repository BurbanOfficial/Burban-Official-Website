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
  "AX": "Îles Åland",
  "AL": "Albanie",
  "DZ": "Algérie",
  "AS": "Samoa américaines",
  "AD": "Andorre",
  "AO": "Angola",
  "AI": "Anguilla",
  "AQ": "Antarctique",
  "AG": "Antigua-et-Barbuda",
  "AR": "Argentine",
  "AM": "Arménie",
  "AW": "Aruba",
  "AU": "Australie",
  "AT": "Autriche",
  "AZ": "Azerbaïdjan",
  "BS": "Bahamas",
  "BH": "Bahreïn",
  "BD": "Bangladesh",
  "BB": "Barbade",
  "BY": "Biélorussie",
  "BE": "Belgique",
  "BZ": "Belize",
  "BJ": "Bénin",
  "BM": "Bermudes",
  "BT": "Bhoutan",
  "BO": "Bolivie (État plurinational de)",
  "BQ": "Bonaire, Saint-Eustache et Saba",
  "BA": "Bosnie-Herzégovine",
  "BW": "Botswana",
  "BV": "Île Bouvet",
  "BR": "Brésil",
  "IO": "Territoire britannique de l'océan Indien",
  "BN": "Brunéi",
  "BG": "Bulgarie",
  "BF": "Burkina Faso",
  "BI": "Burundi",
  "CV": "Cap-Vert",
  "KH": "Cambodge",
  "CM": "Cameroun",
  "CA": "Canada",
  "KY": "Îles Caïmans",
  "CF": "République centrafricaine",
  "TD": "Tchad",
  "CL": "Chili",
  "CN": "Chine",
  "CX": "Île Christmas",
  "CC": "Îles Cocos (Keeling)",
  "CO": "Colombie",
  "KM": "Comores",
  "CG": "Congo",
  "CD": "République démocratique du Congo",
  "CK": "Îles Cook",
  "CR": "Costa Rica",
  "CI": "Côte d'Ivoire",
  "HR": "Croatie",
  "CU": "Cuba",
  "CW": "Curaçao",
  "CY": "Chypre",
  "CZ": "République tchèque",
  "DK": "Danemark",
  "DJ": "Djibouti",
  "DM": "Dominique",
  "DO": "République dominicaine",
  "EC": "Équateur",
  "EG": "Égypte",
  "SV": "Salvador",
  "GQ": "Guinée équatoriale",
  "ER": "Érythrée",
  "EE": "Estonie",
  "SZ": "Eswatini",
  "ET": "Éthiopie",
  "FK": "Îles Falkland (Malouines)",
  "FO": "Îles Féroé",
  "FJ": "Fidji",
  "FI": "Finlande",
  "FR": "France",
  "GF": "Guyane française",
  "PF": "Polynésie française",
  "TF": "Terres australes et antarctiques françaises",
  "GA": "Gabon",
  "GM": "Gambie",
  "GE": "Géorgie",
  "DE": "Allemagne",
  "GH": "Ghana",
  "GI": "Gibraltar",
  "GR": "Grèce",
  "GL": "Groenland",
  "GD": "Grenade",
  "GP": "Guadeloupe",
  "GU": "Guam",
  "GT": "Guatemala",
  "GG": "Guernesey",
  "GN": "Guinée",
  "GW": "Guinée-Bissau",
  "GY": "Guyana",
  "HT": "Haïti",
  "HM": "Île Heard et îles McDonald",
  "VA": "Saint-Siège",
  "HN": "Honduras",
  "HK": "Hong Kong",
  "HU": "Hongrie",
  "IS": "Islande",
  "IN": "Inde",
  "ID": "Indonésie",
  "IR": "Iran",
  "IQ": "Irak",
  "IE": "Irlande",
  "IM": "Île de Man",
  "IL": "Israël",
  "IT": "Italie",
  "JM": "Jamaïque",
  "JP": "Japon",
  "JE": "Jersey",
  "JO": "Jordanie",
  "KZ": "Kazakhstan",
  "KE": "Kenya",
  "KI": "Kiribati",
  "KP": "Corée du Nord",
  "KR": "Corée du Sud",
  "KW": "Koweït",
  "KG": "Kirghizistan",
  "LA": "Laos",
  "LV": "Lettonie",
  "LB": "Liban",
  "LS": "Lesotho",
  "LR": "Libéria",
  "LY": "Libye",
  "LI": "Liechtenstein",
  "LT": "Lituanie",
  "LU": "Luxembourg",
  "MO": "Macao",
  "MG": "Madagascar",
  "MW": "Malawi",
  "MY": "Malaisie",
  "MV": "Maldives",
  "ML": "Mali",
  "MT": "Malte",
  "MH": "Îles Marshall",
  "MQ": "Martinique",
  "MR": "Mauritanie",
  "MU": "Maurice",
  "YT": "Mayotte",
  "MX": "Mexique",
  "FM": "États fédérés de Micronésie",
  "MD": "Moldavie",
  "MC": "Monaco",
  "MN": "Mongolie",
  "ME": "Monténégro",
  "MS": "Montserrat",
  "MA": "Maroc",
  "MZ": "Mozambique",
  "MM": "Myanmar",
  "NA": "Namibie",
  "NR": "Nauru",
  "NP": "Népal",
  "NL": "Pays-Bas",
  "NC": "Nouvelle-Calédonie",
  "NZ": "Nouvelle-Zélande",
  "NI": "Nicaragua",
  "NE": "Niger",
  "NG": "Nigéria",
  "NU": "Niue",
  "NF": "Île Norfolk",
  "MK": "Macédoine du Nord",
  "MP": "Îles Mariannes du Nord",
  "NO": "Norvège",
  "OM": "Oman",
  "PK": "Pakistan",
  "PW": "Palaos",
  "PS": "Palestine",
  "PA": "Panama",
  "PG": "Papouasie-Nouvelle-Guinée",
  "PY": "Paraguay",
  "PE": "Pérou",
  "PH": "Philippines",
  "PN": "Îles Pitcairn",
  "PL": "Pologne",
  "PT": "Portugal",
  "PR": "Porto Rico",
  "QA": "Qatar",
  "RE": "La Réunion",
  "RO": "Roumanie",
  "RU": "Russie",
  "RW": "Rwanda",
  "BL": "Saint-Barthélemy",
  "SH": "Sainte-Hélène, Ascension et Tristan da Cunha",
  "KN": "Saint-Christophe-et-Niévès",
  "LC": "Sainte-Lucie",
  "MF": "Saint-Martin (partie française)",
  "PM": "Saint-Pierre-et-Miquelon",
  "VC": "Saint-Vincent-et-les-Grenadines",
  "WS": "Samoa",
  "SM": "Saint-Marin",
  "ST": "Sao Tomé-et-Principe",
  "SA": "Arabie saoudite",
  "SN": "Sénégal",
  "RS": "Serbie",
  "SC": "Seychelles",
  "SL": "Sierra Leone",
  "SG": "Singapour",
  "SX": "Saint-Martin (partie néerlandaise)",
  "SK": "Slovaquie",
  "SI": "Slovénie",
  "SB": "Îles Salomon",
  "SO": "Somalie",
  "ZA": "Afrique du Sud",
  "GS": "Géorgie du Sud et les îles Sandwich du Sud",
  "SS": "Soudan du Sud",
  "ES": "Espagne",
  "LK": "Sri Lanka",
  "SD": "Soudan",
  "SR": "Suriname",
  "SJ": "Svalbard et Jan Mayen",
  "SE": "Suède",
  "CH": "Suisse",
  "SY": "Syrie",
  "TW": "Taïwan",
  "TJ": "Tadjikistan",
  "TZ": "Tanzanie",
  "TH": "Thaïlande",
  "TL": "Timor-Leste",
  "TG": "Togo",
  "TK": "Tokelau",
  "TO": "Tonga",
  "TT": "Trinité-et-Tobago",
  "TN": "Tunisie",
  "TR": "Turquie",
  "TM": "Turkménistan",
  "TC": "Îles Turks-et-Caïques",
  "TV": "Tuvalu",
  "UG": "Ouganda",
  "UA": "Ukraine",
  "AE": "Émirats arabes unis",
  "GB": "Royaume-Uni",
  "US": "États-Unis d'Amérique",
  "UM": "Îles mineures éloignées des États-Unis",
  "UY": "Uruguay",
  "UZ": "Ouzbékistan",
  "VU": "Vanuatu",
  "VE": "Venezuela",
  "VN": "Vietnam",
  "VG": "Îles Vierges britanniques",
  "VI": "Îles Vierges des États-Unis",
  "WF": "Wallis-et-Futuna",
  "EH": "Sahara occidental",
  "YE": "Yémen",
  "ZM": "Zambie",
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
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
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
    default:
      return null;
  }
}
