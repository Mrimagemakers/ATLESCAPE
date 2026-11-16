'use strict';
const atlTrivia={
  Music:[
    ['Which Atlanta duo released ATLiens?',['OutKast','UGK','Clipse','Mobb Deep'],0,'OutKast made ATLiens.','https://www.grammy.com/news/deep-10-nirvanas-mtv-unplugged-in-new-york/'],
    ['Who is Big Boi’s partner in OutKast?',['CeeLo Green','André 3000','T.I.','Ludacris'],1,'Big Boi and André 3000 make up OutKast.','https://qa.grammy.com/news/outkast-examine-their-southern-experience-southernplayalisticadillacmuzik'],
    ['Which OutKast double album won Album of the Year in 2004?',['Stankonia','Idlewild','Speakerboxxx/The Love Below','ATLiens'],2,'Speakerboxxx/The Love Below took Album of the Year at the 2004 Grammys.','https://www.grammy.com/news/outkast-wins-album-year-speakerboxxx-love-below-2004-grammy-rewind/'],
    ['Which group appears on Discover Atlanta’s airport district list of local artists?',['Destiny’s Child','Spice Girls','En Vogue','TLC'],3,'The ATL Airport District lists TLC among artists with local ties.','https://www.atldistrict.com/plan-your-visit/things-to-do/arts-culture/']
  ],
  Film:[
    ['What former military base houses Tyler Perry Studios?',['Fort McPherson','Fort Stewart','Fort Pulaski','Fort Benning'],0,'The studio occupies part of the former Fort McPherson army base.','https://www.tylerperystudios.com/'],
    ['Which historic Atlanta movie palace opened on Christmas Day in 1929?',['The Plaza Theatre','The Fox Theatre','The Rialto Center','The Tabernacle'],1,'The Fox Theatre opened on Christmas Day in 1929.','https://www.foxtheatre.org/about-us/fox-history'],
    ['Which Disney short screened at the Fox Theatre’s opening?',['The Band Concert','Flowers and Trees','Steamboat Willie','The Three Little Pigs'],2,'The Fox Theatre records Steamboat Willie as its opening screening.','https://www.foxtheatre.org/about-us/fox-history'],
    ['What year begins the Atlanta Film Festival’s published history timeline?',['1996','2005','1960','1976'],3,'The festival’s own historical timeline begins in 1976.','https://www.atlantafilmfestival.com/history']
  ],
  Sports:[
    ['What year did Atlanta host the Centennial Olympic Games?',['1996','1984','2004','2008'],0,'Atlanta hosted the 1996 Summer Olympics.','https://discoveratlanta.com/news/presskit/sports/'],
    ['Which Atlanta team plays in the WNBA?',['Atlanta Hawks','Atlanta Dream','Atlanta Falcons','Atlanta United'],1,'The Atlanta Dream play in the WNBA.','https://discoveratlanta.com/news/presskit/sports/'],
    ['What is the Atlanta Braves’ ballpark?',['State Farm Arena','Bobby Dodd Stadium','Truist Park','Gateway Center Arena'],2,'The Braves play at Truist Park.','https://discoveratlanta.com/news/presskit/sports/'],
    ['Which pair plays home games at Mercedes-Benz Stadium?',['Braves and Falcons','Dream and Hawks','Hawks and United','Falcons and Atlanta United'],3,'Both the Falcons and Atlanta United play there.','https://discoveratlanta.com/news/presskit/sports/']
  ]
};
const triviaSeconds=20,triviaReward=40;
function atlTriviaXP(){
  return Object.entries(atlTrivia).reduce((total,[category,items])=>total+items.reduce((sum,_,i)=>sum+(progress.atlTrivia?.[category+i]===true?triviaReward:0),0),0);
}
function showAtlTrivia(){
  add(quest,'h2','Atlanta Trivia Live');
  add(quest,'p','Pick a category. You have 20 seconds per question. Faster correct answers earn a higher round score, and new correct answers earn 40 XP.');
  const choices=add(quest,'div','');choices.className='trivia-categories';
  for(const [name,items] of Object.entries(atlTrivia)){
    const tile=button(choices,name,()=>playAtlTrivia(name,items));tile.dataset.category=name;
  }
}
function playAtlTrivia(category,items){
  let score=0,index=0,firstXP=0,correctCount=0;
  function next(){
    clearInterval(clock);
    quest.replaceChildren();
    if(index===items.length){
      add(quest,'h2',category+' results');
      add(quest,'p',correctCount+' / '+items.length+' correct · '+score.toLocaleString()+' round score · +'+firstXP+' new XP');
      button(quest,'Choose another category',render);return;
    }
    const [question,answers,correct,note,source]=items[index];
    add(quest,'h2',category+' · '+(index+1)+' of '+items.length);
    const timer=add(quest,'progress','');timer.max=triviaSeconds;timer.value=triviaSeconds;timer.setAttribute('aria-label','Time remaining');
    const countdown=add(quest,'p',triviaSeconds+' seconds');countdown.className='trivia-countdown';
    add(quest,'h3',question).className='trivia-question';
    const grid=add(quest,'div','');grid.className='trivia-answer-grid';
    const status=add(quest,'p','');status.setAttribute('role','status');
    const expires=performance.now()+triviaSeconds*1000;
    let answered=false;
    const finish=(answer)=>{
      if(answered)return;
      answered=true;clearInterval(clock);
      const remaining=Math.max(0,expires-performance.now());
      const hit=answer===correct&&remaining>0;
      for(const [i,b] of [...grid.children].entries()){
        b.disabled=true;
        if(i===correct)b.dataset.correct='true';
      }
      if(hit){
        correctCount++;
        score+=Math.round(500+500*remaining/(triviaSeconds*1000));
        const key=category+index;
        if(progress.atlTrivia?.[key]!==true){
          progress.atlTrivia={...progress.atlTrivia,[key]:true};firstXP+=triviaReward;saveProgress();updatePeachProgress();
        }
      }
      status.textContent=(hit?'Correct. ':remaining===0?'Time’s up. ':'Missed it. ')+note;
      const link=add(quest,'a','Source');link.href=source;link.target='_blank';link.rel='noopener noreferrer';
      const advance=button(quest,index===items.length-1?'See score':'Next question',()=>{index++;next();});advance.className='trivia-next';advance.focus();
    };
    const symbols=['▲','◆','●','■'];
    for(const [i,answer] of answers.entries()){
      const b=button(grid,'',()=>finish(i));
      add(b,'span',symbols[i]).setAttribute('aria-hidden','true');add(b,'strong',answer);
    }
    clock=setInterval(()=>{
      timer.value=Math.max(0,(expires-performance.now())/1000);
      countdown.textContent=Math.ceil(timer.value)+' seconds';
      if(timer.value<=0)finish(-1);
    },100);
  }
  next();
}
