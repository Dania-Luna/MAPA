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
    }),
    "Carto Light": L.tileLayer("https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png", {
        attribution: "&copy; Carto"
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
var capaMunicipios = null;
var capaMunicipioSeleccionado = null;

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

// Función para poblar los filtros de estados, municipios y tipos de unidad
function poblarFiltros(datos) {
    let estados = new Set();
    let municipios = new Set();
    let tipos = new Set();

    datos.features.forEach(feature => {
        estados.add(feature.properties.Estado.trim());
        municipios.add(feature.properties.NOMGEO.trim()); // Aquí usamos NOMGEO
        tipos.add(feature.properties.Tipo.trim());
    });

    let filtroEstado = document.getElementById("filtroEstado");
    let filtroMunicipio = document.getElementById("filtroMunicipio");
    let filtroTipo = document.getElementById("filtroTipo");

    // Ordenar alfabéticamente
    let estadosOrdenados = [...estados].sort();
    let municipiosOrdenados = [...municipios].sort();

    filtroEstado.innerHTML = `<option value="Todos">Todos</option>`;
    estadosOrdenados.forEach(estado => {
        filtroEstado.innerHTML += `<option value="${estado}">${estado}</option>`;
    });

    filtroMunicipio.innerHTML = `<option value="Todos">Todos</option>`;
    municipiosOrdenados.forEach(municipio => {
        filtroMunicipio.innerHTML += `<option value="${municipio}">${municipio}</option>`;
    });

    filtroTipo.innerHTML = `<option value="Todos">Todos</option>`;
    tipos.forEach(tipo => {
        filtroTipo.innerHTML += `<option value="${tipo}">${tipo}</option>`;
    });
}

// Función para cargar los puntos en el mapa con popups
function cargarDatosMapa(datos) {
    capaGeoJSON.clearLayers(); // Limpiar los datos previos

    var geojsonLayer = L.geoJSON(datos, {
        pointToLayer: function (feature, latlng) {
            let marker = L.circleMarker(latlng, {
                radius: 6,
                fillColor: getColorByTipo(feature.properties.Tipo),
                color: "#000",
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8
            });

            marker.bindPopup(
                `<b>Estado:</b> ${feature.properties.Estado}<br>
                <b>Municipio:</b> ${feature.properties.NOMGEO}<br>
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

// Cargar la capa de municipios
fetch('https://raw.githubusercontent.com/Dania-Luna/MAPA/main/MUNICIPIOS.topojson')
    .then(response => response.json())
    .then(data => {
        capaMunicipios = L.geoJSON(data, {
            style: {
                color: "transparent",
                weight: 1,
                fillOpacity: 0
            }
        });
        console.log("Capa de municipios cargada.");
    })
    .catch(error => console.error("Error cargando TopoJSON de municipios:", error));

// Función para resaltar un estado y municipio seleccionados
function resaltarEstadoMunicipio() {
    let estadoSeleccionado = document.getElementById("filtroEstado").value;
    let municipioSeleccionado = document.getElementById("filtroMunicipio").value;

    if (capaEstadoSeleccionado) {
        map.removeLayer(capaEstadoSeleccionado);
    }
    if (capaMunicipioSeleccionado) {
        map.removeLayer(capaMunicipioSeleccionado);
    }

    let estadoEncontrado = {
        type: "FeatureCollection",
        features: capaEstados.toGeoJSON().features.filter(feature =>
            feature.properties.ESTADO === estadoSeleccionado)
    };

    let municipioEncontrado = {
        type: "FeatureCollection",
        features: capaMunicipios.toGeoJSON().features.filter(feature =>
            feature.properties.NOMGEO === municipioSeleccionado)
    };

    if (estadoEncontrado.features.length > 0) {
        capaEstadoSeleccionado = L.geoJSON(estadoEncontrado, {
            style: {
                color: "#ff7800",
                weight: 3,
                fillOpacity: 0
            }
        }).addTo(map);
    }

    if (municipioEncontrado.features.length > 0) {
        capaMunicipioSeleccionado = L.geoJSON(municipioEncontrado, {
            style: {
                color: "#0078ff",
                weight: 3,
                fillOpacity: 0
            }
        }).addTo(map);
    }

    if (estadoEncontrado.features.length > 0) {
        map.fitBounds(capaEstadoSeleccionado.getBounds());
    } else if (municipioEncontrado.features.length > 0) {
        map.fitBounds(capaMunicipioSeleccionado.getBounds());
    }
}

// Aplicar filtros
document.getElementById("botonFiltrar").addEventListener("click", () => {
    aplicarFiltros();
    setTimeout(resaltarEstadoMunicipio, 500);
});
