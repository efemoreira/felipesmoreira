export const metadata = {
  title: 'Política de Privacidade',
};

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Política de Privacidade</h1>
        
        <div className="space-y-8 text-gray-700">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introdução</h2>
            <p>
              Esta Política de Privacidade descreve como nosso aplicativo de WhatsApp coleta, 
              utiliza e protege suas informações pessoais. Comprometemo-nos com a proteção de 
              sua privacidade e a segurança dos seus dados.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Informações que Coletamos</h2>
            <p className="mb-4">O aplicativo coleta as seguintes informações:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Dados de acesso da sua conta WhatsApp</li>
              <li>Conteúdo de mensagens processadas pelo aplicativo</li>
              <li>Informações de contatos com os quais você interage</li>
              <li>Histórico de conversas armazenadas localmente</li>
              <li>Dados de uso e preferências do aplicativo</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Como Usamos Suas Informações</h2>
            <p className="mb-4">As informações coletadas são utilizadas para:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Enviar mensagens do WhatsApp conforme solicitado por você</li>
              <li>Melhorar a experiência do usuário no aplicativo</li>
              <li>Manter registro das suas conversas para seu acesso pessoal</li>
              <li>Fornecer funcionalidades de automação de mensagens</li>
              <li>Análise de uso para otimização do aplicativo</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Armazenamento de Dados</h2>
            <p className="mb-4">
              Os dados são armazenados da seguinte forma:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>Principalmente em armazenamento local no seu dispositivo</li>
              <li>Dados de sessão podem ser armazenados em cache seguro</li>
              <li>Backup opcional podem ser armazenados em serviços em nuvem de sua escolha</li>
              <li>Nenhum dado é compartilhado com terceiros sem seu consentimento explícito</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Segurança</h2>
            <p>
              Implementamos medidas de segurança técnicas e organizacionais para proteger seus dados 
              contra acesso não autorizado, alteração e destruição. As comunicações do WhatsApp são 
              criptografadas ponta a ponta conforme os padrões de segurança da plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Cookies e Tecnologias de Rastreamento</h2>
            <p>
              Este aplicativo pode utilizar cookies e tecnologias similares para melhorar a experiência 
              do usuário. Você pode controlar as configurações de cookies em seu navegador ou dispositivo.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Seus Direitos</h2>
            <p className="mb-4">Você possui os seguintes direitos:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Acessar seus dados pessoais armazenados</li>
              <li>Solicitar correção de dados incorretos</li>
              <li>Solicitar exclusão de dados</li>
              <li>Revogar seu consentimento a qualquer momento</li>
              <li>Solicitar informações sobre como seus dados são utilizados</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Alterações nesta Política</h2>
            <p>
              Reservamos o direito de modificar esta Política de Privacidade a qualquer momento. 
              Alterações significativas serão comunicadas ao usuário com antecedência. O uso continuado 
              do aplicativo após alterações implica aceitação da nova política.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Contato</h2>
            <p>
              Se tiver dúvidas ou preocupações sobre esta Política de Privacidade, entre em contato conosco 
              através das informações de contato fornecidas no aplicativo.
            </p>
          </section>

          <section>
            <p className="text-sm text-gray-500">
              Última atualização: {new Date().toLocaleDateString('pt-BR')}
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
