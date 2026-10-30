// @vitest-environment jsdom
// @vitest-environment-options {"url":"https://www.instagram.com/reels/current/"}
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { instagram } from '../src/adapters';
import { FilterEngine } from '../src/engine';
import { DEFAULTS, presetRule } from '../src/model';
const fixture=readFileSync('tests/fixtures/instagram-reels.html','utf8');
let engine:FilterEngine|undefined;
beforeEach(()=>{document.body.innerHTML=fixture;});
afterEach(()=>{engine?.destroy();engine=undefined;document.body.innerHTML='';});
const extract=()=>{const roots=instagram.discover(document);return roots.map(root=>instagram.extract(root,new URL(location.href),new Set(roots)));};
describe('Live-shaped desktop Reels',()=>{
  it('finds deep single-video shells including captions and actions without selecting the feed',()=>{
    const roots=instagram.discover(document);
    expect(roots.map(r=>r.id)).toEqual(['golf-reel','safe-reel','unknown-reel']);
    expect(roots.every(root=>root.querySelectorAll('video').length===1 && !!root.querySelector('[aria-label="Like"]'))).toBe(true);
  });
  it('extracts creator reels links and hashtags without treating profiles/audio as permalinks',()=>{
    const [golf,safe]=extract();
    expect(golf.author).toBe('chalet_golf');expect(golf.caption).toContain('Tee time');expect(golf.hashtags).toContain('#golf');
    expect(golf.url).toBe('https://www.instagram.com/reels/');expect(golf.id).not.toBe(safe.id);
    expect(safe.body).not.toContain('Golf track');
    const permalink=document.createElement('a');permalink.href='/reel/real_shortcode/';document.querySelector('#golf-reel')!.append(permalink);
    expect(extract()[0].url).toBe('https://www.instagram.com/reel/real_shortcode/');
  });
  it('automatically filters matching reels, supports manual hide/undo, and leaves navigation usable',()=>{
    engine=new FilterEngine({...structuredClone(DEFAULTS),demoControls:true,rules:[presetRule('golf')]},async()=>{});
    expect(document.querySelector('#golf-reel > quiet-web-controls')).not.toBeNull();
    expect(document.querySelector('#safe-reel > quiet-web-controls')).toBeNull();
    const manual=document.querySelector('#safe-reel > quiet-web-manual')!;
    expect(manual.shadowRoot!.querySelector('button')!.getAttribute('aria-label')).toBe('Hide this reel with Leak Lock');
    manual.shadowRoot!.querySelector('button')!.click();
    const hidden=document.querySelector('#safe-reel > quiet-web-controls')!;
    expect(hidden.shadowRoot!.textContent).toContain('Add to filter');
    hidden.shadowRoot!.querySelector('button')!.click();
    expect(document.querySelector('#safe-reel > quiet-web-controls')).toBeNull();
    expect(document.querySelector('.navigation')!.hasAttribute('inert')).toBe(false);
  });
  it('preserves manual hiding through caption updates but resets it for recycled video media',()=>{
    engine=new FilterEngine({...structuredClone(DEFAULTS),demoControls:true},async()=>{});
    document.querySelector('#safe-reel > quiet-web-manual')!.shadowRoot!.querySelector('button')!.click();
    const control=document.querySelector('#safe-reel > quiet-web-controls');
    document.querySelector('#safe-reel .caption [role="button"]')!.append(' expanded');engine.scan();
    expect(document.querySelector('#safe-reel > quiet-web-controls')).toBe(control);
    document.querySelector('#safe-reel video')!.setAttribute('src','blob:https://www.instagram.com/recycled');engine.scan();
    expect(document.querySelector('#safe-reel > quiet-web-controls')).toBeNull();
  });
  it('never falls back to the whole feed for an unidentified player',()=>{
    document.body.innerHTML='<main><div><video></video></div><div><a href="/other/reels/">Other creator</a></div></main>';
    expect(instagram.discover(document)).toHaveLength(0);
  });
});
