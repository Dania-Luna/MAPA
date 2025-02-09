// Variables globales
let datosGeoJSON;

// Inicializar el mapa centrado en México
var map = L.map('map').setView([23.6345, -102.5528], 5);

// Agregar capa base de OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Capa GeoJSON para almacenar los datos
var capaGeoJSON = L.layerGroup().addTo(map);

// Función para obtener colores según el tipo de unidad
function getColorByTipo(tipo) {
    switch (tipo) {
        case "CDM": return "red";
        case "ULA/FIJA": return "blue";
        case "CJM": return "purple";
        case "Municipal": return "black";
        default: return "gray";
    }
}

// Cargar los datos desde el archivo GeoJSON en GitHub Pages
fetch('https://raw.githubusercontent.com/Dania-Luna/MAPA/main/CENTROS_DE_ATENCION.geojson')
    .then(response => response.json())
    .then(data => {
        datosGeoJSON = data;
        cargarDatosMapa(data);
        llenarFiltros(data);
    })
    .catch(error => console.error("Error cargando GeoJSON:", error));

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
                `<b>Estado:</b> ${feature.properties.Estado}<br>
                <b>Municipio:</b> ${feature.properties.Municipio}<br>
                <b>Nombre de la institución:</b> ${feature.properties["Nombre de la institución"]}<br>
                <b>Dirección:</b> ${feature.properties.Dirección}<br>
                <b>Tipo de Unidad:</b> ${feature.properties.Tipo}<br>
                <b>Servicios:</b> ${feature.properties.Servicios || "No disponible"}<br>
                <b>Horarios:</b> ${feature.properties.Horarios || "No disponible"}<br>
                <b>Teléfono:</b> ${feature.properties.Teléfono || "No disponible"}`
            );
        }
    });
    capaGeoJSON.addLayer(geojsonLayer);
}

// **Función para llenar los filtros dinámicamente**
function llenarFiltros(datos) {
    let estadosUnicos = new Set();
    let tiposUnicos = new Set();

    // Recorrer cada punto en el GeoJSON y obtener los estados y tipos únicos
    datos.features.forEach(feature => {
        estadosUnicos.add(feature.properties.Estado);
        tiposUnicos.add(feature.properties.Tipo);
    });

    // Obtener los elementos del HTML
    let filtroEstado = document.getElementById("filtroEstado");
    let filtroTipo = document.getElementById("filtroTipo");

    // Agregar estados dinámicamente
    estadosUnicos.forEach(estado => {
        let option = document.createElement("option");
        option.value = estado;
        option.textContent = estado;
        filtroEstado.appendChild(option);
    });

    // Agregar tipos dinámicamente
    tiposUnicos.forEach(tipo => {
        let option = document.createElement("option");
        option.value = tipo;
        option.textContent = tipo;
        filtroTipo.appendChild(option);
    });
}

// Función para aplicar filtros
function aplicarFiltros() {
    let estadoSeleccionado = document.getElementById("filtroEstado").value;
    let tipoSeleccionado = document.getElementById("filtroTipo").value;

    let datosFiltrados = L.geoJSON(datosGeoJSON, {
        filter: function(feature) {
            let estadoValido = estadoSeleccionado === "Todos" || feature.properties.Estado === estadoSeleccionado;
            let tipoValido = tipoSeleccionado === "Todos" || feature.properties.Tipo === tipoSeleccionado;
            return estadoValido && tipoValido;
        },
        pointToLayer: function(feature, latlng) {
            return L.circleMarker(latlng, {
                radius: 6,
                fillColor: getColorByTipo(feature.properties.Tipo),
                color: "#000",
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8
            }).bindPopup(
                `<b>Estado:</b> ${feature.properties.Estado}<br>
                <b>Municipio:</b> ${feature.properties.Municipio}<br>
                <b>Nombre de la institución:</b> ${feature.properties["Nombre de la institución"]}<br>
                <b>Dirección:</b> ${feature.properties.Dirección}<br>
                <b>Tipo de Unidad:</b> ${feature.properties.Tipo}<br>
                <b>Servicios:</b> ${feature.properties.Servicios || "No disponible"}<br>
                <b>Horarios:</b> ${feature.properties.Horarios || "No disponible"}<br>
                <b>Teléfono:</b> ${feature.properties.Teléfono || "No disponible"}`
            );
        }
    });

    // Limpiar el mapa antes de agregar datos nuevos
    capaGeoJSON.clearLayers();
    capaGeoJSON.addLayer(datosFiltrados);
}

// Agregar evento al botón de filtros
document.getElementById("botonFiltrar").addEventListener("click", aplicarFiltros);

