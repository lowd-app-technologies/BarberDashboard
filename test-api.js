// Script para testar as APIs do BarberDashboard
const fetch = require('node-fetch');

// URL base
const baseUrl = 'http://localhost:3000';

// Função para fazer login
async function login() {
  try {
    console.log('Tentando fazer login...');
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'barber@example.com', // Substitua pelo email do barbeiro
        password: 'password123'      // Substitua pela senha do barbeiro
      }),
      credentials: 'include'
    });

    const data = await response.json();
    console.log('Resposta do login:', data);
    
    // Retorna os cookies da resposta
    return response.headers.get('set-cookie');
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    return null;
  }
}

// Função para testar a API de clientes
async function testClientsApi(cookies) {
  try {
    console.log('Testando API de clientes...');
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

// Função para testar a API de clientes favoritos
async function testFavoriteClientsApi(cookies) {
  try {
    console.log('Testando API de clientes favoritos...');
    const response = await fetch(`${baseUrl}/api/barber/clients/favorites`, {
      headers: {
        Cookie: cookies
      }
    });

    console.log('Status da resposta:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Clientes favoritos encontrados:', data.length);
      console.log('Dados dos clientes favoritos:', JSON.stringify(data, null, 2));
    } else {
      const errorText = await response.text();
      console.error('Erro na resposta:', errorText);
    }
  } catch (error) {
    console.error('Erro ao testar API de clientes favoritos:', error);
  }
}

// Função para verificar o usuário atual
async function checkCurrentUser(cookies) {
  try {
    console.log('Verificando usuário atual...');
    const response = await fetch(`${baseUrl}/api/auth/current-user`, {
      headers: {
        Cookie: cookies
      }
    });

    console.log('Status da resposta:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Usuário atual:', data);
    } else {
      const errorText = await response.text();
      console.error('Erro na resposta:', errorText);
    }
  } catch (error) {
    console.error('Erro ao verificar usuário atual:', error);
  }
}

// Função principal
async function main() {
  // Fazer login primeiro
  const cookies = await login();
  
  if (cookies) {
    // Verificar usuário atual
    await checkCurrentUser(cookies);
    
    // Testar APIs
    await testClientsApi(cookies);
    await testFavoriteClientsApi(cookies);
  } else {
    console.log('Não foi possível fazer login. Verifique as credenciais.');
  }
}

// Executar o teste
main();
