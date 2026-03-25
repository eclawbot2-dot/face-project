import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const rawUrl = `file:${path.join(process.cwd(), "prisma", "dev.db")}`;
const adapter = new PrismaBetterSqlite3({ url: rawUrl });
const prisma = new PrismaClient({ adapter });

interface LessonData {
  title: string;
  objective: string;
  scriptureRef: string;
  cccParagraphs: string;
  materials: string[];
  activities: string[];
  prayerFocus: string;
  takeHome: string;
}

interface UnitData {
  title: string;
  description: string;
  cccReference: string;
  lessons: LessonData[];
}

interface GradeData {
  gradeLevel: string;
  program: string;
  units: UnitData[];
}

// ─── KINDERGARTEN: Christ Our Life — God Loves Us ───
const kindergarten: GradeData = {
  gradeLevel: "KINDERGARTEN",
  program: "Christ Our Life — God Loves Us (Loyola Press)",
  units: [
    {
      title: "God Made the World",
      description: "God created everything out of love — the world, animals, and people",
      cccReference: "CCC 282-301",
      lessons: [
        { title: "God Made Everything Beautiful", objective: "Recognize that God created the world and everything in it", scriptureRef: "Genesis 1:1-31", cccParagraphs: "CCC 282-289", materials: ["Christ Our Life K Ch. 1", "Crayons", "Nature pictures"], activities: ["Color creation scenes", "Nature walk discussion", "Creation song"], prayerFocus: "Thank you God for the beautiful world", takeHome: "Go on a walk and name 5 things God made" },
        { title: "God Made Me Special", objective: "Understand that each person is unique and loved by God", scriptureRef: "Psalm 139:13-14", cccParagraphs: "CCC 355-357", materials: ["Christ Our Life K Ch. 2", "Mirrors", "Self-portrait supplies"], activities: ["Draw self-portraits", "Name special things about each child", "Fingerprint art"], prayerFocus: "Thank you God for making me", takeHome: "Tell your family one special thing God gave you" },
        { title: "God Made Families", objective: "Know that God gives us families to love and care for us", scriptureRef: "Ephesians 3:14-15", cccParagraphs: "CCC 2201-2206", materials: ["Christ Our Life K Ch. 3", "Family photo activity", "Heart stickers"], activities: ["Draw your family", "Share family stories", "Family prayer cards"], prayerFocus: "Prayer for our families", takeHome: "Make a thank-you card for a family member" },
      ],
    },
    {
      title: "God Loves Us",
      description: "God's love is shown through Jesus and the people around us",
      cccReference: "CCC 218-221",
      lessons: [
        { title: "God Is Our Loving Father", objective: "Understand God as a loving Father who cares for us", scriptureRef: "Matthew 6:26-30", cccParagraphs: "CCC 238-242", materials: ["Christ Our Life K Ch. 4", "Cotton balls", "Heart craft"], activities: ["Heart wreath craft", "Story: The Good Shepherd", "Act out caring gestures"], prayerFocus: "Our Father prayer (simplified)", takeHome: "Practice saying 'God loves me' each morning" },
        { title: "God Gives Us Jesus", objective: "Know that Jesus is God's Son sent to show us love", scriptureRef: "John 3:16", cccParagraphs: "CCC 422-425", materials: ["Christ Our Life K Ch. 5", "Jesus pictures", "Star stickers"], activities: ["Christmas story retelling", "Star of Bethlehem craft", "Jesus loves me song"], prayerFocus: "Thank you God for sending Jesus", takeHome: "Look at a nativity scene and talk about baby Jesus" },
        { title: "Jesus Loves Children", objective: "Know that Jesus welcomes and loves all children", scriptureRef: "Mark 10:13-16", cccParagraphs: "CCC 1244", materials: ["Christ Our Life K Ch. 6", "Felt figures", "Coloring page"], activities: ["Act out Jesus blessing the children", "Draw yourself with Jesus", "Friendship bracelets"], prayerFocus: "Jesus, I know you love me", takeHome: "Tell someone that Jesus loves them" },
      ],
    },
    {
      title: "Jesus Teaches Us",
      description: "Jesus teaches us how to love God and love others",
      cccReference: "CCC 541-546",
      lessons: [
        { title: "Jesus Teaches Us to Pray", objective: "Learn that prayer is talking to God", scriptureRef: "Matthew 6:9-13", cccParagraphs: "CCC 2559-2565", materials: ["Christ Our Life K Ch. 7", "Prayer hands craft", "Quiet bell"], activities: ["Practice folding hands", "Simple prayer practice", "Prayer hands trace & cut"], prayerFocus: "Learning the Sign of the Cross", takeHome: "Pray before meals with your family this week" },
        { title: "Jesus Teaches Us to Be Kind", objective: "Understand that Jesus wants us to be kind to everyone", scriptureRef: "Luke 6:31", cccParagraphs: "CCC 1822-1829", materials: ["Christ Our Life K Ch. 8", "Kindness stickers", "Role-play cards"], activities: ["Kindness role-play scenarios", "Kindness chain links", "Share a compliment circle"], prayerFocus: "Jesus, help me be kind today", takeHome: "Do 3 kind things for others this week" },
        { title: "Jesus Teaches Us to Share", objective: "Learn that sharing shows God's love", scriptureRef: "John 6:1-14", cccParagraphs: "CCC 2402-2406", materials: ["Christ Our Life K Ch. 9", "Snack to share", "Loaves and fishes craft"], activities: ["Loaves and fishes story", "Sharing snack activity", "Draw what you can share"], prayerFocus: "Help me share with others", takeHome: "Share a toy or snack with a sibling or friend" },
      ],
    },
    {
      title: "Jesus Is Always with Us",
      description: "Jesus is with us in the Church and sacraments",
      cccReference: "CCC 1066-1075",
      lessons: [
        { title: "We Belong to God's Family — The Church", objective: "Know the Church is God's family gathered together", scriptureRef: "Acts 2:42-47", cccParagraphs: "CCC 751-752", materials: ["Christ Our Life K Ch. 10", "Church building craft", "People figures"], activities: ["Build a paper church", "Name people at our church", "We are the Church song"], prayerFocus: "Thank you for our Church family", takeHome: "Point out parts of the church building on Sunday" },
        { title: "We Celebrate at Mass", objective: "Understand Mass is when we gather to praise God together", scriptureRef: "Luke 22:19", cccParagraphs: "CCC 1322-1327", materials: ["Christ Our Life K Ch. 11", "Mass items pictures", "Coloring sheets"], activities: ["Practice Mass responses", "Color Mass items", "Pretend Mass procession"], prayerFocus: "Practice genuflecting and Sign of the Cross", takeHome: "Pay attention at Mass — what did you see and hear?" },
        { title: "Baptism Makes Us God's Children", objective: "Know that Baptism welcomes us into God's family", scriptureRef: "Matthew 28:19", cccParagraphs: "CCC 1213-1216", materials: ["Christ Our Life K Ch. 12", "Water and shell", "Baptism certificate craft"], activities: ["Water blessing demo", "Baptism role play", "Decorate baptism candle"], prayerFocus: "Renewal of baptismal promises (simplified)", takeHome: "Ask your parents about your Baptism day" },
      ],
    },
    {
      title: "God's Love Through the Year",
      description: "Following Jesus through the liturgical seasons",
      cccReference: "CCC 1163-1173",
      lessons: [
        { title: "Advent — Getting Ready for Jesus", objective: "Understand Advent as a time of joyful waiting", scriptureRef: "Isaiah 9:6", cccParagraphs: "CCC 524", materials: ["Christ Our Life K Seasonal", "Advent wreath supplies", "Purple/pink paper"], activities: ["Make mini Advent wreath", "Advent countdown calendar", "O Come Emmanuel song"], prayerFocus: "Come Lord Jesus", takeHome: "Light your family Advent wreath each night" },
        { title: "Christmas — Jesus Is Born", objective: "Celebrate the birth of Jesus", scriptureRef: "Luke 2:1-20", cccParagraphs: "CCC 525-526", materials: ["Christ Our Life K Seasonal", "Nativity figures", "Star craft"], activities: ["Nativity scene setup", "Shepherd/angel role play", "Birthday cake for Jesus"], prayerFocus: "Happy Birthday Jesus prayer", takeHome: "Read the Christmas story at home" },
        { title: "Lent — Growing Closer to Jesus", objective: "Learn Lent is a time to grow in love for God", scriptureRef: "Joel 2:12-13", cccParagraphs: "CCC 1438", materials: ["Christ Our Life K Seasonal", "Purple paper", "Sacrifice beans jar"], activities: ["Lenten sacrifice jar", "Acts of kindness chain", "Cross coloring"], prayerFocus: "Jesus, help me grow closer to you", takeHome: "Give up one thing this week to grow closer to Jesus" },
        { title: "Easter — Jesus Is Risen!", objective: "Celebrate that Jesus rose from the dead", scriptureRef: "Matthew 28:1-10", cccParagraphs: "CCC 638-640", materials: ["Christ Our Life K Seasonal", "Butterfly craft", "Empty tomb visual"], activities: ["Empty tomb craft", "Butterfly transformation", "Alleluia song and dance"], prayerFocus: "Alleluia! Jesus is alive!", takeHome: "Tell someone the Easter story" },
        { title: "Mary Our Mother", objective: "Know Mary as Jesus' mother and our heavenly mother", scriptureRef: "Luke 1:28-38", cccParagraphs: "CCC 484-489", materials: ["Christ Our Life K Ch. 13", "Mary picture", "Flower craft"], activities: ["Hail Mary practice", "May crowning flowers", "Draw Mary and Jesus"], prayerFocus: "Hail Mary (simplified)", takeHome: "Say a Hail Mary with your family before bed" },
        { title: "We Are Called to Love", objective: "Review: God made us, loves us, and we share that love", scriptureRef: "1 John 4:7-8", cccParagraphs: "CCC 1822-1829", materials: ["Christ Our Life K review", "Heart-shaped snack", "Certificate"], activities: ["Love chain activity", "Year review game", "Completion certificates"], prayerFocus: "Thank you God for this year together", takeHome: "Tell 3 people you love them" },
      ],
    },
    {
      title: "Saints and Holy People",
      description: "Learning from the saints who loved God",
      cccReference: "CCC 828, 956-957",
      lessons: [
        { title: "The Saints Are Our Friends", objective: "Know that saints are people who loved God and are in heaven", scriptureRef: "Hebrews 12:1", cccParagraphs: "CCC 828", materials: ["Christ Our Life K Saints", "Saint picture cards", "Crown craft"], activities: ["Saint matching game", "Crown of glory craft", "All Saints song"], prayerFocus: "Saints in heaven, pray for us", takeHome: "Look up the saint you are named after" },
        { title: "Saint Francis and God's Creation", objective: "Learn how St. Francis loved all God's creatures", scriptureRef: "Genesis 1:28", cccParagraphs: "CCC 2415-2418", materials: ["Christ Our Life K Saints", "Animal stickers", "Bird feeder supplies"], activities: ["St. Francis animal blessing", "Pinecone bird feeder", "Canticle of the Sun"], prayerFocus: "St. Francis peace prayer (simplified)", takeHome: "Be kind to an animal this week" },
        { title: "Angels Watch Over Us", objective: "Know that God sends angels to protect and guide us", scriptureRef: "Psalm 91:11", cccParagraphs: "CCC 328-336", materials: ["Christ Our Life K Ch. 14", "Angel craft supplies", "Glitter"], activities: ["Guardian angel craft", "Angel Gabriel story", "Angel prayer cards"], prayerFocus: "Angel of God prayer", takeHome: "Say the Guardian Angel prayer before bed" },
      ],
    },
  ],
};

