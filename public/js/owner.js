// Owner dashboard: today's schedule, services, and opening hours.
$(function () {
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const $msg = $('#msg');
  let businessId = null;

  SlotSpot.api('GET', '/owner/business').done(function (data) {
    businessId = data.business.id;
    $('#business-name').text(data.business.name);
    $('#schedule-date').val(SlotSpot.today());
    loadSchedule();
    loadDetails();
    setInterval(loadSchedule, 30000);
  }).fail(function (xhr) {
    if (xhr.status === 401) return SlotSpot.requireLogin('owner.html');
    $('#owner-panels').hide();
    SlotSpot.showMessage($msg, SlotSpot.errorText(xhr), 'error');
  });

  $('#schedule-date').on('change', loadSchedule);

  function loadSchedule() {
    if (!businessId) return;
    SlotSpot.api('GET', '/owner/schedule?date=' + $('#schedule-date').val()).done(function (data) {
      const $body = $('#schedule').empty();
      if (data.bookings.length === 0) {
        $body.append($('<tr>').append($('<td colspan="3" class="muted">').text('No bookings on this day.')));
        return;
      }
      data.bookings.forEach(function (b) {
        $body.append($('<tr>').append(
          $('<td>').text(b.start_at.slice(11, 16)),
          $('<td>').text(b.service_name),
          $('<td>').text(b.customer_name)
        ));
      });
    });
  }

  function loadDetails() {
    SlotSpot.api('GET', '/businesses/' + businessId).done(function (data) {
      renderServices(data.services);
      renderHours(data.hours);
    });
  }

  // Services

  function renderServices(services) {
    const $body = $('#services').empty();
    services.forEach(function (s) {
      const $edit = $('<button type="button" class="secondary">').text('Edit').on('click', function () { editService(s); });
      const $del = $('<button type="button" class="danger">').text('Delete').on('click', function () { deleteService(s); });
      $body.append($('<tr>').append(
        $('<td>').text(s.name),
        $('<td>').text(s.duration_minutes + ' min'),
        $('<td>').text('₹' + s.price),
        $('<td>').append($edit, $del)
      ));
    });
  }

  function editService(s) {
    $('#service-id').val(s.id);
    $('#service-name').val(s.name);
    $('#service-duration').val(s.duration_minutes);
    $('#service-price').val(s.price);
    $('#service-save').text('Save changes');
    $('#service-cancel').prop('hidden', false);
    $('#service-name').trigger('focus');
  }

  function resetServiceForm() {
    $('#service-form')[0].reset();
    $('#service-id').val('');
    $('#service-save').text('Add service');
    $('#service-cancel').prop('hidden', true);
  }

  function deleteService(s) {
    if (!confirm('Delete "' + s.name + '"? This is only possible if it has no bookings.')) return;
    SlotSpot.api('DELETE', '/owner/services/' + s.id)
      .done(function () {
        SlotSpot.showMessage($msg, 'Service deleted.', 'ok');
        loadDetails();
      })
      .fail(function (xhr) {
        SlotSpot.showMessage($msg, SlotSpot.errorText(xhr), 'error');
      });
  }

  $('#service-cancel').on('click', resetServiceForm);

  $('#service-form').on('submit', function (e) {
    e.preventDefault();
    const id = $('#service-id').val();
    const data = {
      name: $('#service-name').val(),
      duration: Number($('#service-duration').val()),
      price: Number($('#service-price').val())
    };
    const request = id
      ? SlotSpot.api('PUT', '/owner/services/' + id, data)
      : SlotSpot.api('POST', '/owner/services', data);

    request.done(function () {
      resetServiceForm();
      SlotSpot.showMessage($msg, 'Service saved.', 'ok');
      loadDetails();
    }).fail(function (xhr) {
      SlotSpot.showMessage($msg, SlotSpot.errorText(xhr), 'error');
    });
  });

  // Opening hours

  function renderHours(hours) {
    const $box = $('#hours').empty();
    for (let weekday = 0; weekday < 7; weekday++) {
      const row = hours.find(function (h) { return h.weekday === weekday; }) || {};
      const open = Boolean(row.opens_at);
      $box.append(
        $('<div class="hours-row">').attr('data-weekday', weekday).append(
          $('<span>').text(DAYS[weekday]),
          $('<input type="checkbox" class="open-toggle">').prop('checked', open),
          $('<input type="time" class="opens">').val(open ? row.opens_at.slice(0, 5) : '10:00').prop('disabled', !open),
          $('<input type="time" class="closes">').val(open ? row.closes_at.slice(0, 5) : '19:00').prop('disabled', !open)
        )
      );
    }
  }

  $('#hours').on('change', '.open-toggle', function () {
    $(this).closest('.hours-row').find('.opens, .closes').prop('disabled', !this.checked);
  });

  $('#hours-form').on('submit', function (e) {
    e.preventDefault();
    const hours = [];
    $('#hours .hours-row').each(function () {
      const $row = $(this);
      const open = $row.find('.open-toggle').is(':checked');
      hours.push({
        weekday: Number($row.attr('data-weekday')),
        opens: open ? $row.find('.opens').val() : null,
        closes: open ? $row.find('.closes').val() : null
      });
    });

    SlotSpot.api('PUT', '/owner/hours', { hours: hours })
      .done(function () {
        SlotSpot.showMessage($msg, 'Opening hours saved.', 'ok');
        loadDetails();
      })
      .fail(function (xhr) {
        SlotSpot.showMessage($msg, SlotSpot.errorText(xhr), 'error');
      });
  });
});
