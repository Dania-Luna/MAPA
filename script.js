// Crear el mapa y centrarlo en México
var map = L.map('map').setView([23.6345, -102.5528], 5);

// Agregar mapa base de OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

var markersLayer = L.layerGroup().addTo(map);
var datosOriginales = [];

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

// Normalizar texto para evitar errores en los filtros
function normalizarTexto(texto) {
    return texto
        ? texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim()
        : "";
}

// Cargar el archivo GeoJSON correctamente
fetch('https://dania-luna.github.io/MAPA/CENTROS_DE_ATENCION.geojson')
    .then(response => response.json())
    .then(data => {
        datosOriginales = data.features;
        llenarFiltros(datosOriginales);
        cargarDatos(datosOriginales);
    })
    .catch(error => console.error("Error cargando el archivo GeoJSON:", error));

// Función para llenar los filtros de Estado y Tipo de Unidad
function llenarFiltros(data) {
    let estados = new Set();
    let tipos = new Set();

    data.forEach(feature => {
        if (feature.properties.Estado) estados.add(normalizarTexto(feature.properties.Estado));
        if (feature.properties.Tipo) tipos.add(feature.properties.Tipo.trim());
    });

    let estadoSelect = document.getElementById("estado");
    let tipoSelect = document.getElementById("tipo");

    estados.forEach(estado => {
        let option = document.createElement("option");
        option.value = estado;
        option.textContent = estado.charAt(0).toUpperCase() + estado.slice(1);
        estadoSelect.appendChild(option);
    });

    tipos.forEach(tipo => {
        let option = document.createElement("option");
        option.value = tipo;
        option.textContent = tipo;
        tipoSelect.appendChild(option);
    });
}

// Función para cargar los datos en el mapa
function cargarDatos(data) {
    markersLayer.clearLayers();

    L.geoJSON({ type: "FeatureCollection", features: data }, {
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
            var estado = normalizarTexto(feature.properties["Estado"]);
            var municipio = feature.properties["Municipio"]?.trim() || "No disponible";
            var institucion = feature.properties["Nombre de la institución"]?.trim() || "No disponible";
            var direccion = feature.properties["Dirección"]?.trim() || "No disponible";
            var tipo = feature.properties["Tipo"]?.trim() || "No especificado";
            var horarios = feature.properties["Horarios"]?.trim() || "No disponible";
            var telefono = feature.properties["Teléfono"]?.trim() || "No disponible";
            
            var popupContent = `<b>Estado:</b> ${feature.properties["Estado"]}<br>
                                <b>Municipio:</b> ${municipio}<br>
                                <b>Nombre de la institución:</b> ${institucion}<br>
                                <b>Dirección:</b> ${direccion}<br>
                                <b>Tipo de Unidad:</b> ${tipo}<br>
                                <b>Horarios:</b> ${horarios}<br>
                                <b>Teléfono:</b> ${telefono}`;
            
            layer.bindPopup(popupContent);
            markersLayer.addLayer(layer);
        }
    });
}

// Función para filtrar los datos y actualizar el mapa
function filtrarDatos() {
    let estadoSeleccionado = normalizarTexto(document.getElementById("estado").value);
    let tipoSeleccionado = document.getElementById("tipo").value.trim();

    let datosFiltrados = datosOriginales.filter(feature => {
        let estado = normalizarTexto(feature.properties["Estado"]);
        let tipo = feature.properties["Tipo"]?.trim() || "";
        let cumpleEstado = estadoSeleccionado === "todos" || estado === estadoSeleccionado;
        let cumpleTipo = tipoSeleccionado === "todos" || tipo === tipoSeleccionado;
        return cumpleEstado && cumpleTipo;
    });

    console.log("Total de puntos después del filtrado:", datosFiltrados.length);
    cargarDatos(datosFiltrados);
}


