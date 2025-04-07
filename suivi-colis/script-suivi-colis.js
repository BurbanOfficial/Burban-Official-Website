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

// Forcer la saisie en majuscules en temps réel (en plus du CSS)
document.getElementById('order-input').addEventListener('input', function() {
  this.value = this.value.toUpperCase();
});

// Écoute du clic sur le bouton "Suivre"
document.getElementById('track-btn').addEventListener('click', async function() {
  const orderInput = document.getElementById('order-input').value.trim();
  const errorMessageEl = document.getElementById('error-message');
  errorMessageEl.style.display = 'none';
  
  if (orderInput === '') {
    displayError("Veuillez entrer un NUMÉRO DE COMMANDE.");
    return;
  }
  
  try {
    const ordersRef = db.collection('orders');
    const querySnapshot = await ordersRef.where('orderNumber', '==', orderInput).get();
    
    if (querySnapshot.empty) {
      displayError("Commande non trouvée. Veuillez vérifier le NUMÉRO.");
      return;
    }
    
    let orderData;
    querySnapshot.forEach(doc => {
      orderData = doc.data();
    });
    
    const progressStep = orderData.step || 0;
    updateProgress(progressStep, orderData);
    
  } catch (error) {
    console.error("Erreur lors de la récupération de la commande :", error);
    displayError("Une erreur est survenue. Veuillez réessayer plus tard.");
  }
});

/**
 * Met à jour l'affichage de la barre de progression et affiche les dates associées à chaque étape,
 * ainsi que l'estimation de livraison.
 * @param {number} step - L'étape atteinte (entre 1 et 5)
 * @param {object} orderData - Les données de la commande récupérées depuis Firestore.
 */
function updateProgress(step, orderData) {
  document.getElementById('error-message').style.display = 'none';
  const progressContainer = document.getElementById('tracking-progress-container');
  progressContainer.style.display = 'block';
  
  const steps = document.querySelectorAll('.step');
  steps.forEach(s => {
    const stepNum = parseInt(s.getAttribute('data-step'));
    if (stepNum <= step) {
      s.classList.add('active');
    } else {
      s.classList.remove('active');
    }
  });

  for (let i = 1; i <= 5; i++) {
    const dateElem = document.getElementById(`step${i}-date`);
    const field = `step${i}Date`;
    if (orderData[field]) {
      dateElem.textContent = formatDate(orderData[field]);
    } else {
      dateElem.textContent = '';
    }
  }

  const deliveryEstimateSection = document.getElementById('delivery-estimate-section');
  deliveryEstimateSection.style.display = 'block';
  const deliveryEstimateElem = document.getElementById('delivery-estimate');
  if (orderData.estimatedDelivery) {
    deliveryEstimateElem.textContent = formatDate(orderData.estimatedDelivery);
  } else {
    deliveryEstimateElem.textContent = 'Non disponible';
  }

  // Affichage du bouton de suivi transporteur à l'étape 4 ou plus
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
}

/**
 * Affiche un message d'erreur élégant.
 * @param {string} message - Le message d'erreur à afficher.
 */
function displayError(message) {
  const errorMessageEl = document.getElementById('error-message');
  errorMessageEl.textContent = message;
  errorMessageEl.style.display = 'block';
  document.getElementById('tracking-progress-container').style.display = 'none';
  document.getElementById('delivery-estimate-section').style.display = 'none';
}

/**
 * Formate un timestamp (Firestore ou Date) en une chaîne lisible en français.
 * @param {object|Date|string} timestamp - Un Firestore Timestamp, un objet Date ou une chaîne.
 * @returns {string} La date formatée, par exemple "15 mars 2023".
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
 * Génère l'URL de suivi selon le transporteur et le numéro.
 * @param {string} carrier - Le nom du transporteur.
 * @param {string} trackingNumber - Le numéro de suivi.
 * @returns {string|null} L'URL de suivi ou null si inconnu.
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
