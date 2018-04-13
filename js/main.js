(function() {

const APIKEY = 'd9999db4a33a6a734f1a2e0a30556290';

const locationFormContainer = document.querySelector("#location-form-container");
const locationInput = document.querySelector("#location-input");
const locationButton = document.querySelector("#location-button");
const errorContainer = document.querySelector("#error-container");
const stationsList = document.querySelector("#stations-list");
const weatherContainer = document.querySelector("#weather-container");
const messageContainer = document.querySelector("#message-container");
const warningContainer = document.querySelector("#warning-container");

// if user submits a location:
locationButton.addEventListener('click', function(event) {
  event.preventDefault();

  // clear the error box just in case
  errorContainer.textContent = '';

  // if the input value is not blank:
  if (locationInput.value) {

    let geocoder = new google.maps.Geocoder();

    // geocode the input value
    geocoder.geocode({
      address: locationInput.value
    }, function(results, status) {
      if (status === 'OK') {
        console.log(`Location searched: ${results[0].formatted_address}`)

        // check if the address is in Philly proper
        if (results[0].formatted_address.includes('Philadelphia, PA')){
          console.log('Location found and validated.');

          // clear DOM elements
          stationsList.innerHTML = '';
          weatherContainer.innerHTML = '';
          messageContainer.innerHTML = '';

          let map;
          let userLatLng = [
            results[0].geometry.location.lat(),
            results[0].geometry.location.lng()
          ];
          console.log(`User's coordinates are: ${userLatLng}`);

          let forecast = promiseToGetWeather();

          // draw map
          initMap(userLatLng);

          // get all stations
          let stations = promiseToGetStations(userLatLng);

        } else {
          // let the user try again
          console.log('Location not in Philadelphia.');
          errorContainer.innerHTML = ('<p>Please input a location in Philadelphia, PA.</p>');
        }
      } else {
        errorContainer.innerHTML = (`<p>Geocode error: ${status}</p>`);
      };
    });
  } else {
    // no blank submissions please
    errorContainer.innerHTML = ('<p>No location submitted.</p>');
  }
});

function promiseToGetWeather(){
  new Promise(function(resolve) {
    setTimeout(function() {
      forecast = getForecast();
      resolve(forecast);
    }, 300);
  })
  .then(function(forecast){
    renderForecast(forecast);
  })
  .catch(function(error) {
    console.error(error);
  });
};

function renderForecast(forecast){
  let weatherBox = document.createElement("DIV");

  // set up the html element and add it to the DOM
  weatherBox.setAttribute("id", "weather-box");
  console.log("Forecast data: ");
  console.log(forecast);

  // smooth out weather conditions and temperature
  let conditions = forecast.weather[0].description.charAt(0).toUpperCase() + forecast.weather[0].description.slice(1);
  let temp = Math.round((9/5) * (forecast.main.temp - 273) + 32);

  // render weather to a DOM element
  weatherBox.innerHTML = [
    `<img src=http://openweathermap.org/img/w/${forecast.weather[0].icon}.png alt="weather icon">`,
    `<h2>${temp}°</h2>`,
  ].join("");
  weatherContainer.appendChild(weatherBox);
  console.log('Weather rendered.');

  // check for bad weather
  // add <'04' || > in front of arguments to test
  if (forecast.weather[0].icon.includes('09' || '10' || '11' || '13')) {
    let messageBox = document.createElement("DIV");
    messageBox.setAttribute('id', 'weather-message');
    messageBox.setAttribute('class', 'message-warning');
    messageBox.innerHTML = (`<h2>${conditions} today.</h2>`);
    warningContainer.appendChild(messageBox);
    console.log('Weather warning rendered.');
  };
};

function getForecast(){
  return fetch(`http://api.openweathermap.org/data/2.5/weather?q=Philadelphia,USA&APPID=${APIKEY}`)
  .then(function(response) {
      if (response.ok) {
        return response.json();
      }
  })
  .catch(function(error) {
    console.error(error)
  });
};

function initMap(latLng) {
  // draw a map in night mode
    map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: latLng[0], lng: latLng[1]},
    zoom: 12,
    styles: [
      {elementType: 'geometry', stylers: [{color: '#242f3e'}]},
      {elementType: 'labels.text.stroke', stylers: [{color: '#242f3e'}]},
      {elementType: 'labels.text.fill', stylers: [{color: '#746855'}]},
      {
        featureType: 'administrative.locality',
        elementType: 'labels.text.fill',
        stylers: [{color: '#d59563'}]
      },
      {
        featureType: 'poi',
        elementType: 'labels.text.fill',
        stylers: [{color: '#d59563'}]
      },
      {
        featureType: 'poi.park',
        elementType: 'geometry',
        stylers: [{color: '#263c3f'}]
      },
      {
        featureType: 'poi.park',
        elementType: 'labels.text.fill',
        stylers: [{color: '#6b9a76'}]
      },
      {
        featureType: 'road',
        elementType: 'geometry',
        stylers: [{color: '#38414e'}]
      },
      {
        featureType: 'road',
        elementType: 'geometry.stroke',
        stylers: [{color: '#212a37'}]
      },
      {
        featureType: 'road',
        elementType: 'labels.text.fill',
        stylers: [{color: '#9ca5b3'}]
      },
      {
        featureType: 'road.highway',
        elementType: 'geometry',
        stylers: [{color: '#746855'}]
      },
      {
        featureType: 'road.highway',
        elementType: 'geometry.stroke',
        stylers: [{color: '#1f2835'}]
      },
      {
        featureType: 'road.highway',
        elementType: 'labels.text.fill',
        stylers: [{color: '#f3d19c'}]
      },
      {
        featureType: 'transit',
        elementType: 'geometry',
        stylers: [{color: '#2f3948'}]
      },
      {
        featureType: 'transit.station',
        elementType: 'labels.text.fill',
        stylers: [{color: '#d59563'}]
      },
      {
        featureType: 'water',
        elementType: 'geometry',
        stylers: [{color: '#17263c'}]
      },
      {
        featureType: 'water',
        elementType: 'labels.text.fill',
        stylers: [{color: '#515c6d'}]
      },
      {
        featureType: 'water',
        elementType: 'labels.text.stroke',
        stylers: [{color: '#17263c'}]
      }
    ]
  });
};