// Helper to generate lessons for grades 1-7 using Christ Our Life
function generateCOLGrade(gradeLevel: string, gradeNum: string, bookTitle: string, units: { title: string; desc: string; ccc: string; lessons: { t: string; obj: string; sc: string; ccc: string; mat: string; act: string; pray: string; home: string }[] }[]): GradeData {
  return {
    gradeLevel,
    program: `Christ Our Life — ${bookTitle} (Loyola Press)`,
    units: units.map(u => ({
      title: u.title,
      description: u.desc,
      cccReference: u.ccc,
      lessons: u.lessons.map(l => ({
        title: l.t,
        objective: l.obj,
        scriptureRef: l.sc,
        cccParagraphs: l.ccc,
        materials: [`Christ Our Life ${gradeNum}`, ...l.mat.split("|").map(s => s.trim())],
        activities: l.act.split("|").map(s => s.trim()),
        prayerFocus: l.pray,
        takeHome: l.home,
      })),
    })),
  };
}

// ─── GRADE 1: God Is Good ───
const grade1 = generateCOLGrade("GRADE_1", "Gr. 1", "God Is Good", [
  { title: "God Is Our Creator", desc: "God created the world and all that is good", ccc: "CCC 282-301",
    lessons: [
      { t: "God Creates a Beautiful World", obj: "Appreciate God's creation and our role as caretakers", sc: "Genesis 1:1-2:3", ccc: "CCC 282-289", mat: "Ch. 1|Nature photos|Drawing supplies", act: "Creation timeline activity|Draw favorite creation|Creation prayer circle", pray: "Glory Be to the Father", home: "Draw a picture of your favorite part of creation" },
      { t: "God Creates People in His Image", obj: "Understand we are made in God's image and likeness", sc: "Genesis 1:26-27", ccc: "CCC 355-361", mat: "Ch. 2|Mirrors|Paper dolls", act: "Image of God discussion|Paper doll chain|Uniqueness sharing circle", pray: "Thank you God for making me in your image", home: "Name 3 ways you are like God (loving, creative, kind)" },
      { t: "God Gives Us the Gift of Life", obj: "Recognize life as a precious gift from God", sc: "Psalm 139:13-16", ccc: "CCC 1700-1703", mat: "Ch. 3|Baby photos|Gift box craft", act: "Life timeline activity|Gift box decorating|Life is a gift song", pray: "Prayer of thanksgiving for the gift of life", home: "Ask your parents to share your baby photos" },
      { t: "Adam and Eve — God's First Family", obj: "Learn the story of Adam and Eve in the Garden of Eden", sc: "Genesis 2:7-23", ccc: "CCC 369-373", mat: "Ch. 4|Garden scene backdrop|Felt figures", act: "Garden of Eden dramatic play|Name the animals game|Paradise mural", pray: "Thank you for the gift of family", home: "Take care of a plant or garden this week" },
    ]},
  { title: "God Gives Us Jesus", desc: "Jesus comes into the world as God's greatest gift", ccc: "CCC 422-463",
    lessons: [
      { t: "The Angel Visits Mary", obj: "Learn about the Annunciation and Mary's yes to God", sc: "Luke 1:26-38", ccc: "CCC 484-494", mat: "Ch. 5|Angel craft|Mary picture", act: "Annunciation role play|Angel Gabriel craft|Hail Mary practice", pray: "Hail Mary", home: "Say yes to something kind someone asks you to do" },
      { t: "Jesus Is Born in Bethlehem", obj: "Retell the story of Jesus' birth", sc: "Luke 2:1-20", ccc: "CCC 525-526", mat: "Ch. 6|Nativity set|Star of Bethlehem", act: "Nativity pageant practice|Shepherd story|Star ornament craft", pray: "Away in a Manger prayer", home: "Set up a nativity scene at home" },
      { t: "Jesus Grows Up in Nazareth", obj: "Understand that Jesus grew up in a family like us", sc: "Luke 2:39-52", ccc: "CCC 531-534", mat: "Ch. 7|Holy Family picture|Carpentry tools pictures", act: "Compare Jesus' childhood to ours|Holy Family drawing|Family chores discussion", pray: "Prayer for families", home: "Help with a family chore without being asked" },
      { t: "Jesus Is Baptized", obj: "Learn about Jesus' baptism and our own baptism", sc: "Matthew 3:13-17", ccc: "CCC 535-537", mat: "Ch. 8|Water|Baptism photos|Shell", act: "Baptism water blessing|Share baptism stories|Dove craft", pray: "Renewal of baptismal promises", home: "Ask when and where you were baptized" },
    ]},
  { title: "Jesus Teaches and Heals", desc: "Jesus shows God's love through his words and actions", ccc: "CCC 541-556",
    lessons: [
      { t: "Jesus the Good Shepherd", obj: "Understand that Jesus cares for us like a shepherd", sc: "John 10:11-14", ccc: "CCC 754", mat: "Ch. 9|Sheep craft|Shepherd staff", act: "Good Shepherd parable|Lost sheep counting game|Sheep cotton ball craft", pray: "The Lord is my Shepherd (Psalm 23)", home: "Take care of someone who needs help" },
      { t: "Jesus Feeds the 5,000", obj: "Learn that Jesus provides for our needs through generosity", sc: "John 6:1-14", ccc: "CCC 1335", mat: "Ch. 10|Bread|Fish crackers|Basket", act: "Loaves and fishes story|Sharing snack|Multiplication miracle mural", pray: "Grace before meals", home: "Share your lunch or snack with someone" },
      { t: "Jesus Heals the Sick", obj: "Know that Jesus healed people because he loved them", sc: "Mark 2:1-12", ccc: "CCC 1503-1505", mat: "Ch. 11|Bandages|Get well cards", act: "Healing stories drama|Make get well cards|Healing hands prayer", pray: "Prayer for the sick", home: "Make a card for someone who is sick" },
      { t: "Jesus Calms the Storm", obj: "Trust that Jesus is with us when we are afraid", sc: "Mark 4:35-41", ccc: "CCC 547", mat: "Ch. 12|Blue fabric|Paper boat", act: "Storm drama with sound effects|Paper boat craft|Trust discussion", pray: "Jesus, I trust in you", home: "When scared, say 'Jesus, I trust in you'" },
    ]},
  { title: "We Belong to God's Church", desc: "The Church is God's family where we worship together", ccc: "CCC 748-780",
    lessons: [
      { t: "The Church Is God's Family", obj: "Understand the Church as a community of believers", sc: "Acts 2:42-47", ccc: "CCC 751-757", mat: "Ch. 13|Church photos|People cutouts", act: "Church community collage|Name our parish family|We are the Church song", pray: "Prayer for our parish", home: "Greet 3 people at Mass by name" },
      { t: "We Celebrate Mass Together", obj: "Learn the basic parts of the Mass", sc: "Luke 22:19-20", ccc: "CCC 1345-1355", mat: "Ch. 14|Mass items|Response cards", act: "Practice Mass responses|Identify altar items|Mass walk-through", pray: "Practice responses: 'And with your spirit'", home: "Follow along at Mass using a children's missal" },
      { t: "The Bible Is God's Word", obj: "Know the Bible as God's special book for us", sc: "2 Timothy 3:16", ccc: "CCC 101-108", mat: "Ch. 15|Children's Bible|Bookmarks", act: "Bible exploration|Make Bible bookmarks|Favorite story sharing", pray: "Lord, open my ears to hear your Word", home: "Read a Bible story with your family" },
      { t: "The Ten Commandments — God's Rules for Love", obj: "Learn that God gave us commandments to help us love", sc: "Exodus 20:1-17", ccc: "CCC 2052-2074", mat: "Ch. 16|Stone tablets craft|Commandment cards", act: "Simplified commandments discussion|Stone tablets craft|Commandment matching game", pray: "Help me follow your rules, God", home: "Practice one commandment especially well this week" },
    ]},
  { title: "We Follow Jesus", desc: "Living as disciples of Jesus in our daily lives", ccc: "CCC 1691-1698",
    lessons: [
      { t: "The Great Commandment — Love God and Others", obj: "Know the two greatest commandments", sc: "Matthew 22:37-39", ccc: "CCC 2055", mat: "Ch. 17|Heart craft|Love poster", act: "Great Commandment song|Love hearts activity|Acts of love brainstorm", pray: "Jesus, help me love God and love others", home: "Do a secret act of love for a family member" },
      { t: "The Our Father — Jesus' Prayer", obj: "Learn and understand the Our Father prayer", sc: "Matthew 6:9-13", ccc: "CCC 2759-2776", mat: "Ch. 18|Our Father poster|Prayer hands", act: "Line-by-line Our Father learning|Prayer gestures|Our Father coloring page", pray: "Our Father", home: "Pray the Our Father with your family each night" },
      { t: "Being Peacemakers", obj: "Learn to be peacemakers like Jesus asks us to be", sc: "Matthew 5:9", ccc: "CCC 2302-2306", mat: "Ch. 19|Peace dove craft|Peace pledge", act: "Peace role-play scenarios|Dove craft|Sign a peace pledge", pray: "St. Francis Peace Prayer (simplified)", home: "Make peace with someone you've had trouble with" },
      { t: "We Are Called to Serve", obj: "Understand that Jesus calls us to serve others", sc: "Matthew 25:35-40", ccc: "CCC 1932-1933", mat: "Ch. 20|Service project supplies|Helper badges", act: "Plan a class service project|Helper badge making|Service brainstorm", pray: "Here I am Lord, I come to do your will", home: "Do a service project with your family" },
    ]},
  { title: "Liturgical Seasons and Review", desc: "Celebrating the Church year and reviewing what we learned", ccc: "CCC 1163-1173",
    lessons: [
      { t: "Advent — Preparing Our Hearts", obj: "Prepare for Christmas during the season of Advent", sc: "Isaiah 40:3", ccc: "CCC 524", mat: "Seasonal|Advent wreath|Purple candles", act: "Advent wreath ceremony|Jesse Tree activity|Advent calendar", pray: "Come Lord Jesus, come", home: "Add to your family Advent wreath or calendar daily" },
      { t: "Lent — Journey to Easter", obj: "Understand Lent as a time of prayer, fasting, and almsgiving", sc: "Matthew 6:1-6", ccc: "CCC 1434-1439", mat: "Seasonal|Lent cross|Sacrifice calendar", act: "Ash Wednesday discussion|Lenten sacrifice calendar|Stations of the Cross (simplified)", pray: "Create your own Lenten prayer", home: "Choose a Lenten sacrifice and stick with it" },
      { t: "Holy Week and Easter — Jesus Dies and Rises", obj: "Walk through Holy Week and celebrate the Resurrection", sc: "Matthew 28:1-10", ccc: "CCC 571-658", mat: "Seasonal|Palm branches|Easter lilies|Empty tomb craft", act: "Palm Sunday parade|Holy Thursday foot washing demo|Easter sunrise craft", pray: "Alleluia! He is risen!", home: "Attend Holy Week services with your family" },
      { t: "Year in Review — God Is Good!", obj: "Review all we have learned about God's love", sc: "Psalm 136:1", ccc: "CCC 1-3", mat: "Review|Certificates|Snack celebration", act: "Bible story relay race|Favorite lesson sharing|Year-end prayer service", pray: "Thank you God for all we have learned", home: "Share your favorite lesson with your family" },
    ]},
]);

