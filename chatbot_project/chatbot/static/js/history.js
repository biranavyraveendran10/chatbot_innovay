document.addEventListener("DOMContentLoaded", function () {

    // Confirm logout
    const logoutBtn = document.querySelector(".logout-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", function (e) {
            if (!confirm("Are you sure you want to sign out?")) {
                e.preventDefault();
            }
        });
    }

    // Fade-in animation
    const items = document.querySelectorAll(".history-item");
    items.forEach((item, index) => {
        item.style.opacity = "0";
        item.style.transform = "translateY(10px)";
        setTimeout(() => {
            item.style.transition = "all 0.4s ease";
            item.style.opacity = "1";
            item.style.transform = "translateY(0)";
        }, index * 80);
    });

});
