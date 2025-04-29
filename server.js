<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>BURBAN | Mon Panier</title>

  <!-- Fonts & Icons -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;500;700&display=swap">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">

  <!-- Global CSS -->
  <link rel="stylesheet" href="https://burbanofficial.github.io/Burban-Website/style.css" />
  <!-- Cart-specific CSS -->
  <link rel="stylesheet" href="https://burbanofficial.github.io/Burban-Website/public/cart.css" />

  <!-- Inline styles from Codage 1 -->
  <style>
    /* Quantity controls */
    .quantity-controls {
      display: flex;
      align-items: center;
      margin-top: 5px;
    }
    .quantity-controls button {
      background: linear-gradient(145deg, #e6e6e6, #ffffff);
      border: 1px solid #ccc;
      padding: 5px 10px;
      margin: 0 5px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.3s ease;
      font-size: 16px;
      font-weight: bold;
      color: #333;
      box-shadow: 3px 3px 6px #d1d1d1, -3px -3px 6px #ffffff;
    }
    .quantity-controls button:hover {
      background: linear-gradient(145deg, #ffffff, #f0f0f0);
      box-shadow: 2px 2px 5px #c5c5c5, -2px -2px 5px #ffffff;
    }
    .quantity-controls input {
      width: 40px;
      text-align: center;
      border: 1px solid #ccc;
      border-radius: 4px;
    }
    .quantity-controls button:active {
      background: #e0e0e0;
      box-shadow: inset 2px 2px 5px #c5c5c5, inset -2px -2px 5px #ffffff;
    }
    /* Remove button */
    .remove-button {
      background: transparent;
      border: none;
      color: #e74c3c;
      font-size: 24px;
      cursor: pointer;
      transition: color 0.3s;
    }
    .remove-button:hover {
      color: #c0392b;
    }
    /* Voucher section */
    #voucher-section {
      margin-top: 20px;
      padding: 15px;
      border: 1px solid #ddd;
      border-radius: 8px;
      background: #f9f9f9;
    }
    #voucher-section h3 {
      margin: 0 0 10px;
      font-size: 18px;
      color: #333;
    }
    /* Loader animation */
    .loader {
      --ballcolor: #f2f2f2;
      --shadow: 0px 0 #ffffff00;
      --shadowcolor: #ffffff00;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      position: relative;
      color: var(--ballcolor);
      animation: shadowRolling 2s linear infinite;
      vertical-align: middle;
      margin: 0 5px;
    }
    @keyframes shadowRolling {
      0% { box-shadow: var(--shadow), var(--shadow), var(--shadow), var(--shadow); }
      12% { box-shadow: 100px 0 var(--ballcolor), var(--shadow), var(--shadow), var(--shadow); }
      25% { box-shadow: 110px 0 var(--ballcolor), 100px 0 var(--ballcolor), var(--shadow), var(--shadow); }
      36% { box-shadow: 120px 0 var(--ballcolor), 110px 0 var(--ballcolor), 100px 0 var(--ballcolor), var(--shadow); }
      50% { box-shadow: 130px 0 var(--ballcolor), 120px 0 var(--ballcolor), 110px 0 var(--ballcolor), 100px 0 var(--ballcolor); }
      62% { box-shadow: 200px 0 var(--shadowcolor), 130px 0 var(--ballcolor), 120px 0 var(--ballcolor), 110px 0 var(--ballcolor); }
      75% { box-shadow: 200px 0 var(--shadowcolor), 200px 0 var(--shadowcolor), 130px 0 var(--ballcolor), 120px 0 var(--ballcolor); }
      87% { box-shadow: 200px 0 var(--shadowcolor), 200px 0 var(--shadowcolor), 200px 0 var(--shadowcolor), 130px 0 var(--ballcolor); }
      100% { box-shadow: 200px 0 var(--shadowcolor), 200px 0 var(--shadowcolor), 200px 0 var(--shadowcolor), 200px 0 var(--shadowcolor); }
    }
    /* Modal styles */
    .modal {
      display: none;
      position: fixed;
      z-index: 1;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0,0,0,0.4);
    }
    .modal-content {
      background-color: #fff;
      margin: 15% auto;
      padding: 20px;
      border-radius: 10px;
      width: 50%;
    }
    .close {
      float: right;
      font-size: 28px;
      cursor: pointer;
    }
  </style>

  <!-- Firebase SDK -->
  <script src="https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/9.22.1/firebase-auth-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore-compat.js"></script>
  <script>
    const firebaseConfig = {
      apiKey: "AIzaSyDb4AOtRT7jGENnLZ2KNwpczaG2Z77G2rc",
      authDomain: "burban-fidelity.firebaseapp.com",
      projectId: "burban-fidelity",
      storageBucket: "burban-fidelity.firebasestorage.app",
      messagingSenderId: "830299174800",
      appId: "1:830299174800:web:f50a4ec419e108f7f16515",
      measurementId: "G-E4QD4PYLM5"
    };
    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();
    const auth = firebase.auth();
  </script>

  <!-- Stripe JS -->
  <script src="https://js.stripe.com/v3/"></script>