// Helper function to create a full 24-lesson COL grade quickly
function quickGrade(gradeLevel: string, gradeNum: string, bookTitle: string, unitLessons: { unit: string; desc: string; ccc: string; lessons: string[][] }[]): GradeData {
  return {
    gradeLevel,
    program: `Christ Our Life — ${bookTitle} (Loyola Press)`,
    units: unitLessons.map(u => ({
      title: u.unit,
      description: u.desc,
      cccReference: u.ccc,
      lessons: u.lessons.map(l => ({
        title: l[0],
        objective: l[1],
        scriptureRef: l[2],
        cccParagraphs: l[3],
        materials: [`Christ Our Life ${gradeNum}`, l[4]],
        activities: l[5].split("|"),
        prayerFocus: l[6],
        takeHome: l[7],
      })),
    })),
  };
}

// ─── GRADE 2: God Cares for Us / First Communion Prep ───
const grade2 = quickGrade("GRADE_2", "Gr. 2", "God Cares for Us", [
  { unit: "God's Wonderful Plan", desc: "God created us out of love and has a plan for each of us", ccc: "CCC 1-25",
    lessons: [
      ["God Has a Plan for Us", "Know that God created us with a purpose", "Jeremiah 29:11", "CCC 1-3", "Ch. 1|Purpose worksheet", "God's plan discussion|Life purpose drawing|Prayer journaling", "God has a plan for me prayer", "Ask your parents what they prayed for when you were born"],
      ["The Bible Tells God's Story", "Understand the Bible as God's living Word", "Psalm 119:105", "CCC 101-141", "Ch. 2|Children's Bible|Bookmarks", "Bible treasure hunt|Old/New Testament sorting|Bible verse memorization", "Pray with Scripture", "Read a Bible story each night this week"],
      ["God Made Us to Know, Love, and Serve", "Learn the purpose of human life", "Deuteronomy 6:5", "CCC 1721-1724", "Ch. 3|Heart/Mind/Hands craft", "Three ways to love God activity|Service project planning|Gifts inventory", "Morning offering", "Do one act of service each day"],
    ]},
  { unit: "The Sacraments of Initiation", desc: "Baptism, Confirmation, and Eucharist welcome us into the Church", ccc: "CCC 1212-1274",
    lessons: [
      ["Baptism — Born into God's Family", "Understand Baptism as the first sacrament", "Romans 6:3-4", "CCC 1213-1274", "Ch. 4|Baptism symbols|Water|Candle|White garment", "Baptism symbols exploration|Baptismal promises review|Candle craft", "Renewal of baptismal promises", "Find your baptism certificate and candle at home"],
      ["We Prepare for First Reconciliation", "Learn the steps of the Sacrament of Reconciliation", "Luke 15:11-32", "CCC 1422-1498", "Ch. 5|Examination of conscience guide|Confession steps poster", "Prodigal Son dramatization|Practice confession steps|Examination of conscience", "Act of Contrition practice", "Practice the Act of Contrition at home"],
      ["Celebrating First Reconciliation", "Experience the joy of God's forgiveness", "1 John 1:9", "CCC 1440-1449", "Ch. 6|Reconciliation prep|Cross craft", "Mock confession walkthrough|Forgiveness letter writing|Peace prayer service", "Act of Contrition", "Go to Reconciliation with your family"],
    ]},
  { unit: "The Mass and the Eucharist", desc: "Understanding the Mass and preparing for First Holy Communion", ccc: "CCC 1322-1419",
    lessons: [
      ["The Last Supper", "Learn what happened at the Last Supper", "Luke 22:14-20", "CCC 1337-1340", "Ch. 7|Last Supper image|Bread|Grape juice", "Last Supper storytelling|Bread breaking ceremony|Eucharist discussion", "This is my Body prayer", "Read the Last Supper story at home"],
      ["The Parts of the Mass — Liturgy of the Word", "Learn the first part of Mass: readings and Gospel", "Nehemiah 8:2-3", "CCC 1346-1349", "Ch. 8|Mass guide|Response cards", "Practice Mass responses|Lectionary exploration|Gospel acclamation practice", "Alleluia verse", "Follow the readings at Mass this Sunday"],
      ["The Parts of the Mass — Liturgy of the Eucharist", "Learn the Eucharistic Prayer and Communion", "1 Corinthians 11:23-26", "CCC 1350-1372", "Ch. 9|Altar items|Communion practice", "Offertory walk-through|Consecration discussion|Communion procession practice", "Lamb of God", "Practice receiving Communion (arms crossed for blessing)"],
      ["The Real Presence of Jesus", "Believe that the bread and wine become Jesus' Body and Blood", "John 6:51-56", "CCC 1373-1381", "Ch. 10|Monstrance picture|Host visual", "Real Presence discussion|Tabernacle visit|Adoration experience", "Prayer before the Blessed Sacrament", "Visit Jesus in the tabernacle before or after Mass"],
      ["My First Holy Communion", "Prepare hearts and minds for receiving Jesus", "John 6:35", "CCC 1384-1390", "Ch. 11|First Communion banner|Special outfit discussion", "First Communion banner making|Communion meditation|Practice receiving", "Soul of Christ (Anima Christi simplified)", "Write a letter to Jesus about receiving Him for the first time"],
      ["Living the Eucharist", "Understand we are sent from Mass to live like Jesus", "Matthew 28:19-20", "CCC 1391-1401", "Ch. 12|Go in Peace poster|Service ideas", "Ite Missa Est discussion|Service project brainstorm|Thanksgiving prayer writing", "Prayer after Communion", "Do an act of service after Mass this Sunday"],
    ]},
  { unit: "Living as God's Children", desc: "Following the commandments and growing in virtue", ccc: "CCC 2052-2557",
    lessons: [
      ["The Ten Commandments — Loving God", "Learn Commandments 1-3 about loving God", "Exodus 20:1-11", "CCC 2083-2195", "Ch. 13|Commandment tablets|Matching game", "Commandments 1-3 skits|Matching game|Keep holy the Sabbath discussion", "Lord, help me put you first", "Keep Sunday holy this week — no screens during Mass"],
      ["The Ten Commandments — Loving Others", "Learn Commandments 4-10 about loving our neighbor", "Exodus 20:12-17", "CCC 2196-2557", "Ch. 14|Commandment cards|Scenario cards", "Commandments 4-10 scenarios|Good choices vs bad choices sorting|Commandment poster", "Help me love my neighbor", "Practice honoring your parents all week"],
      ["The Beatitudes — Happy with God", "Learn Jesus' recipe for true happiness", "Matthew 5:3-12", "CCC 1716-1717", "Ch. 15|Beatitudes simplified poster|Smiley craft", "Beatitudes matching|Peacemaker discussion|Happy hearts craft", "Beatitudes prayer", "Be a peacemaker at home and school"],
      ["Mary and the Saints Pray for Us", "Know we can ask Mary and the saints for help", "Luke 1:46-55", "CCC 956-962", "Ch. 16|Rosary|Saint cards|May flowers", "Hail Mary review|Saint biography sharing|May crowning preparation", "Hail Holy Queen", "Pray a decade of the Rosary with your family"],
      ["Advent and Christmas", "Prepare for and celebrate Jesus' birth", "Luke 1:26-38; 2:1-20", "CCC 524-526", "Seasonal|Advent wreath|O Antiphons cards", "Advent wreath lighting|Christmas pageant prep|Gift for Jesus writing", "O Come O Come Emmanuel", "Light your Advent wreath and pray together nightly"],
      ["Lent, Holy Week, and Easter", "Journey through Lent to the joy of Easter", "Matthew 26-28", "CCC 571-658", "Seasonal|Stations visuals|Easter garden", "Stations of the Cross walk|Easter garden craft|Resurrection eggs", "Stations of the Cross prayer", "Walk the Stations of the Cross at your parish"],
    ]},
]);

