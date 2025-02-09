// Inicializar el mapa en México
var map = L.map('map').setView([23.6345, -102.5528], 5);

// Cargar la capa base de OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Capa de datos
var capaGeoJSON = L.layerGroup().addTo(map);
var datosGeoJSON = null;

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

// Cargar GeoJSON
fetch('https://raw.githubusercontent.com/Dania-Luna/MAPA/main/CENTROS_DE_ATENCION.geojson')
    .then(response => response.json())
    .then(data => {
        console.log("GeoJSON cargado correctamente", data);
        datosGeoJSON = limpiarDatos(data);
        poblarFiltros(datosGeoJSON);
        cargarDatosMapa(datosGeoJSON);
    })
    .catch(error => console.error("Error cargando GeoJSON:", error));

// Función para limpiar datos (elimina valores nulos o incorrectos)
function limpiarDatos(datos) {
    datos.features = datos.features.filter(feature => {
        return feature.properties.Estado && feature.properties.Tipo;
    });
    return datos;
}

// Función para poblar filtros correctamente
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

// Función para cargar datos en el mapa
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
                <b>Dirección:</b> ${feature.properties.Dirección || "No disponible"}<br>
                <b>Tipo de Unidad:</b> ${feature.properties.Tipo}<br>
                <b>Servicios:</b> ${feature.properties.Servicios || "No disponible"}<br>
                <b>Horarios:</b> ${feature.properties.Horarios || "No disponible"}<br>
                <b>Teléfono:</b> ${feature.properties.Teléfono || "No disponible"}`
            );
        }
    });
    capaGeoJSON.addLayer(geojsonLayer);
}

// Función para aplicar filtros correctamente
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
// Variable para la capa de estados
let capaEstados;

// Cargar la capa de estados en el mapa
fetch('https://raw.githubusercontent.com/Dania-Luna/MAPA/main/ESTADOS.geojson')
    .then(response => response.json())
    .then(data => {
        capaEstados = L.geoJSON(data, {
            style: feature => ({
                color: "#555555",  // Color del contorno
                weight: 2,
                fillOpacity: 0   // Sin relleno
            })
        }).addTo(map);
    })
    .catch(error => console.error("Error cargando GeoJSON de estados:", error));

// Función para resaltar un estado y hacer zoom
function resaltarEstado() {
    let estadoSeleccionado = document.getElementById("filtroEstado").value;

    // Verificar si la capa de estados ha sido cargada
    if (!ESTADOS) {
        console.error("La capa de estados no ha sido cargada.");
        return;
    }

    // Si se selecciona "Todos", ocultar la capa y resetear el mapa
    if (estadoSeleccionado === "Todos") {
        map.setView([23.6345, -102.5528], 5); // Zoom a nivel nacional
        if (map.hasLayer(ESTADOS)) {
            map.removeLayer(ESTADOS);
        }
        return;
    } else {
        if (!map.hasLayer(ESTADOS)) {
            map.addLayer(ESTADOS);
        }
    }

    // Limpiar estilos previos
    ESTADOS.eachLayer(layer => {
        ESTADOS.resetStyle(layer);
    });

    // Buscar el estado seleccionado y cambiar su estilo
    let estadoEncontrado = false;
    ESTADOS.eachLayer(layer => {
        if (layer.feature.properties.Estado === estadoSeleccionado) { 
            layer.setStyle({
                color: "#ff7800", // Color de resaltado
                weight: 4,
                fillOpacity: 0
            });

            // Hacer zoom al estado seleccionado
            map.fitBounds(layer.getBounds());
            estadoEncontrado = true;
        }
    });

    if (!estadoEncontrado) {
        console.warn("No se encontró el estado seleccionado en la capa de estados.");
    }
}

// Asignar la función al botón de filtros
document.getElementById("botonFiltrar").addEventListener("click", () => {
    aplicarFiltros();
    resaltarEstado();
});
