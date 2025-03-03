/* script.js */

// Affiche la photo en grand
function openPhoto(src) {
  const overlay = document.getElementById('overlay');
  const overlayPhoto = document.getElementById('overlay-photo');
  overlayPhoto.src = src;
  overlay.style.display = 'flex';
}

function closePhoto() {
  const overlay = document.getElementById('overlay');
  overlay.style.display = 'none';
}

// Animation pour les menus déroulants
function toggleAccordion(id) {
  const content = document.getElementById(id);
  const arrow = content.previousElementSibling.querySelector('.arrow');
  if (content.style.display === 'block') {
    content.style.display = 'none';
    arrow.classList.remove('open');
  } else {
    content.style.display = 'block';
    arrow.classList.add('open');
  }
}

// Sélection d'une taille et affichage du bouton "Add to Cart"
function selectSize(element) {
  const sizeOptions = document.querySelectorAll('.size-option');
  sizeOptions.forEach(option => option.classList.remove('selected'));
  element.classList.add('selected');
  // Cache le message d'erreur s'il était affiché
  document.getElementById('errorMessage').style.display = 'none';
  // Affiche le bouton "Add to Cart"
  document.getElementById('addToCartBtn').style.display = 'inline-block';
}

// Récupère les articles du panier en utilisant la clé "cartItems"
function getCartItems() {
  return JSON.parse(localStorage.getItem('cartItems')) || [];
}

function addToCart() {
  const selectedSizeElement = document.querySelector('.size-option.selected');
  if (!selectedSizeElement) {
    document.getElementById('errorMessage').style.display = 'block';
    return;
  }

  // Récupération des infos du produit depuis l'élément #product-info
  const productInfo = document.getElementById('product-info');
  const product = {
    id: productInfo.getAttribute('data-id'),
    name: productInfo.getAttribute('data-name'),
    price: parseFloat(productInfo.getAttribute('data-price')),
    image: productInfo.getAttribute('data-image'),
    size: selectedSizeElement.textContent.trim(),
    quantity: 1
  };

  // Récupération et mise à jour du panier dans le localStorage (clé "cartItems")
  let cart = JSON.parse(localStorage.getItem('cartItems')) || [];
  cart.push(product);
  localStorage.setItem('cartItems', JSON.stringify(cart));
  alert("Product added to cart!");
}

// Fonction pour mettre à jour l'affichage de la barre de prix (si applicable)
function updatePriceDisplay(value) {
  document.getElementById("price-value").innerText = value + "€";
}

// Exemple de fonctions pour filtrer les produits (si utilisées ailleurs)
function filterProducts() {
  const selectedCategories = Array.from(document.querySelectorAll(".filter-category input:checked")).map(checkbox => checkbox.value);
  const selectedColors = Array.from(document.querySelectorAll(".filter-color input:checked")).map(checkbox => checkbox.value);
  const maxPrice = parseFloat(document.getElementById("price-range").value);

  const products = document.querySelectorAll(".product-card");
  let visibleCount = 0;

  products.forEach(product => {
    const category = product.getAttribute("data-category");
    const colors = product.getAttribute("data-color").split(" ");
    const price = parseFloat(product.getAttribute("data-price"));

    const matchCategory = selectedCategories.length === 0 || selectedCategories.includes(category);
    const matchColor = selectedColors.length === 0 || selectedColors.some(color => colors.includes(color));
    const matchPrice = price <= maxPrice;

    if (matchCategory && matchColor && matchPrice) {
      product.style.display = "block";
      visibleCount++;
    } else {
      product.style.display = "none";
    }
  });

  if (visibleCount === 0) {
    alert("No products match the selected filters.");
  }
}

// Réinitialise tous les filtres
function resetFilters() {
  document.querySelectorAll(".filter-checkbox").forEach(checkbox => checkbox.checked = false);
  const priceRange = document.getElementById("price-range");
  priceRange.value = priceRange.max;
  updatePriceDisplay(priceRange.value);
  filterProducts();
}

// Fonction pour créer un effet de ripple sur un bouton
function createRipple(event) {
  const button = event.currentTarget;
  const circle = document.createElement("span");
  const diameter = Math.max(button.clientWidth, button.clientHeight);
  const radius = diameter / 2;

  circle.style.width = circle.style.height = `${diameter}px`;
  circle.style.left = `${event.clientX - button.offsetLeft - radius}px`;
  circle.style.top = `${event.clientY - button.offsetTop - radius}px`;

  button.appendChild(circle);
  setTimeout(() => circle.remove(), 600);
}

// Fonction pour basculer l'affichage des filtres
function toggleFilterMenu() {
  const filterToggleButton = document.getElementById("filter-toggle-button");
  const filterPanel = document.getElementById("filter-panel");
  if (filterPanel.classList.contains("active")) {
    filterPanel.classList.remove("active");
    filterToggleButton.textContent = "Filters";
  } else {
    filterPanel.classList.add("active");
    filterToggleButton.textContent = "Close Filters";
  }
}

// Fonctions pour ouvrir les guides de tailles
function openSizeGuideProduit1() {
  window.open('https://drive.google.com/file/d/1ASewdOGzIbSo6-WVxrrR6-RKkoqxb4L-/view?usp=sharing', '_blank');
}

function openSizeGuideProduit2() {
  window.open('https://drive.google.com/file/d/1rRCmdNWZyFbp311Yg43dBe3_iHsCDmwl/view?usp=sharing', '_blank');
}

function openSizeGuideProduit3() {
  window.open('https://f1151672-10ea-4ccb-a39b-d728ac0d70ec.filesusr.com/ugd/703728_a6053be8b0e04c84bfd3c39cf3e2d17e.pdf', '_blank');
}

function openSizeGuideProduit5() {
  window.open('https://drive.google.com/file/d/1a9aX411v5tZ5yjnYtZet3c4e44Mr9Uwd/view?usp=sharing', '_blank');
}

function openSizeGuideProduit6() {
  window.open('https://drive.google.com/file/d/1Q6TtYJMhPrSLlrLe0w6-InbCdSuntDbR/view?usp=sharing', '_blank');
}

// Gestion du carousel d'images
const images = document.querySelector('.carousel-images');
const dots = document.querySelectorAll('.dot');
if (dots) {
  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      images.style.transform = `translateX(-${index * 100}%)`;
      dots.forEach(d => d.classList.remove('active'));
      dot.classList.add('active');
    });
  });
}

function closeWindow() {
  window.close();
}

// (Optionnel) Exemple de listener pour un bouton checkout dans ce script
document.getElementById('checkout-button') && document.getElementById('checkout-button').addEventListener('click', async function () {
  try {
      const response = await fetch('https://burban-stripe-service.onrender.com/create-checkout-session', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({ items: getCartItems() }), // Récupère les articles du panier
      });

      const session = await response.json();

      if (session.url) {
          window.location.href = session.url; // Redirige vers Stripe Checkout
      } else {
          console.error("Erreur : URL de paiement manquante", session);
      }
  } catch (error) {
      console.error("Erreur lors du paiement :", error);
  }
});