// ─── GRADES 3-7 (condensed but complete 24 lessons each) ───
const grade3 = quickGrade("GRADE_3", "Gr. 3", "We Believe", [
  { unit: "God Reveals Himself", desc: "God reveals Himself through creation, Scripture, and Jesus", ccc: "CCC 50-141",
    lessons: [
      ["God Speaks to Us", "Know that God reveals Himself in many ways", "Hebrews 1:1-2", "CCC 50-67", "Ch. 1|Bible|Nature photos", "Revelation discussion|Ways God speaks activity|Prayer journal start", "Speak Lord, your servant is listening", "Listen for God this week in nature, prayer, and Scripture"],
      ["The Holy Trinity", "Understand God as Father, Son, and Holy Spirit", "Matthew 28:19", "CCC 232-267", "Ch. 2|Trinity shamrock|Triangle craft", "Shamrock Trinity visual|Three-leaf craft|Trinity prayer", "Glory Be", "Explain the Trinity to a family member using the shamrock"],
      ["The Old Testament — God's Covenant", "Learn about God's covenant with Abraham and Moses", "Genesis 12:1-3", "CCC 59-64", "Ch. 3|Map of Abraham's journey|Covenant craft", "Abraham's journey map|Covenant bracelet|10 Commandments review", "Prayer of Abraham", "Read Genesis 12 with your family"],
      ["The New Testament — The Good News", "Understand the Gospels as the heart of Scripture", "Mark 1:1", "CCC 124-127", "Ch. 4|Four Gospels overview|Evangelist symbols", "Gospel authors matching|Evangelist symbols craft|Favorite Gospel story", "Gospel Acclamation", "Read a different Gospel passage each night"],
    ]},
  { unit: "Jesus Christ — Our Lord", desc: "The life, death, and resurrection of Jesus", ccc: "CCC 422-682",
    lessons: [
      ["Jesus' Public Ministry", "Learn about Jesus' teaching and miracles", "Matthew 4:23", "CCC 541-546", "Ch. 5|Miracle cards|Map of Galilee", "Miracle jigsaw activity|Parable discussion|Walking with Jesus map", "Jesus, I want to follow you", "Read one miracle story each day this week"],
      ["The Paschal Mystery — Jesus Saves Us", "Understand Jesus' suffering, death, and resurrection", "1 Corinthians 15:3-4", "CCC 571-658", "Ch. 6|Cross|Empty tomb visual", "Stations walkthrough|Easter story timeline|Salvation discussion", "We adore you O Christ and we bless you", "Pray the Stations with your family during Lent"],
      ["Jesus Sends the Holy Spirit", "Learn about Pentecost and the gift of the Spirit", "Acts 2:1-4", "CCC 731-741", "Ch. 7|Flame craft|Wind sounds", "Pentecost dramatization|Gifts of the Spirit discussion|Flame headband craft", "Come Holy Spirit", "Ask the Holy Spirit for help each morning"],
      ["The Church Continues Jesus' Mission", "Know the Church carries on Jesus' work today", "Matthew 28:18-20", "CCC 748-780", "Ch. 8|Parish photos|Mission poster", "Parish ministry exploration|Missionary stories|Service project planning", "Prayer for the Church", "Learn about one parish ministry this week"],
    ]},
  { unit: "The Sacraments — Signs of Grace", desc: "Understanding the seven sacraments", ccc: "CCC 1113-1666",
    lessons: [
      ["Sacraments of Initiation", "Review Baptism, Confirmation, and Eucharist", "Acts 2:38-42", "CCC 1212-1419", "Ch. 9|Sacrament symbols|Water/Oil/Bread", "Sacrament symbol matching|Initiation timeline|Grace discussion", "Prayer of thanksgiving for the sacraments", "Name the 3 Sacraments of Initiation from memory"],
      ["Sacraments of Healing", "Learn about Reconciliation and Anointing of the Sick", "James 5:14-15", "CCC 1420-1532", "Ch. 10|Oil|Confession guide", "Reconciliation review|Anointing of the Sick discussion|Healing prayer service", "Act of Contrition", "Go to Reconciliation this month"],
      ["Sacraments of Service", "Learn about Holy Orders and Matrimony", "Ephesians 5:31-32", "CCC 1533-1666", "Ch. 11|Vocation pictures|Interview questions", "Priest/deacon/married couple Q&A prep|Vocation prayer|Service discussion", "Prayer for vocations", "Ask a married couple or priest about their vocation"],
      ["Grace — God's Gift", "Understand grace as God's free gift that helps us be holy", "Ephesians 2:8-9", "CCC 1996-2005", "Ch. 12|Gift box visual|Grace discussion", "Grace vs. works discussion|Grace in daily life examples|Thank you prayer", "Prayer for grace", "Notice moments of grace this week"],
    ]},
  { unit: "Morality and Prayer", desc: "Living the moral life and growing in prayer", ccc: "CCC 1691-2557",
    lessons: [
      ["Conscience — God's Voice Within", "Learn what conscience is and how to form it", "Romans 2:15", "CCC 1776-1802", "Ch. 13|Conscience scenarios|Decision tree", "Conscience role plays|Good vs. bad choices sorting|Examination practice", "Examine my conscience prayer", "Do an examination of conscience before bed each night"],
      ["The Beatitudes — Road to Happiness", "Understand the Beatitudes as Jesus' path to true joy", "Matthew 5:3-12", "CCC 1716-1729", "Ch. 14|Beatitudes poster|Scenario cards", "Beatitudes matching game|Modern examples discussion|Beatitude living pledge", "Beatitudes prayer", "Live one Beatitude each day this week"],
      ["Prayer — Talking and Listening to God", "Learn different forms of prayer", "1 Thessalonians 5:17", "CCC 2559-2649", "Ch. 15|Prayer forms chart|Prayer corner setup", "Four types of prayer activity|Create a prayer corner|Prayer journal", "Teach us to pray, Lord", "Set up a prayer corner at home"],
      ["The Rosary — Praying with Mary", "Learn to pray the Rosary", "Luke 1:28", "CCC 2708", "Ch. 16|Rosary beads|Mystery cards", "Rosary instruction|Mystery matching|Class Rosary prayer", "One decade of the Rosary", "Pray one decade of the Rosary with your family each night"],
    ]},
  { unit: "The Church Year and Saints", desc: "Celebrating the liturgical year and learning from the saints", ccc: "CCC 1163-1178",
    lessons: [
      ["The Liturgical Year", "Learn the seasons of the Church year", "Ecclesiastes 3:1", "CCC 1163-1173", "Ch. 17|Liturgical calendar|Color wheel", "Liturgical color matching|Church year wheel craft|Season identification", "Prayer for each liturgical season", "Identify the current liturgical season and its color"],
      ["Advent and Christmas", "Prepare for and celebrate the Incarnation", "Isaiah 7:14; Luke 2:1-20", "CCC 524-526", "Seasonal|Advent wreath|Jesse Tree", "Advent wreath ceremony|Jesse Tree ornaments|Christmas carol theology", "O Come Divine Messiah", "Add an ornament to your Jesse Tree each day"],
      ["Lent and Easter", "Journey through the Paschal Mystery", "Matthew 26-28; Mark 14-16", "CCC 1168-1169", "Seasonal|Lenten cross|Rice bowls", "Lenten almsgiving project|Stations of the Cross|Easter vigil discussion", "Way of the Cross prayers", "Participate in your parish Stations of the Cross"],
      ["The Communion of Saints", "Know we are connected to the saints in heaven", "Hebrews 12:1", "CCC 946-962", "Ch. 18|Saint biographies|Saint report template", "Saint biography presentations|Patron saint research|Saints matching game", "Litany of the Saints", "Research your patron saint and share with the class next week"],
    ]},
  { unit: "Called to Serve and Review", desc: "Living our faith and serving others like Jesus", ccc: "CCC 1877-1948",
    lessons: [
      ["Works of Mercy", "Learn the Corporal and Spiritual Works of Mercy", "Matthew 25:35-40", "CCC 2447", "Ch. 19|Works of Mercy cards|Service plan", "Works of Mercy matching|Service project execution|Mercy reflection", "Lord, make me an instrument of your mercy", "Perform one Work of Mercy each day this week"],
      ["Catholic Social Teaching", "Introduction to caring for others and the common good", "Micah 6:8", "CCC 1928-1942", "Ch. 20|CST principles simplified|News clippings", "Justice and fairness discussion|Common good brainstorm|Prayer for the poor", "Prayer for justice and peace", "Notice where people need help in your community"],
      ["Missionary Disciples", "Understand we are all called to share our faith", "Matthew 28:19-20", "CCC 849-856", "Ch. 21|Mission cross|World map", "Share your faith practice|Missionary stories|Faith sharing pledge", "Prayer for missionaries", "Share something you learned about God with a friend"],
      ["Year Review — We Believe!", "Celebrate and review the year's learning", "Joshua 24:15", "CCC 1-3", "Review|Certificates|Celebration snacks", "Faith quiz game|Favorite memory sharing|Year-end prayer service with families", "Profession of Faith", "Share 3 things you learned about your faith this year"],
    ]},
]);

