# 题目依据与内容边界

## 定位

这是以人格研究条目为参考的中文趣味自我探索，不是标准心理量表。
奶娃表情、人格名称、画像和五维原型是创作者的娱乐化设计。
科学参考不等于本站已经获得科学验证。

## 直接参考资料

1. Donnellan, M. B., Oswald, F. L., Baird, B. M., & Lucas, R. E. (2006).
   The Mini-IPIP scales: Tiny-yet-effective measures of the Big Five factors of personality.
   *Psychological Assessment, 18*(2), 192–203.
   https://doi.org/10.1037/1040-3590.18.2.192
2. IPIP 官方 Mini-IPIP 条目与计分键：https://ipip.ori.org/MiniIPIPKey.htm
3. IPIP 公开使用说明：https://ipip.ori.org/newPermission.htm
4. IPIP Big-Five Factor Markers 官方完整条目集：
   https://ipip.ori.org/newBigFive5broadKey.htm
5. Soto, C. J., & John, O. P. (2017). The next Big Five Inventory (BFI-2):
   Developing and assessing a hierarchical model with 15 facets to enhance
   bandwidth, fidelity, and predictive power. *Journal of Personality and Social
   Psychology, 113*(1), 117–143. https://doi.org/10.1037/pspp0000096
6. Credé, M., Harms, P., Niehorster, S., & Gaye-Valentine, A. (2012).
   An evaluation of the consequences of using short measures of the Big Five
   personality traits. *Journal of Personality and Social Psychology, 102*(4),
   874–888. https://doi.org/10.1037/a0027403
7. Fleeson, W. (2001). Toward a structure- and process-integrated view of
   personality: Traits as density distributions of states.
   *Journal of Personality and Social Psychology, 80*(6), 1011–1027.
   https://doi.org/10.1037/0022-3514.80.6.1011
8. Meijer, R. R., & Nering, M. L. (1999). Computerized Adaptive Testing:
   Overview and Introduction. *Applied Psychological Measurement, 23*(3),
   187–194. https://doi.org/10.1177/01466219922031310

2026-10-19 已核对：官方计分键的条目、维度和正反向；公开使用声明；
论文书目信息和 DOI。未在本站进行验证性研究。
新增四篇论文已核对 Crossref 元数据、作者研究摘要或文献数据库收录摘要，
没有宣称阅读全文或完成系统综述。
BFI-2 文献用于提醒广维度有不同侧面，本站未复制其题目或测量 15 个侧面；
短量表文献用于提醒信息损失，不代表题目越多就必然越准；
Fleeson 用于区分一般倾向与日常情境状态；
自适应测验概述用于明确规则补问不等于经过标定的 CAT。
论文都没有验证本站中文改写、分支阈值、权重或奶娃原型。
引用原研究不表示其作者认可本站产品，也不转用官方页面所列的信度数字。

官方计分键指出，该短量表来自词汇学大五标记，而不是把词汇学大五与
所有五因素模型完全等同。第五因素称 Intellect / Imagination；
这里使用“想象思辨”，不将它解释为智商或开放性的完整评估。
代码保留 `O` 作为第五维度的内部标识，不改变上述解释。

## 逐题对应

题目为中文情境改写，而非已验证的逐字等值翻译。
英文条目取自上述公开计分键。下表编号是本站出题顺序。
完整中文题干及每题改写说明同时收录在 `data.js`，页面的本题依据中可查看。

| 本站题号 | 展示维度 | 原英文条目 | 方向 |
| --- | --- | --- | --- |
| 1 | 社交能量 E | Am the life of the party. | 正向 |
| 2 | 共情倾向 A | Sympathize with others' feelings. | 正向 |
| 3 | 条理倾向 C | Get chores done right away. | 正向 |
| 4 | 情绪波动 N | Have frequent mood swings. | 正向 |
| 5 | 想象思辨 O | Have a vivid imagination. | 正向 |
| 6 | 社交能量 E | Don't talk a lot. | 反向 |
| 7 | 共情倾向 A | Am not interested in other people's problems. | 反向 |
| 8 | 条理倾向 C | Often forget to put things back in their proper place. | 反向 |
| 9 | 情绪波动 N | Am relaxed most of the time. | 反向 |
| 10 | 想象思辨 O | Am not interested in abstract ideas. | 反向 |
| 11 | 社交能量 E | Talk to a lot of different people at parties. | 正向 |
| 12 | 共情倾向 A | Feel others' emotions. | 正向 |
| 13 | 条理倾向 C | Like order. | 正向 |
| 14 | 情绪波动 N | Get upset easily. | 正向 |
| 15 | 想象思辨 O | Have difficulty understanding abstract ideas. | 反向 |
| 16 | 社交能量 E | Keep in the background. | 反向 |
| 17 | 共情倾向 A | Am not really interested in others. | 反向 |
| 18 | 条理倾向 C | Make a mess of things. | 反向 |
| 19 | 情绪波动 N | Seldom feel blue. | 反向 |
| 20 | 想象思辨 O | Do not have a good imagination. | 反向 |

