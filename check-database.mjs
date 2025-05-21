// Script para verificar os dados no banco de dados
import pg from 'pg';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Configuração da conexão com o banco de dados
const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Função para verificar o usuário barbeiro
async function checkBarberUser() {
  try {
    console.log('Verificando usuário barbeiro...');
    
    // Buscar usuário com email barbeiro@barberpro.com
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', ['barbeiro@barberpro.com']);
    
    if (userResult.rows.length === 0) {
      console.log('Usuário barbeiro não encontrado');
      return null;
    }
    
    const user = userResult.rows[0];
    console.log('Usuário barbeiro encontrado:');
    console.log(`ID: ${user.id}, Email: ${user.email}, Role: ${user.role}`);
    
    // Buscar perfil de barbeiro
    const barberResult = await pool.query('SELECT * FROM barbers WHERE user_id = $1', [user.id]);
    
    if (barberResult.rows.length === 0) {
      console.log('Perfil de barbeiro não encontrado');
      return { user, barber: null };
    }
    
    const barber = barberResult.rows[0];
    console.log('Perfil de barbeiro encontrado:');
    console.log(`ID: ${barber.id}, User ID: ${barber.user_id}`);
    
    return { user, barber };
  } catch (error) {
    console.error('Erro ao verificar usuário barbeiro:', error);
    throw error;
  }
}

// Função para verificar serviços completados
async function checkCompletedServices(barberId) {
  try {
    console.log(`\nVerificando serviços completados para o barbeiro ID ${barberId}...`);
    
    // Buscar serviços completados
    const servicesResult = await pool.query('SELECT * FROM completed_services WHERE barber_id = $1', [barberId]);
    
    console.log(`Encontrados ${servicesResult.rows.length} serviços completados:`);
    
    for (const service of servicesResult.rows) {
      console.log(`ID: ${service.id}, Cliente ID: ${service.client_id}, Data: ${service.date}`);
    }
    
    return servicesResult.rows;
  } catch (error) {
    console.error('Erro ao verificar serviços completados:', error);
    throw error;
  }
}

// Função para verificar clientes
async function checkClients() {
  try {
    console.log('\nVerificando clientes...');
    
    // Buscar usuários com role 'client'
    const clientsResult = await pool.query('SELECT * FROM users WHERE role = $1', ['client']);
    
    console.log(`Encontrados ${clientsResult.rows.length} clientes:`);
    
    for (const client of clientsResult.rows) {
      console.log(`ID: ${client.id}, Nome: ${client.full_name}, Email: ${client.email}`);
    }
    
    return clientsResult.rows;
  } catch (error) {
    console.error('Erro ao verificar clientes:', error);
    throw error;
  }
}

// Função para verificar notas de clientes
async function checkClientNotes(barberId) {
  try {
    console.log(`\nVerificando notas de clientes para o barbeiro ID ${barberId}...`);
    
    // Buscar notas de clientes
    const notesResult = await pool.query('SELECT * FROM client_notes WHERE barber_id = $1', [barberId]);
    
    console.log(`Encontradas ${notesResult.rows.length} notas de clientes:`);
    
    for (const note of notesResult.rows) {
      console.log(`ID: ${note.id}, Cliente ID: ${note.client_id}, Nota: ${note.note}`);
    }
    
    return notesResult.rows;
  } catch (error) {
    console.error('Erro ao verificar notas de clientes:', error);
    throw error;
  }
}

// Função para verificar o usuário logado
async function checkLoggedInUser() {
  try {
    console.log('\nVerificando usuário logado...');
    
    // Buscar usuário com ID 3 (o ID retornado pela rota de teste)
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [3]);
    
    if (userResult.rows.length === 0) {
      console.log('Usuário logado não encontrado');
      return null;
    }
    
    const user = userResult.rows[0];
    console.log('Usuário logado encontrado:');
    console.log(`ID: ${user.id}, Email: ${user.email}, Role: ${user.role}`);
    
    // Buscar perfil de barbeiro
    const barberResult = await pool.query('SELECT * FROM barbers WHERE user_id = $1', [user.id]);
    
    if (barberResult.rows.length === 0) {
      console.log('Perfil de barbeiro para o usuário logado não encontrado');
      return { user, barber: null };
    }
    
    const barber = barberResult.rows[0];
    console.log('Perfil de barbeiro para o usuário logado encontrado:');
    console.log(`ID: ${barber.id}, User ID: ${barber.user_id}`);
    
    return { user, barber };
  } catch (error) {
    console.error('Erro ao verificar usuário logado:', error);
    throw error;
  }
}

// Função principal
async function main() {
  try {
    console.log('=== VERIFICANDO DADOS NO BANCO DE DADOS ===');
    
    // Verificar usuário barbeiro
    const barberUser = await checkBarberUser();
    
    // Verificar usuário logado
    const loggedInUser = await checkLoggedInUser();
    
    // Verificar clientes
    await checkClients();
    
    // Verificar serviços completados
    if (barberUser && barberUser.barber) {
      await checkCompletedServices(barberUser.barber.id);
      await checkClientNotes(barberUser.barber.id);
    }
    
    if (loggedInUser && loggedInUser.barber) {
      console.log('\n=== VERIFICANDO DADOS PARA O USUÁRIO LOGADO ===');
      await checkCompletedServices(loggedInUser.barber.id);
      await checkClientNotes(loggedInUser.barber.id);
    }
    
    console.log('\n=== VERIFICAÇÃO CONCLUÍDA ===');
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    // Encerrar pool de conexões
    await pool.end();
  }
}

// Executar script
main();
