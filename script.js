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
    "Google Satellite": L.tileLayer("https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}", {
        attribution: "&copy; Google"
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
        "CDM": "red",
        "ULA/FIJA": "blue",
        "CJM": "purple",
        "Municipal": "black",
        "CEB": "orange",
        "ULA/Itinerante": "green",
        "ULA/TEL": "brown",
        "ULA/EMERGENCIA": "cyan",
        "IMM": "pink"
    };
    return colores[tipo] || "gray";
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
    datos.features = datos.features.filter(feature => feature.properties.Estado && feature.properties["Tipo de Unidad"]);
    return datos;
}

// Función para poblar los filtros de estados y tipos de unidad
function poblarFiltros(datos) {
    let estados = new Set();
    let tipos = new Set();

    datos.features.forEach(feature => {
        estados.add(feature.properties.Estado.trim());
        tipos.add(feature.properties["Tipo de Unidad"].trim());
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
            let marker = L.circleMarker(latlng, {
                radius: 6,
                fillColor: getColorByTipo(feature.properties["Tipo de Unidad"]),
                color: "#000",
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8
            });

            marker.bindPopup(
                `<b>Estado:</b> ${feature.properties.Estado}<br>
                <b>Municipio:</b> ${feature.properties.Municipio}<br>
                <b>Nombre de la institución:</b> ${feature.properties["Nombre de la institución"] || "No disponible"}<br>
                <b>Dirección:</b> ${feature.properties.Dirección || "No disponible"}<br>
                <b>Tipo de Unidad:</b> ${feature.properties["Tipo de Unidad"]}<br>
                <b>Servicios:</b> ${feature.properties.Servicios || "No disponible"}<br>
                <b>Horarios:</b> ${feature.properties.Horarios || "No disponible"}<br>
                <b>Teléfono:</b> ${feature.properties.Teléfono || "No disponible"}` 
            );

            return marker;
        }
    });

    capaGeoJSON.addLayer(geojsonLayer);
}

// Cargar la capa de estados y permitir resaltado
fetch('https://raw.githubusercontent.com/Dania-Luna/MAPA/main/ESTADOS.geojson')
    .then(response => response.json())
    .then(data => {
        capaEstados = L.geoJSON(data, {
            style: {
                color: "#000",
                weight: 2,
                fillOpacity: 0
            }
        }).addTo(map);
    })
    .catch(error => console.error("Error cargando GeoJSON de estados:", error));

// Función para resaltar un estado y hacer zoom
function resaltarEstado() {
    let estadoSeleccionado = document.getElementById("filtroEstado").value;

    if (capaEstadoSeleccionado) {
        map.removeLayer(capaEstadoSeleccionado);
    }

    if (estadoSeleccionado === "Todos") {
        map.setView([23.6345, -102.5528], 5);
        return;
    }

    let estadoEncontrado = {
        type: "FeatureCollection",
        features: capaEstados.toGeoJSON().features.filter(feature =>
            feature.properties.ESTADO === estadoSeleccionado)
    };

    if (estadoEncontrado.features.length > 0) {
        capaEstadoSeleccionado = L.geoJSON(estadoEncontrado, {
            style: {
                color: "#ff7800",
                weight: 3,
                fillOpacity: 0
            }
        }).addTo(map);

        map.fitBounds(capaEstadoSeleccionado.getBounds());
    }
}

// Asignar la función al botón de filtros
document.getElementById("botonFiltrar").addEventListener("click", () => {
    aplicarFiltros();
    setTimeout(resaltarEstado, 500);
});
