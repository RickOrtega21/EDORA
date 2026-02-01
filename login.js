document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const passwordError = document.getElementById('passwordError');
    const submitBtn = document.getElementById('submitBtn');
    const toggleAuth = document.getElementById('toggleAuth');
    const toggleText = document.getElementById('toggleText');
    const loginSubtitle = document.querySelector('.login-subtitle');

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
        } else {
            submitBtn.textContent = 'Crear Cuenta';
            toggleText.textContent = '¿Ya tienes cuenta?';
            toggleAuth.textContent = 'Inicia sesión';
            loginSubtitle.textContent = 'Únete a EDORA y gestiona tu documentación';
        }
        passwordError.style.display = 'none';
        loginForm.reset();
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const identifier = emailInput.value.trim();
        const password = passwordInput.value;

        // Validation: 5 characters minimum
        if (password.length < 5) {
            passwordError.textContent = 'La contraseña debe tener al menos 5 caracteres.';
            passwordError.style.display = 'block';
            return;
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
            let email = identifier;

            // Handle "Name or Email" logic
            // If it doesn't look like an email, try to find it in profiles
            if (!identifier.includes('@')) {
                const { data: profileData, error: profileError } = await window.supabaseClient
                    .from('profiles')
                    .select('email')
                    .or(`full_name.ilike.${identifier},email.ilike.${identifier}`)
                    .single();

                if (profileError || !profileData) {
                    if (isLoginMode) {
                        throw new Error('No se encontró un usuario con ese nombre.');
                    }
                    // If signing up with a name, we still need an email for Supabase Auth.
                    // For simplicity in this implementation, we'll ask for an email if they are signing up.
                    if (!isLoginMode) {
                        throw new Error('Para registrarte usa un correo electrónico válido.');
                    }
                } else {
                    email = profileData.email;
                }
            }

            if (isLoginMode) {
                // LOGIN
                const { error: signInError } = await window.supabaseClient.auth.signInWithPassword({
                    email: email,
                    password: password,
                });

                if (signInError) throw signInError;
                window.location.href = 'index.html';

            } else {
                // SIGNUP
                const { data: signUpData, error: signUpError } = await window.supabaseClient.auth.signUp({
                    email: email,
                    password: password,
                    options: {
                        data: {
                            full_name: identifier.split('@')[0] // Use part of email as default full_name if needed
                        }
                    }
                });

                if (signUpError) throw signUpError;

                if (signUpData.session) {
                    window.location.href = 'index.html';
                } else {
                    passwordError.style.color = '#10b981';
                    passwordError.textContent = '¡Cuenta creada! Revisa tu correo para confirmar (si está activado).';
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
