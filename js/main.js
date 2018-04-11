(function() {

const locationFormContainer = document.querySelector("#location-form-container");
const locationInput = document.querySelector("#location-input");
const locationButton = document.querySelector("#location-button");
const errorContainer = document.querySelector("#error-container");
const stationsList = document.querySelector("#stations-list");
const weatherContainer = document.querySelector("#weather-container");
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

          let map;

          // clear DOM elements
          stationsList.innerHTML = '';
          weatherContainer.innerHTML = '';
          warningContainer.innerHTML = '';

          console.log('Location found and validated.');
          let userLatLng = [
            results[0].geometry.location.lat(),
            results[0].geometry.location.lng()
          ];
          console.log(`User's coordinates are: ${userLatLng}`);

          let forecast = promiseToGetWeather();

          // draw map
          initMap(userLatLng);

          // grab closest stations
          let closestStations = getClosestStations(userLatLng);
          console.log('Closest stations:');
          console.log(closestStations);

          // add user and closest station markers to map
          let markers = markClosestStations(userLatLng, closestStations);
          console.log('markers: ');
          console.log(markers);

          // render a list of closest stations
          listClosestStations(closestStations, markers);

        } else {
          // let the user try again
          console.log('Location not in Philadelphia.');
          errorContainer.textContent = ('Please input a location in Philadelphia, PA.');
        }
      } else {
        alert('Geocode was not successful for the following reason: ' + status);
      };
    });
  } else {
    // no blank submissions please
    console.log('No location submitted.');
  }
});

// get weather forecast
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
}

function renderForecast(forecast){
  let weatherBox = document.createElement("DIV");

  // set up the html element and add it to the DOM
  weatherBox.setAttribute("id", "weather-box");
  console.log("forecast: ");
  console.log(forecast);
  weatherBox.innerHTML = [
    `<p>today's condition: </p>`,
    `<p>${forecast.weather[0].description}</p>`,
    `<img src=http://openweathermap.org/img/w/${forecast.weather[0].icon}.png alt="weather icon">`
  ].join("");
  weatherContainer.appendChild(weatherBox);

  if (forecast.weather[0].icon.includes('09' || '10' || '11' || '13')) {
    let warningBox = document.createElement("DIV");
    warningBox.innerHTML = ('<p>Warning: precipitation expected!</p>');
    warningContainer.appendChild(warningBox);
    console.log('warning logged to DOM')
  };

  console.log("Weather conditions rendered.");

}


function getForecast(){
  return fetch('http://api.openweathermap.org/data/2.5/weather?q=Philadelphia,USA&APPID=d9999db4a33a6a734f1a2e0a30556290')
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
    zoom: 14,
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

function getClosestStations(latLng) {

  let userLatLng = new google.maps.LatLng(latLng[0], latLng[1]);
  let result = [];

  // first try to get all Indego stations within walking distance
  for (let station in stations.features) {
    let stationLatLng = new google.maps.LatLng(
      stations.features[station].geometry.coordinates[1],
      stations.features[station].geometry.coordinates[0]
    );

    let distance = google.maps.geometry.spherical.computeDistanceBetween(userLatLng, stationLatLng);

    // grab all Indego stations within one kilometer
    if (distance < 1000) {
      result.push(stations.features[station])
    }
  };

  if (result.length > 0) {
    console.log(result.length + ' station' + (result.length == 1 ? '' : 's ') + 'found within walking distance!')
    return result;
  }

  if (result.length <= 0) {
    console.log("No Indego stations found within walking distance. :(");
    console.log("Mapping closest stations instead.");

    // no stations found within 1km, so let's grab the closest by distance
    // map stations to a temporary array with index and sort value
    let mapped = stations.features.map(function(station, index) {
      let stationLatLng = new google.maps.LatLng(
        stations.features[index].geometry.coordinates[1],
        stations.features[index].geometry.coordinates[0]
      );

      // sort value with Google Maps API's distance calculation
      return { index: index, value: google.maps.geometry.spherical.computeDistanceBetween(userLatLng, stationLatLng) };
    })

    // sort mapped array
    mapped.sort(function(a, b) {
      if (a.value > b.value) {
        return 1;
      }
      if (a.value < b.value) {
        return -1;
      }
      return 0;
    });

    // hold array of stations sorted by distance
    let sortedStations = mapped.map(function(station){
      return stations.features[station.index];
    });

    // return the three closest stations
    for(let i = 0; i < 3; i++){
      result[i] = sortedStations[i];
    }
    return result;
  };
};

function listClosestStations(stationsObject, markerArray){

  // iterate through each closest station
  Object.keys(stationsObject).map(function(objectKey, index) {
    let stationsListItem = document.createElement("LI");

    // set up the html element and add it to the DOM
    stationsListItem.setAttribute("id", `btn-${objectKey}`);
    stationsListItem.setAttribute("value", `${objectKey}`);
    stationsListItem.innerHTML = [
      `<p>${stationsObject[index].properties.name}</p>`,
      `<p>address: ${stationsObject[index].properties.addressStreet}</p>`,
      `<p>bikes available: ${stationsObject[index].properties.bikesAvailable}</p>`,
      `<p>open docks: ${stationsObject[index].properties.docksAvailable}</p>`,
    ]
     .join("");
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

function markClosestStations(latLng, stationsObject){
  console.log(stationsObject);
  let markerArray = [];
  // mark the user's location
  let userMarker = new google.maps.Marker({
          position: {lat: latLng[0], lng:latLng[1]},
          map: map,
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

    let bikes = `${stationsObject[index].properties.bikesAvailable}`;

    let marker = new google.maps.Marker({
            position: coordinates,
            map: map,
            label: bikes,
            title: `Closest station ${index}`
    });

    // add a helper function to zoom in on each marker
    marker.addListener('click', function() {
          map.setZoom(14);
          map.setCenter(marker.getPosition());
    });

    // add each marker to the master list of markers
    markerArray.push(marker);
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
  if(map.getZoom()> 16){
    map.setZoom(16);
  }
  return markerArray;
};

})();