</head>
<body>

  <!-- Header (Codage 2) -->
  <header class="header">
    <a href="index.html" class="logo-link">
      <img src="https://i.imgur.com/Kl9kTBg.png" alt="Burban Logo" class="logo-img">
    </a>
    <nav class="nav">
      <a href="index.html" class="nav-item">Accueil</a>
      <a href="shop.html" class="nav-item">Shop</a>
      <a href="about.html" class="nav-item">À propos</a>
      <a href="contact.html" class="nav-item">Contact</a>
    </nav>
    <div class="actions">
      <a href="account.html" class="account-btn" aria-label="Mon compte"><i class="fa-solid fa-user"></i></a>
      <a href="cart.html" class="cart-btn" aria-label="Mon panier"><i class="fa-solid fa-bag-shopping"></i></a>
      <button class="hamburger" aria-label="Ouvrir le menu">
        <span class="bar"></span>
        <span class="bar"></span>
        <span class="bar"></span>
      </button>
    </div>
  </header>

  <!-- Overlay menu mobile -->
  <div class="overlay-menu" id="overlayMenu">
    <button class="close-btn" aria-label="Fermer le menu">&times;</button>
    <ul class="overlay-nav">
      <li><a href="index.html">Accueil</a></li>
      <li><a href="shop.html">Shop</a></li>
      <li><a href="about.html">À propos</a></li>
      <li><a href="contact.html">Contact</a></li>
    </ul>
  </div>

  <!-- Panier -->
  <main class="cart-page">
    <h1>Mon Panier</h1>

    <div id="emptyMessage" class="empty-cart hidden">
      <p>Votre panier est vide.</p>
      <a href="shop.html" class="btn btn-back">Retour à la boutique</a>
    </div>

    <div id="cartContainer" class="cart-container">
      <div id="cart-items" class="cart-items"></div>

      <aside class="cart-summary">
        <h2>Récapitulatif</h2>
        <div class="summary-row">
          <span>Sous-total</span><span id="subTotal">0€</span>
        </div>
        <div class="summary-row">
          <span>Livraison</span><span id="shipping">A déterminer au paiement</span>
        </div>
        <div class="summary-row">
          <span>TVA (20%)</span><span id="tax">0€</span>
        </div>
        <div class="summary-row total">
          <span>Total</span><span id="total">0€</span>
        </div>

        <!-- Section Bons de réduction -->
        <div id="voucher-section">
          <h3>Coupons de réduction disponibles</h3>
          <div id="voucher-options"><p>Chargement...</p></div>
        </div>

        <button id="checkout-btn" class="btn btn-add" onclick="handleCheckout()">
          <span id="checkout-btn-text">Passer à la validation</span>
          <div class="loader" id="loader" style="display:none;"></div>
          <span id="card-icon"><i class="fa-solid fa-credit-card"></i></span>
        </button>
      </aside>
    </div>
  </main>

  <!-- Modal Adresse de livraison -->
  <div id="shippingModal" class="modal">
    <div class="modal-content">
      <span class="close">&times;</span>
      <h2>Adresse de Livraison</h2>
      <form id="shippingForm">
        <label>Nom et Prénom :</label><input type="text" id="fullName" name="fullName" required>
        <label>Adresse :</label><input type="text" id="address" name="address" required>
        <label>Ville :</label><input type="text" id="city" name="city" required>
        <label>Code Postal :</label><input type="text" id="postalCode" name="postalCode" required>
        <label>Pays :</label>
        <select id="country" name="country" required>
          <option value="fr">France</option>
          <option value="us">États-Unis</option>
          <option value="uk">Royaume-Uni</option>
          <option value="ca">Canada</option>
          <option value="de">Allemagne</option>
          <option value="worldwide">Autre</option>
        </select>
        <button type="submit">Continuer vers le paiement</button>
      </form>
    </div>
  </div>

  <!-- Footer (Codage 2) -->
  <footer class="footer">
    <div class="footer-container">
      <div class="footer-brand">
        <img src="https://i.imgur.com/Nup8sfC.png" alt="Burban Logo">
        <p>Plus qu'une marque, une identité.</p>
      </div>
      <div class="footer-links">
        <div>
          <h4>Navigation</h4>
          <a href="index.html">Accueil</a>
          <a href="shop.html">Shop</a>
          <a href="about.html">À propos</a>
          <a href="contact.html">Contact</a>
        </div>
        <div>
          <h4>Assistance</h4>
          <a href="#">FAQ</a>
          <a href="#">Livraison</a>
          <a href="#">Retour</a>
          <a href="#">CGV</a>
        </div>
        <div>
          <h4>Suivez-nous</h4>
          <a href="#">Instagram</a>
          <a href="#">Facebook</a>
          <a href="#">TikTok</a>
        </div>
      </div>
    </div>
    <div class="footer-bottom">
      &copy; 2024 - <span id="year"></span> Burban. Tous Droits Réservés.
    </div>
  </footer>

  <!-- Scripts -->
  <script>
    // --- Chargement et gestion du panier ---
    function loadCart() {
      const container = document.getElementById('cart-items');
      const items = JSON.parse(localStorage.getItem('cartItems')) || [];
      const summary = document.querySelector('.cart-summary');

      // **On vide toujours le conteneur avant de réafficher ou masquer**
      container.innerHTML = '';
      updateTotal();

      if (items.length === 0) {
        document.getElementById('emptyMessage').classList.remove('hidden');
        document.getElementById('cartContainer').classList.add('hidden');
        summary.classList.add('hidden');
        return;
      }
      document.getElementById('emptyMessage').classList.add('hidden');
      document.getElementById('cartContainer').classList.remove('hidden');
      summary.classList.remove('hidden');
      container.innerHTML = '';
      items.forEach((item, i) => {
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
          <img src="${item.image}" alt="${item.name}">
          <div class="item-details">
            <p class="item-title">${item.name}</p>
            <p class="item-size">Taille : ${item.size||'N/A'}</p>
            <p class="item-price">${item.price.toFixed(2)}€</p>
            <div class="quantity-controls">
              <button onclick="updateQuantity(${i},-1)">-</button>
              <input type="number" value="${item.quantity}" min="1" max="10" onchange="changeQuantity(${i},this.value)">
              <button onclick="updateQuantity(${i},1)">+</button>
            </div>
          </div>
          <button class="remove-button" onclick="removeItem(${i})">&times;</button>
        `;
        container.appendChild(div);
      });
      updateTotal();
    }
    function updateQuantity(i,delta){let items=JSON.parse(localStorage.getItem('cartItems'))||[];let q=items[i].quantity+delta;items[i].quantity=q<1?1:q>10?10:q;localStorage.setItem('cartItems',JSON.stringify(items));loadCart();}
    function changeQuantity(i,val){let items=JSON.parse(localStorage.getItem('cartItems'))||[];let q=parseInt(val);items[i].quantity=q<1?1:q>10?10:q;localStorage.setItem('cartItems',JSON.stringify(items));loadCart();}
    function removeItem(i){let items=JSON.parse(localStorage.getItem('cartItems'))||[];items.splice(i,1);localStorage.setItem('cartItems',JSON.stringify(items));loadCart();}

    // --- Bons de réduction ---
    async function getUserPoints(){try{const u=auth.currentUser;if(u){const d=await db.collection('users').doc(u.uid).get();return d.exists?d.data().points||0:0;}return 0;}catch(e){console.error(e);return 0;}}
    function updateVoucherOptions(){const div=document.getElementById('voucher-options');if(!auth.currentUser){div.innerHTML=`<p style="font-style:italic;color:#a00;">Connectez-vous pour voir vos coupons.</p>`;return;}getUserPoints().then(points=>{const subt=document.getElementById('subTotal').innerText.replace('€','');const total=parseFloat(subt);const vouchers=[{points:500,value:5,min:30},{points:1000,value:10,min:40},{points:2000,value:20,min:80},{points:2500,value:30,min:100}];let html='';vouchers.forEach(v=>{if(points>=v.points){if(total>=v.min){html+=`<div style="margin-bottom:8px;"><input type="checkbox" class="voucher-checkbox" id="v${v.value}" value="${v.value}" data-points="${v.points}"><label for="v${v.value}" style="cursor:pointer;">€${v.value} coupon (coût ${v.points} pts)</label></div>`;}else{html+=`<div style="margin-bottom:8px;color:#aaa;">€${v.value} coupon (min. ${v.min}€ - coût ${v.points} pts) <em>Inapplicable</em></div>`;}}});if(!html) html='<p>Aucun coupon disponible.</p>';div.innerHTML=html;addVoucherCheckboxListeners();});}
    function addVoucherCheckboxListeners(){const cbs=document.querySelectorAll('input.voucher-checkbox');cbs.forEach(cb=>cb.addEventListener('click',function(){if(this.checked){cbs.forEach(o=>o!==this&&(o.checked=false));}else this.checked=false;}));}

    // --- Total & TVA ---
    function updateTotal(){const items=JSON.parse(localStorage.getItem('cartItems'))||[];const sum=items.reduce((a,i)=>a+i.price*i.quantity,0);document.getElementById('subTotal').innerText=sum.toFixed(2)+'€';document.getElementById('tax').innerText=(sum*0.2).toFixed(2)+'€';document.getElementById('shipping').innerText='A déterminer au paiement';document.getElementById('total').innerText=(sum*1.2).toFixed(2)+'€';updateVoucherOptions();}
    function resetButton(){const b=document.getElementById('checkout-btn');const t=document.getElementById('checkout-btn-text');const l=document.getElementById('loader');const c=document.getElementById('card-icon');b.disabled=false;t.style.display='inline';l.style.display='none';c.style.display='inline-block';}

    // --- Checkout Stripe ---
    async function handleCheckout(){const b=document.getElementById('checkout-btn'),t=document.getElementById('checkout-btn-text'),l=document.getElementById('loader'),c=document.getElementById('card-icon');b.disabled=true;t.style.display='none';l.style.display='inline-block';c.style.display='none';const sel=document.querySelector('input.voucher-checkbox:checked');let voucher=null;if(sel){voucher={value:sel.value,points:sel.getAttribute('data-points')};localStorage.setItem('appliedVoucher',JSON.stringify(voucher));}else localStorage.removeItem('appliedVoucher');try{const items=JSON.parse(localStorage.getItem('cartItems'))||[];if(!items.length){alert('Votre panier est vide !');resetButton();return;}const res=await fetch('https://burban-stripe-service.onrender.com/create-checkout-session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items,voucher})});const d=await res.json();if(d.error){alert(d.error);resetButton();return;}resetButton();const stripe=Stripe('pk_live_51Q9ORzRwel3656rYkt2acyiz7KoCl1mJA6ru04LPlGQmt5Iw9BcTQa16qv5O0Ozte9bMCtutah1qh4r6yds3l2p000MPG83KmB');stripe.redirectToCheckout({sessionId:d.sessionId});}catch(e){console.error(e);alert('Erreur, réessayez');resetButton();}}

    // --- Auth & Init ---
    auth.onAuthStateChanged(()=>updateVoucherOptions());
    document.addEventListener('DOMContentLoaded',()=>{document.getElementById('loader').style.display='none';loadCart();
      // Modal handlers
      const modal=document.getElementById('shippingModal');const close=modal.querySelector('.close');close.onclick=()=>modal.style.display='none';window.onclick=e=>{if(e.target===modal)modal.style.display='none';};document.getElementById('shippingForm').addEventListener('submit',e=>{e.preventDefault();modal.style.display='none';handleCheckout();});
      // Year
      document.getElementById('year').innerText=new Date().getFullYear();
    });
  </script>

<script>
  // Shipping logic (copié du server)
  const shippingRates = {
    category1: { us:{unique:4.49, additional:2.10}, europe:{unique:4.29, additional:1.25}, /*...*/ worldwide:{unique:10.59, additional:5.30} },
    /* autres catégories identiques à server.js */
  };
  const countryToRegion = { us:'us', ca:'canada', gb:'uk', uk:'uk', jp:'japan', au:'australia', br:'brazil' };
  const euCountries = ['at','be','bg','cy','cz','dk','ee','fi','fr','de','gr','hr','hu','ie','it','lv','lt','lu','mt','nl','pl','pt','ro','sk','si','es','se'];

  function getCategory(item) {
    const name = item.name.toLowerCase();
    if (name.includes('t-shirt')||name.includes('tshirt')||name.includes('débardeur')||name.includes('polo')||name.includes('crop-top')) return 'category1';
    if (name.includes('sweat')||name.includes('pull')||name.includes('veste')||name.includes('pantalon')) return 'category2';
    if (name.includes('hoodie')||name.includes('jacket')||name.includes('jogger')) return 'category4';
    if (name.includes('coupe-vent')||name.includes('pyjama')) return 'category5';
    if (name.includes('casquette')||name.includes('bonnet')||name.includes('bob')||name.includes('visière')) return 'category6';
    return 'category3';
  }

  function getCombinedShippingCost(items, region) {
    const groups = {};
    items.forEach(i=>{const cat=getCategory(i);groups[cat]=(groups[cat]||0)+i.quantity;});
    const cats = Object.keys(groups);
    if (cats.length===1) {
      const rates = shippingRates[cats[0]][region]||shippingRates[cats[0]].worldwide;
      return rates.unique + (groups[cats[0]]-1)*rates.additional;
    }
    let maxUnique=0, maxCat;
    cats.forEach(c=>{const r=shippingRates[c][region]||shippingRates[c].worldwide;if(r.unique>maxUnique){maxUnique=r.unique;maxCat=c;}});
    let total = maxUnique + (groups[maxCat]-1)*(shippingRates[maxCat][region]||shippingRates[maxCat].worldwide).additional;
    cats.filter(c=>c!==maxCat).forEach(c=>{ const r=shippingRates[c][region]||shippingRates[c].worldwide; total += groups[c]*r.additional; });
    return total;
  }

  async function detectRegion() {
    // call geoip endpoint on your server
    try {
      const res = await fetch('/geoip');
      const { geo } = await res.json();
      const cc = geo && geo.country ? geo.country.toLowerCase() : null;
      if (cc && countryToRegion[cc]) return countryToRegion[cc];
      if (cc && euCountries.includes(cc)) return 'europe';
    } catch(e){}
    return 'worldwide';
  }

  async function updateTotal() {
    const items = JSON.parse(localStorage.getItem('cartItems'))||[];
    const sub = items.reduce((a,i)=>a+i.price*i.quantity,0);
    const tax = sub*0.2;
    const region = await detectRegion();
    const shipping = getCombinedShippingCost(items, region);
    document.getElementById('subTotal').innerText = sub.toFixed(2)+'€';
    document.getElementById('shipping').innerText = shipping.toFixed(2)+'€';
    document.getElementById('tax').innerText = tax.toFixed(2)+'€';
    document.getElementById('total').innerText = (sub + tax + shipping).toFixed(2)+'€';
    updateVoucherOptions();
  }

  // Load cart and bind remove/quantity logic as before, then call updateTotal()
  document.addEventListener('DOMContentLoaded', ()=>{
    loadCart();
  });
</script>
</body>
</html>
