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
    button.classList.remove('btn-gray', 'btn-green', 'btn-red');
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
            button.classList.add('btn-green');
            message = "OK - RESPUESTA RECIBIDA CORRECTAMENTE";
        } else {
            button.classList.add('btn-red');

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
    button.classList.remove('btn-warning', 'btn-green');
    button.classList.add('btn-red');

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

function realizarDetalleVenta(button, print = true) {
    const idTerminal = button.getAttribute("data-terminal");
    const idSucursal = button.getAttribute("data-sucursal");
    const serialNumber = button.getAttribute("data-serial");
    const customId = button.getAttribute("data-custom-id");

    const payload = {
        idTerminal,
        idSucursal: parseInt(idSucursal),
        serialNumber,
        command: 105,
        printOnPos: true,
        customId
    };

    button.classList.remove('btn-gray', 'btn-green', 'btn-red');
    button.classList.add('btn-warning');

    fetch('/detalle_venta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(response => response.json().then(data => ({ statusCode: response.status, body: data })))
    .then(({ statusCode, body }) => {
        console.log("Respuesta completa del endpoint DETALLE:", JSON.stringify(body));

        const tooltip = document.getElementById("tooltip");
        button.classList.remove('btn-warning', 'btn-gray');

        let message = "";

        if (statusCode === 200 && body?.status === "OK") {
            button.classList.add('btn-green');
            message = "OK - RESPUESTA RECIBIDA CORRECTAMENTE";
        } else {
            button.classList.add('btn-red');

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
                    message = "Error desconocido al ejecutar detalle de venta.";
                }
            } catch (e) {
                console.warn("Error al interpretar JSON anidado (detalle):", e);
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
        console.error('Error en detalle de venta:', error);
        button.classList.remove('btn-warning', 'btn-green');
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

    button.classList.remove('btn-gray', 'btn-green', 'btn-red');
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
            button.classList.add('btn-green');
            message = "OK - RESPUESTA RECIBIDA CORRECTAMENTE";
        } else {
            button.classList.add('btn-red');

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
        button.classList.remove('btn-warning', 'btn-green');
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



function filtrarOpciones(inputId, dropdownId) {
    const input = document.getElementById(inputId);
    const filter = input.value.toUpperCase();
    const dropdown = document.getElementById(dropdownId);
    const items = dropdown.getElementsByTagName("li");

    for (let i = 0; i < items.length; i++) {
        const txtValue = items[i].textContent || items[i].innerText;
        items[i].style.display = txtValue.toUpperCase().indexOf(filter) > -1 ? "" : "none";
    }
    dropdown.style.display = 'block';
}

    function seleccionarOpcion(inputId, valor) {
        const input = document.getElementById(inputId);
        input.value = valor;

        const dropdown = document.getElementById(inputId).parentElement.querySelector('.dropdown-content');
        dropdown.style.display = 'none';
        
        if (inputId === 'miInput') {
        document.getElementById('miInputCaja').value = '';
    }
        document.getElementById(inputId).value = valor;
        realizarBusqueda();
    }

    function realizarBusqueda() {
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