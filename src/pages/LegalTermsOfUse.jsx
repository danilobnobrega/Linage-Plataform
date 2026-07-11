import React from 'react';
import { FileText } from 'lucide-react';
import CustomCursor from '../components/CustomCursor';

function LegalTermsOfUse() {
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
            <FileText size={18} style={{ color: '#00ff88' }} />
            <span style={s.subtitle}>Legal</span>
            <h1 style={s.title}>Política de Uso</h1>
            <p style={s.date}>Última atualização: junho de 2026</p>
          </div>
        </div>

        <div style={s.doc}>
          <section style={s.section}>
            <h2 style={s.h2}>1. Aceitação dos Termos</h2>
            <p style={s.p}>Ao criar uma conta, acessar ou utilizar a plataforma Linage ("Plataforma"), você concorda integralmente com esta Política de Uso. Se não concordar com qualquer disposição, não utilize a Plataforma.</p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>2. O que é o Linage</h2>
            <p style={s.p}>O Linage é uma plataforma de criação de conteúdo assistida por inteligência artificial, voltada a profissionais do mercado financeiro brasileiro que desejam produzir posts para o LinkedIn com qualidade editorial e consistência de voz. A Plataforma não substitui o julgamento do usuário — ela é uma ferramenta de apoio à criação.</p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>3. Elegibilidade</h2>
            <p style={s.p}>Para utilizar o Linage você deve:</p>
            <ul style={s.ul}>
              <li style={s.li}>Ter ao menos 18 anos de idade</li>
              <li style={s.li}>Ser profissional com atuação no mercado financeiro ou áreas correlatas</li>
              <li style={s.li}>Fornecer informações verdadeiras no cadastro</li>
              <li style={s.li}>Possuir capacidade legal para celebrar contratos</li>
            </ul>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>4. Cadastro e Conta</h2>
            <p style={s.p}>Você é responsável por manter a confidencialidade das credenciais de acesso. Qualquer atividade realizada com sua conta é de sua responsabilidade. Notifique imediatamente o suporte em suporte@linage.app em caso de acesso não autorizado.</p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>5. Planos, Créditos e Pagamentos</h2>
            <h3 style={s.h3}>5.1 Planos disponíveis</h3>
            <div style={s.tableWrap}>
              <table style={s.table}>
                <thead>
                  <tr><th style={s.th}>Plano</th><th style={s.th}>Créditos mensais</th><th style={s.th}>Equivalente em posts</th></tr>
                </thead>
                <tbody>
                  <tr><td style={s.td}>Teste Grátis</td><td style={s.td}>1.350 (únicos, não renovam)</td><td style={s.td}>~3 posts</td></tr>
                  <tr><td style={s.td}>Starter</td><td style={s.td}>4.500/mês</td><td style={s.td}>~10 posts</td></tr>
                  <tr><td style={s.td}>Pro</td><td style={s.td}>9.000/mês</td><td style={s.td}>~20 posts</td></tr>
                </tbody>
              </table>
            </div>
            <h3 style={s.h3}>5.2 Créditos avulsos</h3>
            <p style={s.p}>Créditos avulsos podem ser adquiridos a qualquer momento, não expiram e se acumulam com os créditos do plano.</p>
            <h3 style={s.h3}>5.3 Custo por ação</h3>
            <p style={s.p}>Gerar um post consome 450 créditos. Refinamentos, revisões e uso do chat não consomem créditos adicionais.</p>
            <h3 style={s.h3}>5.4 Cobrança</h3>
            <p style={s.p}>Assinaturas são cobradas mensalmente ou anualmente, conforme plano escolhido, via cartão de crédito processado pelo Stripe. Ao assinar, você autoriza a cobrança recorrente no período contratado.</p>
            <h3 style={s.h3}>5.5 Cancelamento</h3>
            <p style={s.p}>Você pode cancelar a assinatura a qualquer momento em Configurações → Cobrança. O acesso ao plano permanece ativo até o fim do ciclo já pago. Não há reembolso proporcional de períodos em curso.</p>
            <h3 style={s.h3}>5.6 Inadimplência</h3>
            <p style={s.p}>Em caso de falha no pagamento, o acesso ao plano pode ser suspenso até a regularização.</p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>6. Uso Permitido</h2>
            <p style={s.p}>Você pode utilizar o Linage para:</p>
            <ul style={s.ul}>
              <li style={s.li}>Criar posts originais para o LinkedIn sobre temas do mercado financeiro</li>
              <li style={s.li}>Desenvolver ideias, ângulos e narrativas para conteúdo profissional</li>
              <li style={s.li}>Refinar e revisar textos gerados pela Plataforma</li>
              <li style={s.li}>Exportar e publicar o conteúdo gerado em seu próprio perfil ou canais</li>
            </ul>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>7. Uso Proibido</h2>
            <p style={s.p}>É expressamente vedado utilizar o Linage para:</p>
            <ul style={s.ul}>
              <li style={s.li}><strong>Conteúdo fora do escopo:</strong> Elaborar comentários para posts de terceiros, mensagens de prospecção, cold emails, scripts de vendas ou qualquer tipo de texto que não seja um post para publicação em seu próprio perfil</li>
              <li style={s.li}><strong>Manipulação de mercado:</strong> Criar conteúdo com informações falsas, enganosas ou destinadas a manipular preços de ativos</li>
              <li style={s.li}><strong>Spam:</strong> Produzir conteúdo em volume para distribuição massiva automatizada</li>
              <li style={s.li}><strong>Violação de direitos:</strong> Reproduzir, plagiar ou apropriar conteúdo protegido por direito autoral sem autorização</li>
              <li style={s.li}><strong>Infrações legais:</strong> Gerar conteúdo que viole a legislação brasileira, normas da CVM, regulamentos do Banco Central ou outras autoridades regulatórias</li>
              <li style={s.li}><strong>Impersonificação:</strong> Criar conteúdo se passando por outra pessoa ou instituição</li>
              <li style={s.li}><strong>Engenharia reversa:</strong> Tentar extrair, copiar ou reproduzir os prompts, algoritmos ou lógica interna da Plataforma</li>
              <li style={s.li}><strong>Acesso não autorizado:</strong> Tentar contornar mecanismos de autenticação, consumo de créditos ou qualquer outra proteção técnica</li>
            </ul>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>8. Responsabilidade sobre o Conteúdo</h2>
            <p style={s.p}>O conteúdo gerado pelo Linage é uma sugestão editorial. Você é o único responsável por:</p>
            <ul style={s.ul}>
              <li style={s.li}>Verificar a veracidade e precisão das informações antes de publicar</li>
              <li style={s.li}>Garantir que o conteúdo está em conformidade com as normas regulatórias aplicáveis ao seu setor (CVM, ANBIMA, Banco Central, etc.)</li>
              <li style={s.li}>Declarações, recomendações de investimento ou afirmações que possam configurar consultoria financeira não autorizada</li>
              <li style={s.li}>Quaisquer consequências decorrentes da publicação do conteúdo</li>
            </ul>
            <p style={s.p}>O Linage não se responsabiliza por perdas, danos, reclamações regulatórias ou qualquer consequência resultante do uso ou publicação do conteúdo gerado.</p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>9. Propriedade Intelectual</h2>
            <h3 style={s.h3}>9.1 Conteúdo gerado</h3>
            <p style={s.p}>O conteúdo textual gerado pelo Linage a partir de suas interações pertence a você. Ao utilizá-lo, você declara ter ciência de que conteúdo gerado por IA pode não ser protegível por direitos autorais em todas as jurisdições.</p>
            <h3 style={s.h3}>9.2 Plataforma</h3>
            <p style={s.p}>Todo o software, design, prompts, metodologias, marcas e demais elementos da Plataforma são de propriedade exclusiva do Linage. É proibida a reprodução, distribuição ou criação de produtos derivados sem autorização expressa.</p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>10. Disponibilidade e Modificações</h2>
            <p style={s.p}>O Linage se esforça para manter a Plataforma disponível, mas não garante disponibilidade ininterrupta. Nos reservamos o direito de alterar, suspender ou encerrar funcionalidades com aviso prévio razoável. Alterações substanciais nesta Política serão comunicadas por email.</p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>11. Suspensão e Encerramento</h2>
            <p style={s.p}>Podemos suspender ou encerrar sua conta, sem aviso prévio, em caso de:</p>
            <ul style={s.ul}>
              <li style={s.li}>Violação desta Política de Uso</li>
              <li style={s.li}>Uso fraudulento ou abusivo da Plataforma</li>
              <li style={s.li}>Inadimplência não regularizada</li>
              <li style={s.li}>Determinação legal ou regulatória</li>
            </ul>
            <p style={s.p}>Em caso de encerramento por violação, créditos adquiridos não serão reembolsados.</p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>12. Limitação de Responsabilidade</h2>
            <p style={s.p}>Na máxima extensão permitida por lei, o Linage não se responsabiliza por danos indiretos, incidentais, consequenciais ou lucros cessantes decorrentes do uso ou impossibilidade de uso da Plataforma. Nossa responsabilidade total, em qualquer caso, está limitada ao valor pago pelo usuário nos últimos 3 meses.</p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>13. Lei Aplicável e Foro</h2>
            <p style={s.p}>Esta Política é regida pelas leis da República Federativa do Brasil. Fica eleito o foro da comarca de São Paulo/SP para dirimir quaisquer controvérsias, com renúncia expressa a qualquer outro, por mais privilegiado que seja.</p>
          </section>

          <section style={s.section}>
            <h2 style={s.h2}>14. Contato</h2>
            <p style={s.p}>Para dúvidas sobre esta Política: <strong>suporte@linage.app</strong></p>
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

export default LegalTermsOfUse;
