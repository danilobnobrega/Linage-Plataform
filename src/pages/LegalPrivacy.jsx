import React from 'react';
import { Shield } from 'lucide-react';
import CustomCursor from '../components/CustomCursor';

function LegalPrivacy() {
  return (
    <div style={s.page}>
      <CustomCursor />
      <div style={s.container}>
        <div style={s.header}>
          <div style={s.logoWrap}>
            <svg width="20" height="19" viewBox="0 0 48 46" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fill="#00ff88" d="M25.946 44.938c-.664.845-2.021.375-2.021-.698V33.937a2.26 2.26 0 0 0-2.262-2.262H10.287c-.92 0-1.456-1.04-.92-1.788l7.48-10.471c1.07-1.497 0-3.578-1.842-3.578H1.237c-.92 0-1.456-1.04-.92-1.788L10.013.474c.214-.297.556-.474.92-.474h28.894c.92 0 1.456 1.04.92 1.788l-7.48 10.471c-1.07 1.498 0 3.579 1.842 3.579h11.377c.943 0 1.473 1.088.89 1.83L25.947 44.94z"/>
            </svg>
            <span style={s.logoText}>Linage</span>
          </div>
          <div style={s.titleWrap}>
            <Shield size={18} style={{ color: '#00ff88' }} />
            <span style={s.subtitle}>Legal</span>
            <h1 style={s.title}>Política de Privacidade</h1>
            <p style={s.date}>Última atualização: junho de 2026</p>
          </div>
        </div>

        <div style={s.doc}>
          <section style={s.section}>
            <p style={s.p}>Esta Política de Privacidade descreve como o Linage coleta, armazena, utiliza e protege os dados pessoais dos usuários, em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).</p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>1. Controlador de Dados</h2>
            <p style={s.p}>O controlador dos dados pessoais tratados por esta Plataforma é o Linage. Para exercer seus direitos ou esclarecer dúvidas: <strong>suporte@linage.app</strong></p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>2. Dados Coletados</h2>
            <h3 style={s.h3}>2.1 Dados de cadastro</h3>
            <ul style={s.ul}>
              <li style={s.li}>Nome completo</li>
              <li style={s.li}>Endereço de email</li>
              <li style={s.li}>Foto de perfil (opcional, sincronizada de sua conta LinkedIn)</li>
              <li style={s.li}>Apelido personalizado (opcional)</li>
              <li style={s.li}>Instruções pessoais para o Linage (opcional, até 1.000 caracteres)</li>
            </ul>
            <h3 style={s.h3}>2.2 Dados de uso</h3>
            <ul style={s.ul}>
              <li style={s.li}>Posts criados: título, conteúdo e status</li>
              <li style={s.li}>Histórico de conversas vinculadas a cada post gerado</li>
              <li style={s.li}>Saldo e histórico de uso de créditos</li>
              <li style={s.li}>Data de criação e última atualização de cada post</li>
            </ul>
            <h3 style={s.h3}>2.3 Dados financeiros</h3>
            <ul style={s.ul}>
              <li style={s.li}>Identificadores de cliente e assinatura no Stripe</li>
              <li style={s.li}>Histórico de faturas e status de pagamentos</li>
            </ul>
            <p style={s.p}><strong>Dados de cartão de crédito não são armazenados pelo Linage</strong> — são processados e armazenados diretamente pelo Stripe, sob sua própria política de privacidade (PCI-DSS compliant).</p>
            <h3 style={s.h3}>2.4 Dados técnicos</h3>
            <ul style={s.ul}>
              <li style={s.li}>Tokens de autenticação (JWT, gerenciados pelo Clerk)</li>
              <li style={s.li}>Preferências de privacidade e notificações (armazenadas localmente em seu navegador)</li>
            </ul>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>3. Finalidade do Tratamento</h2>
            <div style={s.tableWrap}>
              <table style={s.table}>
                <thead>
                  <tr><th style={s.th}>Dado</th><th style={s.th}>Finalidade</th><th style={s.th}>Base legal (LGPD)</th></tr>
                </thead>
                <tbody>
                  <tr><td style={s.td}>Email, nome, foto</td><td style={s.td}>Autenticação e identificação</td><td style={s.td}>Execução de contrato (Art. 7º, V)</td></tr>
                  <tr><td style={s.td}>Posts e conversas</td><td style={s.td}>Prestação do serviço, histórico do usuário</td><td style={s.td}>Execução de contrato (Art. 7º, V)</td></tr>
                  <tr><td style={s.td}>Instruções pessoais</td><td style={s.td}>Personalização da IA</td><td style={s.td}>Execução de contrato (Art. 7º, V)</td></tr>
                  <tr><td style={s.td}>Dados financeiros</td><td style={s.td}>Processamento de pagamentos e controle de acesso</td><td style={s.td}>Execução de contrato (Art. 7º, V)</td></tr>
                  <tr><td style={s.td}>Posts e conversas (com consentimento)</td><td style={s.td}>Melhoria do produto e treinamento de modelos</td><td style={s.td}>Consentimento (Art. 7º, I)</td></tr>
                  <tr><td style={s.td}>Dados agregados de uso</td><td style={s.td}>Análise de desempenho e produto</td><td style={s.td}>Legítimo interesse (Art. 7º, IX)</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>4. Serviços de Terceiros</h2>
            <p style={s.p}>O Linage utiliza os seguintes prestadores de serviço que podem processar seus dados:</p>
            <div style={s.tableWrap}>
              <table style={s.table}>
                <thead>
                  <tr><th style={s.th}>Prestador</th><th style={s.th}>Finalidade</th><th style={s.th}>Dados transmitidos</th></tr>
                </thead>
                <tbody>
                  <tr><td style={s.td}>Clerk</td><td style={s.td}>Autenticação</td><td style={s.td}>Email, nome, foto de perfil</td></tr>
                  <tr><td style={s.td}>Stripe</td><td style={s.td}>Pagamentos</td><td style={s.td}>Email, dados de cobrança, identificadores</td></tr>
                  <tr><td style={s.td}>Anthropic (Claude)</td><td style={s.td}>Geração de conteúdo por IA</td><td style={s.td}>Mensagens do chat e contexto do post</td></tr>
                  <tr><td style={s.td}>Tavily</td><td style={s.td}>Pesquisa de notícias em tempo real</td><td style={s.td}>Termos de busca (sem identificação pessoal)</td></tr>
                  <tr><td style={s.td}>Neon</td><td style={s.td}>Banco de dados</td><td style={s.td}>Todos os dados armazenados</td></tr>
                  <tr><td style={s.td}>Vercel</td><td style={s.td}>Hospedagem e infraestrutura</td><td style={s.td}>Logs de acesso e requisições</td></tr>
                </tbody>
              </table>
            </div>
            <p style={s.p}>O Linage não vende dados pessoais a terceiros.</p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>5. Uso de IA e Seus Dados</h2>
            <p style={s.p}>As mensagens que você envia no chat e os posts gerados são processados pela API da Anthropic (Claude) para produzir as respostas. Por padrão, a Anthropic não utiliza dados enviados via API para treinar seus modelos.</p>
            <p style={s.p}><strong>Melhoria do produto pelo Linage:</strong> Se você ativar a opção "Ajudar a melhorar o Linage" (Configurações → Privacidade), suas conversas e posts poderão ser utilizados pela equipe do Linage para aprimorar a qualidade do serviço. Os dados são analisados de forma agregada e anonimizados antes de qualquer uso interno. Você pode revogar esse consentimento a qualquer momento nas configurações.</p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>6. Retenção de Dados</h2>
            <div style={s.tableWrap}>
              <table style={s.table}>
                <thead>
                  <tr><th style={s.th}>Tipo de dado</th><th style={s.th}>Período de retenção</th></tr>
                </thead>
                <tbody>
                  <tr><td style={s.td}>Conta e perfil</td><td style={s.td}>Enquanto a conta estiver ativa</td></tr>
                  <tr><td style={s.td}>Posts e conversas</td><td style={s.td}>Enquanto a conta estiver ativa</td></tr>
                  <tr><td style={s.td}>Dados financeiros</td><td style={s.td}>Conforme exigências legais e fiscais aplicáveis</td></tr>
                  <tr><td style={s.td}>Backups</td><td style={s.td}>Até 90 dias após exclusão da conta</td></tr>
                </tbody>
              </table>
            </div>
            <p style={s.p}>Ao excluir sua conta (Configurações → Privacidade → Excluir conta), todos os seus dados são removidos do banco de dados de produção. Cópias em backup podem persistir por até 90 dias adicionais por razões técnicas.</p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>7. Seus Direitos (LGPD)</h2>
            <p style={s.p}>Nos termos da LGPD, você tem direito a:</p>
            <ul style={s.ul}>
              <li style={s.li}><strong>Confirmação e acesso:</strong> Saber se tratamos seus dados e obter cópia deles</li>
              <li style={s.li}><strong>Correção:</strong> Solicitar correção de dados incompletos, inexatos ou desatualizados</li>
              <li style={s.li}><strong>Anonimização, bloqueio ou eliminação:</strong> Para dados desnecessários ou tratados em desconformidade</li>
              <li style={s.li}><strong>Portabilidade:</strong> Receber seus dados em formato estruturado (disponível em Configurações → Privacidade → Exportar dados)</li>
              <li style={s.li}><strong>Eliminação:</strong> Solicitar a exclusão de dados tratados com base no seu consentimento</li>
              <li style={s.li}><strong>Informação:</strong> Conhecer os terceiros com quem compartilhamos seus dados</li>
              <li style={s.li}><strong>Revogação do consentimento:</strong> A qualquer momento, sem ônus</li>
              <li style={s.li}><strong>Oposição:</strong> Se discordar de algum tratamento baseado em legítimo interesse</li>
            </ul>
            <p style={s.p}>Para exercer qualquer desses direitos: <strong>suporte@linage.app</strong><br />Prazo de resposta: até 15 dias corridos.</p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>8. Segurança</h2>
            <p style={s.p}>Adotamos medidas técnicas e organizacionais para proteger seus dados:</p>
            <ul style={s.ul}>
              <li style={s.li}>Autenticação via tokens JWT com verificação em todas as requisições</li>
              <li style={s.li}>HTTPS obrigatório em toda a comunicação</li>
              <li style={s.li}>Banco de dados com SSL ativo</li>
              <li style={s.li}>Chaves de API armazenadas exclusivamente em variáveis de ambiente de servidor</li>
              <li style={s.li}>Validação criptográfica de webhooks de pagamento</li>
              <li style={s.li}>Consultas parametrizadas (proteção contra injeção de SQL)</li>
              <li style={s.li}>Isolamento de dados: cada usuário acessa apenas seus próprios dados</li>
            </ul>
            <p style={s.p}>Em caso de incidente de segurança que afete seus dados, notificaremos os usuários afetados no prazo previsto pela LGPD.</p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>9. Cookies e Armazenamento Local</h2>
            <p style={s.p}>O Linage utiliza <code>localStorage</code> do navegador para armazenar preferências de interface, histórico de chat em sessão e configurações de notificação. Esses dados permanecem no seu dispositivo e não são enviados para nossos servidores, exceto quando explicitamente sincronizados.</p>
            <p style={s.p}>Não utilizamos cookies de rastreamento ou publicidade.</p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>10. Menores de Idade</h2>
            <p style={s.p}>O Linage não é destinado a menores de 18 anos e não coleta conscientemente dados de menores. Se identificarmos cadastro de menor, a conta será encerrada e os dados excluídos.</p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>11. Transferência Internacional de Dados</h2>
            <p style={s.p}>Alguns de nossos prestadores (Anthropic, Clerk, Stripe, Vercel, Neon) operam em servidores nos Estados Unidos e/ou outros países. Ao utilizar o Linage, você consente com a transferência internacional de dados necessária para a prestação do serviço, realizada com garantias contratuais adequadas.</p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>12. Alterações nesta Política</h2>
            <p style={s.p}>Podemos atualizar esta Política periodicamente. Alterações substanciais serão comunicadas por email com antecedência mínima de 15 dias. O uso continuado da Plataforma após o aviso constitui aceite das alterações.</p>
          </section>

          <section style={{ ...s.section, borderBottom: 'none', marginBottom: 0, paddingBottom: 0 }}>
            <h2 style={s.h2}>13. Contato</h2>
            <p style={s.p}>Para questões relacionadas à privacidade e proteção de dados:</p>
            <p style={s.p}><strong>Email:</strong> suporte@linage.app<br /><strong>Assunto:</strong> Privacidade de Dados</p>
          </section>
        </div>
      </div>
    </div>
  );
}

