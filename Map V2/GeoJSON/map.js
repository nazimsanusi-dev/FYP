// Initialize the map
const map = L.map('map').setView([6.475313639980661, 100.26444062636516], 10);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

// Load GeoJSON and add as a layer
fetch('perlis_wilayah.geojson')
    .then(response => response.json())
    .then(geojsonData => {
        // Create a GeoJSON layer
        const geojsonLayer = L.geoJSON(geojsonData, {
            style: (feature) => {
                // Assign different colors to areas
                const colors = { "Area A": "blue", "Area B": "green", "Area C": "red" };
                return {
                    color: colors[feature.properties.name],
                    fillOpacity: 0.5,
                    weight: 2
                };
            },
            onEachFeature: (feature, layer) => {
                // Bind popup to each area
                layer.bindPopup(`<strong>${feature.properties.name}</strong>`);
            }
        });

        // Add the GeoJSON layer to the map
        geojsonLayer.addTo(map);

        // Add layer controls
        const overlayMaps = {
            "GeoJSON Areas": geojsonLayer
        };
        L.control.layers(null, overlayMaps).addTo(map);
    })
    .catch(error => console.error("Error loading GeoJSON:", error));
