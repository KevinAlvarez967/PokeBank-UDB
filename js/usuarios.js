document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('registroForm');
    const usuarioInput = document.getElementById('usuario');
    const numeroCuentaInput = document.getElementById('numeroCuenta');
    const contrasenaInput = document.getElementById('contrasena');
    const confirmarContrasenaInput = document.getElementById('confirmarContrasena');
    const registerButton = document.querySelector('#registroForm a[href="usuarios.html"], #registroButton');
    const loginButton = document.querySelector('#registroForm a[href="login.html"]');

    if (!form) return;

    function registrarUsuario(event) {
        if (event) event.preventDefault();

        const usuario = usuarioInput.value.trim();
        const numeroCuenta = PokeBank.normalizeAccount(numeroCuentaInput.value);
        const contrasena = contrasenaInput.value.trim();
        const confirmarContrasena = confirmarContrasenaInput.value.trim();

        if (!usuario || !numeroCuenta || !contrasena || !confirmarContrasena) {
            PokeBank.showAlert('Oops...', 'Por favor, completa todos los campos.', 'error');
            return;
        }

        if (usuario.length < 3) {
            PokeBank.showAlert('Usuario inválido', 'El usuario debe tener al menos 3 caracteres.', 'error');
            return;
        }

        if (!PokeBank.isValidAccount(numeroCuenta)) {
            PokeBank.showAlert('Cuenta inválida', 'El número de cuenta solo debe tener números y guiones. Mínimo 4 caracteres.', 'error');
            return;
        }

        if (contrasena.length < 4) {
            PokeBank.showAlert('Contraseña inválida', 'La contraseña debe tener al menos 4 caracteres.', 'error');
            return;
        }

        if (contrasena !== confirmarContrasena) {
            PokeBank.showAlert('Contraseña inválida', 'Las contraseñas no coinciden.', 'error');
            return;
        }

        if (PokeBank.userExists(usuario)) {
            PokeBank.showAlert('Usuario existente', 'Ese nombre de usuario ya está registrado.', 'error');
            return;
        }

        if (PokeBank.accountExists(numeroCuenta)) {
            PokeBank.showAlert('Cuenta existente', 'Ese número de cuenta ya está registrado.', 'error');
            return;
        }

        const nuevoUsuario = PokeBank.normalizeUser({
            usuario,
            numeroCuenta,
            contrasena,
            saldo: PokeBank.DEFAULT_BALANCE
        });

        const usuarios = PokeBank.getUsers();
        usuarios.push(nuevoUsuario);
        PokeBank.saveUsers(usuarios);

        PokeBank.showAlert(
            'Registro exitoso',
            `Usuario: ${nuevoUsuario.usuario}\nCuenta: ${nuevoUsuario.numeroCuenta}\nSaldo inicial: ${PokeBank.formatMoney(nuevoUsuario.saldo)} Pokédólares`,
            'success',
            function () {
                form.reset();
                window.location.href = 'login.html';
            }
        );
    }

    form.addEventListener('submit', registrarUsuario);

    if (registerButton) {
        registerButton.addEventListener('click', registrarUsuario);
    }

    if (loginButton) {
        loginButton.addEventListener('click', function (event) {
            event.preventDefault();
            window.location.href = 'login.html';
        });
    }
});
