// Lists the customer's upcoming bookings and lets them cancel.
$(function () {
  const $list = $('#bookings');
  const $msg = $('#msg');
  const CANCEL_CUTOFF_MS = 2 * 60 * 60 * 1000;

  function formatWhen(sqlDateTime) {
    return new Date(sqlDateTime.replace(' ', 'T')).toLocaleString('en-IN', {
      weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  }

  function load() {
    SlotSpot.api('GET', '/bookings/mine').done(function (data) {
      $list.empty();
      if (data.bookings.length === 0) {
        $list.append($('<p class="muted">').text('You have no upcoming bookings.'));
        return;
      }
      data.bookings.forEach(function (b) {
        const startsAt = new Date(b.start_at.replace(' ', 'T'));
        const canCancel = startsAt - new Date() > CANCEL_CUTOFF_MS;

        const $panel = $('<div class="panel">');
        $panel.append(
          $('<strong>').text(b.service_name + ' at ' + b.business_name),
          $('<div class="muted">').text(formatWhen(b.start_at) + ', ' + b.address),
          $('<div>').append(
            $('<button type="button" class="danger cancel">')
              .text('Cancel booking')
              .data('id', b.id)
              .prop('disabled', !canCancel)
          )
        );
        if (!canCancel) {
          $panel.append($('<p class="muted">').text('Cancellation closes 2 hours before the start.'));
        }
        $list.append($panel);
      });
    }).fail(function (xhr) {
      if (xhr.status === 401) {
        return SlotSpot.requireLogin('my-bookings.html');
      }
      SlotSpot.showMessage($msg, SlotSpot.errorText(xhr), 'error');
    });
  }

  $list.on('click', '.cancel', function () {
    if (!confirm('Cancel this booking?')) return;
    const id = $(this).data('id');
    SlotSpot.api('POST', '/bookings/' + id + '/cancel')
      .done(function () {
        SlotSpot.showMessage($msg, 'Booking cancelled.', 'ok');
        load();
      })
      .fail(function (xhr) {
        SlotSpot.showMessage($msg, SlotSpot.errorText(xhr), 'error');
      });
  });

  load();
});
