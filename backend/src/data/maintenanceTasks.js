'use strict';

const MAINTENANCE_TASKS = [
  // ─── DIÁRIO ───────────────────────────────────────────────
  {
    frequency: 'DAILY',
    category: 'Geral',
    order: 1,
    title: 'Arejar o apartamento',
    description: 'Abra janelas e portas por 5–10 minutos para gerar circulação de ar. Faça isso 1–2 vezes ao dia. Ao arejar, reduza o termostato do piso radiante para economizar energia. Evite deixar janelas entreabertas por longos períodos — prefira arejamentos curtos e intensos.',
  },
  {
    frequency: 'DAILY',
    category: 'Cozinha',
    order: 2,
    title: 'Ligar a emhætte ao cozinhar',
    description: 'Sempre ligue a emhætte (coifa) ao cozinhar, especialmente ao fritar ou ferver. Se possível, abra também uma janela para evitar pressão negativa no apartamento. Isso reduz partículas, gordura e umidade que podem causar mofo nos armários.',
  },
  {
    frequency: 'DAILY',
    category: 'Banheiro',
    order: 3,
    title: 'Enxugar a borracha da máquina de lavar',
    description: 'Após cada lavagem, abra a porta da vaskemaskine e seque a vedação de borracha (gummipakning) com um pano seco. Isso evita mofo e mau cheiro. Deixe a porta entreaberta entre as lavagens.',
  },

  // ─── SEMANAL ──────────────────────────────────────────────
  {
    frequency: 'WEEKLY',
    category: 'Banheiro',
    order: 1,
    title: 'Limpar o ralo do chuveiro',
    description: 'Remova a grade do ralo (gulvrist) e levante o sifão (vandlås). Limpe com produto adequado, verifique se a borracha do sifão está lubrificada com glidemiddel. Recoloque e teste o escoamento. Se sentir mau cheiro sem entupimento, despeje 1–2 baldes de água quente no ralo uma vez por semana.',
  },
  {
    frequency: 'WEEKLY',
    category: 'Geral',
    order: 2,
    title: 'Limpar superfícies e termostatos',
    description: 'Passe um pano levemente úmido nos termostatos Danfoss de cada cômodo. Use apenas produto suave — nunca abrasivos, álcool ou cloro. Mantenha as portas dos cômodos fechadas para o termostato funcionar corretamente.',
  },

  // ─── MENSAL ───────────────────────────────────────────────
  {
    frequency: 'MONTHLY',
    category: 'Cozinha',
    order: 1,
    title: 'Limpar o filtro de gordura da emhætte',
    description: 'Remova o fedtfilter (filtro metálico) da coifa. Lave na lavavajillas (máx. 55°C) ou à mão com água quente e detergente, usando uma escova. Deixe secar completamente antes de recolocar. Pode ocorrer leve descoloração — é normal e não afeta o funcionamento.',
  },
  {
    frequency: 'MONTHLY',
    category: 'Eletrodomésticos',
    order: 2,
    title: 'Testar o røgalarm (detector de fumaça)',
    description: 'Pressione e segure o botão de teste do røgalarm até ouvir o bip alto. A luz deve ficar vermelha durante o teste e voltar ao verde. Se piscar vermelho fora do teste, o sensor precisa de atenção. Teste obrigatório no mínimo 1x por mês.',
  },
  {
    frequency: 'MONTHLY',
    category: 'Eletrodomésticos',
    order: 3,
    title: 'Limpar a sæbeskuffe da máquina de lavar',
    description: 'Pressione a trava e remova a gaveta de sabão (sæbeskuffe). Lave em água corrente com uma escova pequena, removendo resíduos do compartimento na máquina também. Recoloque e certifique que encaixou. Faça isso pelo menos 2x por mês.',
  },
  {
    frequency: 'MONTHLY',
    category: 'Eletrodomésticos',
    order: 4,
    title: 'Limpar o pumpefilter da máquina de lavar',
    description: 'Coloque um pano absorvente no chão. Abra a tampa do filtro com uma chave de fenda plana. Remova o tubo de escoamento e drene a água. Gire o filtro no sentido anti-horário e retire. Enxague em água corrente. Limpe o interior e a hélice. Recoloque e aperte no sentido horário. Verifique se a vedação está limpa.',
  },
  {
    frequency: 'MONTHLY',
    category: 'Eletrodomésticos',
    order: 5,
    title: 'Rodar o Drum Clean (autolimpeza da máquina de lavar)',
    description: 'Com a tromla vazia (sem roupas), selecione o programa "Drum Clean" (Sevrenseprogrammet). Adicione 2 dl de vinagre ou 1 colher de sopa de bicarbonato — não use sabão. Execute o programa completo. Recomendado 1x por mês para remover resíduos, bactérias e pelo de animais.',
  },
  {
    frequency: 'MONTHLY',
    category: 'Geral',
    order: 6,
    title: 'Inspecionar o teknikskab (armário técnico)',
    description: 'Abra o armário técnico e verifique visualmente se há sinais de vazamento em alguma das instalações (tubos, conexões). O teknikskab não deve ser usado para armazenar objetos. Se a fugtalarm (alarme de umidade) estiver apitando, contate o síndico imediatamente.',
  },
  {
    frequency: 'MONTHLY',
    category: 'Lavavajillas',
    order: 7,
    title: 'Verificar sal e brilhante da lavavajillas',
    description: 'Verifique os indicadores no painel da opvaskemaskine (lavavajillas). Se o ícone de sal ou de brilhante (afspænding) estiver aceso, reponha. Ajuste a dureza da água conforme as instruções do manual. Nunca abra a máquina antes de terminar o programa de secagem.',
  },

  // ─── SEMESTRAL ────────────────────────────────────────────
  {
    frequency: 'SEMESTRAL',
    category: 'Elétrico',
    order: 1,
    title: 'Testar o HPFI-afbryder (disjuntor diferencial)',
    description: 'No quadro elétrico (teknikskab), pressione o botão "T" do HPFI-afbryder. Ele deve desligar toda a energia do apartamento. Se não desligar, chame um eletricista imediatamente. Para religar, empurre o disjuntor para cima. Teste obrigatório mínimo 4x por ano (a cada 3 meses).',
  },
  {
    frequency: 'SEMESTRAL',
    category: 'Geral',
    order: 2,
    title: 'Lubrificar dobradiças e ferragens',
    description: 'Aplique óleo sem ácido (syrefri smøreolie) ou produto tipo Dinitrol 4010 / Castrol DW 33 nas partes móveis das janelas, portas e ferragens. Para o alumínio exterior das janelas, limpe e proteja a superfície. Faça isso pelo menos 2x por ano, idealmente na primavera e no outono.',
  },
  {
    frequency: 'SEMESTRAL',
    category: 'Eletrodomésticos',
    order: 3,
    title: 'Limpar filtro da mangueira da máquina de lavar',
    description: 'Feche o registro de água. Desconecte a tilslutningsslange (mangueira de entrada). Retire o filtro de tela (trådfilter) da ponta da mangueira e enxague várias vezes em água corrente. Recoloque e reconecte. Abra o registro e verifique se não há vazamento.',
  },
  {
    frequency: 'SEMESTRAL',
    category: 'Cozinha',
    order: 4,
    title: 'Limpeza profunda da geladeira',
    description: 'Retire todos os alimentos e compartimentos removíveis. Limpe o interior com água morna e pano macio — nunca use abrasivos. Verifique se o ralo de degelo (tøvandsafløb) no fundo não está entupido; limpe se necessário. NÃO bloqueie as frestas de ventilação acima e abaixo do equipamento.',
  },

  // ─── ANUAL ────────────────────────────────────────────────
  {
    frequency: 'YEARLY',
    category: 'Geral',
    order: 1,
    title: 'Limpeza profunda dos pisos de madeira',
    description: 'Use apenas pano bem torcido (nunca jogue água no piso). Aplique Parador Parketvask na proporção 50–100 ml para 8–10 litros de água morna. Para manutenção preventiva, aplique Parador Parketpleje. Nunca use produtos abrasivos ou rodos molhados. Verifique se a umidade do ambiente está entre 50–65%.',
  },
  {
    frequency: 'YEARLY',
    category: 'Eletrodomésticos',
    order: 2,
    title: 'Limpeza por pirólise do forno',
    description: 'Retire TUDO do interior do forno (grelhas, assadeiras, etc.). Ative o programa de pirólise conforme o manual Gorenje. O forno aquece a temperaturas muito altas para incinerar resíduos — não abra durante o processo. Após esfriar, limpe as cinzas com pano úmido. Nunca use produtos abrasivos ou objetos cortantes no interior.',
  },
  {
    frequency: 'YEARLY',
    category: 'Geral',
    order: 3,
    title: 'Verificar janelas e vedações',
    description: 'Inspecione as listas de vedação (tætningslister), bandas de vidro (glasbånd) e perfis de vidro (glaslister) de todas as janelas. Limpe com pano umedecido em água limpa com leve detergente suave. Verifique se há danos na pintura dos caixilhos — reparos devem ser acordados com o proprietário.',
  },
];

module.exports = MAINTENANCE_TASKS;
