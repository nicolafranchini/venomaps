/**
 * Handles the dismissal of the VenoMaps admin review notice.
 */
document.addEventListener('DOMContentLoaded', function () {
    const notice = document.getElementById('venomaps-review-notice');

    if (!notice) {
        return;
    }

    const dismissButtons = notice.querySelectorAll('.venomaps-dismiss-notice, .notice-dismiss');

    dismissButtons.forEach(button => {
        button.addEventListener('click', function (event) {
            event.preventDefault();

            // Prepare data for AJAX request
            const formData = new FormData();
            formData.append('action', 'venomaps_dismiss_review_notice');
            formData.append('nonce', venomapsReviewNotice.nonce);

            // Hide the notice immediately for better UX
            notice.style.display = 'none';

            // Send AJAX request to the server to save the dismissed state
            fetch(venomapsReviewNotice.ajax_url, {
                method: 'POST',
                body: formData
            })
            .catch(error => {
                console.error('Error dismissing VenoMaps review notice:', error);
                // If the request fails, show the notice again
                notice.style.display = 'block';
            });
        });
    });
});