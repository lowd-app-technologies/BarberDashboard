// Script para criar dados de teste no banco de dados NeonDB
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

// Função para criar um usuário barbeiro
async function createBarberUser() {
  const client = await pool.connect();
  
  try {
    // Iniciar transação
    await client.query('BEGIN');
    
    // Verificar se o usuário já existe
    const checkUser = await client.query('SELECT * FROM users WHERE email = $1', ['barber@test.com']);
    
    if (checkUser.rows.length > 0) {
      console.log('Usuário barbeiro já existe:', checkUser.rows[0]);
      
      // Verificar se existe um registro na tabela barbers
      const checkBarber = await client.query('SELECT * FROM barbers WHERE user_id = $1', [checkUser.rows[0].id]);
      
      if (checkBarber.rows.length === 0) {
        // Criar registro na tabela barbers
        const barberResult = await client.query(
          'INSERT INTO barbers (user_id, nif, iban, payment_period, active, created_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
          [checkUser.rows[0].id, '123456789', 'PT50123456789', 'monthly', true, new Date()]
        );
        console.log('Perfil de barbeiro criado:', barberResult.rows[0]);
      } else {
        console.log('Perfil de barbeiro já existe:', checkBarber.rows[0]);
      }
      
      await client.query('COMMIT');
      return checkUser.rows[0];
    }
    
    // Criar hash da senha
    const hashedPassword = await hashPassword('barbeiro123');
    
    // Inserir usuário
    const userResult = await client.query(
      'INSERT INTO users (username, email, password, role, full_name, phone, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      ['barbeiro_teste', 'barber@test.com', hashedPassword, 'barber', 'Barbeiro Teste', '912345678', new Date()]
    );
    
    console.log('Usuário barbeiro criado:', userResult.rows[0]);
    
    // Inserir perfil de barbeiro
    const barberResult = await client.query(
      'INSERT INTO barbers (user_id, nif, iban, payment_period, active, created_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [userResult.rows[0].id, '123456789', 'PT50123456789', 'monthly', true, new Date()]
    );
    
    console.log('Perfil de barbeiro criado:', barberResult.rows[0]);
    
    // Confirmar transação
    await client.query('COMMIT');
    
    return userResult.rows[0];
  } catch (error) {
    // Reverter transação em caso de erro
    await client.query('ROLLBACK');
    console.error('Erro ao criar usuário barbeiro:', error);
    throw error;
  } finally {
    // Liberar cliente
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
      const checkCompletedService = await client.query(
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
        const completedServiceResult = await client.query(
          'INSERT INTO completed_services (barber_id, client_id, client_name, service_id, price, date, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
          [barberId, client.id, client.fullName, serviceId, '25.00', randomDate, new Date()]
        );
        
        console.log(`Serviço completado para ${client.fullName} criado:`, completedServiceResult.rows[0]);
        
        // Adicionar uma nota para o cliente
        const noteResult = await client.query(
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
    console.log('=== CRIANDO DADOS DE TESTE ===');
    
    // Criar usuário barbeiro
    console.log('\n1. Criando usuário barbeiro...');
    const barber = await createBarberUser();
    
    // Verificar perfil de barbeiro
    console.log('\n2. Verificando perfil de barbeiro...');
    const barberProfile = await pool.query('SELECT * FROM barbers WHERE user_id = $1', [barber.id]);
    
    if (barberProfile.rows.length === 0) {
      throw new Error('Perfil de barbeiro não encontrado!');
    }
    
    // Criar clientes de teste
    console.log('\n3. Criando clientes de teste...');
    await createTestClients(barberProfile.rows[0].id);
    
    console.log('\n=== DADOS DE TESTE CRIADOS COM SUCESSO ===');
    console.log('\nCredenciais do barbeiro:');
    console.log('Email: barber@test.com');
    console.log('Senha: barbeiro123');
    
    console.log('\nCredenciais dos clientes:');
    console.log('Email: cliente1@test.com, cliente2@test.com, cliente3@test.com');
    console.log('Senha: cliente123');
  } catch (error) {
    console.error('Erro ao criar dados de teste:', error);
  } finally {
    // Encerrar pool de conexões
    await pool.end();
  }
}

// Executar script
main();
