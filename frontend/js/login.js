document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  if (!loginForm) return;

  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();
    // Formulardaten sammeln
    const data = {
      action: "login",
      username: $("#username").val(),
      password: $("#password").val(),
      rememberMe: $("#rememberMe").is(":checked"),
    };
     // AJAX-Request zum Login
    $.ajax({
      url: "../../backend/logic/requestHandler.php",
      type: "POST",
      contentType: "application/json",
      data: JSON.stringify(data),
      success: function (response) {
        if (response.success) {
        // Gast-Warenkorb löschen
          localStorage.removeItem("cart");
           // Wenn "Login merken" aktiviert → Cookie setzen
          if (data.rememberMe) {
            const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString();
            document.cookie = `remember_token=${response.remember_token}; expires=${expires}; path=/;`;
          }
           // Hinweis für Auto-Login-Redirect
          localStorage.setItem("justLoggedIn", "true");
          // Weiterleitung zur Startseite
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
});
