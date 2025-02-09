// Inicializar el mapa en México
var map = L.map('map').setView([23.6345, -102.5528], 5);

// Cargar la capa base de OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Capa de datos de centros de atención
var capaGeoJSON = L.layerGroup().addTo(map);
var datosGeoJSON = null;
var capaEstados = null;  // Capa con todos los estados
var capaEstadoSeleccionado = null; // Capa para el estado resaltado

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

// Cargar datos de centros de atención desde GeoJSON
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
                <b>Nombre de la institución:</b> ${feature.properties["Nombre de la institución"] || "No disponible"}<br>
                <b>Tipo de Unidad:</b> ${feature.properties.Tipo}<br>
                <b>Dirección:</b> ${feature.properties.Dirección || "No disponible"}<br>
                <b>Servicios:</b> ${feature.properties.Servicios || "No disponible"}<br>
                <b>Horarios:</b> ${feature.properties.Horarios || "No disponible"}<br>
                <b>Teléfono:</b> ${feature.properties.Teléfono || "No disponible"}`
            );
        }
    });
    capaGeoJSON.addLayer(geojsonLayer);
}

// Función para aplicar filtros a los puntos del mapa
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

// Cargar la capa de estados en el mapa
fetch('https://raw.githubusercontent.com/Dania-Luna/MAPA/main/ESTADOS.geojson')
    .then(response => response.json())
    .then(data => {
        capaEstados = L.geoJSON(data, {
            style: {
                color: "transparent",  // Inicialmente sin color para ocultar los estados
                weight: 1,
                fillOpacity: 0
            }
        });
        console.log("Capa de estados cargada.");
    })
    .catch(error => console.error("Error cargando GeoJSON de estados:", error));

// Función para resaltar un estado y hacer zoom
function resaltarEstado() {
    let estadoSeleccionado = document.getElementById("filtroEstado").value;

    // Si se selecciona "Todos", quitar el resaltado y resetear el mapa
    if (estadoSeleccionado === "Todos") {
        map.setView([23.6345, -102.5528], 5); // Zoom a nivel nacional
        if (capaEstadoSeleccionado) {
            map.removeLayer(capaEstadoSeleccionado);
            capaEstadoSeleccionado = null;
        }
        return;
    }

    // Si ya hay un estado resaltado, quitarlo antes de agregar el nuevo
    if (capaEstadoSeleccionado) {
        map.removeLayer(capaEstadoSeleccionado);
    }

    // Buscar el estado seleccionado en la capa de estados
    let estadoEncontrado = {
        type: "FeatureCollection",
        features: capaEstados.toGeoJSON().features.filter(feature => 
            feature.properties.ESTADO === estadoSeleccionado)
    };

    if (estadoEncontrado.features.length === 0) {
        console.warn("No se encontró el estado seleccionado en la capa de estados.");
        return;
    }

    // Agregar solo el estado seleccionado con color naranja
    capaEstadoSeleccionado = L.geoJSON(estadoEncontrado, {
        style: {
            color: "#ff7800", // Color de resaltado
            weight: 3,
            fillOpacity: 0
        }
    }).addTo(map);

    // Hacer zoom al estado seleccionado
    map.fitBounds(capaEstadoSeleccionado.getBounds());
}

// Asignar la función al botón de filtros
document.getElementById("botonFiltrar").addEventListener("click", () => {
    aplicarFiltros();   
    setTimeout(resaltarEstado, 500);  
});
