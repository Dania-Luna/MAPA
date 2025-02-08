// Crear el mapa y centrarlo en México
var map = L.map('map').setView([23.6345, -102.5528], 5);

// Agregar mapa base de OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

var mapaDatos;
var geojsonData;

// Definir colores para cada tipo de unidad
var colors = {
    "CDM": "red",
    "CJM": "green",
    "CEM": "purple",
    "CEB": "pink",
    "CEAV": "darkblue",
    "ULA/FIJA": "blue",
    "ULA/MÓVIL": "yellow",
    "ULA/Itinerante": "brown",
    "ULA/TEL": "gray",
    "CAMVIF": "lightblue",
    "IMMT": "darkred",
    "CAVIZ": "orange",
    "CEA": "purple",
    "IMM": "pink",
    "Punto Violeta": "violet",
    "Refugio": "black",
    "LÍNEA TELEFÓNICA": "gray",
    "CJMF": "black",
    "DIG": "blue",
    "IMEF": "teal",
    "Otro": "darkgray"
};

// Cargar el archivo GeoJSON y llenar los filtros
fetch('CENTROS_ATENCION.geojson')
    .then(response => response.json())
    .then(data => {
        geojsonData = data;  // Guardamos los datos originales

        // Obtener lista única de estados y tipos de unidad
        let estados = new Set();
        let tipos = new Set();

        data.features.forEach(feature => {
            if (feature.properties.Estado) estados.add(feature.properties.Estado);
            if (feature.properties.Tipo) tipos.add(feature.properties.Tipo);
        });

        // Llenar los selects con opciones únicas
        let estadoSelect = document.getElementById("estado");
        let tipoSelect = document.getElementById("tipo");

        estados.forEach(estado => {
            let option = document.createElement("option");
            option.value = estado;
            option.textContent = estado;
            estadoSelect.appendChild(option);
        });

        tipos.forEach(tipo => {
            let option = document.createElement("option");
            option.value = tipo;
            option.textContent = tipo;
            tipoSelect.appendChild(option);
        });

        // Mostrar todos los puntos al cargar la página
        mostrarDatos(data);
    })
    .catch(error => console.error("Error cargando GeoJSON:", error));

// Función para mostrar los datos en el mapa
function mostrarDatos(data) {
    if (mapaDatos) mapaDatos.clearLayers();

    mapaDatos = L.geoJSON(data, {
        pointToLayer: function (feature, latlng) {
            var tipo = feature.properties.Tipo ? feature.properties.Tipo.trim() : "Otro";
            var color = colors[tipo] || colors["Otro"];

            return L.circleMarker(latlng, {
                radius: 6,
                fillColor: color,
                color: "#000",
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8
            });
        },
        onEachFeature: function (feature, layer) {
            var popupContent = `<b>Municipio:</b> ${feature.properties.Municipio || "No disponible"}<br>
                                <b>Estado:</b> ${feature.properties.Estado || "No disponible"}<br>
                                <b>Tipo de Unidad:</b> ${feature.properties.Tipo || "No especificado"}<br>
                                <b>Servicios:</b> ${feature.properties.Servicios || "No especificado"}<br>
                                <b>Horarios:</b> ${feature.properties.Horarios || "No disponible"}<br>
                                <b>Teléfono:</b> ${feature.properties.Teléfono || "No disponible"}`;

            layer.bindPopup(popupContent);
        }
    }).addTo(map);
}

// Función para filtrar los datos
function filtrarDatos() {
    let estadoSeleccionado = document.getElementById("estado").value;
    let tipoSeleccionado = document.getElementById("tipo").value;

    let datosFiltrados = {
        type: "FeatureCollection",
        features: geojsonData.features.filter(feature => {
            let cumpleEstado = estadoSeleccionado === "todos" || feature.properties.Estado === estadoSeleccionado;
            let cumpleTipo = tipoSeleccionado === "todos" || feature.properties.Tipo === tipoSeleccionado;
            return cumpleEstado && cumpleTipo;
        })
    };

    mostrarDatos(datosFiltrados);
}
