// Helpers shared by every page, and the login/logout link in the header.
window.SlotSpot = {
  // Calls the API and returns a jQuery promise. data is sent as JSON.
  api: function (method, path, data) {
    return $.ajax({
      url: '/api' + path,
      method: method,
      dataType: 'json',
      contentType: 'application/json',
      data: data === undefined ? undefined : JSON.stringify(data)
    });
  },

  // The message from a failed request, or a generic fallback.
  errorText: function (xhr) {
    return (xhr.responseJSON && xhr.responseJSON.message) || 'Something went wrong. Please try again.';
  },

  // Shows a message box as 'ok' or 'error'.
  showMessage: function ($el, text, type) {
    $el.removeClass('ok error').addClass(type).text(text);
  },

  requireLogin: function (returnTo) {
    window.location.href = 'login.html?next=' + encodeURIComponent(returnTo);
  },

  // Today's date as YYYY-MM-DD in the browser's local time.
  today: function () {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
};

$(function () {
  SlotSpot.api('GET', '/auth/me').done(function (data) {
    if (data.user.role === 'owner') {
      $('#owner-link').prop('hidden', false);
    }
    $('#auth-link').text('Log out').attr('href', '#').on('click', function (e) {
      e.preventDefault();
      SlotSpot.api('POST', '/auth/logout').always(function () {
        window.location.href = 'index.html';
      });
    });
  });
});
