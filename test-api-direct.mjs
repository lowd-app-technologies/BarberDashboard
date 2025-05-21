// Script para testar diretamente a API de clientes simulados
import fetch from 'node-fetch';

// URL base
const baseUrl = 'http://localhost:3000';

// Função para testar a API diretamente
async function testApiDirect() {
  try {
    console.log('Testando API diretamente...');
    
    // Testar a rota de clientes simulados
    const apiUrl = `${baseUrl}/api/barber/test-clients`;
    console.log('URL da API:', apiUrl);
    
    const response = await fetch(apiUrl, {
      credentials: 'include'
    });
    
    console.log('Status da resposta:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Dados recebidos:', data);
      console.log(`Recebidos ${data.length} clientes da API.`);
    } else {
      const errorText = await response.text();
      console.error('Erro na resposta:', errorText);
    }
  } catch (error) {
    console.error('Erro ao testar API:', error);
  }
}

// Executar o teste
testApiDirect();