// Grades 4-7 follow the same structure
const grade4 = quickGrade("GRADE_4", "Gr. 4", "We Are God's People", [
  { unit: "The Early Church", desc: "From Pentecost to the spread of Christianity", ccc: "CCC 748-810", lessons: [
    ["The Church Is Born at Pentecost", "Understand Pentecost as the birthday of the Church", "Acts 2:1-41", "CCC 731-741", "Ch. 1|Flame visual|Wind effects", "Pentecost drama|Gifts of the Spirit discussion|Birthday celebration for the Church", "Come Holy Spirit prayer", "Read Acts chapter 2 with your family"],
    ["Peter and Paul — Pillars of the Church", "Learn about the roles of Peter and Paul", "Matthew 16:18; Acts 9:1-19", "CCC 552-553, 442", "Ch. 2|Peter/Paul biographies|Map", "Peter the Rock discussion|Paul's conversion drama|Apostle timeline", "Prayer to St. Peter and St. Paul", "Read about Peter or Paul in Acts"],
    ["The Early Christians", "Learn how the first Christians lived and worshipped", "Acts 2:42-47", "CCC 1329-1332", "Ch. 3|Early Church images|Agape meal", "Breaking bread activity|Community life discussion|Persecution stories", "Prayer of the early Church", "Practice one way the early Christians lived"],
    ["The Church Grows", "Trace how Christianity spread throughout the Roman Empire", "Matthew 28:19-20", "CCC 849-856", "Ch. 4|Roman Empire map|Mission routes", "Map the missionary journeys|Martyr stories|Letter writing like Paul", "Prayer for the growth of the Church", "Find your parish on a map and learn its history"],
  ]},
  { unit: "The Old Testament Story", desc: "God's covenant people from Abraham to the prophets", ccc: "CCC 54-73", lessons: [
    ["Abraham — Father of Faith", "Learn about Abraham's covenant with God", "Genesis 12:1-3; 15:1-6", "CCC 59-61", "Ch. 5|Star sand visual|Covenant craft", "Abraham's journey timeline|Star counting activity|Covenant promises", "Prayer of Abraham", "Count the stars tonight and remember God's promise"],
    ["Moses and the Exodus", "Understand God's liberation of His people from slavery", "Exodus 3:1-14; 14:21-31", "CCC 62-64", "Ch. 6|Burning bush craft|Red Sea visual", "Exodus drama|Ten Commandments tablets|Freedom discussion", "Song of Moses", "Discuss with your family: what does freedom mean?"],
    ["King David and the Psalms", "Learn about David as king and psalm writer", "1 Samuel 16:1-13; Psalm 23", "CCC 2579", "Ch. 7|Harp craft|Psalm 23 poster", "Psalm 23 meditation|David and Goliath drama|Write your own psalm", "Psalm 23 prayer", "Write your own psalm of praise to God"],
    ["The Prophets Speak God's Word", "Understand the role of prophets in salvation history", "Isaiah 1:17; Jeremiah 1:4-10", "CCC 64, 702", "Ch. 8|Prophet cards|Megaphone craft", "Prophet role play|Justice discussion|Modern prophets brainstorm", "Lord, help me speak your truth", "Stand up for what is right this week"],
  ]},
  { unit: "Jesus Fulfills God's Promise", desc: "Jesus as the fulfillment of Old Testament prophecy", ccc: "CCC 422-682", lessons: [
    ["The Promised Messiah", "Connect OT prophecies to Jesus", "Isaiah 7:14; 9:6; Micah 5:2", "CCC 484-486", "Ch. 9|Prophecy matching cards|Timeline", "Prophecy scavenger hunt|OT/NT connection mapping|Messiah discussion", "Come Lord Jesus", "Find 3 OT prophecies about Jesus"],
    ["Jesus' Parables — Stories with a Message", "Analyze key parables and their meanings", "Luke 15:1-32", "CCC 546", "Ch. 10|Parable cards|Story props", "Parable skits|Modern parable writing|Prodigal Son reflection", "Lord, open my heart to your Word", "Tell a parable to your family in your own words"],
    ["The Sermon on the Mount", "Study Jesus' core teaching from Matthew 5-7", "Matthew 5-7", "CCC 1716-1729", "Ch. 11|Beatitudes poster|Salt/Light visuals", "Beatitudes deep dive|Salt and light experiment|Lord's Prayer breakdown", "The Lord's Prayer (slowly, meditatively)", "Read Matthew chapters 5-7 over three days"],
    ["Jesus' Miracles — Signs of God's Power", "Understand miracles as signs pointing to God", "John 2:1-11; Mark 5:21-43", "CCC 547-550", "Ch. 12|Miracle timeline|Faith reflection", "Miracle categorization|Faith discussion|Where do you see God working today?", "Lord, increase my faith", "Look for everyday miracles this week"],
  ]},
  { unit: "Sacraments and Grace", desc: "Deepening understanding of sacramental life", ccc: "CCC 1113-1666", lessons: [
    ["Baptism and Confirmation Deep Dive", "Explore the theology of initiation sacraments", "Romans 6:3-11; Acts 8:14-17", "CCC 1213-1321", "Ch. 13|Baptism/Confirmation symbols|Oil", "Symbol exploration|Sponsor discussion|Confirmation gifts review", "Prayer to the Holy Spirit", "Interview someone about their Confirmation experience"],
    ["The Eucharist — Source and Summit", "Understand the Eucharist as the center of Catholic life", "John 6:35-58", "CCC 1322-1419", "Ch. 14|Eucharistic symbols|Adoration prep", "Eucharistic theology discussion|Adoration visit|Thanksgiving journal", "Anima Christi", "Spend 10 minutes in Eucharistic Adoration"],
    ["Reconciliation and Anointing", "Explore the healing sacraments more deeply", "Luke 5:17-26; James 5:14-15", "CCC 1420-1532", "Ch. 15|Examination guide|Oil of the Sick info", "Examination of conscience practice|Healing stories|Forgiveness reflection", "Act of Contrition", "Go to Reconciliation and pray for the sick"],
    ["Marriage and Holy Orders", "Understand vocations of service to the Church", "Genesis 2:24; Hebrews 5:1-6", "CCC 1533-1666", "Ch. 16|Vocation posters|Interview questions", "Vocation panel discussion|Wedding/Ordination comparison|Vocation prayer", "Prayer for vocations", "Pray for priests and married couples this week"],
  ]},
  { unit: "Morality and Discipleship", desc: "Making moral decisions and living as disciples", ccc: "CCC 1691-2051", lessons: [
    ["Forming a Good Conscience", "Learn how to form and follow conscience properly", "Romans 2:15; Sirach 15:14", "CCC 1776-1802", "Ch. 17|Decision tree|Scenario cards", "Conscience formation steps|Moral dilemma discussions|Decision-making practice", "Prayer for wisdom", "Practice examining your conscience each night"],
    ["The Virtues — Building Good Character", "Learn about cardinal and theological virtues", "1 Corinthians 13:13; Wisdom 8:7", "CCC 1803-1845", "Ch. 18|Virtue cards|Character poster", "Virtue identification game|Virtue in action scenarios|Virtue goal setting", "Prayer for virtue", "Choose one virtue to practice intentionally this week"],
    ["Sin, Forgiveness, and Mercy", "Understand sin, its effects, and God's abundant mercy", "Psalm 51; Luke 15:11-32", "CCC 1846-1876", "Ch. 19|Reconciliation prep|Mercy cross", "Types of sin discussion|Forgiveness reflection|Mercy project planning", "Psalm 51 (Have mercy on me O God)", "Reconciliation visit and acts of mercy"],
    ["Saints Who Changed the World", "Learn from saints who lived heroic virtue", "Hebrews 11:1-12:1", "CCC 828, 946-962", "Ch. 20|Saint biographies|Report template", "Saint biography presentations|Patron saint selection|Saints trivia", "Litany of Saints", "Complete a saint report for next week"],
  ]},
  { unit: "Liturgical Year and Review", desc: "Living the Church year and reviewing the faith", ccc: "CCC 1163-1178", lessons: [
    ["Advent — The Jesse Tree", "Trace salvation history through Advent using the Jesse Tree", "Isaiah 11:1-2", "CCC 524", "Seasonal|Jesse Tree|Ornament supplies", "Jesse Tree ornament making|Daily Scripture readings|Advent prayer service", "O Come O Come Emmanuel", "Add Jesse Tree ornaments daily through Advent"],
    ["Lent — Walking the Way of the Cross", "Experience Lent through the Stations of the Cross", "Luke 23:26-49", "CCC 1168-1169", "Seasonal|Stations posters|Prayer booklets", "Full Stations of the Cross|Lenten sacrifice commitment|Almsgiving project", "Stations of the Cross prayers", "Attend Stations of the Cross at your parish each Friday"],
    ["Easter — He Is Risen!", "Celebrate the Resurrection and its meaning for us", "John 20:1-18", "CCC 638-658", "Seasonal|Easter garden|Alleluia banner", "Empty tomb exploration|Resurrection appearances|Easter Alleluia celebration", "Regina Caeli", "Celebrate the 50 days of Easter with daily Alleluias"],
    ["Year Review — We Are God's People", "Review and celebrate the year's faith formation", "Deuteronomy 26:17-18", "CCC 781-786", "Review|Awards|Celebration supplies", "Faith bowl game|Portfolio sharing|Year-end Mass and celebration", "Te Deum", "Share your faith journey with your family"],
  ]},
]);

// Grades 5-7 similar structure (24 lessons each)
const grade5 = quickGrade("GRADE_5", "Gr. 5", "We Worship", [
  { unit: "God's Revelation", desc: "Scripture and Tradition as sources of faith", ccc: "CCC 50-141", lessons: [
    ["Divine Revelation — God Makes Himself Known", "Understand how God reveals Himself through Scripture and Tradition", "Dei Verbum; 2 Tim 3:16", "CCC 50-73", "Ch. 1|Bible|Tradition examples", "Scripture vs Tradition discussion|Revelation timeline|Deposit of Faith", "Come Holy Spirit, guide us to truth", "Read the Catechism section on Revelation"],
    ["The Canon of Scripture", "Learn how the Bible was formed and its structure", "2 Peter 1:20-21", "CCC 101-141", "Ch. 2|Bible structure chart|Book sorting", "Bible book sorting game|OT/NT structure|Inspired Word discussion", "Lord, open the Scriptures to me", "Memorize the books of the Pentateuch"],
    ["Interpreting Scripture", "Learn how Catholics read and interpret the Bible", "Nehemiah 8:8", "CCC 109-119", "Ch. 3|Scripture commentary|Context examples", "Literal vs spiritual senses|Cultural context activity|Lectio Divina intro", "Lectio Divina practice", "Practice Lectio Divina with a Gospel passage"],
    ["The Creed — What We Believe", "Explore the Nicene Creed as a summary of faith", "Nicene Creed", "CCC 185-197", "Ch. 4|Creed poster|Phrase cards", "Creed phrase-by-phrase study|Creed matching|Personal creed writing", "Nicene Creed (pray slowly)", "Memorize the Nicene Creed"],
  ]},
  { unit: "The Sacraments — Deep Dive", desc: "Theology and practice of the seven sacraments", ccc: "CCC 1113-1666", lessons: [
    ["Sacraments as Encounters with Christ", "Understand sacraments as real encounters with Jesus", "CCC 1113-1134", "CCC 1113-1134", "Ch. 5|Sacrament symbol set|Encounter stories", "Sacrament as encounter discussion|Visible signs/invisible grace|Personal encounter stories", "Lord, meet me in the sacraments", "Receive a sacrament this week with new awareness"],
    ["The Eucharist — Real Presence", "Deepen understanding of transubstantiation", "John 6:51-58; CCC 1373-1381", "CCC 1373-1381", "Ch. 6|Eucharistic miracle stories|Monstrance image", "Eucharistic miracle stories|Real Presence discussion|Adoration experience", "O Sacrament Most Holy", "Attend Eucharistic Adoration for 15 minutes"],
    ["Reconciliation — The Sacrament of Mercy", "Explore the depth of God's mercy in Confession", "Luke 15:1-32; CCC 1422-1498", "CCC 1422-1498", "Ch. 7|Examination of conscience (age-appropriate)|Confession guide", "Prodigal Son deep dive|Examination of conscience practice|Mercy discussion", "Divine Mercy Chaplet", "Go to Confession and pray the Divine Mercy Chaplet"],
    ["Vocations — Called by God", "Explore how God calls each person to a vocation", "1 Samuel 3:1-10; Jeremiah 1:5", "CCC 871-945", "Ch. 8|Vocation stories|Discernment quiz", "Vocation panel or video|Discernment discussion|Letter to future self", "Prayer for vocations", "Pray for your future vocation this week"],
  ]},
  { unit: "Morality and Virtue", desc: "Catholic moral teaching and the virtuous life", ccc: "CCC 1691-2051", lessons: [
    ["Natural Law and Moral Truth", "Understand natural law written on our hearts", "Romans 2:14-15", "CCC 1954-1960", "Ch. 9|Natural law examples|Discussion cards", "Natural law discussion|Universal moral truths activity|Conscience and natural law", "Lord, write your law on my heart", "Identify 3 moral truths everyone knows"],
    ["The Cardinal Virtues", "Study prudence, justice, fortitude, and temperance", "Wisdom 8:7", "CCC 1805-1809", "Ch. 10|Virtue cards|Scenario practice", "Cardinal virtue deep dives|Virtue in action scenarios|Virtue growth plan", "Prayer for the cardinal virtues", "Practice one cardinal virtue each day"],
    ["The Theological Virtues", "Deepen understanding of faith, hope, and charity", "1 Corinthians 13:13", "CCC 1812-1829", "Ch. 11|Faith/Hope/Love symbols|Reflection journal", "Theological virtue exploration|Faith/Hope/Love in Scripture|Charity project planning", "Act of Faith, Hope, and Love", "Memorize the Acts of Faith, Hope, and Love"],
    ["Catholic Social Teaching", "Study the seven themes of Catholic Social Teaching", "Micah 6:8; Matthew 25:31-46", "CCC 1928-1948", "Ch. 12|CST principles posters|News analysis", "CST principles overview|Current events through CST lens|Social action project", "Prayer for justice and peace", "Identify a social issue and research the Church's teaching"],
  ]},
  { unit: "Prayer and Worship", desc: "Growing in prayer and liturgical life", ccc: "CCC 2558-2865", lessons: [
    ["Forms of Prayer", "Study the five forms of prayer: blessing, petition, intercession, thanksgiving, praise", "CCC 2626-2649", "CCC 2626-2649", "Ch. 13|Prayer form cards|Prayer journal", "Five forms identification|Prayer writing practice|Class prayer book creation", "Practice each form of prayer", "Write one prayer in each of the five forms"],
    ["The Liturgy of the Hours", "Introduction to the Church's daily prayer", "Psalm 119:164", "CCC 1174-1178", "Ch. 14|Breviary|Morning/Evening prayer texts", "Morning Prayer experience|Psalms exploration|Evening Prayer practice", "Morning Prayer (Lauds)", "Pray Morning Prayer each day this week"],
    ["The Rosary — Mysteries of Christ", "Pray all four sets of mysteries", "Luke 1:28; CCC 2708", "CCC 2678, 2708", "Ch. 15|Rosary beads|Mystery meditation cards", "Full Rosary instruction|Mystery meditation|Rosary craft", "Full Rosary (one set of mysteries)", "Pray one set of mysteries each day Mon-Sat"],
    ["Liturgical Year Deep Dive", "Explore each liturgical season's meaning", "CCC 1163-1173", "CCC 1163-1173", "Ch. 16|Liturgical year wheel|Season research", "Liturgical season presentations|Season symbol matching|Year planning", "Prayer for the current season", "Create a liturgical year display for your home"],
  ]},
  { unit: "Church History and Mission", desc: "The Church through the ages and its mission today", ccc: "CCC 748-870", lessons: [
    ["The Early Church to Constantine", "Trace the Church from Pentecost through legalization", "Acts 1-2; Edict of Milan", "CCC 760-769", "Ch. 17|Timeline|Map of spread", "Early Church timeline|Persecution stories|Constantine discussion", "Prayer of the early martyrs", "Research one early Church martyr"],
    ["The Church in the Middle Ages", "Learn about monasticism, the cathedrals, and the saints", "Rule of St. Benedict", "CCC 916-933", "Ch. 18|Cathedral images|Monastic schedule", "Medieval Church stations|Cathedral architecture|Monastery daily life", "Prayer of St. Benedict", "Visit a cathedral or monastery (or virtual tour)"],
    ["The Church in the Modern World", "Vatican II and the Church today", "Gaudium et Spes", "CCC 770-780", "Ch. 19|Vatican II documents|Pope photos", "Vatican II changes discussion|Modern Church challenges|Evangelization today", "Prayer for the Church in the modern world", "Learn about one Vatican II document"],
    ["Called to Be Missionary Disciples", "Understand our call to evangelize", "Matthew 28:19-20; EG 1", "CCC 849-856", "Ch. 20|Mission cross|Evangelization cards", "Missionary stories|Personal witness practice|Faith sharing tools", "Prayer of St. Francis Xavier", "Share your faith with one person this week"],
  ]},
  { unit: "Liturgical Seasons and Review", desc: "Celebrating the Church year and year-end review", ccc: "CCC 1168-1173", lessons: [
    ["Advent — Prophets and Promise", "Explore Advent through the prophets", "Isaiah 40:1-5; Malachi 3:1", "CCC 522-524", "Seasonal|Advent wreath|Prophet readings", "Advent prophet study|O Antiphons|Advent reconciliation", "O Antiphons", "Pray one O Antiphon each day of the last week of Advent"],
    ["Lent — Conversion and Sacrifice", "Embrace Lent as a season of conversion", "Joel 2:12-13; Matthew 4:1-11", "CCC 538-540, 1434-1439", "Seasonal|Lenten plan|Almsgiving project", "Lenten plan creation|Desert experience reflection|Almsgiving project execution", "Prayer of St. Ignatius (Suscipe)", "Complete your Lenten plan faithfully"],
    ["Triduum and Easter", "Experience the Sacred Triduum and celebrate Easter", "John 13-20", "CCC 1168-1169", "Seasonal|Triduum guide|Easter candle", "Holy Thursday service|Good Friday reflection|Easter Vigil discussion", "Exsultet reflection", "Attend all three Triduum liturgies"],
    ["Year Review — We Worship!", "Review and celebrate all we have learned", "Psalm 150", "CCC summary", "Review|Portfolios|Celebration", "Faith knowledge challenge|Testimony sharing|Commissioning prayer service", "Magnificat", "Write a letter to God about what you learned"],
  ]},
]);

