// Inicializar el mapa centrado en México
var map = L.map('map').setView([23.6345, -102.5528], 5);

// Agregar capa base de OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Capa para almacenar los datos filtrados
var capaGeoJSON = L.layerGroup().addTo(map);
var datosGeoJSON;  // Variable global para almacenar los datos originales

// Función para obtener colores según el tipo de unidad
function getColorByTipo(tipo) {
    switch (tipo) {
        case "CDM": return "red";
        case "ULA/FIJA": return "blue";
        case "CJM": return "purple";
        case "Municipal": return "black";
        case "CEB": return "green";
        case "ULA/TEL": return "orange";
        case "ULA/Itinerante": return "cyan";
        case "IMM": return "magenta";
        default: return "gray";
    }
}

// Cargar datos desde el archivo GeoJSON en GitHub Pages
fetch('https://raw.githubusercontent.com/Dania-Luna/MAPA/main/CENTROS_DE_ATENCION.geojson')
    .then(response => response.json())
    .then(data => {
        datosGeoJSON = data;
        cargarDatosMapa(data);
        llenarFiltros(data);
    })
    .catch(error => console.error("Error cargando GeoJSON:", error));

// Función para llenar dinámicamente los filtros de estado y tipo
function llenarFiltros(datos) {
    let estadosUnicos = new Set();
    let tiposUnicos = new Set();

    datos.features.forEach(feature => {
        let estado = feature.properties.Estado ? feature.properties.Estado.trim() : "Desconocido";
        let tipo = feature.properties.Tipo ? feature.properties.Tipo.trim() : "Desconocido";

        estadosUnicos.add(estado);
        tiposUnicos.add(tipo);
    });

    let filtroEstado = document.getElementById("filtroEstado");
    estadosUnicos.forEach(estado => {
        let option = document.createElement("option");
        option.value = estado;
        option.textContent = estado;
        filtroEstado.appendChild(option);
    });

    let filtroTipo = document.getElementById("filtroTipo");
    tiposUnicos.forEach(tipo => {
        let option = document.createElement("option");
        option.value = tipo;
        option.textContent = tipo;
        filtroTipo.appendChild(option);
    });
}

// Función para cargar los datos en el mapa
function cargarDatosMapa(datos) {
    capaGeoJSON.clearLayers();
    var geojsonLayer = L.geoJSON(datos, {
        pointToLayer: function (feature, latlng) {
            return L.circleMarker(latlng, {
                radius: 6,
                fillColor: getColorByTipo(feature.properties.Tipo),
                color: "#000",
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8
            }).bindPopup(
                `<b>Estado:</b> ${feature.properties.Estado || "No disponible"}<br>
                <b>Municipio:</b> ${feature.properties.Municipio || "No disponible"}<br>
                <b>Nombre de la institución:</b> ${feature.properties["Nombre de la institución"] || "No disponible"}<br>
                <b>Dirección:</b> ${feature.properties.Dirección || "No disponible"}<br>
                <b>Tipo de Unidad:</b> ${feature.properties.Tipo || "No disponible"}<br>
                <b>Servicios:</b> ${feature.properties.Servicios || "No disponible"}<br>
                <b>Horarios:</b> ${feature.properties.Horarios || "No disponible"}<br>
                <b>Teléfono:</b> ${feature.properties.Teléfono || "No disponible"}`
            );
        }
    });
    capaGeoJSON.addLayer(geojsonLayer);
}

// Función para aplicar filtros y corregir el error de puntos extraños
function aplicarFiltros() {
    let estadoSeleccionado = document.getElementById("filtroEstado").value;
    let tipoSeleccionado = document.getElementById("filtroTipo").value;

    let datosFiltrados = {
        type: "FeatureCollection",
        features: datosGeoJSON.features.filter(feature => {
            let estado = feature.properties.Estado ? feature.properties.Estado.trim() : "";
            let tipo = feature.properties.Tipo ? feature.properties.Tipo.trim() : "";

            let estadoValido = estadoSeleccionado === "Todos" || estado === estadoSeleccionado;
            let tipoValido = tipoSeleccionado === "Todos" || tipo === tipoSeleccionado;
            return estadoValido && tipoValido;
        })
    };

    // Limpiar el mapa y agregar los datos filtrados
    capaGeoJSON.clearLayers();
    cargarDatosMapa(datosFiltrados);
}

// Agregar evento al botón de filtros
document.getElementById("botonFiltrar").addEventListener("click", aplicarFiltros);

