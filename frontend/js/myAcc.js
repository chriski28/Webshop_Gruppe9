document.addEventListener("DOMContentLoaded", async () => {
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

  // === Rechnung generieren ===
  // when a Rechnung‐button is clicked, open invoice.html in a new tab
  $(document).on("click", ".btn-print-invoice", function () {
    const orderId = $(this).data("order-id");
    if (!orderId) return;
    window.open(`invoice.html?order_id=${orderId}`, "_blank");
  });
});
