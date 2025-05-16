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

  // enable/disable Bestellen-button based on login & cart count
  async function refreshOrderButton() {
    const session = await fetch("../../backend/logic/requestHandler.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "getUser" }),
    }).then((r) => r.json());

    const count = await fetch("../../backend/logic/requestHandler.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "getCartCount" }),
    }).then((r) => r.json());

    const btn = $("#btnOrder");
    if (!session.error && session.is_admin === false && count.count > 0) {
      btn.prop("disabled", false);
    } else {
      btn.prop("disabled", true);
    }
  }

  // call once on load
  await refreshOrderButton();

  // submit order
  $("#orderForm").on("submit", async function (e) {
    e.preventDefault();
    const res = await fetch("../../backend/logic/requestHandler.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "createOrder" }),
    }).then((r) => r.json());

    if (res.success) {
      alert("Deine Bestellung wurde erfolgreich aufgegeben!");
      window.location.reload();
    } else {
      alert("Fehler: " + (res.error || "Bestellung fehlgeschlagen"));
    }
  });

  // === MEIN KONTO: Benutzerprofil laden ===
  const updateForm = document.getElementById("updateUserForm");
  if (updateForm) {
    fetch("../../backend/logic/requestHandler.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "getUser" }),
    })
      .then((res) => res.json())
      .then((user) => {
        if (user.error) {
          $("#updateMessage").text(user.error);
          return;
        }
        $("#salutation").val(user.salutation);
        $("#first_name").val(user.first_name);
        $("#last_name").val(user.last_name);
        $("#address").val(user.address);
        $("#postal_code").val(user.postal_code);
        $("#city").val(user.city);
        $("#email").val(user.email);
      })
      .catch((err) => {
        $("#updateMessage").text("Fehler beim Laden der Benutzerdaten.");
      });
  }

  // === MEIN KONTO: Benutzerprofil speichern ===
  if (updateForm) {
    updateForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const data = {
        action: "updateUser",
        salutation: $("#salutation").val(),
        first_name: $("#first_name").val(),
        last_name: $("#last_name").val(),
        address: $("#address").val(),
        postal_code: $("#postal_code").val(),
        city: $("#city").val(),
        email: $("#email").val(),
        currentPassword: $("#confirm_password").val(),
      };

      $.ajax({
        url: "../../backend/logic/requestHandler.php",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify(data),
        success: function (response) {
          const msg = $("#updateMessage");
          msg.removeClass("text-danger text-success");

          if (response.success) {
            msg
              .text("Daten erfolgreich aktualisiert!")
              .addClass("text-success");
          } else {
            msg
              .text(response.error || "Fehler beim Aktualisieren.")
              .addClass("text-danger");
          }
        },
        error: function () {
          const msg = $("#updateMessage");
          msg.removeClass("text-danger text-success");
          msg.text("Fehler beim Aktualisieren.").addClass("text-danger");
        },
      });
    });
  }

  // === MEIN KONTO: Bestellungen laden ===
  async function loadOrders() {
    const session = await fetch("../../backend/logic/requestHandler.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "getUser" }),
    }).then((r) => r.json());
    if (session.error || session.is_admin) return;

    const res = await fetch("../../backend/logic/requestHandler.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "getUserOrders" }),
    }).then((r) => r.json());

    if (res.error) {
      $("#noOrders").removeClass("d-none").text(res.error);
      return;
    }

    const orders = res.orders || [];
    if (!orders.length) {
      $("#noOrders").removeClass("d-none");
      return;
    }

    $("#noOrders").addClass("d-none");
    $("#ordersTable").removeClass("d-none");

    const $tbody = $("#ordersTable tbody").empty();
    orders.forEach((o) => {
      // summary row
      $tbody.append(`
        <tr>
          <td>${o.order_id}</td>
          <td>${o.order_date}</td>
          <td>${parseFloat(o.total_price).toFixed(2)} €</td>
          <td>
            <button
              class="btn btn-info btn-sm me-1"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#details-${o.order_id}"
              aria-expanded="false"
              aria-controls="details-${o.order_id}"
            >Details</button>
            <button
              class="btn btn-secondary btn-sm btn-print-invoice"
              data-order-id="${o.order_id}"
            >Rechnung drucken</button>
          </td>
        </tr>
        <!-- 2) hidden details row -->
        <tr>
          <td colspan="4" class="p-0 border-0">
            <div class="collapse" id="details-${o.order_id}">
              <div class="card card-body">
                <table class="table table-sm mb-0">
                  <thead>
                    <tr>
                      <th>Titel</th>
                      <th>Autor</th>
                      <th>Preis</th>
                      <th>Menge</th>
                      <th>Gesamt</th>
                    </tr>
                  </thead>
                  <tbody id="details-body-${o.order_id}">
                    <tr><td colspan="5" class="text-center">Lade…</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </td>
        </tr>
      `);
    });
    // initalise collapse
    var collapseElList = [].slice.call(document.querySelectorAll(".collapse"));
    collapseElList.map(function (el) {
      return new bootstrap.Collapse(el, { toggle: false });
    });
  }
  // === Bestellung: Details ausklappen ===
  // fetch details on first expand
  $(document).on("show.bs.collapse", '[id^="details-"]', async function () {
    const collapseId = this.id; // e.g. "details-42"
    const orderId = collapseId.split("-")[1];
    const $body = $(`#details-body-${orderId}`);
    // if already loaded (we replace the placeholder), skip
    if ($body.data("loaded")) return;

    try {
      const res = await fetch("../../backend/logic/requestHandler.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "getInvoiceData", order_id: orderId }),
      }).then((r) => r.json());
      if (res.error) {
        $body.html(
          `<tr><td colspan="5" class="text-danger">${res.error}</td></tr>`
        );
      } else {
        $body.empty();
        res.items.forEach((item) => {
          $body.append(`
          <tr>
            <td>${item.title}</td>
            <td>${item.author}</td>
            <td>${parseFloat(item.price).toFixed(2)} €</td>
            <td>${item.quantity}</td>
            <td>${parseFloat(item.line_total).toFixed(2)} €</td>
          </tr>
        `);
        });
      }
      $body.data("loaded", true);
    } catch (err) {
      $body.html(
        `<tr><td colspan="5" class="text-danger">Fehler beim Laden</td></tr>`
      );
    }
  });
  loadOrders();
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

