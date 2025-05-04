import axios from 'axios';

async function testLogin() {
  try {
    console.log('Tentando fazer login...');
    const response = await axios.post('http://localhost:5000/api/login', {
      username: 'admintest',
      password: 'admin123'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    console.log('Status:', response.status);
    console.log('Resposta:', response.data);
    
    // Tentar obter o usuário atual
    console.log('\nTentando obter usuário atual...');
    const userResponse = await axios.get('http://localhost:5000/api/user', {
      withCredentials: true,
      headers: {
        Cookie: response.headers['set-cookie']
      }
    });
    
    console.log('Status:', userResponse.status);
    console.log('Usuário:', userResponse.data);
    
  } catch (error) {
    console.error('Erro:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Dados:', error.response.data);
    }
  }
}

testLogin();
