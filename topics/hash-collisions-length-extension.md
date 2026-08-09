---
title: Hash Collisions & Length-Extension Attacks
description: Executable cryptanalytic demonstrations of MD5 and SHA-1 collision pairs and a complete JavaScript length-extension attack against naive hash MACs.
permalink: /topics/hash-collisions-length-extension/
last_verified: 2026-08-09
---

<span class="eyebrow">Cryptography / Failure Analysis</span>

# Hash Collisions & Length-Extension Attacks

<p class="lede">Evaluating cryptographic hash integrity requires distinguishing between theoretical weakness and practical cryptanalytic failure. This page provides executable cryptanalytic proofs: verifying real MD5 and SHA-1 collision pairs where distinct inputs yield identical digests, and executing a complete JavaScript length-extension attack that forges valid authentication tags against naive hash constructions.</p>

## 1. MD5 Hash Collisions: Two Distinct Files, Identical Digest

A **hash collision** occurs when two distinct inputs **x ≠ x'** yield identical digests **H(x) = H(x')**.

The two GIF files below (from security researcher Ange Albertini's research repository) contain different binary image data but produce the identical MD5 digest:

<div class="image-pair-compact">
  <figure>
    <img src="{{ '/assets/downloads/md5-collision-1.gif' | relative_url }}" alt="Green circle GIF image representing MD5 collision file 1">
    <figcaption>
      <strong>md5-collision-1.gif</strong> (10,386 bytes)
    </figcaption>
  </figure>
  <figure>
    <img src="{{ '/assets/downloads/md5-collision-2.gif' | relative_url }}" alt="Red X GIF image representing MD5 collision file 2">
    <figcaption>
      <strong>md5-collision-2.gif</strong> (10,386 bytes)
    </figcaption>
  </figure>
</div>

### Client-Side Executable MD5 Collision Verification

<div class="interactive-demo-card">
  <div class="demo-header">
    <span class="demo-badge">Interactive Browser Playground</span>
    <h3>MD5 Cryptanalytic Collision Proof</h3>
    <p>Interactively compute MD5 digests and perform binary byte-by-byte comparison directly in your browser (Zero server calls / Executed locally via JavaScript).</p>
  </div>

  <div class="demo-body">
    <div class="demo-form-group">
      <div class="demo-actions" style="margin: 0.5rem 0;">
        <button id="btn-verify-md5" class="btn-primary" type="button">⚡ Verify MD5 Collision Pair</button>
      </div>
    </div>

    <!-- Output Display -->
    <div id="md5-output-area" class="demo-output-area"></div>
  </div>
</div>

{% raw %}
<script>
var SparkMD5 = (function(undefined){"use strict";var add32=function(a,b){return a+b&4294967295},hex_chr=["0","1","2","3","4","5","6","7","8","9","a","b","c","d","e","f"];function cmn(q,a,b,x,s,t){a=add32(add32(a,q),add32(x,t));return add32(a<<s|a>>>32-s,b)}function md5cycle(x,k){var a=x[0],b=x[1],c=x[2],d=x[3];a+=(b&c|~b&d)+k[0]-680876936|0;a=(a<<7|a>>>25)+b|0;d+=(a&b|~a&c)+k[1]-389564586|0;d=(d<<12|d>>>20)+a|0;c+=(d&a|~d&b)+k[2]+606105819|0;c=(c<<17|c>>>15)+d|0;b+=(c&d|~c&a)+k[3]-1044525330|0;b=(b<<22|b>>>10)+c|0;a+=(b&c|~b&d)+k[4]-176418897|0;a=(a<<7|a>>>25)+b|0;d+=(a&b|~a&c)+k[5]+1200080426|0;d=(d<<12|d>>>20)+a|0;c+=(d&a|~d&b)+k[6]-1473231341|0;c=(c<<17|c>>>15)+d|0;b+=(c&d|~c&a)+k[7]-45705983|0;b=(b<<22|b>>>10)+c|0;a+=(b&c|~b&d)+k[8]+1770035416|0;a=(a<<7|a>>>25)+b|0;d+=(a&b|~a&c)+k[9]-1958414417|0;d=(d<<12|d>>>20)+a|0;c+=(d&a|~d&b)+k[10]-42063|0;c=(c<<17|c>>>15)+d|0;b+=(c&d|~c&a)+k[11]-1990404162|0;b=(b<<22|b>>>10)+c|0;a+=(b&c|~b&d)+k[12]+1804603682|0;a=(a<<7|a>>>25)+b|0;d+=(a&b|~a&c)+k[13]-40341101|0;d=(d<<12|d>>>20)+a|0;c+=(d&a|~d&b)+k[14]-1502002290|0;c=(c<<17|c>>>15)+d|0;b+=(c&d|~c&a)+k[15]+1236535329|0;b=(b<<22|b>>>10)+c|0;a+=(b&d|c&~d)+k[1]-165796510|0;a=(a<<5|a>>>27)+b|0;d+=(a&c|b&~c)+k[6]-1069501632|0;d=(d<<9|d>>>23)+a|0;c+=(d&b|a&~b)+k[11]+643717713|0;c=(c<<14|c>>>18)+d|0;b+=(c&a|d&~a)+k[0]-373897302|0;b=(b<<20|b>>>12)+c|0;a+=(b&d|c&~d)+k[5]-701558691|0;a=(a<<5|a>>>27)+b|0;d+=(a&c|b&~c)+k[10]+38016083|0;d=(d<<9|d>>>23)+a|0;c+=(d&b|a&~b)+k[15]-660478335|0;c=(c<<14|c>>>18)+d|0;b+=(c&a|d&~a)+k[4]-405537848|0;b=(b<<20|b>>>12)+c|0;a+=(b&d|c&~d)+k[9]+568446438|0;a=(a<<5|a>>>27)+b|0;d+=(a&c|b&~c)+k[14]-1019803690|0;d=(d<<9|d>>>23)+a|0;c+=(d&b|a&~b)+k[3]-187363961|0;c=(c<<14|c>>>18)+d|0;b+=(c&a|d&~a)+k[8]+1163531501|0;b=(b<<20|b>>>12)+c|0;a+=(b&d|c&~d)+k[13]-1444681467|0;a=(a<<5|a>>>27)+b|0;d+=(a&c|b&~c)+k[2]-51403784|0;d=(d<<9|d>>>23)+a|0;c+=(d&b|a&~b)+k[7]+1735328473|0;c=(c<<14|c>>>18)+d|0;b+=(c&a|d&~a)+k[12]-1926607734|0;b=(b<<20|b>>>12)+c|0;a+=(b^c^d)+k[5]-378558|0;a=(a<<4|a>>>28)+b|0;d+=(a^b^c)+k[8]-2022574463|0;d=(d<<11|d>>>21)+a|0;c+=(d^a^b)+k[11]+1839030562|0;c=(c<<16|c>>>16)+d|0;b+=(c^d^a)+k[14]-35309556|0;b=(b<<23|b>>>9)+c|0;a+=(b^c^d)+k[1]-1530992060|0;a=(a<<4|a>>>28)+b|0;d+=(a^b^c)+k[4]+1272893353|0;d=(d<<11|d>>>21)+a|0;c+=(d^a^b)+k[7]-155497632|0;c=(c<<16|c>>>16)+d|0;b+=(c^d^a)+k[10]-1094730640|0;b=(b<<23|b>>>9)+c|0;a+=(b^c^d)+k[13]+681279174|0;a=(a<<4|a>>>28)+b|0;d+=(a^b^c)+k[0]-358537222|0;d=(d<<11|d>>>21)+a|0;c+=(d^a^b)+k[3]-722521979|0;c=(c<<16|c>>>16)+d|0;b+=(c^d^a)+k[6]+76029189|0;b=(b<<23|b>>>9)+c|0;a+=(b^c^d)+k[9]-640364487|0;a=(a<<4|a>>>28)+b|0;d+=(a^b^c)+k[12]-421815835|0;d=(d<<11|d>>>21)+a|0;c+=(d^a^b)+k[15]+530742520|0;c=(c<<16|c>>>16)+d|0;b+=(c^d^a)+k[2]-995338651|0;b=(b<<23|b>>>9)+c|0;a+=(c^(b|~d))+k[0]-198630844|0;a=(a<<6|a>>>26)+b|0;d+=(b^(a|~c))+k[7]+1126891415|0;d=(d<<10|d>>>22)+a|0;c+=(a^(d|~b))+k[14]-1416354905|0;c=(c<<15|c>>>17)+d|0;b+=(d^(c|~a))+k[5]-57434055|0;b=(b<<21|b>>>11)+c|0;a+=(c^(b|~d))+k[12]+1700485571|0;a=(a<<6|a>>>26)+b|0;d+=(b^(a|~c))+k[3]-1894986606|0;d=(d<<10|d>>>22)+a|0;c+=(a^(d|~b))+k[10]-1051523|0;c=(c<<15|c>>>17)+d|0;b+=(d^(c|~a))+k[1]-2054922799|0;b=(b<<21|b>>>11)+c|0;a+=(c^(b|~d))+k[8]+1873313359|0;a=(a<<6|a>>>26)+b|0;d+=(b^(a|~c))+k[15]-30611744|0;d=(d<<10|d>>>22)+a|0;c+=(a^(d|~b))+k[6]-1560198380|0;c=(c<<15|c>>>17)+d|0;b+=(d^(c|~a))+k[13]+1309151649|0;b=(b<<21|b>>>11)+c|0;a+=(c^(b|~d))+k[4]-145523070|0;a=(a<<6|a>>>26)+b|0;d+=(b^(a|~c))+k[11]-1120210379|0;d=(d<<10|d>>>22)+a|0;c+=(a^(d|~b))+k[2]+718787259|0;c=(c<<15|c>>>17)+d|0;b+=(d^(c|~a))+k[9]-343485551|0;b=(b<<21|b>>>11)+c|0;x[0]=a+x[0]|0;x[1]=b+x[1]|0;x[2]=c+x[2]|0;x[3]=d+x[3]|0}function md5blk(s){var md5blks=[],i;for(i=0;i<64;i+=4){md5blks[i>>2]=s.charCodeAt(i)+(s.charCodeAt(i+1)<<8)+(s.charCodeAt(i+2)<<16)+(s.charCodeAt(i+3)<<24)}return md5blks}function md5blk_array(a){var md5blks=[],i;for(i=0;i<64;i+=4){md5blks[i>>2]=a[i]+(a[i+1]<<8)+(a[i+2]<<16)+(a[i+3]<<24)}return md5blks}function md51(s){var n=s.length,state=[1732584193,-271733879,-1732584194,271733878],i,length,tail,tmp,lo,hi;for(i=64;i<=n;i+=64){md5cycle(state,md5blk(s.substring(i-64,i)))}s=s.substring(i-64);length=s.length;tail=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];for(i=0;i<length;i+=1){tail[i>>2]|=s.charCodeAt(i)<<(i%4<<3)}tail[i>>2]|=128<<(i%4<<3);if(i>55){md5cycle(state,tail);for(i=0;i<16;i+=1){tail[i]=0}}tmp=n*8;tmp=tmp.toString(16).match(/(.*?)(.{0,8})$/);lo=parseInt(tmp[2],16);hi=parseInt(tmp[1],16)||0;tail[14]=lo;tail[15]=hi;md5cycle(state,tail);return state}function md51_array(a){var n=a.length,state=[1732584193,-271733879,-1732584194,271733878],i,length,tail,tmp,lo,hi;for(i=64;i<=n;i+=64){md5cycle(state,md5blk_array(a.subarray(i-64,i)))}a=i-64<n?a.subarray(i-64):new Uint8Array(0);length=a.length;tail=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];for(i=0;i<length;i+=1){tail[i>>2]|=a[i]<<(i%4<<3)}tail[i>>2]|=128<<(i%4<<3);if(i>55){md5cycle(state,tail);for(i=0;i<16;i+=1){tail[i]=0}}tmp=n*8;tmp=tmp.toString(16).match(/(.*?)(.{0,8})$/);lo=parseInt(tmp[2],16);hi=parseInt(tmp[1],16)||0;tail[14]=lo;tail[15]=hi;md5cycle(state,tail);return state}function rhex(n){var s="",j;for(j=0;j<4;j+=1){s+=hex_chr[n>>j*8+4&15]+hex_chr[n>>j*8&15]}return s}function hex(x){var i;for(i=0;i<x.length;i+=1){x[i]=rhex(x[i])}return x.join("")}if(hex(md51("hello"))!=="5d41402abc4b2a76b9719d911017c592"){add32=function(x,y){var lsw=(x&65535)+(y&65535),msw=(x>>16)+(y>>16)+(lsw>>16);return msw<<16|lsw&65535}}if(typeof ArrayBuffer!=="undefined"&&!ArrayBuffer.prototype.slice){(function(){function clamp(val,length){val=val|0||0;if(val<0){return Math.max(val+length,0)}return Math.min(val,length)}ArrayBuffer.prototype.slice=function(from,to){var length=this.byteLength,begin=clamp(from,length),end=length,num,target,targetArray,sourceArray;if(to!==undefined){end=clamp(to,length)}if(begin>end){return new ArrayBuffer(0)}num=end-begin;target=new ArrayBuffer(num);targetArray=new Uint8Array(target);sourceArray=new Uint8Array(this,begin,num);targetArray.set(sourceArray);return target}})()}function toUtf8(str){if(/[\u0080-\uFFFF]/.test(str)){str=unescape(encodeURIComponent(str))}return str}function utf8Str2ArrayBuffer(str,returnUInt8Array){var length=str.length,buff=new ArrayBuffer(length),arr=new Uint8Array(buff),i;for(i=0;i<length;i+=1){arr[i]=str.charCodeAt(i)}return returnUInt8Array?arr:buff}function arrayBuffer2Utf8Str(buff){return String.fromCharCode.apply(null,new Uint8Array(buff))}function concatenateArrayBuffers(first,second,returnUInt8Array){var result=new Uint8Array(first.byteLength+second.byteLength);result.set(new Uint8Array(first));result.set(new Uint8Array(second),first.byteLength);return returnUInt8Array?result:result.buffer}function hexToBinaryString(hex){var bytes=[],length=hex.length,x;for(x=0;x<length-1;x+=2){bytes.push(parseInt(hex.substr(x,2),16))}return String.fromCharCode.apply(String,bytes)}function SparkMD5(){this.reset()}SparkMD5.prototype.append=function(str){this.appendBinary(toUtf8(str));return this};SparkMD5.prototype.appendBinary=function(contents){this._buff+=contents;this._length+=contents.length;var length=this._buff.length,i;for(i=64;i<=length;i+=64){md5cycle(this._hash,md5blk(this._buff.substring(i-64,i)))}this._buff=this._buff.substring(i-64);return this};SparkMD5.prototype.end=function(raw){var buff=this._buff,length=buff.length,i,tail=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],ret;for(i=0;i<length;i+=1){tail[i>>2]|=buff.charCodeAt(i)<<(i%4<<3)}this._finish(tail,length);ret=hex(this._hash);if(raw){ret=hexToBinaryString(ret)}this.reset();return ret};SparkMD5.prototype.reset=function(){this._buff="";this._length=0;this._hash=[1732584193,-271733879,-1732584194,271733878];return this};SparkMD5.prototype.getState=function(){return{buff:this._buff,length:this._length,hash:this._hash.slice()}};SparkMD5.prototype.setState=function(state){this._buff=state.buff;this._length=state.length;this._hash=state.hash;return this};SparkMD5.prototype.destroy=function(){delete this._hash;delete this._buff;delete this._length};SparkMD5.prototype._finish=function(tail,length){var i=length,tmp,lo,hi;tail[i>>2]|=128<<(i%4<<3);if(i>55){md5cycle(this._hash,tail);for(i=0;i<16;i+=1){tail[i]=0}}tmp=this._length*8;tmp=tmp.toString(16).match(/(.*?)(.{0,8})$/);lo=parseInt(tmp[2],16);hi=parseInt(tmp[1],16)||0;tail[14]=lo;tail[15]=hi;md5cycle(this._hash,tail)};SparkMD5.hash=function(str,raw){return SparkMD5.hashBinary(toUtf8(str),raw)};SparkMD5.hashBinary=function(content,raw){var hash=md51(content),ret=hex(hash);return raw?hexToBinaryString(ret):ret};SparkMD5.ArrayBuffer=function(){this.reset()};SparkMD5.ArrayBuffer.prototype.append=function(arr){var buff=concatenateArrayBuffers(this._buff.buffer,arr,true),length=buff.length,i;this._length+=arr.byteLength;for(i=64;i<=length;i+=64){md5cycle(this._hash,md5blk_array(buff.subarray(i-64,i)))}this._buff=i-64<length?new Uint8Array(buff.buffer.slice(i-64)):new Uint8Array(0);return this};SparkMD5.ArrayBuffer.prototype.end=function(raw){var buff=this._buff,length=buff.length,tail=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],i,ret;for(i=0;i<length;i+=1){tail[i>>2]|=buff[i]<<(i%4<<3)}this._finish(tail,length);ret=hex(this._hash);if(raw){ret=hexToBinaryString(ret)}this.reset();return ret};SparkMD5.ArrayBuffer.prototype.reset=function(){this._buff=new Uint8Array(0);this._length=0;this._hash=[1732584193,-271733879,-1732584194,271733878];return this};SparkMD5.ArrayBuffer.prototype.getState=function(){var state=SparkMD5.prototype.getState.call(this);state.buff=arrayBuffer2Utf8Str(state.buff);return state};SparkMD5.ArrayBuffer.prototype.setState=function(state){state.buff=utf8Str2ArrayBuffer(state.buff,true);return SparkMD5.prototype.setState.call(this,state)};SparkMD5.ArrayBuffer.prototype.destroy=SparkMD5.prototype.destroy;SparkMD5.ArrayBuffer.prototype._finish=SparkMD5.prototype._finish;SparkMD5.ArrayBuffer.hash=function(arr,raw){var hash=md51_array(new Uint8Array(arr)),ret=hex(hash);return raw?hexToBinaryString(ret):ret};return SparkMD5})();
</script>

