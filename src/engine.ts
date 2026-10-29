import { chooseAdapter } from './adapters';
import { evaluate } from './classifier';
import { authorKey, type Preferences, type Status } from './model';
import { addManualControl, type Learn } from './manual';
import { applyTreatment, type Treatment } from './treatment';
type RecordState={fingerprint:string;treatment?:Treatment;manualHost?:HTMLElement;manualHidden?:boolean;revealedUntil?:number};
export class FilterEngine {
  private records=new Map<HTMLElement,RecordState>();
  private timer?:ReturnType<typeof setTimeout>;
  private observer:MutationObserver;
  private navigation:ReturnType<typeof setInterval>;
  private lastURL='';
  private onViewport=()=>{if(this.status.adapter==='instagram-reels')this.schedule();};
  status:Status={adapter:'generic',scanned:0,hidden:0,insufficient:0,paused:false};
  constructor(private prefs:Preferences,private mutate:(kind:'author'|'domain',value:string)=>Promise<void>,private doc:Document=document,private learn:Learn=async()=>{throw new Error('Learning unavailable');}) {
    this.observer=new MutationObserver(mutations=>{
      if(mutations.some(m=>!(m.target instanceof Element && m.target.closest('quiet-web-controls,quiet-web-manual'))))this.schedule();
    });
    this.observe();
    doc.defaultView?.addEventListener('scroll',this.onViewport,{passive:true,capture:true});
    doc.defaultView?.addEventListener('resize',this.onViewport,{passive:true});
    this.navigation=setInterval(()=>{if(this.lastURL!==this.doc.location.href)this.schedule();},700);
    this.scan();
  }
  private observe(){this.observer.observe(this.doc.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['href','src','aria-label','alt','post-id','thingid','permalink','author','data-post-id','data-comment-id']});}
  private schedule(){if(!this.timer)this.timer=setTimeout(()=>{this.timer=undefined;this.scan();},180);}
  update(prefs:Preferences){this.prefs=prefs;for(const state of this.records.values())state.revealedUntil=undefined;this.scan();}
  scan() {
    this.observer.disconnect();
    try {
      const url=new URL(this.doc.location.href),navigated=this.lastURL!==url.href;
      this.lastURL=url.href;
      // Restore before extraction so treatments cannot contaminate evidence or discovery.
      const controlState=new Map<HTMLElement,{focused?:string;expanded:boolean;fingerprint:string;learning?:HTMLFormElement}>();
      for(const [root,state] of this.records){
        const shadow=state.treatment?.host.shadowRoot;
        if(shadow)controlState.set(root,{focused:shadow.activeElement?.getAttribute('aria-label') || shadow.activeElement?.textContent || undefined,expanded:shadow.querySelector('details')?.open ?? false,fingerprint:state.fingerprint,learning:shadow.querySelector('form') || undefined});
        state.manualHost?.remove();state.manualHost=undefined;state.treatment?.restore(false);state.treatment=undefined;
      }
      const adapter=chooseAdapter(url,this.doc);
      const roots=adapter.discover(this.doc).filter(el=>el.isConnected && !el.closest('nav,header,footer,aside,quiet-web-controls,quiet-web-manual'));
      const candidates=new Set(roots);
      for(const root of this.records.keys())if(!candidates.has(root))this.records.delete(root);
      this.status={adapter:adapter.id,scanned:0,hidden:0,insufficient:0,paused:!this.prefs.enabled || this.prefs.pausedSites.includes(url.hostname)};
      if(this.status.paused) {this.records.clear();return;}
      for(const root of roots) {
        const item=adapter.extract(root,url,candidates);
        const {root:_,active:__,...serializable}=item;
        const fingerprint=JSON.stringify([serializable,root.querySelector('video')?.getAttribute('src'),root.querySelector('source')?.getAttribute('src')]);
        let state=this.records.get(root);
        if(!state || state.fingerprint!==fingerprint || navigated) {state={fingerprint};this.records.set(root,state);}
        this.status.scanned++;
        const decision=evaluate(item,this.prefs);
        if(decision.status==='insufficient')this.status.insufficient++;
        const covered=[...this.records].some(([other,s])=>other!==root && other.contains(root) && !!s.treatment);
        if(covered)continue;
        if(!state.manualHidden && (decision.status!=='match' || (state.revealedUntil ?? 0)>Date.now())) {
          const current=state;
          state.manualHost=addManualControl(item,()=>{current.manualHidden=true;current.revealedUntil=undefined;this.scan();});
          continue;
        }
        // A matching parent already covers this child; its own text was evaluated independently.
        if([...this.records].some(([other,s])=>other!==root && other.contains(root) && !!s.treatment))continue;
        const current=state;
        state.treatment=applyTreatment(item,decision,()=>{
          current.manualHidden=false;current.revealedUntil=Date.now()+30_000;current.treatment?.restore();current.treatment=undefined;this.scan();
          setTimeout(()=>this.schedule(),30_010);
        },kind=>{void this.mutate(kind,kind==='author'?authorKey(item.site,item.author!):item.domain || item.site).catch(error=>{
          const p=current.treatment?.host.shadowRoot?.querySelector('p');if(p)p.textContent=`Could not save: ${String(error)}`;
        });},{rules:this.prefs.rules,learn:this.learn,manual:!!state.manualHidden});
        const previous=controlState.get(root);
        if(previous?.fingerprint===fingerprint && !navigated){
          const shadow=state.treatment.host.shadowRoot!;
          const more=shadow.querySelector('details');if(more)more.open=previous.expanded;
          if(previous.learning){
            shadow.querySelector('.panel')?.append(previous.learning);
          }
          const focused=[...shadow.querySelectorAll<HTMLElement>('button,summary,input,select')].find(el=>(el.getAttribute('aria-label') || el.textContent)===previous.focused);
          focused?.focus({preventScroll:true});
        }
        this.status.hidden++;
      }
    } finally {this.observe();}
  }
  destroy(){this.doc.defaultView?.removeEventListener('scroll',this.onViewport,true);this.doc.defaultView?.removeEventListener('resize',this.onViewport);clearInterval(this.navigation);clearTimeout(this.timer);this.observer.disconnect();for(const state of this.records.values()){state.manualHost?.remove();state.treatment?.restore();}this.records.clear();}
}
