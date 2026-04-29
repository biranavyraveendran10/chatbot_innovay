document.addEventListener("DOMContentLoaded", function () {

    const form = document.getElementById("loginForm");
    const inputs = document.querySelectorAll("input");

    // Smooth focus effect
    inputs.forEach(input => {
        input.addEventListener("focus", () => {
            input.style.borderColor = "#10a37f";
        });

        input.addEventListener("blur", () => {
            input.style.borderColor = "#4a4a4a";
        });
    });

    // Simple front-end validation
    form.addEventListener("submit", function (e) {
        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value.trim();

        if (username.length < 3) {
            alert("Username must be at least 3 characters long.");
            e.preventDefault();
        }

        if (password.length < 4) {
            alert("Password must be at least 4 characters long.");
            e.preventDefault();
        }
    });

});
