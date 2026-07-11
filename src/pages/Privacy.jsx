import React from 'react';
import { Shield, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function Privacy() {
  const navigate = useNavigate();
  return (
    <div className="page-container terms-page animate-fade-in">
      <header className="page-header">
        <div className="credits-page-orb">
          <Shield size={28} className="credits-page-orb-icon" />
        </div>
        <div className="header-text-container">
          <span className="header-subtitle">Legal</span>
          <h1 className="header-title">Política de Privacidade</h1>
          <p className="header-desc">Última atualização: junho de 2026</p>
        </div>
      </header>

      <button className="terms-back-btn" onClick={() => navigate('/terms')}>
        <ArrowLeft size={14} /> Voltar
      </button>

      <div className="terms-doc glass-card">

        <section className="terms-section">
          <p>Esta Política de Privacidade descreve como o Linage coleta, armazena, utiliza e protege os dados pessoais dos usuários, em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).</p>
        </section>

        <section className="terms-section">
          <h2>1. Controlador de Dados</h2>
          <p>O controlador dos dados pessoais tratados por esta Plataforma é o Linage. Para exercer seus direitos ou esclarecer dúvidas: <strong>suporte@linage.app</strong></p>
        </section>

        <section className="terms-section">
          <h2>2. Dados Coletados</h2>

          <h3>2.1 Dados de cadastro</h3>
          <ul>
            <li>Nome completo</li>
            <li>Endereço de email</li>
            <li>Foto de perfil (opcional, sincronizada de sua conta Google)</li>
            <li>Apelido personalizado (opcional)</li>
            <li>Instruções pessoais para o Linage (opcional, até 1.000 caracteres)</li>
          </ul>

          <h3>2.2 Dados de uso</h3>
          <ul>
            <li>Posts criados: título, conteúdo e status</li>
            <li>Histórico de conversas vinculadas a cada post gerado</li>
            <li>Saldo e histórico de uso de créditos</li>
            <li>Data de criação e última atualização de cada post</li>
          </ul>

          <h3>2.3 Dados financeiros</h3>
          <ul>
            <li>Identificadores de cliente e assinatura no Stripe</li>
            <li>Histórico de faturas e status de pagamentos</li>
          </ul>
          <p><strong>Dados de cartão de crédito não são armazenados pelo Linage</strong> — são processados e armazenados diretamente pelo Stripe, sob sua própria política de privacidade (PCI-DSS compliant).</p>

          <h3>2.4 Dados técnicos</h3>
          <ul>
            <li>Tokens de autenticação (JWT, gerenciados pelo Clerk)</li>
            <li>Preferências de privacidade e notificações (armazenadas localmente em seu navegador)</li>
          </ul>
        </section>

        <section className="terms-section">
          <h2>3. Finalidade do Tratamento</h2>
          <div className="terms-table-wrap">
            <table className="terms-table">
              <thead>
                <tr><th>Dado</th><th>Finalidade</th><th>Base legal (LGPD)</th></tr>
              </thead>
              <tbody>
                <tr><td>Email, nome, foto</td><td>Autenticação e identificação</td><td>Execução de contrato (Art. 7º, V)</td></tr>
                <tr><td>Posts e conversas</td><td>Prestação do serviço, histórico do usuário</td><td>Execução de contrato (Art. 7º, V)</td></tr>
                <tr><td>Instruções pessoais</td><td>Personalização da IA</td><td>Execução de contrato (Art. 7º, V)</td></tr>
                <tr><td>Dados financeiros</td><td>Processamento de pagamentos e controle de acesso</td><td>Execução de contrato (Art. 7º, V)</td></tr>
                <tr><td>Posts e conversas (com consentimento)</td><td>Melhoria do produto e treinamento de modelos</td><td>Consentimento (Art. 7º, I)</td></tr>
                <tr><td>Dados agregados de uso</td><td>Análise de desempenho e produto</td><td>Legítimo interesse (Art. 7º, IX)</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="terms-section">
          <h2>4. Serviços de Terceiros</h2>
          <p>O Linage utiliza os seguintes prestadores de serviço que podem processar seus dados:</p>
          <div className="terms-table-wrap">
            <table className="terms-table">
              <thead>
                <tr><th>Prestador</th><th>Finalidade</th><th>Dados transmitidos</th></tr>
              </thead>
              <tbody>
                <tr><td>Clerk</td><td>Autenticação</td><td>Email, nome, foto de perfil</td></tr>
                <tr><td>Stripe</td><td>Pagamentos</td><td>Email, dados de cobrança, identificadores</td></tr>
                <tr><td>Anthropic (Claude)</td><td>Geração de conteúdo por IA</td><td>Mensagens do chat e contexto do post</td></tr>
                <tr><td>Tavily</td><td>Pesquisa de notícias em tempo real</td><td>Termos de busca (sem identificação pessoal)</td></tr>
                <tr><td>Neon</td><td>Banco de dados</td><td>Todos os dados armazenados</td></tr>
                <tr><td>Vercel</td><td>Hospedagem e infraestrutura</td><td>Logs de acesso e requisições</td></tr>
              </tbody>
            </table>
          </div>
          <p>O Linage não vende dados pessoais a terceiros.</p>
        </section>

        <section className="terms-section">
          <h2>5. Uso de IA e Seus Dados</h2>
          <p>As mensagens que você envia no chat e os posts gerados são processados pela API da Anthropic (Claude) para produzir as respostas. Por padrão, a Anthropic não utiliza dados enviados via API para treinar seus modelos.</p>
          <p><strong>Melhoria do produto pelo Linage:</strong> Se você ativar a opção "Ajudar a melhorar o Linage" (Configurações → Privacidade), suas conversas e posts poderão ser utilizados pela equipe do Linage para aprimorar a qualidade do serviço. Os dados são analisados de forma agregada e anonimizados antes de qualquer uso interno. Você pode revogar esse consentimento a qualquer momento nas configurações.</p>
        </section>

        <section className="terms-section">
          <h2>6. Retenção de Dados</h2>
          <div className="terms-table-wrap">
            <table className="terms-table">
              <thead>
                <tr><th>Tipo de dado</th><th>Período de retenção</th></tr>
              </thead>
              <tbody>
                <tr><td>Conta e perfil</td><td>Enquanto a conta estiver ativa</td></tr>
                <tr><td>Posts e conversas</td><td>Enquanto a conta estiver ativa</td></tr>
                <tr><td>Dados financeiros</td><td>Conforme exigências legais e fiscais aplicáveis</td></tr>
                <tr><td>Backups</td><td>Até 90 dias após exclusão da conta</td></tr>
              </tbody>
            </table>
          </div>
          <p>Ao excluir sua conta (Configurações → Privacidade → Excluir conta), todos os seus dados são removidos do banco de dados de produção. Cópias em backup podem persistir por até 90 dias adicionais por razões técnicas.</p>
        </section>

        <section className="terms-section">
          <h2>7. Seus Direitos (LGPD)</h2>
          <p>Nos termos da LGPD, você tem direito a:</p>
          <ul>
            <li><strong>Confirmação e acesso:</strong> Saber se tratamos seus dados e obter cópia deles</li>
            <li><strong>Correção:</strong> Solicitar correção de dados incompletos, inexatos ou desatualizados</li>
            <li><strong>Anonimização, bloqueio ou eliminação:</strong> Para dados desnecessários ou tratados em desconformidade</li>
            <li><strong>Portabilidade:</strong> Receber seus dados em formato estruturado (disponível em Configurações → Privacidade → Exportar dados)</li>
            <li><strong>Eliminação:</strong> Solicitar a exclusão de dados tratados com base no seu consentimento</li>
            <li><strong>Informação:</strong> Conhecer os terceiros com quem compartilhamos seus dados</li>
            <li><strong>Revogação do consentimento:</strong> A qualquer momento, sem ônus</li>
            <li><strong>Oposição:</strong> Se discordar de algum tratamento baseado em legítimo interesse</li>
          </ul>
          <p>Para exercer qualquer desses direitos: <strong>suporte@linage.app</strong><br />Prazo de resposta: até 15 dias corridos.</p>
        </section>

        <section className="terms-section">
          <h2>8. Segurança</h2>
          <p>Adotamos medidas técnicas e organizacionais para proteger seus dados:</p>
          <ul>
            <li>Autenticação via tokens JWT com verificação em todas as requisições</li>
            <li>HTTPS obrigatório em toda a comunicação</li>
            <li>Banco de dados com SSL ativo</li>
            <li>Chaves de API armazenadas exclusivamente em variáveis de ambiente de servidor</li>
            <li>Validação criptográfica de webhooks de pagamento</li>
            <li>Consultas parametrizadas (proteção contra injeção de SQL)</li>
            <li>Isolamento de dados: cada usuário acessa apenas seus próprios dados</li>
          </ul>
          <p>Em caso de incidente de segurança que afete seus dados, notificaremos os usuários afetados no prazo previsto pela LGPD.</p>
        </section>

        <section className="terms-section">
          <h2>9. Cookies e Armazenamento Local</h2>
          <p>O Linage utiliza <code>localStorage</code> do navegador para armazenar preferências de interface, histórico de chat em sessão e configurações de notificação. Esses dados permanecem no seu dispositivo e não são enviados para nossos servidores, exceto quando explicitamente sincronizados.</p>
          <p>Não utilizamos cookies de rastreamento ou publicidade.</p>
        </section>

        <section className="terms-section">
          <h2>10. Menores de Idade</h2>
          <p>O Linage não é destinado a menores de 18 anos e não coleta conscientemente dados de menores. Se identificarmos cadastro de menor, a conta será encerrada e os dados excluídos.</p>
        </section>

        <section className="terms-section">
          <h2>11. Transferência Internacional de Dados</h2>
          <p>Alguns de nossos prestadores (Anthropic, Clerk, Stripe, Vercel, Neon) operam em servidores nos Estados Unidos e/ou outros países. Ao utilizar o Linage, você consente com a transferência internacional de dados necessária para a prestação do serviço, realizada com garantias contratuais adequadas.</p>
        </section>

        <section className="terms-section">
          <h2>12. Alterações nesta Política</h2>
          <p>Podemos atualizar esta Política periodicamente. Alterações substanciais serão comunicadas por email com antecedência mínima de 15 dias. O uso continuado da Plataforma após o aviso constitui aceite das alterações.</p>
        </section>

        <section className="terms-section">
          <h2>13. Contato</h2>
          <p>Para questões relacionadas à privacidade e proteção de dados:</p>
          <p><strong>Email:</strong> suporte@linage.app<br /><strong>Assunto:</strong> Privacidade de Dados</p>
        </section>

      </div>
    </div>
  );
}

export default Privacy;
