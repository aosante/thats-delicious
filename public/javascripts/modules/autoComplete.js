const autoComplete = (addressInput, latInput, lngInput) => {
  if (!addressInput) return;
  const dropdown = new google.maps.places.Autocomplete(addressInput);
  dropdown.addListener('place_changed', () => {
    const place = dropdown.getPlace();
    latInput.value = place.geometry.location.lat();
    lngInput.value = place.geometry.location.lng();
  });
  // if someone hits enter on the address field, don't submit form
  addressInput.on('keydown', (e) => {
    if (e.keyCode === 13) e.preventDefault();
  });
};

export default autoComplete;