function promiseToGetStations(latLng){
  new Promise(function(resolve) {
    setTimeout(function() {
      stations = getStations();
      resolve(stations);
    }, 300);
  })
  .then(function(stations){
    setTimeout(function() {
      let closestStations = getClosestStations(latLng, stations);
      let closestStationsMarkers = markClosestStations(latLng, closestStations);
      listClosestStations(closestStations, closestStationsMarkers);
      console.log('Stations rendered.');
    }, 300);
  })
  .catch(function(error) {
    console.error(error);
  });
};

function getStations(){
  return fetch('https://www.rideindego.com/stations/json/')
  .then(function(response) {
      if (response.ok) {
        return response.json();
      }
  })
  .catch(function(error) {
    console.error(error)
  });
};

function getClosestStations(latLng, stationsObject) {
  // clear the message container
  messageContainer.innerHTML = '';

  let userLatLng = new google.maps.LatLng(latLng[0], latLng[1]);
  let result = [];

  // first try to get all Indego stations within walking distance
  for (let station in stationsObject.features) {
    let stationLatLng = new google.maps.LatLng(
      stationsObject.features[station].geometry.coordinates[1],
      stationsObject.features[station].geometry.coordinates[0]
    );

    let distance = google.maps.geometry.spherical.computeDistanceBetween(userLatLng, stationLatLng);

    // grab all Indego stations within one kilometer
    if (distance < 1000) {
      result.push(stationsObject.features[station])
    };
  };

  if (result.length >= 3) {
    let messageBox = document.createElement('DIV');
    messageBox.setAttribute('class', 'message-friendly');
    messageBox.innerHTML = [
      `<p>${result.length} stations found within walking distance.</p>`,
      `<p>Click on a station below to highlight it on the map.</p>`
    ].join('');
    messageContainer.appendChild(messageBox);
  };

  if (result.length <= 2) {
    // no stations found within 1km, so let's grab the closest by distance
    // map stations to a temporary array with index and sort value
    let mappedStations = stationsObject.features.map(function(station, index) {
      let stationLatLng = new google.maps.LatLng(
        stationsObject.features[index].geometry.coordinates[1],
        stationsObject.features[index].geometry.coordinates[0]
      );

      // sort value with Google Maps API's distance calculation
      return { index: index, value: google.maps.geometry.spherical.computeDistanceBetween(userLatLng, stationLatLng) };
    });

    // sort mapped array
    let sortedStations = mappedStations
      .sort(function(a, b) {
        if (a.value > b.value) {
          return 1;
        };
        if (a.value < b.value) {
          return -1;
        };
        return 0;
      })
      .map(function(station){
        return stationsObject.features[station.index];
      });

    // return a number of closest stations
    let closestStationCount = 3;
    // prepare to return this number of stations
    for(let i = 0; i < closestStationCount; i++){
      result[i] = sortedStations[i];
    };

    // Render quantity of stations found to DOM
    let messageBox = document.createElement('DIV');
    messageBox.setAttribute('class', 'message');
    messageBox.innerHTML = [
      `<p>These ${closestStationCount} stations are closest to you.</p>`,
      '<p>Click on a station below to highlight it on the map.</p>'
    ].join('');
    messageContainer.appendChild(messageBox);
  };

  return result;
};

