(function () {
    'use strict';

    const STORAGE = {
        USERS: 'usuarios',
        LOGGED_USER: 'usuarioLogueado',
        TRANSACTIONS: 'transacciones'
    };

    const DEFAULT_BALANCE = 500;

    function safeParse(key, fallback) {
        try {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : fallback;
        } catch (error) {
            console.error(`Error leyendo ${key}:`, error);
            return fallback;
        }
    }

    function saveJSON(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    function getUsers() {
        const users = safeParse(STORAGE.USERS, []);
        return Array.isArray(users) ? users : [];
    }

    function saveUsers(users) {
        saveJSON(STORAGE.USERS, Array.isArray(users) ? users : []);
    }

    function normalizeText(value) {
        return String(value || '').trim();
    }

    function normalizeAccount(value) {
        return normalizeText(value).replace(/\s+/g, '');
    }

    function normalizeMoney(value) {
        const number = Number(value);
        return Number.isFinite(number) ? Number(number.toFixed(2)) : 0;
    }

    function normalizeUser(user) {
        if (!user || typeof user !== 'object') return null;

        const usuario = normalizeText(user.usuario || user.nombre);
        const numeroCuenta = normalizeAccount(user.numeroCuenta || user.cuenta);
        const contrasena = normalizeText(user.contrasena || user.password || user.contraseña);
        const saldo = user.saldo === undefined || user.saldo === null || user.saldo === ''
            ? DEFAULT_BALANCE
            : normalizeMoney(user.saldo);

        if (!usuario || !numeroCuenta) return null;

        return {
            ...user,
            usuario,
            nombre: usuario,
            numeroCuenta,
            cuenta: numeroCuenta,
            contrasena,
            saldo
        };
    }

    function setCurrentUser(user) {
        const normalized = normalizeUser(user);
        if (!normalized) return null;
        saveJSON(STORAGE.LOGGED_USER, normalized);
        return normalized;
    }

    function getCurrentUser() {
        const user = safeParse(STORAGE.LOGGED_USER, null);
        return normalizeUser(user);
    }

    function clearCurrentUser() {
        localStorage.removeItem(STORAGE.LOGGED_USER);
    }

    function updateUser(updatedUser) {
        const normalized = normalizeUser(updatedUser);
        if (!normalized) return null;

        const users = getUsers();
        const index = users.findIndex(function (user) {
            const current = normalizeUser(user);
            return current && current.numeroCuenta === normalized.numeroCuenta;
        });

        if (index >= 0) {
            users[index] = { ...users[index], ...normalized };
        } else {
            users.push(normalized);
        }

        saveUsers(users);
        setCurrentUser(normalized);
        return normalized;
    }

    function findUserByCredentials(usuario, contrasena) {
        const normalizedUser = normalizeText(usuario).toLowerCase();
        const normalizedPassword = normalizeText(contrasena);

        return getUsers()
            .map(normalizeUser)
            .find(function (user) {
                return user &&
                    user.usuario.toLowerCase() === normalizedUser &&
                    user.contrasena === normalizedPassword;
            }) || null;
    }

    function accountExists(numeroCuenta) {
        const account = normalizeAccount(numeroCuenta);
        return getUsers().some(function (user) {
            const normalized = normalizeUser(user);
            return normalized && normalized.numeroCuenta === account;
        });
    }

    function userExists(usuario) {
        const username = normalizeText(usuario).toLowerCase();
        return getUsers().some(function (user) {
            const normalized = normalizeUser(user);
            return normalized && normalized.usuario.toLowerCase() === username;
        });
    }

    function requireSession() {
        const user = getCurrentUser();
        if (!user) {
            showAlert('Sesión requerida', 'Primero debes iniciar sesión.', 'warning', function () {
                window.location.href = 'login.html';
            });
            setTimeout(function () {
                window.location.href = 'login.html';
            }, 1200);
            return null;
        }
        return user;
    }

    function showAlert(title, text, icon, callback) {
        if (typeof swal === 'function') {
            const result = swal(title, text, icon || 'info');
            if (result && typeof result.then === 'function') {
                result.then(function () {
                    if (typeof callback === 'function') callback();
                });
            } else if (typeof callback === 'function') {
                callback();
            }
            return;
        }

        alert(`${title}\n${text}`);
        if (typeof callback === 'function') callback();
    }

    function formatMoney(value) {
        return normalizeMoney(value).toFixed(2);
    }

    function formatDate(date) {
        return new Date(date).toLocaleString('es-SV', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function getTransactions() {
        const transactions = safeParse(STORAGE.TRANSACTIONS, []);
        return Array.isArray(transactions) ? transactions : [];
    }

    function saveTransactions(transactions) {
        saveJSON(STORAGE.TRANSACTIONS, Array.isArray(transactions) ? transactions : []);
    }

    function addTransaction(transaction) {
        const user = getCurrentUser();
        if (!user) return null;

        const now = new Date();
        const cleanTransaction = {
            id: `txn-${Date.now()}-${Math.random().toString(16).slice(2)}`,
            fechaISO: now.toISOString(),
            fecha: formatDate(now),
            numeroCuenta: user.numeroCuenta,
            usuario: user.usuario,
            tipo: normalizeText(transaction.tipo).toLowerCase(),
            monto: normalizeMoney(transaction.monto),
            descripcion: normalizeText(transaction.descripcion),
            cuentaDestino: normalizeAccount(transaction.cuentaDestino),
            servicio: normalizeText(transaction.servicio),
            numeroServicio: normalizeText(transaction.numeroServicio),
            saldoDespues: normalizeMoney(transaction.saldoDespues)
        };

        const transactions = getTransactions();
        transactions.push(cleanTransaction);
        saveTransactions(transactions);
        return cleanTransaction;
    }

    function getCurrentUserTransactions() {
        const user = getCurrentUser();
        if (!user) return [];

        return getTransactions()
            .filter(function (transaction) {
                return normalizeAccount(transaction.numeroCuenta) === user.numeroCuenta;
            })
            .sort(function (a, b) {
                return new Date(b.fechaISO || b.fecha) - new Date(a.fechaISO || a.fecha);
            });
    }

    function updateHeaderUserInfo() {
        const user = getCurrentUser();
        const nombreUsuario = document.getElementById('nombreUsuario');
        const cuentaUsuario = document.getElementById('cuentaUsuario');
        const saldoUsuario = document.getElementById('saldoUsuario');

        if (nombreUsuario) nombreUsuario.textContent = user ? user.usuario : 'Invitado';
        if (cuentaUsuario) cuentaUsuario.textContent = user ? user.numeroCuenta : 'Sin cuenta';
        if (saldoUsuario) saldoUsuario.textContent = user ? formatMoney(user.saldo) : '0.00';
    }

    function attachLogoutButtons() {
        document.querySelectorAll('.nav-cerrar, a[href="login.html"]').forEach(function (link) {
            const text = normalizeText(link.textContent).toLowerCase();
            if (text.includes('cerrar')) {
                link.addEventListener('click', function () {
                    clearCurrentUser();
                });
            }
        });
    }

    function isValidAccount(value) {
        return /^[0-9-]{4,25}$/.test(normalizeAccount(value));
    }

    function getStartOfWeek(date) {
        const result = new Date(date);
        const day = result.getDay();
        const diff = day === 0 ? -6 : 1 - day;
        result.setDate(result.getDate() + diff);
        result.setHours(0, 0, 0, 0);
        return result;
    }

    function isSameDay(a, b) {
        return a.getFullYear() === b.getFullYear() &&
            a.getMonth() === b.getMonth() &&
            a.getDate() === b.getDate();
    }

    function buildSummary(period) {
        const transactions = getCurrentUserTransactions();
        const types = ['deposito', 'retiro', 'pago'];
        const result = {
            labels: [],
            deposito: [],
            retiro: [],
            pago: []
        };

        if (period === 'weekly') {
            const labels = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
            const start = getStartOfWeek(new Date());

            labels.forEach(function (label, index) {
                const currentDate = new Date(start);
                currentDate.setDate(start.getDate() + index);
                result.labels.push(label);

                types.forEach(function (type) {
                    const total = transactions
                        .filter(function (transaction) {
                            const transactionDate = new Date(transaction.fechaISO || transaction.fecha);
                            return transaction.tipo === type && isSameDay(transactionDate, currentDate);
                        })
                        .reduce(function (sum, transaction) {
                            return sum + Number(transaction.monto || 0);
                        }, 0);

                    result[type].push(normalizeMoney(total));
                });
            });
        }

        if (period === 'monthly') {
            const labels = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
            const currentYear = new Date().getFullYear();

            labels.forEach(function (label, monthIndex) {
                result.labels.push(label);

                types.forEach(function (type) {
                    const total = transactions
                        .filter(function (transaction) {
                            const transactionDate = new Date(transaction.fechaISO || transaction.fecha);
                            return transaction.tipo === type &&
                                transactionDate.getFullYear() === currentYear &&
                                transactionDate.getMonth() === monthIndex;
                        })
                        .reduce(function (sum, transaction) {
                            return sum + Number(transaction.monto || 0);
                        }, 0);

                    result[type].push(normalizeMoney(total));
                });
            });
        }

        if (period === 'annual') {
            const currentYear = new Date().getFullYear();
            const years = Array.from({ length: 5 }, function (_, index) {
                return currentYear - 4 + index;
            });

            years.forEach(function (year) {
                result.labels.push(String(year));

                types.forEach(function (type) {
                    const total = transactions
                        .filter(function (transaction) {
                            const transactionDate = new Date(transaction.fechaISO || transaction.fecha);
                            return transaction.tipo === type && transactionDate.getFullYear() === year;
                        })
                        .reduce(function (sum, transaction) {
                            return sum + Number(transaction.monto || 0);
                        }, 0);

                    result[type].push(normalizeMoney(total));
                });
            });
        }

        return result;
    }

    document.addEventListener('DOMContentLoaded', attachLogoutButtons);

    window.PokeBank = {
        STORAGE,
        DEFAULT_BALANCE,
        getUsers,
        saveUsers,
        normalizeUser,
        normalizeText,
        normalizeAccount,
        normalizeMoney,
        setCurrentUser,
        getCurrentUser,
        clearCurrentUser,
        updateUser,
        findUserByCredentials,
        accountExists,
        userExists,
        requireSession,
        showAlert,
        formatMoney,
        getTransactions,
        saveTransactions,
        addTransaction,
        getCurrentUserTransactions,
        updateHeaderUserInfo,
        isValidAccount,
        buildSummary
    };
})();