const grade6 = quickGrade("GRADE_6", "Gr. 6", "We Live", [
  { unit: "Created in God's Image", desc: "Human dignity and the moral life", ccc: "CCC 1700-1876", lessons: [
    ["Human Dignity", "Understand every person has inherent dignity from God", "Genesis 1:27", "CCC 1700-1715", "Ch. 1|Dignity scenarios|Mirror activity", "Image of God discussion|Dignity in action scenarios|Respect pledge", "Lord, help me see your image in everyone", "Notice and affirm the dignity of 5 people this week"],
    ["Freedom and Responsibility", "Learn that true freedom includes moral responsibility", "Galatians 5:13-14", "CCC 1730-1748", "Ch. 2|Freedom scenarios|Choice tree", "Freedom vs. license discussion|Responsible choices activity|Consequence reflection", "Prayer for wise choices", "Make one difficult but right choice each day"],
    ["The Moral Law", "Study natural law, revealed law, and Church teaching", "Romans 2:14-15; CCC 1950-1986", "CCC 1949-1986", "Ch. 3|Law categories chart|Case studies", "Types of moral law|Case study analysis|Moral reasoning practice", "Psalm 19 (The law of the Lord is perfect)", "Discuss a moral issue with your family using Church teaching"],
    ["Sin and Its Effects", "Understand the reality of sin and its consequences", "Romans 3:23; Genesis 3", "CCC 1846-1876", "Ch. 4|Sin/Grace visual|Reconciliation prep", "Original sin discussion|Mortal vs venial sin|Effects of sin activity", "Act of Contrition", "Go to Reconciliation this month"],
  ]},
  { unit: "The Ten Commandments — Part 1", desc: "Commandments 1-3: Loving God", ccc: "CCC 2083-2195", lessons: [
    ["I Am the Lord Your God (1st Commandment)", "Put God first in all things", "Exodus 20:2-6; Matthew 4:10", "CCC 2083-2141", "Ch. 5|Idols discussion|Priority list", "Modern idols identification|Priority pyramid|Faith commitment", "Lord, you alone are my God", "Identify and remove one 'idol' from your life"],
    ["The Lord's Name Is Holy (2nd Commandment)", "Respect God's name and keep oaths", "Exodus 20:7; Matthew 5:33-37", "CCC 2142-2167", "Ch. 6|Name of God study|Oath discussion", "Names of God in Scripture|Reverence practice|Oath and promise keeping", "Blessed be the name of the Lord", "Be mindful of how you use God's name"],
    ["Keep Holy the Lord's Day (3rd Commandment)", "Understand Sunday as the Lord's Day", "Exodus 20:8-11; Mark 2:27", "CCC 2168-2195", "Ch. 7|Sabbath rest discussion|Mass preparation", "Sabbath history|Sunday as resurrection day|Mass participation review", "Lord, this day is yours", "Make Sunday special — no homework, extra family time"],
    ["The Commandments in Daily Life", "Apply the first three commandments practically", "Deuteronomy 6:4-9", "CCC 2083-2195 review", "Ch. 8 review|Scenario cards|Self-assessment", "Real-life scenario discussions|Self-assessment quiz|Commitment card", "Shema Israel", "Live the first 3 commandments intentionally this week"],
  ]},
  { unit: "The Ten Commandments — Part 2", desc: "Commandments 4-10: Loving neighbor", ccc: "CCC 2196-2557", lessons: [
    ["Honor Your Father and Mother (4th)", "Respect and obey parents and legitimate authority", "Exodus 20:12; Ephesians 6:1-4", "CCC 2196-2257", "Ch. 9|Family roles|Thank you letters", "Family authority discussion|Obedience scenarios|Thank you letter writing", "Prayer for parents", "Write a thank you letter to your parents"],
    ["You Shall Not Kill (5th)", "Respect all human life from conception to natural death", "Exodus 20:13; Matthew 5:21-22", "CCC 2258-2330", "Ch. 10|Pro-life discussion|Peacemaking", "Sanctity of life discussion|Bullying and anger management|Peacemaker pledge", "Prayer for life", "Be a peacemaker — resolve a conflict peacefully"],
    ["You Shall Not Commit Adultery/Steal/Lie (6th, 7th, 8th)", "Live with purity, honesty, and respect for others' property", "Exodus 20:14-16", "CCC 2331-2513", "Ch. 11-13|Virtue discussion|Honesty scenarios", "Purity, honesty, and justice discussion|Truth-telling practice|Restitution discussion", "Prayer for purity of heart", "Practice radical honesty for one week"],
    ["You Shall Not Covet (9th, 10th)", "Overcome envy and greed with gratitude", "Exodus 20:17; Philippians 4:11-12", "CCC 2514-2557", "Ch. 14|Gratitude journal|Contentment discussion", "Envy vs admiration|Gratitude list making|Simplicity challenge", "Prayer of gratitude", "Write 10 things you are grateful for each day"],
  ]},
  { unit: "Beatitudes and Social Teaching", desc: "Living the Beatitudes and Catholic Social Teaching", ccc: "CCC 1716-1729, 1928-1948", lessons: [
    ["The Beatitudes — Jesus' Blueprint", "Study each Beatitude and its meaning for today", "Matthew 5:3-12", "CCC 1716-1729", "Ch. 15|Beatitudes poster|Modern examples", "Beatitude deep dive|Modern saint examples|Beatitude commitment", "Beatitudes prayer", "Live one Beatitude each day for 8 days"],
    ["Preferential Option for the Poor", "Understand the Church's call to serve the poor", "Matthew 25:31-46; James 2:14-17", "CCC 2443-2449", "Ch. 16|Poverty statistics|Service planning", "Poverty awareness activity|Corporal Works of Mercy|Service project planning", "Prayer for the poor and hungry", "Donate to a food bank or serve at a soup kitchen"],
    ["Dignity of Work and Rights of Workers", "Learn about just wages and worker dignity", "Laborem Exercens; James 5:4", "CCC 2426-2436", "Ch. 17|Worker rights discussion|Fair trade", "Worker dignity discussion|Fair trade exploration|Just wage reflection", "Prayer of St. Joseph the Worker", "Buy one fair trade product this week"],
    ["Care for God's Creation", "Understand our responsibility as stewards of creation", "Genesis 2:15; Laudato Si", "CCC 2415-2418", "Ch. 18|Environmental care|Creation care plan", "Laudato Si discussion|Environmental audit|Creation care action plan", "Canticle of the Sun", "Do 3 things to care for creation this week"],
  ]},
  { unit: "Prayer and Spiritual Growth", desc: "Deepening prayer life and spiritual maturity", ccc: "CCC 2558-2865", lessons: [
    ["Meditation and Contemplation", "Learn Catholic meditation and contemplative prayer", "Psalm 46:10; CCC 2705-2724", "CCC 2705-2724", "Ch. 19|Meditation guide|Quiet space", "Guided meditation practice|Contemplation introduction|Silence experience", "Contemplative prayer practice", "Spend 10 minutes in silent prayer each day"],
    ["Praying with the Saints", "Learn prayers and devotions from the saints", "Various saint prayers", "CCC 2683-2684", "Ch. 20|Saint prayer cards|Devotional guide", "Saint prayer exploration|Favorite saint prayer selection|Prayer journal", "St. Ignatius Examen", "Pray the Examen each night before bed"],
    ["Advent/Lent/Easter Seasons", "Live the liturgical seasons intentionally", "Various seasonal readings", "CCC 1163-1173", "Seasonal|Season planning|Prayer commitments", "Seasonal prayer plan creation|Seasonal sacrifice commitment|Community celebration", "Seasonal prayer", "Follow your seasonal prayer plan faithfully"],
    ["Year Review — We Live!", "Celebrate moral growth and year of faith formation", "Micah 6:8", "CCC review", "Review|Portfolios|Celebration", "Moral growth reflection|Testimony sharing|Commissioning service", "Prayer of St. Ignatius (Suscipe)", "Write your personal mission statement"],
  ]},
]);

