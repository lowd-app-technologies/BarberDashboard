// Script para associar clientes existentes ao barbeiro
import pg from 'pg';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Configuração da conexão com o banco de dados
const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Função para obter o barbeiro pelo email do usuário
async function getBarberByUserEmail(email) {
  try {
    // Buscar o usuário pelo email
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (userResult.rows.length === 0) {
      console.log(`Usuário com email ${email} não encontrado`);
      return null;
    }
    
    const user = userResult.rows[0];
    console.log('Usuário encontrado:', user);
    
    // Buscar o barbeiro pelo ID do usuário
    const barberResult = await pool.query('SELECT * FROM barbers WHERE user_id = $1', [user.id]);
    
    if (barberResult.rows.length === 0) {
      console.log(`Perfil de barbeiro para o usuário ${user.id} não encontrado`);
      return null;
    }
    
    console.log('Perfil de barbeiro encontrado:', barberResult.rows[0]);
    return barberResult.rows[0];
  } catch (error) {
    console.error('Erro ao buscar barbeiro:', error);
    throw error;
  }
}

// Função para listar todos os usuários com role 'client'
async function listClients() {
  try {
    const result = await pool.query('SELECT * FROM users WHERE role = $1', ['client']);
    console.log(`Encontrados ${result.rows.length} clientes:`);
    
    for (const client of result.rows) {
      console.log(`ID: ${client.id}, Nome: ${client.full_name}, Email: ${client.email}`);
    }
    
    return result.rows;
  } catch (error) {
    console.error('Erro ao listar clientes:', error);
    throw error;
  }
}

// Função para criar serviços completados para os clientes
async function createCompletedServices(barberId, clients) {
  try {
    // Verificar se existe um serviço
    const serviceResult = await pool.query('SELECT * FROM services LIMIT 1');
    
    if (serviceResult.rows.length === 0) {
      console.log('Nenhum serviço encontrado. Criando um serviço...');
      
      // Criar um serviço
      const newServiceResult = await pool.query(
        'INSERT INTO services (name, description, price, duration, active, created_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        ['Corte de Cabelo', 'Corte de cabelo masculino', '25.00', 30, true, new Date()]
      );
      
      console.log('Serviço criado:', newServiceResult.rows[0]);
      var serviceId = newServiceResult.rows[0].id;
    } else {
      console.log('Serviço encontrado:', serviceResult.rows[0]);
      var serviceId = serviceResult.rows[0].id;
    }
    
    // Criar serviços completados para cada cliente
    for (const client of clients) {
      try {
        // Verificar se já existe um serviço completado para este cliente e barbeiro
        const checkResult = await pool.query(
          'SELECT * FROM completed_services WHERE barber_id = $1 AND client_id = $2',
          [barberId, client.id]
        );
        
        if (checkResult.rows.length > 0) {
          console.log(`Serviço completado para cliente ${client.id} já existe`);
          continue;
        }
        
        // Data aleatória nos últimos 30 dias
        const randomDate = new Date();
        randomDate.setDate(randomDate.getDate() - Math.floor(Math.random() * 30));
        
        // Inserir serviço completado
        const completedResult = await pool.query(
          'INSERT INTO completed_services (barber_id, client_id, client_name, service_id, price, date, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
          [barberId, client.id, client.full_name, serviceId, '25.00', randomDate, new Date()]
        );
        
        console.log(`Serviço completado criado para cliente ${client.full_name}:`, completedResult.rows[0]);
        
        // Adicionar uma nota para o cliente
        try {
          const noteResult = await pool.query(
            'INSERT INTO client_notes (client_id, barber_id, note, created_at) VALUES ($1, $2, $3, $4) RETURNING *',
            [client.id, barberId, `Nota para ${client.full_name}: Cliente regular`, new Date()]
          );
          
          console.log(`Nota criada para cliente ${client.full_name}:`, noteResult.rows[0]);
        } catch (noteError) {
          console.error(`Erro ao criar nota para cliente ${client.id}:`, noteError);
        }
      } catch (clientError) {
        console.error(`Erro ao processar cliente ${client.id}:`, clientError);
      }
    }
    
    console.log('Serviços completados criados com sucesso!');
  } catch (error) {
    console.error('Erro ao criar serviços completados:', error);
    throw error;
  }
}

// Função principal
async function main() {
  try {
    console.log('=== ASSOCIANDO CLIENTES AO BARBEIRO ===');
    
    // Obter o barbeiro pelo email do usuário
    console.log('\n1. Buscando barbeiro...');
    const barber = await getBarberByUserEmail('barbeiro@barberpro.com');
    
    if (!barber) {
      throw new Error('Barbeiro não encontrado');
    }
    
    // Listar clientes
    console.log('\n2. Listando clientes existentes...');
    const clients = await listClients();
    
    if (clients.length === 0) {
      throw new Error('Nenhum cliente encontrado');
    }
    
    // Criar serviços completados
    console.log('\n3. Criando serviços completados...');
    await createCompletedServices(barber.id, clients);
    
    console.log('\n=== CLIENTES ASSOCIADOS COM SUCESSO ===');
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    // Encerrar pool de conexões
    await pool.end();
  }
}

// Executar script
main();
