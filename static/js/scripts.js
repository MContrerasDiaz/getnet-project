function realizarPoll(button) {
    const idTerminal = button.getAttribute("data-terminal");
    const idSucursal = button.getAttribute("data-sucursal");
    const serialNumber = button.getAttribute("data-serial");

    const payload = {
        idTerminal: idTerminal,
        idSucursal: parseInt(idSucursal),
        serialNumber: serialNumber,
        command: 106
    };

    // Estado: esperando
    button.classList.remove('btn-gray', 'btn-circle-green', 'btn-circle-red');
    button.classList.add('btn-warning');

    fetch('/poll_terminal', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then(response => response.json().then(data => ({
        statusCode: response.status,
        body: data
    })))
    .then(({ statusCode, body }) => {
        console.log("Respuesta completa del endpoint poll:", JSON.stringify(body));
        const tooltip = document.getElementById("tooltip");
        button.classList.remove('btn-warning', 'btn-gray');

        let message = "";

        if (statusCode === 200 && body?.status === "OK") {
            button.classList.add('btn-circle-green');
            message = "OK - RESPUESTA RECIBIDA CORRECTAMENTE";
        } else {
            button.classList.add('btn-circle-red');

            try {
                let parsedError = null;

                // Si body.error es un string que contiene JSON, extraerlo
                if (typeof body?.error === 'string' && body.error.includes('{')) {
                    const jsonStart = body.error.indexOf('{');
                    const jsonPart = body.error.slice(jsonStart);
                    parsedError = JSON.parse(jsonPart);
                }

                if (parsedError?.error?.details?.message) {
                    message = parsedError.error.details.message;
                } else if (parsedError?.error?.message) {
                    message = parsedError.error.message;
                } else if (body?.message) {
                    message = body.message;
                } else {
                    message = "Error desconocido al ejecutar poll.";
                }

            } catch (e) {
                console.warn("Error al interpretar JSON anidado:", e);
                message = "Error al interpretar la respuesta del servidor.";
            }
        }

            
            

        // Mostrar tooltip
        tooltip.innerText = message;
        const rect = button.getBoundingClientRect();
        tooltip.style.left = `${rect.left + window.scrollX}px`;
        tooltip.style.top = `${rect.top + window.scrollY - 40}px`;
        tooltip.style.display = "block";

        // Ocultar después de 4 segundos
        //setTimeout(() => {
        //    tooltip.style.display = "none";
        //}, 4000);

        document.addEventListener("click", (event) => {
            if (!tooltip.contains(event.target) && event.target !== button) {
                tooltip.style.display = "none";
            }
        });
    })

    .catch(error => {
    console.error('Error al hacer poll:', error);
    button.classList.remove('btn-warning', 'btn-circle-green');
    button.classList.add('btn-circle-red');

        const tooltip = document.getElementById("tooltip");
        tooltip.innerText = "Error de red o del servidor.";
        const rect = button.getBoundingClientRect();
        tooltip.style.left = `${rect.left + window.scrollX}px`;
        tooltip.style.top = `${rect.top + window.scrollY - 40}px`;
        tooltip.style.display = "block";

        //setTimeout(() => {
        //    tooltip.style.display = "none";
        //}, 4000);

        document.addEventListener("click", (event) => {
            if (!tooltip.contains(event.target) && event.target !== button) {
                tooltip.style.display = "none";
            }
        });
    });

}

function realizarDetalleVenta(button, print = false) {
    const idTerminal = button.getAttribute("data-terminal");
    const idSucursal = button.getAttribute("data-sucursal");
    const serialNumber = button.getAttribute("data-serial");
    const customId = button.getAttribute("data-custom-id");

    const payload = {
        idTerminal,
        idSucursal: parseInt(idSucursal),
        serialNumber,
        command: 105,
        printOnPos: print,
        customId
    };

    if (print) {
        fetch('/detalle_venta', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });
        return;
    }

    // Caso visualización
    const modal = document.getElementById("detalleVentaModal");
    const resultadoContainer = document.getElementById("detalleVentaResultado");

    resultadoContainer.textContent = "Cargando...";
    modal.style.display = "flex";

    fetch('/detalle_venta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
        console.log("Respuesta completa de detalle_venta:", data);
        const resultadoContainer = document.getElementById("detalleVentaResultado"); // <- asegura que esté dentro del scope
        const botonImprimir = document.getElementById("btnImprimirDetalle");
        const botonJson = document.createElement("button");
    botonJson.textContent = "Ver JSON";
    botonJson.className = "button shadow-effect warning";
    botonJson.style.marginLeft = "10px";
    botonJson.onclick = function () {
        const jsonBlob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const jsonUrl = URL.createObjectURL(jsonBlob);
        const nuevaVentana = window.open();
        nuevaVentana.document.write(`
        <html>
            <head>
                <title>JSON Detalle de Venta</title>
                <style>
                    body {
                        font-family: monospace;
                        white-space: pre-wrap;
                        padding: 20px;
                    }
                    textarea {
                        width: 100%;
                        height: 300px;
                    }
                    button {
                        margin-right: 10px;
                        padding: 8px 16px;
                        font-size: 14px;
                        cursor: pointer;
                    }
                    a {
                        text-decoration: none;
                        color: inherit;
                    }
                    a:focus {
                        outline: none;
                    }
                </style>
            </head>
            <body>
                <h3>JSON Crudo del Detalle</h3>
                <textarea id="jsonArea">${JSON.stringify(data, null, 2)}</textarea>
                <br><br>
                <button onclick="navigator.clipboard.writeText(document.getElementById('jsonArea').value)">Copiar</button>
                <a href="${jsonUrl}" download="detalle_venta.txt">
                    <button>Descargar TXT</button>
                </a>
            </body>
        </html>
        `);

    };
    
    botonImprimir.parentElement.appendChild(botonJson);

        const ventas = data?.data?.response?.saleDetails ?? [];
        if (ventas.length > 0) {


let lineas = ventas.map(v => {
    const monto = String(v.amount).padStart(5, ' ');
    const ultimos = v.last4Digits;
    const ticket = v.ticket.slice(-6);
    return `29 ${ultimos}  $ ${monto}  00  ${ticket}  ${v.cardType}    VT`;
}).join('\n');

let totalVentas = ventas.length;
let totalMonto = ventas.reduce((acc, v) => acc + v.amount, 0);

let ticket = `
GETNET
DETALLE TERMINAL ${ventas[0]?.terminalId ?? '-'}
Peluquerías Integrales
${ventas[0]?.commerceCode ?? '-'} - ${ventas[0]?.realDate?.split(" ")[0] ?? '-'} - ${ventas[0]?.realDate?.split(" ")[1] ?? '-'}

F  TARJ  MONTO  NC  C.VENT  VEND  TC  TX
${lineas}


TOTALES
COMPRAS          CANTIDAD       MONTO
CREDITO          :     0       $    0
DEBITO           :     0       $    0
PREPAGO          :     ${totalVentas}       $ ${totalMonto}
CREDITO QR       :     0       $    0
DEBITO QR        :     0       $    0
PREPAGO QR       :     0       $    0
TOTAL VENTAS     :     ${totalVentas}       $ ${totalMonto}


ANULACIONES
/DEVOLUCIONES    CANTIDAD       MONTO
CREDITO          :     0       $    0
DEBITO           :     0       $    0
PREPAGO          :     0       $    0
CREDITO QR       :     0       $    0
DEBITO QR        :     0       $    0
PREPAGO QR       :     0       $    0
TOTAL            :     0       $    0

PROPINA          :     0       $    0
VUELTOS          :     0       $    0
`;

resultadoContainer.innerHTML = `<div class="ticket-container"><pre>${ticket}</pre></div>`;


        } else {
            resultadoContainer.innerHTML = "<p>No hay información de venta disponible.</p>";
        }

    botonImprimir.onclick = function () {
        realizarDetalleVenta(button, true);
        imprimirVisualmenteUltimoTicket();
    };


    })
    .catch(err => {
        const resultadoContainer = document.getElementById("detalleVentaResultado");
        resultadoContainer.textContent = "Error al obtener detalle de venta:\n" + err;
    });

}

