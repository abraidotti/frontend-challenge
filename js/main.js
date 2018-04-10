const locationInput = document.querySelector("#location-input");
const locationButton = document.querySelector("#location-button");
const errorFlash = document.querySelector("#error-flash");

let closestStations = [];

// if user submits a location:
locationButton.addEventListener("click", function(event) {
  // prevent page reload on form submission
  event.preventDefault();
  // clear the error box just in case
  errorFlash.textContent = ("");

  // if the input value is not blank
  if (locationInput.value) {
    // geocode the input value
    let geocoder = new google.maps.Geocoder();
    geocoder.geocode({
      address: locationInput.value
    }, function(results, status) {
      if (status === "OK") {
        console.log(`Location searched: ${results[0].formatted_address}`)

        // check if the address is in Philly proper
        if (results[0].formatted_address.includes("Philadelphia, PA")){
          // log what's found
          console.log("Location found and validated.");
          let userLatLng = [
            results[0].geometry.location.lat(),
            results[0].geometry.location.lng()
          ]
          console.log(`User's coordinates are: ${userLatLng}`);

          // draw map
          initMap(userLatLng);

          // grab closest stations
          closestStations = getClosestStations(userLatLng);
          console.log(closestStations);

        } else {
          console.log("Location not in Philadelphia.");
          errorFlash.textContent = ("Please input a location in Philadelphia, PA.");
        }

      } else {
        alert("Geocode was not successful for the following reason: " + status);
      };
    });
  } else {
    console.log('No location submitted.');
  }
}); // end of click function

function initMap(latLng) {
// Initializes a map in night mode.
let map = new google.maps.Map(document.getElementById('map'), {
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

  // let's first try to get all stations within a kilometer
  for (let station in stations.features) {
    let stationLatLng = new google.maps.LatLng(
      stations.features[station].geometry.coordinates[1],
      stations.features[station].geometry.coordinates[0]
    );

    let distance = google.maps.geometry.spherical.computeDistanceBetween(userLatLng, stationLatLng);
    // grab all bike stations within one kilometer
    if (distance < 500) {
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

      // sort value is Google Maps API's distance calculation function
      return { index: index, value: google.maps.geometry.spherical.computeDistanceBetween(userLatLng, stationLatLng) };
    })

    // sort mapped array containing reduced values
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

    // return the three closest
    for(let i = 0; i < 3; i++){
      result[i] = sortedStations[i];
    }
    return result;
  }
};







// function markClosestStations(stationObject){
//   console.log(stationObject);
// }
