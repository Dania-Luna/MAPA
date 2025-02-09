// Inicializar el mapa centrado en México
var map = L.map('map').setView([23.6345, -102.5528], 5);

// Agregar capa base de OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Capa GeoJSON para almacenar los datos
var capaGeoJSON = L.layerGroup().addTo(map);

// Variable para almacenar los datos originales
var datosGeoJSON = null;

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

        // Llenar dinámicamente los filtros con los valores únicos del GeoJSON
        llenarFiltros(data);

        // Cargar los datos en el mapa al inicio
        cargarDatosMapa(data);
    })
    .catch(error => console.error("Error cargando GeoJSON:", error));

// Función para llenar dinámicamente los filtros
function llenarFiltros(datos) {
    let estados = new Set();
    let tipos = new Set();

    datos.features.forEach(feature => {
        estados.add(feature.properties.Estado.trim()); // Trim elimina espacios extras
        tipos.add(feature.properties.Tipo.trim());
    });

    let filtroEstado = document.getElementById("filtroEstado");
    let filtroTipo = document.getElementById("filtroTipo");

    estados.forEach(estado => {
        let option = document.createElement("option");
        option.value = estado;
        option.textContent = estado;
        filtroEstado.appendChild(option);
    });

    tipos.forEach(tipo => {
        let option = document.createElement("option");
        option.value = tipo;
        option.textContent = tipo;
        filtroTipo.appendChild(option);
    });
}

// Función para cargar los datos en el mapa
function cargarDatosMapa(datos) {
    capaGeoJSON.clearLayers(); // Limpiar capa antes de agregar nuevos datos

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

// Función para aplicar filtros
function aplicarFiltros() {
    let estadoSeleccionado = document.getElementById("filtroEstado").value.trim();
    let tipoSeleccionado = document.getElementById("filtroTipo").value.trim();

    let datosFiltrados = {
        type: "FeatureCollection",
        features: datosGeoJSON.features.filter(feature => {
            let estadoValido = estadoSeleccionado === "Todos" || feature.properties.Estado.trim() === estadoSeleccionado;
            let tipoValido = tipoSeleccionado === "Todos" || feature.properties.Tipo.trim() === tipoSeleccionado;
            return estadoValido && tipoValido;
        })
    };

    capaGeoJSON.clearLayers(); // Limpiar capa antes de agregar nuevos datos
    cargarDatosMapa(datosFiltrados);
}

// Agregar evento al botón de filtros
document.getElementById("botonFiltrar").addEventListener("click", aplicarFiltros);