第 18 题用桌面和物品杂乱的具体情境改写，比英文条目语义范围更窄。
其他题目的口语化、比喻、中文语境和作答标签也可能改变测量性质。
为减少刻板误读，不把拒绝请求当成缺少共情，不把喜欢独处当成焦虑，
不把想象和抽象兴趣分数当作智商。

## 计分与奶娃匹配

- 五档回答内部编码为 0、1、2、3、4。
- 正向条目取原值，反向条目取 `4 - 原值`。
- 每个维度有 4 道基础题，被补问的维度为 6 题。
- 展示值为 `round(该维度全部已指定题目的校正分总和 / (该维度题数 * 4) * 100)`。
- 0–100 只是本次作答的线性换算，没有常模，不是百分位、概率或疾病风险。
- 对十个手工设定的虚构五维原型，计算五维等权欧氏距离平方。
- 选择距离最小的原型。恰好并列时按固定列表顺序选择，不添加随机标签。
- 不展示虚构的“稀有度”“准确率”“超过多少人”或人群占比。
- 奶娃匹配、描述、优点和提醒不是原论文结论，也不是心理学发现的十种类别。

## V3 分支规则与备用条目

先完成全部 20 道基础题，再固定本次补问计划。
每维度满足以下任一规则即进入候选：原回答中间档（2）至少 2 个；
或正反向校正后最高值减最低值至少 3 档。
按 `中间档数量 * 2 + 档位差` 降序排列，最多 3 个维度各追加 2 题，
总题数为 20、22、24 或 26。并列按 E、A、C、N、O 的固定顺序。
这只是公开、可重现的产品启发式规则，没有来自论文的阈值依据。
不将回答的情境差异称为不诚实，也不据此报告精确性或可信度。

| 维度 | 原英文补充条目 | 本站方向 |
| --- | --- | --- |
| E | Feel comfortable around people. | 正向 |
| E | Am quiet around strangers. | 反向 |
| A | Take time out for others. | 正向 |
| A | Feel little concern for others. | 反向 |
| C | Follow a schedule. | 正向 |
| C | Shirk my duties. | 反向 |
| N | Worry about things. | 正向 |
| N | Rarely get irritated. | 反向 |
| O | Am full of ideas. | 正向 |
| O | Will not probe deeply into a subject. | 反向 |

补充条目来自 IPIP 官方更宽的条目集，不冒称 Mini-IPIP 原有题目。
官方键的 Emotional Stability 与本站 N 情绪波动方向相反，已对应转换。
逐题中文、来源与语义限制见页面及 `data.js`。

选中的补问必须全部完成才出结果，不把漏答当作中间档。
每个维度按自身 4 或 6 题归一化，再进行五维等权原型匹配；
题数较多的维度不会获得更大的匹配权重。
返回修改任何基础题，清空全部补问答案和计划，重新完成基础题后重选。
仅返回查看而未修改则保留已答的补问。分支计划不在补问途中再次改变。

该规则未进行 IRT 题库标定、测量等值检验、精度仿真或外部验证；
不同路径的结果不能当作等值专业测验。新增情境或论文引用
不能证明本站更准确。若将来开展验证，需另行设计知情同意与数据研究，
当前网站不收集任何此类数据。

## 今日状态

十二张状态卡是自选的情境表达，复用用户提供的十幅完整表情，
不代表十二幅新增插画，也不是研究发现的状态分类。
状态与人格结果彼此独立，不从基础题推断、不参与计分。
状态链接只包含状态 ID；没有答题记录、分数或身份。

## 效度与使用限制

未经规范翻译、回译、认知访谈、中文样本验证、常模建立或跨群体检验。
不能宣称这是标准中文版 Mini-IPIP，不能继承原量表的信效度。
结果可能随心情、情境、语言理解及作答方式变化，不应作为固定身份标签。
所有维度只是有限的自我描述，不能用于招聘、升学、医疗、关系评判或其他高影响决定。
“愤怒”“忧郁”等仅来自原创表情的模式名称，不是临床术语判定。

## 隐私与分享

答案和五维分数仅在当前页面内存中存在，不上传、不持久化。
共享链接仅有版本号和虚构奶娃 ID；接收者看不到原答案和分数。
URL 类型可以被手工更改，因此不是可验证的测评证书。
公开链接和海报可以被再次转发，网站不能收回已分享的副本。
无登录、广告、访问统计或第三方前端请求；静态托管商可能保留常规网络访问日志。