const grade7 = quickGrade("GRADE_7", "Gr. 7", "We Pray", [
  { unit: "Jesus Christ — True God and True Man", desc: "Christology — understanding who Jesus is", ccc: "CCC 422-682", lessons: [
    ["The Incarnation — God Becomes Man", "Understand the mystery of the Incarnation", "John 1:1-14", "CCC 456-478", "Ch. 1|Creed study|Incarnation discussion", "Incarnation theology|Two natures of Christ|Creed analysis", "Angelus", "Pray the Angelus at noon each day"],
    ["Jesus' Ministry and Teaching", "Study Jesus' public ministry comprehensively", "Luke 4:16-21", "CCC 541-556", "Ch. 2|Ministry timeline|Teaching themes", "Ministry mapping|Parable analysis|Sermon on Mount deep dive", "Lord, teach me your ways", "Read one chapter of a Gospel each day"],
    ["The Paschal Mystery", "Explore the passion, death, and resurrection deeply", "Philippians 2:5-11", "CCC 571-658", "Ch. 3|Paschal Mystery art|Cross theology", "Stations meditation|Theology of the Cross|Resurrection implications", "We adore you O Christ", "Meditate on Christ's passion for 15 minutes"],
    ["The Ascension and Second Coming", "Understand Christ's ascension and promised return", "Acts 1:6-11; Matthew 25:31-46", "CCC 659-682", "Ch. 4|Ascension art|Eschatology intro", "Ascension theology|Four last things intro|Living in hope", "Maranatha — Come Lord Jesus", "Live each day as if Christ were returning tomorrow"],
  ]},
  { unit: "The Church — Body of Christ", desc: "Ecclesiology — the nature and mission of the Church", ccc: "CCC 748-975", lessons: [
    ["The Four Marks of the Church", "Study One, Holy, Catholic, and Apostolic", "Nicene Creed; Ephesians 4:4-6", "CCC 811-870", "Ch. 5|Four Marks poster|Evidence search", "Four Marks deep dive|Evidence in our parish|Unity in diversity", "Prayer for Church unity", "Identify the Four Marks in your parish this week"],
    ["The Hierarchy and the Laity", "Understand the structure of the Church", "Matthew 16:18; 1 Peter 2:9", "CCC 871-945", "Ch. 6|Church structure chart|Role cards", "Hierarchy explanation|Lay vocation discussion|Your role in the Church", "Prayer for the Pope and bishops", "Learn our bishop's name and pray for him"],
    ["Mary and the Communion of Saints", "Deepen Marian devotion and understanding of the saints", "Luke 1:46-55; Revelation 12", "CCC 963-975", "Ch. 7|Marian doctrines|Saint research", "Four Marian dogmas|Communion of Saints theology|Saint intercession", "Memorare", "Pray the Memorare daily for one week"],
    ["The Church's Social Mission", "Study the Church's role in promoting justice", "Compendium of Social Doctrine", "CCC 2419-2449", "Ch. 8|CST documents|Case studies", "Social doctrine study|Current events analysis|Social action planning", "Prayer for social justice", "Research a Catholic social organization"],
  ]},
  { unit: "Sacraments as Encounters with Christ", desc: "Deeper sacramental theology", ccc: "CCC 1113-1666", lessons: [
    ["Sacramental Theology", "Understand matter, form, and minister of sacraments", "CCC 1113-1134", "CCC 1113-1134", "Ch. 9|Sacramental theology chart|Element identification", "Matter/form/minister study|Ex opere operato discussion|Grace and sacraments", "Prayer before receiving sacraments", "Identify matter and form for each sacrament"],
    ["The Eucharist — Sacrifice and Banquet", "Explore the Eucharist as sacrifice and sacred meal", "Hebrews 9:11-14; 1 Cor 10:16-17", "CCC 1356-1381", "Ch. 10|Mass as sacrifice|Eucharistic prayers study", "Sacrifice theology|Eucharistic prayer analysis|Real Presence meditation", "Tantum Ergo", "Attend a weekday Mass this week"],
    ["Reconciliation — Tribunal of Mercy", "Experience Reconciliation as encounter with God's mercy", "John 20:19-23; CCC 1440-1498", "CCC 1440-1498", "Ch. 11|Seal of confession|Mercy discussion", "Confession deep dive|Seal of confession discussion|Mercy reflection", "Psalm 51", "Make a thorough examination of conscience and go to Confession"],
    ["Anointing, Marriage, and Orders", "Study the sacraments of healing and service", "James 5:14-15; Eph 5:25-32; Heb 5:1-6", "CCC 1499-1666", "Ch. 12|Vocation discernment|Sacrament comparison", "Healing and vocation sacraments|Vocation discernment tools|Prayer for vocations", "Prayer for vocations", "Interview a priest, deacon, or married couple about their vocation"],
  ]},
  { unit: "The Moral Life", desc: "Christian morality and ethical decision-making", ccc: "CCC 1691-2051", lessons: [
    ["Freedom, Conscience, and Moral Choice", "Navigate moral decision-making as a Catholic", "Romans 12:2; Galatians 5:1", "CCC 1730-1802", "Ch. 13|Moral decision framework|Case studies", "Moral decision-making steps|Conscience formation|Ethical case studies", "Prayer for a well-formed conscience", "Apply the moral decision framework to a real situation"],
    ["Law and Grace", "Understand the relationship between law and grace", "Romans 6:14; Galatians 5:18", "CCC 1949-2029", "Ch. 14|Law/Grace balance|Paul's letters", "Law as guide not burden|Grace enables virtue|Paul's teaching on freedom", "Prayer for grace", "Identify where grace is working in your life"],
    ["The Dignity of the Human Person", "Apply human dignity to contemporary issues", "Gaudium et Spes 27", "CCC 1929-1933", "Ch. 15|Human dignity issues|Position papers", "Contemporary dignity issues|Pro-life ethic across issues|Advocacy practice", "Prayer for human dignity", "Write a reflection on a human dignity issue"],
    ["The Common Good and Solidarity", "Understand our responsibility to one another", "Acts 4:32-35; CCC 1905-1912", "CCC 1905-1912", "Ch. 16|Common good project|Solidarity stories", "Common good definition and examples|Solidarity in action|Community service project", "Prayer of solidarity", "Complete a service project for the common good"],
  ]},
  { unit: "Prayer and Spirituality", desc: "Advanced prayer and spiritual growth", ccc: "CCC 2558-2865", lessons: [
    ["The Our Father — Line by Line", "Deep study of the Lord's Prayer", "Matthew 6:9-13; CCC 2759-2865", "CCC 2759-2865", "Ch. 17|Our Father commentary|Reflection journal", "Line-by-line Lord's Prayer study|Personal reflection on each petition|Prayer writing", "Our Father (prayed meditatively)", "Spend one day reflecting on each petition of the Our Father"],
    ["Ignatian Spirituality", "Introduction to the spirituality of St. Ignatius", "Spiritual Exercises", "CCC 2705-2708", "Ch. 18|Examen guide|Ignatian meditation", "Daily Examen practice|Ignatian meditation on Scripture|Finding God in all things", "Daily Examen", "Practice the Daily Examen each night for two weeks"],
    ["Lectio Divina", "Practice the ancient art of praying with Scripture", "Psalm 119:105; CCC 2708", "CCC 2708", "Ch. 19|Lectio Divina guide|Scripture selection", "Lectio Divina full practice|Four movements study|Personal Scripture prayer", "Lectio Divina with Sunday Gospel", "Practice Lectio Divina 3 times this week"],
    ["Discernment and Vocation", "Learn to discern God's will for your life", "1 Samuel 3:1-10; Romans 12:1-2", "CCC 2825-2827", "Ch. 20|Discernment tools|Vocation prayer", "Discernment of spirits intro|Vocation exploration|Personal prayer plan creation", "Suscipe (Prayer of St. Ignatius)", "Create a personal prayer plan for the summer"],
  ]},
  { unit: "Liturgical Year and Review", desc: "Living the Church year and year-end synthesis", ccc: "CCC 1163-1173", lessons: [
    ["Advent — Waiting in Hope", "Enter Advent with mature spiritual practice", "Isaiah 40:1-5; Romans 13:11-14", "CCC 524", "Seasonal|Advent journal|Reconciliation prep", "Advent spiritual plan|Advent journaling|Reconciliation service", "Rorate Caeli", "Keep an Advent spiritual journal"],
    ["Lent — Conversion of Heart", "Embrace Lent as a season of deep conversion", "Joel 2:12-13; 2 Cor 5:17", "CCC 1434-1439", "Seasonal|Lenten rule|Desert experience", "Lenten rule of life creation|Desert spirituality study|Fasting/prayer/almsgiving commitment", "Miserere (Psalm 51)", "Follow your Lenten rule of life faithfully"],
    ["Triduum and Easter Season", "Experience the Sacred Triduum and 50 days of Easter", "John 13-21", "CCC 1168-1169", "Seasonal|Triduum guide|Mystagogy", "Triduum liturgy preparation|Easter season reflection|Mystagogical catechesis", "Easter Sequence (Victimae Paschali Laudes)", "Attend all Triduum liturgies and journal your experience"],
    ["Year Review — We Pray!", "Synthesize the year's learning and commission for mission", "Ephesians 6:18", "CCC review", "Review|Portfolios|Commissioning", "Faith synthesis presentation|Personal creed writing|Commissioning prayer service", "Personal prayer of commitment", "Write your personal creed and share with your family"],
  ]},
]);

