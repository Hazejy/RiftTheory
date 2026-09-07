// Definitions follow the user-supplied historical community sheet.
// Advantage/risk/check fields are conditional RiftTheory coaching interpretations,
// not a verified counter matrix or current champion classifications.
const en = {
    title: "Draft with a plan",
    intro: "Start with what your team needs to do, then ask whether the opponent can stop it. Colors describe that plan — they do not decide the winner.",
    definition: "Sheet definition · paraphrased",
    application: "Draft application · RiftTheory interpretation",
    signalsTitle: "Signals to look for",
    notEnoughTitle: "Not enough by itself",
    advantage: "Strength / what it can punish",
    risk: "Weakness / opposing answer",
    check: "Before you lock it in",
    mainOff:
        "X · Main: the theme best expressed by the champion’s kit, core items, team interactions and scaling numbers. O · Off: a theme influenced by alternative item builds, playstyle or matchup. Off is conditional, not a second plan that is always active.",
    exampleTitle: "Same color, different reach",
    example:
        "The old sheet marks both Anivia and Xerath as Blue. That does not settle their interaction: if Xerath can pressure Anivia’s approach without entering her effective zone, wave clear alone will not guarantee safe access. Allied engage, cover and positioning can change that situation. This is a scenario to assess, not an automatic matchup verdict.",
    checklistTitle: "Check the whole draft",
    checklist: [
        "Timing: when is our plan strong, and what can we give up before then?",
        "Access: can our damage and control actually reach the relevant targets?",
        "Setup: who provides vision, wave control, frontline or follow-up?",
        "Counterplay: what is the enemy’s best answer, and what is our fallback?",
    ],
    colors: {
        red: {
            identity:
                "Aggressive, fast and often linear. Red usually creates resources early or mid game and must keep converting them; being even or behind can remove its fuel. Not every aggressive champion is automatically Red.",
            signals: [
                "Early lane or jungle pressure that must become resources",
                "Direct target access, forced fights, resets or takedown chains",
                "Power that accelerates while ahead and drops sharply when stalled",
            ],
            notEnough:
                "One engage spell or high damage is not sufficient. Red must describe how the champion repeatedly creates and converts proactive tempo.",
            advantage:
                "Can punish a slow setup if lane pressure and follow-up let you turn early openings into durable resources.",
            risk: "Stalled pressure is costly. Disengage, safe wave control or defensive cover may deny the plays your plan needs — if the opponent can survive and execute them.",
            check: "Which lane creates the first opening? How do we convert it, and what do we do if the first play fails?",
        },
        green: {
            identity:
                "Harmony, synergy and curved power timings. Green becomes more than the sum of its parts through allies, levels or core items and is often weaker as an isolated plan. It is especially comfortable in coordinated wars of attrition.",
            signals: [
                "Abilities that amplify or become stronger through allies",
                "Clear item, level or shared composition power windows",
                "Sustained fights where several pieces repeatedly enable each other",
            ],
            notEnough:
                "Scaling alone is not enough. Green needs a meaningful synergy, dependency or coordinated timing that changes how the draft functions.",
            advantage:
                "Can reward coordinated spikes and repeated fights when allies enable each other. May punish an opponent unable to interrupt those timings or sustained interactions.",
            risk: "Separated allies, denied resources or fights before key items can break the plan. A supported carry still needs access to a useful target.",
            check: "Which allies and items make this work? Can we reach that timing together without conceding too much?",
        },
        blue: {
            identity:
                "Knowledge, control, manipulation, deception and denial. Blue manages resources, evades interaction and can use controlled speed or terrain warping to reshape the game. It is often merely stable early and much stronger later, winning by depleting enemy options; inaction can be useful action.",
            signals: [
                "Range, zones, vision, information or terrain that restrict choices",
                "Evasion, deception or speed used to decide when interaction occurs",
                "Resource superiority and scaling that reward delaying commitment",
            ],
            notEnough:
                "Wave clear, range or late scaling alone is not enough. The champion must actually control access, information, resources or the opponent's available actions.",
            advantage:
                "Can punish predictable approaches if zones, range or defensive tools deny entry and the team can convert the time gained.",
            risk: "A zone is not control over the entire map. Longer reach, multiple entry angles or side-lane pressure may bypass it. Waiting is not winning if the enemy benefits more.",
            check: "What forces the enemy into our effective range? Can we contest space if we arrive second?",
        },
        white: {
            identity:
                "Versatile and often supportive: a Jack of all trades that blends into other colors and preserves draft options. White may fill several roles in draft but usually makes a binary 'choose one' commitment through role, build or ability use in game. Its defensive modes can resist early Red pressure.",
            signals: [
                "Real role, build or function flexibility during the draft",
                "Protection, peel or utility that fills a missing team requirement",
                "A meaningful choice between modes that cannot all be active together",
            ],
            notEnough:
                "Having many abilities is not enough. White must cover genuinely different draft functions or adapt coherently to another color's plan.",
            advantage:
                "Can fill a missing function and preserve options. Defensive tools may resist an early Red plan when they actually cover its threat.",
            risk: "Flexibility is not every build at once. After choosing a role and build, the opponent can attack the function you did not bring.",
            check: "Which mode are we choosing here? Does the rest of the draft still work once the other options are unavailable?",
        },
        black: {
            identity:
                "Power at a cost, through a quest or behind a demand that must be met. Black accepts tradeoffs, restrictions, sacrifice or explicit conditions for disproportionate payoff and often accelerates what another color wants to do.",
            signals: [
                "Health, safety, position or control sacrificed for power",
                "Stacks, takedowns, marks, transformations or quests gating payoff",
                "A narrow condition that allies can enable and enemies can deny",
            ],
            notEnough:
                "Ordinary mana costs and cooldowns are not Black. The cost or condition must materially alter the champion's plan, risk or payoff.",
            advantage:
                "Can provide a valuable payoff when the team reliably enables the exact condition and the opponent cannot deny it cheaply.",
            risk: "The opponent can target that requirement. No universal color counter follows: identify the actual resource, target, combo or setup being denied.",
            check: "State the condition and its cost. How do we enable it, and what remains if it never happens?",
        },
        colorless: {
            identity:
                "A dedicated theme that is exceptionally strong inside its intended structure and causes the surrounding draft to form around it. Colorless is not unknown, neutral or missing data.",
            signals: [
                "A specific pairing, engine or theme required to unlock the plan",
                "Teammates selected mainly to support one specialized interaction",
                "High payoff inside the theme with sharply reduced alternatives outside it",
            ],
            notEnough:
                "An unusual mechanic is not automatically Colorless. The theme must meaningfully narrow or warp the draft around its required pieces.",
            advantage:
                "Can create a focused plan when the necessary pieces fit and the opponent lacks an effective answer to that specific theme.",
            risk: "Specialization may narrow your fallback options. Denying an enabling pick or avoiding the intended interaction can expose that dependence.",
            check: "Name the theme and its required pieces. What is our fallback if one is banned or its interaction is denied?",
        },
    },
};

