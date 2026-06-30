const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = require('docx');
const fs = require('fs');

// 字体大小 (half-points): 小二=36(18pt), 小三=30(15pt), 小四=24(12pt)
const 小二 = 36;
const 小三 = 30;
const 小四 = 24;

const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: "SimSun", size: 小四, color: "000000" }
      }
    },
    paragraphStyles: [
      {
        id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 小二, bold: true, font: "SimHei", color: "000000" },
        paragraph: { spacing: { before: 360, after: 240 }, outlineLevel: 0 }
      },
      {
        id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 小三, bold: true, font: "SimHei", color: "000000" },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 }
      }
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },
    children: [
      // ===== 标题 =====
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        children: [new TextRun(`企业微信生态中废话文学的话语权力建构与组织传播机制研究`)]
      }),

      // ===== 作者 =====
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 120, after: 60 },
        children: [new TextRun({ text: `李摸鱼\u00B9  张划水\u00B2`, size: 小四, font: "SimSun" })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 },
        children: [new TextRun({ text: `（1. 中国职场摸鱼研究中心  2. 废话文学研究院，北京 100084）`, size: 小四, font: "SimSun" })]
      }),

      // ===== 摘要 =====
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        alignment: AlignmentType.CENTER,
        spacing: { before: 240 },
        children: [new TextRun(`摘  要`)]
      }),
      new Paragraph({
        spacing: { line: 360, after: 120 },
        indent: { firstLine: 480 },
        children: [new TextRun(
          `废话文学作为数字化办公时代的特殊组织语言现象，已深刻嵌入企业微信生态的话语实践之中。本研究通过对87家互联网企业与传统企业的混合田野调查，结合深度访谈（N=42）与工作群聊文本分析（N=1362条消息），系统考察了废话文学在组织传播中的话语建构逻辑、类型学特征及其背后的权力运作机制。研究发现，职场废话文学并非低效沟通的表征，而是一种高度策略性的组织符号实践，承担着情感润滑、权力协商与身份锚定等多重隐功能。`
        )]
      }),
      new Paragraph({
        spacing: { before: 60, after: 240 },
        indent: { firstLine: 480 },
        children: [
          new TextRun({ text: `关键词：`, bold: true, font: "SimSun" }),
          new TextRun(`废话文学；组织传播；话语权力；企业微信；符号互动论`)
        ]
      }),

      // ===== 一、问题的提出 =====
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun(`一、问题的提出`)]
      }),
      new Paragraph({
        spacing: { line: 360, after: 120 },
        indent: { firstLine: 480 },
        children: [new TextRun(
          `近年来，随着企业微信、钉钉等即时通讯工具在职场中的全面普及，一种独特的组织话语形态——废话文学——悄然兴起并在各类工作群聊中呈病毒式蔓延。以\u201C收到\u201D\u201C好的呢\u201D\u201C辛苦了\u201D\u201C我来跟进\u201D\u201C我们商量一下\u201D\u201C对齐一下颗粒度\u201D等为代表的高频话术，共同构成了当代职场沟通的核心语料库。令人瞩目的是，这些话语的语义负载量趋近于零，却在实际组织传播中承担着不可或缺的功能性角色。究竟是何种组织逻辑催生了这一看似荒诞的话语实践？废话文学在组织权力结构中扮演着怎样的角色？这些是本研究试图回答的核心问题。`
        )]
      }),

      // ===== 二、废话文学的类型学分析 =====
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun(`二、废话文学的类型学分析`)]
      }),
      new Paragraph({
        spacing: { line: 360, after: 120 },
        indent: { firstLine: 480 },
        children: [
          new TextRun(`基于扎根理论的编码分析，本研究将职场废话文学系统性地归纳为三大类型。其一为`),
          new TextRun({ text: `仪式性废话`, bold: true }),
          new TextRun(`，典型话语如\u201C收到\u201D\u201C明白\u201D\u201C好滴\u201D，其核心功能在于确认信息接收而非传递信息本身，类似于人类学意义上的\u201C寒暄仪式\u201D——通过最低限度的符号交换维持沟通渠道的畅通。其二为`),
          new TextRun({ text: `策略性废话`, bold: true }),
          new TextRun(`，如\u201C我们研究一下\u201D\u201C后续同步\u201D\u201C尽量推动\u201D，实质上是组织权力不对等场景下的温和拒绝术与模糊边界管理策略，发言者藉此规避正面承诺的同时保持表面配合姿态。其三为`),
          new TextRun({ text: `表演性废话`, bold: true }),
          new TextRun(`，典型代表为\u201C辛苦了\u201D\u201C感谢赋能\u201D\u201C向你学习\u201D，具有显著的印象管理特征，属于戈夫曼拟剧理论中\u201C前台表演\u201D的数字化延伸。`)
        ]
      }),

      // ===== 三、组织传播中话语权力的建构机制 =====
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun(`三、组织传播中话语权力的建构机制`)]
      }),
      new Paragraph({
        spacing: { line: 360, after: 120 },
        indent: { firstLine: 480 },
        children: [new TextRun(
          `研究发现，废话文学作为一种\u201C弱语义、强语用\u201D的语言实践，本质上是组织权力的微观运作技术。在管理层层面，\u201C落实一下\u201D\u201C对齐一下\u201D\u201C拉通一下\u201D等话语实现了议程设置权与话语主导权，其\u201C一下\u201D的轻量化修辞恰恰掩盖了权力指令的实质；在基层员工层面，\u201C好的\u201D\u201C收到\u201D的功能已超越单纯的信息回执，演变为一种服从性的权力展演——回复越快，忠诚信号越强；中间管理层则通过\u201C反馈一下\u201D\u201C同步一下\u201D\u201C我转达一下\u201D等话语，在上下级之间充当话语缓冲带，形成了一种独特的组织\u201C语言学夹层\u201D。换言之，废话文学已深度嵌入组织科层结构，成为权力关系的语言学镜像。`
        )]
      }),

      // ===== 四、结论与启示 =====
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun(`四、结论与启示`)]
      }),
      new Paragraph({
        spacing: { line: 360, after: 120 },
        indent: { firstLine: 480 },
        children: [new TextRun(
          `本研究揭示，职场废话文学看似冗余累赘，实则构成组织运作不可或缺的\u201C语言润滑剂\u201D。当形式化的废话被系统性地剥离，组织沟通将面临赤裸的权力碰撞与情感摩擦，反而降低协作效率。据此，本研究建议企业管理者正视废话文学的合理性，通过优化沟通结构、缩短科层距离来减少无效催生的废话需求，而非简单粗暴地\u201C禁绝废话\u201D。未来研究可进一步关注大语言模型（LLMs）辅助生成职场话术对组织传播生态的潜在影响，以及跨文化比较视域下中日美三国职场废话文学的话语风格差异。`
        )]
      }),

      // ===== 参考文献 =====
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 360 },
        children: [new TextRun(`参考文献`)]
      }),
      new Paragraph({
        spacing: { line: 360, after: 60 },
        indent: { firstLine: 480 },
        children: [new TextRun(`[1] 张三, 李四. 论\u201C收到\u201D二字对职场人颈椎的损伤机制——基于生物力学的实证研究[J]. 摸鱼学报, 2024, 12(3): 45-67.`)]
      }),
      new Paragraph({
        spacing: { line: 360, after: 60 },
        indent: { firstLine: 480 },
        children: [new TextRun(`[2] Goffman, E. The Presentation of Self in Everyday Life[M]. Doubleday, 1959.`)]
      }),
      new Paragraph({
        spacing: { line: 360, after: 60 },
        indent: { firstLine: 480 },
        children: [new TextRun(`[3] 王五. 企业微信群\u201C拍一拍\u201D功能的符号互动分析[J]. 组织废话研究, 2023, 5(1): 12-28.`)]
      }),
      new Paragraph({
        spacing: { line: 360, after: 60 },
        indent: { firstLine: 480 },
        children: [new TextRun(`[4] Austin, J. L. How to Do Things with Words[M]. Oxford University Press, 1962.`)]
      }),
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("职场废话文学研究论文.docx", buffer);
  console.log("论文已生成: 职场废话文学研究论文.docx");
});
