// Inicializar el mapa centrado en México
var map = L.map('map').setView([23.6345, -102.5528], 5);

// Agregar capa base de OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Capa GeoJSON para almacenar los datos
var capaGeoJSON = L.layerGroup().addTo(map);

// Variables para almacenar estados y tipos de unidad únicos
let estadosUnicos = new Set();
let tiposUnicos = new Set();
let datosGeoJSON; // Variable global para almacenar los datos

// Función para obtener colores según el tipo de unidad
function getColorByTipo(tipo) {
    switch (tipo) {
        case "CDM": return "red";  
        case "ULA/FIJA": return "blue"; 
        case "ULA/ITINERANTE": return "cyan"; 
        case "ULA/TEL": return "teal"; 
        case "ULA/MOVIL": return "magenta"; 
        case "ULA/EMERGENCIA": return "yellow"; 
        case "CJM": return "purple"; 
        case "CJMF": return "darkviolet"; 
        case "Municipal": return "black"; 
        case "Estatal": return "green"; 
        case "Federal": return "orange"; 
        case "CEB": return "brown"; 
        case "CEA": return "darkblue"; 
        case "CEAV": return "darkred"; 
        case "Punto Violeta": return "pink";
        case "IMM": return "darkcyan";
        case "IMMT": return "gold";
        case "IMEF": return "salmon";
        case "CAVIZ": return "lime";
        case "COBUPEJ": return "coral";
        default: return "gray"; // Color para otros tipos desconocidos
    }
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

// Función para poblar los filtros dinámicamente
function poblarFiltros(datos) {
    datos.features.forEach(feature => {
        estadosUnicos.add(feature.properties.Estado.trim());
        tiposUnicos.add(feature.properties.Tipo.trim());
    });

    let selectEstado = document.getElementById("filtroEstado");
    estadosUnicos.forEach(estado => {
        let option = document.createElement("option");
        option.value = estado;
        option.textContent = estado;
        selectEstado.appendChild(option);
    });

    let selectTipo = document.getElementById("filtroTipo");
    tiposUnicos.forEach(tipo => {
        let option = document.createElement("option");
        option.value = tipo;
        option.textContent = tipo;
        selectTipo.appendChild(option);
    });
}

// Cargar los datos desde el archivo GeoJSON en GitHub Pages
fetch('https://raw.githubusercontent.com/Dania-Luna/MAPA/main/CENTROS_DE_ATENCION.geojson')
    .then(response => response.json())
    .then(data => {
        datosGeoJSON = data;
        poblarFiltros(data); // Llenar filtros dinámicamente
        cargarDatosMapa(data);
    })
    .catch(error => console.error("Error cargando GeoJSON:", error));

// Función para aplicar filtros
function aplicarFiltros() {
    let estadoSeleccionado = document.getElementById("filtroEstado").value;
    let tipoSeleccionado = document.getElementById("filtroTipo").value;

    let datosFiltrados = {
        "type": "FeatureCollection",
        "features": datosGeoJSON.features.filter(feature => {
            let estadoValido = estadoSeleccionado === "Todos" || feature.properties.Estado.trim() === estadoSeleccionado.trim();
            let tipoValido = tipoSeleccionado === "Todos" || feature.properties.Tipo.trim() === tipoSeleccionado.trim();
            return estadoValido && tipoValido;
        })
    };

    // Cargar los datos filtrados en el mapa
    cargarDatosMapa(datosFiltrados);
}

// Asignar evento al botón de filtros
document.getElementById("botonFiltrar").addEventListener("click", aplicarFiltros);