function markClosestStations(latLng, stationsObject){
  console.log('Stations to be marked:');
  console.log(stationsObject);

  let markerArray = [];
  // mark the user's location
  let userMarker = new google.maps.Marker({
          position: {lat: latLng[0], lng:latLng[1]},
          map: map,
          icon: 'http://maps.google.com/mapfiles/kml/pal2/icon2.png',
          title: 'User Marker'
        });

  // add the user's marker to the master list of markers
  markerArray.push(userMarker);

  // mark each closest station
  Object.keys(stationsObject).map(function(objectKey, index) {
    let coordinates = {
      lat: stationsObject[index].geometry.coordinates[1],
      lng: stationsObject[index].geometry.coordinates[0]
    };

    let bikes = stationsObject[index].properties.bikesAvailable;
    let docks = stationsObject[index].properties.docksAvailable;

    // change the icon if few bikes or docks available
    let icon = 'http://maps.google.com/mapfiles/ms/micons/cycling.png';
    if (bikes <= 3 || docks <= 3) {
      icon = 'http://maps.google.com/mapfiles/kml/pal3/icon41.png'
    };

    let marker = new google.maps.Marker({
            position: coordinates,
            map: map,
            icon: icon,
            title: `Closest station ${index}`
    });

    // add each marker to the master list of markers
    markerArray.push(marker);

    // click on a marker -> highlight a station
    marker.addListener('click', function() {
      // toggle "active" class for styling
      let active = document.querySelector('.active');
      if (active) {
        active.classList.remove('active');
      };
      document.querySelector(`#btn-${index}`).classList.toggle('active');
    });
  });

  // now for some quality of life map adjustments 😊
  // let the markers dictate the map bounds
  let bounds = new google.maps.LatLngBounds();
  for(i=0;i<markerArray.length;i++) {
    bounds.extend(markerArray[i].getPosition());
  }
  // center the map to the markers
  map.setCenter(bounds.getCenter());
  // fit the map to the bounds
  map.fitBounds(bounds);
  // remove one zoom level to unhide any markers from the edges.
  map.setZoom(map.getZoom()-1);
  // set a comfortable zoom
  if(map.getZoom()> 15){
    map.setZoom(15);
  }
  return markerArray;
};

function listClosestStations(stationsObject, markerArray){
  // clear the stations list DOM element
  stationsList.innerHTML = '';

  // iterate through each closest station
  Object.keys(stationsObject).map(function(objectKey, index) {
    let stationsListItem = document.createElement("LI");

    // set up the html element and add it to the DOM
    stationsListItem.setAttribute("id", `btn-${objectKey}`);
    stationsListItem.setAttribute("value", `${objectKey}`);
    stationsListItem.innerHTML = [
      `<h4>${stationsObject[index].properties.name}</h4>`,
      `<p>${stationsObject[index].properties.addressStreet}</p>`,
      `<p><span>bikes available: ${stationsObject[index].properties.bikesAvailable}</span> | `,
      `<span>open docks: ${stationsObject[index].properties.docksAvailable}</span></p>`,
    ].join('');
    stationsList.appendChild(stationsListItem);

    // add a click listener to each list item
    stationsListItem.addEventListener('click', function(){
      // toggle "active" class for styling
      let active = document.querySelector('.active');
      if (active) {
        active.classList.remove('active');
        markerArray[index+1].setAnimation(null);
      }
      event.currentTarget.classList.toggle('active');
      // make the marker bounce for 3 seconds
      markerArray[index+1].setAnimation(google.maps.Animation.BOUNCE);
      window.setTimeout(function() {
        markerArray[index+1].setAnimation(null);
      }, 2000);
    })
  });
};

})();
