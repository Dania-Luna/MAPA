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

// Función para poblar los filtros de estados, municipios y tipos de unidad en orden alfabético
function poblarFiltros(datos) {
    let estados = new Set();
    let municipios = new Set();
    let tipos = new Set();

    datos.features.forEach(feature => {
        estados.add(feature.properties.Estado.trim());
        if (feature.properties.Municipio) {
            municipios.add(feature.properties.Municipio.trim());
        }
        tipos.add(feature.properties.Tipo.trim());
    });

    let filtroEstado = document.getElementById("filtroEstado");
    let filtroMunicipio = document.getElementById("filtroMunicipio");
    let filtroTipo = document.getElementById("filtroTipo");

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

// Cargar la capa de municipios
fetch('https://raw.githubusercontent.com/Dania-Luna/MAPA/main/MUNICIPIOS.json')
    .then(response => response.json())
    .then(data => {
        console.log("GeoJSON de municipios cargado correctamente");
        capaMunicipios = L.geoJSON(data, {
            style: {
                color: "#008000",  // Color verde para los municipios
                weight: 2,
                fillOpacity: 0
            }
        });

        // Poblar el filtro de municipios con `NOMGEO`
        poblarFiltroMunicipios(data);
    })
    .catch(error => console.error("Error cargando GeoJSON de municipios:", error));

// Función para poblar el filtro de municipios
function poblarFiltroMunicipios(datos) {
    let municipios = new Set();

    datos.features.forEach(feature => {
        municipios.add(feature.properties.NOMGEO.trim()); // Usamos 'NOMGEO' como nombre de municipio
    });

    let filtroMunicipio = document.getElementById("filtroMunicipio");
    let municipiosOrdenados = [...municipios].sort();

    filtroMunicipio.innerHTML = `<option value="Todos">Todos</option>`;
    municipiosOrdenados.forEach(municipio => {
        filtroMunicipio.innerHTML += `<option value="${municipio}">${municipio}</option>`;
    });
}

// Función para aplicar filtros
function aplicarFiltros() {
    let estadoSeleccionado = document.getElementById("filtroEstado").value;
    let municipioSeleccionado = document.getElementById("filtroMunicipio").value;
    let tipoSeleccionado = document.getElementById("filtroTipo").value;

    let datosFiltrados = {
        type: "FeatureCollection",
        features: datosGeoJSON.features.filter(feature => {
            let estadoValido = estadoSeleccionado === "Todos" || feature.properties.Estado.trim() === estadoSeleccionado;
            let municipioValido = municipioSeleccionado === "Todos" || feature.properties.Municipio?.trim() === municipioSeleccionado;
            let tipoValido = tipoSeleccionado === "Todos" || feature.properties.Tipo.trim() === tipoSeleccionado;
            return estadoValido && municipioValido && tipoValido;
        })
    };

    capaGeoJSON.clearLayers();
    cargarDatosMapa(datosFiltrados);
}

// Función para resaltar estado y municipio
function resaltarEstadoMunicipio() {
    let estadoSeleccionado = document.getElementById("filtroEstado").value;
    let municipioSeleccionado = document.getElementById("filtroMunicipio").value;

    // Resaltar estado
    if (capaEstadoSeleccionado) {
        map.removeLayer(capaEstadoSeleccionado);
    }

    if (estadoSeleccionado !== "Todos") {
        capaEstadoSeleccionado = L.geoJSON(capaEstados.toGeoJSON(), {
            filter: feature => feature.properties.ESTADO === estadoSeleccionado,
            style: {
                color: "#ff7800",
                weight: 3,
                fillOpacity: 0
            }
        }).addTo(map);
        map.fitBounds(capaEstadoSeleccionado.getBounds());
    }

    // Resaltar municipio
    if (capaMunicipioSeleccionado) {
        map.removeLayer(capaMunicipioSeleccionado);
    }

    if (municipioSeleccionado !== "Todos") {
        capaMunicipioSeleccionado = L.geoJSON(capaMunicipios.toGeoJSON(), {
            filter: feature => feature.properties.NOMGEO === municipioSeleccionado,
            style: {
                color: "#0000FF",
                weight: 3,
                fillOpacity: 0
            }
        }).addTo(map);
        map.fitBounds(capaMunicipioSeleccionado.getBounds());
    }
}

// Asignar la función al botón de filtros
document.getElementById("botonFiltrar").addEventListener("click", () => {
    aplicarFiltros();
    setTimeout(resaltarEstadoMunicipio, 500);
});

