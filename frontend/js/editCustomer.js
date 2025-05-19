document.addEventListener("DOMContentLoaded", () => {
  // === Kunden laden und in Tabelle anzeigen ===
  async function loadCustomers() {
    const res = await fetch("../../backend/logic/requestHandler.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "getAllUsers" }),
    });
    const users = await res.json();
    renderCustomers(users);
  }

  // === Kundenliste dynamisch in Tabelle einfügen ===
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

  // === Kundenstatus aktivieren/deaktivieren ===
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

    loadCustomers(); // Tabelle neu laden
  });

  // === Bestellungen eines Nutzers im Modal anzeigen ===
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

  // === Produkte (Positionen) einer Bestellung anzeigen ===
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

    // Gesamtpreis oben in der Tabelle aktualisieren
    $(`#ordersAdminTable tbody tr`).each(function () {
      const row = $(this);
      const id = row.find("td:first").text();
      if (parseInt(id) === orderId) {
        row
          .find("td:nth-child(3)")
          .text(`${parseFloat(data.order.total_price).toFixed(2)} €`);
      }
    });

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

  // === Einzelnes Produkt aus Bestellung entfernen ===
  $(document).on("click", ".remove-item", async function () {
    const orderId = $(this).data("order-id");
    const ebookId = $(this).data("ebook-id");

    const confirmed = confirm(
      "Möchtest du dieses Produkt wirklich aus der Bestellung entfernen?"
    );
    if (!confirmed) return;

    // Produkt entfernen
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
      // Neue Positionen abrufen
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
        // Letztes Produkt entfernt → gesamte Bestellung löschen
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

          // Zeilen (Bestellung + Details) aus der Tabelle entfernen
          $(`#ordersAdminTable tbody tr`).each(function () {
            const row = $(this);
            const id = parseInt(row.find("td:first").text());
            if (id === orderId) {
              row.next().remove(); // Details-Zeile
              row.remove(); // Bestell-Zeile
            }
          });
        } else {
          alert("Produkt entfernt, aber Fehler beim Löschen der Bestellung.");
        }
      } else {
        // Bestellung aktualisieren
        $(`.load-details[data-order-id="${orderId}"]`).click();
        alert("Produkt erfolgreich entfernt.");
      }
    } else {
      alert(result.error || "Fehler beim Entfernen.");
    }
  });

  // === Initialer Aufruf bei Seitenstart ===
  if (document.getElementById("customersTable")) {
    loadCustomers();
  }
});