<script>
(function() {
  const btnVerifyMD5 = document.getElementById('btn-verify-md5');
  const outputAreaMD5 = document.getElementById('md5-output-area');

  const sample1Url = new URL('../../assets/downloads/md5-collision-1.gif', window.location.href).href;
  const sample2Url = new URL('../../assets/downloads/md5-collision-2.gif', window.location.href).href;

  const gif1B64 = 'R0lGODlhZAJkAsZSAP4AAP4wK/4xMf9sbP9tbf98f/2AfwD/AAD/GyH+HB3/LiT/Hjb/Ozr/Lzj/PUf/R0b/Ukn/SVL/W1X/UlT/XF7/ZGH/XGD/ZWn/bWz/Zmr/bnX/bnP/dnv/fn7/d33/f4T/hob/f4z/jo7/iJP/lpX/kJr/npz/mJv/n6H/pqP/oKL/p6r/p6j/r6v/qLD/r7H/sLb/t7f/uL7+uL3/v8P/x8X/wcT/yMv/yMr/0Mz/ydD/0NH/0db+19f/2Nz/4N7/2t3/4eP+4eL/6OX/4un+6er/6uv/6+//8fH/6/D/8vb+8/X/+vf/9Pb/+//9+/z/+/3//P///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////yH+LzAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwe2575szRAgcChRTfl20o9irUL/C07Ty3wh0yeJFTnhcDMs36xXDTEcgLDE+a/HtkWv/qPy6X6JP/AVknvm2r2YIPDqwow8yPgtkfpihdCHtSOux16SPmPaXTWu5G7Ifi72aMJpkE09vNiGxNt6dk4WpGQRcC096o69sLwNpLAHIDAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABQAIfkEAP///wAsAAAAAGQCZAIAB/6AUIKDhIWGh4iJiouMjY4FA46Sk5SVlpeYmZqbnJ2en6ChmU8DBaKnqKmqq4kFAACRrLKztLW2t7i5m6Svprq/wMGUrq+wwsfIycrLzJi8xb7N0tOhxMXG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';
  const gif2B64 = 'R0lGODlhZAJkAsZSAP4AAP4wK/4xMf9sbP9tbf98f/2AfwD/AAD/GyH+HB3/LiT/Hjb/Ozr/Lzj/PUf/R0b/Ukn/SVL/W1X/UlT/XF7/ZGH/XGD/ZWn/bWz/Zmr/bnX/bnP/dnv/fn7/d33/f4T/hob/f4z/jo7/iJP/lpX/kJr/npz/mJv/n6H/pqP/oKL/p6r/p6j/r6v/qLD/r7H/sLb/t7f/uL7+uL3/v8P/x8X/wcT/yMv/yMr/0Mz/ydD/0NH/0db+19f/2Nz/4N7/2t3/4eP+4eL/6OX/4un+6er/6uv/6+//8fH/6/D/8vb+8/X/+vf/9Pb/+//9+/z/+/3//P///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////yH+LzAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwe2575szRAgcChRTfl20o9irUL/A07Ty3wh0yeJFTnhcDMs36xXDTEcgLDE+a/PtjWv/qPy6X6JP/AVknPm2r2YIPDqwow8yPgtkfpihdCHtSOux1aSPmPaXTWu5G7Ifi72aMJpkE09vNiGxNt6fk4WpGQRcC096o69sLwFpLAHIDAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABQAIfkEAP///wAsAAAAAGQCZAIAB/6AUIKDhIWGh4iJiouMjY4FA46Sk5SVlpeYmZqbnJ2en6ChmU8DBaKnqKmqq4kFAACRrLKztLW2t7i5m6Svprq/wMGUrq+wwsfIycrLzJi8xb7N0tOhxMXG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';

  if (!btnVerifyMD5 || !outputAreaMD5) return;

  function base64ToBytes(b64) {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i) & 0xff;
    return bytes;
  }

  function compareBuffers(b1, b2) {
    const minLen = Math.min(b1.length, b2.length);
    for (let i = 0; i < minLen; i++) {
      if (b1[i] !== b2[i]) return i;
    }
    if (b1.length !== b2.length) return minLen;
    return -1;
  }

  async function verifyMD5CollisionPair() {
    try {
      outputAreaMD5.innerHTML = '<div style="color: var(--amber); font-weight: 600; padding: 0.5rem;">&#8987; Hashing GIF files...</div>';
      let b1, b2;
      try {
        const r1 = await fetch(sample1Url);
        const r2 = await fetch(sample2Url);
        if (!r1.ok || !r2.ok) throw new Error("Fetch status non-200");
        const ab1 = new Uint8Array(await r1.arrayBuffer());
        const ab2 = new Uint8Array(await r2.arrayBuffer());
        if (ab1.length === 10386 && ab2.length === 10386) {
          b1 = ab1; b2 = ab2;
        } else {
          throw new Error("Invalid asset size (likely 404 HTML)");
        }
      } catch (e) {
        b1 = base64ToBytes(gif1B64);
        b2 = base64ToBytes(gif2B64);
      }

      const md51 = SparkMD5.ArrayBuffer.hash(b1);
      const md52 = SparkMD5.ArrayBuffer.hash(b2);
      const diffOffset = compareBuffers(b1, b2);

      let html = '<div class="ecb-blocks-list">';
      html += `
      <div class="ecb-block-item">
        <div class="block-meta">
          <span class="block-num">File 1: md5-collision-1.gif (${b1.length} Bytes)</span>
          <span class="block-plain-preview">
            <a href="${sample1Url}" download="md5-collision-1.gif" class="btn-secondary" style="padding: 0.2rem 0.5rem; font-size: 0.75rem;">&#128229; Download GIF 1</a>
          </span>
        </div>
        <div class="block-hex-val"><code>${md51}</code></div>
      </div>
      <div class="ecb-block-item">
        <div class="block-meta">
          <span class="block-num">File 2: md5-collision-2.gif (${b2.length} Bytes)</span>
          <span class="block-plain-preview">
            <a href="${sample2Url}" download="md5-collision-2.gif" class="btn-secondary" style="padding: 0.2rem 0.5rem; font-size: 0.75rem;">&#128229; Download GIF 2</a>
          </span>
        </div>
        <div class="block-hex-val"><code>${md52}</code></div>
      </div>`;
      html += '</div>';

      if (md51 === md52 && diffOffset !== -1) {
        html += `
        <div class="security-layer security-layer-direct" style="margin-top: 1.25rem;">
          <div class="security-layer-label">Cryptanalytic Collision Verified</div>
          <div>
            <strong>&#128680; MD5 HASH COLLISION CONFIRMED!</strong>
            <p style="margin-bottom:0;">Both GIF files yield the <strong>identical MD5 digest</strong> (<code>${md51}</code>), but binary comparison proves they differ starting at <strong>byte offset ${diffOffset}</strong>. Integrity checks relying on MD5 are vulnerable to silent file substitution.</p>
          </div>
        </div>`;
      } else {
        html += `
        <div class="security-layer security-layer-protect" style="margin-top: 1.25rem;">
          <div class="security-layer-label">Verification Result</div>
          <div>
            <strong>MD5 Hashing Complete</strong>
            <p style="margin-bottom:0;">File 1: <code>${md51}</code> | File 2: <code>${md52}</code> (Diff offset: ${diffOffset})</p>
          </div>
        </div>`;
      }

      outputAreaMD5.innerHTML = html;
    } catch (err) {
      outputAreaMD5.innerHTML = `<div style="color: #b91c1c; padding: 1rem; border: 1px solid #fca5a5; border-radius: 8px; background: #fef2f2;">Verification Error: ${err.message || err}</div>`;
    }
  }

  btnVerifyMD5.addEventListener('click', verifyMD5CollisionPair);
  verifyMD5CollisionPair();
})();
</script>
{% endraw %}



