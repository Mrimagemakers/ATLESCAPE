const importedZones = [
  { id: 1, name: "Start Hub", loc: "Ponce City Market", color: "#10B981", icon: "🏁", x: 52, y: 72, desc: "Begin your quest! Scan the portal and collect your first Energy Fragment.", theme: "Start Hub" },
  { id: 2, name: "Strategy Zone", loc: "Old Fourth Ward Park", color: "#F59E0B", icon: "♟️", x: 63, y: 78, desc: "Explore the Fourth Ward and its transformation.", theme: "Strategy" },
  { id: 3, name: "Street Culture Zone", loc: "Krog Street Tunnel", color: "#EC4899", icon: "🎨", x: 72, y: 68, desc: "Scan street art, find hidden symbols, and unlock the code.", theme: "Culture" },
  { id: 4, name: "Speed Zone", loc: "Reynoldstown / Edgewood", color: "#FBBF24", icon: "⚡", x: 75, y: 55, desc: "Race against the clock in fast-paced AR challenges.", theme: "Speed" },
  { id: 5, name: "Culture & Language Zone", loc: "Inman Park", color: "#8B5CF6", icon: "💬", x: 68, y: 38, desc: "Test your knowledge of world languages and culture in fun AR puzzles.", theme: "Language" },
  { id: 6, name: "Precision Zone", loc: "Midtown / Piedmont Park", color: "#3B82F6", icon: "🎯", x: 45, y: 22, desc: "Perfect your skills in AR shooting challenges and accuracy games.", theme: "Precision" },
  { id: 7, name: "Power Zone", loc: "Westside Trail", color: "#EF4444", icon: "💪", x: 25, y: 40, desc: "Use strength, logic, and teamwork to overcome giant AR challenges.", theme: "Power" },
  { id: 8, name: "Final Hub", loc: "Downtown / Underground Atlanta", color: "#FF6B2B", icon: "🏆", x: 30, y: 62, desc: "Unite all Energy Fragments, restore the city archives, and celebrate!", theme: "Final" },
];

const importedQuests = [
  { id: 1, title: "AR Portal Activation", zone: "Ponce City Market", xp: 250, coins: 50, difficulty: "Easy", status: "completed", desc: "Scan the AR portal at the Ponce City Market entrance to collect your first Energy Fragment.", icon: "🌀" },
  { id: 2, title: "Fourth Ward History", zone: "Old Fourth Ward Park", xp: 400, coins: 80, difficulty: "Medium", status: "active", desc: "Trace how the Fourth Ward turned a flood-prone basin into a park.", icon: "♟️" },
  { id: 3, title: "Krog Mural Decode", zone: "Krog Street Tunnel", xp: 350, coins: 70, difficulty: "Medium", status: "locked", desc: "Find 5 hidden symbols embedded in the Krog Street murals.", icon: "🔍" },
  { id: 4, title: "Speed Sprint AR", zone: "Reynoldstown", xp: 500, coins: 100, difficulty: "Hard", status: "locked", desc: "Complete 5 AR mini-games in under 3 minutes.", icon: "⚡" },
  { id: 5, title: "World Languages Challenge", zone: "Inman Park", xp: 450, coins: 90, difficulty: "Medium", status: "locked", desc: "Match 20 international phrases to their correct languages.", icon: "🌍" },
];
const historyCards = [
  ['What company once operated a store and warehouse at Ponce City Market?',['Sears','MARTA','Atlanta Gas Light'],0,'The former Sears building later became City Hall East before being redeveloped as Ponce City Market.','https://poncecitymarket.com/history/','Warehouse Seal'],
  ['What purpose does the detention pond in Historic Fourth Ward Park serve?',['Rail switching','Stormwater management','Freight storage'],1,'The park grew out of a plan to manage stormwater in the Clear Creek basin.','https://www.h4wpc.org/history-of-the-area-park/','Waterworks Token'],
  ['What kind of corridor inspired the Atlanta BeltLine?',['An aqueduct','A highway beltway','Former railroad tracks'],2,'Rail lines that once served Atlanta industry formed a rough loop around the city.','https://beltline.org/about-us/history/','Rail Corridor Emblem'],
  ['In what year did the BeltLine Eastside Trail open?',['2012','1999','1984'],0,'The Eastside Trail opened in 2012.','https://beltline.org/about-us/history/','Eastside Trail Marker'],
  ['What name did Atlanta use immediately before it became Atlanta?',['Decatur','Marthasville','Westview'],1,'The town incorporated as Marthasville in 1843 and was renamed Atlanta in 1845.','https://www.georgiahistory.com/ghmi_marker_updated/zero-mile-post/','Marthasville Archive Key'],
  ['Who presented the BeltLine concept in a 1999 master’s thesis?',['Maynard Jackson','Stephen Harriman Long','Ryan Gravel'],2,'Georgia Tech graduate student Ryan Gravel proposed repurposing the railroad corridors.','https://beltline.org/about-us/history/','Planning Compass'],
  ['Which trail opened in 2008 as an early BeltLine milestone?',['West End Trail','Eastside Trail','Northside Trail'],0,'The West End Trail opened in 2008, before the Eastside and Northside trails.','https://beltline.org/about-us/history/','West End Trail Medallion'],
  ['Which railroad’s southeastern terminus gave rise to Atlanta?',['Georgia Railroad','Western and Atlantic Railroad','Central of Georgia Railway'],1,'The Zero Mile Post marks the terminus around which the city grew.','https://www.georgiahistory.com/ghmi_marker_updated/zero-mile-post/','Zero Mile Post Replica']
];
