/**
 * Generate lesson plans for a specific grade level.
 * Usage: npx tsx scripts/gen-plans-template.ts KINDERGARTEN
 */
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const rawUrl = `file:${path.join(process.cwd(), "prisma", "dev.db")}`;
const adapter = new PrismaBetterSqlite3({ url: rawUrl });
const prisma = new PrismaClient({ adapter });

const gradeLevel = process.argv[2];
if (!gradeLevel) {
  console.error("Usage: npx tsx scripts/gen-plans-template.ts GRADE_LEVEL");
  process.exit(1);
}

function generatePlan(lesson: any, unit: any, gradeLevel: string): any {
  const materials = JSON.parse(lesson.materials || "[]");
  const activities = JSON.parse(lesson.activities || "[]");
  const isYoung = ["PRE_K", "KINDERGARTEN", "GRADE_1", "GRADE_2"].includes(gradeLevel);
  const isMid = ["GRADE_3", "GRADE_4", "GRADE_5"].includes(gradeLevel);
  const isOlder = ["GRADE_6", "GRADE_7", "GRADE_8"].includes(gradeLevel);

  // Build discussion questions based on lesson content
  const objective = lesson.objective || "";
  const title = lesson.title || "";
  const scripture = lesson.scriptureRef || "";

  let discussionQs: string[] = [];
  let teacherAs: string[] = [];
  let handoutContent = "";
  let activityInstructions = "";
  let welcomeText = "";
  let reviewText = "";

  if (isYoung) {
    welcomeText = `Gather the children in a circle. Ask: "Who remembers what we learned last time?" Give high-fives for answers. Then ask: "Has anyone seen or done something this week that made them think of God?" Let 2-3 children share briefly. Sing a short gathering song together.`;

    reviewText = `Ask the class:\n1. What did we learn about last week?\n2. Can anyone remember our prayer from last time?\n3. What was our take-home activity? Did anyone do it?\nPraise all answers. For young children, ANY participation is a win.`;

    discussionQs = [
      `What do you think "${title.split('—')[0].trim()}" means?`,
      `How does this make you feel about God?`,
      `Can you think of a time when ${objective.toLowerCase().includes('pray') ? 'you prayed' : objective.toLowerCase().includes('kind') ? 'someone was kind to you' : 'you felt God was close'}?`,
    ];

    teacherAs = [
      `Accept all answers warmly. Guide toward: ${objective}`,
      `Answers might include: happy, safe, loved, warm. Affirm: "Yes! God wants us to feel loved."`,
      `Let children share personal stories. Connect back to the lesson theme.`,
    ];

    handoutContent = `Name: _________________ Date: _____________\n\n` +
      `${title}\n` +
      `${"=".repeat(40)}\n\n` +
      `1. Draw a picture of ${title.toLowerCase().includes('god') ? 'God\'s love for you' : title.toLowerCase().includes('jesus') ? 'Jesus and you together' : title.toLowerCase().includes('pray') ? 'you praying' : 'what you learned today'}:\n\n` +
      `   ┌─────────────────────────────────┐\n` +
      `   │                                 │\n` +
      `   │                                 │\n` +
      `   │        (Draw here!)             │\n` +
      `   │                                 │\n` +
      `   │                                 │\n` +
      `   └─────────────────────────────────┘\n\n` +
      `2. Circle the correct answer:\n` +
      `   ${objective.includes('God') ? 'God loves: (me) (some people) (everyone)' : objective.includes('Jesus') ? 'Jesus is: (a friend) (God\'s Son) (both!)' : objective.includes('pray') ? 'We pray to: (talk to God) (only at church) (anytime, anywhere!)' : `Today I learned about: (${title.split('—')[0].trim()})`}\n\n` +
      `3. Trace the words:\n` +
      `   G-O-D   L-O-V-E-S   M-E\n\n` +
      `4. Color the ${title.toLowerCase().includes('mary') ? 'picture of Mary' : title.toLowerCase().includes('church') ? 'church' : title.toLowerCase().includes('cross') ? 'cross' : 'heart'} on the back of this page.\n\n` +
      `⭐ My prayer this week: "${lesson.prayerFocus || 'Dear God, thank you for loving me. Amen.'}"`;

    activityInstructions = activities.length > 0
      ? `${activities[0]}.\n\nInstructions:\n1. Give each child the supplies.\n2. Explain what they will make/do: "${activities[0]}"\n3. Walk around and help as needed. Ask each child about their work.\n4. When finished, have children share with a partner.\n5. Display completed work or send home with families.`
      : `Creative Activity: Have children draw or color a picture related to today's lesson. Walk around, ask about their drawings, and connect their art back to the teaching.`;

  } else if (isMid) {
    welcomeText = `Welcome students as they arrive. On the board/paper write today's topic: "${title}"\nIcebreaker: Go around the room — each student shares one thing from this week they're thankful for (keep it quick, 30 seconds each). Connect gratitude to today's theme.`;

    reviewText = `Quick review quiz (students can answer aloud or on paper):\n1. What was last week's lesson about?\n2. What Scripture passage did we read?\n3. Name one thing you remember from the activity.\nReview the correct answers and connect to today's lesson: "Last week we learned about... Today we'll build on that by exploring ${title.toLowerCase()}"`;

    discussionQs = [
      `In your own words, what does "${title.split('—')[0].trim()}" mean?`,
      `How does ${scripture ? 'this Scripture passage' : 'today\'s lesson'} apply to your daily life?`,
      `Why do you think the Church teaches this? Why is it important?`,
      `What's one way you can live this out this week?`,
    ];

    teacherAs = [
      `Guide students toward understanding: ${objective}. Accept various wordings but ensure the core concept is correct.`,
      `Look for real-life connections. Examples: at school, with friends, at home, in sports. The goal is making faith practical.`,
      `Connect to the larger Catholic faith. Reference: ${lesson.cccParagraphs || 'the Catechism'}. The Church teaches this because it helps us grow closer to God.`,
      `Encourage specific, actionable responses — not vague "be nice." Push for: "I will _____ when _____ this week."`,
    ];

    handoutContent = `Name: _________________ Date: _____________\n\n` +
      `${title}\n` +
      `Scripture: ${scripture}\n` +
      `${"=".repeat(50)}\n\n` +
      `PART 1: Key Vocabulary\n` +
      `Match each term with its definition:\n\n` +
      `1. ___  ${objective.split(' ').slice(0, 3).join(' ')}...    A. A teaching from the Church\n` +
      `2. ___  Grace                                    B. God's free gift to help us be holy\n` +
      `3. ___  Sacrament                                C. A visible sign of God's grace\n\n` +
      `PART 2: Scripture Reflection\n` +
      `Read: ${scripture}\n\n` +
      `1. What is the main message of this passage?\n` +
      `   _________________________________________________\n` +
      `   _________________________________________________\n\n` +
      `2. How does this connect to ${title.toLowerCase()}?\n` +
      `   _________________________________________________\n` +
      `   _________________________________________________\n\n` +
      `PART 3: Think About It\n` +
      `1. What is one new thing you learned today?\n` +
      `   _________________________________________________\n\n` +
      `2. How will you live this out this week? Be specific!\n` +
      `   _________________________________________________\n\n` +
      `3. Write a short prayer (2-3 sentences) about today's lesson:\n` +
      `   _________________________________________________\n` +
      `   _________________________________________________\n\n` +
      `ANSWER KEY (Teacher Only):\n` +
      `Part 1: Answers will vary based on lesson content\n` +
      `Part 2: Key ideas from ${scripture}: ${objective}\n` +
      `Part 3: Personal reflection — no wrong answers`;

    activityInstructions = activities.length > 0
      ? `Activity: ${activities[0]}\n\n1. Divide students into groups of 3-4.\n2. Explain the activity: "${activities[0]}"\n3. Give groups 10 minutes to work.\n4. Each group presents their work (2 min each).\n5. Discuss: What did we learn from this activity?`
      : `Group Discussion Activity: Divide into small groups. Each group discusses: "How does ${title.toLowerCase()} affect our daily lives?" Groups report back with 3 key points.`;

  } else {
    // Older students (6-8)
    welcomeText = `As students arrive, have this question on the board: "${objective.replace('Understand', 'What do you think about').replace('Learn', 'What do you already know about').replace('Study', 'What comes to mind when you hear')}" \nGive students 2 minutes to think, then share with a partner. Take 2-3 responses from the class. Use responses to transition into today's lesson.`;

    reviewText = `Review Challenge (3 minutes):\nWithout looking at notes, write down:\n1. The main topic from last week\n2. One Scripture passage we discussed\n3. One way you applied last week's lesson\n\nHave 2-3 students share. Award participation points if you use a point system.`;

    discussionQs = [
      `What are the key Catholic teachings about "${title.split('—')[0].trim()}"? Cite the Catechism if you can.`,
      `How does ${scripture ? scripture : 'today\'s topic'} challenge or confirm what you already believed?`,
      `A friend who isn't Catholic asks you about this. How would you explain it in your own words?`,
      `What are the real-world implications of this teaching? Where do you see it (or its absence) in society?`,
      `How does this connect to your Confirmation preparation and your call to be a disciple?`,
    ];

    teacherAs = [
      `Key teaching from ${lesson.cccParagraphs || 'CCC'}: ${objective}. Students should reference specific Church teaching, not just personal opinion.`,
      `Encourage honest responses. Some students may struggle with certain teachings — that's normal and healthy. Guide toward understanding WHY the Church teaches this.`,
      `This is an evangelization skill. Good answer pattern: "Catholics believe... because... This matters because..."`,
      `Push for critical thinking. Examples from current events, media, school life. Connect faith to reality.`,
      `Confirmation = maturity in faith. This lesson prepares them to own their faith as adults.`,
    ];

    handoutContent = `Name: _________________ Date: _____________\n\n` +
      `${title}\n` +
      `Scripture: ${scripture}  |  Catechism: ${lesson.cccParagraphs || 'CCC'}\n` +
      `${"=".repeat(60)}\n\n` +
      `SECTION 1: Key Concepts\n` +
      `In your own words, define or explain:\n\n` +
      `1. ${title.split('—')[0].trim()}:\n` +
      `   _________________________________________________________________\n` +
      `   _________________________________________________________________\n\n` +
      `2. How does this relate to the Four Pillars of the Catechism?\n` +
      `   _________________________________________________________________\n\n` +
      `3. Key Scripture passage and its meaning:\n` +
      `   _________________________________________________________________\n` +
      `   _________________________________________________________________\n\n` +
      `SECTION 2: Critical Thinking\n\n` +
      `1. A classmate says: "I don't see why this matters." How would you respond?\n` +
      `   _________________________________________________________________\n` +
      `   _________________________________________________________________\n\n` +
      `2. Give a real-world example of this teaching in action:\n` +
      `   _________________________________________________________________\n` +
      `   _________________________________________________________________\n\n` +
      `3. What question do you still have about this topic?\n` +
      `   _________________________________________________________________\n\n` +
      `SECTION 3: Personal Reflection\n\n` +
      `1. How does this teaching affect YOUR life right now?\n` +
      `   _________________________________________________________________\n\n` +
      `2. What is ONE concrete action you will take this week based on today's lesson?\n` +
      `   _________________________________________________________________\n\n` +
      `3. Write a prayer response (3-5 sentences):\n` +
      `   _________________________________________________________________\n` +
      `   _________________________________________________________________\n` +
      `   _________________________________________________________________\n\n` +
      `─────────────────────────────────────────────\n` +
      `TEACHER ANSWER KEY:\n` +
      `Section 1.1: ${objective}\n` +
      `Section 1.2: Relates to ${unit.title.includes('Creed') || unit.title.includes('Trinity') ? 'Pillar 1: Profession of Faith' : unit.title.includes('Sacra') ? 'Pillar 2: Celebration of the Christian Mystery' : unit.title.includes('Moral') || unit.title.includes('Command') ? 'Pillar 3: Life in Christ' : unit.title.includes('Prayer') ? 'Pillar 4: Christian Prayer' : 'multiple pillars'}\n` +
      `Section 1.3: ${scripture} teaches: ${objective}\n` +
      `Section 2: Look for specific examples, critical engagement, and Catholic reasoning`;

    activityInstructions = activities.length > 0
      ? `${activities[0]}\n\nSetup:\n1. Divide class into groups of 3-4.\n2. Each group receives the activity materials.\n3. Groups have 12 minutes to complete the task.\n4. Each group presents (2-3 min each).\n5. Class discussion: What insights emerged? How does this deepen our understanding?`
      : `Socratic Discussion: Arrange desks in a circle. Present the essential question: "Why does the Church teach about ${title.toLowerCase()} and how does it impact our lives?" Students must reference at least one Scripture passage and one CCC paragraph in their responses.`;
  }

  const openingPrayer = lesson.prayerFocus
    ? `Leader: In the name of the Father, and of the Son, and of the Holy Spirit.\nAll: Amen.\n\nLeader: Let us pray.\n${lesson.prayerFocus.includes('Our Father') ? 'Our Father, who art in heaven, hallowed be thy name; thy kingdom come, thy will be done, on earth as it is in heaven. Give us this day our daily bread, and forgive us our trespasses, as we forgive those who trespass against us; and lead us not into temptation, but deliver us from evil. Amen.' : lesson.prayerFocus.includes('Hail Mary') ? 'Hail Mary, full of grace, the Lord is with thee. Blessed art thou among women, and blessed is the fruit of thy womb, Jesus. Holy Mary, Mother of God, pray for us sinners, now and at the hour of our death. Amen.' : lesson.prayerFocus.includes('Glory Be') ? 'Glory be to the Father, and to the Son, and to the Holy Spirit. As it was in the beginning, is now, and ever shall be, world without end. Amen.' : lesson.prayerFocus.includes('Act of Contrition') ? 'My God, I am sorry for my sins with all my heart. In choosing to do wrong and failing to do good, I have sinned against you whom I should love above all things. I firmly intend, with your help, to do penance, to sin no more, and to avoid whatever leads me to sin. Amen.' : `Lord, as we begin today's lesson on "${title}", open our hearts and minds to receive your truth. ${lesson.prayerFocus}. We ask this through Christ our Lord.\nAll: Amen.`}`
    : `In the name of the Father, and of the Son, and of the Holy Spirit. Amen.\n\nLord Jesus, as we gather to learn about "${title}", fill us with your Holy Spirit. Help us understand your truth and live it every day. Amen.`;

  const closingPrayer = `Leader: Let us close in prayer.\n\n${lesson.prayerFocus ? `${lesson.prayerFocus}\n\n` : ''}Lord, thank you for what we learned today about "${title}." Help us carry this lesson in our hearts this week. ${isYoung ? 'Help us be good and kind.' : isMid ? 'Give us the courage to live our faith.' : 'Send your Holy Spirit to guide us as we put our faith into action.'}\n\nAll: Amen.\n\nLeader: In the name of the Father, and of the Son, and of the Holy Spirit.\nAll: Amen.`;

  const teacherNotes = `PREPARATION:\n- Read ${scripture || 'the lesson Scripture'} beforehand and be ready to explain it at the ${isYoung ? 'children\'s' : 'students\''} level.\n- Gather all materials before class: ${materials.join(', ') || 'textbook, handouts'}.\n- ${lesson.cccParagraphs ? `Review ${lesson.cccParagraphs} in the Catechism for deeper understanding.` : 'Review the relevant Catechism sections.'}\n\nCOMMON QUESTIONS:\n- ${isYoung ? '"Why can\'t we see God?" — God is spirit, but we can see His love in the world around us and in the people who love us.' : isMid ? '"Why do I need to go to Mass?" — Mass is where we receive Jesus in the Eucharist and worship God as a community. It\'s how we grow stronger in faith.' : '"How do I know the Church is right about this?" — The Church\'s teaching authority (Magisterium) is guided by the Holy Spirit. We can also use reason and Scripture to understand.'}\n\nDIFFERENTIATION:\n- For advanced students: ${isYoung ? 'Let them help explain concepts to others.' : 'Have them research additional Scripture passages or CCC references.'}\n- For struggling students: ${isYoung ? 'Use more visuals and hands-on activities.' : 'Pair with a buddy, simplify discussion questions, focus on 1-2 key takeaways.'}\n\nTIMING:\n- If running short: Skip the review section and go straight to teaching.\n- If running long: Shorten the activity — key teaching content takes priority.`;

  return {
    welcome: welcomeText,
    openingPrayer,
    review: reviewText,
    teach: [
      {
        section: `Scripture Reading: ${scripture || 'Today\'s Passage'}`,
        duration: "10 min",
        instructions: isYoung
          ? `Read ${scripture || 'the lesson passage'} aloud to the children. Use a children's Bible if available. Read slowly and with expression. After reading:\n- Ask: "What happened in this story?"\n- Retell key points simply.\n- Connect to today's lesson: "${title}"`
          : `Have a student read ${scripture || 'today\'s passage'} aloud. ${isMid ? 'Follow along in your Bibles.' : 'Read it a second time silently.'} Then discuss:\n- What is the context of this passage?\n- What is the key message?\n- How does this connect to "${title}"?`,
        discussion: discussionQs.slice(0, 2),
        teacherAnswers: teacherAs.slice(0, 2),
      },
      {
        section: `Main Teaching: ${title}`,
        duration: "15 min",
        instructions: isYoung
          ? `Teaching the concept:\n1. Explain in simple words: ${objective}\n2. Use the ${materials[0] || 'textbook'} visual/story.\n3. Ask children to repeat key phrases after you.\n4. Use gestures or movements to reinforce the concept.\n5. Summarize: "Today we learned that ${objective.toLowerCase()}"`
          : `Core Teaching:\n1. Present the key concept: ${objective}\n2. Reference: ${lesson.cccParagraphs || 'the Catechism'}\n3. ${isMid ? 'Have students take notes on key points.' : 'Lead a guided discussion exploring the theological depth.'}\n4. Connect to daily life: "How does this matter for us TODAY?"\n5. Address any questions or misconceptions.`,
        discussion: discussionQs.slice(2),
        teacherAnswers: teacherAs.slice(2),
      },
    ],
    activity: {
      title: activities[0] || `${title} Activity`,
      duration: "15 min",
      instructions: activityInstructions,
      materials: materials.slice(1).join(", ") || "Paper, pencils, coloring supplies",
    },
    handout: {
      title: `${title} — Student Worksheet`,
      description: isYoung
        ? "Drawing, tracing, and simple questions for young learners"
        : isMid
        ? "Vocabulary, Scripture reflection, and personal response questions"
        : "Critical thinking, personal reflection, and prayer response",
      content: handoutContent,
    },
    closingPrayer,
    takeHome: lesson.takeHome || `Talk with your family about what you learned today: "${title}"`,
    teacherNotes,
  };
}

async function main() {
  console.log(`Generating lesson plans for ${gradeLevel}...`);

  const units = await prisma.curriculumUnit.findMany({
    where: { gradeLevel: gradeLevel as any },
    include: { lessons: { orderBy: { lessonNumber: "asc" } } },
    orderBy: { unitNumber: "asc" },
  });

  let count = 0;
  for (const unit of units) {
    for (const lesson of unit.lessons) {
      const plan = generatePlan(lesson, unit, gradeLevel);
      await prisma.lesson.update({
        where: { id: lesson.id },
        data: { lessonPlan: JSON.stringify(plan) },
      });
      count++;
      process.stdout.write(`  ${count}. ${lesson.title.substring(0, 50)}...\r`);
    }
  }

  console.log(`\nDone! Generated ${count} lesson plans for ${gradeLevel}.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
