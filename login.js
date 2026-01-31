document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const passwordError = document.getElementById('passwordError');
    const loginBtn = loginForm.querySelector('.login-btn');

    // Remove the signup toggle since we'll do smart login/signup
    const signupLink = document.querySelector('div[style*="margin-top: 1rem"]');
    if (signupLink) signupLink.style.display = 'none';

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (password.length < 8) {
            passwordError.textContent = 'La contraseña debe tener al menos 8 caracteres.';
            passwordError.style.display = 'block';
            return;
        }

        if (!window.supabaseClient) {
            passwordError.textContent = 'Error: No se pudo conectar con Supabase.';
            passwordError.style.display = 'block';
            return;
        }

        loginBtn.textContent = 'Procesando...';
        loginBtn.disabled = true;
        passwordError.style.display = 'none';

        try {
            // STEP 1: Try to Sign In
            const { data: signInData, error: signInError } = await window.supabaseClient.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (signInError) {
                console.log('SignIn failed, trying SignUp:', signInError.message);

                // STEP 2: If SignIn fails (e.g. user not found), try to Sign Up
                // Supabase doesn't always distinguish 'not found' from 'invalid password' for security,
                // but we can try to create the account.
                const { data: signUpData, error: signUpError } = await window.supabaseClient.auth.signUp({
                    email: email,
                    password: password,
                });

                if (signUpError) {
                    let msg = signUpError.message;
                    if (msg.includes('already registered')) {
                        msg = 'Correo o contraseña incorrectos.';
                    } else if (msg.includes('Email not confirmed')) {
                        msg = 'Debes confirmar tu correo o desactivar "Confirm Email" en Supabase.';
                    }
                    passwordError.textContent = msg;
                    passwordError.style.display = 'block';
                } else {
                    // Success or confirmation needed
                    if (signUpData.session) {
                        window.location.href = 'index.html';
                    } else {
                        passwordError.style.color = '#10b981'; // Green for success msg
                        passwordError.textContent = '¡Listo! Si activaste el login rápido en Supabase ya puedes entrar. Si no, revisa tu correo.';
                        passwordError.style.display = 'block';
                    }
                }
            } else {
                // Login Success
                window.location.href = 'index.html';
            }
        } catch (err) {
            console.error('Fatal error:', err);
            passwordError.textContent = 'Error de conexión inesperado.';
            passwordError.style.display = 'block';
        } finally {
            loginBtn.textContent = 'Ingresar';
            loginBtn.disabled = false;
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
