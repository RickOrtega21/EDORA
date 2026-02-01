document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const employeeNumberInput = document.getElementById('employeeNumber');
    const fullNameInput = document.getElementById('fullName');
    const passwordError = document.getElementById('passwordError');
    const submitBtn = document.getElementById('submitBtn');
    const toggleAuth = document.getElementById('toggleAuth');
    const toggleText = document.getElementById('toggleText');
    const loginSubtitle = document.querySelector('.login-subtitle');
    const signupFields = document.querySelectorAll('.signup-field');

    const VALID_EMPLOYEE_NUMBERS = ['1476', '1477', '1478', '1479'];
    const CORPORATE_DOMAIN = '@latinoseguros.com.mx';
    const ADMIN_EMAIL = 'ricardoortega341@gmail.com';

    let isLoginMode = true;

    // Toggle between Login and Signup modes
    toggleAuth.addEventListener('click', (e) => {
        e.preventDefault();
        isLoginMode = !isLoginMode;

        if (isLoginMode) {
            submitBtn.textContent = 'Ingresar';
            toggleText.textContent = '¿No tienes cuenta?';
            toggleAuth.textContent = 'Regístrate aquí';
            loginSubtitle.textContent = 'Eminent Documentary Reporting Assistant';
            signupFields.forEach(f => f.classList.add('hidden'));
            emailInput.placeholder = "usuario@latinoseguros.com.mx";
        } else {
            submitBtn.textContent = 'Crear Cuenta';
            toggleText.textContent = '¿Ya tienes cuenta?';
            toggleAuth.textContent = 'Inicia sesión';
            loginSubtitle.textContent = 'Registro Corporativo Latino Seguros';
            signupFields.forEach(f => f.classList.remove('hidden'));
            emailInput.placeholder = "Tu correo corporativo";
        }
        passwordError.style.display = 'none';
        loginForm.reset();
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const employeeNumber = employeeNumberInput ? employeeNumberInput.value.trim() : '';
        const fullName = fullNameInput ? fullNameInput.value.trim() : '';

        // 1. Password length validation (5 chars)
        if (password.length < 5) {
            passwordError.textContent = 'La contraseña debe tener al menos 5 caracteres.';
            passwordError.style.display = 'block';
            return;
        }

        if (!isLoginMode) {
            // REGISTRATION FILTERS
            const isAdminException = email.toLowerCase() === ADMIN_EMAIL;

            // 2. Domain verification (except for Admin)
            if (!isAdminException && !email.toLowerCase().endsWith(CORPORATE_DOMAIN)) {
                passwordError.textContent = `Solo se permiten correos finalizados en ${CORPORATE_DOMAIN}`;
                passwordError.style.display = 'block';
                return;
            }

            // 3. Employee Number Verification (except for Admin)
            if (!isAdminException && !VALID_EMPLOYEE_NUMBERS.includes(employeeNumber)) {
                passwordError.textContent = 'Número de empleado no válido para registro.';
                passwordError.style.display = 'block';
                return;
            }

            if (!isAdminException && (fullName === '' || employeeNumber === '')) {
                passwordError.textContent = 'Por favor completa todos los campos de registro.';
                passwordError.style.display = 'block';
                return;
            }
        }

        if (!window.supabaseClient) {
            passwordError.textContent = 'Error: No se pudo conectar con Supabase.';
            passwordError.style.display = 'block';
            return;
        }

        submitBtn.textContent = 'Procesando...';
        submitBtn.disabled = true;
        passwordError.style.display = 'none';

        try {
            if (isLoginMode) {
                // LOGIN
                const { error: signInError } = await window.supabaseClient.auth.signInWithPassword({
                    email: email,
                    password: password,
                });

                if (signInError) throw signInError;
                window.location.href = 'index.html';

            } else {
                // SIGNUP (With MetaData)
                const { data: signUpData, error: signUpError } = await window.supabaseClient.auth.signUp({
                    email: email,
                    password: password,
                    options: {
                        data: {
                            full_name: fullName || 'Admin User',
                            employee_number: employeeNumber || '0000'
                        }
                    }
                });

                if (signUpError) throw signUpError;

                if (signUpData.session) {
                    window.location.href = 'index.html';
                } else {
                    passwordError.style.color = '#10b981';
                    passwordError.textContent = '¡Verificación enviada! Revisa tu correo electrónico para validar tu cuenta.';
                    passwordError.style.display = 'block';
                }
            }
        } catch (err) {
            console.error('Auth error:', err);
            passwordError.textContent = err.message || 'Error de autenticación.';
            passwordError.style.display = 'block';
        } finally {
            submitBtn.textContent = isLoginMode ? 'Ingresar' : 'Crear Cuenta';
            submitBtn.disabled = false;
        }
    });

    // Toggle password visibility
    const togglePassword = document.getElementById('togglePassword');
    if (togglePassword) {
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            togglePassword.textContent = type === 'password' ? '👁️' : '🔒';
        });
    }
});
