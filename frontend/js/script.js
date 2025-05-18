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

  // === Ebooks verwalten ===
  const addEbookBtn = document.getElementById("btnShowAddEbookForm");
  const addEbookContainer = document.getElementById("addEbookContainer");
  const addEbookForm = document.getElementById("addEbookForm");
  const msgBox = document.getElementById("msgEditEbook");

  // Button zeigt/versteckt das Formular
  if (addEbookBtn && addEbookContainer) {
    addEbookBtn.addEventListener("click", () => {
      addEbookContainer.classList.toggle("d-none");
    });
  }

  // Formular absenden
  if (addEbookForm) {
    addEbookForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      const data = {
        action: "addEbook",
        title: $("#title").val().trim(),
        author: $("#author").val().trim(),
        description: $("#description").val().trim(),
        price: parseFloat($("#price").val()),
        isbn: $("#isbn").val().trim(),
        rating: parseFloat($("#rating").val()),
        category: $("#category").val().trim(),
        cover_image_path: $("#coverImagePath").val().trim(),
      };

      try {
        const res = await fetch("../../backend/logic/requestHandler.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        const result = await res.json();

        if (result.success) {
          showMsg("E-Book erfolgreich hinzugefügt!", "success");
          addEbookForm.reset();
        } else {
          showMsg(result.error || "Fehler beim Hinzufügen.", "danger");
        }
      } catch (err) {
        showMsg("Serverfehler – bitte später versuchen.", "danger");
      }
    });
  }

  function loadEbooksAdmin() {
    fetch("../../backend/logic/requestHandler.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "getAllEbooksWithDetails" }),
    })
      .then((res) => res.json())
      .then((data) => renderEbookTable(data))
      .catch((err) =>
        console.error("Fehler beim Laden der Admin-Tabelle:", err)
      );
  }

  function renderEbookTable(ebooks) {
    const tbody = document.getElementById("ebookTableBody");
    if (!tbody) return;

    tbody.innerHTML = "";

    ebooks.forEach((ebook) => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
      <td>${ebook.title}</td>
      <td>${ebook.author || "-"}</td>
      <td>${parseFloat(ebook.price).toFixed(2)} €</td>
      <td>${ebook.category || "-"}</td>
      <td>
        <button class="btn btn-sm btn-info btn-edit" data-id="${
          ebook.ebook_id
        }">
          Bearbeiten
        </button>
        <button class="btn btn-sm btn-danger btn-delete ms-1" data-id="${
          ebook.ebook_id
        }">
          Löschen
        </button>
      </td>
    `;

      tbody.appendChild(tr);
    });

    // === Event für Bearbeiten-Button
    document.querySelectorAll(".btn-edit").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        const ebook = ebooks.find((e) => e.ebook_id == id);
        if (ebook) openEditForm(ebook);
      });
    });

    // === Event für Löschen-Button (MUSS hier rein!)
    document.querySelectorAll(".btn-delete").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = parseInt(btn.dataset.id);
        if (!confirm("Willst du dieses E-Book wirklich löschen?")) return;

        fetch("../../backend/logic/requestHandler.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "deleteEbook",
            ebook_id: id,
          }),
        })
          .then((res) => res.json())
          .then((result) => {
            if (result.success) {
              showMsg("E-Book wurde gelöscht.", "success");
              loadEbooksAdmin(); // richtig: Admin-Ansicht neu laden
            } else {
              showMsg(result.error || "Löschen fehlgeschlagen.", "danger");
            }
          })
          .catch((err) => {
            console.error("Fehler beim Löschen:", err);
            showMsg("Serverfehler beim Löschen.", "danger");
          });
      });
    });
  }

  // Wenn Tabelle existiert, Produkte für Admin laden
  if (document.getElementById("ebookTableBody")) {
    loadEbooksAdmin();
  }

  //daten bearbeiten

  function openEditForm(ebook) {
    $("#edit_ebook_id").val(ebook.ebook_id);
    $("#edit_title").val(ebook.title);
    $("#edit_author").val(ebook.author);
    $("#edit_description").val(ebook.description);
    $("#edit_price").val(ebook.price);
    $("#edit_isbn").val(ebook.isbn);
    $("#edit_rating").val(ebook.rating);
    $("#edit_category").val(ebook.category);
    $("#edit_cover_image_path").val(ebook.cover_image_path);

    const modal = new bootstrap.Modal(
      document.getElementById("editEbookModal")
    );
    modal.show();
  }

  const editForm = document.getElementById("editEbookForm");
  const editMsg = document.getElementById("msgEditSave");

  if (editForm) {
    document
      .getElementById("editEbookForm")
      .addEventListener("submit", async function (e) {
        e.preventDefault();

        const data = {
          action: "updateEbook",
          ebook_id: parseInt($("#edit_ebook_id").val()),
          title: $("#edit_title").val().trim(),
          author: $("#edit_author").val().trim(),
          description: $("#edit_description").val().trim(),
          price: parseFloat($("#edit_price").val()),
          isbn: $("#edit_isbn").val().trim(),
          rating: parseFloat($("#edit_rating").val()),
          category: $("#edit_category").val().trim(),
          cover_image_path: $("#edit_cover_image_path").val().trim(),
        };

        try {
          const res = await fetch("../../backend/logic/requestHandler.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });

          const result = await res.json();

          const msg = document.getElementById("msgEditSave");
          if (result.success) {
            msg.className = "alert alert-success";
            msg.textContent = "E-Book erfolgreich aktualisiert.";
            msg.classList.remove("d-none");
            setTimeout(() => location.reload(), 1000);
          } else {
            msg.className = "alert alert-danger";
            msg.textContent = result.error || "Fehler beim Speichern.";
            msg.classList.remove("d-none");
          }
        } catch (err) {
          showMsg("Serverfehler beim Speichern.", "danger");
        }

        setTimeout(() => editMsg.classList.add("d-none"), 4000);
      });
  }

  // Zentrale Message-Funktion für editproduct.html
  function showMsg(text, type = "info") {
    if (!msgBox) return;
    msgBox.textContent = text;
    msgBox.className = `alert alert-${type} text-center m-3`;
    msgBox.classList.remove("d-none");
    setTimeout(() => msgBox.classList.add("d-none"), 4000);
  }

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
      user_id: userId,
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
              <div class="order-details-table mt-3 d-none" id="details-${
                order.order_id
              }"></div>
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
      order_id: orderId,
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
      row
        .find("td:nth-child(3)")
        .text(`${parseFloat(data.order.total_price).toFixed(2)} €`);
    }
  });

  // Tabelleninhalt mit Positionen anzeigen
  const rows = data.items
    .map(
      (item) => `
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
  `
    )
    .join("");

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

  const confirmed = confirm(
    "Möchtest du dieses Produkt wirklich aus der Bestellung entfernen?"
  );
  if (!confirmed) return;

  const res = await fetch("../../backend/logic/requestHandler.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "removeItemFromOrder",
      order_id: orderId,
      ebook_id: ebookId,
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
        order_id: orderId,
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
          order_id: orderId,
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
      active: !currentActive,
    }),
  });

  loadCustomers();
});

// Seite initial laden
if (document.getElementById("customersTable")) {
  loadCustomers();
}
