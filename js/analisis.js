document.addEventListener('DOMContentLoaded', function () {
    const usuario = PokeBank.requireSession();
    if (!usuario) return;

    PokeBank.updateHeaderUserInfo();

    if (typeof Chart === 'undefined') {
        PokeBank.showAlert(
            'Chart.js no cargó',
            'Revisa que el CDN de Chart.js esté enlazado antes de analisis.js.',
            'error'
        );
        return;
    }

    const graficos = {};

    const configuraciones = {
        'grafico-semanal': {
            periodo: 'weekly',
            titulo: 'Gráfico semanal'
        },
        'grafico-mensual': {
            periodo: 'monthly',
            titulo: 'Gráfico mensual'
        },
        'grafico-anual': {
            periodo: 'annual',
            titulo: 'Gráfico anual'
        }
    };

    function formatearEje(value) {
        const numero = Number(value || 0);

        if (Math.abs(numero) >= 1000000) {
            return new Intl.NumberFormat('es-SV', {
                notation: 'compact',
                maximumFractionDigits: 1
            }).format(numero) + ' PKD';
        }

        return numero + ' PKD';
    }

    function crearDatasets(summary) {
        return [
            {
                label: 'Depósitos',
                data: summary.deposito,
                backgroundColor: 'rgba(167, 190, 211, 0.65)',
                borderColor: 'rgba(167, 190, 211, 1)',
                borderWidth: 2
            },
            {
                label: 'Retiros',
                data: summary.retiro,
                backgroundColor: 'rgba(255, 202, 175, 0.65)',
                borderColor: 'rgba(255, 202, 175, 1)',
                borderWidth: 2
            },
            {
                label: 'Pagos',
                data: summary.pago,
                backgroundColor: 'rgba(198, 226, 233, 0.65)',
                borderColor: 'rgba(198, 226, 233, 1)',
                borderWidth: 2
            }
        ];
    }

    function obtenerTotal(summary) {
        return [
            ...summary.deposito,
            ...summary.retiro,
            ...summary.pago
        ].reduce(function (total, valor) {
            return total + Number(valor || 0);
        }, 0);
    }

    const mensajeSinDatosPlugin = {
        id: 'mensajeSinDatos',
        afterDraw: function (chart) {
            const total = chart.data.datasets.reduce(function (acumulado, dataset) {
                return acumulado + dataset.data.reduce(function (sum, value) {
                    return sum + Number(value || 0);
                }, 0);
            }, 0);

            if (total > 0) return;

            const ctx = chart.ctx;
            const area = chart.chartArea;

            if (!area) return;

            ctx.save();
            ctx.font = '600 16px Segoe UI, Arial';
            ctx.fillStyle = 'rgba(47, 47, 47, 0.65)';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(
                'No hay movimientos registrados para este período',
                (area.left + area.right) / 2,
                (area.top + area.bottom) / 2
            );
            ctx.restore();
        }
    };

    function crearGrafico(canvasId) {
        const canvas = document.getElementById(canvasId);
        const config = configuraciones[canvasId];

        if (!canvas || !config) return;

        const summary = PokeBank.buildSummary(config.periodo);
        const totalDatos = obtenerTotal(summary);

        if (graficos[canvasId]) {
            graficos[canvasId].destroy();
        }

        graficos[canvasId] = new Chart(canvas.getContext('2d'), {
            type: 'bar',
            data: {
                labels: summary.labels,
                datasets: crearDatasets(summary)
            },
            plugins: [mensajeSinDatosPlugin],
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 400
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        suggestedMax: totalDatos > 0 ? undefined : 100,
                        ticks: {
                            precision: 0,
                            callback: function (value) {
                                return formatearEje(value);
                            }
                        }
                    },
                    x: {
                        ticks: {
                            maxRotation: 45,
                            minRotation: 0
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return `${context.dataset.label}: ${PokeBank.formatMoney(context.raw)} Pokédólares`;
                            }
                        }
                    }
                }
            }
        });
    }

    function obtenerCanvasActivo() {
        const panelActivo =
            document.querySelector('.tab-pane.show.active') ||
            document.querySelector('.tab-pane.active');

        if (!panelActivo) return null;

        return panelActivo.querySelector('canvas');
    }

    function renderizarGraficoActivo() {
        const canvas = obtenerCanvasActivo();

        if (!canvas) return;

        const canvasId = canvas.id;

        setTimeout(function () {
            if (!graficos[canvasId]) {
                crearGrafico(canvasId);
            } else {
                graficos[canvasId].resize();
                graficos[canvasId].update();
            }
        }, 150);
    }

    /*
       Renderizando la gráfica visible.
       Las otras se renderizan cuando el usuario abre su tab.
    */
    renderizarGraficoActivo();

    /*
        Esto se ejecuta cuando la tab se abre directamente
    */
    if (window.jQuery) {
        $('a[data-toggle="pill"]').on('shown.bs.tab', function () {
            renderizarGraficoActivo();
        });
    }

    /*
       Respaldo adicional por si el evento de Bootstrap no se dispara.
    */
    document.querySelectorAll('a[data-toggle="pill"]').forEach(function (tab) {
        tab.addEventListener('click', function () {
            setTimeout(renderizarGraficoActivo, 250);
        });
    });

    window.addEventListener('resize', function () {
        Object.keys(graficos).forEach(function (id) {
            if (graficos[id]) {
                graficos[id].resize();
            }
        });
    });
});