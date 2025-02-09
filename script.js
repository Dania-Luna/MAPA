// Inicializar el mapa centrado en México
var map = L.map('map').setView([23.6345, -102.5528], 5);

// Agregar capa base de OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Capa GeoJSON para almacenar los datos
var capaGeoJSON = L.layerGroup().addTo(map);

// Variable global para almacenar datos cargados
var datosGeoJSON = null;

// Función para obtener colores según el tipo de unidad
function getColorByTipo(tipo) {
    switch (tipo) {
        case "CDM": return "red";
        case "ULA/FIJA": return "blue";
        case "CJM": return "purple";
        case "Municipal": return "black";
        case "CEB": return "orange";
        case "ULA/Itinerante": return "green";
        case "ULA/TEL": return "brown";
        case "ULA/EMERGENCIA": return "cyan";
        case "IMM": return "pink";
        default: return "gray";
    }
}

// Cargar los datos desde el archivo GeoJSON en GitHub Pages
fetch('https://raw.githubusercontent.com/Dania-Luna/MAPA/main/CENTROS_DE_ATENCION.geojson')
    .then(response => response.json())
    .then(data => {
        console.log("GeoJSON cargado correctamente", data);
        datosGeoJSON = data;
        poblarFiltros(data);
        cargarDatosMapa(data);
    })
    .catch(error => console.error("Error cargando GeoJSON:", error));

// Función para llenar los filtros dinámicamente
function poblarFiltros(datos) {
    let estados = new Set();
    let tipos = new Set();

    datos.features.forEach(feature => {
        estados.add(feature.properties.Estado.trim());
        tipos.add(feature.properties.Tipo.trim());
    });

    let filtroEstado = document.getElementById("filtroEstado");
    let filtroTipo = document.getElementById("filtroTipo");

    filtroEstado.innerHTML = `<option value="Todos">Todos</option>`;
    estados.forEach(estado => {
        filtroEstado.innerHTML += `<option value="${estado}">${estado}</option>`;
    });

    filtroTipo.innerHTML = `<option value="Todos">Todos</option>`;
    tipos.forEach(tipo => {
        filtroTipo.innerHTML += `<option value="${tipo}">${tipo}</option>`;
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
    let estadoSeleccionado = document.getElementById("filtroEstado").value;
    let tipoSeleccionado = document.getElementById("filtroTipo").value;

    let datosFiltrados = {
        type: "FeatureCollection",
        features: datosGeoJSON.features.filter(feature => {
            let estadoValido = estadoSeleccionado === "Todos" || feature.properties.Estado.trim() === estadoSeleccionado;
            let tipoValido = tipoSeleccionado === "Todos" || feature.properties.Tipo.trim() === tipoSeleccionado;
            return estadoValido && tipoValido;
        })
    };

    capaGeoJSON.clearLayers();
    cargarDatosMapa(datosFiltrados);
}