const s = {
  page: {
    height: '100vh',
    overflowY: 'auto',
    background: '#030508',
    padding: '48px 16px',
    fontFamily: "'Space Grotesk', system-ui, sans-serif",
  },
  container: {
    maxWidth: '760px',
    margin: '0 auto',
  },
  header: {
    marginBottom: '40px',
  },
  logoWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '32px',
  },
  logoText: {
    fontSize: '18px',
    fontWeight: 500,
    color: '#f0eef8',
    fontFamily: "'Space Grotesk', sans-serif",
  },
  titleWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  subtitle: {
    fontSize: '12px',
    color: '#00ff88',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    fontWeight: 600,
    marginTop: '8px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 400,
    color: '#f0eef8',
    fontFamily: "'Cormorant Garamond', serif",
    margin: '4px 0',
  },
  date: {
    fontSize: '13px',
    color: '#8b8897',
  },
  doc: {
    background: 'rgba(8, 11, 18, 0.75)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '16px',
    padding: '40px',
  },
  section: {
    marginBottom: '32px',
    paddingBottom: '32px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
  },
  h2: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#f0eef8',
    marginBottom: '12px',
  },
  h3: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#c8c4d4',
    margin: '16px 0 8px',
  },
  p: {
    fontSize: '14px',
    color: '#8b8897',
    lineHeight: 1.7,
    margin: '0 0 8px',
  },
  ul: {
    margin: '8px 0',
    paddingLeft: '20px',
  },
  li: {
    fontSize: '14px',
    color: '#8b8897',
    lineHeight: 1.7,
    marginBottom: '4px',
  },
  tableWrap: {
    overflowX: 'auto',
    margin: '12px 0',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px',
  },
  th: {
    textAlign: 'left',
    padding: '8px 12px',
    background: 'rgba(255,255,255,0.04)',
    color: '#c8c4d4',
    fontWeight: 600,
    borderBottom: '1px solid rgba(255,255,255,0.08)',
  },
  td: {
    padding: '8px 12px',
    color: '#8b8897',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
  },
};

export default LegalPrivacy;
