// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULTS, presetRule, type Preferences } from '../src/model';
import { evaluate } from '../src/classifier';
import { learnRule } from '../src/learning';
import { instagram } from '../src/adapters';
import { FilterEngine } from '../src/engine';
import { readPreferences } from '../src/preferences';
let engine:FilterEngine|undefined;
afterEach(()=>{engine?.destroy();engine=undefined;document.body.innerHTML='';vi.unstubAllGlobals();});
describe('editable presets and explicit learning',()=>{
  it('starts with six editable, disabled defaults',()=>{expect(DEFAULTS.rules).toHaveLength(6);expect(DEFAULTS.rules.every(r=>!r.enabled && r.id.startsWith('preset-'))).toBe(true);});
  it('adds a normalized phrase, deduplicates and enables only the selected filter',()=>{
    const p=structuredClone(DEFAULTS),id=p.rules[0].id;
    const learned=learnRule(p,id,'  strange   offer  ');
    expect(learned.rules[0].terms).toContain('strange offer');expect(learned.rules[0].enabled).toBe(true);expect(p.rules[0].enabled).toBe(false);
    expect(learnRule(learned,id,'STRANGE OFFER').rules[0].terms).toEqual(learned.rules[0].terms);
    expect(learned.rules.slice(1).every(r=>!r.enabled)).toBe(true);
    expect(()=>learnRule(p,'deleted','phrase')).toThrow('removed');expect(()=>learnRule(p,id,'   ')).toThrow();expect(()=>learnRule(p,id,'x'.repeat(201))).toThrow();
  });
  it('preserves old settings and later deletions during migration',async()=>{
    const old:Preferences={...structuredClone(DEFAULTS),rules:[{...presetRule('gossip'),name:'My edited gossip'}]};delete old.presetsVersion;
    vi.stubGlobal('chrome',{storage:{local:{get:async()=>({preferences:old})}}});
    const p=await readPreferences();expect(p.rules[0]).toEqual(old.rules[0]);expect(p.presetsVersion).toBe(3);expect(p.rules.slice(1).every(r=>!r.enabled)).toBe(true);
    p.rules=p.rules.filter(r=>r.id!=='preset-gambling');vi.stubGlobal('chrome',{storage:{local:{get:async()=>({preferences:p})}}});expect((await readPreferences()).rules.some(r=>r.id==='preset-gambling')).toBe(false);
  });
});
describe('golf starter update',()=>{
  it('adds golf to v1 settings once without changing edited rules or recreating deleted defaults',async()=>{
    const stored={...structuredClone(DEFAULTS),presetsVersion:1,rules:[{...presetRule('gossip'),name:'My gossip',except:['keep this']}]};
    vi.stubGlobal('chrome',{storage:{local:{get:async()=>({preferences:stored})}}});
    const p=await readPreferences();expect(p.rules[0]).toEqual(stored.rules[0]);expect(p.rules).toHaveLength(3);expect(p.rules[1].id).toBe('preset-golf');expect(p.rules[1].enabled).toBe(false);
    p.rules=p.rules.filter(r=>r.id!=='preset-golf');vi.stubGlobal('chrome',{storage:{local:{get:async()=>({preferences:p})}}});expect((await readPreferences()).rules.some(r=>r.id==='preset-golf')).toBe(false);
  });
  it('catches golf metadata and related terms with actual evidence, leaving unrelated text visible',()=>{
    const p={...structuredClone(DEFAULTS),rules:[presetRule('golf')]};
    const data=(body:string)=>({id:'x',site:'example.com',url:'https://example.com',type:'post' as const,title:'',body,caption:'',hashtags:[],labels:[],evidence:[],limitations:[]});
    expect(evaluate(data('Latest PGA Tour highlights'),p)).toMatchObject({status:'match',field:'body'});
    expect(evaluate(data('#golfswing practice today'),p).status).toBe('match');
    expect(evaluate(data('A quieter afternoon reading books'),p).status).toBe('clear');
    p.rules[0].enabled=false;expect(evaluate(data('Golf lessons this weekend'),p).status).toBe('clear');
  });
});
describe('Dune spoiler context',()=>{
  const data=(body:string)=>({id:'dune',site:'example.com',url:'https://example.com',type:'post' as const,title:'',body,caption:'',hashtags:[],labels:[],evidence:[],limitations:[]});
  it('requires both movie context and spoiler evidence while honoring spoiler-free exceptions',()=>{
    const p={...structuredClone(DEFAULTS),rules:[presetRule('dune')]};
    expect(evaluate(data('Dune Part Two ending explained'),p)).toMatchObject({status:'match',contextTerm:'dune',term:'ending'});
    expect(evaluate(data('Dune Part Three plot leak'),p).status).toBe('match');
    expect(evaluate(data('Dune Part Three official trailer and release date'),p).status).toBe('clear');
    expect(evaluate(data('Another movie ending explained'),p).status).toBe('clear');
    expect(evaluate(data('Dune review: no spoilers, a surprising twist'),p).status).toBe('clear');
    expect(evaluate(data('Dune spoiler-free review'),p).status).toBe('clear');
  });
  it('adds the disabled Dune starter to v2 preferences once and respects later deletion',async()=>{
    const stored={...structuredClone(DEFAULTS),presetsVersion:2,rules:[{...presetRule('golf'),name:'My golf'}]};
    vi.stubGlobal('chrome',{storage:{local:{get:async()=>({preferences:stored})}}});const p=await readPreferences();
    expect(p.rules).toHaveLength(2);expect(p.rules[0]).toEqual(stored.rules[0]);expect(p.rules[1]).toMatchObject({id:'preset-dune',enabled:false});
    p.rules.pop();vi.stubGlobal('chrome',{storage:{local:{get:async()=>({preferences:p})}}});expect((await readPreferences()).rules).toHaveLength(1);
  });
});
describe('manual hide and example workflow',()=>{
  const shadow=()=>document.querySelector('quiet-web-controls')!.shadowRoot!;
  const click=(text:string)=>[...shadow().querySelectorAll('button')].find(b=>b.textContent===text)!.click();
  it('hides an unmatched item immediately, teaches a filter, and automatically matches a future sibling',async()=>{
    document.body.innerHTML='<article id="original"><h2>Rainbow noodles special</h2><p>A new offer</p></article>';
    let p=structuredClone(DEFAULTS);
    const learn=vi.fn(async(id:string,phrase:string)=>{p=learnRule(p,id,phrase);engine!.update(p);});
    engine=new FilterEngine(p,async()=>{},document,learn);
    document.querySelector('quiet-web-manual')!.shadowRoot!.querySelector('button')!.click();
    expect(engine.status.hidden).toBe(1);expect(shadow().textContent).toContain('Hidden by you');
    click('Add to filter');const input=shadow().querySelector('input')!;input.value='Rainbow noodles';
    input.focus();engine.scan();expect(shadow().querySelector('input')!.value).toBe('Rainbow noodles');expect(shadow().activeElement?.getAttribute('aria-label')).toBe('Matching phrase');
    shadow().querySelector('form')!.dispatchEvent(new Event('submit',{cancelable:true}));await Promise.resolve();await Promise.resolve();
    expect(learn).toHaveBeenCalledWith('preset-gambling','Rainbow noodles');
    document.body.insertAdjacentHTML('beforeend','<article id="future">Try Rainbow noodles now</article>');engine.scan();
    expect(document.querySelector('#future quiet-web-controls')).not.toBeNull();
    expect(document.querySelector('#future quiet-web-controls')!.shadowRoot!.textContent).toContain('Gambling promotions');
  });
  it('undoes manual hide and resets manual state when a site recycles a card',()=>{
    document.body.innerHTML='<article><p>Unrecognized content</p></article>';engine=new FilterEngine(structuredClone(DEFAULTS),async()=>{});
    document.querySelector('quiet-web-manual')!.shadowRoot!.querySelector('button')!.click();click('Undo hide');expect(document.querySelector('quiet-web-controls')).toBeNull();
    document.querySelector('quiet-web-manual')!.shadowRoot!.querySelector('button')!.click();document.querySelector('p')!.textContent='New peaceful post';engine.scan();expect(document.querySelector('quiet-web-controls')).toBeNull();
    engine.destroy();expect(document.querySelector('quiet-web-manual')).toBeNull();
  });
  it('keeps manual hide available for image-only Instagram articles and never hides the feed shell',()=>{
    document.body.innerHTML='<main><article><img alt="A nice mountain"></article><article><img alt="A sunset"></article></main>';
    const roots=instagram.discover(document);expect(roots).toHaveLength(2);expect(instagram.extract(roots[0],new URL('https://www.instagram.com/'),new Set(roots)).type).toBe('post');
    engine=new FilterEngine(structuredClone(DEFAULTS),async()=>{});expect(document.querySelectorAll('article > quiet-web-manual')).toHaveLength(2);expect(document.querySelector('main > quiet-web-manual')).toBeNull();
  });
  it('preserves rule exceptions after learning and shows save failures without revealing the manual hide',async()=>{
    const p=structuredClone(DEFAULTS);p.rules[0].except=['film review'];const taught=learnRule(p,p.rules[0].id,'rainbow noodles');
    document.body.innerHTML='<article>Film review: rainbow noodles</article>';engine=new FilterEngine(taught,async()=>{},document,async()=>{throw new Error('Storage unavailable');});
    expect(document.querySelector('quiet-web-controls')).toBeNull();document.querySelector('quiet-web-manual')!.shadowRoot!.querySelector('button')!.click();click('Add to filter');
    shadow().querySelector('form')!.dispatchEvent(new Event('submit',{cancelable:true}));await Promise.resolve();await Promise.resolve();expect(shadow().textContent).toContain('Storage unavailable');expect(engine.status.hidden).toBe(1);click('Undo hide');expect(document.querySelector('quiet-web-controls')).toBeNull();
  });
});
