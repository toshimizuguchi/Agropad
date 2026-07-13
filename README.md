# 🌿 AgroPad

> **Status do Projeto:** 🚀 Em Produção / Uso Real no Campo

O **AgroPad** é um aplicativo web leve, intuitivo e *mobile-first* criado para digitalizar e agilizar o controle de vendas de produtores agrícolas. Ele foi desenvolvido sob medida para substituir os antigos cadernos quadriculados de papel, focando na velocidade de anotação, controle financeiro e facilitação de cobranças.

---

## 📖 A Origem do Projeto

O projeto nasceu de uma necessidade real: **ajudar meu pai, que é agricultor, a gerenciar suas vendas** de hortifrúti (como caixas de chuchu e pitaya) enviadas para o CEAGESP. 

No dia a dia da roça, o caderno de papel tradicional apresenta diversos problemas:
*   Molha, rasga ou borra com facilidade devido ao ambiente de trabalho;
*   Exige cálculos manuais demorados na calculadora para somar o faturamento;
*   Dificulta a identificação rápida de quais compradores estão com pagamentos pendentes;
*   Demanda muito tempo para digitar resumos de pedidos e mensagens de cobrança no celular.

O **AgroPad** resolve tudo isso centralizando os dados localmente no celular e automatizando o envio de mensagens de cobrança e recibos pelo WhatsApp.

---

## ⏱️ Ganho de Eficiência (Manual vs. Digital)

O grande diferencial do sistema é a velocidade operacional. Veja o comparativo do tempo gasto pelo agricultor antes e depois do aplicativo:

| Tarefa | Processo Manual (Caderno de Papel) | Com o AgroPad | Economia de Tempo |
| :--- | :--- | :--- | :--- |
| **Anotar Pedido** | **~2 a 3 minutos** <br>*(Escrever comprador, produtos, quantidades e calcular totais na mão)* | **~30 segundos** <br>*(Autocomplete de cliente, seleção de produtos e cálculo automático)* | **⬇️ Redução de ~80%** |
| **Enviar Comprovante (WhatsApp)** | **~3 minutos** <br>*(Digitar toda a mensagem com o resumo de itens e valores no celular)* | **~5 segundos** <br>*(Apenas 1 clique para abrir a conversa com o texto pronto)* | **⬇️ Redução de ~97%** |
| **Cobrar Pendentes** | **~10 a 15 minutos** <br>*(Folhear páginas, somar pendências e redigir texto de cobrança)* | **~10 segundos** <br>*(Alerta visual no painel e botão de cobrança direta pelo WhatsApp)* | **⬇️ Redução de ~98%** |
| **Fechamento do Mês** | **~30 a 60 minutos** <br>*(Somar todas as vendas do mês na calculadora, com risco de erro)* | **Imediato (0 segundos)** <br>*(Histórico e faturamento mensal gerados automaticamente em tempo real)* | **⬇️ Redução de 100%** |

---

## 🛠️ Funcionalidades do Sistema

*   **📊 Painel de Vendas (Dashboard):** Exibe o faturamento total do período selecionado (Hoje, Mês ou Geral), contagem de caixas vendidas de Chuchu e Pitaya, e o valor total pendente que ainda precisa ser recebido.
*   **⚠️ Alertas de Pendência:** Uma seção dedicada no painel inicial destaca todos os clientes que estão com o pagamento atrasado para cobrança rápida.
*   **📝 Cadastro e Anotação Ágil:** Formulário otimizado para celulares com preenchimento automático para clientes recorrentes (puxando o último telefone salvo) e opção de salvar preços padrões para os produtos.
*   **💬 Integração com WhatsApp:** Envio de mensagem formatada com o resumo do pedido ou com cobrança educada para os clientes pendentes com apenas um toque.
*   **📊 Histórico Mensal:** Exibição visual do progresso de vendas mês a mês com barras de progresso que mostram a relação entre valores pagos e pendentes.
*   **⚙️ Backup de Segurança:** Permite exportar todos os dados salvos em um arquivo JSON e restaurá-los se o usuário trocar de celular ou limpar os dados do navegador.

---

## 💻 Tecnologias Utilizadas

A stack do projeto foi escolhida para ser extremamente leve, carregar rápido mesmo em conexões de internet instáveis no campo (3G/4G) e funcionar offline:

*   **HTML5 Semântico:** Estruturação limpa e otimizada das seções do aplicativo.
*   **CSS3 Customizado:** Estilização responsiva focada em dispositivos móveis, com paleta de cores voltada ao tema "verde orgânico/terra".
*   **JavaScript Vanilla:** Toda a lógica de negócio, manipulação de interface, geração de mensagens de WhatsApp e gerenciamento de estado escrita em JS puro, sem dependências de frameworks pesados.
*   **LocalStorage:** Persistência de dados local de forma direta e segura no próprio navegador do usuário, permitindo o uso do sistema sem internet.
*   **Tipografia:** [Outfit Font](https://fonts.google.com/) para garantir excelente legibilidade no celular.

---

## 📂 Estrutura de Arquivos

```text
├── index.html     # Estrutura de navegação de abas e modais do aplicativo
├── style.css      # Estilização completa, variáveis de cor e regras de responsividade
├── app.js         # Lógica de negócio, persistência (LocalStorage) e integração WhatsApp
└── README.md      # Documentação do projeto
