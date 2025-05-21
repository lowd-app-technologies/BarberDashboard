// Script para verificar os usuários disponíveis no banco de dados
import fetch from 'node-fetch';

// URL base
const baseUrl = 'http://localhost:3000';

// Função para verificar os usuários (apenas para administradores)
async function checkUsers() {
  try {
    console.log('Verificando usuários disponíveis...');
    
    // Primeiro, tente fazer login como admin
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'admin123'
      })
    });
    
    if (!loginResponse.ok) {
      console.log('Não foi possível fazer login como administrador.');
      return;
    }
    
    const cookies = loginResponse.headers.get('set-cookie');
    
    // Agora, tente obter a lista de usuários
    const response = await fetch(`${baseUrl}/api/users`, {
      headers: {
        Cookie: cookies
      }
    });
    
    if (response.ok) {
      const users = await response.json();
      console.log('Usuários encontrados:');
      users.forEach(user => {
        console.log(`- ID: ${user.id}, Nome: ${user.fullName}, Email: ${user.email}, Papel: ${user.role}`);
      });
    } else {
      console.log(`Erro ao obter usuários: ${response.status}`);
      const errorText = await response.text();
      console.error(errorText);
    }
  } catch (error) {
    console.error('Erro ao verificar usuários:', error);
  }
}

// Função para tentar fazer login com diferentes credenciais
async function tryDifferentLogins() {
  const credentials = [
    { email: 'admin@example.com', password: 'admin123' },
    { email: 'barber@example.com', password: 'barber123' },
    { email: 'barber1@example.com', password: 'password' },
    { email: 'barber@barberpro.com', password: 'password' }
  ];
  
  console.log('Tentando diferentes combinações de login:');
  
  for (const cred of credentials) {
    try {
      console.log(`\nTentando login com: ${cred.email} / ${cred.password}`);
      
      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(cred)
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Login bem-sucedido!');
        console.log('Resposta:', data);
        
        // Verificar o usuário atual
        const cookies = response.headers.get('set-cookie');
        const userResponse = await fetch(`${baseUrl}/api/auth/current-user`, {
          headers: {
            Cookie: cookies
          }
        });
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          console.log('Dados do usuário:', userData);
        }
        
        return { success: true, credentials: cred, cookies };
      } else {
        const errorText = await response.text();
        console.log('❌ Login falhou:', errorText);
      }
    } catch (error) {
      console.error('Erro ao tentar login:', error);
    }
  }
  
  return { success: false };
}

// Função para testar a API de clientes com as credenciais que funcionaram
async function testClientsWithWorkingCredentials(cookies) {
  if (!cookies) return;
  
  try {
    console.log('\nTestando API de clientes com credenciais que funcionaram:');
    const response = await fetch(`${baseUrl}/api/barber/clients`, {
      headers: {
        Cookie: cookies
      }
    });
    
    console.log('Status da resposta:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Clientes encontrados:', data.length);
      console.log('Dados dos clientes:', JSON.stringify(data, null, 2));
    } else {
      const errorText = await response.text();
      console.error('Erro na resposta:', errorText);
    }
  } catch (error) {
    console.error('Erro ao testar API de clientes:', error);
  }
}

// Função principal
async function main() {
  // Tentar diferentes logins
  console.log('=== TENTANDO DIFERENTES CREDENCIAIS ===');
  const { success, cookies } = await tryDifferentLogins();
  
  if (success) {
    // Testar a API de clientes com as credenciais que funcionaram
    await testClientsWithWorkingCredentials(cookies);
  } else {
    console.log('\nNenhuma das credenciais testadas funcionou.');
    
    // Verificar usuários disponíveis
    console.log('\n=== VERIFICANDO USUÁRIOS DISPONÍVEIS ===');
    await checkUsers();
  }
}

// Executar o teste
main();
