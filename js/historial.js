document.addEventListener('DOMContentLoaded', function () {
    const usuario = PokeBank.requireSession();
    if (!usuario) return;

    PokeBank.updateHeaderUserInfo();

    function money(value) {
        return `${PokeBank.formatMoney(value)} Pokédólares`;
    }

    function emptyRow(tableId, colspan, message) {
        const tbody = document.querySelector(`#${tableId} tbody`);
        if (!tbody) return;
        tbody.innerHTML = `<tr><td colspan="${colspan}" class="text-center">${message}</td></tr>`;
    }

    function renderRows(tableId, rows, mapper, colspan, emptyMessage) {
        const tbody = document.querySelector(`#${tableId} tbody`);
        if (!tbody) return;

        if (!rows.length) {
            emptyRow(tableId, colspan, emptyMessage);
            return;
        }

        tbody.innerHTML = rows.map(mapper).join('');
    }

    function renderHistorial() {
        const transacciones = PokeBank.getCurrentUserTransactions();
        const depositos = transacciones.filter(t => t.tipo === 'deposito');
        const retiros = transacciones.filter(t => t.tipo === 'retiro');
        const pagos = transacciones.filter(t => t.tipo === 'pago');

        renderRows(
            'tabla-depositos',
            depositos,
            function (t) {
                return `
                    <tr>
                        <td>${t.fecha}</td>
                        <td>${money(t.monto)}</td>
                        <td>${t.cuentaDestino || '-'}</td>
                        <td>${t.descripcion || '-'}</td>
                    </tr>`;
            },
            4,
            'No hay depósitos registrados.'
        );

        renderRows(
            'tabla-retiros',
            retiros,
            function (t) {
                return `
                    <tr>
                        <td>${t.fecha}</td>
                        <td>${money(t.monto)}</td>
                        <td>${t.descripcion || '-'}</td>
                    </tr>`;
            },
            3,
            'No hay retiros registrados.'
        );

        renderRows(
            'tabla-pagos',
            pagos,
            function (t) {
                return `
                    <tr>
                        <td>${t.fecha}</td>
                        <td>${t.servicio || t.descripcion || '-'}</td>
                        <td>${money(t.monto)}</td>
                        <td>${t.numeroServicio || t.cuentaDestino || '-'}</td>
                    </tr>`;
            },
            4,
            'No hay pagos registrados.'
        );

        renderRows(
            'tabla-informe',
            transacciones,
            function (t) {
                const tipo = t.tipo === 'deposito' ? 'Depósito' : t.tipo === 'retiro' ? 'Retiro' : 'Pago';
                return `
                    <tr>
                        <td>${t.fecha}</td>
                        <td>${tipo}</td>
                        <td>${money(t.monto)}</td>
                    </tr>`;
            },
            3,
            'No hay movimientos para mostrar en el informe.'
        );
    }

    function crearPDF() {
        const content = document.getElementById('pills-tabContent');

        if (!content) {
            PokeBank.showAlert('Error', 'No se encontró contenido para generar el PDF.', 'error');
            return;
        }

        if (!window.jspdf || !window.jspdf.jsPDF) {
            window.print();
            return;
        }

        const jsPDF = window.jspdf.jsPDF;
        const doc = new jsPDF('p', 'pt', 'letter');
        const margin = 24;
        const pageWidth = doc.internal.pageSize.getWidth();
        const scale = Math.min(0.75, (pageWidth - margin * 2) / content.scrollWidth);

        doc.html(content, {
            x: margin,
            y: margin,
            html2canvas: {
                scale: scale,
                useCORS: true
            },
            callback: function (pdf) {
                pdf.save(`historial-pokebank-${usuario.numeroCuenta}.pdf`);
            }
        });
    }

    const pdfButton = document.getElementById('pdfout');
    if (pdfButton) {
        pdfButton.addEventListener('click', crearPDF);
    }

    renderHistorial();
});