type Guide = typeof en;

const ko: Guide = {
    title: "계획을 세우고 드래프트하세요",
    intro: "우리 팀이 해야 할 일을 정한 뒤 상대가 그것을 막을 수 있는지 확인하세요. 색상은 계획을 설명할 뿐 승자를 결정하지 않습니다.",
    definition: "시트 정의 · 요약",
    application: "드래프트 적용 · RiftTheory 해석",
    signalsTitle: "확인할 신호",
    notEnoughTitle: "이것만으로는 부족함",
    advantage: "강점 / 공략할 수 있는 상황",
    risk: "약점 / 상대의 대응",
    check: "선택하기 전에",
    mainOff:
        "X · 주 색상: 챔피언의 스킬, 핵심 아이템, 팀 상호작용과 성장 수치에서 가장 잘 드러나는 테마입니다. O · 보조 색상: 다른 아이템 빌드, 플레이 방식 또는 상성에 따라 나타나는 테마입니다. 보조 색상은 항상 활성화된 두 번째 계획이 아니라 조건부입니다.",
    exampleTitle: "같은 색상, 다른 사거리",
    example:
        "이전 시트에서는 애니비아와 제라스를 모두 청색으로 분류합니다. 하지만 이것만으로 상성이 결정되지는 않습니다. 제라스가 애니비아의 유효 범위 밖에서 접근을 압박할 수 있다면 라인 클리어 능력만으로 안전하게 접근할 수 없습니다. 아군의 진입, 엄호와 위치 선정이 상황을 바꿀 수 있습니다. 검토할 상황이지 확정적인 상성 판정은 아닙니다.",
    checklistTitle: "조합 전체를 확인하세요",
    checklist: [
        "타이밍: 언제 강해지며 그전까지 무엇을 내줄 수 있나요?",
        "접근: 피해와 제어 수단이 필요한 대상에게 실제로 닿나요?",
        "준비: 누가 시야, 라인 관리, 전방 유지와 후속 행동을 담당하나요?",
        "대응: 상대의 최선의 답은 무엇이며 우리의 대안은 무엇인가요?",
    ],
    colors: {
        red: {
            identity:
                "공격적이고 빠르며 흔히 직선적입니다. 초중반에 자원을 만들고 계속 전환해야 하며, 동등하거나 뒤처지면 연료를 잃을 수 있습니다. 공격적인 챔피언이 모두 적색인 것은 아닙니다.",
            signals: [
                "자원으로 전환해야 하는 초반 라인 또는 정글 압박",
                "직접 진입, 강제 교전, 초기화 또는 연속 처치",
                "앞설수록 가속되고 정체되면 급격히 약해지는 힘",
            ],
            notEnough:
                "진입기 하나나 높은 피해량만으로는 부족합니다. 주도권을 반복해서 만들고 전환하는 방식이 핵심이어야 합니다.",
            advantage:
                "라인 압박과 후속 행동으로 초반 기회를 지속적인 자원 이득으로 바꿀 수 있다면 느린 준비를 공략할 수 있습니다.",
            risk: "압박이 멈추면 손해가 큽니다. 상대가 생존하고 실행할 수 있다면 교전 회피, 안전한 라인 관리와 엄호가 필요한 플레이를 차단할 수 있습니다.",
            check: "어느 라인에서 첫 기회를 만드나요? 어떻게 이득으로 전환하며 첫 시도가 실패하면 무엇을 하나요?",
        },
        green: {
            identity:
                "조화, 시너지와 곡선형 강세 타이밍입니다. 아군, 레벨 또는 핵심 아이템을 통해 각 요소의 합보다 강해지며 혼자서는 약한 경우가 많습니다. 조직적인 장기전에 강합니다.",
            signals: [
                "아군을 강화하거나 아군과 함께 더 강해지는 스킬",
                "명확한 아이템, 레벨 또는 조합 공동 강세 구간",
                "여러 요소가 반복해서 서로를 돕는 지속 교전",
            ],
            notEnough:
                "성장만으로는 부족합니다. 드래프트 방식을 바꾸는 실제 시너지, 의존성 또는 공동 타이밍이 필요합니다.",
            advantage:
                "아군이 서로를 강화하면 맞춰진 성장 타이밍과 반복 교전이 유리할 수 있습니다. 이를 방해하지 못하는 상대를 공략합니다.",
            risk: "아군 분리, 자원 차단, 핵심 아이템 전 교전은 계획을 무너뜨릴 수 있습니다. 지원받는 캐리도 유효한 대상에게 접근해야 합니다.",
            check: "어떤 아군과 아이템이 필요한가요? 너무 많은 것을 내주지 않고 함께 그 시점에 도달할 수 있나요?",
        },
        blue: {
            identity:
                "지식, 통제, 조작, 기만과 차단입니다. 자원을 관리하고 교전을 회피하며 통제된 속도나 지형 변형으로 게임을 재구성합니다. 초반은 안정적일 뿐이어도 후반에 강해지고 상대 선택지를 소진시켜 이깁니다.",
            signals: [
                "선택지를 제한하는 사거리, 영역, 시야, 정보 또는 지형",
                "교전 시점을 정하는 회피, 기만 또는 통제된 속도",
                "결정을 늦출수록 보상받는 자원 우위와 성장",
            ],
            notEnough:
                "라인 클리어, 사거리 또는 후반 성장만으로는 부족합니다. 접근, 정보, 자원이나 상대 행동을 실제로 통제해야 합니다.",
            advantage:
                "영역, 사거리나 방어 수단으로 진입을 막고 번 시간을 활용할 수 있다면 예측 가능한 접근을 공략할 수 있습니다.",
            risk: "한 구역을 장악해도 맵 전체를 통제하는 것은 아닙니다. 긴 사거리, 여러 진입 각도나 사이드 압박이 우회할 수 있습니다. 상대가 더 이득이면 기다림은 승리가 아닙니다.",
            check: "무엇이 상대를 우리 유효 사거리로 들어오게 하나요? 늦게 도착해도 공간을 다툴 수 있나요?",
        },
        white: {
            identity:
                "다재다능하고 주로 지원적인 만능형으로 다른 색상과 쉽게 섞이며 드래프트 선택지를 보존합니다. 드래프트에서는 여러 역할을 채워도 게임에서는 역할, 빌드 또는 사용 방식 중 하나를 선택하는 경우가 많습니다.",
            signals: [
                "드래프트에서 실제로 가능한 역할, 빌드 또는 기능 전환",
                "팀의 부족한 기능을 채우는 보호, 견제 또는 유틸리티",
                "동시에 사용할 수 없는 의미 있는 모드 선택",
            ],
            notEnough:
                "스킬이 많다는 사실만으로는 부족합니다. 서로 다른 드래프트 기능을 실제로 수행하거나 다른 색상의 계획에 맞게 적응해야 합니다.",
            advantage:
                "부족한 역할을 채우고 선택지를 유지할 수 있습니다. 방어 수단이 실제 위협을 막는다면 초반 적색 계획에 저항할 수 있습니다.",
            risk: "유연성이 모든 빌드의 동시 사용을 뜻하지는 않습니다. 포지션과 빌드를 정하면 상대는 가져오지 않은 기능을 공략할 수 있습니다.",
            check: "어떤 방식을 선택하나요? 다른 선택지가 사라져도 조합이 작동하나요?",
        },
        black: {
            identity:
                "비용, 퀘스트 또는 충족해야 하는 요구 뒤에 있는 힘입니다. 큰 보상을 위해 교환, 제한, 희생이나 명시적 조건을 받아들이며 다른 색상의 계획을 가속하기도 합니다.",
            signals: [
                "힘을 위해 체력, 안전, 위치 또는 통제권을 희생",
                "보상을 잠그는 중첩, 처치, 표식, 변신 또는 퀘스트",
                "아군이 돕고 상대가 방해할 수 있는 구체적인 조건",
            ],
            notEnough:
                "일반적인 마나 비용과 재사용 대기시간은 흑색이 아닙니다. 비용이나 조건이 계획, 위험 또는 보상을 실질적으로 바꿔야 합니다.",
            advantage:
                "팀이 정확한 조건을 안정적으로 충족하고 상대가 쉽게 막지 못한다면 큰 보상을 얻을 수 있습니다.",
            risk: "상대는 그 조건을 방해할 수 있습니다. 보편적인 색상 카운터가 아니라 어떤 자원, 대상, 콤보나 준비가 차단되는지 확인하세요.",
            check: "조건과 비용은 무엇인가요? 어떻게 충족하며 끝내 충족하지 못하면 무엇이 남나요?",
        },
        colorless: {
            identity:
                "의도된 구조 안에서 매우 강하고 주변 드래프트를 그 테마에 맞추게 하는 전용 전략입니다. 무색은 미확인, 중립 또는 데이터 없음이 아닙니다.",
            signals: [
                "계획을 여는 특정 조합, 엔진 또는 테마",
                "하나의 특수 상호작용을 위해 선택되는 팀원",
                "테마 안에서는 높은 보상, 밖에서는 크게 줄어드는 대안",
            ],
            notEnough:
                "특이한 메커니즘만으로는 무색이 아닙니다. 필요한 요소 때문에 드래프트가 실제로 좁아지거나 변형되어야 합니다.",
            advantage:
                "필요한 요소가 맞물리고 상대가 그 테마에 효과적으로 대응하지 못하면 집중된 계획을 만들 수 있습니다.",
            risk: "특화는 대안을 줄일 수 있습니다. 핵심 선택을 금지하거나 의도한 상호작용을 피하면 의존성이 드러날 수 있습니다.",
            check: "테마와 필수 요소는 무엇인가요? 하나가 금지되거나 상호작용이 막히면 대안이 있나요?",
        },
    },
};

