// Esperar a que el DOM esté completamente cargado
document.addEventListener("DOMContentLoaded", function () {

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
            "CDM": "#C0392B",          // Rojo oscuro
            "ULA/FIJA": "#8E44AD",     // Morado
            "CJM": "#2980B9",          // Azul medio
            "Municipal": "#27AE60",    // Verde
            "CEB": "#D35400",          // Naranja
            "ULA/Itinerante": "#F1C40F", // Amarillo dorado
            "ULA/TEL": "#7F8C8D",      // Gris
            "ULA/EMERGENCIA": "#E67E22", // Naranja intenso
            "IMM": "#E91E63"           // Rosa fuerte
        };
        return colores[tipo] || "#A0A0A0"; // Color gris neutro por defecto
    }

    // Función para generar un marcador con icono más pequeño
    function getCustomIcon(tipo) {
        let color = getColorByTipo(tipo);

        return L.divIcon({
            className: "custom-icon",
            html: `<div style="
                width: 14px; 
                height: 14px; 
                background-color: white; 
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                border: 2px solid ${color};
                box-shadow: 0px 0px 2px rgba(0,0,0,0.2);">
                <i class="fas fa-map-marker-alt" style="color:${color}; font-size:8px;"></i>
            </div>`,
            iconSize: [14, 14],
            iconAnchor: [7, 14],
            popupAnchor: [0, -14]
        });
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
        resaltarEstado(); // Resalta el estado después de aplicar el filtro
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

    // Asignar la función al botón de filtros
    document.getElementById("botonFiltrar").addEventListener("click", aplicarFiltros);
});

