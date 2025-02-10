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
        "CDM": "#D14545",          // Rojo suave
        "ULA/FIJA": "#A36A4D",     // Marrón terracota
        "CJM": "#7D3C98",          // Morado oscuro
        "Municipal": "#2874A6",    // Azul fuerte
        "CEB": "#DC7633",          // Naranja medio
        "ULA/Itinerante": "#239B56", // Verde esmeralda
        "ULA/TEL": "#5D6D7E",      // Gris azulado
        "ULA/EMERGENCIA": "#D68910", // Dorado oscuro
        "IMM": "#AF7AC5"           // Lila intenso
    };
    return colores[tipo] || "#808B96"; // Color gris neutro por defecto
}

// Función para generar un marcador con icono más pequeño
function getCustomIcon(tipo) {
    let color = getColorByTipo(tipo);

    return L.divIcon({
        className: "custom-icon",
        html: `<div style="
            width: 18px; 
            height: 18px; 
            background-color: white; 
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid ${color};
            box-shadow: 0px 0px 2px rgba(0,0,0,0.2);">
            <i class="fas fa-map-marker-alt" style="color:${color}; font-size:12px;"></i>
        </div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 18],
        popupAnchor: [0, -18]
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

// Función para aplicar los filtros correctamente
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

// Función para resaltar un estado y hacer zoom
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

