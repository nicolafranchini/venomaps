/**
 * Handles the dismissal of the VenoMaps admin review notice.
 * Data is passed from the server via the 'venomapsReviewNoticeData' object.
 */
document.addEventListener('DOMContentLoaded', function () {
    // Use the UNIQUE object name for this specific plugin.
    const noticeData = window.venomapsReviewNoticeData;

    // Check if the localized data object exists.
    if (typeof noticeData === 'undefined') {
        return;
    }

    const notice = document.getElementById(noticeData.notice_id);

    if (!notice) {
        return;
    }

    const dismissButtons = notice.querySelectorAll(
        '.' + noticeData.dismiss_class + ', .notice-dismiss'
    );

    dismissButtons.forEach(button => {
        button.addEventListener('click', function (event) {
            event.preventDefault();

            const formData = new FormData();
            formData.append('action', noticeData.action);
            formData.append('nonce', noticeData.nonce);

            notice.style.display = 'none';

            fetch(noticeData.ajax_url, {
                method: 'POST',
                body: formData
            })
            .catch(error => {
                console.error('Error dismissing review notice:', error);
                notice.style.display = 'block';
            });
        });
    });
});