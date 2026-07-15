import client from './client';

/**
 * POST /auth/login expects OAuth2PasswordRequestForm — form-urlencoded
 * `username`/`password`, NOT JSON. `username` is the user's email.
 * Returns { access_token, token_type }.
 */
export async function login(email, password) {
  const body = new URLSearchParams();
  body.set('username', email);
  body.set('password', password);
  const { data } = await client.post('/auth/login', body, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  return data;
}

/** GET /auth/me -> UserOut */
export async function getCurrentUser() {
  const { data } = await client.get('/auth/me');
  return data;
}

/**
 * POST /auth/register -> UserOut. JSON body.
 * payload: { full_name, email, password, role_name, department_id?, outlet_id? }
 * outlet_id is required by the backend only when role_name === 'outlet_manager'.
 */
export async function registerUser(payload) {
  const { data } = await client.post('/auth/register', payload);
  return data;
}