const zh: Guide = {
    title: "带着计划选人",
    intro: "先确定队伍需要做什么，再判断对手能否阻止。颜色用于描述计划，不决定胜负。",
    definition: "表格定义 · 概述",
    application: "选人应用 · RiftTheory 解读",
    signalsTitle: "判断信号",
    notEnoughTitle: "单独不足以判定",
    advantage: "优势 / 可针对的情况",
    risk: "弱点 / 对手的应对",
    check: "锁定前确认",
    mainOff:
        "X · 主色：英雄的技能组、核心装备、团队互动与成长数值最能体现的主题。O · 副色：受不同出装、玩法或对局影响的主题。副色是有条件的，并非始终同时生效的第二套计划。",
    exampleTitle: "相同颜色，不同射程",
    example:
        "旧表格将艾尼维亚和泽拉斯都归为蓝色，但这不能决定他们的对抗。如果泽拉斯能在艾尼维亚的有效区域外压制其接近，仅有清线能力并不保证安全接近兵线。队友的开团、掩护与站位可能改变局面。这是待分析的情景，不是自动判定的克制关系。",
    checklistTitle: "检查整个阵容",
    checklist: [
        "时机：计划何时强势，此前可以让出哪些资源？",
        "接近：伤害和控制能否真正作用于关键目标？",
        "准备：谁负责视野、兵线、前排与后续配合？",
        "应对：对手最好的解法是什么，我们有什么备选方案？",
    ],
    colors: {
        red: {
            identity:
                "激进、快速且通常路线直接。红色常在前中期创造资源并持续兑现；均势或落后时可能失去燃料。并非所有进攻型英雄都是红色。",
            signals: [
                "必须转化为资源的早期对线或野区压力",
                "直接接近目标、强开、刷新或连续击杀",
                "领先时加速、停滞时明显衰减的力量",
            ],
            notEnough:
                "一个开团技能或高伤害并不足够；英雄必须持续主动创造并兑现节奏。",
            advantage:
                "若线权与后续配合能将早期机会转化为持久资源优势，就能针对准备较慢的计划。",
            risk: "压迫停滞代价较大。若对手能存活并执行，拉开、稳健控线或防守掩护可能阻止你必须打出的行动。",
            check: "哪条线创造第一个机会？如何兑现？第一波失败后怎么办？",
        },
        green: {
            identity:
                "和谐、协同与曲线型强势期。绿色借助队友、等级或核心装备形成大于各部分之和的力量，单独运作往往较弱，并擅长有组织的消耗战。",
            signals: [
                "强化队友或与队友配合后明显增强的技能",
                "清晰的装备、等级或团队共同强势节点",
                "多个组件持续互相赋能的长时间交战",
            ],
            notEnough:
                "仅有后期成长并不足够；必须存在会改变选人结构的实际协同、依赖或共同时间点。",
            advantage:
                "相互赋能可在同步强势期和连续交战中获益，并针对无法打断这些时机或持续配合的对手。",
            risk: "分割队友、限制资源或在关键装备前开战可能破坏计划。被保护的核心仍需接近有价值的目标。",
            check: "需要哪些队友与装备？能否在不过度让出资源的情况下共同到达强势期？",
        },
        blue: {
            identity:
                "知识、控制、操纵、欺骗与限制。蓝色管理资源、规避互动，并以受控速度或地形改造重塑局面。它常在前期仅稳定、后期显著增强，通过耗尽对手选择获胜；不行动也可以是有效行动。",
            signals: [
                "用射程、区域、视野、信息或地形限制选择",
                "通过规避、欺骗或受控速度决定何时交互",
                "推迟承诺后获得回报的资源优势与成长",
            ],
            notEnough:
                "清线、射程或后期成长本身并不足够；必须真正控制接近方式、信息、资源或对手行动。",
            advantage:
                "若区域、射程或防守手段能阻止进入，且队伍能利用争取的时间，就可针对可预测的接近路线。",
            risk: "控制一个区域不等于控制全图。更长射程、多角度进场或边线压力可能绕过它。若对方收益更大，等待就不等于赢。",
            check: "什么迫使对手进入我们的有效射程？晚到时还能争夺空间吗？",
        },
        white: {
            identity:
                "多功能且通常偏辅助，是容易融入其他颜色的万金油，并保留选人选择。白色在选人时可以覆盖多种职责，但游戏内通常要通过位置、出装或技能使用作出一次模式选择。",
            signals: [
                "选人阶段真实可行的位置、出装或功能摇摆",
                "补足团队缺口的保护、反开或功能性",
                "无法同时启用的、有实际意义的模式选择",
            ],
            notEnough:
                "技能数量多并不足够；必须真正覆盖不同选人功能，或能合理适配另一颜色的计划。",
            advantage:
                "可补足功能并保留选择。当防守工具确实覆盖威胁时，可能抵抗红色的早期计划。",
            risk: "灵活不代表同时拥有所有出装。分路和出装确定后，对手可以针对你没有带来的功能。",
            check: "本局选择哪种模式？放弃其他选项后，整体阵容是否仍然成立？",
        },
        black: {
            identity:
                "力量来自代价、任务或必须满足的要求。黑色以交换、限制、牺牲或明确条件换取超额回报，并常用于加速其他颜色的计划。",
            signals: [
                "为力量牺牲生命、安全、位置或控制权",
                "以层数、击杀、标记、变形或任务锁定回报",
                "队友可以协助、对手可以阻止的具体条件",
            ],
            notEnough:
                "普通法力消耗与冷却不是黑色；代价或条件必须实质改变计划、风险或回报。",
            advantage:
                "若团队能稳定满足具体条件，且对手无法低成本破坏，就能获得有价值的回报。",
            risk: "对手可针对条件本身。不存在由此推导出的通用颜色克制；应明确被限制的是资源、目标、连招还是准备。",
            check: "条件和代价是什么？如何满足？若始终未达成，还剩哪些作用？",
        },
        colorless: {
            identity:
                "在指定结构中格外强大，并迫使周围选人围绕其构建的专门主题。无色不代表未知、中立或缺少数据。",
            signals: [
                "开启计划所必需的特定搭配、引擎或主题",
                "主要为支持一个特殊互动而选择的队友",
                "主题内回报很高、主题外备选明显减少",
            ],
            notEnough:
                "独特机制不会自动成为无色；所需组件必须真正收窄或重塑整个选人。",
            advantage:
                "必要组件契合，且对手缺少对该主题的有效应对时，可以形成集中的计划。",
            risk: "专精可能缩小备选空间。禁掉关键组件或避开预期互动，可能暴露这种依赖。",
            check: "主题和必需组件是什么？组件被禁或互动被阻止时，有什么备选计划？",
        },
    },
};

export const COLOR_GUIDE = { en_US: en, ko_KR: ko, zh_CN: zh };