// === Rechnung generieren ===
// when a Rechnung‐button is clicked, open invoice.html in a new tab
$(document).on("click", ".btn-print-invoice", function () {
  const orderId = $(this).data("order-id");
  if (!orderId) return;
  window.open(`invoice.html?order_id=${orderId}`, "_blank");
});

// === ADMIN: Kunden anzeigen und aktiv/deaktiv schalten ===
async function loadCustomers() {
  const res = await fetch("../../backend/logic/requestHandler.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "getAllUsers" }),
  });
  const users = await res.json();
  renderCustomers(users);
}

function renderCustomers(users) {
  const tbody = $("#customersTable tbody");
  tbody.empty();

  users.forEach((user) => {
    const statusText = user.active ? "Aktiv" : "Deaktiviert";
    const statusBtnClass = user.active ? "btn-danger" : "btn-success";
    const statusBtnText = user.active ? "Deaktivieren" : "Aktivieren";

    tbody.append(`
      <tr>
        <td>${user.username}</td>
        <td>${user.first_name} ${user.last_name}</td>
        <td>${user.email}</td>
        <td>${statusText}</td>
        <td>
          <button class="btn btn-sm btn-info me-1 view-orders"
                  data-user-id="${user.user_id}" 
                  data-name="${user.first_name} ${user.last_name}">
            Bestellungen
          </button>
          <button class="btn ${statusBtnClass} btn-sm toggle-user" 
                  data-user-id="${user.user_id}" 
                  data-active="${user.active}">
            ${statusBtnText}
          </button>
        </td>
      </tr>
    `);
  });
}

// Admin: Bestellungen eines Kunden anzeigen
$(document).on("click", ".view-orders", async function () {
  const userId = $(this).data("user-id");
  const fullName = $(this).data("name");

  $("#modalCustomerName").text(fullName);
  $("#ordersAdminTable tbody").empty();
  $("#noCustomerOrders").addClass("d-none");
  $("#ordersAdminTable").addClass("d-none");

  const res = await fetch("../../backend/logic/requestHandler.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "getOrdersByUserAdmin",
      user_id: userId
    }),
  });

  const data = await res.json();
  if (!data.orders || data.orders.length === 0) {
    $("#noCustomerOrders").removeClass("d-none");
  } else {
    const tbody = $("#ordersAdminTable tbody");
    data.orders.forEach((order) => {
      tbody.append(`
        <tr>
          <td>${order.order_id}</td>
          <td>${order.order_date}</td>
          <td>${parseFloat(order.total_price).toFixed(2)} €</td>
        </tr>
        <tr>
          <td colspan="3" class="p-0 border-0">
            <div class="p-3 bg-light">
              <button class="btn btn-outline-secondary btn-sm load-details"
                      data-order-id="${order.order_id}">
                Positionen anzeigen
              </button>
              <div class="order-details-table mt-3 d-none" id="details-${order.order_id}"></div>
            </div>
          </td>
        </tr>
      `);
    });
    $("#ordersAdminTable").removeClass("d-none");
  }

  const modal = new bootstrap.Modal(document.getElementById("ordersModal"));
  modal.show();
});

