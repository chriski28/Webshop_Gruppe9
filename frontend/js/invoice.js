$(function () {
  const params = new URLSearchParams(window.location.search);
  const orderId = params.get("order_id");
  if (!orderId) {
    alert("Keine Bestell-ID übergeben");
    return;
  }

  // Fetch invoice data
  fetch(`../../backend/logic/requestHandler.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "getInvoiceData",
      order_id: orderId,
    }),
  })
    .then((r) => r.json())
    .then((res) => {
      if (res.error) {
        alert(res.error);
        return;
      }
      // Fill in the fields
      $("#invoiceNumber").text(res.invoice_number);
      $("#orderId").text(res.order.order_id);
      $("#orderDate").text(res.order.order_date);

      $("#customerAddress").html(`
        ${res.user.salutation} ${res.user.first_name} ${res.user.last_name}<br>
        ${res.user.address}<br>
        ${res.user.postal_code} ${res.user.city}
      `);

      const $tbody = $("#invoiceItems").empty();
      res.items.forEach((item) => {
        $tbody.append(`
          <tr>
            <td>${item.title}</td>
            <td>${item.author}</td>
            <td>${parseFloat(item.price).toFixed(2)} €</td>
            <td>${item.quantity}</td>
            <td>${parseFloat(item.line_total).toFixed(2)} €</td>
          </tr>
        `);
      });
      $("#invoiceTotal").text(
        parseFloat(res.order.total_price).toFixed(2) + " €"
      );
    });
});
