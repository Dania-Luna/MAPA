// Inicializar el mapa en México
var map = L.map('map').setView([23.6345, -102.5528], 5);

// Cargar la capa base de OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Capas del mapa
var capaGeoJSON = L.layerGroup().addTo(map);
var datosGeoJSON = null;
var capaEstados = null;
var capaEstadoSeleccionado = null;

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
    datos.features = datos.features.filter(feature => feature.properties.Estado && feature.properties["Nombre de la institución"]);
    return datos;
}

// Función para poblar los filtros de estados y nombres de institución
function poblarFiltros(datos) {
    let estados = new Set();
    let instituciones = new Set();

    datos.features.forEach(feature => {
        estados.add(feature.properties.Estado.trim());
        instituciones.add(feature.properties["Nombre de la institución"].trim());
    });

    let filtroEstado = document.getElementById("filtroEstado");
    let filtroInstitucion = document.getElementById("filtroInstitucion"); // Cambio aquí

    // Ordenar estados alfabéticamente
    let estadosOrdenados = [...estados].sort();
    let institucionesOrdenadas = [...instituciones].sort();

    filtroEstado.innerHTML = `<option value="Todos">Todos</option>`;
    estadosOrdenados.forEach(estado => {
        filtroEstado.innerHTML += `<option value="${estado}">${estado}</option>`;
    });

    filtroInstitucion.innerHTML = `<option value="Todos">Todos</option>`;
    institucionesOrdenadas.forEach(nombre => {
        filtroInstitucion.innerHTML += `<option value="${nombre}">${nombre}</option>`;
    });
}

// Función para cargar los puntos en el mapa con popups
function cargarDatosMapa(datos) {
    capaGeoJSON.clearLayers(); // Limpiar los datos previos

    var geojsonLayer = L.geoJSON(datos, {
        pointToLayer: function (feature, latlng) {
            let marker = L.circleMarker(latlng, {
                radius: 6,
                fillColor: "blue",
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
                <b>Servicios:</b> ${feature.properties.Servicios || "No disponible"}<br>
                <b>Horarios:</b> ${feature.properties.Horarios || "No disponible"}<br>
                <b>Teléfono:</b> ${feature.properties.Teléfono || "No disponible"}` 
            );

            return marker;
        }
    });

    capaGeoJSON.addLayer(geojsonLayer);
}

// Función para aplicar filtros y mantener popups
function aplicarFiltros() {
    let estadoSeleccionado = document.getElementById("filtroEstado").value;
    let institucionSeleccionada = document.getElementById("filtroInstitucion").value;

    let datosFiltrados = {
        type: "FeatureCollection",
        features: datosGeoJSON.features.filter(feature => {
            let estadoValido = estadoSeleccionado === "Todos" || feature.properties.Estado.trim() === estadoSeleccionado;
            let institucionValida = institucionSeleccionada === "Todos" || feature.properties["Nombre de la institución"].trim() === institucionSeleccionada;
            return estadoValido && institucionValida;
        })
    };

    capaGeoJSON.clearLayers();
    cargarDatosMapa(datosFiltrados);
}

// Cargar la capa de estados sin mostrarla al inicio
fetch('https://raw.githubusercontent.com/Dania-Luna/MAPA/main/ESTADOS.geojson')
    .then(response => response.json())
    .then(data => {
        capaEstados = L.geoJSON(data, {
            style: {
                color: "transparent",
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

    if (estadoSeleccionado === "Todos") {
        map.setView([23.6345, -102.5528], 5);
        if (capaEstadoSeleccionado) {
            map.removeLayer(capaEstadoSeleccionado);
            capaEstadoSeleccionado = null;
        }
        return;
    }

    if (capaEstadoSeleccionado) {
        map.removeLayer(capaEstadoSeleccionado);
    }

    let estadoEncontrado = {
        type: "FeatureCollection",
        features: capaEstados.toGeoJSON().features.filter(feature =>
            feature.properties.ESTADO === estadoSeleccionado)
    };

    if (estadoEncontrado.features.length === 0) {
        console.warn("No se encontró el estado seleccionado.");
        return;
    }

    capaEstadoSeleccionado = L.geoJSON(estadoEncontrado, {
        style: {
            color: "#ff7800",
            weight: 3,
            fillOpacity: 0
        }
    }).addTo(map);

    map.fitBounds(capaEstadoSeleccionado.getBounds());
}

// Asignar la función al botón de filtros y reactivar popups
document.getElementById("botonFiltrar").addEventListener("click", () => {
    aplicarFiltros();
    setTimeout(resaltarEstado, 500);
});