// ─── GRADE 8: Christ Our Life + Confirmed in the Spirit ───
const grade8COL = quickGrade("GRADE_8", "Gr. 8", "The Church Then and Now", [
  { unit: "Church History — The Early Church", desc: "From Pentecost through the age of martyrs", ccc: "CCC 748-810", lessons: [
    ["Pentecost and the Apostolic Age", "Understand the founding of the Church at Pentecost", "Acts 2:1-42", "CCC 731-741", "Ch. 1|Acts of the Apostles|Early Church map", "Pentecost drama|Apostolic succession|Early Church community life", "Come Holy Spirit", "Read Acts chapters 1-5"],
    ["Martyrs and the Growth of the Church", "Learn how persecution strengthened the early Church", "Hebrews 11:32-12:2", "CCC 2473-2474", "Ch. 2|Martyr biographies|Persecution map", "Martyr stories|Blood of martyrs discussion|Modern persecution awareness", "Prayer for persecuted Christians", "Research Christians persecuted today"],
    ["The Fathers of the Church", "Study the great teachers of the early Church", "2 Timothy 1:13-14", "CCC 688", "Ch. 3|Church Father quotes|Patristic texts", "Church Fathers introduction|Reading patristic texts|Tradition and Scripture", "Prayer of St. Augustine", "Read a passage from a Church Father"],
  ]},
  { unit: "Church History — Medieval to Modern", desc: "The Church through the ages to Vatican II", ccc: "CCC 770-780", lessons: [
    ["Monasticism and the Medieval Church", "Learn about monastic life and its contributions", "Rule of St. Benedict", "CCC 925-933", "Ch. 4|Monastic rules|Cathedral images", "Benedictine spirituality|Monastic contributions to civilization|Cathedral tour", "Ora et Labora prayer", "Follow a simplified monastic schedule for one day"],
    ["The Reformation and Counter-Reformation", "Understand the Protestant Reformation and Catholic response", "Council of Trent", "CCC 817-822", "Ch. 5|Reformation timeline|Ecumenism", "Reformation causes and effects|Council of Trent reforms|Ecumenism today", "Prayer for Christian unity", "Learn about another Christian denomination"],
    ["The Church in the Modern World", "Study Vatican II and the Church's engagement with the modern world", "Gaudium et Spes", "CCC 770-780", "Ch. 6|Vatican II documents|Modern Church", "Vatican II overview|Church in the modern world|New Evangelization", "Prayer for the New Evangelization", "Read a section of Gaudium et Spes"],
  ]},
  { unit: "Confirmed in the Spirit — Preparation", desc: "Confirmation preparation using Loyola Press program", ccc: "CCC 1285-1321", lessons: [
    ["Called by Name — Your Confirmation Journey Begins", "Begin the journey toward Confirmation with intention", "Isaiah 43:1; Jeremiah 1:5", "CCC 1285-1289", "Confirmed in the Spirit Ch. 1|Confirmation journal|Name meaning research", "Confirmation journey mapping|Called by name reflection|Sponsor selection discussion", "Here I am Lord", "Choose your Confirmation sponsor and begin conversations"],
    ["The Holy Spirit in Scripture", "Trace the Holy Spirit's action through the Bible", "Genesis 1:2; John 14:16-17; Acts 2", "CCC 687-741", "Confirmed in the Spirit Ch. 2|Spirit in Scripture timeline|Dove/Fire symbols", "Spirit in OT and NT|Pentecost deep study|Spirit's role in the Church today", "Come Holy Spirit, fill the hearts of your faithful", "Find 7 references to the Holy Spirit in Scripture"],
    ["Gifts of the Holy Spirit", "Study the seven Gifts of the Holy Spirit", "Isaiah 11:1-3; 1 Corinthians 12:4-11", "CCC 1830-1831", "Confirmed in the Spirit Ch. 3|Gifts cards|Self-assessment", "Seven Gifts deep study|Personal gifts inventory|Gifts in action scenarios", "Prayer to the Holy Spirit for each gift", "Identify which Gift you need most and pray for it daily"],
    ["Fruits of the Holy Spirit", "Learn the twelve Fruits as evidence of the Spirit's work", "Galatians 5:22-23", "CCC 1832", "Confirmed in the Spirit Ch. 4|Fruits of the Spirit tree|Self-reflection", "Twelve Fruits exploration|Fruit in daily life|Fruit vs. works of the flesh", "Prayer for the Fruits of the Spirit", "Identify Fruits of the Spirit in people around you"],
  ]},
  { unit: "Confirmed in the Spirit — The Rite", desc: "Understanding and preparing for the Confirmation liturgy", ccc: "CCC 1297-1321", lessons: [
    ["The Rite of Confirmation — Step by Step", "Walk through the entire Confirmation liturgy", "CCC 1297-1314", "CCC 1297-1314", "Confirmed in the Spirit Ch. 5|Confirmation liturgy guide|Chrism oil", "Rite walkthrough|Renewal of baptismal promises|Laying on of hands and anointing", "Prayer before Confirmation", "Practice the Confirmation responses"],
    ["Choosing Your Confirmation Name", "Select a saint's name for Confirmation", "Revelation 2:17", "CCC 2156-2159", "Confirmed in the Spirit Ch. 6|Saint biographies|Name research", "Saint name research|Saint biography sharing|Why this saint?", "Prayer to your chosen patron saint", "Complete your Confirmation saint research paper"],
    ["Your Sponsor — A Guide in Faith", "Understand the role of a Confirmation sponsor", "CCC 1311", "CCC 1311", "Confirmed in the Spirit Ch. 7|Sponsor interview guide|Letter template", "Sponsor role discussion|Interview your sponsor|Write sponsor thank you letter", "Prayer for my sponsor", "Complete your sponsor interview"],
    ["Living as a Confirmed Catholic", "Understand what Confirmation commits you to", "Acts 1:8; Matthew 28:19-20", "CCC 1302-1305", "Confirmed in the Spirit Ch. 8|Mission commitment|Service plan", "Graces of Confirmation|Soldier of Christ discussion|Personal mission statement", "Prayer of commitment", "Write your personal mission statement as a confirmed Catholic"],
  ]},
  { unit: "Confirmed in the Spirit — Discipleship", desc: "Living out Confirmation through service and witness", ccc: "CCC 1303-1305, 2044-2046", lessons: [
    ["Service Hours — Hands and Feet of Christ", "Connect service to Confirmation and the Works of Mercy", "Matthew 25:31-46", "CCC 2443-2449", "Confirmed in the Spirit Ch. 9|Service log|Works of Mercy", "Service hour reflection|Works of Mercy connection|Service testimony sharing", "Lord, use my hands", "Complete and document your remaining service hours"],
    ["Witness and Evangelization", "Learn to share your faith with others", "1 Peter 3:15; Matthew 5:14-16", "CCC 904-907", "Confirmed in the Spirit Ch. 10|Faith story template|Witness cards", "Personal faith story writing|Witness practice|Evangelization methods", "Prayer for courage to witness", "Share your faith story with someone this week"],
    ["The Moral Life of a Confirmed Catholic", "Embrace moral responsibility as a mature Catholic", "Romans 12:1-2; Galatians 5:16-26", "CCC 1691-1698", "Confirmed in the Spirit review|Moral inventory|Life rule", "Moral life review|Creating a personal rule of life|Accountability discussion", "Prayer for moral strength", "Write and commit to your personal rule of life"],
    ["Retreat Preparation and Final Review", "Prepare hearts for Confirmation retreat and celebration", "Luke 9:28-36", "CCC 1285-1321 review", "Retreat materials|Confirmation review|Celebration planning", "Retreat expectations|Final review game|Letter to bishop preparation", "Come Creator Spirit (Veni Creator Spiritus)", "Write your letter to the bishop and prepare for retreat"],
  ]},
  { unit: "Liturgical Seasons and Confirmation", desc: "Celebrating the Church year and preparing for Confirmation day", ccc: "CCC 1163-1173", lessons: [
    ["Advent and Christmas — God's Greatest Gift", "Connect Incarnation to our Confirmation journey", "John 1:14; Isaiah 9:6", "CCC 522-526", "Seasonal|Advent wreath|Incarnation reflection", "Incarnation and Confirmation connection|Advent reconciliation|Christmas joy", "Veni Veni Emmanuel", "Receive the Sacrament of Reconciliation during Advent"],
    ["Lent — Preparing Our Hearts", "Use Lent as final spiritual preparation for Confirmation", "Matthew 4:1-11; Joel 2:12-13", "CCC 538-540", "Seasonal|Lenten Confirmation prep|Fasting guide", "Lenten Confirmation preparation|Intense prayer commitment|Final service hours", "Stations of the Cross", "Complete a daily Lenten practice in preparation for Confirmation"],
    ["Confirmation Day — Sealed with the Spirit", "Final preparation and celebration of Confirmation", "Acts 8:14-17; CCC 1285-1321", "CCC 1285-1321", "Confirmation day materials|White garment|Saint medal", "Final rehearsal|Prayer and reflection|Celebration", "Veni Creator Spiritus", "Receive the Sacrament of Confirmation with open hearts!"],
    ["Now Go Forth — Mystagogy and Mission", "Post-Confirmation living and ongoing formation", "Matthew 28:19-20; Acts 1:8", "CCC 1302-1305", "Post-Confirmation reflection|Ongoing formation resources|Ministry sign-up", "Mystagogical reflection|Ministry exploration|Ongoing formation commitment", "Prayer of St. Ignatius", "Sign up for a parish ministry and commit to ongoing faith growth"],
  ]},
]);

async function main() {
  console.log("Seeding Christ Our Life + Confirmed in the Spirit curriculum...\n");

  // Clear existing curriculum
  await prisma.lesson.deleteMany({});
  await prisma.curriculumUnit.deleteMany({});
  console.log("Cleared existing curriculum.\n");

  const allGrades = [kindergarten, grade1, grade2, grade3, grade4, grade5, grade6, grade7, grade8COL];

  let totalUnits = 0;
  let totalLessons = 0;

  for (const grade of allGrades) {
    let unitNum = 0;
    for (const unit of grade.units) {
      unitNum++;
      const createdUnit = await prisma.curriculumUnit.create({
        data: {
          gradeLevel: grade.gradeLevel as any,
          program: grade.program,
          unitNumber: unitNum,
          title: unit.title,
          description: unit.description,
          cccReference: unit.cccReference,
        },
      });
      totalUnits++;

      let lessonNum = 0;
      for (const lesson of unit.lessons) {
        lessonNum++;
        await prisma.lesson.create({
          data: {
            unitId: createdUnit.id,
            lessonNumber: lessonNum,
            title: lesson.title,
            objective: lesson.objective,
            scriptureRef: lesson.scriptureRef,
            cccParagraphs: lesson.cccParagraphs,
            materials: JSON.stringify(lesson.materials),
            activities: JSON.stringify(lesson.activities),
            prayerFocus: lesson.prayerFocus,
            takeHome: lesson.takeHome,
            durationMinutes: 60,
          },
        });
        totalLessons++;
      }

      const gradeName = grade.gradeLevel.replace("GRADE_", "").replace("_", "-");
      console.log(`  ${gradeName} — Unit ${unitNum}: ${unit.title} (${unit.lessons.length} lessons)`);
    }
    console.log("");
  }

  console.log(`Done! ${totalUnits} units, ${totalLessons} lessons created.`);

  // Verify 24 lessons per grade
  console.log("\nLesson count per grade:");
  for (const grade of allGrades) {
    const count = grade.units.reduce((sum, u) => sum + u.lessons.length, 0);
    const gradeName = grade.gradeLevel.replace("GRADE_", "Gr ").replace("KINDERGARTEN", "K").replace("PRE_K", "Pre-K");
    console.log(`  ${gradeName}: ${count} lessons ${count === 24 ? "✓" : `⚠ (expected 24)`}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
