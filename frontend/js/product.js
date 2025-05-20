document.addEventListener("DOMContentLoaded", async () => {

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


});