If an integrity check relies solely on MD5 to verify file authenticity, an adversary can substitute `md5-collision-2.gif` for `md5-collision-1.gif` without triggering hash validation errors.

## 2. SHA-1 Collisions: The SHAttered Attack Strategy

In 2017, Google and CWI Amsterdam published the **SHAttered** attack, demonstrating the first practical SHA-1 collision using two distinct PDF documents sharing an identical SHA-1 hash.

<div class="image-pair" style="margin-bottom: 1.5rem;">
  <figure>
    <figcaption>
      <strong>sha1-collision-1.pdf</strong> (2,102 bytes)
    </figcaption>
  </figure>
  <figure>
    <figcaption>
      <strong>sha1-collision-2.pdf</strong> (2,102 bytes)
    </figcaption>
  </figure>
</div>

### Client-Side Executable SHA-1 SHAttered Verification

<div class="interactive-demo-card">
  <div class="demo-header">
    <span class="demo-badge">Interactive Browser Playground</span>
    <h3>SHA-1 SHAttered PDF Collision Proof</h3>
    <p>Interactively compute SHA-1 digests over the official SHAttered PDF collision pair and verify binary divergence live via Web Crypto API.</p>
  </div>

  <div class="demo-body">
    <div class="demo-form-group">
      <div class="demo-actions" style="margin: 0.5rem 0;">
        <button id="btn-verify-sha1" class="btn-primary" type="button">⚡ Verify SHA-1 SHAttered Collision Pair</button>
      </div>
    </div>

    <!-- Output Display -->
    <div id="sha1-output-area" class="demo-output-area"></div>
  </div>
