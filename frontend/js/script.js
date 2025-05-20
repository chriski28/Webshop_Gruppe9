// Cookie auslesen
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
}

document.addEventListener("DOMContentLoaded", async () => {
  const token = getCookie("remember_token");

  const sessionCheck = await fetch("../../backend/logic/requestHandler.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "getSessionUser" }),
  });
  const sessionUser = await sessionCheck.json();

  if (!sessionUser.username && token) {
    try {
      const res = await fetch("../../backend/logic/requestHandler.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "loginWithToken", token }),
      });
      const response = await res.json();

      if (response.success) {
        console.log("Auto-Login erfolgreich");
        window.location.href = "index.html"; // Direkt umleiten!
        return;
      } else {
        console.log("Ungültiger Token, Cookie wird gelöscht");
        document.cookie = "remember_token=; Max-Age=0; path=/;";
      }
    } catch (error) {
      console.error("Fehler beim Auto-Login:", error);
      document.cookie = "remember_token=; Max-Age=0; path=/;";
    }
  }


  // Hier Code platzieren der automatisch auf JEDER Seite ausgeführt werden soll (zb. Header/Footer laden, Warenkorb aktualisieren, Login/Admin-Check)

  // === Header laden ===
  fetch("../components/header.html")
    .then((res) => res.text())
    .then((data) => {
      const wrapper = document.createElement("div");
      wrapper.innerHTML = data;
      document.body.insertBefore(wrapper, document.body.firstChild);
      renderMenu();
    });

  // === DYNAMISCHE NAVIGATION ===
  function renderMenu() {
    fetch("../../backend/logic/requestHandler.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "getSessionUser" }),
    })
      .then((res) => res.json())
      .then((data) => {
        const nav = document.getElementById("user-nav");
        if (!nav) return;

        if (!data.username) {
          // Gast
          nav.innerHTML = `
          <li class="nav-item"><a class="nav-link" href="index.html">Start</a></li>
          <li class="nav-item"><a class="nav-link" href="login.html">Login</a></li>
          <li class="nav-item"><a class="nav-link" href="register.html">Registrieren</a></li>
          <li class="nav-item"><a class="nav-link" href="shop.html">Produkte</a></li>
          <li class="nav-item"><a class="nav-link" href="cart.html">Warenkorb</a></li>
        `;
        } else if (data.is_admin) {
          // Admin
          nav.innerHTML = `
          <li class="nav-item"><a class="nav-link" href="index.html">Start</a></li>
          <li class="nav-item"><a class="nav-link" href="editProducts.html">Produkte bearbeiten</a></li>
          <li class="nav-item"><a class="nav-link" href="editCustomer.html">Kunden bearbeiten</a></li>
          <li class="nav-item"><span class="nav-link disabled">👑${data.username}</span></li>
          <li class="nav-item"><a class="nav-link" href="#" id="logout-link">Logout</a></li>
        `;
        } else {
          // Normaler User
          nav.innerHTML = `
          <li class="nav-item"><a class="nav-link" href="index.html">Start</a></li>
          <li class="nav-item"><a class="nav-link" href="shop.html">Produkte</a></li>
          <li class="nav-item"><a class="nav-link" href="cart.html">Warenkorb</a></li>
          <li class="nav-item"><a class="nav-link" href="myAcc.html">Mein Konto</a></li>
          <li class="nav-item"><span class="nav-link disabled">👋${data.username}</span></li>
          <li class="nav-item"><a class="nav-link" href="#" id="logout-link">Logout</a></li>
        `;
        }

        const logoutBtn = document.getElementById("logout-link");
        if (logoutBtn) {
          logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            fetch("../../backend/logic/requestHandler.php", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "logout" }),
            }).then(() => {
              document.cookie = "remember_token=; Max-Age=0; path=/;";
              localStorage.removeItem("cart");
              window.location.href = "index.html";
            });
          });
        }

        updateCartBadge();
      })
      .catch((err) => console.error("Fehler bei dynamischer Navigation:", err));
  }
  // === Footer laden ===
  fetch("../components/footer.html")
    .then((res) => res.text())
    .then((data) => {
      const wrapper = document.createElement("div");
      wrapper.innerHTML = data;
      const footer = wrapper.querySelector("footer");
      if (footer) footer.classList.add("mt-auto");
      document.body.appendChild(wrapper);
    });

  // Ende von Code der auf JEDER Seite ausgeführt werden soll
}); // end DOMContentLoaded

// Warenkorb im Navbar aktualisieren !! Muss in script.js sein, damit es auf jeder Seite funktioniert!!!
function updateCartBadge() {
  fetch("../../backend/logic/requestHandler.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "getSessionUser" }),
  })
    .then((res) => res.json())
    .then((userData) => {
      const cartLink = document.querySelector(
        '#user-nav .nav-link[href="cart.html"]'
      );
      if (!cartLink) return;
      if (userData.username) {
        // eingeloggter Nutzer – Count aus DB holen
        fetch("../../backend/logic/requestHandler.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "getCartCount" }),
        })
          .then((res) => res.json())
          .then((countData) => {
            cartLink.textContent = `Warenkorb (${countData.count})`;
          });
      } else {
        const cart = JSON.parse(localStorage.getItem("cart") || "[]");
        const count = cart.reduce((sum, ci) => sum + ci.quantity, 0);
        cartLink.textContent = `Warenkorb (${count})`;
      }
    });
}

// Artikel zum Warenkorb hinzufügen
function addToCart(item) {
  let cart = JSON.parse(localStorage.getItem("cart") || "[]");
  const idx = cart.findIndex((ci) => ci.id === item.id);
  if (idx > -1) {
    cart[idx].quantity += item.quantity || 1;
  } else {
    cart.push({ ...item, quantity: item.quantity || 1 });
  }
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartBadge();

  // Sync für eingeloggte User
  fetch("../../backend/logic/requestHandler.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "addToCart",
      ebook_id: item.id,
      quantity: item.quantity || 1,
    }),
  });
}

  





