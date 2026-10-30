// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { FilterEngine } from '../src/engine';
import { DEFAULTS, presetRule } from '../src/model';
import { validatePreferences } from '../src/preferences';
let engine:FilterEngine|undefined;
afterEach(()=>{engine?.destroy();document.body.innerHTML='';});
describe('optional demo controls',()=>{
  it('defaults off for new and existing settings, rejecting malformed values',()=>{
    expect(DEFAULTS.demoControls).toBe(false);
    const old=structuredClone(DEFAULTS);delete old.demoControls;
    expect(validatePreferences(old).demoControls).toBe(false);
    expect(validatePreferences({...old,demoControls:true}).demoControls).toBe(true);
    expect(()=>validatePreferences({...old,demoControls:'true'})).toThrow('demo controls');
  });
  it('keeps automatic matches active without injecting demo buttons',()=>{
    document.body.innerHTML='<article><p>Casino promotion</p></article><article><p>A quiet afternoon</p></article>';
    engine=new FilterEngine({...structuredClone(DEFAULTS),rules:[presetRule('gambling')]},async()=>{});
    expect(document.querySelectorAll('quiet-web-controls')).toHaveLength(1);
    expect(document.querySelector('quiet-web-manual')).toBeNull();
  });
  it('enables demos, then removes manual hides and controls when switched off',()=>{
    document.body.innerHTML='<article id="auto"><p>Casino promotion</p></article><article id="manual" style="color:red"><p>A quiet afternoon</p></article>';
    const prefs={...structuredClone(DEFAULTS),rules:[presetRule('gambling')]};
    engine=new FilterEngine(prefs,async()=>{});
    engine.update({...prefs,demoControls:true});
    document.querySelector('#manual quiet-web-manual')!.shadowRoot!.querySelector('button')!.click();
    expect(document.querySelector('#manual quiet-web-controls')).not.toBeNull();
    engine.update({...prefs,demoControls:false});
    expect(document.querySelector('#manual quiet-web-controls')).toBeNull();
    expect(document.querySelector('quiet-web-manual')).toBeNull();
    expect(document.querySelector('#manual')!.getAttribute('style')).toBe('color:red');
    expect(document.querySelector('#auto quiet-web-controls')).not.toBeNull();
  });
});
