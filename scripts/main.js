// Define initial state.
var currentSpeed = 8500;
var currentLat = 0;
var currentLong = 0;
var currentDestination = "Kennedy Space Center";
var currentDistance = 10000;
var currentDuration = "12h 45min";
var site_1 = [-80.651, 28.572];
var site_2 = [-91.247, 33.582];
var site_3 = [-95.097, 29.549];

// Initially, hide the overview container.
var selectionOverview = document.getElementById("selection_overview");
selectionOverview.style.display = "none";

// Select the close button element
var btnClose = document.getElementById("btn_close");

btnClose.addEventListener("click", function () {
  selectionOverview.style.display = "none";
});

// Define how data should be fetched.
function getAPIdata() {
  // construct request
  var request = "http://api.open-notify.org/iss-now.json";

  // get current weather
  fetch(request)
    // parse to JSON format
    .then(function (response) {
      if (!response.ok) throw Error(response.statusText);
      return response.json();
    })

    .then(function (response) {
      onAPISucces(response);
    })

    .catch(function (error) {
      onAPIError(error);
    });
}

// Run this if API request was succesfull.
function onAPISucces(response) {
  // Set currentLong & currentLat state to match the issPotion.
  currentLong = response.iss_position.longitude;
  currentLat = response.iss_position.latitude;

  // Calculate shortest distance
  var distance_1 = getDistance(site_1[0], site_1[1], currentLong, currentLat);
  var distance_2 = getDistance(site_2[0], site_2[1], currentLong, currentLat);
  var distance_3 = getDistance(site_3[0], site_3[1], currentLong, currentLat);
  var shortestDistance = Math.min(distance_1, distance_2, distance_3);

  console.log(shortestDistance);

  // This is our API key, we need this to authorize our API calls.
  mapboxgl.accessToken =
    "pk.eyJ1IjoiYWRhbXNjaHdhcmN6IiwiYSI6ImNqcTVsNW44ejF6ajAzd3BscnNudnJjeTgifQ.F9yEt_Vc0_PEYOMm9mq0SA";

  // This is where we pass some initial settings to our map.
  var map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/adamschwarcz/ckqray41w2sey18o0u5ygplko",
    center: [limit(currentLong, -90, 90), limit(currentLat, -90, 90)],
    zoom: 2,
  });

  // This is where we define, at which location we want to place our markers.
  var geojson = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {
          name: "Kennedy Space Center",
          location: "Merrit Island, Florida, US",
          type: "site",
        },
        geometry: {
          type: "Point",
          coordinates: site_1,
        },
      },
      {
        type: "Feature",
        properties: {
          name: "Arkansas Space Center",
          location: "Fayetteville, Arkansas, US",
          type: "site",
        },
        geometry: {
          type: "Point",
          coordinates: site_2,
        },
      },
      {
        type: "Feature",
        properties: {
          name: "NASA Johnson Space Center",
          location: "Houston, Texas, US",
          type: "site",
        },
        geometry: {
          type: "Point",
          coordinates: site_3,
        },
      },
      {
        type: "Feature",
        properties: {
          name: "Internatial Spaceship",
          type: "iss",
        },
        geometry: {
          type: "Point",
          coordinates: [currentLong, currentLat],
        },
      },
    ],
  };

  // Add markers to the map.
  geojson.features.forEach(function (marker) {
    // Create a DOM element for each marker.
    var el = document.createElement("div");
    el.className = "marker";

    // Inject styles into the DOM element.
    el.style.backgroundImage =
      "url(./images/" + marker.properties.type + ".png)";

    // Store current marker position in a variable
    var selectionLong = marker.geometry.coordinates[0];
    var selectionLat = marker.geometry.coordinates[1];
    var selectionDistance = getDistance(
      selectionLong,
      selectionLat,
      currentLong,
      currentLat
    );
    var selectionLocation = marker.properties.location;
    var selectionDuration = (selectionDistance / currentSpeed) * 60;

    // Click event listener; changes the current selection state.
    el.addEventListener("click", function () {
      selectionOverview.style.display = "flex";

      var selectionLocationText = document.getElementById("selection_location");
      var selectionDistanceText = document.getElementById("selection_distance");
      var selectionDurationText = document.getElementById("selection_duration");

      selectionLocationText.innerHTML = selectionLocation;
      selectionDistanceText.innerHTML = selectionDistance.toFixed() + "km";
      selectionDurationText.innerHTML = timeConvert(selectionDuration);

      currentDestination = selectionLocation;
      currentDistance = selectionDistance;
      currentDuration = selectionDuration;

      var alert = document.getElementById("alert");
      var alertText = document.getElementById("alert_text");
      var alertIcon = document.getElementById("alert_icon");

      if (selectionDistance !== shortestDistance) {
        alert.style.display = "flex";
        alert.classList.remove("success");
        alert.classList.add("danger");
        alertText.innerHTML = "🚫 This landing site is quite far away.";
      } else {
        alert.style.display = "flex";
        alert.classList.remove("danger");
        alert.classList.add("success");
        alertText.innerHTML = "✅ This is the closest landing facility.";
      }

      btnSetDestination.innerHTML = "Set destination";
      btnSetDestination.classList.remove("success");
    });

    // Add markers to the map.
    new mapboxgl.Marker(el).setLngLat(marker.geometry.coordinates).addTo(map);
  });
}

// Select the button element
var btnSetDestination = document.getElementById("btn_set_destination");

// Change current data on click
btnSetDestination.addEventListener("click", function () {
  var currentDestinationText = document.getElementById("current_destination");
  var currentDistanceText = document.getElementById("current_distance");
  var currentDurationText = document.getElementById("current_duration");

  currentDestinationText.innerHTML = currentDestination;
  currentDistanceText.innerHTML = currentDistance.toFixed() + "km";
  currentDurationText.innerHTML = timeConvert(currentDuration);

  btnSetDestination.innerHTML = "✅ &nbsp;Destination is set";
  btnSetDestination.classList.add("success");
});

// Calculates distance between two longitutes & latitues.
function getDistance(lat1, lon1, lat2, lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2 - lat1); // deg2rad below
  var dLon = deg2rad(lon2 - lon1);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

// Limits a number between a min & max value
function limit(num, min, max) {
  const MIN = min || 1;
  const MAX = max || 20;
  const parsed = parseInt(num);
  return Math.min(Math.max(parsed, MIN), MAX);
}

function timeConvert(n) {
  var num = n;
  var hours = num / 60;
  var rhours = Math.floor(hours);
  var minutes = (hours - rhours) * 60;
  var rminutes = Math.round(minutes);
  return rhours + "h " + rminutes + "min";
}

// Runs this if something went wrong during the API request.
function onAPIError(error) {
  console.error("Request failed", error);
}

// Run the request on load.
getAPIdata();
