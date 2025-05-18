document.addEventListener("DOMContentLoaded", async () => {
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
});

