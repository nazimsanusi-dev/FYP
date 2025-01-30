// Load GeoJSON data
fetch('perlis_wilayah.geojson')
    .then(response => response.json())
    .then(geojsonData => {
        // Add GeoJSON layer to the map
        L.geoJSON(geojsonData, {
            style: function (feature) {
                return {
                    color: "#ff7800",
                    weight: 2,
                    fillColor: "#ffd27f",
                    fillOpacity: 0.5
                };
            },
            onEachFeature: function (feature, layer) {
                // Add popup to each feature
                if (feature.properties && feature.properties.name) {
                    layer.bindPopup(`Region: ${feature.properties.name}`);
                }
            }
        }).addTo(map);
    })
    .catch(error => console.error("Error loading GeoJSON:", error));
