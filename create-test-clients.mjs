// Script para criar clientes de teste para o barbeiro existente
import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Configuração da conexão com o banco de dados
const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Função para gerar hash de senha
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

// Função para obter o barbeiro pelo email do usuário
async function getBarberByUserEmail(email) {
  const client = await pool.connect();
  
  try {
    // Buscar o usuário pelo email
    const userResult = await client.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (userResult.rows.length === 0) {
      console.log(`Usuário com email ${email} não encontrado`);
      return null;
    }
    
    const user = userResult.rows[0];
    console.log('Usuário encontrado:', user);
    
    // Buscar o barbeiro pelo ID do usuário
    const barberResult = await client.query('SELECT * FROM barbers WHERE user_id = $1', [user.id]);
    
    if (barberResult.rows.length === 0) {
      console.log(`Perfil de barbeiro para o usuário ${user.id} não encontrado`);
      
      // Criar perfil de barbeiro se não existir
      console.log('Criando perfil de barbeiro...');
      const newBarberResult = await client.query(
        'INSERT INTO barbers (user_id, nif, iban, payment_period, active, created_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [user.id, '123456789', 'PT50123456789', 'monthly', true, new Date()]
      );
      
      console.log('Perfil de barbeiro criado:', newBarberResult.rows[0]);
      return newBarberResult.rows[0];
    }
    
    console.log('Perfil de barbeiro encontrado:', barberResult.rows[0]);
    return barberResult.rows[0];
  } catch (error) {
    console.error('Erro ao buscar barbeiro:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Função para criar clientes de teste
async function createTestClients(barberId) {
  const client = await pool.connect();
  
  try {
    // Iniciar transação
    await client.query('BEGIN');
    
    // Criar 3 clientes de teste
    const clients = [
      { username: 'cliente1', email: 'cliente1@test.com', fullName: 'Cliente Um', phone: '911111111' },
      { username: 'cliente2', email: 'cliente2@test.com', fullName: 'Cliente Dois', phone: '922222222' },
      { username: 'cliente3', email: 'cliente3@test.com', fullName: 'Cliente Três', phone: '933333333' }
    ];
    
    const createdClients = [];
    
    for (const clientData of clients) {
      // Verificar se o cliente já existe
      const checkClient = await client.query('SELECT * FROM users WHERE email = $1', [clientData.email]);
      
      let clientId;
      
      if (checkClient.rows.length > 0) {
        console.log(`Cliente ${clientData.fullName} já existe:`, checkClient.rows[0]);
        clientId = checkClient.rows[0].id;
      } else {
        // Criar hash da senha
        const hashedPassword = await hashPassword('cliente123');
        
        // Inserir cliente
        const clientResult = await client.query(
          'INSERT INTO users (username, email, password, role, full_name, phone, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
          [clientData.username, clientData.email, hashedPassword, 'client', clientData.fullName, clientData.phone, new Date()]
        );
        
        console.log(`Cliente ${clientData.fullName} criado:`, clientResult.rows[0]);
        clientId = clientResult.rows[0].id;
      }
      
      createdClients.push({ id: clientId, ...clientData });
    }
    
    // Criar serviço de teste se não existir
    const checkService = await client.query('SELECT * FROM services WHERE name = $1', ['Corte de Cabelo']);
    
    let serviceId;
    
    if (checkService.rows.length > 0) {
      console.log('Serviço já existe:', checkService.rows[0]);
      serviceId = checkService.rows[0].id;
    } else {
      // Inserir serviço
      const serviceResult = await client.query(
        'INSERT INTO services (name, description, price, duration, active, created_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        ['Corte de Cabelo', 'Corte de cabelo masculino', '25.00', 30, true, new Date()]
      );
      
      console.log('Serviço criado:', serviceResult.rows[0]);
      serviceId = serviceResult.rows[0].id;
    }
    
    // Criar serviços completados para cada cliente
    for (const client of createdClients) {
      // Verificar se já existe um serviço completado para este cliente e barbeiro
      const checkCompletedService = await pool.query(
        'SELECT * FROM completed_services WHERE barber_id = $1 AND client_id = $2',
        [barberId, client.id]
      );
      
      if (checkCompletedService.rows.length > 0) {
        console.log(`Serviço completado para ${client.fullName} já existe:`, checkCompletedService.rows[0]);
      } else {
        // Data aleatória nos últimos 30 dias
        const randomDate = new Date();
        randomDate.setDate(randomDate.getDate() - Math.floor(Math.random() * 30));
        
        // Inserir serviço completado
        const completedServiceResult = await pool.query(
          'INSERT INTO completed_services (barber_id, client_id, client_name, service_id, price, date, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
          [barberId, client.id, client.fullName, serviceId, '25.00', randomDate, new Date()]
        );
        
        console.log(`Serviço completado para ${client.fullName} criado:`, completedServiceResult.rows[0]);
        
        // Adicionar uma nota para o cliente
        const noteResult = await pool.query(
          'INSERT INTO client_notes (client_id, barber_id, note, created_at) VALUES ($1, $2, $3, $4) RETURNING *',
          [client.id, barberId, `Nota para ${client.fullName}: Cliente regular`, new Date()]
        );
        
        console.log(`Nota para ${client.fullName} criada:`, noteResult.rows[0]);
      }
    }
    
    // Confirmar transação
    await client.query('COMMIT');
    
    return createdClients;
  } catch (error) {
    // Reverter transação em caso de erro
    await client.query('ROLLBACK');
    console.error('Erro ao criar clientes de teste:', error);
    throw error;
  } finally {
    // Liberar cliente
    client.release();
  }
}

// Função principal
async function main() {
  try {
    console.log('=== CRIANDO CLIENTES DE TESTE ===');
    
    // Obter o barbeiro pelo email do usuário
    console.log('\n1. Buscando barbeiro pelo email do usuário...');
    const barber = await getBarberByUserEmail('barbeiro@barberpro.com');
    
    if (!barber) {
      throw new Error('Não foi possível encontrar ou criar o perfil de barbeiro');
    }
    
    // Criar clientes de teste
    console.log('\n2. Criando clientes de teste...');
    await createTestClients(barber.id);
    
    console.log('\n=== CLIENTES DE TESTE CRIADOS COM SUCESSO ===');
    console.log('\nCredenciais dos clientes:');
    console.log('Email: cliente1@test.com, cliente2@test.com, cliente3@test.com');
    console.log('Senha: cliente123');
  } catch (error) {
    console.error('Erro ao criar clientes de teste:', error);
  } finally {
    // Encerrar pool de conexões
    await pool.end();
  }
}

// Executar script
main();
