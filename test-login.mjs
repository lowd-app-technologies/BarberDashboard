// Script para testar login com credenciais específicas
import fetch from 'node-fetch';

// URL base
const baseUrl = 'http://localhost:3000';

// Credenciais fornecidas
const credentials = {
  email: 'barbeiro@barberpro.com',
  password: 'senha123'
};

// Função para testar login
async function testLogin() {
  try {
    console.log(`Tentando login com: ${credentials.email} / ${credentials.password}`);
    
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials)
    });
    
    console.log('Status da resposta:', response.status);
    
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
        
        // Testar API de clientes
        await testClientsApi(cookies);
      } else {
        const errorText = await userResponse.text();
        console.log('Erro ao obter usuário atual:', errorText);
      }
      
      return { success: true, cookies };
    } else {
      const errorText = await response.text();
      console.log('❌ Login falhou:', errorText);
      return { success: false };
    }
  } catch (error) {
    console.error('Erro ao tentar login:', error);
    return { success: false };
  }
}

// Função para testar a API de clientes
async function testClientsApi(cookies) {
  try {
    // Primeiro testar a rota de teste
    console.log('\nTestando rota de teste:');
    const testResponse = await fetch(`${baseUrl}/api/barber/test`, {
      headers: {
        Cookie: cookies
      }
    });
    
    console.log('Status da resposta (teste):', testResponse.status);
    
    if (testResponse.ok) {
      const testData = await testResponse.json();
      console.log('Resposta da rota de teste:', testData);
    } else {
      const errorText = await testResponse.text();
      console.error('Erro na rota de teste:', errorText);
    }
    
    // Agora testar a API de clientes
    console.log('\nTestando API de clientes:');
    const response = await fetch(`${baseUrl}/api/barber/clients`, {
      headers: {
        Cookie: cookies
      }
    });
    
    console.log('Status da resposta (clientes):', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Clientes encontrados:', data.length);
      console.log('Dados dos clientes:', JSON.stringify(data, null, 2));
    } else {
      const errorText = await response.text();
      console.error('Erro na resposta de clientes:', errorText);
    }
  } catch (error) {
    console.error('Erro ao testar APIs:', error);
  }
}

// Executar o teste
testLogin();
