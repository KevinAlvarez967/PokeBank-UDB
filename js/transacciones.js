document.addEventListener("DOMContentLoaded", function () {
  let usuario = PokeBank.requireSession();
  if (!usuario) return;

  const depositoForm = document.getElementById("depositoForm");
  const retiroForm = document.getElementById("retiroForm");
  const pagoServiciosForm = document.getElementById("pagoServiciosForm");
  const montoRetiroSelect = document.getElementById("montoRetiro");
  const otroMontoGroup = document.querySelector(".otro-monto");
  const otroMontoInput = document.getElementById("otroMontoRetiro");
  const message = document.querySelector(".message");

  function actualizarVistaUsuario() {
    usuario = PokeBank.getCurrentUser();
    PokeBank.updateHeaderUserInfo();
  }

  function generarCodigoRetiro() {
    return String(Math.floor(Math.random() * 1000000)).padStart(6, "0");
  }

  function ocultarMensajeInicial() {
    if (message) message.style.display = "none";
  }

  function guardarMovimiento(tipo, monto, datosExtra) {
    usuario = PokeBank.getCurrentUser();
    const montoLimpio = PokeBank.normalizeMoney(monto);

    if (tipo === "retiro" || tipo === "pago") {
      if (montoLimpio > usuario.saldo) {
        PokeBank.showAlert(
          "Fondos insuficientes",
          "No tienes saldo suficiente para realizar esta operación.",
          "error",
        );
        return false;
      }
      usuario.saldo = PokeBank.normalizeMoney(usuario.saldo - montoLimpio);
    }

    if (tipo === "deposito") {
      usuario.saldo = PokeBank.normalizeMoney(usuario.saldo + montoLimpio);
    }

    PokeBank.updateUser(usuario);
    PokeBank.addTransaction({
      tipo,
      monto: montoLimpio,
      saldoDespues: usuario.saldo,
      ...datosExtra,
    });

    actualizarVistaUsuario();
    return true;
  }

  if (montoRetiroSelect && otroMontoGroup) {
    montoRetiroSelect.addEventListener("change", function () {
      if (montoRetiroSelect.value === "otro") {
        otroMontoGroup.style.display = "block";
        if (otroMontoInput) otroMontoInput.focus();
      } else {
        otroMontoGroup.style.display = "none";
        if (otroMontoInput) otroMontoInput.value = "";
      }
    });
  }

  if (depositoForm) {
    depositoForm.addEventListener("submit", function (event) {
      event.preventDefault();
      ocultarMensajeInicial();

      const monto = Number(
        document.getElementById("depCantidadDeposito").value,
      );
      const cuentaDestino = PokeBank.normalizeAccount(
        document.getElementById("depCuentaDestino").value,
      );
      const descripcion =
        document.getElementById("depDescripcionDeposito").value.trim() ||
        "Depósito de Pokédólares";

      if (!Number.isFinite(monto) || monto <= 0) {
        PokeBank.showAlert(
          "Monto inválido",
          "Ingresa una cantidad mayor que 0.",
          "error",
        );
        return;
      }

      if (!PokeBank.isValidAccount(cuentaDestino)) {
        PokeBank.showAlert(
          "Cuenta inválida",
          "Ingresa una cuenta destino válida. Usa solo números y guiones.",
          "error",
        );
        return;
      }

      const ok = guardarMovimiento("deposito", monto, {
        cuentaDestino,
        descripcion,
      });

      if (ok) {
        PokeBank.showAlert(
          "Depósito realizado",
          `Se agregaron ${PokeBank.formatMoney(monto)} Pokédólares a tu saldo.`,
          "success",
        );
        depositoForm.reset();
      }
    });
  }

  if (retiroForm) {
    retiroForm.addEventListener("submit", function (event) {
      event.preventDefault();
      ocultarMensajeInicial();

      const selectedValue = montoRetiroSelect ? montoRetiroSelect.value : "";
      const monto =
        selectedValue === "otro"
          ? Number(otroMontoInput ? otroMontoInput.value : 0)
          : Number(selectedValue);

      const motivo = document.getElementById("motivoRetiro").value.trim();

      if (!Number.isFinite(monto) || monto <= 0) {
        PokeBank.showAlert(
          "Monto inválido",
          "Selecciona o ingresa un monto mayor que 0.",
          "error",
        );
        return;
      }

      if (!motivo) {
        PokeBank.showAlert(
          "Motivo requerido",
          "Ingresa el motivo del retiro.",
          "error",
        );
        return;
      }

      const codigoRetiro = generarCodigoRetiro();

      const ok = guardarMovimiento("retiro", monto, {
        descripcion: motivo,
        codigoRetiro: codigoRetiro,
      });

      if (ok) {
        PokeBank.showAlert(
          "Retiro realizado",
          `Se retiraron ${PokeBank.formatMoney(monto)} Pokédólares.

Acércate a un cajero y usa este código para retirar tus Pokédólares:

Código de retiro: ${codigoRetiro}`,
          "success",
        );

        retiroForm.reset();

        if (otroMontoGroup) {
          otroMontoGroup.style.display = "none";
        }
      }
    });
  }

  if (pagoServiciosForm) {
    pagoServiciosForm.addEventListener("submit", function (event) {
      event.preventDefault();
      ocultarMensajeInicial();

      const servicio = document.getElementById("tipoServicio").value.trim();
      const monto = Number(document.getElementById("psMontoPago").value);
      const numeroServicio = document
        .getElementById("psNumeroCuenta")
        .value.trim();

      if (!servicio) {
        PokeBank.showAlert(
          "Servicio requerido",
          "Selecciona el servicio que deseas pagar.",
          "error",
        );
        return;
      }

      if (!Number.isFinite(monto) || monto <= 0) {
        PokeBank.showAlert(
          "Monto inválido",
          "Ingresa un monto mayor que 0.",
          "error",
        );
        return;
      }

      if (!numeroServicio) {
        PokeBank.showAlert(
          "Cuenta/NPE requerido",
          "Ingresa el número de cuenta del servicio o NPE.",
          "error",
        );
        return;
      }

      const ok = guardarMovimiento("pago", monto, {
        servicio,
        numeroServicio,
        cuentaDestino: numeroServicio,
        descripcion: servicio,
      });

      if (ok) {
        PokeBank.showAlert(
          "Pago realizado",
          `Se pagaron ${PokeBank.formatMoney(monto)} Pokédólares por ${servicio}.`,
          "success",
        );
        pagoServiciosForm.reset();
      }
    });
  }

  actualizarVistaUsuario();
});
