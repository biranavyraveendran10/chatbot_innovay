document.addEventListener("DOMContentLoaded", function () {

    const form = document.getElementById("registerForm");
    const password = document.getElementById("password");
    const confirmPassword = document.getElementById("confirm_password");

    form.addEventListener("submit", function (e) {

        if (password.value.length < 6) {
            alert("Password must be at least 6 characters long.");
            e.preventDefault();
            return;
        }

        if (password.value !== confirmPassword.value) {
            alert("Passwords do not match!");
            e.preventDefault();
            return;
        }
    });

});
