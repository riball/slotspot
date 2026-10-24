// Business search page: filters, live results, and links to each business.
$(function () {
  const $results = $('#results');
  let timer = null;

  SlotSpot.api('GET', '/businesses/filters').done(function (filters) {
    filters.categories.forEach(function (c) {
      $('#category').append($('<option>').val(c).text(c));
    });
    filters.areas.forEach(function (a) {
      $('#area').append($('<option>').val(a).text(a));
    });
  });

  function search() {
    const query = $.param({
      q: $('#q').val(),
      category: $('#category').val(),
      area: $('#area').val()
    });

    SlotSpot.api('GET', '/businesses?' + query).done(function (data) {
      $results.empty();
      if (data.businesses.length === 0) {
        $results.append($('<p class="muted">').text('No businesses match those filters.'));
        return;
      }
      data.businesses.forEach(function (b) {
        const $card = $('<a class="business-card">').attr('href', 'business.html?id=' + b.id);
        $card.append(
          $('<strong>').text(b.name),
          $('<div class="muted">').text(b.category + ', ' + b.area)
        );
        $results.append($card);
      });
    }).fail(function (xhr) {
      $results.empty().append($('<p class="muted">').text(SlotSpot.errorText(xhr)));
    });
  }

  // Wait 300 ms after typing stops before searching (debouncing)
  $('#q').on('input', function () {
    clearTimeout(timer);
    timer = setTimeout(search, 300);
  });
  $('#category, #area').on('change', search);

  search();
});
