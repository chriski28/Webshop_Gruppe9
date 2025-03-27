// frontend/js/script.js

document.addEventListener("DOMContentLoaded", () => {
    // Header einfügen
    fetch("../components/header.html")
      .then(res => res.text())
      .then(data => {
        const wrapper = document.createElement("div");
        wrapper.innerHTML = data;
        document.body.insertBefore(wrapper, document.body.firstChild);
      });
  
    // Footer einfügen
    fetch("../components/footer.html")
    .then(res => res.text())
    .then(data => {
        const wrapper = document.createElement("div");
        wrapper.innerHTML = data;

        const footer = wrapper.querySelector("footer");
        if (footer) footer.classList.add("mt-auto"); // sorgt dafür, dass der Footer nach unten rutscht

        document.body.appendChild(wrapper);
    });


  });
  