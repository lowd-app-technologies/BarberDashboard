// Script para testar a rota de clientes simulados
import fetch from 'node-fetch';

// URL base
const baseUrl = 'http://localhost:3000';

// Credenciais fornecidas
const credentials = {
  email: 'barbeiro@barberpro.com',
  password: 'senha123'
};

// Função para testar login e API de clientes simulados
async function testMockClients() {
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
      
      // Obter cookies para autenticação
      const cookies = response.headers.get('set-cookie');
      
      // Testar a rota de clientes simulados
      console.log('\nTestando rota de clientes simulados:');
      const mockResponse = await fetch(`${baseUrl}/api/barber/test-clients`, {
        headers: {
          Cookie: cookies
        }
      });
      
      console.log('Status da resposta (clientes simulados):', mockResponse.status);
      
      if (mockResponse.ok) {
        const mockData = await mockResponse.json();
        console.log('Clientes simulados encontrados:', mockData.length);
        console.log('Dados dos clientes simulados:', JSON.stringify(mockData, null, 2));
        
        // Testar a página de clientes no navegador
        console.log('\nPara visualizar a página de clientes no navegador, acesse:');
        console.log(`${baseUrl}/barber/clients`);
        console.log('Use as credenciais fornecidas para fazer login.');
      } else {
        const errorText = await mockResponse.text();
        console.error('Erro na resposta de clientes simulados:', errorText);
      }
    } else {
      const errorText = await response.text();
      console.log('❌ Login falhou:', errorText);
    }
  } catch (error) {
    console.error('Erro ao testar API de clientes simulados:', error);
  }
}

// Executar o teste
testMockClients();
