document.addEventListener("DOMContentLoaded", () => {
  const registerForm = document.getElementById("registerForm");
  if (!registerForm) return;

  registerForm.addEventListener("submit", function (e) {
    e.preventDefault();
    // Formulardaten sammeln
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

    // Passwort bestätigen
    if (data.password !== password2) {
      $("#registerMessage").text("Passwörter stimmen nicht überein.");
      return;
    }
    // AJAX-Request zur Registrierung
    $.ajax({
      url: "../../backend/logic/requestHandler.php",
      type: "POST",
      contentType: "application/json",
      data: JSON.stringify(data),
      success: function (response) {
        if (response.success) {
        // Direkt im Anschluss automatisch einloggen
          const loginData = {
            action: "login",
            username: data.username,
            password: data.password,
            rememberMe: false,
          };
          // Auto-Login nach erfolgreicher Registrierung
          fetch("../../backend/logic/requestHandler.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(loginData),
          })
            .then((res) => res.json())
            .then((loginResp) => {
              if (loginResp.success) {
                // Warenkorb vom Gast übernehmen
                const guestCart = JSON.parse(localStorage.getItem("cart") || "[]");
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
          $("#registerMessage").text(response.error || "Registrierung fehlgeschlagen.");
        }
      },
      error: function () {
        $("#registerMessage").text("Fehler bei der Registrierung.");
      },
    });
  });
});
