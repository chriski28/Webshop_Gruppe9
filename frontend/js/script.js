// Cookie auslesen
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
}

document.addEventListener("DOMContentLoaded", () => {
  // === Login mit Cookie, falls vorhanden ===
  const token = getCookie("remember_token");
  if (token) {
    fetch("../../backend/logic/requestHandler.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "loginWithToken", token }),
    })
      .then((res) => res.json())
      .then((response) => {
        if (response.success) {
          window.location.href = "index.html";
        } else {
          console.error("Auto-Login mit Cookie fehlgeschlagen");
        }
      })
      .catch((err) => {
        console.error("Auto-Login mit Cookie fehlgeschlagen", err);
      });
  }

  // === REGISTRIERUNG ===
  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const data = {
        action: "createUser",
        salutation: $("#anrede").val(),
        first_name: $("#vorname").val(),
        last_name: $("#nachname").val(),
        address: $("#adresse").val(),
        postal_code: $("#plz").val(),
        city: $("#ort").val(),
        email: $("#email").val(),
        username: $("#benutzername").val(),
        password: $("#passwort").val(),
      };
      const password2 = $("#passwort2").val();
      if (data.password !== password2) {
        $("#registerMessage").text("Passwörter stimmen nicht überein.");
        return;
      }
      $.ajax({
        url: "../../backend/logic/requestHandler.php",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify(data),
        success: function (response) {
          if (response.success) {
            // Auto-Login nach Registrierung
            const loginData = {
              action: "login",
              username: data.username,
              password: data.password,
              rememberMe: false,
            };
            fetch("../../backend/logic/requestHandler.php", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(loginData),
            })
              .then((res) => res.json())
              .then((loginResp) => {
                if (loginResp.success) {
                  // Gast-Warenkorb in DB übernehmen
                  const guestCart = JSON.parse(
                    localStorage.getItem("cart") || "[]"
                  );
                  guestCart.forEach((item) => {
                    fetch("../../backend/logic/requestHandler.php", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        action: "addToCart",
                        ebook_id: item.id,
                        quantity: item.quantity,
                      }),
                    });
                  });
                  localStorage.removeItem("cart");
                  window.location.href = "index.html";
                } else {
                  window.location.href = "login.html";
                }
              })
              .catch(() => {
                window.location.href = "login.html";
              });
          } else {
            $("#registerMessage").text(
              response.error || "Registrierung fehlgeschlagen."
            );
          }
        },
        error: function () {
          $("#registerMessage").text("Fehler bei der Registrierung.");
        },
      });
    });
  }

  // === LOGIN ===
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const data = {
        action: "login",
        username: $("#username").val(),
        password: $("#password").val(),
        rememberMe: $("#rememberMe").is(":checked"),
      };
      $.ajax({
        url: "../../backend/logic/requestHandler.php",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify(data),
        success: function (response) {
          if (response.success) {
            // Gast-Warenkorb verwerfen
            localStorage.removeItem("cart");
            if (data.rememberMe) {
              const expires = new Date(
                Date.now() + 7 * 24 * 60 * 60 * 1000
              ).toUTCString();
              document.cookie = `remember_token=${response.remember_token}; expires=${expires}; path=/;`;
            }
            window.location.href = "index.html";
          } else {
            $("#loginMessage").text(response.error || "Login fehlgeschlagen.");
          }
        },
        error: function () {
          $("#loginMessage").text("Fehler beim Login.");
        },
      });
    });
  }

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

  // === ebooks ladden+ Suchen Live ===
  const ebookContainer = document.getElementById("ebook-container");
  const categorySelect = document.getElementById("categorySelect");
  const searchInput = document.getElementById("searchInput");
  const ebookTemplate = document.getElementById("ebook-card-template");

  if (ebookContainer && categorySelect && ebookTemplate) {
    loadEbooks(categorySelect.value);

    categorySelect.addEventListener("change", () => {
      loadEbooks(categorySelect.value);
    });

    searchInput.addEventListener("input", () => {
      const q = searchInput.value.trim();
      if (q) searchEbooks(q);
      else loadEbooks(categorySelect.value);
    });
  }

  function loadEbooks(category = null) {
    const requestData = { action: "getEbooks" };
    if (category) requestData.category = category;

    fetch("../../backend/logic/requestHandler.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestData),
    })
      .then((res) => res.json())
      .then((data) => renderEbooks(data))
      .catch((err) => console.error("Fehler beim Laden der E-Books:", err));
  }

  function searchEbooks(query) {
    const requestData = { action: "searchEbooks", search: query };

    fetch("../../backend/logic/requestHandler.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestData),
    })
      .then((res) => res.json())
      .then((data) => renderEbooks(data))
      .catch((err) => {
        console.error("Fehler bei der Suche:", err);
        ebookContainer.innerHTML =
          '<p style="color: red;">Keine E-Books gefunden</p>';
      });
  }

  function renderEbooks(ebooks) {
    ebookContainer.innerHTML = "";
    ebooks.forEach((ebookData) => {
      const card = ebookTemplate.cloneNode(true);
      card.classList.remove("d-none");
      card.removeAttribute("id");

      const img = card.querySelector("img");
      img.src = "../../" + ebookData.image;
      img.alt = ebookData.title;

      card.querySelector(".card-title").textContent = ebookData.title;
      card.querySelector(".ebook-price").textContent =
        ebookData.price.toFixed(2);

      // "In den Warenkorb"-Button
      const btn = card.querySelector("button");
      btn.addEventListener("click", () => {
        addToCart({
          id: ebookData.id,
          title: ebookData.title,
          price: ebookData.price,
        });
      });

      ebookContainer.appendChild(card);
    });
  }

  // === CART PAGE RENDERING ===
  const cartBody = document.getElementById("cart-items");
  if (cartBody) {
    let cartItems = [];

    // Prüfen ob eingeloggt und DB-Warenkorb laden
    fetch("../../backend/logic/requestHandler.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "getSessionUser" }),
    })
      .then((res) => res.json())
      .then((userData) => {
        if (userData.username) {
          // eingeloggter Nutzer
          fetch("../../backend/logic/requestHandler.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "getCart" }),
          })
            .then((res) => res.json())
            .then((items) => {
              cartItems = items.map((i) => ({
                id: i.id,
                title: i.title,
                price: i.price,
                quantity: i.quantity,
              }));
              renderCart();
            });
        } else {
          // Gast
          cartItems = JSON.parse(localStorage.getItem("cart") || "[]");
          renderCart();
        }
      });

    function renderCart() {
      cartBody.innerHTML = "";
      let total = 0;
      cartItems.forEach((item) => {
        const price = parseFloat(item.price);
        const lineTotal = price * item.quantity;

        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${item.title}</td>
            <td>${price.toFixed(2)} €</td>
            <td>
              <input type="number"
                     min="1"
                     value="${item.quantity}"
                     class="form-control qty-input"
                     data-id="${item.id}">
            </td>
            <td>${lineTotal.toFixed(2)} €</td>
            <td>
              <button class="btn btn-danger btn-sm remove-btn"
                      data-id="${item.id}">&times;</button>
            </td>
          `;
        cartBody.appendChild(row);

        total += lineTotal;
      });

      document.getElementById("total-price").textContent =
        total.toFixed(2) + " €";
      updateCartBadge();
    }

    cartBody.addEventListener("change", (e) => {
      if (e.target.matches(".qty-input")) {
        const id = parseInt(e.target.dataset.id, 10);
        const newQty = parseInt(e.target.value, 10) || 1;
        cartItems = cartItems.map((ci) =>
          ci.id === id ? { ...ci, quantity: newQty } : ci
        );
        localStorage.setItem("cart", JSON.stringify(cartItems));
        //wenn eingelogt dann DB Update
        fetch("../../backend/logic/requestHandler.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "updateCartItem",
            ebook_id: id,
            quantity: newQty,
          }),
        });
        renderCart();
      }
    });

    cartBody.addEventListener("click", (e) => {
      if (e.target.matches(".remove-btn")) {
        const id = parseInt(e.target.dataset.id, 10);
        cartItems = cartItems.filter((ci) => ci.id !== id);
        localStorage.setItem("cart", JSON.stringify(cartItems));
        //wenn eingelogt dann DB Update
        fetch("../../backend/logic/requestHandler.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "removeCartItem",
            ebook_id: id,
          }),
        });
        renderCart();
      }
    });
  }
}); // end DOMContentLoaded

// Warenkorb im Navbar aktualisieren
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
