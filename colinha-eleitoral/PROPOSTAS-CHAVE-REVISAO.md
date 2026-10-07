# Dez propostas para o bloco ★ do 2 Turno

Preparado em **6 de outubro de 2026**. Versão editorial proposta: `brazil-proposals-2026-draft-v1`. Estado: **seleção fechada em 7 de outubro de 2026, com oito propostas** (ver [Decisão](#decisão-de-7-de-outubro-de-2026)). Modelo de pontuação relacionado: `brazil-presidential-2026-v2`.

São cinco propostas encontradas no plano de cada candidato. Os textos abaixo são as afirmações que o usuário avaliaria na mesma escala de cinco respostas do quiz. O candidato de origem aparece neste documento de revisão; na experiência do usuário, sua identidade seria revelada no resultado.

As dez propostas têm apoio explícito do proponente nos PDFs consultados. A busca no texto integral e a leitura contextual das seções do outro plano não estabeleceram uma posição atual conclusiva do outro candidato sobre a redação exata de cada pergunta. Esses casos ficam como **posição não encontrada nas fontes consultadas**, sem resposta numérica atribuída. Registros históricos e posições sobre assuntos próximos aparecem separadamente.

Isso permite comparar o usuário com a proposta documentada de seu proponente. Não permite afirmar que os dois candidatos se opõem em todos esses assuntos. A diferença entre os candidatos e a capacidade de cada pergunta de dividir opiniões continuam como critérios de revisão; nenhuma delas foi validada por um teste com leitores.

## Decisão de 7 de outubro de 2026

O bloco ★ fica com quatro propostas de cada candidato, gravadas em `proposals` de `backend/data/elections/brazil-2026.json` e da tradução inglesa, nesta ordem:

| Nº | Proponente | Texto final |
| --- | --- | --- |
| 1 | Flávio | O governo federal deve apoiar a ampliação de escolas públicas no modelo cívico-militar. |
| 2 | Flávio | O Brasil deve buscar se tornar membro da OCDE. |
| 3 | Flávio | A licença ambiental deve ser concedida se o empreendedor cumprir os requisitos legais e o órgão ambiental não decidir nem se manifestar dentro do prazo. |
| 5 | Flávio | As facções criminosas devem ser classificadas oficialmente como organizações terroristas. |
| 6 | Lula | A instalação de centros de processamento de dados no Brasil deve incluir exigências de conteúdo local. |
| 7 | Lula | O governo deve ampliar a regulação das redes sociais e das plataformas digitais. |
| 8 | Lula | O governo deve continuar assentando famílias acampadas por meio da reforma agrária. |
| 10 | Lula | O governo federal deve ampliar os incentivos para o uso de câmeras corporais pelas polícias. |

Aplica-se a regra da revisão das 72 perguntas: a frase não usa palavra negativa nem palavra com carga positiva e descreve a medida de forma que as duas posições a reconheçam. Um leitor havia achado as perguntas do rascunho "agressivas", a ponto de parecer errado concordar.

- **2. OCDE:** "dar continuidade ao processo" pressupunha um processo em andamento, enquanto o plano fala em retomar um cronograma interrompido. A versão final descreve o objetivo sem essa premissa e precisa de uma ajuda que explique a sigla.
- **5. Facções:** "narcoterroristas" é a retórica do plano e já é uma posição. A versão final mantém o núcleo da proposta, a classificação como organização terrorista.
- **7. Redes sociais:** "disseminação de desinformação" pressupõe que o conteúdo regulado é falso. A versão final segue a direção do plano sem esse termo e sem o qualificativo "democrática". Continua sendo a pergunta que mais precisa de teste de compreensão.
- **4. Gestão do ensino superior** e **9. Lavanderias públicas** foram descartadas por baixa relevância para o público geral. A troca de ministério exige explicação técnica, e as lavanderias, apresentadas como uma das propostas-chave de Lula, poderiam soar como caricatura do plano.

A ausência de posição conhecida do outro candidato vale para as dez propostas e não foi usada como critério de exclusão. Com oito extras, os totais passam a 36 + 8, 60 + 8 e 72 + 8. O frontend ainda não exibe o bloco; as propostas são servidas pela API em `GET /api/elections/brazil-2026/model`.

## Fontes e método

- **F:** [plano de Flávio Bolsonaro, arquivo local](planos-de-governo/flavio-bolsonaro.pdf), 76 páginas de PDF, com conteúdo numerado até a página 75. [Endereço do PDF cadastrado no projeto](https://planodegoverno2026.com.br/planos/flavio-bolsonaro-0a34723b.pdf).
- **L:** [plano de Lula, arquivo local](planos-de-governo/lula.pdf), 84 páginas. [Endereço do PDF cadastrado no projeto](https://planodegoverno2026.com.br/planos/lula-e48f1c29.pdf).
- **H1:** [Decreto 11.611, de 19 de julho de 2023, arts. 1º e 2º](https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2023/decreto/d11611.htm): encerramento do programa federal de escolas cívico-militares. Registro histórico do governo Lula, assinado por Geraldo Alckmin no exercício da Presidência e por Camilo Santana.
- **H2:** [Relatório de Progresso do Governo Brasileiro, Fórum de CEOs Brasil–EUA, 15 de dezembro de 2023, p. 13](https://www.gov.br/mdic/pt-br/centrais-de-conteudo/publicacoes/documentos/forum-ceos-2023/ptg-relatorio-de-progresso-2023-ceo_forum.pdf#page=13): exame do processo de adesão e cooperação com a OCDE durante o governo Lula. Contexto histórico, sem determinação da posição eleitoral de 2026.

As páginas citadas dos dois planos são as do PDF e coincidem com a numeração impressa nos trechos usados. Os títulos dos arquivos e sua associação aos candidatos seguem os materiais presentes no projeto. A conferência dos trechos foi feita nos arquivos locais; os endereços cadastrados permitem localizar as versões publicadas.

A redação mede uma proposta por vez, conserva as condições presentes na fonte e evita adicionar promessas de eficácia, justificativas morais ou posições atribuídas por omissão. Apoio explícito a uma proposta não determina automaticamente a intensidade “concordo totalmente”. Esta seleção registra direção de apoio e evidência, sem criar novas respostas na escala do modelo atual.

| Nº | Proponente | Tema | Página da proposta | Sobreposição com o quiz |
| --- | --- | --- | --- | --- |
| 1 | Flávio | Escolas cívico-militares | F, 35 | Baixa |
| 2 | Flávio | Adesão à OCDE | F, 63 | Baixa; relação com compromissos internacionais |
| 3 | Flávio | Licença ambiental por decurso do prazo | F, 49–50 | Média a alta; novo mecanismo dentro de tema existente |
| 4 | Flávio | Gestão do ensino superior | F, 36 | Baixa |
| 5 | Flávio | Classificação de facções | F, 13 | Baixa |
| 6 | Lula | Conteúdo local em datacenters | L, 55 | Média; recorte distinto das compras públicas |
| 7 | Lula | Regulação de redes sociais | L, 16 | Baixa; redação exige teste de compreensão |
| 8 | Lula | Assentamentos da reforma agrária | L, 60 | Baixa |
| 9 | Lula | Lavanderias públicas | L, 26 | Baixa |
| 10 | Lula | Câmeras corporais nas polícias | L, 30 | Média; instrumento distinto da autonomia operacional |

## 1. Escolas cívico-militares

**ID editorial:** `br2026_star_escolas_civico_militares`

**Pergunta:** O governo federal deve apoiar a ampliação de escolas públicas no modelo cívico-militar.

**Origem:** Flávio. **Tema:** educação básica. **Fonte principal:** F, p. 35.

> “Vamos ampliar as Escolas Cívico-Militares”

**Posição de Flávio:** apoio explícito à ampliação. A frase retira as alegações de disciplina e desempenho usadas pelo plano como justificativa.

**Posição de Lula:** posição atual sobre esta redação não encontrada nas fontes consultadas. H1 documenta o encerramento do programa federal em 2023. O ato não estabelece uma proibição de escolas estaduais nem, isoladamente, a posição de campanha em 2026; portanto, não se converte automaticamente em “Lula discorda” no resumo.

**Sobreposição:** baixa. `br2026_provisao_publica_4` trata de financiamento de vagas privadas, e `br2026_direitos_sociais_6` de autorização para conteúdos escolares. Nenhuma delas pergunta sobre o modelo cívico-militar.

**Revisão necessária:** confirmar se o resultado deve exibir o registro histórico em um campo próprio. A pergunta trata do apoio federal ao modelo, e não de transformar todas as escolas ou substituir professores por militares.

## 2. Adesão à OCDE

**ID editorial:** `br2026_star_adesao_ocde`

**Pergunta (rascunho):** O Brasil deve dar continuidade ao processo de adesão à Organização para a Cooperação e Desenvolvimento Econômico (OCDE).

**Versão final:** O Brasil deve buscar se tornar membro da OCDE.

**Origem:** Flávio. **Tema:** política externa. **Fonte principal:** F, p. 63.

> “O passo mais urgente é retomar o cronograma interrompido de adesão à OCDE”

**Posição de Flávio:** apoio explícito à retomada da adesão. A pergunta não afirma que aderir reduz corrupção ou garante investimentos; essas são justificativas do plano.

**Posição de Lula:** posição eleitoral de 2026 sobre esta redação não encontrada nas fontes consultadas. H2 registra exame do processo e cooperação com a organização em 2023. Isso impede tratar a ausência de compromisso no plano como rejeição à OCDE, mas não resolve sua posição atual nem demonstra divergência entre os candidatos.

**Sobreposição:** baixa. `br2026_diplomacia_eleitoral_6` discute compromissos que limitem decisões internas. Aqui, o objeto é a adesão a uma organização determinada; a resposta não deve ser reutilizada para codificar todo compromisso internacional.

**Revisão necessária:** explicar a sigla em uma ajuda curta. Confirmar a posição atual de Lula e avaliar a utilidade comparativa do item antes de fechar a seleção.

## 3. Licença ambiental por decurso do prazo

**ID editorial:** `br2026_star_licenca_prazo`

**Pergunta:** A licença ambiental deve ser concedida se o empreendedor cumprir os requisitos legais e o órgão ambiental não decidir nem se manifestar dentro do prazo.

**Origem:** Flávio. **Tema:** licenciamento ambiental. **Fonte principal:** F, pp. 49–50; condição e consequência na p. 50.

> “Se não decidir nem se manifestar dentro desse prazo, a licença deve ser concedida”

**Posição de Flávio:** apoio explícito ao mecanismo. O parágrafo condiciona a medida ao cumprimento da lei e à apresentação do que a norma exige. Essa condição está preservada na pergunta. “Não decidir nem se manifestar” não é igual a ter indeferido o pedido.

**Posição de Lula:** posição específica sobre concessão da licença pela ausência de manifestação no prazo não encontrada nas fontes consultadas. Compromissos gerais de proteção ambiental nas pp. 69–72 não comprovam oposição a esse mecanismo.

**Sobreposição:** média a alta com `br2026_ambiente_1` e `br2026_ambiente_2`. O quiz já pergunta sobre estudos completos e prazos mais curtos. Este item acrescenta a consequência do silêncio do órgão, sem simplesmente repetir a defesa de rapidez.

**Revisão necessária:** testar a compreensão da condição e do significado do prazo. Não transformar a proposta em afirmação sobre o que a legislação atual já permite; a pergunta é uma escolha de política pública.

## 4. Gestão do ensino superior

**Descartada em 7 de outubro de 2026.**

**ID editorial:** `br2026_star_gestao_ensino_superior`

**Pergunta:** A gestão do ensino superior deve passar do Ministério da Educação para o ministério responsável por ciência, tecnologia e inovação.

**Origem:** Flávio. **Tema:** organização da educação e da pesquisa. **Fonte principal:** F, p. 36.

> “No ensino superior, vamos transferir a governança para o Ministério da Ciência, Tecnologia e Inovações”

**Posição de Flávio:** apoio explícito à transferência da governança. A pergunta não inclui, como um segundo compromisso, as mudanças de critérios para CAPES e CNPq mencionadas no mesmo trecho.

**Posição de Lula:** posição específica sobre essa transferência não encontrada nas fontes consultadas. A defesa de universidades e institutos públicos nas pp. 31–33 não equivale a uma posição sobre qual ministério deve coordená-los.

**Sobreposição:** baixa com `br2026_provisao_publica_5`, que trata da expansão de vagas na rede pública. Transferência de governança não significa privatização nem mudança do número de vagas.

**Revisão necessária:** explicar que se trata da coordenação federal da política de ensino superior. Verificar se “gestão” é entendido como governança da política, sem sugerir a substituição da administração de cada universidade.

## 5. Classificação de facções

**ID editorial:** `br2026_star_classificacao_faccoes`

**Pergunta (rascunho):** As facções criminosas devem ser classificadas como organizações narcoterroristas.

**Versão final:** As facções criminosas devem ser classificadas oficialmente como organizações terroristas.

**Origem:** Flávio. **Tema:** política criminal. **Fonte principal:** F, p. 13.

> “facções serão declaradas como organizações narcoterroristas”

**Posição de Flávio:** apoio explícito à classificação. A redação conserva o termo que define a proposta e elimina nomes de facções e exemplos de violência.

**Posição de Lula:** posição atual sobre a redação exata não estabelecida pelas fontes diretamente conferidas. O plano, pp. 27–28, descreve combate financeiro e legal ao crime organizado, sem declarar a classificação proposta. Isso não prova oposição.

**Pista adicional:** uma busca encontrou uma notícia da Agência Gov de 29 de maio de 2026 sobre oposição à classificação por autoridades dos Estados Unidos. A [página consultada](https://agenciagov.ebc.com.br/noticias/202605/governo-do-brasil-ataca-falsos-patriotas-envolvidos-com-o-crime-que-pedem-intervencao-estrangeira) estava temporariamente indisponível. Além da falta de leitura integral, classificação internacional nos termos de outro país é um objeto diferente. Esse resultado de busca não foi usado para atribuir uma resposta a Lula.

**Sobreposição:** baixa. As seis perguntas de Justiça penal tratam de estudo e trabalho prisional, maioridade, progressão, vagas, penas alternativas e uso da força. Nenhuma trata dessa classificação.

**Revisão necessária:** explicar o objeto da classificação sem apresentar como certas consequências legais ou internacionais que o plano não especifica. Obter fonte acessível e de escopo correspondente se for apresentada uma posição contrária do outro candidato.

## 6. Conteúdo local em datacenters

**ID editorial:** `br2026_star_conteudo_local_datacenters`

**Pergunta:** A instalação de centros de processamento de dados no Brasil deve incluir exigências de conteúdo local.

**Origem:** Lula. **Tema:** política industrial e infraestrutura digital. **Fonte principal:** L, p. 55.

> “a instalação dos datacenters em solo brasileiro deve prever contrapartidas de conteúdo local”

**Posição de Lula:** apoio explícito a contrapartidas de conteúdo local. A pergunta se limita a esse componente; não reúne, na mesma resposta, reserva de capacidade para o mercado interno e exigências energéticas.

**Posição de Flávio:** posição específica sobre a exigência não encontrada nas fontes consultadas. Seu plano, pp. 56–57, apoia produção de tecnologia no Brasil, compras públicas e inovação. Incentivar produção nacional não equivale a exigir conteúdo local em cada instalação, e a defesa de inovação tampouco comprova oposição a tal exigência.

**Sobreposição:** média com `br2026_coordenacao_3` e relação temática com `br2026_coordenacao_5`. A primeira pergunta trata de preferência nacional nas compras governamentais; esta trata de uma condição para instalações privadas de infraestrutura digital. Foi incluído apenas este recorte de conteúdo local, evitando uma segunda pergunta geral com o mesmo tema.

**Revisão necessária:** uma ajuda deve explicar conteúdo local como participação de bens, serviços ou produção do país, sem inventar percentual obrigatório ou exigir que todos os componentes sejam nacionais. Testar a compreensão de “centros de processamento de dados”.

## 7. Regulação de redes sociais

**ID editorial:** `br2026_star_regulacao_redes`

**Pergunta (rascunho):** O governo deve ampliar a regulação das redes sociais sobre a disseminação de desinformação.

**Versão final:** O governo deve ampliar a regulação das redes sociais e das plataformas digitais.

**Origem:** Lula. **Tema:** plataformas digitais. **Fonte principal:** L, p. 16.

> “avançar ainda mais na regulação democrática das redes sociais e das plataformas digitais”

**Posição de Lula:** apoio explícito à ampliação da regulação. O mesmo parágrafo relaciona a proposta à disseminação de desinformação. A pergunta retira a qualificação favorável “democrática” e não acrescenta um modelo de punição ou responsabilização.

**Posição de Flávio:** posição sobre esta redação não estabelecida. Seu plano, pp. 66–67, rejeita estruturas estatais que vigiem, rotulem ou punam manifestações e defende o direito à crítica. Esse texto é relevante, mas não demonstra oposição a toda regulação de redes sociais nem define sua posição sobre todas as formas de desinformação.

**Sobreposição:** baixa. As 72 perguntas atuais não tratam diretamente de moderação ou regulação de plataformas.

**Revisão necessária:** o plano declara a direção da política, mas não especifica o mecanismo regulatório no trecho. Este é o item que mais precisa de teste de compreensão: leitores podem imaginar medidas diferentes. Se não for possível definir um objeto compreendido de forma semelhante, substituir a pergunta, sem completar a proposta com mecanismos inventados.

## 8. Assentamentos da reforma agrária

**ID editorial:** `br2026_star_assentamentos_reforma_agraria`

**Pergunta:** O governo deve continuar assentando famílias acampadas por meio da reforma agrária.

**Origem:** Lula. **Tema:** acesso à terra. **Fonte principal:** L, p. 60.

> “Continuaremos a avançar na política de reforma agrária, assentando as famílias acampadas”

**Posição de Lula:** apoio explícito à continuidade da política de assentamento dessas famílias. A redação não acrescenta desapropriação de toda propriedade, critérios novos de elegibilidade ou apoio a ocupações ilegais.

**Posição de Flávio:** posição específica sobre assentamentos para famílias acampadas não encontrada nas fontes consultadas. O plano, pp. 54–59, trata de produção agropecuária, regularização e combate à ocupação ilegal de terras públicas. Essas propostas não estabelecem oposição à reforma agrária realizada por meios legais.

**Sobreposição:** baixa. Há perguntas sobre exploração de recursos e legislação ambiental, mas nenhuma sobre a política de assentamentos. A pergunta não deve receber automaticamente o polo de uma questão ambiental existente.

**Revisão necessária:** explicar assentamento como política de acesso à terra e diferenciar o tema da autorização de invasões. A posição do outro candidato exige fonte específica.

## 9. Lavanderias públicas

**Descartada em 7 de outubro de 2026.**

**ID editorial:** `br2026_star_lavanderias_publicas`

**Pergunta:** O governo deve apoiar a construção de lavanderias públicas.

**Origem:** Lula. **Tema:** infraestrutura de cuidados. **Fonte principal:** L, p. 26.

> “Fomentaremos a construção de infraestruturas que ampliam os cuidados indiretos e comunitários, como as lavanderias públicas”

**Posição de Lula:** apoio explícito à construção. A pergunta não incorpora a justificativa de reduzir a carga de cuidados das mulheres nem reúne cozinhas e restaurantes em uma única resposta.

**Posição de Flávio:** posição específica sobre lavanderias públicas não encontrada nas fontes consultadas. Seu plano apresenta políticas de apoio às mulheres e às famílias nas pp. 17–23, mas esse apoio geral não permite atribuir concordância com esta infraestrutura específica.

**Sobreposição:** baixa. O eixo Proteção social pergunta sobre benefícios e suas regras; não pergunta sobre esse serviço coletivo.

**Revisão necessária:** explicar o serviço de lavagem de roupas de uso coletivo, sem prometer gratuidade universal, escolher quem pode usá-lo ou definir seu financiamento quando o trecho não traz essas condições. Testar relevância e compreensão junto com os demais temas.

## 10. Câmeras corporais nas polícias

**ID editorial:** `br2026_star_cameras_corporais`

**Pergunta:** O governo federal deve ampliar os incentivos para o uso de câmeras corporais pelas polícias.

**Origem:** Lula. **Tema:** atuação policial. **Fonte principal:** L, p. 30.

> “Ampliaremos o programa de estímulos para uso de câmeras corporais”

**Posição de Lula:** apoio explícito à ampliação do programa. O plano também prevê padrões nacionais para utilização e preservação das imagens. A pergunta conserva o caráter de estímulo; não o transforma em obrigação de uso permanente por todo policial.

**Posição de Flávio:** posição específica sobre os incentivos a câmeras corporais não encontrada nas fontes consultadas. A defesa de valorização policial, p. 13, não é evidência suficiente de oposição ao equipamento.

**Sobreposição:** média com `br2026_justica_penal_6`, sobre autonomia e regras federais para uso da força. O instrumento aqui é específico e voluntariamente incentivado; as respostas não são intercambiáveis.

**Revisão necessária:** distinguir incentivo federal de imposição obrigatória. Os padrões nacionais podem aparecer na ajuda como contexto do plano, sem acrescentar uma segunda pergunta sobre regras de operação.

## Uso previsto no resultado

Para o candidato que apoia explicitamente a proposta:

- Se o usuário escolher “concordo” ou “concordo totalmente”, mostrar **concordância com a proposta**.
- Se escolher “discordo” ou “discordo totalmente”, mostrar **discordância com a proposta**.
- Se escolher “neutro ou depende”, mostrar **neutralidade/depende**, sem transformá-la em discordância.

Exemplo: “★ Você discorda de ampliar as escolas cívico-militares. O plano de Flávio propõe a ampliação (p. 35).” A comparação é sobre essa proposta; não sobre concordar ou discordar do candidato em geral. Para o outro candidato, a informação atual deste levantamento é “posição não encontrada nas fontes consultadas”. Histórico, apoio condicionado e contexto relacionado precisam de rótulos próprios.

Diferenças de intensidade entre duas respostas favoráveis, ou entre duas contrárias, não são divergências de direção. As dez propostas não entram na nota dos 12 eixos. A classificação acima é uma recomendação para a implementação posterior, e não uma alteração no cálculo existente.

## Pontos para decidir na revisão

1. Confirmar a relevância dos dez temas e testar os textos sem identificar o candidato de origem. A quantidade de propostas de cada candidato não substitui o exame de equilíbrio temático.
2. Examinar a pergunta 7 primeiro, pelo risco de interpretações diferentes. Avaliar também as sobreposições dos itens 3, 6 e 10.
3. Buscar fontes específicas para a posição atual do outro candidato. Quando não houver evidência suficiente, preservar o estado desconhecido; não fabricar uma resposta para fechar uma comparação.
4. Testar a distinção entre posição atual, registro histórico e proposta relacionada. O encerramento do programa federal em 2023 e a cooperação com a OCDE naquele ano não viram, automaticamente, respostas de campanha de 2026.
5. Exibir o bloco ★ depois das perguntas dos eixos, com possibilidade de pular. Com dez extras, os totais apresentados ao usuário seriam 36 + 10, 60 + 10 e 72 + 10, antes de iniciar o quiz.
6. Manter uma versão própria para a seleção, redação e evidência dessas propostas. Alterações desse bloco não exigem modificar o modelo de pontuação se continuarem fora das notas dos eixos.

## Integridade das fontes locais

Os identificadores SHA-256 abaixo permitem repetir a conferência nesta mesma versão dos arquivos; não são uma verificação de autoria ou de protocolo eleitoral.

- F: `7d1d95075e11e3c4113e8dcd502438049a34f5147a84cb0f746bf59046e477a4`.
- L: `e1c162c20c81dafadf69b10bab230b5a6dc48f6b6c27c2cfce853b131a8bcc36`.

As dez citações principais foram conferidas no texto das páginas indicadas. A análise de sobreposição usa as 72 perguntas presentes em `backend/data/elections/brazil-2026.json` nesta data.
