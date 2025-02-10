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

// Función para asignar colores según la nueva paleta
function getColorByTipo(tipo) {
    const colores = {
        "CDM": "#D8A29A",          // Rosa neutro
        "ULA/FIJA": "#C0A29D",     // Beige rosado
        "CJM": "#8A3E5F",          // Vino oscuro
        "Municipal": "#4A5A5B",    // Verde grisáceo
        "CEB": "#9A6A5C",          // Terracota claro
        "ULA/Itinerante": "#DBB484", // Oro viejo
        "ULA/TEL": "#586E75",      // Azul verdoso
        "ULA/EMERGENCIA": "#D9C9B0", // Crema suave
        "IMM": "#AF9AA5"           // Lavanda apagado
    };
    return colores[tipo] || "#A09C97"; // Color neutro por defecto
}

// Función para generar un marcador estilizado con fondo circular
function getCustomIcon(tipo) {
    let color = getColorByTipo(tipo);

    return L.divIcon({
        className: "custom-icon",
        html: `<div style="
            width: 36px; 
            height: 36px; 
            background-color: white; 
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 3px solid ${color};
            box-shadow: 0px 0px 5px rgba(0,0,0,0.3);">
            <i class="fas fa-map-marker-alt" style="color:${color}; font-size:22px;"></i>
        </div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36]
    });
}


// Función para generar un icono de FontAwesome con color dinámico
function getCustomIcon(tipo) {
    let colorCorazon = getColorByTipo(tipo); // Color del corazón
    let colorManos = "#E1A95F"; // Tono piel para las manos

    return L.divIcon({
        className: "custom-icon",
        html: `<i class="fas fa-hand-holding-heart" style="color:${colorManos}; font-size:24px;"></i>
               <i class="fas fa-heart" style="color:${colorCorazon}; font-size:16px; position: absolute; left: 8px; top: 5px;"></i>`,
        iconSize: [24, 24],
        iconAnchor: [12, 24],
        popupAnchor: [0, -24]
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

// Función para poblar los filtros de estados y tipos de unidad
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

// Función para cargar los iconos en el mapa con popups
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
