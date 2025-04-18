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
      body: JSON.stringify({ action: "loginWithToken", token })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          console.log("Auto-Login mit Cookie erfolgreich");
          location.reload(); // Seite neu laden, damit Header etc. neu gerendert wird
        } else {
          console.log("Auto-Login mit Cookie fehlgeschlagen:", data.error);
        }
      });
  }


  // === Header laden ===
  fetch("../components/header.html")
    .then(res => res.text())
    .then(data => {
      const wrapper = document.createElement("div");
      wrapper.innerHTML = data;
      document.body.insertBefore(wrapper, document.body.firstChild);
     // renderMenu(); // NEU: erst Menü laden, wenn Header eingefügt wurde
    });

  // === Footer laden ===
  fetch("../components/footer.html")
    .then(res => res.text())
    .then(data => {
      const wrapper = document.createElement("div");
      wrapper.innerHTML = data;
      const footer = wrapper.querySelector("footer");
      if (footer) footer.classList.add("mt-auto");
      document.body.appendChild(wrapper);
    });

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
        password: $("#passwort").val()
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
            window.location.href = "login.html";
          } else {
            $("#registerMessage").text(response.error || "Registrierung fehlgeschlagen.");
          }
        },
        error: function () {
          $("#registerMessage").text("Fehler bei der Registrierung.");
            }
          });
      });
      }
    });
  

  // === LOGIN ===
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const data = {
        action: "login",
        username: $("#username").val(),
        password: $("#password").val(),
        rememberMe: $("#rememberMe").is(":checked") // Checkbox
      };

      $.ajax({
        url: "../../backend/logic/requestHandler.php",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify(data),
        success: function (response) {
          if (response.success) {
            if (data.rememberMe) {
              const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString();
              document.cookie = `remember_token=${response.remember_token}; expires=${expires}; path=/;`;
            }
            window.location.href = "index.html";
          } else {
            $("#loginMessage").text(response.error || "Login fehlgeschlagen.");
          }
        },
        error: function () {
          $("#loginMessage").text("Fehler beim Login.");
        }
      });
    });
  }



  // === DYNAMISCHE NAVIGATION ===
  fetch("../../backend/logic/requestHandler.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "getSessionUser" })
  })
  .then((res) => res.json())
  .then((data) => {
    const nav = document.getElementById("user-nav");
    if (!nav) return;

    if (!data.username) {
      // Gast
      nav.innerHTML = `
        <li class="nav-item"><a class="nav-link" href="index.html">Home</a></li>
        <li class="nav-item"><a class="nav-link" href="login.html">Login</a></li>
        <li class="nav-item"><a class="nav-link" href="register.html">Registrieren</a></li>
      `;
    } else if (data.is_admin) {
      // Admin
      nav.innerHTML = `
        <li class="nav-item"><a class="nav-link" href="index.html">Home</a></li>
        <li class="nav-item"><a class="nav-link" href="editProducts.html">Produkte bearbeiten</a></li>
        <li class="nav-item"><a class="nav-link" href="editCustomer.html">Kunden bearbeiten</a></li>
        <li class="nav-item"><span class="nav-link disabled">👑 ${data.username}</span></li>
        <li class="nav-item"><a class="nav-link" href="#" id="logout-link">Logout</a></li>
      `;
    } else {
      // Normaler User
      nav.innerHTML = `
        <li class="nav-item"><a class="nav-link" href="index.html">Home</a></li>
        <li class="nav-item"><a class="nav-link" href="products.html">Produkte</a></li>
        <li class="nav-item"><a class="nav-link" href="myAcc.html">Mein Konto</a></li>
        <li class="nav-item"><a class="nav-link" href="cart.html">Warenkorb</a></li>
        <li class="nav-item"><span class="nav-link disabled">👋 ${data.username}</span></li>
        <li class="nav-item"><a class="nav-link" href="#" id="logout-link">Logout</a></li>
      `;
    }

    // === LOGOUT FUNKTION ===
    const logoutBtn = document.getElementById("logout-link");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        fetch("../../backend/logic/requestHandler.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "logout" })
        }).then(() => {
          document.cookie = "remember_token=; Max-Age=0; path=/;";
          window.location.href = "index.html";
        });
      });
    }


    //ebook laden
    const ebookContainer = document.getElementById("ebook-container");
    const categorySelect = document.getElementById("categorySelect");
    const ebookTemplate = document.getElementById("ebook-card-template");
    
    if (ebookContainer && categorySelect && ebookTemplate) {
    
      loadEbooks(categorySelect.value);
    
      categorySelect.addEventListener("change", () => {
        loadEbooks(categorySelect.value); // Bei Auswahlwechsel werden neue E-Books geladen
      });
    }
    
    function loadEbooks(category = null) {
      const requestData = {
        action: "getEbooks"
      };
    
      if (category) {
        requestData.category = category;
      }
    
      fetch("../../backend/logic/requestHandler.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData)
      })
        .then((res) => res.json())
        .then((data) => {
          ebookContainer.innerHTML = ""; // E-Books leeren
    
          data.forEach((ebookData) => {
            const card = ebookTemplate.cloneNode(true);
            card.classList.remove("d-none");
            card.removeAttribute("id");
    
            const img = card.querySelector("img");
            img.src = "../../" + ebookData.image;
            img.alt = ebookData.title;
    
            card.querySelector(".card-title").textContent = ebookData.title;
            card.querySelector(".ebook-price").textContent = ebookData.price.toFixed(2);
    
            ebookContainer.appendChild(card);
          });
        })
        .catch((err) => {
          console.error("Fehler beim Laden der E-Books:", err);
        });
    }

    
    

});