function cerrarModalDetalleVenta(event = null) {
    const modal = document.getElementById("detalleVentaModal");
    if (!event || event.target.classList.contains("modal-overlay") || event.target.classList.contains("close-button")) {
        modal.style.display = "none";
    }
}


function realizarUltimaVenta(button) {
    const idTerminal = button.getAttribute("data-terminal");
    const idSucursal = button.getAttribute("data-sucursal");
    const serialNumber = button.getAttribute("data-serial");
    const customId = button.getAttribute("data-custom-id");
    const operationId = parseInt(button.getAttribute("data-operation-id"));

    const payload = {
        idTerminal,
        idSucursal: parseInt(idSucursal),
        serialNumber,
        command: 109,
        operationId,
        printOnPos: true,
        customId
    };

    button.classList.remove('btn-gray', 'btn-circle-green', 'btn-circle-red');
    button.classList.add('btn-warning');

    fetch('/ultima_venta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(response => response.json().then(data => ({ statusCode: response.status, body: data })))
    .then(({ statusCode, body }) => {
        console.log("Respuesta completa del endpoint ULTIMA VENTA:", JSON.stringify(body));

        const tooltip = document.getElementById("tooltip");
        button.classList.remove('btn-warning', 'btn-gray');

        let message = "";

        if (statusCode === 200 && body?.status === "OK") {
            button.classList.add('btn-circle-green');
            message = "OK - RESPUESTA RECIBIDA CORRECTAMENTE";
        } else {
            button.classList.add('btn-circle-red');

            try {
                let parsedError = null;

                if (typeof body?.error === 'string' && body.error.includes('{')) {
                    const jsonStart = body.error.indexOf('{');
                    const jsonPart = body.error.slice(jsonStart);
                    parsedError = JSON.parse(jsonPart);
                }

                if (parsedError?.error?.details?.message) {
                    message = parsedError.error.details.message;
                } else if (parsedError?.error?.message) {
                    message = parsedError.error.message;
                } else if (body?.message) {
                    message = body.message;
                } else {
                    message = "Error desconocido al ejecutar última venta.";
                }
            } catch (e) {
                console.warn("Error al interpretar JSON anidado (última venta):", e);
                message = "Error al interpretar la respuesta del servidor.";
            }
        }

        tooltip.innerText = message;
        const rect = button.getBoundingClientRect();
        tooltip.style.left = `${rect.left + window.scrollX}px`;
        tooltip.style.top = `${rect.top + window.scrollY - 40}px`;
        tooltip.style.display = "block";

        //setTimeout(() => {
        //    tooltip.style.display = "none";
        //}, 4000);

        document.addEventListener("click", (event) => {
            if (!tooltip.contains(event.target) && event.target !== button) {
                tooltip.style.display = "none";
            }
        });
    })

    .catch(error => {
        console.error('Error en última venta:', error);
        button.classList.remove('btn-warning', 'btn-circle-green');
        button.classList.add('btn-red');

        const tooltip = document.getElementById("tooltip");
        tooltip.innerText = "Error de red o servidor.";
        const rect = button.getBoundingClientRect();
        tooltip.style.left = `${rect.left + window.scrollX}px`;
        tooltip.style.top = `${rect.top + window.scrollY - 40}px`;
        tooltip.style.display = "block";

        //setTimeout(() => {
        //    tooltip.style.display = "none";
        //}, 4000);

        document.addEventListener("click", (event) => {
            if (!tooltip.contains(event.target) && event.target !== button) {
                tooltip.style.display = "none";
            }
        });
    });
}



function mostrarOpciones(idDropdown) {
    document.getElementById(idDropdown).style.display = 'block';
}

function filtrarOpciones(idInput, idDropdown) {
    const input = document.getElementById(idInput);
    const filter = input.value.toLowerCase();
    const ul = document.getElementById(idDropdown);
    const items = ul.getElementsByTagName('li');

    for (let i = 0; i < items.length; i++) {
        let txt = items[i].textContent || items[i].innerText;
        items[i].style.display = txt.toLowerCase().includes(filter) ? "" : "none";
    }

    ul.style.display = 'block';
}

document.addEventListener('click', function(e) {
    document.querySelectorAll('.dropdown-content').forEach(ul => {
        if (!ul.parentElement.contains(e.target)) {
            ul.style.display = 'none';
        }
    });
});


function seleccionarOpcion(inputId, valor) {
    const input = document.getElementById(inputId);

    // Si es caja integrada, mostrar texto legible
    if (inputId === 'miInputIntegrada') {
        let texto = "";
        if (valor === "1") texto = "Sí";
        else if (valor === "0") texto = "No";
        else if (valor === "0,1") texto = "Todas";
        input.value = texto;
        input.setAttribute("data-real-value", valor); // Guarda el valor real oculto
    } else {
        input.value = valor;
    }

    const dropdown = input.parentElement.querySelector('.dropdown-content');
    dropdown.style.display = 'none';

    if (inputId === 'miInput') {
        document.getElementById('miInputCaja').value = '';
    }

    realizarBusqueda();
}

function realizarBusqueda() {
    const input = document.getElementById("miInputIntegrada");
    const realValue = input.getAttribute("data-real-value");
    if (realValue !== null) input.value = realValue;
    console.log("Ejecutando búsqueda...");
    document.getElementById("formulario_busqueda").submit();
}
            

    document.addEventListener('click', function(event) {
        const dropdowns = document.querySelectorAll('.dropdown-content');
        dropdowns.forEach(dropdown => {
            if (!dropdown.parentElement.contains(event.target)) {
                dropdown.style.display = 'none';
            }
        });
    });

    document.addEventListener('keydown', function(event) {
        if (event.key === 'Tab' || event.key === 'Escape') {
            const dropdowns = document.querySelectorAll('.dropdown-content');
            dropdowns.forEach(dropdown => {
                dropdown.style.display = 'none';
            });
        }
    });

    document.getElementById(".dropdown-content").addEventListener("keypress", 
    function(event) {
            if (event.key === "Enter") {
                event.preventDefault();
                realizarBusqueda();
            }
        });

function actualizarCajas(sucursal) {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/actualizar_cajas');
    xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            const miDropdownCaja = document.getElementById('miDropdownCaja');
            miDropdownCaja.innerHTML = '';

            response.cajas.forEach(function(caja) {
                const li = document.createElement('li');
                li.textContent = caja;
                li.onclick = function() {
                    seleccionarOpcion('miInputCaja', caja);
                };
                miDropdownCaja.appendChild(li);
            });
        } else if (xhr.readyState === 4) {
            console.log(`Error en la solicitud: ${xhr.status} - ${xhr.responseText}`); 
        }
    };
    xhr.send(JSON.stringify({ sucursal: sucursal }));
}