// Admin: Produkte (Positionen) in einer Bestellung anzeigen
$(document).on("click", ".load-details", async function () {
  const orderId = $(this).data("order-id");
  const container = $(`#details-${orderId}`);
  container.html("Lade...").removeClass("d-none");

  const res = await fetch("../../backend/logic/requestHandler.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "getInvoiceData",
      order_id: orderId
    }),
  });

  const data = await res.json();
  if (data.error) {
    container.html(`<p class="text-danger">${data.error}</p>`);
    return;
  }

  // Gesamtpreis in der Übersichtstabelle aktualisieren
  $(`#ordersAdminTable tbody tr`).each(function () {
    const row = $(this);
    const id = row.find("td:first").text();
    if (parseInt(id) === orderId) {
      row.find("td:nth-child(3)").text(`${parseFloat(data.order.total_price).toFixed(2)} €`);
    }
  });

  // Tabelleninhalt mit Positionen anzeigen
  const rows = data.items.map(item => `
    <tr>
      <td>${item.title}</td>
      <td>${item.author}</td>
      <td>${parseFloat(item.price).toFixed(2)} €</td>
      <td>${item.quantity}</td>
      <td>${parseFloat(item.line_total).toFixed(2)} €</td>
      <td>
        <button class="btn btn-danger btn-sm remove-item"
                data-order-id="${orderId}"
                data-ebook-id="${item.ebook_id}">
          Entfernen
        </button>
      </td>
    </tr>
  `).join("");

  container.html(`
    <table class="table table-sm">
      <thead>
        <tr>
          <th>Titel</th>
          <th>Autor</th>
          <th>Preis</th>
          <th>Menge</th>
          <th>Gesamt</th>
          <th>Aktion</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `);
});


// Admin: Produkt aus Bestellung entfernen
$(document).on("click", ".remove-item", async function () {
  const orderId = $(this).data("order-id");
  const ebookId = $(this).data("ebook-id");

  const confirmed = confirm("Möchtest du dieses Produkt wirklich aus der Bestellung entfernen?");
  if (!confirmed) return;

  const res = await fetch("../../backend/logic/requestHandler.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "removeItemFromOrder",
      order_id: orderId,
      ebook_id: ebookId
    }),
  });

  const result = await res.json();

  if (result.success) {
    // Danach erneut die Bestelldetails laden
    const reload = await fetch("../../backend/logic/requestHandler.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "getInvoiceData",
        order_id: orderId
      }),
    });

    const updated = await reload.json();

    if (!updated.items || updated.items.length === 0) {
      // Bestellung hat keine Positionen mehr → Bestellung löschen
      const delRes = await fetch("../../backend/logic/requestHandler.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "deleteOrder",
          order_id: orderId
        }),
      });

      const delResult = await delRes.json();
      if (delResult.success) {
        alert("Letztes Produkt entfernt – Bestellung wurde gelöscht.");

        // Bestellung aus Tabelle entfernen
        $(`#ordersAdminTable tbody tr`).each(function () {
          const row = $(this);
          const id = parseInt(row.find("td:first").text());
          if (id === orderId) {
            // entferne die aktuelle + nächste Zeile (Details-Zeile)
            row.next().remove();
            row.remove();
          }
        });
      } else {
        alert("Produkt entfernt, aber Fehler beim Löschen der Bestellung.");
      }
    } else {
      // Bestellung hat noch Produkte – Details neu laden
      $(`.load-details[data-order-id="${orderId}"]`).click();
      alert("Produkt erfolgreich entfernt.");
    }
  } else {
    alert(result.error || "Fehler beim Entfernen.");
  }
});




// Klick-Event zum Umschalten von aktiv/deaktiv
$(document).on("click", ".toggle-user", async function () {
  const userId = $(this).data("user-id");
  const currentActive = $(this).data("active");

  await fetch("../../backend/logic/requestHandler.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "toggleUserActive",
      user_id: userId,
      active: !currentActive
    }),
  });

  loadCustomers();
});

// Seite initial laden
if (document.getElementById("customersTable")) {
  loadCustomers();
}
