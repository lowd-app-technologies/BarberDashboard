// Script para testar o login no navegador
import fetch from 'node-fetch';

// URL base
const baseUrl = 'http://localhost:3000';

// Função para testar o login
async function testLogin() {
  try {
    console.log('Testando login...');
    
    // Fazer login
    const loginUrl = `${baseUrl}/api/auth/login`;
    console.log('URL de login:', loginUrl);
    
    const loginResponse = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'barbeiro@barberpro.com',
        password: 'senha123'
      }),
      redirect: 'manual'
    });
    
    console.log('Status da resposta de login:', loginResponse.status);
    
    if (loginResponse.ok) {
      const data = await loginResponse.json();
      console.log('Dados de login recebidos:', data);
      
      // Extrair cookies da resposta
      const cookies = loginResponse.headers.raw()['set-cookie'];
      console.log('Cookies recebidos:', cookies);
      
      if (cookies && cookies.length > 0) {
        // Testar a API de clientes com o cookie de sessão
        const clientsUrl = `${baseUrl}/api/barber/test-clients`;
        console.log('URL da API de clientes:', clientsUrl);
        
        const clientsResponse = await fetch(clientsUrl, {
          headers: {
            'Cookie': cookies[0]
          }
        });
        
        console.log('Status da resposta de clientes:', clientsResponse.status);
        
        if (clientsResponse.ok) {
          const clientsData = await clientsResponse.json();
          console.log('Dados de clientes recebidos:', clientsData);
          console.log(`Recebidos ${clientsData.length} clientes da API.`);
        } else {
          const errorText = await clientsResponse.text();
          console.error('Erro na resposta de clientes:', errorText);
        }
      } else {
        console.error('Nenhum cookie recebido na resposta de login.');
      }
    } else {
      const errorText = await loginResponse.text();
      console.error('Erro na resposta de login:', errorText);
    }
  } catch (error) {
    console.error('Erro ao testar login:', error);
  }
}

// Executar o teste
testLogin();
