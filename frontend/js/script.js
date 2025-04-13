// frontend/js/script.js

document.addEventListener("DOMContentLoaded", () => {
  // Header einfügen
  fetch("../components/header.html")
    .then((res) => res.text())
    .then((data) => {
      const wrapper = document.createElement("div");
      wrapper.innerHTML = data;
      document.body.insertBefore(wrapper, document.body.firstChild);
    });

  // Footer einfügen
  fetch("../components/footer.html")
    .then((res) => res.text())
    .then((data) => {
      const wrapper = document.createElement("div");
      wrapper.innerHTML = data;

      const footer = wrapper.querySelector("footer");
      if (footer) footer.classList.add("mt-auto"); // sorgt dafür, dass der Footer nach unten rutscht

      document.body.appendChild(wrapper);
    });
});

// === GET USER FORM HANDLER ===
$("#getUserForm").on("submit", function (e) {
  e.preventDefault();

  const userId = $("#userId").val();

  $.ajax({
    url: "/Webshop_Gruppe9/backend/logic/requestHandler.php",
    type: "POST",
    contentType: "application/json",
    data: JSON.stringify({ action: "getUser", id: userId }),
    success: function (response) {
      $("#getUserResult").text(JSON.stringify(response, null, 2));
    },
    error: function (xhr, status, error) {
      $("#getUserResult").text("Error: " + error);
    },
  });
});

// === CREATE USER FORM HANDLER ===
$("#createUserForm").on("submit", function (e) {
  e.preventDefault();

  const data = {
    action: "createUser",
    first_name: $("#newFirstName").val(),
    last_name: $("#newLastName").val(),
    address: $("#newAddress").val(),
    postal_code: $("#newPostalCode").val(),
    city: $("#newCity").val(),
    email: $("#newEmail").val(),
    username: $("#newUsername").val(),
    password: $("#newPassword").val(),
  };

  $.ajax({
    url: "/Webshop_Gruppe9/backend/logic/requestHandler.php",
    type: "POST",
    contentType: "application/json",
    data: JSON.stringify(data),
    success: function (response) {
      $("#createUserResult").text(JSON.stringify(response, null, 2));
      $("#createUserForm")[0].reset();
    },
    error: function (xhr, status, error) {
      $("#createUserResult").text("Error: " + error);
    },
  });
});

// === GET ALL USERS BUTTON HANDLER ===
$("#getAllUsersButton").on("click", function () {
  $.ajax({
    url: "/Webshop_Gruppe9/backend/logic/requestHandler.php",
    type: "POST",
    contentType: "application/json",
    data: JSON.stringify({ action: "getAllUsers" }),
    success: function (response) {
      $("#getAllUsersResult").text(JSON.stringify(response, null, 2));
    },
    error: function (xhr, status, error) {
      $("#getAllUsersResult").text("Error: " + error);
    },
  });
});
