const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const defaultStoreName = 'XULKAROY PARDALARI';

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('SUPABASE_URL va SUPABASE_SERVICE_ROLE_KEY .env faylida sozlanishi kerak.');
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function hashPassword(password) {
  return crypto.createHash('sha256').update(String(password)).digest('hex');
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
    role: user.role,
    status: user.status,
    avatar: user.avatar || '',
    ...(user.store_name ? { storeName: user.store_name } : {}),
  };
}

async function getUserById(id) {
  const { data, error } = await supabase.from('app_users').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

async function getUserByLogin(value, password) {
  const { data: phoneUser, error: phoneError } = await supabase
    .from('app_users').select('*').eq('phone', value).eq('password_hash', hashPassword(password)).maybeSingle();
  if (phoneError) throw phoneError;
  if (phoneUser) return phoneUser;

  const { data, error } = await supabase
    .from('app_users').select('*').ilike('name', value).eq('password_hash', hashPassword(password)).maybeSingle();
  if (error) throw error;
  return data;
}

async function getUserForSession(token) {
  if (!token) return null;
  const { data: session, error: sessionError } = await supabase
    .from('app_sessions').select('user_id').eq('token', token).maybeSingle();
  if (sessionError) throw sessionError;
  return session ? getUserById(session.user_id) : null;
}

async function createSession(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const { error } = await supabase.from('app_sessions').insert({ token, user_id: userId });
  if (error) throw error;
  return token;
}

async function deleteSession(token) {
  if (!token) return;
  const { error } = await supabase.from('app_sessions').delete().eq('token', token);
  if (error) throw error;
}

async function registerUser({ name, phone, password, role, avatar }) {
  const { data, error } = await supabase.rpc('register_app_user', {
    p_name: name,
    p_phone: phone,
    p_password_hash: hashPassword(password),
    p_role: role === 'Employee' ? 'Employee' : 'Admin',
    p_avatar: avatar || '',
  });
  if (error) throw error;
  return Array.isArray(data) ? data[0] : data;
}

async function getState(activeUserId) {
  const [{ data: profiles, error: profilesError }, { data: sales, error: salesError }] = await Promise.all([
    supabase.from('user_profiles').select('*').order('created_at', { ascending: true }),
    supabase.from('sales').select('*').order('created_at', { ascending: false }),
  ]);
  if (profilesError) throw profilesError;
  if (salesError) throw salesError;

  return {
    storeName: defaultStoreName,
    approvalRequired: true,
    users: (profiles || []).map(publicUser),
    sales: (sales || []).map((sale) => ({
      id: sale.id,
      date: sale.date,
      customerName: sale.customer_name,
      customerPhone: sale.customer_phone,
      fabricType: sale.fabric_type,
      meters: Number(sale.meters),
      unitPrice: Number(sale.unit_price),
      costPerMeter: Number(sale.cost_per_meter),
      total: Number(sale.total),
      profit: Number(sale.profit),
      employeeId: sale.employee_id,
      employeeName: sale.employee_name,
      status: sale.status,
    })),
    activeUserId: activeUserId || null,
  };
}

async function updateAccess(userId, allowed) {
  const status = allowed ? 'approved' : 'pending';
  const { data, error } = await supabase.from('app_users').update({ status }).eq('id', userId).select('*').single();
  if (error) throw error;
  const { error: profileError } = await supabase.from('user_profiles').update({ status }).eq('id', userId);
  if (profileError) throw profileError;
  return data;
}

async function deleteUser(userId) {
  const { error } = await supabase.from('app_users').delete().eq('id', userId);
  if (error) throw error;
}

async function createSale(userId, sale) {
  const row = {
    customer_name: sale.customerName,
    customer_phone: sale.customerPhone,
    fabric_type: sale.fabricType,
    meters: sale.meters,
    unit_price: sale.unitPrice,
    cost_per_meter: sale.costPerMeter,
    total: sale.total,
    profit: sale.profit,
    employee_id: userId,
    employee_name: sale.employeeName,
    status: sale.status,
  };
  const { data, error } = await supabase.from('sales').insert(row).select('*').single();
  if (error) throw error;
  return data;
}

module.exports = {
  defaultStoreName,
  clientConfig: { url: supabaseUrl, anonKey: process.env.SUPABASE_ANON_KEY || '' },
  publicUser,
  getUserForSession,
  getUserByLogin,
  createSession,
  deleteSession,
  registerUser,
  getState,
  updateAccess,
  deleteUser,
  createSale,
};