function confirmUpdate(button) {
    const id_terminal = $(button).data('id');

    $.get(`/verificar_caja_activa/${id_terminal}`, function(response) {
        if (response.success) {
            const confirmUpdate = confirm("¿Estás seguro de que deseas actualizar el estado?");
            if (confirmUpdate) {
                updateEstadoTerminal(button);
            }
        } else {
            alert(response.message);
        }
    });
}

function updateEstadoTerminal(button) {
    const id_terminal = $(button).data('id');
    $.post('/update_estado_terminal/' + id_terminal, function(response) {
        if (response.success) {
            const newState = response.new_state;
            if (newState === 1) {
                $(button).removeClass('btn-danger').addClass('btn-success');
            } else {
                $(button).removeClass('btn-success').addClass('btn-danger');
            }
            realizarBusqueda();
        } else {
            alert('Error: ' + response.error);
        }
    });
}

function confirmUpdate2(button) {
    var confirmUpdate2 = confirm("¿Estás seguro de que deseas actualizar la integracion de Caja?");
    if (confirmUpdate2) {
        updateCajaIntegrada(button);
    }
}
function updateCajaIntegrada(button) {
    const id_terminal = $(button).data('id');
    $.post('/update_caja_integrada/' + id_terminal, function(response) {
        if (response.success) {
            const newState = response.new_state;
            if (newState === 1) {
                $(button).removeClass('btn-danger').addClass('btn-success');
            } else {
                $(button).removeClass('btn-success').addClass('btn-danger');
            }
            realizarBusqueda();
        } else {
            alert('Error: ' + response.error);
        }
    });
}