</div>

{% raw %}
<script>
(function() {
  const btnVerifySHA1 = document.getElementById('btn-verify-sha1');
  const outputAreaSHA1 = document.getElementById('sha1-output-area');

  const pdf1Url = new URL('../../assets/downloads/sha1-collision-1.pdf', window.location.href).href;
  const pdf2Url = new URL('../../assets/downloads/sha1-collision-2.pdf', window.location.href).href;

  const pdf1B64 = 'JVBERi0xLjMKJeLjz9MKCgoxIDAgb2JqCjw8L1dpZHRoIDIgMCBSL0hlaWdodCAzIDAgUi9UeXBlIDQgMCBSL1N1YnR5cGUgNSAwIFIvRmlsdGVyIDYgMCBSL0NvbG9yU3BhY2UgNyAwIFIvTGVuZ3RoIDggMCBSL0JpdHNQZXJDb21wb25lbnQgOD4+CnN0cmVhbQr/2P/+ACRTSEEtMSBpcyBkZWFkISEhISGFL+wJIzl1nDmxocY8TJfh//4Bf0bck6a2fgE7ApqqHbJWC0XKZ9aIx/hLjEx5H+ArPfYU+G2xaQkBxWtFwVMK/t+3YDjpcnIv561yjw5JBOBGwjBXD+nUE5ir4S71vJQr4zVCpIAtmLXXDyozLsN/rDUU503cDyzBqHTNDHgwWiFWZGEwl4lga9C/P5jNqARGKaEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/+AS0AAAAAAAAAAP/gABBKRklGAAEBAQBIAEgAAP/bAEMAAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAf/bAEMBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAf/AABEIAAgACAMBEQACEQEDEQH/xAAUAAEAAAAAAAAAAAAAAAAAAAAJ/8QAHxAAAAMJAAAAAAAAAAAAAAAAFRYYABQXKEZkZoeW/8QAFAEBAAAAAAAAAAAAAAAAAAAACv/EACERAAAEBQUAAAAAAAAAAAAAAAAVFhgUKEZkZheGh5WW//4ABv/+AFL/2gAMAwEAAhEDEQA/AFOmmVNWqpDrZjo4580Si1rqHWCMd2YVwtVODVVsbm8N0KVIdkIjEAUeal1NbOnW1mensH5lEpnjnTnAx//ZQU5HRf/gABBKRklGAAEBAQBIAEgAAP/bAEMAAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAf/bAEMBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAf/AABEIAAgACAMBEQACEQEDEQH/xAAUAAEAAAAAAAAAAAAAAAAAAAAK/8QAGBAAAgMAAAAAAAAAAAAAAAAAAPA5qbn/xAAVAQEBAAAAAAAAAAAAAAAAAAAHCP/EABsRAAIBBQAAAAAAAAAAAAAAAADwNzinqLe4/9oADAMBAAIRAxEAPwBSWTLUyxMhTqltSxSX9385/Nfx/9kKZW5kc3RyZWFtCmVuZG9iagoKMiAwIG9iago4CmVuZG9iagoKMyAwIG9iago4CmVuZG9iagoKNCAwIG9iagovWE9iamVjdAplbmRvYmoKCjUgMCBvYmoKL0ltYWdlCmVuZG9iagoKNiAwIG9iagovRENURGVjb2RlCmVuZG9iagoKNyAwIG9iagovRGV2aWNlUkdCCmVuZG9iagoKOCAwIG9iagoxMTEwCmVuZG9iagoKOSAwIG9iago8PAogIC9UeXBlIC9DYXRhbG9nCiAgL1BhZ2VzIDEwIDAgUgo+PgplbmRvYmoKCgoxMCAwIG9iago8PAogIC9UeXBlIC9QYWdlcwogIC9Db3VudCAxCiAgL0tpZHMgWzExIDAgUl0KPj4KZW5kb2JqCjExIDAgb2JqCjw8CiAgL1R5cGUgL1BhZ2UKICAvUGFyZW50IDEwIDAgUgogIC9Dcm9wQm94IFswIDAgOCA4XQogIC9Db250ZW50cyAxMiAwIFIKICAvUmVzb3VyY2VzCiAgPDwKICAgIC9YT2JqZWN0IDw8L0ltMCAxIDAgUj4+CiAgPj4KPj4KZW5kb2JqCgoxMiAwIG9iago8PC9MZW5ndGggMjI+PgpzdHJlYW0KOCAwIDAgOCAwIDAgY20KL0ltMCBEbwplbmRzdHJlYW0KZW5kb2JqCgp4cmVmCjAgMTMgCjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAxNyAwMDAwMCBuIAowMDAwMDAxMjc4IDAwMDAwIG4gCjAwMDAwMDEyOTYgMDAwMDAgbiAKMDAwMDAwMTMxNCAwMDAwMCBuIAowMDAwMDAxMzM5IDAwMDAwIG4gCjAwMDAwMDEzNjIgMDAwMDAgbiAKMDAwMDAwMTM4OSAwMDAwMCBuIAowMDAwMDAxNDE2IDAwMDAwIG4gCjAwMDAwMDE0MzcgMDAwMDAgbiAKMDAwMDAwMTQ5MyAwMDAwMCBuIAowMDAwMDAxNTU4IDAwMDAwIG4gCjAwMDAwMDE3MDMgMDAwMDAgbiAKCnRyYWlsZXIgPDwvUm9vdCA5IDAgUiAvU2l6ZSAxMz4+CgpzdGFydHhyZWYKMTc3NQolJUVPRgo=';
  const pdf2B64 = 'JVBERi0xLjMKJeLjz9MKCgoxIDAgb2JqCjw8L1dpZHRoIDIgMCBSL0hlaWdodCAzIDAgUi9UeXBlIDQgMCBSL1N1YnR5cGUgNSAwIFIvRmlsdGVyIDYgMCBSL0NvbG9yU3BhY2UgNyAwIFIvTGVuZ3RoIDggMCBSL0JpdHNQZXJDb21wb25lbnQgOD4+CnN0cmVhbQr/2P/+ACRTSEEtMSBpcyBkZWFkISEhISGFL+wJIzl1nDmxocY8TJfh//4Bc0bckWa2fhGPApq2IbJWD/nKZ8yox/hbqEx5AwwrPeIY+G2zqQkB1d9FwU8m/t+z3DjpasIv571yjw5FvOBG0jxXD+sUE5i7VS71oKgr4zH+pIA3uLXXHw4zLt+TrDUA603cDezBqGR5DHgsdiFWYN0wl5HQa9CvP5jNpLxGKbEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/+AS0AAAAAAAAAAP/gABBKRklGAAEBAQBIAEgAAP/bAEMAAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAf/bAEMBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAf/AABEIAAgACAMBEQACEQEDEQH/xAAUAAEAAAAAAAAAAAAAAAAAAAAJ/8QAHxAAAAMJAAAAAAAAAAAAAAAAFRYYABQXKEZkZoeW/8QAFAEBAAAAAAAAAAAAAAAAAAAACv/EACERAAAEBQUAAAAAAAAAAAAAAAAVFhgUKEZkZheGh5WW//4ABv/+AFL/2gAMAwEAAhEDEQA/AFOmmVNWqpDrZjo4580Si1rqHWCMd2YVwtVODVVsbm8N0KVIdkIjEAUeal1NbOnW1mensH5lEpnjnTnAx//ZQU5HRf/gABBKRklGAAEBAQBIAEgAAP/bAEMAAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAf/bAEMBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAf/AABEIAAgACAMBEQACEQEDEQH/xAAUAAEAAAAAAAAAAAAAAAAAAAAK/8QAGBAAAgMAAAAAAAAAAAAAAAAAAPA5qbn/xAAVAQEBAAAAAAAAAAAAAAAAAAAHCP/EABsRAAIBBQAAAAAAAAAAAAAAAADwNzinqLe4/9oADAMBAAIRAxEAPwBSWTLUyxMhTqltSxSX9385/Nfx/9kKZW5kc3RyZWFtCmVuZG9iagoKMiAwIG9iago4CmVuZG9iagoKMyAwIG9iago4CmVuZG9iagoKNCAwIG9iagovWE9iamVjdAplbmRvYmoKCjUgMCBvYmoKL0ltYWdlCmVuZG9iagoKNiAwIG9iagovRENURGVjb2RlCmVuZG9iagoKNyAwIG9iagovRGV2aWNlUkdCCmVuZG9iagoKOCAwIG9iagoxMTEwCmVuZG9iagoKOSAwIG9iago8PAogIC9UeXBlIC9DYXRhbG9nCiAgL1BhZ2VzIDEwIDAgUgo+PgplbmRvYmoKCgoxMCAwIG9iago8PAogIC9UeXBlIC9QYWdlcwogIC9Db3VudCAxCiAgL0tpZHMgWzExIDAgUl0KPj4KZW5kb2JqCjExIDAgb2JqCjw8CiAgL1R5cGUgL1BhZ2UKICAvUGFyZW50IDEwIDAgUgogIC9Dcm9wQm94IFswIDAgOCA4XQogIC9Db250ZW50cyAxMiAwIFIKICAvUmVzb3VyY2VzCiAgPDwKICAgIC9YT2JqZWN0IDw8L0ltMCAxIDAgUj4+CiAgPj4KPj4KZW5kb2JqCgoxMiAwIG9iago8PC9MZW5ndGggMjI+PgpzdHJlYW0KOCAwIDAgOCAwIDAgY20KL0ltMCBEbwplbmRzdHJlYW0KZW5kb2JqCgp4cmVmCjAgMTMgCjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAxNyAwMDAwMCBuIAowMDAwMDAxMjc4IDAwMDAwIG4gCjAwMDAwMDEyOTYgMDAwMDAgbiAKMDAwMDAwMTMxNCAwMDAwMCBuIAowMDAwMDAxMzM5IDAwMDAwIG4gCjAwMDAwMDEzNjIgMDAwMDAgbiAKMDAwMDAwMTM4OSAwMDAwMCBuIAowMDAwMDAxNDE2IDAwMDAwIG4gCjAwMDAwMDE0MzcgMDAwMDAgbiAKMDAwMDAwMTQ5MyAwMDAwMCBuIAowMDAwMDAxNTU4IDAwMDAwIG4gCjAwMDAwMDE3MDMgMDAwMDAgbiAKCnRyYWlsZXIgPDwvUm9vdCA5IDAgUiAvU2l6ZSAxMz4+CgpzdGFydHhyZWYKMTc3NQolJUVPRgo=';

  if (!btnVerifySHA1 || !outputAreaSHA1) return;

  function base64ToBytes(b64) {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i) & 0xff;
    return bytes;
  }

  function compareBuffers(b1, b2) {
    const minLen = Math.min(b1.length, b2.length);
    for (let i = 0; i < minLen; i++) {
      if (b1[i] !== b2[i]) return i;
    }
    if (b1.length !== b2.length) return minLen;
    return -1;
  }

  async function computeSHA1Hex(bytes) {
    if (window.crypto && window.crypto.subtle) {
      const hashBuf = await window.crypto.subtle.digest('SHA-1', bytes);
      return Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
    }
    throw new Error('Web Crypto API not available');
  }

  async function verifySHA1CollisionPair() {
    try {
      outputAreaSHA1.innerHTML = '<div style="color: var(--amber); font-weight: 600; padding: 0.5rem;">&#8987; Hashing PDF files via Web Crypto API...</div>';
      let b1, b2;
      try {
        const r1 = await fetch(pdf1Url);
        const r2 = await fetch(pdf2Url);
        if (!r1.ok || !r2.ok) throw new Error("Fetch status non-200");
        const ab1 = new Uint8Array(await r1.arrayBuffer());
        const ab2 = new Uint8Array(await r2.arrayBuffer());
        if (ab1.length === 2102 && ab2.length === 2102) {
          b1 = ab1; b2 = ab2;
        } else {
          throw new Error("Invalid asset size (likely 404 HTML)");
        }
      } catch (e) {
        b1 = base64ToBytes(pdf1B64);
        b2 = base64ToBytes(pdf2B64);
      }

      const sha1_1 = await computeSHA1Hex(b1);
      const sha1_2 = await computeSHA1Hex(b2);
      const diffOffset = compareBuffers(b1, b2);

      let html = '<div class="ecb-blocks-list">';
      html += `
      <div class="ecb-block-item">
        <div class="block-meta">
          <span class="block-num">File 1: sha1-collision-1.pdf (${b1.length} Bytes)</span>
          <span class="block-plain-preview">
            <a href="${pdf1Url}" download="sha1-collision-1.pdf" class="btn-secondary" style="padding: 0.2rem 0.5rem; font-size: 0.75rem;">&#128229; Download PDF 1</a>
          </span>
        </div>
        <div class="block-hex-val"><code>${sha1_1}</code></div>
      </div>
      <div class="ecb-block-item">
        <div class="block-meta">
          <span class="block-num">File 2: sha1-collision-2.pdf (${b2.length} Bytes)</span>
          <span class="block-plain-preview">
            <a href="${pdf2Url}" download="sha1-collision-2.pdf" class="btn-secondary" style="padding: 0.2rem 0.5rem; font-size: 0.75rem;">&#128229; Download PDF 2</a>
          </span>
        </div>
        <div class="block-hex-val"><code>${sha1_2}</code></div>
      </div>`;
      html += '</div>';

      if (sha1_1 === sha1_2 && diffOffset !== -1) {
        html += `
        <div class="security-layer security-layer-direct" style="margin-top: 1.25rem;">
          <div class="security-layer-label">Cryptanalytic Collision Verified</div>
          <div>
            <strong>&#128680; SHA-1 SHAttered COLLISION CONFIRMED!</strong>
            <p style="margin-bottom:0;">Both PDF files yield the <strong>identical SHA-1 digest</strong> (<code>${sha1_1}</code>), but binary comparison proves they differ starting at <strong>byte offset ${diffOffset}</strong>. SHA-1 digital signatures are broken and formally prohibited by NIST SP 800-131A Rev. 2!</p>
          </div>
        </div>`;
      } else {
        html += `
        <div class="security-layer security-layer-protect" style="margin-top: 1.25rem;">
          <div class="security-layer-label">Verification Result</div>
          <div>
            <strong>SHA-1 Hashing Complete</strong>
            <p style="margin-bottom:0;">File 1: <code>${sha1_1}</code> | File 2: <code>${sha1_2}</code> (Diff offset: ${diffOffset})</p>
          </div>
        </div>`;
      }

      outputAreaSHA1.innerHTML = html;
    } catch (err) {
      outputAreaSHA1.innerHTML = `<div style="color: #b91c1c; padding: 1rem; border: 1px solid #fca5a5; border-radius: 8px; background: #fef2f2;">Verification Error: ${err.message || err}</div>`;
    }
  }

  btnVerifySHA1.addEventListener('click', verifySHA1CollisionPair);
  verifySHA1CollisionPair();
})();
</script>
{% endraw %}





