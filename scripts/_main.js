mapboxgl.accessToken =
  "pk.eyJ1IjoiYWRhbXNjaHdhcmN6IiwiYSI6ImNqcTVsNW44ejF6ajAzd3BscnNudnJjeTgifQ.F9yEt_Vc0_PEYOMm9mq0SA";

var map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/satellite-v9",
  center: [-96, 37.8],
  zoom: 4,
});

var size = 200;

var pulsingDot = {
  width: size,
  height: size,
  data: new Uint8Array(size * size * 4),

  // get rendering context for the map canvas when layer is added to the map
  onAdd: function () {
    var canvas = document.createElement("canvas");
    canvas.width = this.width;
    canvas.height = this.height;
    this.context = canvas.getContext("2d");
  },

  // called once before every frame where the icon will be used
  render: function () {
    var duration = 1000;
    var t = (performance.now() % duration) / duration;

    var radius = (size / 2) * 0.3;
    var outerRadius = (size / 2) * 0.7 * t + radius;
    var context = this.context;

    // draw outer circle
    context.clearRect(0, 0, this.width, this.height);
    context.beginPath();
    context.arc(this.width / 2, this.height / 2, outerRadius, 0, Math.PI * 5);
    context.fillStyle = "rgba(91, 134, 229," + (1 - t) + ")";
    context.fill();

    // draw inner circle
    context.beginPath();
    context.arc(this.width / 2, this.height / 2, radius, 0, Math.PI * 2);
    context.fillStyle = "#5B86E5";
    context.strokeStyle = "white";
    context.lineWidth = 4 + 6 * (1 - t);
    context.fill();
    context.stroke();

    // update this image's data with data from the canvas
    this.data = context.getImageData(0, 0, this.width, this.height).data;

    // continuously repaint the map, resulting in the smooth animation of the dot
    map.triggerRepaint();

    // return `true` to let the map know that the image was updated
    return true;
  },
};

map.on("load", function () {
  map.addImage("pulsing-dot", pulsingDot, { pixelRatio: 2 });
  map.addSource("places", {
    type: "geojson",
    data: {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {
            site: "Kennedy Space Center",
            description:
              "<strong>LANDING SITE</strong>" +
              "<h3>Kennedy Space Center</h3>" +
              '<div class="state">' +
              "<p>Florida, US</p>" +
              "</div>",
          },
          geometry: {
            type: "Point",
            coordinates: [-80.651, 28.572],
          },
        },
        {
          type: "Feature",
          properties: {
            site: "U.S. Space & Rocket Center",
            description:
              "<strong>LANDING SITE</strong>" +
              "<h3>U.S. Space & Rocket Center</h3>" +
              '<div class="state">' +
              "<p>Kansas, US</p>" +
              "</div>",
          },
          geometry: {
            type: "Point",
            coordinates: [-91.247, 33.582],
          },
        },
        {
          type: "Feature",
          properties: {
            site: "Space Center Houston",
            description:
              "<strong>LANDING SITE</strong>" +
              "<h3>Space Center Houston</h3>" +
              '<div class="state">' +
              "<p>Texas, US</p>" +
              "</div>",
          },
          geometry: {
            type: "Point",
            coordinates: [-95.097, 29.549],
          },
        },
      ],
    },
  });

  // Add a layer showing the places.
  map.addLayer({
    id: "places",
    type: "symbol",
    source: "places",
    layout: {
      "icon-image": "pulsing-dot",
      "icon-allow-overlap": true,
    },
  });

  // Create a popup, but don't add it to the map yet.
  var popup = new mapboxgl.Popup({
    offset: 40,
    anchor: "right",
    closeButton: false,
    closeOnClick: false,
  });

  map.on("mouseenter", "places", function (e) {
    map.getCanvas().style.cursor = "pointer";

    var coordinates = e.features[0].geometry.coordinates.slice();
    var description = e.features[0].properties.description;

    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
      coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    }

    popup.setLngLat(coordinates).setHTML(description).addTo(map);
  });

  map.on("mouseleave", "places", function () {
    map.getCanvas().style.cursor = "";
    popup.remove();
  });

  map.on("click", "places", function (e) {
    var sidebar = document.getElementById("sidebar");
    sidebar.style.display = "block";

    var button = document.getElementById("button");
    button.style.background =
      "linear-gradient(360deg, rgba(255, 255, 255, 1e-5) 0%, rgba(255, 255, 255, 0.1) 100%), #137CBD";
    button.innerHTML = "Set as landing destination";

    var site = e.features[0].properties.site;
    console.log(site);

    function getAPIdata() {
      var url = "https://api.openweathermap.org/data/2.5/weather";
      var apiKey = "98cdcc7fb1ccfb682f2c551a0bbe8d0e";
      // construct request
      var request =
        "https://api.openweathermap.org/data/2.5/weather?lat=" +
        e.features[0].geometry.coordinates[1] +
        "&lon=" +
        e.features[0].geometry.coordinates[0] +
        "&appid=" +
        apiKey;

      // get current weather
      fetch(request)
        // parse to JSON format
        .then(function (response) {
          if (!response.ok) throw Error(response.statusText);
          return response.json();
        })

        // render weather per day
        .then(function (response) {
          // render weatherCondition
          onAPISucces(response);
        })

        // catch error
        .catch(function (error) {
          onAPIError(error);
        });
    }

    function onAPISucces(response) {
      console.log(response);
      var temp = response.main.temp - 272.15;
      document.getElementById("temp").innerHTML = temp.toFixed(0);

      var press = response.main.pressure;
      document.getElementById("press").innerHTML = press.toFixed(0);

      var wind = response.wind.speed;
      document.getElementById("wind").innerHTML = wind.toFixed(0);

      var city = response.name;
      document.getElementById("city").innerHTML = city;

      var desc = response.weather[0].description;
      document.getElementById("desc").innerHTML =
        desc[0].toUpperCase() + desc.slice(1);

      var icon = response.weather[0].icon;
      document.getElementById("icon").src =
        "http://openweathermap.org/img/wn/" + icon + "@2x.png";

      var siteTitle = document.getElementById("site");
      siteTitle.innerHTML = site;

      var button = document.getElementById("button");
      var destination = document.getElementById("destination");
      button.onclick = function () {
        destination.innerHTML = site;
        destination.style.color = "white";
        button.style.background =
          "linear-gradient(360deg, rgba(255, 255, 255, 1e-05) 0%, rgba(255, 255, 255, 0.1) 100%), #43BF4D";
        button.innerHTML =
          '<img src="images/success.svg" style="margin-right: 4px"> Destination was set';
      };

      var status = document.getElementById("status-message");
      var statusIcon = document.getElementById("status-icon");
      var statusText = document.getElementById("status-text");

      if (wind > 4) {
        status.style.background =
          "linear-gradient(180deg, rgba(191, 67, 67, 0.25) 0%, rgba(191, 67, 67, 0.15) 100%)";
        statusIcon.src = "images/status-warning.svg";
        statusText.innerHTML = "Landing not recommended";
        statusText.style.color = "#BF4343";
      } else {
        status.style.background =
          "linear-gradient(180deg, rgba(67, 191, 77, 0.2) 0%, rgba(67, 191, 77, 0.12) 100%)";
        statusIcon.src = "images/status-suitable.svg";
        statusText.innerHTML = "Suitable for landing";
        statusText.style.color = "#43bf4d";
      }
    }

    function onAPIError(error) {
      console.error("Request failed", error);
    }
    getAPIdata();
  });
});
