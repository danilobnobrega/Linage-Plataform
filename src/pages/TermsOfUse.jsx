import React from 'react';
import { FileText, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function TermsOfUse() {
  const navigate = useNavigate();
  return (
    <div className="page-container terms-page animate-fade-in">
      <header className="page-header">
        <div className="credits-page-orb">
          <FileText size={28} className="credits-page-orb-icon" />
        </div>
        <div className="header-text-container">
          <span className="header-subtitle">Legal</span>
          <h1 className="header-title">Política de Uso</h1>
          <p className="header-desc">Última atualização: junho de 2026</p>
        </div>
      </header>

      <button className="terms-back-btn" onClick={() => navigate('/terms')}>
        <ArrowLeft size={14} /> Voltar
      </button>

      <div className="terms-doc glass-card">

        <section className="terms-section">
          <h2>1. Aceitação dos Termos</h2>
          <p>Ao criar uma conta, acessar ou utilizar a plataforma Linage ("Plataforma"), você concorda integralmente com esta Política de Uso. Se não concordar com qualquer disposição, não utilize a Plataforma.</p>
        </section>

        <section className="terms-section">
          <h2>2. O que é o Linage</h2>
          <p>O Linage é uma plataforma de criação de conteúdo assistida por inteligência artificial, voltada a profissionais do mercado financeiro brasileiro que desejam produzir posts para o LinkedIn com qualidade editorial e consistência de voz. A Plataforma não substitui o julgamento do usuário — ela é uma ferramenta de apoio à criação.</p>
        </section>

        <section className="terms-section">
          <h2>3. Elegibilidade</h2>
          <p>Para utilizar o Linage você deve:</p>
          <ul>
            <li>Ter ao menos 18 anos de idade</li>
            <li>Ser profissional com atuação no mercado financeiro ou áreas correlatas</li>
            <li>Fornecer informações verdadeiras no cadastro</li>
            <li>Possuir capacidade legal para celebrar contratos</li>
          </ul>
        </section>

        <section className="terms-section">
          <h2>4. Cadastro e Conta</h2>
          <p>Você é responsável por manter a confidencialidade das credenciais de acesso. Qualquer atividade realizada com sua conta é de sua responsabilidade. Notifique imediatamente o suporte em suporte@linage.app em caso de acesso não autorizado.</p>
        </section>

        <section className="terms-section">
          <h2>5. Planos, Créditos e Pagamentos</h2>

          <h3>5.1 Planos disponíveis</h3>
          <div className="terms-table-wrap">
            <table className="terms-table">
              <thead>
                <tr><th>Plano</th><th>Créditos mensais</th><th>Equivalente em posts</th></tr>
              </thead>
              <tbody>
                <tr><td>Teste Grátis</td><td>1.350 (únicos, não renovam)</td><td>~3 posts</td></tr>
                <tr><td>Starter</td><td>4.500/mês</td><td>~10 posts</td></tr>
                <tr><td>Pro</td><td>9.000/mês</td><td>~20 posts</td></tr>
              </tbody>
            </table>
          </div>

          <h3>5.2 Créditos avulsos</h3>
          <p>Créditos avulsos podem ser adquiridos a qualquer momento, não expiram e se acumulam com os créditos do plano.</p>

          <h3>5.3 Custo por ação</h3>
          <p>Gerar um post consome 450 créditos. Refinamentos, revisões e uso do chat não consomem créditos adicionais.</p>

          <h3>5.4 Cobrança</h3>
          <p>Assinaturas são cobradas mensalmente ou anualmente, conforme plano escolhido, via cartão de crédito processado pelo Stripe. Ao assinar, você autoriza a cobrança recorrente no período contratado.</p>

          <h3>5.5 Cancelamento</h3>
          <p>Você pode cancelar a assinatura a qualquer momento em Configurações → Cobrança. O acesso ao plano permanece ativo até o fim do ciclo já pago. Não há reembolso proporcional de períodos em curso.</p>

          <h3>5.6 Inadimplência</h3>
          <p>Em caso de falha no pagamento, o acesso ao plano pode ser suspenso até a regularização.</p>
        </section>

        <section className="terms-section">
          <h2>6. Uso Permitido</h2>
          <p>Você pode utilizar o Linage para:</p>
          <ul>
            <li>Criar posts originais para o LinkedIn sobre temas do mercado financeiro</li>
            <li>Desenvolver ideias, ângulos e narrativas para conteúdo profissional</li>
            <li>Refinar e revisar textos gerados pela Plataforma</li>
            <li>Exportar e publicar o conteúdo gerado em seu próprio perfil ou canais</li>
          </ul>
        </section>

        <section className="terms-section">
          <h2>7. Uso Proibido</h2>
          <p>É expressamente vedado utilizar o Linage para:</p>
          <ul>
            <li><strong>Conteúdo fora do escopo:</strong> Elaborar comentários para posts de terceiros, mensagens de prospecção, cold emails, scripts de vendas ou qualquer tipo de texto que não seja um post para publicação em seu próprio perfil</li>
            <li><strong>Manipulação de mercado:</strong> Criar conteúdo com informações falsas, enganosas ou destinadas a manipular preços de ativos</li>
            <li><strong>Spam:</strong> Produzir conteúdo em volume para distribuição massiva automatizada</li>
            <li><strong>Violação de direitos:</strong> Reproduzir, plagiar ou apropriar conteúdo protegido por direito autoral sem autorização</li>
            <li><strong>Infrações legais:</strong> Gerar conteúdo que viole a legislação brasileira, normas da CVM, regulamentos do Banco Central ou outras autoridades regulatórias</li>
            <li><strong>Impersonificação:</strong> Criar conteúdo se passando por outra pessoa ou instituição</li>
            <li><strong>Engenharia reversa:</strong> Tentar extrair, copiar ou reproduzir os prompts, algoritmos ou lógica interna da Plataforma</li>
            <li><strong>Acesso não autorizado:</strong> Tentar contornar mecanismos de autenticação, consumo de créditos ou qualquer outra proteção técnica</li>
          </ul>
        </section>

        <section className="terms-section">
          <h2>8. Responsabilidade sobre o Conteúdo</h2>
          <p>O conteúdo gerado pelo Linage é uma sugestão editorial. Você é o único responsável por:</p>
          <ul>
            <li>Verificar a veracidade e precisão das informações antes de publicar</li>
            <li>Garantir que o conteúdo está em conformidade com as normas regulatórias aplicáveis ao seu setor (CVM, ANBIMA, Banco Central, etc.)</li>
            <li>Declarações, recomendações de investimento ou afirmações que possam configurar consultoria financeira não autorizada</li>
            <li>Quaisquer consequências decorrentes da publicação do conteúdo</li>
          </ul>
          <p>O Linage não se responsabiliza por perdas, danos, reclamações regulatórias ou qualquer consequência resultante do uso ou publicação do conteúdo gerado.</p>
        </section>

        <section className="terms-section">
          <h2>9. Propriedade Intelectual</h2>
          <h3>9.1 Conteúdo gerado</h3>
          <p>O conteúdo textual gerado pelo Linage a partir de suas interações pertence a você. Ao utilizá-lo, você declara ter ciência de que conteúdo gerado por IA pode não ser protegível por direitos autorais em todas as jurisdições.</p>
          <h3>9.2 Plataforma</h3>
          <p>Todo o software, design, prompts, metodologias, marcas e demais elementos da Plataforma são de propriedade exclusiva do Linage. É proibida a reprodução, distribuição ou criação de produtos derivados sem autorização expressa.</p>
        </section>

        <section className="terms-section">
          <h2>10. Disponibilidade e Modificações</h2>
          <p>O Linage se esforça para manter a Plataforma disponível, mas não garante disponibilidade ininterrupta. Nos reservamos o direito de alterar, suspender ou encerrar funcionalidades com aviso prévio razoável. Alterações substanciais nesta Política serão comunicadas por email.</p>
        </section>

        <section className="terms-section">
          <h2>11. Suspensão e Encerramento</h2>
          <p>Podemos suspender ou encerrar sua conta, sem aviso prévio, em caso de:</p>
          <ul>
            <li>Violação desta Política de Uso</li>
            <li>Uso fraudulento ou abusivo da Plataforma</li>
            <li>Inadimplência não regularizada</li>
            <li>Determinação legal ou regulatória</li>
          </ul>
          <p>Em caso de encerramento por violação, créditos adquiridos não serão reembolsados.</p>
        </section>

        <section className="terms-section">
          <h2>12. Limitação de Responsabilidade</h2>
          <p>Na máxima extensão permitida por lei, o Linage não se responsabiliza por danos indiretos, incidentais, consequenciais ou lucros cessantes decorrentes do uso ou impossibilidade de uso da Plataforma. Nossa responsabilidade total, em qualquer caso, está limitada ao valor pago pelo usuário nos últimos 3 meses.</p>
        </section>

        <section className="terms-section">
          <h2>13. Lei Aplicável e Foro</h2>
          <p>Esta Política é regida pelas leis da República Federativa do Brasil. Fica eleito o foro da comarca de São Paulo/SP para dirimir quaisquer controvérsias, com renúncia expressa a qualquer outro, por mais privilegiado que seja.</p>
        </section>

        <section className="terms-section">
          <h2>14. Contato</h2>
          <p>Para dúvidas sobre esta Política: <strong>suporte@linage.app</strong></p>
        </section>

      </div>
    </div>
  );
}

export default TermsOfUse;