## 3. Length-Extension Attack: Forging Naive Hash MACs

Naive MAC constructions like **MAC = H(Secret || Message)** built on Merkle–Damgård hash functions (MD5, SHA-1, SHA-256) are vulnerable to **length-extension attacks**.

Because a Merkle–Damgård hash output exposes the internal compression state **H**, an adversary who knows the message and the length of the secret can resume hashing from that state to append malicious payload bytes **Appended_Data** without knowing **Secret**.



### Client-Side Executable Length-Extension Forgery

<div class="interactive-demo-card">
  <div class="demo-header">
    <span class="demo-badge">Interactive Browser Playground</span>
    <h3>MD5 Length-Extension Attack Simulator</h3>
    <p>Interactively forge valid authentication MAC tags against a naive <code>MD5(Secret || Message)</code> construction by restoring internal compression state directly in your browser.</p>
  </div>

  <div class="demo-body">
    <div class="demo-form-group">
      <label for="input-secret-key">Server Secret Key (K) — <em>Hidden from Attacker</em></label>
      <input id="input-secret-key" type="text" class="demo-input" value="s3cr3tkey">
    </div>

    <div class="demo-form-group">
      <label for="input-orig-msg">Original Intercepted Message</label>
      <input id="input-orig-msg" type="text" class="demo-input" value="user=alice&admin=false">
    </div>

    <div class="demo-form-group">
      <label for="input-injected-data">Injected Malicious Payload</label>
      <input id="input-injected-data" type="text" class="demo-input" value="&admin=true">
    </div>

    <div class="demo-form-group">
      <label for="input-guessed-len">Attacker's Guessed Secret Key Length (Bytes)</label>
      <input id="input-guessed-len" type="number" class="demo-input" value="9" min="1" max="64">
    </div>

    <div class="demo-actions" style="margin: 0.5rem 0;">
      <button id="btn-exec-len-ext" class="btn-primary" type="button">&#9889; Execute Length-Extension Attack</button>
    </div>

    <!-- Output Display -->
    <div id="len-ext-output-area" class="demo-output-area"></div>
  </div>
