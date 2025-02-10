// Inicializar el mapa en México
var map = L.map('map').setView([23.6345, -102.5528], 5);

// Definir mapas base
var baseMaps = {
    "OpenStreetMap": L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors"
    }),
    "Esri Imagery": L.tileLayer("https://server.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
        attribution: "&copy; Esri, Maxar, Earthstar Geographics"
    }),
    "Carto Light": L.tileLayer("https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png", {
        attribution: "&copy; <a href='https://carto.com/'>Carto</a>"
    })
};

// Agregar OpenStreetMap como mapa base por defecto
var mapaBase = baseMaps["OpenStreetMap"];
mapaBase.addTo(map);

// Agregar control de capas para cambiar entre mapas base
L.control.layers(baseMaps).addTo(map);

// Capas del mapa
var capaGeoJSON = L.layerGroup().addTo(map);
var datosGeoJSON = null;
var capaEstados = null;
var capaEstadoSeleccionado = null;

// Función para asignar colores por tipo de unidad
function getColorByTipo(tipo) {
    const colores = {
        "CDM": "#C0392B",
        "ULA/FIJA": "#8E44AD",
        "CJM": "#2980B9",
        "Municipal": "#27AE60",
        "CEB": "#D35400",
        "ULA/Itinerante": "#F1C40F",
        "ULA/TEL": "#7F8C8D",
        "ULA/EMERGENCIA": "#E67E22",
        "IMM": "#E91E63"
    };
    return colores[tipo] || "#A0A0A0";
}

// Función para crear íconos personalizados
function getCustomIcon(tipo) {
    let color = getColorByTipo(tipo);
    
    return L.divIcon({
        className: "custom-icon",
        html: `<div style="
            width: 12px; 
            height: 12px; 
            background-color: white; 
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid ${color};
            box-shadow: 0px 0px 2px rgba(0,0,0,0.2);">
            <i class="fas fa-map-marker-alt" style="color:${color}; font-size:8px;"></i>
        </div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 12],
        popupAnchor: [0, -12]
    });
}

// Cargar datos de centros de atención
fetch('https://raw.githubusercontent.com/Dania-Luna/MAPA/main/CENTROS_DE_ATENCION.geojson')
    .then(response => response.json())
    .then(data => {
        console.log("GeoJSON de centros cargado correctamente");
        datosGeoJSON = limpiarDatos(data);
        poblarFiltros(datosGeoJSON);
        cargarDatosMapa(datosGeoJSON);
    })
    .catch(error => console.error("Error cargando GeoJSON de centros:", error));

// Función para limpiar datos incorrectos o nulos
function limpiarDatos(datos) {
    datos.features = datos.features.filter(feature => feature.properties.Estado && feature.properties.Tipo);
    return datos;
}

// Función para poblar los filtros
function poblarFiltros(datos) {
    let estados = new Set();
    let tipos = new Set();

    datos.features.forEach(feature => {
        estados.add(feature.properties.Estado.trim());
        tipos.add(feature.properties.Tipo.trim());
    });

    let filtroEstado = document.getElementById("filtroEstado");
    let filtroTipo = document.getElementById("filtroTipo");

    let estadosOrdenados = [...estados].sort();

    filtroEstado.innerHTML = `<option value="Todos">Todos</option>`;
    estadosOrdenados.forEach(estado => {
        filtroEstado.innerHTML += `<option value="${estado}">${estado}</option>`;
    });

    filtroTipo.innerHTML = `<option value="Todos">Todos</option>`;
    tipos.forEach(tipo => {
        filtroTipo.innerHTML += `<option value="${tipo}">${tipo}</option>`;
    });
}

// Función para cargar los puntos en el mapa con popups
function cargarDatosMapa(datos) {
    capaGeoJSON.clearLayers(); 

    var geojsonLayer = L.geoJSON(datos, {
        pointToLayer: function (feature, latlng) {
            let marker = L.marker(latlng, { 
                icon: getCustomIcon(feature.properties.Tipo) 
            });

            marker.bindPopup(
                `<b>Estado:</b> ${feature.properties.Estado}<br>
                <b>Municipio:</b> ${feature.properties.Municipio}<br>
                <b>Nombre de la institución:</b> ${feature.properties["Nombre de la institución"] || "No disponible"}<br>
                <b>Dirección:</b> ${feature.properties.Dirección || "No disponible"}<br>
                <b>Tipo de Unidad:</b> ${feature.properties.Tipo}<br>
                <b>Servicios:</b> ${feature.properties.Servicios || "No disponible"}<br>
                <b>Horarios:</b> ${feature.properties.Horarios || "No disponible"}<br>
                <b>Teléfono:</b> ${feature.properties.Teléfono || "No disponible"}` 
            );

            return marker;
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

// Restaurar la función original de zoom y resaltado de estados
function resaltarEstado() {
    let estadoSeleccionado = document.getElementById("filtroEstado").value;

    if (estadoSeleccionado === "Todos") {
        map.setView([23.6345, -102.5528], 5);
        if (capaEstadoSeleccionado) {
            map.removeLayer(capaEstadoSeleccionado);
            capaEstadoSeleccionado = null;
        }
        return;
    }
}

// Asignar la función al botón de filtros
document.getElementById("botonFiltrar").addEventListener("click", () => {
    aplicarFiltros();
    setTimeout(resaltarEstado, 500);
});

