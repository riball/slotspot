// Login and registration. After success, return to the page the user came from.
$(function () {
  const next = new URLSearchParams(window.location.search).get('next') || 'index.html';
  // Only allow a local page path, never another site
  const target = /^[\w./?=&%-]+$/.test(next) && !next.startsWith('//') ? next : 'index.html';

  $('#login-form').on('submit', function (e) {
    e.preventDefault();
    SlotSpot.api('POST', '/auth/login', {
      email: $('#login-email').val(),
      password: $('#login-password').val()
    }).done(function () {
      window.location.href = target;
    }).fail(function (xhr) {
      SlotSpot.showMessage($('#login-msg'), SlotSpot.errorText(xhr), 'error');
    });
  });

  $('#register-form').on('submit', function (e) {
    e.preventDefault();
    SlotSpot.api('POST', '/auth/register', {
      name: $('#reg-name').val(),
      email: $('#reg-email').val(),
      password: $('#reg-password').val()
    }).done(function () {
      window.location.href = target;
    }).fail(function (xhr) {
      SlotSpot.showMessage($('#register-msg'), SlotSpot.errorText(xhr), 'error');
    });
  });
});
