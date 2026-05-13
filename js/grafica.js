document.addEventListener('DOMContentLoaded', function () {
    const usuario = PokeBank.requireSession();
    if (!usuario) return;

    PokeBank.updateHeaderUserInfo();

    if (typeof Chart === 'undefined') {
        PokeBank.showAlert('Chart.js no cargó', 'Revisa que el CDN de Chart.js esté enlazado antes de grafica.js.', 'error');
        return;
    }

    const canvas = document.getElementById('grafico-semanal');
    if (!canvas) return;

    const summary = PokeBank.buildSummary('weekly');

    new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
            labels: summary.labels,
            datasets: [
                {
                    label: 'Depósitos',
                    data: summary.deposito,
                    backgroundColor: 'rgba(167, 190, 211, 0.35)',
                    borderColor: 'rgba(167, 190, 211, 1)',
                    borderWidth: 3,
                    tension: 0.35,
                    fill: true
                },
                {
                    label: 'Retiros',
                    data: summary.retiro,
                    backgroundColor: 'rgba(255, 202, 175, 0.35)',
                    borderColor: 'rgba(255, 202, 175, 1)',
                    borderWidth: 3,
                    tension: 0.35,
                    fill: true
                },
                {
                    label: 'Pagos',
                    data: summary.pago,
                    backgroundColor: 'rgba(198, 226, 233, 0.35)',
                    borderColor: 'rgba(198, 226, 233, 1)',
                    borderWidth: 3,
                    tension: 0.35,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function (value) {
                            return value + ' PKD';
                        }
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
});