</div>

{% raw %}
<script>
(function() {
  const btnExec = document.getElementById('btn-exec-len-ext');
  const outputArea = document.getElementById('len-ext-output-area');

  const inputSecret = document.getElementById('input-secret-key');
  const inputOrigMsg = document.getElementById('input-orig-msg');
  const inputInjected = document.getElementById('input-injected-data');
  const inputGuessedLen = document.getElementById('input-guessed-len');

  if (!btnExec || !outputArea || !inputSecret || !inputOrigMsg || !inputInjected || !inputGuessedLen) return;

  const S = [7,12,17,22, 7,12,17,22, 7,12,17,22, 7,12,17,22,
             5,9,14,20,  5,9,14,20,  5,9,14,20,  5,9,14,20,
             4,11,16,23, 4,11,16,23, 4,11,16,23, 4,11,16,23,
             6,10,15,21, 6,10,15,21, 6,10,15,21, 6,10,15,21];
  const K = new Uint32Array(64);
  for (let i = 0; i < 64; i++) {
    K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296) >>> 0;
  }

  function leftRotate(x, c) {
    return ((x << c) | (x >>> (32 - c))) >>> 0;
  }

  function md5PaddingBytes(msgLenBytes) {
    const bitLen = msgLenBytes * 8;
    const padLen = (56 - (msgLenBytes + 1) % 64 + 64) % 64;
    const pad = new Uint8Array(1 + padLen + 8);
    pad[0] = 0x80;
    
    const lo = bitLen & 0xffffffff;
    const hi = Math.floor(bitLen / 0x100000000) & 0xffffffff;
    
    pad[1 + padLen + 0] = lo & 0xff;
    pad[1 + padLen + 1] = (lo >>> 8) & 0xff;
    pad[1 + padLen + 2] = (lo >>> 16) & 0xff;
    pad[1 + padLen + 3] = (lo >>> 24) & 0xff;
    
    pad[1 + padLen + 4] = hi & 0xff;
    pad[1 + padLen + 5] = (hi >>> 8) & 0xff;
    pad[1 + padLen + 6] = (hi >>> 16) & 0xff;
    pad[1 + padLen + 7] = (hi >>> 24) & 0xff;
    
    return pad;
  }

  function md5Compress(chunk, h) {
    let [a0, b0, c0, d0] = h;
    const M = new Uint32Array(16);
    for (let i = 0; i < 16; i++) {
      M[i] = (chunk[i*4] | (chunk[i*4+1] << 8) | (chunk[i*4+2] << 16) | (chunk[i*4+3] << 24)) >>> 0;
    }
    let A = a0, B = b0, C = c0, D = d0;
    for (let i = 0; i < 64; i++) {
      let F, g;
      if (i < 16) {
        F = (B & C) | ((~B) & D); g = i;
      } else if (i < 32) {
        F = (D & B) | ((~D) & C); g = (5 * i + 1) % 16;
      } else if (i < 48) {
        F = B ^ C ^ D; g = (3 * i + 5) % 16;
      } else {
        F = C ^ (B | (~D)); g = (7 * i) % 16;
      }
      F = (F + A + K[i] + M[g]) >>> 0;
      const newB = (B + leftRotate(F, S[i])) >>> 0;
      A = D; D = C; C = B; B = newB;
    }
    return [(a0 + A) >>> 0, (b0 + B) >>> 0, (c0 + C) >>> 0, (d0 + D) >>> 0];
  }

  function hexToState(hexStr) {
    const bytes = new Uint8Array(16);
    for (let i = 0; i < 16; i++) {
      bytes[i] = parseInt(hexStr.substr(i * 2, 2), 16);
    }
    const state = [0, 0, 0, 0];
    for (let i = 0; i < 4; i++) {
      state[i] = (bytes[i*4] | (bytes[i*4+1] << 8) | (bytes[i*4+2] << 16) | (bytes[i*4+3] << 24)) >>> 0;
    }
    return state;
  }

  function stateToHex(state) {
    let hex = '';
    for (let i = 0; i < 4; i++) {
      let val = state[i];
      for (let j = 0; j < 4; j++) {
        const byte = (val >>> (j * 8)) & 0xff;
        hex += byte.toString(16).padStart(2, '0');
      }
    }
    return hex;
  }

  function computeFullMD5(uint8Arr) {
    let state = [1732584193, 4026531897, 2562383102, 271733878];
    const pad = md5PaddingBytes(uint8Arr.length);
    const full = new Uint8Array(uint8Arr.length + pad.length);
    full.set(uint8Arr, 0);
    full.set(pad, uint8Arr.length);
    for (let i = 0; i < full.length; i += 64) {
      state = md5Compress(full.subarray(i, i + 64), state);
    }
    return stateToHex(state);
  }

  function stringToUtf8Bytes(str) {
    const bytes = [];
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i);
      if (code < 0x80) {
        bytes.push(code);
      } else if (code < 0x800) {
        bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
      } else if (code < 0xd800 || code >= 0xe000) {
        bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
      } else {
        i++;
        const surrogate = 0x10000 + (((code & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));
        bytes.push(
          0xf0 | (surrogate >> 18),
          0x80 | ((surrogate >> 12) & 0x3f),
          0x80 | ((surrogate >> 6) & 0x3f),
          0x80 | (surrogate & 0x3f)
        );
      }
    }
    return new Uint8Array(bytes);
  }

  function escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function bytesToEscapedString(bytes) {
    let str = '';
    for (let i = 0; i < bytes.length; i++) {
      const b = bytes[i];
      if (b >= 32 && b <= 126 && b !== 92 && b !== 38 && b !== 60 && b !== 62) {
        str += String.fromCharCode(b);
      } else if (b === 38) {
        str += '&amp;';
      } else if (b === 60) {
        str += '&lt;';
      } else if (b === 62) {
        str += '&gt;';
      } else {
        str += '\\x' + b.toString(16).padStart(2, '0');
      }
    }
    return str;
  }

  function runLengthExtensionAttack() {
    try {
      const secretStr = inputSecret.value || '';
      const origMsgStr = inputOrigMsg.value || '';
      const injectedStr = inputInjected.value || '';
      const secretLenGuess = parseInt(inputGuessedLen.value, 10) || 0;

      const secretBytes = stringToUtf8Bytes(secretStr);
      const origMsgBytes = stringToUtf8Bytes(origMsgStr);
      const injectedBytes = stringToUtf8Bytes(injectedStr);

      // 1. Server computes orig_mac = MD5(Secret || OriginalMessage)
      const secretAndOrig = new Uint8Array(secretBytes.length + origMsgBytes.length);
      secretAndOrig.set(secretBytes, 0);
      secretAndOrig.set(origMsgBytes, secretBytes.length);
      const origMac = computeFullMD5(secretAndOrig);

      // 2. Attacker reconstructs MD5 state from origMac
      let state = hexToState(origMac);

      // 3. Attacker computes glue padding for (secretLenGuess + origMsgBytes.length)
      const gluePadding = md5PaddingBytes(secretLenGuess + origMsgBytes.length);

      // 4. Attacker constructs forged message body = origMsg + gluePadding + injectedBytes
      const forgedMsgBody = new Uint8Array(origMsgBytes.length + gluePadding.length + injectedBytes.length);
      forgedMsgBody.set(origMsgBytes, 0);
      forgedMsgBody.set(gluePadding, origMsgBytes.length);
      forgedMsgBody.set(injectedBytes, origMsgBytes.length + gluePadding.length);

      // 5. Attacker computes tail padding for (secretLenGuess + origMsgBytes.length + gluePadding.length + injectedBytes.length)
      const totalBytesSoFar = secretLenGuess + origMsgBytes.length + gluePadding.length;
      const tailPadding = md5PaddingBytes(totalBytesSoFar + injectedBytes.length);

      const tail = new Uint8Array(injectedBytes.length + tailPadding.length);
      tail.set(injectedBytes, 0);
      tail.set(tailPadding, injectedBytes.length);

      for (let i = 0; i < tail.length; i += 64) {
        state = md5Compress(tail.subarray(i, i + 64), state);
      }
      const forgedMac = stateToHex(state);

      // 6. Server Validation Test: Server computes MD5(Secret || forgedMsgBody)
      const serverFullMsg = new Uint8Array(secretBytes.length + forgedMsgBody.length);
      serverFullMsg.set(secretBytes, 0);
      serverFullMsg.set(forgedMsgBody, secretBytes.length);
      const serverMac = computeFullMD5(serverFullMsg);

      const isValid = (serverMac === forgedMac);

      let html = '<div class="ecb-blocks-list">';
      html += `
      <div class="ecb-block-item">
        <div class="block-meta">
          <span class="block-num">Original Intercepted MAC = MD5(Secret || Msg)</span>
        </div>
        <div class="block-hex-val"><code>${origMac}</code></div>
      </div>
      <div class="ecb-block-item">
        <div class="block-meta">
          <span class="block-num">Forged Message Body (Sent to Server)</span>
        </div>
        <div class="block-plain-preview" style="word-break: break-all; white-space: pre-wrap;"><code>${bytesToEscapedString(forgedMsgBody)}</code></div>
      </div>
      <div class="ecb-block-item">
        <div class="block-meta">
          <span class="block-num">Attacker's Forged MAC (Resumed from State)</span>
        </div>
        <div class="block-hex-val"><code>${forgedMac}</code></div>
      </div>
      <div class="ecb-block-item">
        <div class="block-meta">
          <span class="block-num">Server Computed Verification MAC</span>
        </div>
        <div class="block-hex-val"><code>${serverMac}</code></div>
      </div>`;
      html += '</div>';

      if (isValid) {
        html += `
        <div class="security-layer security-layer-direct" style="margin-top: 1.25rem;">
          <div class="security-layer-label">Length-Extension Forgery Successful</div>
          <div>
            <strong>&#128680; FORGERY ACCEPTED BY SERVER!</strong>
            <p style="margin-bottom:0;">The server computed <code>${serverMac}</code> which <strong>exactly matches</strong> the attacker's forged MAC (<code>${forgedMac}</code>). The attacker injected <code>${escapeHtml(injectedStr)}</code> without ever learning the Secret Key (K)!</p>
          </div>
        </div>`;
      } else {
        html += `
        <div class="security-layer security-layer-protect" style="margin-top: 1.25rem;">
          <div class="security-layer-label">Verification Failed</div>
          <div>
            <strong>&#128737; FORGERY REJECTED BY SERVER</strong>
            <p style="margin-bottom:0;">Server MAC (<code>${serverMac}</code>) does not match forged MAC (<code>${forgedMac}</code>). Check secret key length guess (${secretLenGuess} vs actual ${secretBytes.length}).</p>
          </div>
        </div>`;
      }

      outputArea.innerHTML = html;
    } catch (err) {
      outputArea.innerHTML = `<div style="color: #b91c1c; padding: 1rem; border: 1px solid #fca5a5; border-radius: 8px; background: #fef2f2;">Execution Error: ${err.message || err}</div>`;
    }
  }

  btnExec.addEventListener('click', runLengthExtensionAttack);
  runLengthExtensionAttack();
})();
</script>
{% endraw %}




