// Inicializar el mapa en México
var map = L.map("map").setView([23.6345, -102.5528], 5);

// Definir mapas base
var baseMaps = {
    "OpenStreetMap": L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors"
    }),
    "Esri Imagery": L.tileLayer("https://server.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
        attribution: "&copy; Esri, Maxar, Earthstar Geographics"
    
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
var capaMunicipios = null;
var capaEstadoSeleccionado = null;
var capaMunicipioSeleccionado = null;

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
fetch("https://raw.githubusercontent.com/Dania-Luna/MAPA/main/CENTROS_DE_ATENCION.geojson")
    .then(response => response.json())
    .then(data => {
        console.log("GeoJSON de centros cargado correctamente");
        datosGeoJSON = limpiarDatos(data);
        poblarFiltros(datosGeoJSON);
        cargarDatosMapa(datosGeoJSON);
    })
    .catch(error => console.error("Error cargando GeoJSON de centros:", error));

// Cargar capa de estados
fetch("https://raw.githubusercontent.com/Dania-Luna/MAPA/main/ESTADOS.geojson")
    .then(response => response.json())
    .then(data => {
        capaEstados = L.geoJSON(data, {
            style: { color: "transparent", weight: 1, fillOpacity: 0 }
        });
        console.log("Capa de estados cargada.");
    })
    .catch(error => console.error("Error cargando GeoJSON de estados:", error));

// Cargar capa de municipios (TopoJSON)
fetch("https://raw.githubusercontent.com/Dania-Luna/MAPA/main/MUNICIPIOS.topojson")
    .then(response => response.json())
    .then(data => {
        capaMunicipios = L.geoJSON(topojson.feature(data, data.objects.municipios), {
            style: { color: "transparent", weight: 1, fillOpacity: 0 }
        });
        console.log("Capa de municipios cargada.");
    })
    .catch(error => console.error("Error cargando TopoJSON de municipios:", error));

// Función para limpiar datos incorrectos o nulos
function limpiarDatos(datos) {
    datos.features = datos.features.filter(feature => feature.properties.Estado && feature.properties.Municipio && feature.properties.Tipo);
    return datos;
}

// Función para poblar los filtros de estados, municipios y tipos de unidad
function poblarFiltros(datos) {
    let estados = new Set();
    let municipios = new Map();
    let tipos = new Set();

    datos.features.forEach(feature => {
        let estado = feature.properties.Estado.trim();
        let municipio = feature.properties.Municipio.trim();
        estados.add(estado);
        tipos.add(feature.properties.Tipo.trim());

        if (!municipios.has(estado)) {
            municipios.set(estado, new Set());
        }
        municipios.get(estado).add(municipio);
    });

    let filtroEstado = document.getElementById("filtroEstado");
    let filtroMunicipio = document.getElementById("filtroMunicipio");
    let filtroTipo = document.getElementById("filtroTipo");

    filtroEstado.innerHTML = `<option value="Todos">Todos</option>`;
    [...estados].sort().forEach(estado => {
        filtroEstado.innerHTML += `<option value="${estado}">${estado}</option>`;
    });

    filtroTipo.innerHTML = `<option value="Todos">Todos</option>`;
    tipos.forEach(tipo => {
        filtroTipo.innerHTML += `<option value="${tipo}">${tipo}</option>`;
    });

    filtroEstado.addEventListener("change", function () {
        let estadoSeleccionado = filtroEstado.value;
        filtroMunicipio.innerHTML = `<option value="Todos">Todos</option>`;

        if (municipios.has(estadoSeleccionado)) {
            [...municipios.get(estadoSeleccionado)].sort().forEach(municipio => {
                filtroMunicipio.innerHTML += `<option value="${municipio}">${municipio}</option>`;
            });
        }
    });
}

// Función para cargar los puntos en el mapa con popups
function cargarDatosMapa(datos) {
    capaGeoJSON.clearLayers();
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

// Función para aplicar filtros y resaltar el estado y municipio
function aplicarFiltros() {
    let estadoSeleccionado = document.getElementById("filtroEstado").value;
    let municipioSeleccionado = document.getElementById("filtroMunicipio").value;
    let tipoSeleccionado = document.getElementById("filtroTipo").value;

    let datosFiltrados = {
        type: "FeatureCollection",
        features: datosGeoJSON.features.filter(feature => {
            return (
                (estadoSeleccionado === "Todos" || feature.properties.Estado === estadoSeleccionado) &&
                (municipioSeleccionado === "Todos" || feature.properties.Municipio === municipioSeleccionado) &&
                (tipoSeleccionado === "Todos" || feature.properties.Tipo === tipoSeleccionado)
            );
        })
    };

    capaGeoJSON.clearLayers();
    cargarDatosMapa(datosFiltrados);
}

// Asignar función al botón de filtros
document.getElementById("botonFiltrar").addEventListener("click", aplicarFiltros);


