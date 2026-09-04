// Definitions follow the user-supplied historical community sheet.
// Advantage/risk/check fields are conditional RiftTheory coaching interpretations,
// not a verified counter matrix or current champion classifications.
const en = {
    title: "Draft with a plan",
    intro: "Start with what your team needs to do, then ask whether the opponent can stop it. Colors describe that plan — they do not decide the winner.",
    definition: "Sheet definition · paraphrased",
    application: "Draft application · RiftTheory interpretation",
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
                "Early aggression and snowballing; needs continued conversion and can lose momentum.",
            advantage:
                "Can punish a slow setup if lane pressure and follow-up let you turn early openings into durable resources.",
            risk: "Stalled pressure is costly. Disengage, safe wave control or defensive cover may deny the plays your plan needs — if the opponent can survive and execute them.",
            check: "Which lane creates the first opening? How do we convert it, and what do we do if the first play fails?",
        },
        green: {
            identity:
                "Synergy, shared power windows and item timings; value often depends on others.",
            advantage:
                "Can reward coordinated spikes and repeated fights when allies enable each other. May punish an opponent unable to interrupt those timings or sustained interactions.",
            risk: "Separated allies, denied resources or fights before key items can break the plan. A supported carry still needs access to a useful target.",
            check: "Which allies and items make this work? Can we reach that timing together without conceding too much?",
        },
        blue: {
            identity:
                "Control, denial and resource management; often seeks time and fewer enemy options.",
            advantage:
                "Can punish predictable approaches if zones, range or defensive tools deny entry and the team can convert the time gained.",
            risk: "A zone is not control over the entire map. Longer reach, multiple entry angles or side-lane pressure may bypass it. Waiting is not winning if the enemy benefits more.",
            check: "What forces the enemy into our effective range? Can we contest space if we arrive second?",
        },
        white: {
            identity:
                "Draft flexibility, often supportive; usually commits to one mode during the game.",
            advantage:
                "Can fill a missing function and preserve options. Defensive tools may resist an early Red plan when they actually cover its threat.",
            risk: "Flexibility is not every build at once. After choosing a role and build, the opponent can attack the function you did not bring.",
            check: "Which mode are we choosing here? Does the rest of the draft still work once the other options are unavailable?",
        },
        black: {
            identity:
                "Power tied to a cost, task or condition; can accelerate another plan.",
            advantage:
                "Can provide a valuable payoff when the team reliably enables the exact condition and the opponent cannot deny it cheaply.",
            risk: "The opponent can target that requirement. No universal color counter follows: identify the actual resource, target, combo or setup being denied.",
            check: "State the condition and its cost. How do we enable it, and what remains if it never happens?",
        },
        colorless: {
            identity:
                "A specialized theme that shapes the surrounding draft. Not missing data.",
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
                "초반 공격과 스노우볼. 이득 전환을 이어가지 못하면 힘이 떨어질 수 있습니다.",
            advantage:
                "라인 압박과 후속 행동으로 초반 기회를 지속적인 자원 이득으로 바꿀 수 있다면 느린 준비를 공략할 수 있습니다.",
            risk: "압박이 멈추면 손해가 큽니다. 상대가 생존하고 실행할 수 있다면 교전 회피, 안전한 라인 관리와 엄호가 필요한 플레이를 차단할 수 있습니다.",
            check: "어느 라인에서 첫 기회를 만드나요? 어떻게 이득으로 전환하며 첫 시도가 실패하면 무엇을 하나요?",
        },
        green: {
            identity:
                "시너지와 공동 강세 구간, 아이템 타이밍. 다른 구성원에게 의존하는 경우가 많습니다.",
            advantage:
                "아군이 서로를 강화하면 맞춰진 성장 타이밍과 반복 교전이 유리할 수 있습니다. 이를 방해하지 못하는 상대를 공략합니다.",
            risk: "아군 분리, 자원 차단, 핵심 아이템 전 교전은 계획을 무너뜨릴 수 있습니다. 지원받는 캐리도 유효한 대상에게 접근해야 합니다.",
            check: "어떤 아군과 아이템이 필요한가요? 너무 많은 것을 내주지 않고 함께 그 시점에 도달할 수 있나요?",
        },
        blue: {
            identity:
                "통제, 차단, 자원 관리. 시간을 벌고 상대의 선택지를 줄이는 계획입니다.",
            advantage:
                "영역, 사거리나 방어 수단으로 진입을 막고 번 시간을 활용할 수 있다면 예측 가능한 접근을 공략할 수 있습니다.",
            risk: "한 구역을 장악해도 맵 전체를 통제하는 것은 아닙니다. 긴 사거리, 여러 진입 각도나 사이드 압박이 우회할 수 있습니다. 상대가 더 이득이면 기다림은 승리가 아닙니다.",
            check: "무엇이 상대를 우리 유효 사거리로 들어오게 하나요? 늦게 도착해도 공간을 다툴 수 있나요?",
        },
        white: {
            identity:
                "드래프트의 유연성, 주로 지원 성격. 게임 안에서는 한 방식을 선택하는 경우가 많습니다.",
            advantage:
                "부족한 역할을 채우고 선택지를 유지할 수 있습니다. 방어 수단이 실제 위협을 막는다면 초반 적색 계획에 저항할 수 있습니다.",
            risk: "유연성이 모든 빌드의 동시 사용을 뜻하지는 않습니다. 포지션과 빌드를 정하면 상대는 가져오지 않은 기능을 공략할 수 있습니다.",
            check: "어떤 방식을 선택하나요? 다른 선택지가 사라져도 조합이 작동하나요?",
        },
        black: {
            identity:
                "비용, 과제 또는 조건이 붙은 강점. 다른 계획을 가속할 수 있습니다.",
            advantage:
                "팀이 정확한 조건을 안정적으로 충족하고 상대가 쉽게 막지 못한다면 큰 보상을 얻을 수 있습니다.",
            risk: "상대는 그 조건을 방해할 수 있습니다. 보편적인 색상 카운터가 아니라 어떤 자원, 대상, 콤보나 준비가 차단되는지 확인하세요.",
            check: "조건과 비용은 무엇인가요? 어떻게 충족하며 끝내 충족하지 못하면 무엇이 남나요?",
        },
        colorless: {
            identity:
                "주변 조합을 결정하는 특화 테마. 데이터 없음과는 다릅니다.",
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
            identity: "前期进攻与滚雪球；需要持续转化优势，否则可能失去势头。",
            advantage:
                "若线权与后续配合能将早期机会转化为持久资源优势，就能针对准备较慢的计划。",
            risk: "压迫停滞代价较大。若对手能存活并执行，拉开、稳健控线或防守掩护可能阻止你必须打出的行动。",
            check: "哪条线创造第一个机会？如何兑现？第一波失败后怎么办？",
        },
        green: {
            identity: "协同、共同强势期与装备节点；价值往往依赖队友。",
            advantage:
                "相互赋能可在同步强势期和连续交战中获益，并针对无法打断这些时机或持续配合的对手。",
            risk: "分割队友、限制资源或在关键装备前开战可能破坏计划。被保护的核心仍需接近有价值的目标。",
            check: "需要哪些队友与装备？能否在不过度让出资源的情况下共同到达强势期？",
        },
        blue: {
            identity: "控制、限制与资源管理；通常争取时间，减少对手的选择。",
            advantage:
                "若区域、射程或防守手段能阻止进入，且队伍能利用争取的时间，就可针对可预测的接近路线。",
            risk: "控制一个区域不等于控制全图。更长射程、多角度进场或边线压力可能绕过它。若对方收益更大，等待就不等于赢。",
            check: "什么迫使对手进入我们的有效射程？晚到时还能争夺空间吗？",
        },
        white: {
            identity: "选人灵活，通常偏配合；游戏中往往要选定一种模式。",
            advantage:
                "可补足功能并保留选择。当防守工具确实覆盖威胁时，可能抵抗红色的早期计划。",
            risk: "灵活不代表同时拥有所有出装。分路和出装确定后，对手可以针对你没有带来的功能。",
            check: "本局选择哪种模式？放弃其他选项后，整体阵容是否仍然成立？",
        },
        black: {
            identity: "力量附带代价、任务或条件；可以加速另一种计划。",
            advantage:
                "若团队能稳定满足具体条件，且对手无法低成本破坏，就能获得有价值的回报。",
            risk: "对手可针对条件本身。不存在由此推导出的通用颜色克制；应明确被限制的是资源、目标、连招还是准备。",
            check: "条件和代价是什么？如何满足？若始终未达成，还剩哪些作用？",
        },
        colorless: {
            identity: "需要围绕其组建阵容的特殊主题，不代表缺少数据。",
            advantage:
                "必要组件契合，且对手缺少对该主题的有效应对时，可以形成集中的计划。",
            risk: "专精可能缩小备选空间。禁掉关键组件或避开预期互动，可能暴露这种依赖。",
            check: "主题和必需组件是什么？组件被禁或互动被阻止时，有什么备选计划？",
        },
    },
};

export const COLOR_GUIDE = { en_US: en, ko_KR: ko, zh_CN: zh };
