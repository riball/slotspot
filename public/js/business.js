// Business page: pick a service and date, see the slot grid, and book a slot.
$(function () {
  const businessId = Number(new URLSearchParams(window.location.search).get('id'));
  const $msg = $('#msg');
  const $slots = $('#slots');
  let services = [];

  if (!businessId) {
    SlotSpot.showMessage($msg, 'Choose a business from the search page.', 'error');
    return;
  }

  $('#date').attr('min', SlotSpot.today()).val(SlotSpot.today());

  SlotSpot.api('GET', '/businesses/' + businessId).done(function (data) {
    services = data.services;
    $('#biz-name').text(data.business.name);
    $('#biz-place').text(data.business.category + ', ' + data.business.area);
    $('#biz-desc').text(data.business.address + '. ' + (data.business.description || ''));

    $('#service').empty();
    services.forEach(function (s) {
      $('#service').append($('<option>').val(s.id).text(s.name + ' (' + s.duration_minutes + ' min, ₹' + s.price + ')'));
    });
    loadSlots();
  }).fail(function (xhr) {
    SlotSpot.showMessage($msg, SlotSpot.errorText(xhr), 'error');
  });

  $('#service, #date').on('change', loadSlots);

  function selectedService() {
    return services.find(function (s) { return String(s.id) === $('#service').val(); });
  }

  function loadSlots() {
    const service = selectedService();
    const date = $('#date').val();
    if (!service || !date) return;

    SlotSpot.api('GET', '/businesses/' + businessId + '/slots?service=' + service.id + '&date=' + date)
      .done(renderSlots)
      .fail(function (xhr) {
        $slots.empty();
        SlotSpot.showMessage($msg, SlotSpot.errorText(xhr), 'error');
      });
  }

  function renderSlots(data) {
    $slots.empty();
    if (data.slots.length === 0) {
      $slots.append($('<p class="muted">').text('No openings on this day.'));
      return;
    }
    data.slots.forEach(function (slot) {
      $slots.append(
        $('<button type="button" class="slot">').text(slot.time).prop('disabled', !slot.available)
      );
    });
  }

  $slots.on('click', '.slot', function () {
    const time = $(this).text();
    const service = selectedService();
    const date = $('#date').val();
    if (!confirm('Book ' + service.name + ' on ' + date + ' at ' + time + '?')) return;

    SlotSpot.api('POST', '/bookings', { businessId: businessId, serviceId: service.id, startAt: date + ' ' + time })
      .done(function () {
        SlotSpot.showMessage($msg, 'Booked. You can see it under My bookings.', 'ok');
        loadSlots();
      })
      .fail(function (xhr) {
        if (xhr.status === 401) {
          return SlotSpot.requireLogin(window.location.pathname + window.location.search);
        }
        // The slot may have been taken a moment ago, so refresh the grid either way
        SlotSpot.showMessage($msg, SlotSpot.errorText(xhr), 'error');
        loadSlots();
      });
  });
});
