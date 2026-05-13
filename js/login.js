document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('loginForm');
    const usuarioInput = document.getElementById('usuarioInput');
    const passwordInput = document.getElementById('passwordInput');
    const errorMessage = document.getElementById('errorMessage');
    const errorMessageUsuario = document.getElementById('errorMessageUsuario');
    const loginButton = document.querySelector('#loginForm a[href="transacciones.html"], #loginButton');
    const registerButton = document.querySelector('#loginForm a[href="usuarios.html"], #registerButton');

    if (!form || !usuarioInput || !passwordInput) return;

    function limpiarErrores() {
        if (errorMessage) errorMessage.textContent = '';
        if (errorMessageUsuario) errorMessageUsuario.textContent = '';
        usuarioInput.parentElement.removeAttribute('id');
        passwordInput.parentElement.removeAttribute('id');
    }

    function mostrarErrorUsuario(message) {
        if (errorMessageUsuario) errorMessageUsuario.textContent = message;
        usuarioInput.parentElement.setAttribute('id', 'usuario-error');
    }

    function mostrarErrorPassword(message) {
        if (errorMessage) errorMessage.textContent = message;
        passwordInput.parentElement.setAttribute('id', 'password-error');
    }

    function iniciarSesion(event) {
        if (event) event.preventDefault();
        limpiarErrores();

        const usuario = usuarioInput.value.trim();
        const contrasena = passwordInput.value.trim();
        let hasError = false;

        if (usuario === '') {
            mostrarErrorUsuario('Debe ingresar su usuario.');
            hasError = true;
        }

        if (contrasena === '') {
            mostrarErrorPassword('Debe ingresar su contraseña.');
            hasError = true;
        }

        if (hasError) return;

        const usuarioEncontrado = PokeBank.findUserByCredentials(usuario, contrasena);

        if (!usuarioEncontrado) {
            PokeBank.showAlert('Error', 'Usuario o contraseña incorrectos.', 'error');
            return;
        }

        PokeBank.setCurrentUser(usuarioEncontrado);
        PokeBank.showAlert('Bienvenido', `Hola, ${usuarioEncontrado.usuario}.`, 'success', function () {
            window.location.href = 'transacciones.html';
        });
    }

    form.addEventListener('submit', iniciarSesion);

    if (loginButton) {
        loginButton.addEventListener('click', iniciarSesion);
    }

    if (registerButton) {
        registerButton.addEventListener('click', function (event) {
            event.preventDefault();
            window.location.href = 'usuarios.html';
        });
    }
});