### Defensive Countermeasure: Use Standard HMAC or Sponge Hashes

Deploying **HMAC-SHA256** ([FIPS 198-1](https://csrc.nist.gov/pubs/fips/198-1/final)) neutralizes length-extension attacks by executing a nested double-hash algorithm:

**HMAC(K, M) = H((K ⊕ opad) || H((K ⊕ ipad) || M))**

Furthermore, modern hash constructions avoid this vulnerability by design through two distinct mechanisms. Sponge-based functions (**SHA-3** / [FIPS 202](https://csrc.nist.gov/pubs/fips/202/final) and **KMAC** / [SP 800-185](https://csrc.nist.gov/pubs/sp/800/185/final)) squeeze outputs through an internal capacity state that the attacker cannot observe or extend. **BLAKE3** ([BLAKE3 Specification](https://github.com/BLAKE3-team/BLAKE3-specs)) is not sponge-based — it is a Merkle-tree hash built over a compression function, and it resists length extension by construction because each chunk/node is processed with an explicit finalization flag that only the root node receives, so an attacker cannot extend a digest into a valid continuation of the tree.

## What I Need to Remember

<div class="security-layer security-layer-direct">
  <div class="security-layer-label">Key Takeaways for Future Recall</div>
  <div>
    <strong>Hash Attacks Summary</strong>
    <ul>
      <li><strong>Broken Hashes</strong>: MD5 and SHA-1 have broken collision resistance and are prohibited for digital signatures and other collision-resistance-dependent uses (NIST SP 800-131A Rev. 2). This does not ban SHA-1 outright — HMAC-SHA1 remains acceptable in many protocols because HMAC's security does not rely on collision resistance the same way, and non-security uses (e.g., git's historical object hashing) are unaffected.</li>
      <li><strong>Length-Extension Vulnerability</strong>: Naive MACs like <code>H(key \|\| message)</code> allow attackers to append data and forge valid tags without learning the key.</li>
      <li><strong>Mitigation Standard</strong>: Deploy HMAC-SHA256, KMAC, SHA-3, or BLAKE3 to resist length extension by construction.</li>
    </ul>
  </div>
</div>

## Primary References

- **NIST SP 800-131A Rev. 2**: *Transitioning the Use of Cryptographic Algorithms and Key Lengths* — [NIST CSRC SP 800-131A](https://csrc.nist.gov/pubs/sp/800/131/a/r2/final)
- **SHAttered Attack**: *First Practical SHA-1 Collision Announcement* — [SHAttered Google/CWI Paper](https://shattered.io/)
- **RFC 1321**: *The MD5 Message-Digest Algorithm* — [IETF RFC 1321](https://www.rfc-editor.org/rfc/rfc1321)
- **FIPS 180-4**: *Secure Hash Standard (SHS)* — [NIST CSRC FIPS 180-4](https://csrc.nist.gov/pubs/fips/180-4/upd1/final)
- **FIPS 198-1**: *The Keyed-Hash Message Authentication Code (HMAC)* — [NIST CSRC FIPS 198-1](https://csrc.nist.gov/pubs/fips/198-1/final)
- **FIPS 202**: *SHA-3 Standard: Permutation-Based Hash and Extendable-Output Functions* — [NIST CSRC FIPS 202](https://csrc.nist.gov/pubs/fips/202/final)
- **SP 800-185**: *SHA-3 Derived Functions: cSHAKE, KMAC, TupleHash, and ParallelHash* — [NIST CSRC SP 800-185](https://csrc.nist.gov/pubs/sp/800/185/final)
- **BLAKE3**: *BLAKE3 Cryptographic Hash Function Specification* — [BLAKE3-team/BLAKE3-specs](https://github.com/BLAKE3-team/BLAKE3-specs)
