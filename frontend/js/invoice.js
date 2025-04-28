// Holt order_id aus der URL
const urlParams = new URLSearchParams(window.location.search);
const orderId = urlParams.get("order_id");

if (!orderId) {
  document.body.innerHTML = "<p class='text-danger'>Keine Bestellnummer angegeben.</p>";
} else {
  fetch("../../backend/logic/requestHandler.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "getOrderDetails", order_id: orderId }),
  })
    .then((res) => res.json())
    .then((orderItems) => {
      if (orderItems.error) {
        document.body.innerHTML = `<p class="text-danger">${orderItems.error}</p>`;
        return;
      }

      // Rechnungskopf bauen
      buildInvoiceHeader();
      // Artikel auflisten
      buildInvoiceTable(orderItems);
      // Gesamtsumme berechnen
      calculateTotal(orderItems);
    })
    .catch((err) => {
      document.body.innerHTML = "<p class='text-danger'>Fehler beim Laden der Rechnung.</p>";
    });
}

// Rechnungskopf (Nummer, Datum, Adresse)
function buildInvoiceHeader() {
    const today = new Date();
    const invoiceNumber = "INV-" + today.getFullYear() + (today.getMonth() + 1) + today.getDate() + "-" + Math.floor(Math.random() * 10000);
  
    const header = document.getElementById("invoiceHeader");
    header.innerHTML = `
      <div class="text-end">
        <p><strong>Rechnungsnummer:</strong> ${invoiceNumber}</p>
        <p><strong>Datum:</strong> ${today.toLocaleDateString()}</p>
      </div>
      <hr>
      <div class="mt-3">
        <p><strong>Kundendaten:</strong></p>
        <p id="customerDetails">Wird geladen...</p>
      </div>
    `;
  
    // Lade Kundendaten
    fetch("../../backend/logic/requestHandler.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "getUser" }),
    })
      .then((res) => res.json())
      .then((user) => {
        if (!user.error) {
          document.getElementById("customerDetails").innerHTML = `
            ${user.salutation} ${user.first_name} ${user.last_name}<br>
            ${user.address}<br>
            ${user.postal_code} ${user.city}<br>
            ${user.email}
          `;
        }
      });
  }
  

// Tabelle für die bestellten Artikel
function buildInvoiceTable(items) {
  const invoiceItems = document.getElementById("invoiceItems");
  let table = `
    <table class="table table-bordered">
      <thead class="table-light">
        <tr>
          <th>Artikel</th>
          <th>Menge</th>
          <th>Preis pro Stück</th>
          <th>Gesamtpreis</th>
        </tr>
      </thead>
      <tbody>
  `;

  items.forEach((item) => {
    const lineTotal = item.price * item.quantity;
    table += `
      <tr>
        <td>${item.title}</td>
        <td>${item.quantity}</td>
        <td>${item.price.toFixed(2)} €</td>
        <td>${lineTotal.toFixed(2)} €</td>
      </tr>
    `;
  });

  table += `
      </tbody>
    </table>
  `;

  invoiceItems.innerHTML = table;
}

// Gesamtsumme berechnen
function calculateTotal(items) {
  let total = 0;
  items.forEach((item) => {
    total += item.price * item.quantity;
  });

  const totalDiv = document.getElementById("invoiceTotal");
  totalDiv.innerHTML = `Gesamtsumme: ${total.toFixed(2)} €`;
}
